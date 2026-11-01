import Header from '../components/Header'
import Hero from '../components/Hero'
import AvailableVehicles from '../components/AvailableVehicles'

export default function HomePage() {
  return (
    <>
      <div className="dark-hero">
        <Header dark />
        <Hero />
      </div>
      <AvailableVehicles />
    </>
  )
}
