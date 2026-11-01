// PRESENTATION: хук-міст між React і сценарієм застосунку.
import { useEffect, useState } from 'react'
import { container } from '../../di/container'

export function useAvailableVehicles() {
  const [state, setState] = useState({ vehicles: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    container
      .getAvailableVehicles()
      .then((vehicles) => {
        if (!cancelled) setState({ vehicles, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ vehicles: [], loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
