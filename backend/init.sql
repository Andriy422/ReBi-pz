-- =====================================================================
-- ReBi (RentBike): повна схема БД, PostgreSQL 14+
-- Порядок: розширення/типи -> users -> станції -> аксесуари -> транспорт
--          -> бронювання -> застава/платежі -> відгуки -> чорний список
--
-- Запуск у Docker: покладіть файл у /docker-entrypoint-initdb.d/
-- (виконується лише на порожньому томі: docker compose down -v).
-- Якщо користуєтесь інструментом міграцій (node-pg-migrate, Flyway...),
-- приберіть BEGIN/COMMIT, бо інструмент відкриває транзакцію сам.
--
-- Якщо таблиця users у вас уже є, видаліть блок "1. users" і тип user_role,
-- але перевірте, що в ній є колонки, які використовують тригери нижче:
-- role, rating_as_tenant, rating_as_landlord, reviews_count_as_tenant,
-- reviews_count_as_landlord, is_blacklisted.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;  -- заборона перетину броней
CREATE EXTENSION IF NOT EXISTS citext;      -- email без урахування регістру

-- ---------------------------------------------------------------
-- 0. ENUM-типи та службові функції
-- ---------------------------------------------------------------
CREATE TYPE user_role            AS ENUM ('tenant', 'landlord', 'admin');
CREATE TYPE vehicle_type         AS ENUM ('ebike', 'emoped');
CREATE TYPE vehicle_status       AS ENUM ('free', 'rented', 'booked', 'maintenance', 'retired');
CREATE TYPE moderation_status    AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE battery_type         AS ENUM ('removable', 'non_removable');
CREATE TYPE vehicle_doc_type     AS ENUM ('registration', 'purchase_receipt', 'other');
CREATE TYPE accessory_price_type AS ENUM ('per_booking', 'per_day');
CREATE TYPE rental_type          AS ENUM ('hourly', 'daily', 'long_term');
CREATE TYPE booking_status       AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE deposit_method       AS ENUM ('card_hold', 'card_charge');
CREATE TYPE deposit_status       AS ENUM ('pending', 'processing', 'held', 'released', 'captured', 'failed', 'expired');
CREATE TYPE payment_purpose      AS ENUM ('rental', 'extension', 'damage_charge');
CREATE TYPE payment_status       AS ENUM ('pending', 'processing', 'requires_action', 'paid',
                                          'failed', 'cancelled', 'refunded', 'partially_refunded', 'chargeback');
