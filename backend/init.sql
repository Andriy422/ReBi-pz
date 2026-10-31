-- backend/init.sql
-- Скрипт виконується лише при ПЕРШОМУ запуску порожньої бази.

-- Таблиця користувачів з ролями та роздільним рейтингом
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

-- email і phone вже мають індекси через UNIQUE; додатковий індекс лише для ролі
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Таблиця транспорту
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('bike', 'moped')),
    battery_level INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'available',
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6)
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
