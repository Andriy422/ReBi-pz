import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './presentation/context/AuthProvider'
import ScrollToHash from './presentation/components/ScrollToHash'
import ProtectedRoute from './presentation/components/ProtectedRoute'
import HomePage from './presentation/pages/HomePage'
import LoginPage from './presentation/pages/LoginPage'
import AccountPage from './presentation/pages/AccountPage'
import CatalogPage from './presentation/pages/CatalogPage'
import VehiclePage from './presentation/pages/VehiclePage'
import BookingSuccessPage from './presentation/pages/BookingSuccessPage'
import NotFoundPage from './presentation/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:id" element={<VehiclePage />} />
          <Route
            path="/booking/:id"
            element={
              <ProtectedRoute>
                <BookingSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
