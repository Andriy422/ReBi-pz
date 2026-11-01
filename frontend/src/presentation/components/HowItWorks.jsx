import './HowItWorks.css'

const steps = ['Обрати транспорт', 'Обрати тип оренди та час', 'Оплатити', 'Отримати та поїхати']

export default function HowItWorks() {
  return (
    <section className="section">
      <header className="section__head">
        <h2>Як це працює</h2>
        <p>Просто 4 кроки до твоєї поїздки</p>
      </header>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s} className="steps__item">
            <span className="steps__num">{i + 1}</span>
            <span className="steps__text">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
