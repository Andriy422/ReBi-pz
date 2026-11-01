// DOMAIN: сутність «Транспорт». Нічого не знає про Express, Postgres чи HTTP.
const VEHICLE_TYPES = ['bike', 'moped'];
const VEHICLE_STATUSES = ['available', 'rented', 'booked', 'maintenance', 'retired'];

class Vehicle {
  constructor({ id, type, batteryLevel, status, lat, lng }) {
    if (!VEHICLE_TYPES.includes(type)) {
      throw new Error(`Невідомий тип транспорту: ${type}`);
    }
    if (!VEHICLE_STATUSES.includes(status)) {
      throw new Error(`Невідомий статус транспорту: ${status}`);
    }
    if (batteryLevel < 0 || batteryLevel > 100) {
      throw new Error('Рівень заряду має бути від 0 до 100');
    }
    this.id = id;
    this.type = type;
    this.batteryLevel = batteryLevel;
    this.status = status;
    this.lat = lat;
    this.lng = lng;
  }

  isAvailable() {
    return this.status === 'available';
  }
}

module.exports = { Vehicle, VEHICLE_TYPES, VEHICLE_STATUSES };
