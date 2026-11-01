import Button from './Button'
import './Header.css'

const links = ['Каталог', 'Тарифи', 'Карта', 'Про нас', 'Блог', 'Контакти']

export default function Header({ dark = false }) {
  return (
    <header className={`header ${dark ? 'header--dark' : ''}`}>
      <a href="/" className="header__logo">
        <span>Re</span>Bi
      </a>

      <nav className="header__nav">
        {links.map((l) => (
          <a key={l} href="#">
            {l}
          </a>
        ))}
      </nav>

      <div className="header__actions">
        <span className="header__lang">UA | EN</span>
        <Button variant={dark ? 'secondary-dark' : 'secondary'}>Увійти</Button>
        <Button>Забронювати</Button>
      </div>
    </header>
  )
}
