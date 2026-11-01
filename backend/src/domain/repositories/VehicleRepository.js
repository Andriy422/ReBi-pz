// DOMAIN: «порт» — договір, який має виконати будь-яке сховище транспорту.
// Domain і Application залежать тільки від цього договору, а не від Postgres.
class VehicleRepository {
  /** @returns {Promise<import('../entities/Vehicle').Vehicle[]>} */
  async findAvailable() {
    throw new Error('Not implemented');
  }
}

module.exports = { VehicleRepository };
