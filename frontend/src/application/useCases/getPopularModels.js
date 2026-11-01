// APPLICATION: сценарій «отримати популярні моделі».
export function makeGetPopularModels({ vehicleModelRepository }) {
  return async function getPopularModels(limit = 3) {
    return vehicleModelRepository.findPopular(limit)
  }
}
