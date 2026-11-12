-- =====================================================================
-- ReBi: тест логіки схеми (обмеження, тригери, цілісність)
-- Усе виконується в одній транзакції і наприкінці відкочується (ROLLBACK),
-- тому дані в базі не залишаються. НЕ кладіть файл у docker-entrypoint-initdb.d.
--
-- Запуск (з папки rebi-app):
--   docker compose exec -T postgres psql -v ON_ERROR_STOP=1 \
--     -U rebi_user -d rebi_db < backend/test_schema.sql
--
-- Кожна перевірка друкує "PASS: ...". Перша ж помилка зупиняє скрипт з
-- повідомленням "FAIL: ..." і транзакція відкочується.
-- =====================================================================

\set ON_ERROR_STOP on
\o /dev/null

BEGIN;

-- ---------------------------------------------------------------
-- 0. Допоміжні функції (тимчасові, зникають після сесії)
-- ---------------------------------------------------------------
CREATE TEMP TABLE ids (k TEXT PRIMARY KEY, v BIGINT) ON COMMIT DROP;

CREATE FUNCTION pg_temp.k(p TEXT) RETURNS BIGINT LANGUAGE sql STABLE AS
$$ SELECT v FROM ids WHERE k = p $$;

CREATE FUNCTION pg_temp.uid(p TEXT) RETURNS BIGINT LANGUAGE sql STABLE AS
$$ SELECT id FROM users WHERE email = p || '@test.local' $$;

CREATE FUNCTION pg_temp.vid() RETURNS BIGINT LANGUAGE sql STABLE AS
$$ SELECT id FROM vehicles WHERE model = 'E1-TEST' $$;

CREATE FUNCTION pg_temp.sid() RETURNS BIGINT LANGUAGE sql STABLE AS
$$ SELECT id FROM rental_stations WHERE name = 'Test station' $$;

-- Очікуємо, що оператор впаде з помилкою цілісності
CREATE FUNCTION pg_temp.expect_fail(p_label TEXT, p_stmt TEXT) RETURNS VOID AS $$
BEGIN
  EXECUTE p_stmt;
  RAISE EXCEPTION 'FAIL: % (оператор виконався, а мав відхилитись)', p_label;
EXCEPTION
  WHEN check_violation OR exclusion_violation OR unique_violation
    OR foreign_key_violation OR not_null_violation THEN
    RAISE NOTICE 'PASS: %', p_label;
END;
$$ LANGUAGE plpgsql;

-- Очікуємо, що умова істинна
CREATE FUNCTION pg_temp.expect_true(p_label TEXT, p_cond BOOLEAN) RETURNS VOID AS $$
BEGIN
  IF p_cond IS TRUE THEN
    RAISE NOTICE 'PASS: %', p_label;
  ELSE
    RAISE EXCEPTION 'FAIL: %', p_label;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Створює коректну бронь (pending) і повертає її id
CREATE FUNCTION pg_temp.mk_booking(p_tenant TEXT, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ)
RETURNS BIGINT AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO bookings (tenant_id, landlord_id, vehicle_id, pickup_station_id, return_station_id,
                        rental_type, start_at, end_at, expires_at, rental_amount)
  VALUES (pg_temp.uid(p_tenant), pg_temp.uid('landlord'), pg_temp.vid(), pg_temp.sid(), pg_temp.sid(),
          'daily', p_start, p_end, now() + interval '1 hour', 300)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------
-- 1. Тестові дані
-- ---------------------------------------------------------------
INSERT INTO users (email, role, full_name) VALUES
  ('admin@test.local',    'admin',    'Test Admin'),
  ('landlord@test.local', 'landlord', 'Test Landlord'),
  ('tenant@test.local',   'tenant',   'Test Tenant'),
  ('tenant2@test.local',  'tenant',   'Test Tenant 2');

INSERT INTO rental_stations (name, address, latitude, longitude)
VALUES ('Test station', 'Rynok sq 1', 49.841952, 24.031592);

INSERT INTO vehicles (owner_id, type, brand, model, min_driver_age)
VALUES (pg_temp.uid('landlord'), 'ebike', 'Test', 'E1-TEST', 14);

