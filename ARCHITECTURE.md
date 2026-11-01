# Архітектура ReBi (Clean Architecture)

## Правило залежностей
Залежності ведуть **лише всередину**: Interfaces/Infrastructure → Application → Domain.
Domain нічого не знає про Express, Postgres, React чи fetch.

## Backend (`backend/src`)
| Шар | Папка | Відповідає за |
|---|---|---|
| Domain | `domain/entities`, `domain/repositories` | Сутності (Vehicle) і «порти» (договори сховищ) |
| Application | `application/use-cases` | Сценарії: ListAvailableVehicles, CheckHealth |
| Infrastructure | `infrastructure/db`, `infrastructure/repositories` | Postgres, SQL, реалізація портів |
| Interfaces | `interfaces/http` | Express: контролери, маршрути, createApp |
| Composition root | `main.js` | Єдине місце, де все зв'язується |

## Frontend (`frontend/src`)
| Шар | Папка | Відповідає за |
|---|---|---|
| Domain | `domain/entities`, `domain/ports` | Сутність vehicle, договір репозиторію |
| Application | `application/useCases` | Сценарії (getAvailableVehicles) |
| Infrastructure | `infrastructure/http`, `infrastructure/repositories` | fetch до `/api`, реалізація портів |
| Presentation | `presentation/components`, `hooks`, `pages`, `styles` | React-компоненти та стилі |
| DI | `di/container.js` | Збирає залежності |

## Як додати нову функцію (наприклад, «Бронювання»)
1. Domain: сутність `Booking` і порт `BookingRepository`.
2. Application: сценарій `CreateBooking`.
3. Infrastructure: `PgBookingRepository` / `httpBookingRepository`.
4. Interfaces / Presentation: контролер і маршрут (бекенд) або хук і компонент (фронтенд).
5. Підключити в `main.js` / `di/container.js`.
