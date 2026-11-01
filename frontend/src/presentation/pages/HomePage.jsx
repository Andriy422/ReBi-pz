import Header from '../components/Header'
import Hero from '../components/Hero'
import PopularModels from '../components/PopularModels'
import WhyUs from '../components/WhyUs'
import HowItWorks from '../components/HowItWorks'

export default function HomePage() {
  return (
    <>
      <div className="dark-hero">
        <Header dark />
        <Hero />
      </div>
      <PopularModels />
      <WhyUs />
      <HowItWorks />
    </>
  )
}
