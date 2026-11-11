import Button from './Button'
import { vehicleTypeLabel } from '../../domain/entities/vehicle'
import { usePopularModels } from '../hooks/usePopularModels'
import './PopularModels.css'

function ModelCard({ model }) {
  return (
    <article className="model-card">
      <div className="model-card__photo">фото · {vehicleTypeLabel[model.type]}</div>
      <span className="model-card__type">{vehicleTypeLabel[model.type]}</span>
      <h3 className="model-card__name">{model.name}</h3>
      <p className="model-card__specs">
        Запас ходу {model.rangeKm} км · {model.maxSpeedKmh} км/год · {model.powerW} Вт
      </p>
      <div className="model-card__footer">
        <strong>від {model.pricePerDay} грн/день</strong>
        <Button>Забронювати</Button>
      </div>
    </article>
  )
}

export default function PopularModels() {
  const { models, loading, error } = usePopularModels(3)

  return (
    <section id="catalog" className="section popular">
      <header className="section__head">
        <h2>Популярні моделі</h2>
        <p>Обирай свій ідеальний транспорт</p>
      </header>

      {loading && <p className="section__note">Завантаження…</p>}
      {error && <p className="section__note section__note--error">Не вдалося завантажити моделі</p>}

      <div className="popular__grid">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </div>
    </section>
  )
}
