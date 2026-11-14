// DOMAIN: сутність «Модель каталогу» (те, що фільтруємо й показуємо в каталозі).
export const BatteryType = Object.freeze({ REMOVABLE: 'removable', FIXED: 'fixed' })

export const batteryLabels = {
  removable: 'З’ємний акумулятор',
  fixed: 'Нез’ємний акумулятор',
}

export const optionLabels = {
  rack: 'Багажник',
  childSeat: 'Дитяче крісло',
  secondBattery: 'Другий акумулятор',
  helmet: 'Шолом у комплекті',
  lock: 'Замок / трос',
}

export const rangeLabels = {
  short: 'до 40 км',
  mid: '40–70 км',
  long: '70+ км',
}

export function createCatalogModel({
  id,
  name,
  brand,
  type,
  rangeKm,
  maxSpeedKmh,
  powerW,
  batteryWh,
  maxLoadKg,
  weightKg,
  batteryType,
  options = [],
  minAge,
  pricePerDay,
  popularity = 0,
  available = true,
}) {
  return Object.freeze({
    id,
    name,
    brand,
    type,
    rangeKm,
    maxSpeedKmh,
    powerW,
    batteryWh,
    maxLoadKg,
    weightKg,
    batteryType,
    options: Object.freeze([...options]),
    minAge,
    pricePerDay,
    popularity,
    available,
  })
}
