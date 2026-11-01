// COMPOSITION ROOT: єдине місце, де зв'язуються шари фронтенду.
import * as http from '../infrastructure/http/httpClient'
import { makeHttpVehicleRepository } from '../infrastructure/repositories/httpVehicleRepository'
import { makeHttpVehicleModelRepository } from '../infrastructure/repositories/httpVehicleModelRepository'
import { makeGetAvailableVehicles } from '../application/useCases/getAvailableVehicles'
import { makeGetPopularModels } from '../application/useCases/getPopularModels'

const vehicleRepository = makeHttpVehicleRepository({ http })
const vehicleModelRepository = makeHttpVehicleModelRepository({ http })

export const container = {
  getAvailableVehicles: makeGetAvailableVehicles({ vehicleRepository }),
  getPopularModels: makeGetPopularModels({ vehicleModelRepository }),
}
