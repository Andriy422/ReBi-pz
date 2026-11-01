-- backend/init.sql
-- Скрипт виконується лише при ПЕРШОМУ запуску порожньої бази.
-- Щоб перестворити: docker compose down -v && docker compose up --build

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,   -- необов'язковий: вхід лише через Google
    role VARCHAR(20) NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
    rating_as_tenant NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating_as_tenant BETWEEN 1.00 AND 5.00),
    rating_as_landlord NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating_as_landlord BETWEEN 1.00 AND 5.00),
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('bike', 'moped', 'scooter')),
    battery_level INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'available',
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6)
);

-- Моделі транспорту для каталогу та блоку «Популярні моделі»
CREATE TABLE IF NOT EXISTS vehicle_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bike', 'moped', 'scooter')),
    range_km INT,
    max_speed_kmh INT,
    power_w INT,
    price_per_day INT NOT NULL CHECK (price_per_day >= 0),
    is_popular BOOLEAN NOT NULL DEFAULT FALSE
);

-- Тестові дані для розробки
INSERT INTO users (name, email, phone, role, rating_as_tenant, rating_as_landlord, is_blacklisted) VALUES
('Орендар Тест', 'tenant@rebi.com', '+380971112233', 'tenant', 4.90, 5.00, FALSE),
('Орендодавець Тест', 'landlord@rebi.com', '+380974445566', 'landlord', 5.00, 4.85, FALSE),
('Адміністратор', 'admin@rebi.com', '+380970000000', 'admin', 5.00, 5.00, FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO vehicles (type, battery_level, status, lat, lng) VALUES
('bike', 95, 'available', 49.8397, 24.0297),
('moped', 80, 'available', 49.8400, 24.0300);

INSERT INTO vehicle_models (name, type, range_km, max_speed_kmh, power_w, price_per_day, is_popular) VALUES
('Rider X1', 'bike', 70, 25, 250, 250, TRUE),
('Xiaomi 4 Pro', 'scooter', 60, 25, 350, 180, TRUE),
('FADA R8', 'moped', 80, 45, 1500, 300, TRUE),
('Lectric XP 2.0', 'bike', 90, 32, 500, 350, FALSE);
