import { useState } from 'react'
import './Faq.css'

const items = [
  ['Які правила безпеки?', 'Їдьте в шоломі, дотримуйтесь правил дорожнього руху та не перевищуйте швидкість, зазначену в характеристиках транспорту.'],
  ['Чи потрібна застава?', 'Так, застава блокується на картці й повертається після здачі транспорту без пошкоджень.'],
  ['Що робити при поломці?', 'Зупиніться в безпечному місці й зверніться до підтримки 24/7, ми допоможемо.'],
  ['Що робити при розрядці?', 'Напишіть у підтримку: підкажемо найближчу точку, де можна замінити акумулятор.'],
]

export default function Faq() {
  const [open, setOpen] = useState(null)

  return (
    <section id="faq" className="section">
      <header className="section__head">
        <h2>Часті запитання</h2>
        <p>Правила безпеки, застава, що робити при поломці</p>
      </header>

      <div className="faq">
        {items.map(([question, answer], i) => {
          const isOpen = open === i
          return (
            <div key={question} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="faq__question"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{question}</span>
                <span className="faq__icon">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <p className="faq__answer">{answer}</p>}
            </div>
          )
        })}
      </div>
    </section>
  )
}
