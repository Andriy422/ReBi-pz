const { VehicleModelRepository } = require('../../domain/repositories/VehicleModelRepository');
const { VehicleModel } = require('../../domain/entities/VehicleModel');

class PgVehicleModelRepository extends VehicleModelRepository {
  constructor({ database }) {
    super();
    this.database = database;
  }

  async findPopular(limit) {
    const { rows } = await this.database.query(
      `SELECT id, name, type, range_km, max_speed_kmh, power_w, price_per_day, is_popular
       FROM vehicle_models
       WHERE is_popular = TRUE
       ORDER BY id
       LIMIT $1`,
      [limit]
    );
    return rows.map(
      (r) =>
        new VehicleModel({
          id: r.id,
          name: r.name,
          type: r.type,
          rangeKm: r.range_km,
          maxSpeedKmh: r.max_speed_kmh,
          powerW: r.power_w,
          pricePerDay: r.price_per_day,
          isPopular: r.is_popular,
        })
    );
  }
}

module.exports = { PgVehicleModelRepository };
