import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import './Hero.css'

const benefits = [
  ['Нові акумулятори', 'надійна техніка'],
  ['Підтримка 24/7', 'завжди на зв’язку'],
  ['Ціни нижчі', 'ніж у конкурентів'],
]

export default function Hero() {
  const navigate = useNavigate()
  const [type, setType] = useState('bike')

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate(`/catalog?type=${type}`)
  }

  return (
    <section className="hero">
      <h1 className="hero__title">
        Електротранспорт для твоїх пригод <span>у Львові</span>
      </h1>
      <p className="hero__subtitle">
        Орендуй електровелосипед, електросамокат або електромопед — швидко, зручно, вигідно.
      </p>

      <form className="search" onSubmit={handleSubmit}>
        <label className="search__field">
          <span>Що орендувати?</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="bike">Велосипед</option>
            <option value="moped">Мопед</option>
            <option value="scooter">Самокат</option>
          </select>
        </label>
        <label className="search__field">
          <span>Дата та час</span>
          <input type="datetime-local" />
        </label>
        <label className="search__field">
          <span>Локація</span>
          <select defaultValue="">
            <option value="" disabled>
              Оберіть локацію
            </option>
            <option>Центр</option>
          </select>
        </label>
        <Button type="submit">Знайти</Button>
      </form>

      <ul className="hero__benefits">
        {benefits.map(([title, sub]) => (
          <li key={title}>
            <span className="hero__dot" />
            <div>
              <strong>{title}</strong>
              <small>{sub}</small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
