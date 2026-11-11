import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Пускає на сторінку лише авторизованого користувача.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p style={{ padding: 48 }}>Завантаження…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}
