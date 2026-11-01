// INFRASTRUCTURE: реалізація порту через REST API бекенду.
import { createVehicle } from '../../domain/entities/vehicle'

export function makeHttpVehicleRepository({ http }) {
  return {
    async findAvailable() {
      const data = await http.getJson('/api/vehicles')
      return data.map(createVehicle)
    },
  }
}
