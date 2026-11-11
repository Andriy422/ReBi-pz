// APPLICATION: розрахунок вартості оренди за тарифами.
import { tariffs } from '../../domain/entities/tariff'

export function calculateRentalPrice({ vehicleType, duration }) {
  const table = tariffs[vehicleType]
  if (!table || table[duration] === undefined) {
    throw new Error('Невідомий тип транспорту або тривалість')
  }
  const price = table[duration]
  // правило: година не може коштувати дорожче за добу
  return duration === 'hour' ? Math.min(price, table.day) : price
}

export function getStartingPrice(vehicleType) {
  return tariffs[vehicleType].day
}
