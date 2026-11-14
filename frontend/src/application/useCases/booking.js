// APPLICATION: сценарії бронювання.
import { calculateQuote } from '../../domain/booking/pricing'
import { createBooking } from '../../domain/entities/booking'

// «Розрахувати вартість» (чиста функція, викликається під час заповнення форми)
export function quoteBooking(model, input) {
  return calculateQuote(model, input)
}

export function makeCreateBooking({ bookingRepository }) {
  return async function createBookingUseCase({ model, input }) {
    const quote = calculateQuote(model, input)
    if (!quote.valid) throw new Error(quote.error)

    const booking = createBooking({
      id: null,
      modelId: model.id,
      modelName: model.name,
      type: model.type,
      start: new Date(input.start).toISOString(),
      end: new Date(input.end).toISOString(),
      location: input.location,
      accessories: input.accessories,
      quote,
    })
    return bookingRepository.create(booking)
  }
}

export function makeGetBooking({ bookingRepository }) {
  return (id) => bookingRepository.findById(id)
}

export function makeGetMyBookings({ bookingRepository }) {
  return () => bookingRepository.findAll()
}
