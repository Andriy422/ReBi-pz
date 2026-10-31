<<<<<<< HEAD
-- backend/init.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

=======
-- Таблиця користувачів з підтримкою ролей та роздільного рейтингу
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
    rating_as_tenant NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating_as_tenant BETWEEN 1.00 AND 5.00),
    rating_as_landlord NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating_as_landlord BETWEEN 1.00 AND 5.00),
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для високої продуктивності при збільшенні кількості користувачів
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Таблиця транспорту (збережена для сумісності з поточним бекендом)
>>>>>>> 4c9860fe61a01afe09a0b358a9ce674f82f03de3
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('bike', 'moped')),
    battery_level INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'available',
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6)
);

-- Тестові дані для розробки
<<<<<<< HEAD
INSERT INTO vehicles (type, battery_level, status, lat, lng) VALUES
('bike', 95, 'available', 49.8397, 24.0297),
('moped', 80, 'available', 49.8400, 24.0300);
=======
INSERT INTO users (name, email, phone, role, rating_as_tenant, rating_as_landlord, is_blacklisted) VALUES
('Орендар Тест', 'tenant@rebi.com', '+380971112233', 'tenant', 4.90, 5.00, FALSE),
('Орендодавець Тест', 'landlord@rebi.com', '+380974445566', 'landlord', 5.00, 4.85, FALSE),
('Адміністратор', 'admin@rebi.com', '+380970000000', 'admin', 5.00, 5.00, FALSE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO vehicles (type, battery_level, status, lat, lng) VALUES
('bike', 95, 'available', 49.8397, 24.0297),
('moped', 80, 'available', 49.8400, 24.0300);
>>>>>>> 4c9860fe61a01afe09a0b358a9ce674f82f03de3