CREATE TYPE review_target_role   AS ENUM ('tenant', 'landlord');
CREATE TYPE blacklist_action     AS ENUM ('blocked', 'unblocked');

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------
CREATE TABLE users (
  id                        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email                     CITEXT NOT NULL UNIQUE,
  phone                     VARCHAR(20) UNIQUE,
  full_name                 VARCHAR(150),
  role                      user_role NOT NULL DEFAULT 'tenant',
  google_sub                VARCHAR(100) UNIQUE,
  apple_sub                 VARCHAR(100) UNIQUE,
  preferred_lang            CHAR(2) NOT NULL DEFAULT 'uk' CHECK (preferred_lang IN ('uk', 'en')),
  -- кеш рейтингу; джерело істини: reviews (оновлюється тригером)
  rating_as_tenant          NUMERIC(3,2) CHECK (rating_as_tenant   BETWEEN 1 AND 5),
  rating_as_landlord        NUMERIC(3,2) CHECK (rating_as_landlord BETWEEN 1 AND 5),
  reviews_count_as_tenant   INTEGER NOT NULL DEFAULT 0,
  reviews_count_as_landlord INTEGER NOT NULL DEFAULT 0,
  -- прапорець чорного списку; оновлюється тригером із blacklist_logs
  is_blacklisted            BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at                TIMESTAMPTZ,   -- м'яке видалення / анонімізація
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- 2. rental_stations
-- ---------------------------------------------------------------
CREATE TABLE rental_stations (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- NULL = станція платформи
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
CREATE INDEX idx_rental_stations_owner  ON rental_stations (owner_id);
CREATE TRIGGER trg_rental_stations_updated BEFORE UPDATE ON rental_stations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- 3. accessories (довідник)
-- ---------------------------------------------------------------
CREATE TABLE accessories (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       VARCHAR(50)  NOT NULL UNIQUE,          -- helmet, phone_holder, child_seat, insurance
  name_ua    VARCHAR(150) NOT NULL,
  name_en    VARCHAR(150) NOT NULL,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  price_type accessory_price_type NOT NULL DEFAULT 'per_booking',
  currency   CHAR(3) NOT NULL DEFAULT 'UAH',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_accessories_updated BEFORE UPDATE ON accessories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Ціни умовні, змініть на свої (або керуйте через адмінку)
INSERT INTO accessories (code, name_ua, name_en, base_price, price_type) VALUES
  ('helmet',       'Додатковий шолом',    'Extra helmet',  50.00,  'per_booking'),
  ('phone_holder', 'Тримач для телефону', 'Phone holder',  30.00,  'per_booking'),
  ('child_seat',   'Дитяче крісло',       'Child seat',    100.00, 'per_booking'),
  ('insurance',    'Страховка',           'Insurance',     80.00,  'per_day')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------
-- 4. Транспорт, ТТХ, тарифи, фото, документи, модерація, телеметрія
-- ---------------------------------------------------------------
CREATE TABLE vehicles (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- 1 орендодавець : N транспорту
  type               vehicle_type NOT NULL,
  brand              VARCHAR(100) NOT NULL,
  model              VARCHAR(100) NOT NULL,
  year               SMALLINT CHECK (year BETWEEN 2000 AND 2100),
  title_ua           VARCHAR(200),
  title_en           VARCHAR(200),
  description_ua     TEXT,
  description_en     TEXT,
  current_station_id BIGINT REFERENCES rental_stations(id) ON DELETE SET NULL,

  -- вимоги до водія (пороги задає застосунок/адмін, у схемі не хардкодяться)
  min_driver_age     SMALLINT NOT NULL CHECK (min_driver_age BETWEEN 12 AND 21),
  requires_license   BOOLEAN NOT NULL DEFAULT FALSE,

  -- операційний статус (ТО, списаний; rented/booked синхронізує застосунок)
  status             vehicle_status NOT NULL DEFAULT 'free',

  -- модерація
  moderation_status  moderation_status NOT NULL DEFAULT 'pending',
  moderation_comment TEXT,
  moderated_by       BIGINT REFERENCES users(id),
  moderated_at       TIMESTAMPTZ,

  -- примусове блокування адміном
  is_blocked         BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason     TEXT,
  blocked_by         BIGINT REFERENCES users(id),
  blocked_at         TIMESTAMPTZ,

  gps_device_id      VARCHAR(100) UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- потрібен для складеного зовнішнього ключа з bookings (vehicle_id, landlord_id)
  CONSTRAINT uq_vehicle_owner UNIQUE (id, owner_id),
  CONSTRAINT chk_moderation_approved CHECK (
    moderation_status <> 'approved' OR (moderated_by IS NOT NULL AND moderated_at IS NOT NULL)
  ),
  CONSTRAINT chk_moderation_rejected CHECK (
    moderation_status <> 'rejected' OR (moderation_comment IS NOT NULL AND moderated_by IS NOT NULL)
  ),
  CONSTRAINT chk_blocked_reason CHECK (
    NOT is_blocked OR (blocked_reason IS NOT NULL AND blocked_at IS NOT NULL)
  )
);
CREATE INDEX idx_vehicles_owner   ON vehicles (owner_id);
CREATE INDEX idx_vehicles_station ON vehicles (current_station_id);
-- Основний індекс каталогу: схвалений, не заблокований, не списаний
CREATE INDEX idx_vehicles_catalog ON vehicles (type)
  WHERE moderation_status = 'approved' AND NOT is_blocked AND status <> 'retired';
CREATE INDEX idx_vehicles_moderation_queue ON vehicles (created_at)
  WHERE moderation_status = 'pending';
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ТТХ та опції (1:1)
CREATE TABLE vehicle_options (
  vehicle_id          BIGINT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  range_km            SMALLINT NOT NULL CHECK (range_km > 0),
  max_speed_kmh       SMALLINT NOT NULL CHECK (max_speed_kmh > 0),
  max_payload_kg      SMALLINT NOT NULL CHECK (max_payload_kg > 0),
  vehicle_weight_kg   NUMERIC(5,1) CHECK (vehicle_weight_kg > 0),
  power_watts         INTEGER NOT NULL CHECK (power_watts > 0),
  battery_capacity_ah NUMERIC(6,2) CHECK (battery_capacity_ah > 0),
  battery_capacity_wh NUMERIC(7,1) CHECK (battery_capacity_wh > 0),
  battery_type        battery_type NOT NULL,
  has_luggage_rack    BOOLEAN NOT NULL DEFAULT FALSE,
  has_child_seat      BOOLEAN NOT NULL DEFAULT FALSE,
  has_second_battery  BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_vopt_range   ON vehicle_options (range_km);
CREATE INDEX idx_vopt_speed   ON vehicle_options (max_speed_kmh);
CREATE INDEX idx_vopt_payload ON vehicle_options (max_payload_kg);
CREATE INDEX idx_vopt_battery ON vehicle_options (battery_type);

-- Тарифи орендодавця (1:1)
CREATE TABLE vehicle_tariffs (
  vehicle_id     BIGINT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  price_hour     NUMERIC(10,2) CHECK (price_hour  > 0),
  price_day      NUMERIC(10,2) CHECK (price_day   > 0),
  price_week     NUMERIC(10,2) CHECK (price_week  > 0),
  price_month    NUMERIC(10,2) CHECK (price_month > 0),
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  currency       CHAR(3) NOT NULL DEFAULT 'UAH',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_has_any_price CHECK (
    price_hour IS NOT NULL OR price_day IS NOT NULL OR price_week IS NOT NULL OR price_month IS NOT NULL
  )
);
CREATE INDEX idx_tariffs_day  ON vehicle_tariffs (price_day);
CREATE INDEX idx_tariffs_week ON vehicle_tariffs (price_week);
CREATE TRIGGER trg_vehicle_tariffs_updated BEFORE UPDATE ON vehicle_tariffs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Галерея (публічні URL, WebP)
CREATE TABLE vehicle_photos (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_cover   BOOLEAN NOT NULL DEFAULT FALSE,
  is_360     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_photos_vehicle ON vehicle_photos (vehicle_id, sort_order);
CREATE UNIQUE INDEX uq_vehicle_cover ON vehicle_photos (vehicle_id) WHERE is_cover;

-- Приватні документи (техпаспорт, чек): ключ у сховищі, а не публічний URL
CREATE TABLE vehicle_documents (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id    BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  doc_type      vehicle_doc_type NOT NULL,
  storage_key   TEXT NOT NULL,
  original_name VARCHAR(255),
  mime_type     VARCHAR(100),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_vehicle_docs_vehicle ON vehicle_documents (vehicle_id);

-- Історія модерації (пишеться тригером; не видаляється разом із транспортом)
CREATE TABLE vehicle_moderation_log (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  admin_id   BIGINT NOT NULL REFERENCES users(id),
  decision   moderation_status NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_log_reason CHECK (decision <> 'rejected' OR reason IS NOT NULL)
);
CREATE INDEX idx_moderation_log_vehicle ON vehicle_moderation_log (vehicle_id, created_at DESC);

CREATE OR REPLACE FUNCTION log_vehicle_moderation() RETURNS trigger AS $$
BEGIN
  IF NEW.moderation_status IN ('approved', 'rejected')
     AND NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
    INSERT INTO vehicle_moderation_log (vehicle_id, admin_id, decision, reason)
    VALUES (NEW.id, NEW.moderated_by, NEW.moderation_status, NEW.moderation_comment);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_vehicles_moderation_log AFTER UPDATE OF moderation_status ON vehicles
  FOR EACH ROW EXECUTE FUNCTION log_vehicle_moderation();

-- Телеметрія: поточний стан (UPSERT), окремо від vehicles
CREATE TABLE vehicle_telemetry (
  vehicle_id        BIGINT PRIMARY KEY REFERENCES vehicles(id) ON DELETE CASCADE,
  battery_level_pct SMALLINT CHECK (battery_level_pct BETWEEN 0 AND 100),
  latitude          NUMERIC(9,6) CHECK (latitude  BETWEEN -90  AND 90),
  longitude         NUMERIC(9,6) CHECK (longitude BETWEEN -180 AND 180),
  recorded_at       TIMESTAMPTZ NOT NULL
);

-- Історія телеметрії (append-only). За великого обсягу варто партиціонувати
-- за recorded_at і налаштувати строк зберігання.
CREATE TABLE vehicle_telemetry_history (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vehicle_id        BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  battery_level_pct SMALLINT CHECK (battery_level_pct BETWEEN 0 AND 100),
  latitude          NUMERIC(9,6),
  longitude         NUMERIC(9,6),
  recorded_at       TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_telemetry_history_vehicle ON vehicle_telemetry_history (vehicle_id, recorded_at DESC);

-- ---------------------------------------------------------------
-- 5. Бронювання
-- ---------------------------------------------------------------
CREATE TABLE bookings (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id          BIGINT NOT NULL REFERENCES users(id),
  landlord_id        BIGINT NOT NULL,
  vehicle_id         BIGINT NOT NULL,
  pickup_station_id  BIGINT NOT NULL REFERENCES rental_stations(id),
  return_station_id  BIGINT NOT NULL REFERENCES rental_stations(id),
  rental_type        rental_type NOT NULL,
  status             booking_status NOT NULL DEFAULT 'pending',
  start_at           TIMESTAMPTZ NOT NULL,
  end_at             TIMESTAMPTZ NOT NULL,
  returned_at        TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ,   -- дедлайн підтвердження/оплати для pending
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

  -- landlord_id завжди збігається з власником транспорту
  CONSTRAINT fk_booking_vehicle_owner FOREIGN KEY (vehicle_id, landlord_id)
    REFERENCES vehicles (id, owner_id),
  CONSTRAINT chk_booking_period   CHECK (end_at > start_at),
  CONSTRAINT chk_booking_parties  CHECK (tenant_id <> landlord_id),
  CONSTRAINT chk_booking_pending  CHECK (status <> 'pending' OR expires_at IS NOT NULL),
  CONSTRAINT chk_booking_complete CHECK (status <> 'completed' OR returned_at IS NOT NULL),
  CONSTRAINT chk_booking_cancel   CHECK (
    status <> 'cancelled' OR (cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
  ),
  -- заборона перетину періодів для одного транспорту
  CONSTRAINT excl_vehicle_overlap EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('pending', 'active'))
);
CREATE INDEX idx_bookings_tenant    ON bookings (tenant_id, created_at DESC);
CREATE INDEX idx_bookings_landlord  ON bookings (landlord_id, created_at DESC);
CREATE INDEX idx_bookings_vehicle   ON bookings (vehicle_id, start_at);
CREATE INDEX idx_bookings_status    ON bookings (status);
CREATE INDEX idx_bookings_pickup    ON bookings (pickup_station_id);
CREATE INDEX idx_bookings_return    ON bookings (return_station_id);
CREATE INDEX idx_bookings_cancelled ON bookings (cancelled_by);
-- для фонового завдання, що скасовує прострочені pending-броні
CREATE INDEX idx_bookings_pending_expiry ON bookings (expires_at) WHERE status = 'pending';

CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Перевірка при створенні: орендар не в чорному списку, транспорт доступний
CREATE OR REPLACE FUNCTION validate_new_booking() RETURNS trigger AS $$
DECLARE
  v_blacklisted BOOLEAN;
  v vehicles%ROWTYPE;
BEGIN
  SELECT is_blacklisted INTO v_blacklisted FROM users WHERE id = NEW.tenant_id;
  IF v_blacklisted IS TRUE THEN
    RAISE EXCEPTION 'User % is blacklisted', NEW.tenant_id USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO v FROM vehicles WHERE id = NEW.vehicle_id;
  IF NOT FOUND
     OR v.moderation_status <> 'approved'
     OR v.is_blocked
     OR v.status IN ('maintenance', 'retired') THEN
    RAISE EXCEPTION 'Vehicle % is not available for booking', NEW.vehicle_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_bookings_validate BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_new_booking();

-- Допустимі переходи статусів: pending -> active|cancelled, active -> completed|cancelled
CREATE OR REPLACE FUNCTION guard_booking_transition() RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'pending' AND NEW.status IN ('active', 'cancelled'))
    OR (OLD.status = 'active'  AND NEW.status IN ('completed', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'Invalid booking status transition: % -> %', OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_bookings_transition BEFORE UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION guard_booking_transition();

-- Журнал змін статусу. Хто змінив: застосунок виставляє в транзакції
--   SELECT set_config('app.current_user_id', '<id>', true);
CREATE TABLE booking_status_history (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id  BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status booking_status,
  to_status   booking_status NOT NULL,
  changed_by  BIGINT REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_history_booking ON booking_status_history (booking_id, created_at);

CREATE OR REPLACE FUNCTION log_booking_status() RETURNS trigger AS $$
DECLARE
  v_actor BIGINT := NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, v_actor);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO booking_status_history (booking_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, v_actor);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_bookings_status_log AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status();

CREATE TABLE booking_accessories (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id   BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  accessory_id BIGINT NOT NULL REFERENCES accessories(id),
  quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),  -- знімок ціни на момент броні
  total_price  NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  UNIQUE (booking_id, accessory_id)
);
CREATE INDEX idx_booking_accessories_accessory ON booking_accessories (accessory_id);

-- ---------------------------------------------------------------
-- 6. Застава та платежі (фінансові записи: ніколи не CASCADE)
-- ---------------------------------------------------------------
-- Кілька записів застави на одну бронь: перевипуск холду для довгострокової
-- оренди (card_hold має обмежений строк дії) або списання з наступним
-- поверненням (card_charge). Одночасно активна лише одна.
CREATE TABLE deposits (
  id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id             BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  attempt                SMALLINT NOT NULL DEFAULT 1 CHECK (attempt > 0),
  renewed_from_id        BIGINT REFERENCES deposits(id),
  method                 deposit_method NOT NULL DEFAULT 'card_hold',
  amount                 NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  captured_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,   -- утримано за пошкодження
  currency               CHAR(3) NOT NULL DEFAULT 'UAH',
  status                 deposit_status NOT NULL DEFAULT 'pending',
  gateway                VARCHAR(30),
  gateway_order_id       VARCHAR(100) UNIQUE,
  gateway_transaction_id VARCHAR(100),
  gateway_status         VARCHAR(50),                        -- сирий статус шлюзу
  held_at                TIMESTAMPTZ,
  hold_expires_at        TIMESTAMPTZ,
  released_at            TIMESTAMPTZ,
  captured_at            TIMESTAMPTZ,
  capture_reason         TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (booking_id, attempt),
  CONSTRAINT chk_deposit_capture CHECK (captured_amount >= 0 AND captured_amount <= amount),
  CONSTRAINT chk_deposit_captured_status CHECK (status <> 'captured' OR captured_amount > 0)
);
CREATE UNIQUE INDEX uq_deposits_one_active ON deposits (booking_id)
  WHERE status IN ('pending', 'processing', 'held');
CREATE INDEX idx_deposits_expiry ON deposits (hold_expires_at) WHERE status = 'held';
CREATE INDEX idx_deposits_renewed ON deposits (renewed_from_id);
CREATE TRIGGER trg_deposits_updated BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payments (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id         BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  purpose            payment_purpose NOT NULL DEFAULT 'rental',
  amount             NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  refunded_amount    NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  currency           CHAR(3) NOT NULL DEFAULT 'UAH',
  status             payment_status NOT NULL DEFAULT 'pending',
  gateway            VARCHAR(30) NOT NULL,                   -- liqpay / wayforpay
  gateway_order_id   VARCHAR(100) NOT NULL UNIQUE,           -- захист від дублів
  gateway_payment_id VARCHAR(100),
  gateway_status     VARCHAR(50),                            -- сирий статус шлюзу
  failure_reason     TEXT,
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_refund   CHECK (refunded_amount <= amount),
  CONSTRAINT chk_paid_at  CHECK (status NOT IN ('paid', 'refunded', 'partially_refunded') OR paid_at IS NOT NULL)
);
CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_payments_status  ON payments (status) WHERE status IN ('pending', 'processing', 'requires_action');
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Журнал усіх вебхуків шлюзу (аудит і розбір спірних випадків)
CREATE TABLE payment_events (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id       BIGINT REFERENCES payments(id) ON DELETE RESTRICT,
  gateway          VARCHAR(30) NOT NULL,
  gateway_order_id VARCHAR(100),
  event_status     VARCHAR(50),
  payload          JSONB NOT NULL,
  signature_valid  BOOLEAN,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payment_events_payment ON payment_events (payment_id);
CREATE INDEX idx_payment_events_order   ON payment_events (gateway, gateway_order_id);

-- ---------------------------------------------------------------
-- 7. Відгуки (двосторонній рейтинг)
-- ---------------------------------------------------------------
CREATE TABLE reviews (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id  BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
  author_id   BIGINT NOT NULL REFERENCES users(id),
  target_id   BIGINT NOT NULL REFERENCES users(id),
  target_role review_target_role NOT NULL,    -- кого оцінюють: орендаря чи орендодавця
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_review_self CHECK (author_id <> target_id),
  UNIQUE (booking_id, author_id)               -- один відгук від кожної сторони
);
CREATE INDEX idx_reviews_target ON reviews (target_id, target_role);
CREATE INDEX idx_reviews_author ON reviews (author_id);

-- Відгук лише по завершеній броні та лише між її учасниками
CREATE OR REPLACE FUNCTION check_review_integrity() RETURNS trigger AS $$
DECLARE
  b bookings%ROWTYPE;
BEGIN
  SELECT * INTO b FROM bookings WHERE id = NEW.booking_id;
  IF NOT FOUND OR b.status <> 'completed' THEN
    RAISE EXCEPTION 'Review is allowed only for completed bookings (booking %)', NEW.booking_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF (NEW.author_id = b.tenant_id   AND NEW.target_id = b.landlord_id AND NEW.target_role = 'landlord')
  OR (NEW.author_id = b.landlord_id AND NEW.target_id = b.tenant_id   AND NEW.target_role = 'tenant') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Review author/target must be the tenant and landlord of booking %', NEW.booking_id
    USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_reviews_integrity BEFORE INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION check_review_integrity();

-- Перерахунок кешу рейтингу в users
CREATE OR REPLACE FUNCTION refresh_user_rating() RETURNS trigger AS $$
DECLARE
  v_user BIGINT;
  v_role review_target_role;
  v_avg  NUMERIC(3,2);
  v_cnt  INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user := OLD.target_id;
    v_role := OLD.target_role;
  ELSE
    v_user := NEW.target_id;
    v_role := NEW.target_role;
  END IF;

  SELECT round(avg(rating)::NUMERIC, 2), count(*)
    INTO v_avg, v_cnt
    FROM reviews
   WHERE target_id = v_user AND target_role = v_role;

  IF v_role = 'tenant' THEN
    UPDATE users SET rating_as_tenant = v_avg, reviews_count_as_tenant = v_cnt WHERE id = v_user;
  ELSE
    UPDATE users SET rating_as_landlord = v_avg, reviews_count_as_landlord = v_cnt WHERE id = v_user;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_reviews_rating AFTER INSERT OR UPDATE OF rating OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_user_rating();

-- ---------------------------------------------------------------
-- 8. Чорний список
-- ---------------------------------------------------------------
CREATE TABLE blacklist_logs (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id),
  admin_id   BIGINT NOT NULL REFERENCES users(id),
  action     blacklist_action NOT NULL,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blacklist_logs_user  ON blacklist_logs (user_id, created_at DESC);
CREATE INDEX idx_blacklist_logs_admin ON blacklist_logs (admin_id);

-- Запис у журналі автоматично оновлює users.is_blacklisted; дію виконує лише admin
CREATE OR REPLACE FUNCTION apply_blacklist_action() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'User % is not an admin', NEW.admin_id USING ERRCODE = 'check_violation';
  END IF;
  UPDATE users SET is_blacklisted = (NEW.action = 'blocked') WHERE id = NEW.user_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_blacklist_apply AFTER INSERT ON blacklist_logs
  FOR EACH ROW EXECUTE FUNCTION apply_blacklist_action();

-- ---------------------------------------------------------------
-- 9. Опційно: окремий користувач застосунку без права DELETE
--    (захищає фінансові записи). Розкоментуйте та змініть пароль.
-- ---------------------------------------------------------------
-- CREATE ROLE rebi_app LOGIN PASSWORD 'CHANGE_ME';
-- GRANT USAGE ON SCHEMA public TO rebi_app;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO rebi_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rebi_app;

COMMIT;