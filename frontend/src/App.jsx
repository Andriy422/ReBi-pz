import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './presentation/context/AuthProvider'
import ScrollToHash from './presentation/components/ScrollToHash'
import ProtectedRoute from './presentation/components/ProtectedRoute'
import HomePage from './presentation/pages/HomePage'
import LoginPage from './presentation/pages/LoginPage'
import AccountPage from './presentation/pages/AccountPage'
import ComingSoonPage from './presentation/pages/ComingSoonPage'
import NotFoundPage from './presentation/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="/catalog" element={<ComingSoonPage title="Каталог" />} />
          <Route path="/catalog/:id" element={<ComingSoonPage title="Картка транспорту" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
