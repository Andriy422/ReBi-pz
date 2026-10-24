-- backend/init.sql

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('bike', 'moped')),
    battery_level INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'available',
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6)
);

-- Тестові дані для розробки
INSERT INTO vehicles (type, battery_level, status, lat, lng) VALUES
('bike', 95, 'available', 49.8397, 24.0297),
('moped', 80, 'available', 49.8400, 24.0300);
