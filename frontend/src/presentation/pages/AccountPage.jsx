import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { useMyBookings } from '../hooks/useBookings'
import { formatDateTime } from '../utils/datetime'
import './AccountPage.css'

const menu = [
  'Мій профіль',
  'Активні бронювання',
  'Історія замовлень',
  'Платіжні картки',
  'Акції та знижки',
  'Налаштування',
]

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const { bookings, loading } = useMyBookings()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <>
      <Header />
      <div className="account">
        <aside className="account__side">
          <div className="account__profile">
            <span className="account__avatar">{user.name.charAt(0)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>

          <nav className="account__menu">
            {menu.map((item, i) => (
              <button key={item} type="button" className={i === 1 ? 'is-active' : ''}>
                {item}
              </button>
            ))}
          </nav>

          <Button variant="secondary" onClick={handleSignOut}>
            Вийти
          </Button>
        </aside>

        <section className="account__main">
          <h1>Активні бронювання</h1>

          {loading && <p>Завантаження…</p>}

          {!loading && bookings.length === 0 && (
            <div className="account__empty">
              <h2>У вас поки немає бронювань</h2>
              <p>Оберіть транспорт у каталозі й забронюйте його.</p>
              <Button to="/catalog">До каталогу</Button>
            </div>
          )}

          {bookings.map((b) => (
            <article key={b.id} className="booking">
              <div className="booking__photo">фото</div>
              <div className="booking__info">
                <h2>{b.modelName}</h2>
                <p>{b.location}</p>
                <p>
                  {formatDateTime(b.start)} — {formatDateTime(b.end)}
                </p>
                <strong>{b.quote.total} грн · Підтверджено</strong>
              </div>
              <div className="booking__actions">
                <Link className="btn btn--primary" to={`/booking/${b.id}`}>
                  Деталі
                </Link>
              </div>
            </article>
          ))}

          <p className="account__demo">Демо-дані: бронювання зберігаються лише у вашому браузері</p>
        </section>
      </div>
    </>
  )
}
