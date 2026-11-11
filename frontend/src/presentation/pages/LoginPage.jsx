import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './LoginPage.css'

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const redirectTo = location.state?.from?.pathname || '/account'

  // уже увійшли — одразу на потрібну сторінку
  if (!loading && user) return <Navigate to={redirectTo} replace />

  const handleGoogle = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn()
    } catch {
      setError('Не вдалося увійти. Спробуйте ще раз.')
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <Link to="/" className="login__back">
        ← На головну
      </Link>

      <section className="login__card">
        <div className="login__logo">
          <span>Re</span>Bi
        </div>
        <h1>Вхід до ReBi</h1>
        <p className="login__subtitle">Увійдіть через Google, щоб бронювати транспорт і керувати орендою</p>

        <button type="button" className="google-btn" onClick={handleGoogle} disabled={busy}>
          <span className="google-btn__g" aria-hidden="true">
            G
          </span>
          {busy ? 'Входимо…' : 'Продовжити з Google'}
        </button>

        {error && <p className="login__error">{error}</p>}

        <p className="login__legal">
          Продовжуючи, ви погоджуєтесь з Правилами користування та Політикою конфіденційності
        </p>
        <p className="login__demo">Демо-режим: вхід поки без сервера</p>
      </section>
    </main>
  )
}
