// INFRASTRUCTURE: реалізація порту VehicleRepository через Postgres.
const { VehicleRepository } = require('../../domain/repositories/VehicleRepository');
const { Vehicle } = require('../../domain/entities/Vehicle');

class PgVehicleRepository extends VehicleRepository {
  constructor({ database }) {
    super();
    this.database = database;
  }

  async findAvailable() {
    const { rows } = await this.database.query(
      "SELECT id, type, battery_level, status, lat, lng FROM vehicles WHERE status = 'available' ORDER BY id"
    );
    return rows.map(
      (r) =>
        new Vehicle({
          id: r.id,
          type: r.type,
          batteryLevel: r.battery_level,
          status: r.status,
          lat: r.lat === null ? null : Number(r.lat),
          lng: r.lng === null ? null : Number(r.lng),
        })
    );
  }
}

module.exports = { PgVehicleRepository };
