import { useEffect, useState } from 'react'
import { container } from '../../di/container'

export function useCatalog() {
  const [state, setState] = useState({ models: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    container
      .getCatalog()
      .then((models) => {
        if (!cancelled) setState({ models, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ models: [], loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
