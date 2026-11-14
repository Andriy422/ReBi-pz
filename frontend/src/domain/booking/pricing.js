// DOMAIN: розрахунок вартості бронювання. Чиста функція без React і API.
export const ACCESSORIES = {
  helmet: { label: 'Додатковий шолом', pricePerDay: 30 },
  phoneHolder: { label: 'Тримач для телефону', pricePerDay: 15 },
  insurance: { label: 'Страховка', pricePerDay: 50 },
}

// Застава залежить від типу транспорту (орієнтовні значення)
export const DEPOSITS = { bike: 1000, scooter: 800, moped: 3000 }

export const MIN_HOURS = 1
export const MAX_DAYS = 30

const invalid = (error) => ({ valid: false, error })

export function calculateQuote(model, { start, end, accessories = [] }) {
  const s = new Date(start)
  const e = new Date(end)

  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
    return invalid('Вкажіть дату й час початку та завершення')
  }
  if (s.getTime() < Date.now() - 5 * 60 * 1000) {
    return invalid('Початок оренди не може бути в минулому')
  }

  const hours = (e - s) / 36e5
  if (hours < MIN_HOURS) return invalid('Оренда має тривати щонайменше 1 годину')
  if (hours > MAX_DAYS * 24) {
    return invalid(`Максимальний термін — ${MAX_DAYS} діб. Для довшого терміну є довгострокова оренда`)
  }

  const days = Math.ceil(hours / 24) // неповна доба рахується як повна
  const paidDays = days - Math.floor(days / 7) // кожна сьома доба безкоштовна
  const rental = paidDays * model.pricePerDay
  const accessoriesTotal = accessories.reduce((sum, key) => sum + (ACCESSORIES[key]?.pricePerDay ?? 0) * days, 0)
  const deposit = DEPOSITS[model.type] ?? 1000

  return {
    valid: true,
    error: null,
    hours,
    days,
    paidDays,
    rental,
    accessoriesTotal,
    deposit,
    total: rental + accessoriesTotal + deposit,
  }
}
