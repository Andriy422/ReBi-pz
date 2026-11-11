// COMPOSITION ROOT: єдине місце, де зв'язуються шари фронтенду.
import * as http from '../infrastructure/http/httpClient'
import { makeHttpVehicleRepository } from '../infrastructure/repositories/httpVehicleRepository'
import { makeHttpVehicleModelRepository } from '../infrastructure/repositories/httpVehicleModelRepository'
import { makeMockAuthRepository } from '../infrastructure/repositories/mockAuthRepository'
import { makeGetAvailableVehicles } from '../application/useCases/getAvailableVehicles'
import { makeGetPopularModels } from '../application/useCases/getPopularModels'
import { makeGetCurrentUser, makeSignInWithGoogle, makeSignOut } from '../application/useCases/auth'

const vehicleRepository = makeHttpVehicleRepository({ http })
const vehicleModelRepository = makeHttpVehicleModelRepository({ http })

// Коли буде готовий вхід на бекенді, замініть цей рядок на makeHttpAuthRepository({ http })
const authRepository = makeMockAuthRepository()

export const container = {
  getAvailableVehicles: makeGetAvailableVehicles({ vehicleRepository }),
  getPopularModels: makeGetPopularModels({ vehicleModelRepository }),
  getCurrentUser: makeGetCurrentUser({ authRepository }),
  signInWithGoogle: makeSignInWithGoogle({ authRepository }),
  signOut: makeSignOut({ authRepository }),
}
