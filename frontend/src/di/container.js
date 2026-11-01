// COMPOSITION ROOT: єдине місце, де зв'язуються шари фронтенду.
import * as http from '../infrastructure/http/httpClient'
import { makeHttpVehicleRepository } from '../infrastructure/repositories/httpVehicleRepository'
import { makeGetAvailableVehicles } from '../application/useCases/getAvailableVehicles'

const vehicleRepository = makeHttpVehicleRepository({ http })

export const container = {
  getAvailableVehicles: makeGetAvailableVehicles({ vehicleRepository }),
}
