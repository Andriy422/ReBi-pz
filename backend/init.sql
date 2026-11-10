-- ReBi: міграція 003 (виконується після 002_vehicles_moderation.sql)
-- Припущення: users(id BIGINT) та vehicles(id BIGINT) вже створені (vehicles див. у 002).
-- Якщо у вас UUID, замініть BIGINT на UUID у зовнішніх ключах.

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------
-- ENUM-типи
-- ---------------------------------------------------------------
CREATE TYPE rental_type     AS ENUM ('hourly', 'daily', 'long_term');
CREATE TYPE booking_status  AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE accessory_price_type AS ENUM ('per_booking', 'per_day');
CREATE TYPE deposit_status  AS ENUM ('pending', 'held', 'released', 'captured', 'failed', 'expired');
CREATE TYPE payment_status  AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_purpose AS ENUM ('rental', 'extension', 'damage_charge');
CREATE TYPE review_target_role AS ENUM ('tenant', 'landlord');
CREATE TYPE blacklist_action AS ENUM ('blocked', 'unblocked');

-- Автооновлення updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------
-- Задача 1: Локації, аксесуари
-- ---------------------------------------------------------------
CREATE TABLE rental_stations (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id      BIGINT REFERENCES users(id) ON DELETE SET NULL, -- NULL = станція платформи
  name          VARCHAR(150) NOT NULL,
  address       VARCHAR(255) NOT NULL,
  city          VARCHAR(100) NOT NULL DEFAULT 'Lviv',
  latitude      NUMERIC(9,6) NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude     NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  working_hours JSONB,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rental_stations_active ON rental_stations (city) WHERE is_active;
CREATE TRIGGER trg_rental_stations_updated BEFORE UPDATE ON rental_stations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE accessories (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code        VARCHAR(50) NOT NULL UNIQUE,           -- helmet, phone_holder, child_seat, insurance
  name_ua     VARCHAR(150) NOT NULL,
  name_en     VARCHAR(150) NOT NULL,
  base_price  NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  price_type  accessory_price_type NOT NULL DEFAULT 'per_booking',
  currency    CHAR(3) NOT NULL DEFAULT 'UAH',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_accessories_updated BEFORE UPDATE ON accessories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Ціни нижче умовні, змініть на свої (або керуйте через адмінку)
INSERT INTO accessories (code, name_ua, name_en, base_price, price_type) VALUES
  ('helmet',       'Додатковий шолом',     'Extra helmet',       50.00,  'per_booking'),
  ('phone_holder', 'Тримач для телефону',  'Phone holder',       30.00,  'per_booking'),
  ('child_seat',   'Дитяче крісло',        'Child seat',         100.00, 'per_booking'),
  ('insurance',    'Страховка',            'Insurance',          80.00,  'per_day');

-- ---------------------------------------------------------------
-- Задача 2: Бронювання, застава, платежі
-- ---------------------------------------------------------------
CREATE TABLE bookings (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id          BIGINT NOT NULL REFERENCES users(id),
  landlord_id        BIGINT NOT NULL REFERENCES users(id),   -- знімок власника на момент бронювання
  vehicle_id         BIGINT NOT NULL REFERENCES vehicles(id),
  pickup_station_id  BIGINT NOT NULL REFERENCES rental_stations(id),
  return_station_id  BIGINT NOT NULL REFERENCES rental_stations(id),
  rental_type        rental_type NOT NULL,
  status             booking_status NOT NULL DEFAULT 'pending',
  start_at           TIMESTAMPTZ NOT NULL,
  end_at             TIMESTAMPTZ NOT NULL,
  returned_at        TIMESTAMPTZ,                             -- фактичне повернення
  rental_amount      NUMERIC(10,2) NOT NULL CHECK (rental_amount >= 0),
  accessories_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (accessories_amount >= 0),
  deposit_amount     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  total_amount       NUMERIC(10,2) GENERATED ALWAYS AS (rental_amount + accessories_amount) STORED,
  currency           CHAR(3) NOT NULL DEFAULT 'UAH',
  cancelled_by       BIGINT REFERENCES users(id),
  cancel_reason      TEXT,
  cancelled_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_booking_period CHECK (end_at > start_at),
  CONSTRAINT chk_booking_cancel CHECK (
    status <> 'cancelled' OR (cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
  ),
  -- Забороняє перетин періодів для одного транспорту (подвійне бронювання)
  CONSTRAINT excl_vehicle_overlap EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('pending', 'active'))
);
CREATE INDEX idx_bookings_tenant   ON bookings (tenant_id, created_at DESC);
CREATE INDEX idx_bookings_landlord ON bookings (landlord_id, created_at DESC);
CREATE INDEX idx_bookings_vehicle  ON bookings (vehicle_id, start_at);
CREATE INDEX idx_bookings_status   ON bookings (status);
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE booking_accessories (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id   BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  accessory_id BIGINT NOT NULL REFERENCES accessories(id),
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),  -- знімок ціни на момент броні
  total_price  NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  UNIQUE (booking_id, accessory_id)
);

CREATE TABLE deposits (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id             BIGINT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  amount                 NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  captured_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,      -- утримано за пошкодження
  currency               CHAR(3) NOT NULL DEFAULT 'UAH',
  status                 deposit_status NOT NULL DEFAULT 'pending',
  gateway                VARCHAR(30),
  gateway_order_id       VARCHAR(100) UNIQUE,
  gateway_transaction_id VARCHAR(100),
  held_at                TIMESTAMPTZ,
  hold_expires_at        TIMESTAMPTZ,                           -- холд на картці має строк дії
  released_at            TIMESTAMPTZ,
  capture_reason         TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_deposit_capture CHECK (captured_amount >= 0 AND captured_amount <= amount)
);
CREATE INDEX idx_deposits_expiry ON deposits (hold_expires_at) WHERE status = 'held';
CREATE TRIGGER trg_deposits_updated BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payments (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id         BIGINT NOT NULL REFERENCES bookings(id),
  purpose            payment_purpose NOT NULL DEFAULT 'rental',
  amount             NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  refunded_amount    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  currency           CHAR(3) NOT NULL DEFAULT 'UAH',
  status             payment_status NOT NULL DEFAULT 'pending',
  gateway            VARCHAR(30) NOT NULL,                      -- liqpay / wayforpay
  gateway_order_id   VARCHAR(100) NOT NULL UNIQUE,              -- захист від дублів вебхуків
  gateway_payment_id VARCHAR(100),
  raw_webhook        JSONB,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_refund CHECK (refunded_amount <= amount)
);
CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- Задача 3: Відгуки та чорний список
-- ---------------------------------------------------------------
CREATE TABLE reviews (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id  BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_id   BIGINT NOT NULL REFERENCES users(id),
  target_id   BIGINT NOT NULL REFERENCES users(id),
  target_role review_target_role NOT NULL,                      -- кого оцінюють: орендаря чи орендодавця
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_review_self CHECK (author_id <> target_id),
  UNIQUE (booking_id, author_id)                                -- один відгук від кожної сторони
);
CREATE INDEX idx_reviews_target ON reviews (target_id, target_role);

CREATE TABLE blacklist_logs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  admin_id   BIGINT NOT NULL REFERENCES users(id),
  action     blacklist_action NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blacklist_logs_user ON blacklist_logs (user_id, created_at DESC);

COMMIT;