import { useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Button from '../components/Button'
import { useBooking } from '../hooks/useBookings'
import { formatDateTime } from '../utils/datetime'
import './BookingSuccessPage.css'

export default function BookingSuccessPage() {
  const { id } = useParams()
  const { booking, loading, error } = useBooking(id)

  return (
    <PageLayout>
      <section className="success">
        {loading && <p>Завантаження…</p>}
        {error && <p className="success__error">Не вдалося завантажити бронювання</p>}

        {!loading && !error && !booking && (
          <>
            <h1>Бронювання не знайдено</h1>
            <Button to="/catalog">До каталогу</Button>
          </>
        )}

        {booking && (
          <article className="success__card">
            <span className="success__check">✓</span>
            <h1>Бронювання підтверджено</h1>
            <p className="success__sub">Покажіть QR-код у точці видачі</p>
            <div className="success__qr">QR-код</div>

            <dl className="success__details">
              <div>
                <dt>Транспорт</dt>
                <dd>{booking.modelName}</dd>
              </div>
              <div>
                <dt>Період</dt>
                <dd>
                  {formatDateTime(booking.start)} — {formatDateTime(booking.end)}
                </dd>
              </div>
              <div>
                <dt>Точка видачі</dt>
                <dd>{booking.location}</dd>
              </div>
              <div>
                <dt>Разом (з заставою)</dt>
                <dd>{booking.quote.total} грн</dd>
              </div>
            </dl>

            <div className="success__actions">
              <a
                className="btn btn--primary"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location + ' Львів')}`}
                target="_blank"
                rel="noreferrer"
              >
                Прокласти маршрут
              </a>
              <Button to="/account" variant="secondary">
                До кабінету
              </Button>
            </div>
            <small className="success__demo">Демо-режим: бронювання збережене лише у вашому браузері</small>
          </article>
        )}
      </section>
    </PageLayout>
  )
}
