// DOMAIN: сутність «Транспорт» на фронтенді. Без React і без fetch.
export const VehicleType = Object.freeze({ BIKE: 'bike', MOPED: 'moped', SCOOTER: 'scooter' })

export const vehicleTypeLabel = {
  [VehicleType.BIKE]: 'Електровелосипед',
  [VehicleType.MOPED]: 'Електромопед',
  [VehicleType.SCOOTER]: 'Електросамокат',
}

export function createVehicle({ id, type, batteryLevel, status, lat, lng }) {
  return Object.freeze({ id, type, batteryLevel, status, lat, lng })
}

export function getVehicleLabel(vehicle) {
  return vehicleTypeLabel[vehicle.type] ?? 'Транспорт'
}
