import { useState } from 'react'
import { vehicleTypeLabel } from '../../../domain/entities/vehicle'
import { batteryLabels, optionLabels, rangeLabels } from '../../../domain/entities/catalogModel'
import { pluralModels } from '../../utils/plural'
import Button from '../Button'
import './FilterSidebar.css'

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

function Group({ title, children }) {
  return (
    <section className="fgroup">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function Check({ label, checked, onChange }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  )
}

export default function FilterSidebar({ filters, onChange, brands, total, onReset, onApply, open }) {
  const [brandQuery, setBrandQuery] = useState('')
  const [showAllBrands, setShowAllBrands] = useState(false)
  const set = (patch) => onChange({ ...filters, ...patch })

  const visibleBrands = brands.filter((b) => b.toLowerCase().includes(brandQuery.trim().toLowerCase()))
  const shownBrands = showAllBrands || brandQuery ? visibleBrands : visibleBrands.slice(0, 5)

  return (
    <aside className={`filters ${open ? 'is-open' : ''}`}>
      <div className="filters__head">
        <h2>Фільтри</h2>
        <button type="button" className="filters__reset" onClick={onReset}>
          Скинути все
        </button>
      </div>

      <Group title="Тип транспорту">
        {Object.entries(vehicleTypeLabel).map(([value, label]) => (
          <Check
            key={value}
            label={label}
            checked={filters.types.includes(value)}
            onChange={() => set({ types: toggle(filters.types, value) })}
          />
        ))}
      </Group>

      <Group title="Бренд / модель">
        <input
          className="finput"
          placeholder="Знайти бренд…"
          value={brandQuery}
          onChange={(e) => setBrandQuery(e.target.value)}
        />
        {shownBrands.map((b) => (
          <Check key={b} label={b} checked={filters.brands.includes(b)} onChange={() => set({ brands: toggle(filters.brands, b)})} />
        ))}
        {!brandQuery && visibleBrands.length > 5 && (
          <button type="button" className="filters__more" onClick={() => setShowAllBrands(!showAllBrands)}>
            {showAllBrands ? 'Показати менше' : `Показати ще ${visibleBrands.length - 5}`}
          </button>
        )}
      </Group>

      <Group title="Запас ходу">
        <div className="fchips">
          {Object.entries(rangeLabels).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`fchip ${filters.ranges.includes(value) ? 'is-active' : ''}`}
              onClick={() => set({ ranges: toggle(filters.ranges, value) })}
            >
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Максимальна швидкість">
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={filters.minSpeed}
          onChange={(e) => set({ minSpeed: Number(e.target.value) })}
        />
        <small className="filters__hint">
          {filters.minSpeed === 0 ? 'будь-яка' : `від ${filters.minSpeed} км/год`}
        </small>
      </Group>

      <Group title="Акумулятор">
        {Object.entries(batteryLabels).map(([value, label]) => (
          <Check
            key={value}
            label={label}
            checked={filters.batteries.includes(value)}
            onChange={() => set({ batteries: toggle(filters.batteries, value) })}
          />
        ))}
      </Group>

      <Group title="Додаткові опції">
        {Object.entries(optionLabels).map(([value, label]) => (
          <Check
            key={value}
            label={label}
            checked={filters.options.includes(value)}
            onChange={() => set({ options: toggle(filters.options, value) })}
          />
        ))}
      </Group>

      <Group title="Вік водія">
        <div className="fchips">
          {[14, 16, 18].map((age) => (
            <button
              key={age}
              type="button"
              className={`fchip ${filters.driverAge === age ? 'is-active' : ''}`}
              onClick={() => set({ driverAge: filters.driverAge === age ? null : age })}
            >
              від {age}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Ціна за добу, грн">
        <div className="fprice">
          <input
            className="finput"
            type="number"
            min="0"
            placeholder="від"
            value={filters.priceMin}
            onChange={(e) => set({ priceMin: e.target.value })}
          />
          <input
            className="finput"
            type="number"
            min="0"
            placeholder="до"
            value={filters.priceMax}
            onChange={(e) => set({ priceMax: e.target.value })}
          />
        </div>
      </Group>

      <Group title="Доступність">
        <Check
          label="Лише вільні зараз"
          checked={filters.onlyAvailable}
          onChange={() => set({ onlyAvailable: !filters.onlyAvailable })}
        />
      </Group>

      <div className="filters__actions">
        <Button type="button" onClick={onApply}>
          Показати {total} {pluralModels(total)}
        </Button>
        <Button type="button" variant="secondary" onClick={onReset}>
          Скинути
        </Button>
      </div>
    </aside>
  )
}