INSERT INTO vehicle_options (vehicle_id, range_km, max_speed_kmh, max_payload_kg, power_watts, battery_type)
VALUES (pg_temp.vid(), 60, 25, 120, 250, 'removable');

INSERT INTO vehicle_tariffs (vehicle_id, price_day, price_week, deposit_amount)
VALUES (pg_temp.vid(), 300, 1500, 500);

-- ---------------------------------------------------------------
-- 2. Транспорт: модерація, блокування, ТТХ, тарифи, фото, телеметрія
-- ---------------------------------------------------------------
SELECT pg_temp.expect_fail('approved без модератора відхиляється', $q$
  UPDATE vehicles SET moderation_status = 'approved' WHERE id = pg_temp.vid() $q$);

SELECT pg_temp.expect_fail('rejected без причини відхиляється', $q$
  UPDATE vehicles SET moderation_status = 'rejected',
         moderated_by = pg_temp.uid('admin'), moderated_at = now()
   WHERE id = pg_temp.vid() $q$);

SELECT pg_temp.expect_fail('блокування без причини відхиляється', $q$
  UPDATE vehicles SET is_blocked = TRUE WHERE id = pg_temp.vid() $q$);

SELECT pg_temp.expect_fail('бронь на непідтверджений (pending) транспорт відхиляється', $q$
  SELECT pg_temp.mk_booking('tenant', now() + interval '2 days', now() + interval '3 days') $q$);

SELECT pg_temp.expect_fail('range_km = 0 відхиляється', $q$
  UPDATE vehicle_options SET range_km = 0 WHERE vehicle_id = pg_temp.vid() $q$);

SELECT pg_temp.expect_fail('тариф без жодної ціни відхиляється', $q$
  UPDATE vehicle_tariffs SET price_day = NULL, price_week = NULL WHERE vehicle_id = pg_temp.vid() $q$);

SELECT pg_temp.expect_fail('заряд батареї 150% відхиляється', $q$
  INSERT INTO vehicle_telemetry (vehicle_id, battery_level_pct, recorded_at)
  VALUES (pg_temp.vid(), 150, now()) $q$);

INSERT INTO vehicle_photos (vehicle_id, url, is_cover) VALUES (pg_temp.vid(), 'https://example.com/1.webp', TRUE);
SELECT pg_temp.expect_fail('друга обкладинка для одного транспорту відхиляється', $q$
  INSERT INTO vehicle_photos (vehicle_id, url, is_cover)
  VALUES (pg_temp.vid(), 'https://example.com/2.webp', TRUE) $q$);

-- Схвалення адміном
UPDATE vehicles
   SET moderation_status = 'approved', moderated_by = pg_temp.uid('admin'), moderated_at = now()
 WHERE id = pg_temp.vid();

SELECT pg_temp.expect_true('рішення модерації записане в журнал автоматично',
  (SELECT count(*) FROM vehicle_moderation_log
    WHERE vehicle_id = pg_temp.vid() AND decision = 'approved') = 1);

SELECT pg_temp.expect_true('схвалений транспорт проходить фільтр каталогу',
  (SELECT count(*)
     FROM vehicles v
     JOIN vehicle_options o ON o.vehicle_id = v.id
     JOIN vehicle_tariffs t ON t.vehicle_id = v.id
    WHERE v.moderation_status = 'approved' AND NOT v.is_blocked AND v.status <> 'retired'
      AND o.range_km BETWEEN 40 AND 69 AND t.price_week <= 1500
      AND v.id = pg_temp.vid()) = 1);

-- Блокування адміном робить бронювання неможливим
UPDATE vehicles
   SET is_blocked = TRUE, blocked_reason = 'test', blocked_by = pg_temp.uid('admin'), blocked_at = now()
 WHERE id = pg_temp.vid();
SELECT pg_temp.expect_fail('бронь на заблокований транспорт відхиляється', $q$
  SELECT pg_temp.mk_booking('tenant', now() + interval '2 days', now() + interval '3 days') $q$);
UPDATE vehicles
   SET is_blocked = FALSE, blocked_reason = NULL, blocked_by = NULL, blocked_at = NULL
 WHERE id = pg_temp.vid();

