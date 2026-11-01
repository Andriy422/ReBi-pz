// Юніт-тест сценарію БЕЗ бази даних і без Express — завдяки чистій архітектурі.
const test = require('node:test');
const assert = require('node:assert');
const { Vehicle } = require('../src/domain/entities/Vehicle');
const { ListAvailableVehicles } = require('../src/application/use-cases/ListAvailableVehicles');

const fakeRepo = {
  findAvailable: async () => [
    new Vehicle({ id: 1, type: 'bike', batteryLevel: 95, status: 'available', lat: 49.8, lng: 24.0 }),
    new Vehicle({ id: 2, type: 'moped', batteryLevel: 10, status: 'rented', lat: 49.8, lng: 24.0 }),
  ],
};

test('повертає лише вільний транспорт', async () => {
  const uc = new ListAvailableVehicles({ vehicleRepository: fakeRepo });
  const result = await uc.execute();
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].id, 1);
});

test('сутність відхиляє невідомий тип', () => {
  assert.throws(
    () => new Vehicle({ id: 3, type: 'car', batteryLevel: 50, status: 'available' }),
    /Невідомий тип/
  );
});
