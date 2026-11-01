// INFRASTRUCTURE: реалізація через REST API.
import { createVehicleModel } from '../../domain/entities/vehicleModel'

export function makeHttpVehicleModelRepository({ http }) {
  return {
    async findPopular(limit = 3) {
      const data = await http.getJson(`/api/models/popular?limit=${limit}`)
      return data.map(createVehicleModel)
    },
  }
}
