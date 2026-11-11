import { useState } from 'react'
import Button from './Button'
import { durationLabel, RentalDuration } from '../../domain/entities/tariff'
import { calculateRentalPrice, getStartingPrice } from '../../application/useCases/calculateRentalPrice'
import './TariffsAndMap.css'

const typeTabs = [
  ['bike', 'Велосипед'],
  ['scooter', 'Самокат'],
  ['moped', 'Мопед'],
]
const durations = [RentalDuration.HOUR, RentalDuration.DAY, RentalDuration.WEEK]

function TariffCalculator() {
  const [vehicleType, setVehicleType] = useState('bike')
  const [duration, setDuration] = useState(RentalDuration.DAY)
  const [result, setResult] = useState(null)

  const choose = (setter) => (value) => {
    setter(value)
    setResult(null) // після зміни параметрів розрахунок скидається
  }

  return (
    <article id="tariffs" className="calc">
      <h2>Тарифи та калькулятор</h2>

      <div className="calc__row" role="tablist">
        {typeTabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`calc__tab ${vehicleType === value ? 'is-active' : ''}`}
            onClick={() => choose(setVehicleType)(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="calc__row">
        {durations.map((d) => (
          <button
            key={d}
            type="button"
            className={`calc__chip ${duration === d ? 'is-active' : ''}`}
            onClick={() => choose(setDuration)(d)}
          >
            {durationLabel[d]}
          </button>
        ))}
      </div>

      <p className="calc__price">
        {result !== null ? `Вартість: ${result} грн` : `Вартість: від ${getStartingPrice(vehicleType)} грн`}
      </p>

      <Button type="button" onClick={() => setResult(calculateRentalPrice({ vehicleType, duration }))}>
        Розрахувати
      </Button>

      <small>Також комісія із сторонніх оголошень 1–3%. Тарифи орієнтовні.</small>
    </article>
  )
}

export default function TariffsAndMap() {
  return (
    <section className="section tm">
      <article id="map" className="map">
        <h2>Карта локацій</h2>
        <p>Знайди найближчу точку видачі</p>
        <div className="map__placeholder">карта · точки видачі</div>
      </article>
      <TariffCalculator />
    </section>
  )
}
