// APPLICATION: сценарій «отримати вільний транспорт».
// Отримує репозиторій ззовні, тож не знає, звідки беруться дані (API, мок, тест).
export function makeGetAvailableVehicles({ vehicleRepository }) {
  return async function getAvailableVehicles() {
    return vehicleRepository.findAvailable()
  }
}
