import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
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

          <article className="booking">
            <div className="booking__photo">фото</div>
            <div className="booking__info">
              <h2>Електровелосипед Rider X1</h2>
              <p>Центр, вул. Староєврейська, 12</p>
              <strong>Залишилось: 5:30:17</strong>
            </div>
            <div className="booking__actions">
              <Button>Продовжити оренду</Button>
              <Button variant="secondary">Підтримка</Button>
            </div>
          </article>

          <p className="account__demo">Демо-дані: справжні бронювання зʼявляться після підключення бекенда</p>
        </section>
      </div>
    </>
  )
}
