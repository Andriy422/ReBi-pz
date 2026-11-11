import Icon from './Icon'
import './WhyUs.css'

const items = [
  ['bolt', 'Нові акумулятори', 'Перевірена техніка та великий запас ходу'],
  ['clock', 'Підтримка 24/7', 'Допоможемо при поломці чи розрядці'],
  ['tag', 'Вигідна ціна', 'На рівні ринку або трохи нижче на старті'],
]

export default function WhyUs() {
  return (
    <section id="about" className="section">
      <header className="section__head">
        <h2>Чому саме ми</h2>
        <p>Надійний транспорт і чесні ціни</p>
      </header>
      <div className="why__grid">
        {items.map(([icon, title, text]) => (
          <article key={title} className="why__card">
            <span className="why__icon">
              <Icon name={icon} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
