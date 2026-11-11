// INFRASTRUCTURE: ТИМЧАСОВА заглушка авторизації (поки бекенд без Google-входу).
// Коли колега зробить API, створюється httpAuthRepository з тими ж трьома методами,
// і в di/container.js міняється один рядок.
import { createUser } from '../../domain/entities/user'

const STORAGE_KEY = 'rebi.mockUser'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const demoUser = createUser({
  id: 1,
  name: 'Іван Петренко',
  email: 'ivan@example.com',
  role: 'tenant',
})

export function makeMockAuthRepository() {
  return {
    async getCurrentUser() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? createUser(JSON.parse(raw)) : null
      } catch {
        return null
      }
    },

    async signInWithGoogle() {
      await delay(600)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser))
      return demoUser
    },

    async signOut() {
      localStorage.removeItem(STORAGE_KEY)
    },
  }
}
