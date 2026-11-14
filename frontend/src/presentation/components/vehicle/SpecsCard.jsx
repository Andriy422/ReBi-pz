import { batteryLabels } from '../../../domain/entities/catalogModel'
import './SpecsCard.css'

export default function SpecsCard({ model }) {
  const rows = [
    ['Потужність мотора', `${model.powerW} Вт`],
    ['Батарея', model.batteryWh ? `${model.batteryWh} Вт·год` : '—'],
    ['Тип акумулятора', batteryLabels[model.batteryType]],
    ['Запас ходу', `до ${model.rangeKm} км`],
    ['Макс. швидкість', `${model.maxSpeedKmh} км/год`],
    ['Макс. навантаження', model.maxLoadKg ? `${model.maxLoadKg} кг` : '—'],
    ['Вага', model.weightKg ? `${model.weightKg} кг` : '—'],
  ]

  return (
    <section className="specs">
      <h2>Характеристики</h2>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
