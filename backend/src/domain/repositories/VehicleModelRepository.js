// DOMAIN: порт сховища моделей.
class VehicleModelRepository {
  /** @returns {Promise<import('../entities/VehicleModel').VehicleModel[]>} */
  async findPopular(limit) {
    throw new Error('Not implemented');
  }
}

module.exports = { VehicleModelRepository };
