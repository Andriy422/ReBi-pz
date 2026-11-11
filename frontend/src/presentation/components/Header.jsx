import { Link } from 'react-router-dom'
import Button from './Button'
import { useAuth } from '../hooks/useAuth'
import './Header.css'

const links = [
  { label: 'Каталог', to: '/#catalog' },
  { label: 'Тарифи', to: '/#tariffs' },
  { label: 'Карта', to: '/#map' },
  { label: 'Про нас', to: '/#about' },
  { label: 'Питання', to: '/#faq' },
  { label: 'Контакти', to: '/#contacts' },
]

export default function Header({ dark = false }) {
  const { user } = useAuth()
  const secondary = dark ? 'secondary-dark' : 'secondary'

  return (
    <header className={`header ${dark ? 'header--dark' : ''}`}>
      <Link to="/" className="header__logo">
        <span>Re</span>Bi
      </Link>

      <nav className="header__nav">
        {links.map((l) => (
          <Link key={l.label} to={l.to}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="header__actions">
        <span className="header__lang">UA | EN</span>
        {user ? (
          <Button to="/account" variant={secondary}>
            {user.name}
          </Button>
        ) : (
          <Button to="/login" variant={secondary}>
            Увійти
          </Button>
        )}
        <Button to="/catalog">Забронювати</Button>
      </div>
    </header>
  )
}
