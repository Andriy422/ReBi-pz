import { useState } from 'react'
import './Gallery.css'

export default function Gallery({ title }) {
  const [active, setActive] = useState(0)

  return (
    <div className="gallery">
      <div className="gallery__main">
        {title} · ракурс {active + 1}
      </div>
      <div className="gallery__thumbs">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            className={i === active ? 'is-active' : ''}
            onClick={() => setActive(i)}
            aria-label={`Ракурс ${i + 1}`}
          >
            ракурс {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
