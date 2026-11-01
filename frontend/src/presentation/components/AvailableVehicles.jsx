import Button from './Button'
import { getVehicleLabel } from '../../domain/entities/vehicle'
import { useAvailableVehicles } from '../hooks/useAvailableVehicles'
import './AvailableVehicles.css'

export default function AvailableVehicles() {
  const { vehicles, loading, error } = useAvailableVehicles()

  return (
    <section className="vehicles">
      <h2>Вільний транспорт</h2>

      {loading && <p className="vehicles__note">Завантаження…</p>}
      {error && <p className="vehicles__note vehicles__note--error">Не вдалося завантажити транспорт</p>}
      {!loading && !error && vehicles.length === 0 && (
        <p className="vehicles__note">Немає вільного транспорту</p>
      )}

      <div className="vehicles__grid">
        {vehicles.map((v) => (
          <article key={v.id} className="vehicle-card">
            <div className="vehicle-card__photo">фото</div>
            <h3>{getVehicleLabel(v)}</h3>
            <p>Заряд: {v.batteryLevel}%</p>
            <Button>Забронювати</Button>
          </article>
        ))}
      </div>
    </section>
  )
}
