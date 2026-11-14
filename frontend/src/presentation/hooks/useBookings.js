import { useEffect, useState } from 'react'
import { container } from '../../di/container'

export function useBooking(id) {
  const [state, setState] = useState({ id: null, booking: null, error: null })

  useEffect(() => {
    let cancelled = false
    container
      .getBooking(id)
      .then((booking) => {
        if (!cancelled) setState({ id, booking, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ id, booking: null, error })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const loading = state.id !== id
  return { booking: loading ? null : state.booking, loading, error: loading ? null : state.error }
}

export function useMyBookings() {
  const [state, setState] = useState({ bookings: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    container
      .getMyBookings()
      .then((bookings) => {
        if (!cancelled) setState({ bookings, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ bookings: [], loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
