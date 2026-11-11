import Header from './Header'
import Footer from './Footer'

// Спільна обгортка внутрішніх сторінок: шапка + вміст + футер.
export default function PageLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
