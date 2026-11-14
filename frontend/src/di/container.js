// COMPOSITION ROOT: єдине місце, де зв'язуються шари фронтенду.
import * as http from '../infrastructure/http/httpClient'
import { makeHttpVehicleRepository } from '../infrastructure/repositories/httpVehicleRepository'
import { makeHttpVehicleModelRepository } from '../infrastructure/repositories/httpVehicleModelRepository'
import { makeMockAuthRepository } from '../infrastructure/repositories/mockAuthRepository'
import { makeMockCatalogRepository } from '../infrastructure/repositories/mockCatalogRepository'
import { makeMockBookingRepository } from '../infrastructure/repositories/mockBookingRepository'
import { makeGetAvailableVehicles } from '../application/useCases/getAvailableVehicles'
import { makeGetPopularModels } from '../application/useCases/getPopularModels'
import { makeGetCurrentUser, makeSignInWithGoogle, makeSignOut } from '../application/useCases/auth'
import { makeGetCatalog, makeGetCatalogItem } from '../application/useCases/catalog'
import { makeCreateBooking, makeGetBooking, makeGetMyBookings } from '../application/useCases/booking'

const vehicleRepository = makeHttpVehicleRepository({ http })
const vehicleModelRepository = makeHttpVehicleModelRepository({ http })

// Коли бекенд буде готовий, ці три рядки міняються на makeHttp...Repository({ http })
const authRepository = makeMockAuthRepository()
const catalogRepository = makeMockCatalogRepository()
const bookingRepository = makeMockBookingRepository()

export const container = {
  getAvailableVehicles: makeGetAvailableVehicles({ vehicleRepository }),
  getPopularModels: makeGetPopularModels({ vehicleModelRepository }),
  getCurrentUser: makeGetCurrentUser({ authRepository }),
  signInWithGoogle: makeSignInWithGoogle({ authRepository }),
  signOut: makeSignOut({ authRepository }),
  getCatalog: makeGetCatalog({ catalogRepository }),
  getCatalogItem: makeGetCatalogItem({ catalogRepository }),
  createBooking: makeCreateBooking({ bookingRepository }),
  getBooking: makeGetBooking({ bookingRepository }),
  getMyBookings: makeGetMyBookings({ bookingRepository }),
}
