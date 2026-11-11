import Header from '../components/Header'
import Hero from '../components/Hero'
import PopularModels from '../components/PopularModels'
import WhyUs from '../components/WhyUs'
import HowItWorks from '../components/HowItWorks'
import TariffsAndMap from '../components/TariffsAndMap'
import Faq from '../components/Faq'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div id="top">
      <div className="dark-hero">
        <Header dark />
        <Hero />
      </div>
      <PopularModels />
      <WhyUs />
      <HowItWorks />
      <TariffsAndMap />
      <Faq />
      <Footer />
    </div>
  )
}
