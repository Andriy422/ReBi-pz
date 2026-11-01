import './Button.css'

// variant: 'primary' | 'secondary' | 'secondary-dark'
export default function Button({ variant = 'primary', children, ...props }) {
  return (
    <button className={`btn btn--${variant}`} {...props}>
      {children}
    </button>
  )
}
