// INFRASTRUCTURE: ТИМЧАСОВІ тестові дані каталогу (поки бекенд не віддає каталог).
// Коли буде API, створюється httpCatalogRepository з тими ж методами
// findAll() / findById(id), і в di/container.js міняється один рядок.
import { createCatalogModel } from '../../domain/entities/catalogModel'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const data = [
  { id: 1, name: 'Rider X1', brand: 'Rider', type: 'bike', rangeKm: 70, maxSpeedKmh: 25, powerW: 250, batteryWh: 768, maxLoadKg: 120, weightKg: 22, batteryType: 'removable', options: ['rack', 'helmet'], minAge: 14, pricePerDay: 250, popularity: 95 },
  { id: 2, name: 'Xiaomi 4 Pro', brand: 'Xiaomi', type: 'scooter', rangeKm: 60, maxSpeedKmh: 25, powerW: 350, batteryWh: 446, maxLoadKg: 100, weightKg: 17, batteryType: 'fixed', options: ['helmet'], minAge: 14, pricePerDay: 180, popularity: 90 },
  { id: 3, name: 'FADA R8', brand: 'FADA', type: 'moped', rangeKm: 80, maxSpeedKmh: 45, powerW: 1500, batteryWh: 1440, maxLoadKg: 150, weightKg: 60, batteryType: 'fixed', options: ['rack', 'helmet'], minAge: 16, pricePerDay: 300, popularity: 85 },
  { id: 4, name: 'Lectric XP 2.0', brand: 'Lectric', type: 'bike', rangeKm: 90, maxSpeedKmh: 32, powerW: 500, batteryWh: 672, maxLoadKg: 136, weightKg: 29, batteryType: 'removable', options: ['rack', 'secondBattery', 'helmet', 'lock'], minAge: 14, pricePerDay: 350, popularity: 80 },
  { id: 5, name: 'Kugoo V3', brand: 'Kugoo', type: 'scooter', rangeKm: 60, maxSpeedKmh: 25, powerW: 300, batteryWh: 500, maxLoadKg: 120, weightKg: 15, batteryType: 'fixed', options: ['lock'], minAge: 14, pricePerDay: 160, popularity: 70 },
  { id: 6, name: 'Engwe EP-2', brand: 'Engwe', type: 'bike', rangeKm: 100, maxSpeedKmh: 25, powerW: 250, batteryWh: 624, maxLoadKg: 120, weightKg: 28, batteryType: 'removable', options: ['rack', 'secondBattery'], minAge: 14, pricePerDay: 280, popularity: 65 },
  { id: 7, name: 'Ninebot Max G30', brand: 'Segway', type: 'scooter', rangeKm: 65, maxSpeedKmh: 25, powerW: 350, batteryWh: 367, maxLoadKg: 100, weightKg: 19, batteryType: 'fixed', options: ['lock'], minAge: 14, pricePerDay: 200, popularity: 60 },
  { id: 8, name: 'Himo C20', brand: 'Himo', type: 'bike', rangeKm: 55, maxSpeedKmh: 25, powerW: 250, batteryWh: 360, maxLoadKg: 120, weightKg: 28, batteryType: 'removable', options: ['rack', 'childSeat'], minAge: 14, pricePerDay: 230, popularity: 55 },
  { id: 9, name: 'Yadea C1S', brand: 'Yadea', type: 'moped', rangeKm: 60, maxSpeedKmh: 45, powerW: 1200, batteryWh: 1200, maxLoadKg: 150, weightKg: 55, batteryType: 'removable', options: ['rack', 'helmet'], minAge: 16, pricePerDay: 320, popularity: 50 },
  { id: 10, name: 'Kirin M4 Pro', brand: 'Kugoo', type: 'scooter', rangeKm: 40, maxSpeedKmh: 45, powerW: 500, batteryWh: 750, maxLoadKg: 120, weightKg: 23, batteryType: 'fixed', options: ['helmet'], minAge: 16, pricePerDay: 220, popularity: 45 },
  { id: 11, name: 'Samebike LO26', brand: 'Samebike', type: 'bike', rangeKm: 35, maxSpeedKmh: 32, powerW: 500, batteryWh: 720, maxLoadKg: 150, weightKg: 31, batteryType: 'removable', options: ['rack'], minAge: 14, pricePerDay: 260, popularity: 40, available: false },
  { id: 12, name: 'Cyber CM-1', brand: 'Cyber', type: 'moped', rangeKm: 90, maxSpeedKmh: 50, powerW: 2000, batteryWh: 2160, maxLoadKg: 150, weightKg: 62, batteryType: 'removable', options: ['secondBattery', 'rack'], minAge: 16, pricePerDay: 380, popularity: 35 },
]

const models = data.map(createCatalogModel)

export function makeMockCatalogRepository() {
  return {
    async findAll() {
      await delay(400)
      return models
    },
    async findById(id) {
      await delay(200)
      return models.find((m) => m.id === Number(id)) ?? null
    },
  }
}
