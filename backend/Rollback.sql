-- ReBi: повний відкат init.sql. УВАГА: видаляє ВСІ дані цих таблиць.
-- НЕ кладіть цей файл у docker-entrypoint-initdb.d.
-- Запуск: psql -v ON_ERROR_STOP=1 -U <user> -d <db> -f rollback.sql

BEGIN;

DROP TABLE IF EXISTS
  blacklist_logs,
  reviews,
  payment_events,
  payments,
  deposits,
  booking_accessories,
  booking_status_history,
  bookings,
  vehicle_telemetry_history,
  vehicle_telemetry,
  vehicle_moderation_log,
  vehicle_documents,
  vehicle_photos,
  vehicle_tariffs,
  vehicle_options,
  vehicles,
  accessories,
  rental_stations
CASCADE;

-- Якщо users створено цим скриптом, розкоментуйте:
-- DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS apply_blacklist_action();
DROP FUNCTION IF EXISTS refresh_user_rating();
DROP FUNCTION IF EXISTS check_review_integrity();
DROP FUNCTION IF EXISTS log_booking_status();
DROP FUNCTION IF EXISTS guard_booking_transition();
DROP FUNCTION IF EXISTS validate_new_booking();
DROP FUNCTION IF EXISTS log_vehicle_moderation();
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;  -- прибере і тригер на users, якщо users лишається

DROP TYPE IF EXISTS blacklist_action;
DROP TYPE IF EXISTS review_target_role;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS payment_purpose;
DROP TYPE IF EXISTS deposit_status;
DROP TYPE IF EXISTS deposit_method;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS rental_type;
DROP TYPE IF EXISTS accessory_price_type;
DROP TYPE IF EXISTS vehicle_doc_type;
DROP TYPE IF EXISTS battery_type;
DROP TYPE IF EXISTS moderation_status;
DROP TYPE IF EXISTS vehicle_status;
DROP TYPE IF EXISTS vehicle_type;
-- DROP TYPE IF EXISTS user_role;   -- разом із таблицею users

COMMIT;