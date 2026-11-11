import { Link } from 'react-router-dom'
import './Button.css'

// variant: 'primary' | 'secondary' | 'secondary-dark'
// якщо передано `to`, кнопка стає посиланням (React Router)
export default function Button({ variant = 'primary', to, children, ...props }) {
  const className = `btn btn--${variant}`

  if (to) {
    return (
      <Link className={className} to={to} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={className} {...props}>
      {children}
    </button>
  )
}
