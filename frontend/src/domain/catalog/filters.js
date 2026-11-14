// DOMAIN: чиста логіка фільтрації, сортування та «чипів» каталогу.
// Не залежить від React і від того, звідки прийшли дані (мок чи API).
import { vehicleTypeLabel } from '../entities/vehicle'
import { batteryLabels, optionLabels, rangeLabels } from '../entities/catalogModel'

export const defaultFilters = Object.freeze({
  query: '',
  types: [],
  brands: [],
  ranges: [], // 'short' | 'mid' | 'long'
  minSpeed: 0, // км/год
  batteries: [], // 'removable' | 'fixed'
  options: [], // 'rack' | 'childSeat' | 'secondBattery' | 'helmet' | 'lock'
  driverAge: null, // 14 | 16 | 18
  priceMin: '',
  priceMax: '',
  onlyAvailable: false,
})

export const sortOptions = [
  { value: 'popular', label: 'Популярні' },
  { value: 'priceAsc', label: 'Спершу дешевші' },
  { value: 'priceDesc', label: 'Спершу дорожчі' },
  { value: 'rangeDesc', label: 'Більший запас ходу' },
]

export function getRangeBucket(rangeKm) {
  if (rangeKm < 40) return 'short'
  if (rangeKm <= 70) return 'mid'
  return 'long'
}

const toNumber = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export function applyFilters(models, f) {
  const q = f.query.trim().toLowerCase()
  const min = toNumber(f.priceMin)
  const max = toNumber(f.priceMax)

  return models.filter((m) => {
    if (q && !`${m.brand} ${m.name}`.toLowerCase().includes(q)) return false
    if (f.types.length && !f.types.includes(m.type)) return false
    if (f.brands.length && !f.brands.includes(m.brand)) return false
    if (f.ranges.length && !f.ranges.includes(getRangeBucket(m.rangeKm))) return false
    if (m.maxSpeedKmh < f.minSpeed) return false
    if (f.batteries.length && !f.batteries.includes(m.batteryType)) return false
    if (f.options.length && !f.options.every((o) => m.options.includes(o))) return false
    if (f.driverAge !== null && m.minAge > f.driverAge) return false
    if (min !== null && m.pricePerDay < min) return false
    if (max !== null && m.pricePerDay > max) return false
    if (f.onlyAvailable && !m.available) return false
    return true
  })
}

export function sortModels(models, sort) {
  const list = [...models]
  switch (sort) {
    case 'priceAsc':
      return list.sort((a, b) => a.pricePerDay - b.pricePerDay)
    case 'priceDesc':
      return list.sort((a, b) => b.pricePerDay - a.pricePerDay)
    case 'rangeDesc':
      return list.sort((a, b) => b.rangeKm - a.rangeKm)
    default:
      return list.sort((a, b) => b.popularity - a.popularity)
  }
}

// «Чипи» застосованих фільтрів: [{ id, label }]
export function activeFilterChips(f) {
  const chips = []
  if (f.query.trim()) chips.push({ id: 'query', label: `«${f.query.trim()}»` })
  f.types.forEach((t) => chips.push({ id: `type:${t}`, label: vehicleTypeLabel[t] }))
  f.brands.forEach((b) => chips.push({ id: `brand:${b}`, label: b }))
  f.ranges.forEach((r) => chips.push({ id: `range:${r}`, label: rangeLabels[r] }))
  if (f.minSpeed > 0) chips.push({ id: 'speed', label: `від ${f.minSpeed} км/год` })
  f.batteries.forEach((b) => chips.push({ id: `battery:${b}`, label: batteryLabels[b] }))
  f.options.forEach((o) => chips.push({ id: `option:${o}`, label: optionLabels[o] }))
  if (f.driverAge !== null) chips.push({ id: 'age', label: `вік від ${f.driverAge}` })
  if (toNumber(f.priceMin) !== null || toNumber(f.priceMax) !== null) {
    chips.push({ id: 'price', label: `${f.priceMin || 0}–${f.priceMax || '∞'} грн` })
  }
  if (f.onlyAvailable) chips.push({ id: 'available', label: 'Лише вільні' })
  return chips
}

export function removeFilterChip(f, id) {
  const [kind, value] = id.split(':')
  switch (kind) {
    case 'query':
      return { ...f, query: '' }
    case 'type':
      return { ...f, types: f.types.filter((v) => v !== value) }
    case 'brand':
      return { ...f, brands: f.brands.filter((v) => v !== value) }
    case 'range':
      return { ...f, ranges: f.ranges.filter((v) => v !== value) }
    case 'speed':
      return { ...f, minSpeed: 0 }
    case 'battery':
      return { ...f, batteries: f.batteries.filter((v) => v !== value) }
    case 'option':
      return { ...f, options: f.options.filter((v) => v !== value) }
    case 'age':
      return { ...f, driverAge: null }
    case 'price':
      return { ...f, priceMin: '', priceMax: '' }
    case 'available':
      return { ...f, onlyAvailable: false }
    default:
      return f
  }
}
