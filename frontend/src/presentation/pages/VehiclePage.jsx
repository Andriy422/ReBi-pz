import { Link, useParams } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import Button from '../components/Button'
import Gallery from '../components/vehicle/Gallery'
import SpecsCard from '../components/vehicle/SpecsCard'
import BookingForm from '../components/vehicle/BookingForm'
import { useCatalogItem } from '../hooks/useCatalogItem'
import { vehicleTypeLabel } from '../../domain/entities/vehicle'
import './VehiclePage.css'

export default function VehiclePage() {
  const { id } = useParams()
  const { model, loading, error } = useCatalogItem(id)

  return (
    <PageLayout>
      <div className="vehicle">
        <nav className="vehicle__crumbs">
          <Link to="/catalog">Каталог</Link> / <span>{model ? model.name : '…'}</span>
        </nav>

        {loading && <p className="vehicle__note">Завантаження…</p>}
        {error && <p className="vehicle__note vehicle__note--error">Не вдалося завантажити модель</p>}

        {!loading && !error && !model && (
          <div className="vehicle__empty">
            <h1>Модель не знайдено</h1>
            <Button to="/catalog">До каталогу</Button>
          </div>
        )}

        {model && (
          <>
            <div className="vehicle__grid">
              <Gallery title={model.name} />

              <div className="vehicle__info">
                <span className="vehicle__type">{vehicleTypeLabel[model.type]}</span>
                <h1>{model.name}</h1>
                <p className="vehicle__price">від {model.pricePerDay} грн/день</p>
                <SpecsCard model={model} />
                <BookingForm model={model} />
              </div>
            </div>

            <section className="vehicle__req">
              <h2>Вимоги до водія</h2>
              <p>Для цієї моделі: вік від {model.minAge} років.</p>
              <p>Електровелосипед — від 14 років · Електромопед — від 16 років · До 60 Вт посвідчення водія не потрібне.</p>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  )
}
