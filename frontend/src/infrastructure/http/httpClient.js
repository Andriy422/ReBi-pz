// INFRASTRUCTURE: низькорівневий HTTP-клієнт.
export async function getJson(path) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Помилка запиту: ${response.status}`)
  }
  return response.json()
}
