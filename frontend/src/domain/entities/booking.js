// DOMAIN: сутність «Бронювання».
export function createBooking({
  id,
  modelId,
  modelName,
  type,
  start,
  end,
  location,
  accessories = [],
  quote,
  status = 'confirmed',
  createdAt = new Date().toISOString(),
}) {
  return Object.freeze({
    id,
    modelId,
    modelName,
    type,
    start,
    end,
    location,
    accessories: Object.freeze([...accessories]),
    quote,
    status,
    createdAt,
  })
}
