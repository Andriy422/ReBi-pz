// DOMAIN: тарифи оренди. Значення поки орієнтовні (з макета Figma),
// пізніше їх віддаватиме API.
export const RentalDuration = Object.freeze({ HOUR: 'hour', DAY: 'day', WEEK: 'week' })

export const durationLabel = {
  [RentalDuration.HOUR]: '1 год',
  [RentalDuration.DAY]: '1 доба',
  [RentalDuration.WEEK]: '1 тиждень',
}

// грн; для самоката година = 7 грн/хв × 60
export const tariffs = {
  bike: { hour: 60, day: 250, week: 1500 },
  scooter: { hour: 7 * 60, day: 180, week: 1000 },
  moped: { hour: 80, day: 300, week: 1800 },
}
