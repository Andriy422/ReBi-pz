const pad = (n) => String(n).padStart(2, '0')

// Date -> рядок для <input type="datetime-local">
export function toLocalInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Початкове вікно бронювання: з найближчої цілої години, на добу
export function defaultBookingWindow() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start.getTime() + 24 * 36e5)
  return { start: toLocalInputValue(start), end: toLocalInputValue(end) }
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