-- ---------------------------------------------------------------
-- 3. Бронювання: перетин, межі, статуси, журнал
-- ---------------------------------------------------------------
INSERT INTO ids VALUES ('b1', pg_temp.mk_booking('tenant', now() + interval '2 days', now() + interval '3 days'));

SELECT pg_temp.expect_true('нова бронь створена зі статусом pending',
  (SELECT status FROM bookings WHERE id = pg_temp.k('b1')) = 'pending');

SELECT pg_temp.expect_true('створення броні записане в журнал статусів',
  (SELECT count(*) FROM booking_status_history WHERE booking_id = pg_temp.k('b1')) = 1);

SELECT pg_temp.expect_fail('перетин періодів на одному транспорті відхиляється', $q$
  SELECT pg_temp.mk_booking('tenant2', now() + interval '2 days 12 hours', now() + interval '3 days 12 hours') $q$);

INSERT INTO ids VALUES ('b2', pg_temp.mk_booking('tenant2', now() + interval '3 days', now() + interval '4 days'));
SELECT pg_temp.expect_true('бронь «встик» (початок = кінець попередньої) дозволена',
  pg_temp.k('b2') IS NOT NULL);

SELECT pg_temp.expect_fail('орендар = орендодавець відхиляється', $q$
  SELECT pg_temp.mk_booking('landlord', now() + interval '10 days', now() + interval '11 days') $q$);

SELECT pg_temp.expect_fail('landlord_id, що не збігається з власником транспорту, відхиляється', $q$
  INSERT INTO bookings (tenant_id, landlord_id, vehicle_id, pickup_station_id, return_station_id,
                        rental_type, start_at, end_at, expires_at, rental_amount)
  VALUES (pg_temp.uid('tenant'), pg_temp.uid('admin'), pg_temp.vid(), pg_temp.sid(), pg_temp.sid(),
          'daily', now() + interval '12 days', now() + interval '13 days',
          now() + interval '1 hour', 300) $q$);

SELECT pg_temp.expect_fail('кінець броні = початок відхиляється', $q$
  SELECT pg_temp.mk_booking('tenant', now() + interval '14 days', now() + interval '14 days') $q$);

SELECT pg_temp.expect_fail('pending без expires_at відхиляється', $q$
  INSERT INTO bookings (tenant_id, landlord_id, vehicle_id, pickup_station_id, return_station_id,
                        rental_type, start_at, end_at, rental_amount)
  VALUES (pg_temp.uid('tenant'), pg_temp.uid('landlord'), pg_temp.vid(), pg_temp.sid(), pg_temp.sid(),
          'daily', now() + interval '15 days', now() + interval '16 days', 300) $q$);

SELECT pg_temp.expect_fail('перехід pending -> completed відхиляється', $q$
  UPDATE bookings SET status = 'completed', returned_at = now() WHERE id = pg_temp.k('b1') $q$);

SELECT pg_temp.expect_fail('скасування без причини відхиляється', $q$
  UPDATE bookings SET status = 'cancelled' WHERE id = pg_temp.k('b2') $q$);

-- Скасування звільняє слот
UPDATE bookings
   SET status = 'cancelled', cancel_reason = 'test', cancelled_at = now(),
       cancelled_by = pg_temp.uid('landlord')
 WHERE id = pg_temp.k('b2');
INSERT INTO ids VALUES ('b3', pg_temp.mk_booking('tenant', now() + interval '3 days', now() + interval '4 days'));
SELECT pg_temp.expect_true('скасована бронь більше не блокує транспорт', pg_temp.k('b3') IS NOT NULL);

-- Відгук до завершення оренди неможливий
SELECT pg_temp.expect_fail('відгук по незавершеній броні відхиляється', $q$
  INSERT INTO reviews (booking_id, author_id, target_id, target_role, rating)
  VALUES (pg_temp.k('b1'), pg_temp.uid('tenant'), pg_temp.uid('landlord'), 'landlord', 5) $q$);

-- Життєвий цикл b1: pending -> active -> completed
UPDATE bookings SET status = 'active' WHERE id = pg_temp.k('b1');
UPDATE bookings SET status = 'completed', returned_at = now() WHERE id = pg_temp.k('b1');
SELECT pg_temp.expect_true('журнал статусів: 3 записи (pending, active, completed)',
  (SELECT count(*) FROM booking_status_history WHERE booking_id = pg_temp.k('b1')) = 3);

