const test = require('node:test');
const assert = require('node:assert');
const { VehicleModel } = require('../src/domain/entities/VehicleModel');
const { ListPopularModels } = require('../src/application/use-cases/ListPopularModels');

test('передає ліміт у репозиторій і повертає моделі', async () => {
  let receivedLimit = null;
  const repo = {
    findPopular: async (limit) => {
      receivedLimit = limit;
      return [new VehicleModel({ id: 1, name: 'Rider X1', type: 'bike', pricePerDay: 250, isPopular: true })];
    },
  };
  const result = await new ListPopularModels({ vehicleModelRepository: repo }).execute({ limit: 3 });
  assert.strictEqual(receivedLimit, 3);
  assert.strictEqual(result[0].name, 'Rider X1');
});

test('модель відхиляє відʼємну ціну', () => {
  assert.throws(
    () => new VehicleModel({ id: 2, name: 'X', type: 'bike', pricePerDay: -1 }),
    /Ціна/
  );
});
