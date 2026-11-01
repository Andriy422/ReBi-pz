// DOMAIN: сутність «Модель транспорту» (те, що показуємо в каталозі).
const MODEL_TYPES = ['bike', 'moped', 'scooter'];

class VehicleModel {
  constructor({ id, name, type, rangeKm, maxSpeedKmh, powerW, pricePerDay, isPopular }) {
    if (!name) throw new Error('Назва моделі обовʼязкова');
    if (!MODEL_TYPES.includes(type)) throw new Error(`Невідомий тип моделі: ${type}`);
    if (pricePerDay < 0) throw new Error('Ціна не може бути відʼємною');
    this.id = id;
    this.name = name;
    this.type = type;
    this.rangeKm = rangeKm;
    this.maxSpeedKmh = maxSpeedKmh;
    this.powerW = powerW;
    this.pricePerDay = pricePerDay;
    this.isPopular = Boolean(isPopular);
  }
}

module.exports = { VehicleModel, MODEL_TYPES };