SELECT pg_temp.expect_fail('перехід completed -> active відхиляється', $q$
  UPDATE bookings SET status = 'active' WHERE id = pg_temp.k('b1') $q$);

-- ---------------------------------------------------------------
-- 4. Чорний список
-- ---------------------------------------------------------------
SELECT pg_temp.expect_fail('чорний список від імені не-адміна відхиляється', $q$
  INSERT INTO blacklist_logs (user_id, admin_id, action, reason)
  VALUES (pg_temp.uid('tenant2'), pg_temp.uid('landlord'), 'blocked', 'test') $q$);

INSERT INTO blacklist_logs (user_id, admin_id, action, reason)
VALUES (pg_temp.uid('tenant2'), pg_temp.uid('admin'), 'blocked', 'test');
SELECT pg_temp.expect_true('запис у журналі виставив is_blacklisted = TRUE',
  (SELECT is_blacklisted FROM users WHERE id = pg_temp.uid('tenant2')) IS TRUE);

SELECT pg_temp.expect_fail('бронювання від користувача з чорного списку відхиляється', $q$
  SELECT pg_temp.mk_booking('tenant2', now() + interval '20 days', now() + interval '21 days') $q$);

INSERT INTO blacklist_logs (user_id, admin_id, action, reason)
VALUES (pg_temp.uid('tenant2'), pg_temp.uid('admin'), 'unblocked', 'test');
SELECT pg_temp.expect_true('розблокування знімає is_blacklisted',
  (SELECT is_blacklisted FROM users WHERE id = pg_temp.uid('tenant2')) IS FALSE);

-- ---------------------------------------------------------------
-- 5. Відгуки та рейтинг (по завершеній броні b1)
-- ---------------------------------------------------------------
SELECT pg_temp.expect_fail('відгук із хибним target_role відхиляється', $q$
  INSERT INTO reviews (booking_id, author_id, target_id, target_role, rating)
  VALUES (pg_temp.k('b1'), pg_temp.uid('tenant'), pg_temp.uid('landlord'), 'tenant', 5) $q$);

SELECT pg_temp.expect_fail('відгук від стороннього користувача відхиляється', $q$
  INSERT INTO reviews (booking_id, author_id, target_id, target_role, rating)
  VALUES (pg_temp.k('b1'), pg_temp.uid('tenant2'), pg_temp.uid('landlord'), 'landlord', 5) $q$);

SELECT pg_temp.expect_fail('оцінка 6 відхиляється', $q$
  INSERT INTO reviews (booking_id, author_id, target_id, target_role, rating)
  VALUES (pg_temp.k('b1'), pg_temp.uid('tenant'), pg_temp.uid('landlord'), 'landlord', 6) $q$);

INSERT INTO reviews (booking_id, author_id, target_id, target_role, rating)
VALUES (pg_temp.k('b1'), pg_temp.uid('tenant'), pg_temp.uid('landlord'), 'landlord', 5);

SELECT pg_temp.expect_fail('другий відгук від того ж автора на ту саму бронь відхиляється', $q$
  INSERT INTO reviews (booking_id, author_id, target_id, target_role, rating)
  VALUES (pg_temp.k('b1'), pg_temp.uid('tenant'), pg_temp.uid('landlord'), 'landlord', 4) $q$);

INSERT INTO reviews (booking_id, author_id, target_id, target_role, rating)
VALUES (pg_temp.k('b1'), pg_temp.uid('landlord'), pg_temp.uid('tenant'), 'tenant', 3);

SELECT pg_temp.expect_true('рейтинг орендодавця = 5.00, відгуків 1',
  (SELECT rating_as_landlord = 5.00 AND reviews_count_as_landlord = 1
     FROM users WHERE id = pg_temp.uid('landlord')));
SELECT pg_temp.expect_true('рейтинг орендаря = 3.00, відгуків 1',
  (SELECT rating_as_tenant = 3.00 AND reviews_count_as_tenant = 1
     FROM users WHERE id = pg_temp.uid('tenant')));

