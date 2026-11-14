import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../Button'
import { container } from '../../../di/container'
import { useAuth } from '../../hooks/useAuth'
import { quoteBooking } from '../../../application/useCases/booking'
import { ACCESSORIES } from '../../../domain/booking/pricing'
import { pickupLocations } from '../../../domain/booking/locations'
import { defaultBookingWindow } from '../../utils/datetime'
import { pluralDays } from '../../utils/plural'
import './BookingForm.css'

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

export default function BookingForm({ model }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [window, setWindow] = useState(defaultBookingWindow)
  const [pickup, setPickup] = useState(pickupLocations[0])
  const [accessories, setAccessories] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const quote = useMemo(
    () => quoteBooking(model, { start: window.start, end: window.end, accessories }),
    [model, window, accessories],
  )

  const handleSubmit = async (e) => {
    e.preventDefault()

    // для бронювання потрібен вхід; після входу повертаємось на цю сторінку
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!quote.valid) return

    setBusy(true)
    setError(null)
    try {
      const booking = await container.createBooking({
        model,
        input: { start: window.start, end: window.end, accessories, location: pickup },
      })
      navigate(`/booking/${booking.id}`)
    } catch {
      setError('Не вдалося створити бронювання. Спробуйте ще раз.')
      setBusy(false)
    }
  }

  const unavailable = !model.available

  return (
    <form className="bform" onSubmit={handleSubmit}>
      <h2>Бронювання</h2>

      <label className="bform__field">
        <span>Початок</span>
        <input
          type="datetime-local"
          value={window.start}
          onChange={(e) => setWindow({ ...window, start: e.target.value })}
        />
      </label>
      <label className="bform__field">
        <span>Завершення</span>
        <input
          type="datetime-local"
          value={window.end}
          onChange={(e) => setWindow({ ...window, end: e.target.value })}
        />
      </label>
      <label className="bform__field">
        <span>Видача / повернення</span>
        <select value={pickup} onChange={(e) => setPickup(e.target.value)}>
          {pickupLocations.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>

      <div className="bform__acc">
        {Object.entries(ACCESSORIES).map(([key, a]) => (
          <button
            key={key}
            type="button"
            className={accessories.includes(key) ? 'is-active' : ''}
            onClick={() => setAccessories(toggle(accessories, key))}
            title={`${a.pricePerDay} грн/доба`}
          >
            + {a.label}
          </button>
        ))}
      </div>

      {quote.valid ? (
        <div className="bform__sum">
          <p>
            {quote.days} {pluralDays(quote.days)}: оренда {quote.rental}
            {quote.accessoriesTotal > 0 ? ` + аксесуари ${quote.accessoriesTotal}` : ''} + застава {quote.deposit} грн
          </p>
          <strong>{quote.total} грн</strong>
        </div>
      ) : (
        <p className="bform__error">{quote.error}</p>
      )}

      {error && <p className="bform__error">{error}</p>}

      <Button type="submit" disabled={busy || unavailable || !quote.valid}>
        {unavailable ? 'Зараз зайнято' : busy ? 'Бронюємо…' : 'Забронювати та оплатити'}
      </Button>
      <small className="bform__note">Застава повертається після здачі транспорту. Оплата ще не підключена (демо).</small>
    </form>
  )
}
