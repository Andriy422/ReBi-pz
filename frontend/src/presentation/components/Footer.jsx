import './Footer.css'

const columns = [
  ['Навігація', ['Каталог', 'Тарифи', 'Карта', 'Про нас']],
  ['Підтримка', ['Група обслуговування', 'FAQ', 'Повернення']],
  ['Документи', ['Договір оферти', 'Політика конфіденційності', 'Правила користування']],
]

export default function Footer() {
  return (
    <footer id="contacts" className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <span>Re</span>Bi
          </div>
          <p>Більше ніж оренда — це свобода руху.</p>
        </div>

        {columns.map(([title, links]) => (
          <div key={title} className="footer__col">
            <h4>{title}</h4>
            <ul>
              {links.map((l) => (
                <li key={l}>
                  <a href="#">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer__bottom">
        <span>© 2026 ReBi. Всі права захищені.</span>
        <span>м. Львів</span>
      </div>
    </footer>
  )
}
