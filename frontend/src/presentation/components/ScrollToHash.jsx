import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Після переходу: прокручує до якоря (#catalog) або на початок сторінки.
export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash, key])

  return null
}
