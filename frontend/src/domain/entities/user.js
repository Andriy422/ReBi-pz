// DOMAIN: сутність «Користувач».
export const UserRole = Object.freeze({ TENANT: 'tenant', LANDLORD: 'landlord', ADMIN: 'admin' })

export function createUser({ id, name, email, role = UserRole.TENANT, avatarUrl = null }) {
  return Object.freeze({ id, name, email, role, avatarUrl })
}
