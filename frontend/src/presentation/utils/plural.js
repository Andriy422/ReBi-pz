// Відмінювання числівників
function pick(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export const pluralModels = (n) => pick(n, 'модель', 'моделі', 'моделей')
export const pluralDays = (n) => pick(n, 'доба', 'доби', 'діб')
