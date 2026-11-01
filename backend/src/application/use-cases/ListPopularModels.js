// APPLICATION: сценарій «показати популярні моделі».
class ListPopularModels {
  constructor({ vehicleModelRepository }) {
    this.vehicleModelRepository = vehicleModelRepository;
  }

  async execute({ limit = 3 } = {}) {
    return this.vehicleModelRepository.findPopular(limit);
  }
}

module.exports = { ListPopularModels };
