// INFRASTRUCTURE: ТИМЧАСОВЕ сховище бронювань у браузері (localStorage).
// Коли бекенд матиме API бронювань, створюється httpBookingRepository
// з тими ж методами create / findById / findAll, і міняється один рядок у di/container.js.
import { createBooking } from '../../domain/entities/booking'

const KEY = 'rebi.mockBookings'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export function makeMockBookingRepository() {
  return {
    async create(booking) {
      await delay(500)
      const saved = createBooking({ ...booking, id: Date.now().toString(36) })
      localStorage.setItem(KEY, JSON.stringify([saved, ...read()]))
      return saved
    },
    async findById(id) {
      await delay(150)
      return read().find((b) => b.id === id) ?? null
    },
    async findAll() {
      await delay(150)
      return read()
    },
  }
}
