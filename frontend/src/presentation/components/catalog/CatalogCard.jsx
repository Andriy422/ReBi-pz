import { Link } from 'react-router-dom'
import Button from '../Button'
import { vehicleTypeLabel } from '../../../domain/entities/vehicle'
import { batteryLabels, optionLabels } from '../../../domain/entities/catalogModel'
import './CatalogCard.css'

export default function CatalogCard({ model }) {
  const tags = [batteryLabels[model.batteryType], ...model.options.map((o) => optionLabels[o])]

  return (
    <article className="ccard">
      <Link to={`/catalog/${model.id}`} className="ccard__photo">
        фото
      </Link>

      <div className="ccard__info">
        <span className="ccard__type">{vehicleTypeLabel[model.type]}</span>
        <h3>
          <Link to={`/catalog/${model.id}`}>{model.name}</Link>
        </h3>
        <p className="ccard__specs">
          {model.rangeKm} км · {model.maxSpeedKmh} км/год · {model.powerW} Вт
        </p>
        <ul className="ccard__tags">
          {tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="ccard__buy">
        <strong>від {model.pricePerDay} грн/день</strong>
        {!model.available && <small>Зараз зайнято</small>}
        <Button to={`/catalog/${model.id}`}>Забронювати</Button>
      </div>
    </article>
  )
}