UPDATE reviews SET rating = 4
 WHERE booking_id = pg_temp.k('b1') AND author_id = pg_temp.uid('landlord');
SELECT pg_temp.expect_true('зміна оцінки перераховує рейтинг орендаря (4.00)',
  (SELECT rating_as_tenant = 4.00 FROM users WHERE id = pg_temp.uid('tenant')));

-- ---------------------------------------------------------------
-- 6. Застава та платежі
-- ---------------------------------------------------------------
INSERT INTO deposits (booking_id, attempt, method, amount, status, held_at, hold_expires_at)
VALUES (pg_temp.k('b1'), 1, 'card_hold', 500, 'held', now(), now() + interval '7 days');

SELECT pg_temp.expect_fail('друга активна застава на ту саму бронь відхиляється', $q$
  INSERT INTO deposits (booking_id, attempt, method, amount, status)
  VALUES (pg_temp.k('b1'), 2, 'card_hold', 500, 'pending') $q$);

SELECT pg_temp.expect_fail('утримана сума більша за заставу відхиляється', $q$
  UPDATE deposits SET captured_amount = 600
   WHERE booking_id = pg_temp.k('b1') AND attempt = 1 $q$);

SELECT pg_temp.expect_fail('статус captured з нульовою сумою відхиляється', $q$
  UPDATE deposits SET status = 'captured'
   WHERE booking_id = pg_temp.k('b1') AND attempt = 1 $q$);

-- Перевипуск холду (довгострокова оренда): стару заставу закрито, нова дозволена
UPDATE deposits SET status = 'released', released_at = now()
 WHERE booking_id = pg_temp.k('b1') AND attempt = 1;
INSERT INTO deposits (booking_id, attempt, renewed_from_id, method, amount, status)
SELECT booking_id, 2, id, 'card_hold'::deposit_method, 500, 'pending'::deposit_status
  FROM deposits WHERE booking_id = pg_temp.k('b1') AND attempt = 1;
SELECT pg_temp.expect_true('перевипуск застави: 2 записи на бронь',
  (SELECT count(*) FROM deposits WHERE booking_id = pg_temp.k('b1')) = 2);

INSERT INTO payments (booking_id, amount, gateway, gateway_order_id)
VALUES (pg_temp.k('b1'), 100, 'liqpay', 'T-ORDER-1');

SELECT pg_temp.expect_fail('дубль gateway_order_id відхиляється', $q$
  INSERT INTO payments (booking_id, amount, gateway, gateway_order_id)
  VALUES (pg_temp.k('b1'), 100, 'liqpay', 'T-ORDER-1') $q$);

SELECT pg_temp.expect_fail('статус paid без paid_at відхиляється', $q$
  UPDATE payments SET status = 'paid' WHERE gateway_order_id = 'T-ORDER-1' $q$);

SELECT pg_temp.expect_fail('повернення більше за суму платежу відхиляється', $q$
  UPDATE payments SET refunded_amount = 101 WHERE gateway_order_id = 'T-ORDER-1' $q$);

UPDATE payments SET status = 'paid', paid_at = now() WHERE gateway_order_id = 'T-ORDER-1';
SELECT pg_temp.expect_true('платіж із paid_at переходить у paid',
  (SELECT status FROM payments WHERE gateway_order_id = 'T-ORDER-1') = 'paid');

-- ---------------------------------------------------------------
-- 7. Захист від видалення
-- ---------------------------------------------------------------
SELECT pg_temp.expect_fail('бронь із платежами/заставою/відгуками не видаляється', $q$
  DELETE FROM bookings WHERE id = pg_temp.k('b1') $q$);

SELECT pg_temp.expect_fail('транспорт із бронями та журналом модерації не видаляється', $q$
  DELETE FROM vehicles WHERE id = pg_temp.vid() $q$);

-- ---------------------------------------------------------------
-- Кінець: відкат усіх тестових даних
-- ---------------------------------------------------------------
ROLLBACK;

\o
DO $$ BEGIN RAISE NOTICE 'ВСІ ТЕСТИ ПРОЙДЕНО. Тестові дані відкочено.'; END $$;
