// DOMAIN: сутність «Модель транспорту» на фронтенді.
export function createVehicleModel({ id, name, type, rangeKm, maxSpeedKmh, powerW, pricePerDay, isPopular }) {
  return Object.freeze({ id, name, type, rangeKm, maxSpeedKmh, powerW, pricePerDay, isPopular })
}
