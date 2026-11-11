import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import './ComingSoonPage.css'

// Тимчасова сторінка для розділів, які ще в розробці (каталог, картка транспорту).
export default function ComingSoonPage({ title = 'Розділ у розробці' }) {
  return (
    <PageLayout>
      <section className="soon">
        <h1>{title}</h1>
        <p>Ця сторінка зʼявиться найближчим часом.</p>
        <Link to="/" className="soon__link">
          ← На головну
        </Link>
      </section>
    </PageLayout>
  )
}
