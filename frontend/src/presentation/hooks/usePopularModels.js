import { useEffect, useState } from 'react'
import { container } from '../../di/container'

export function usePopularModels(limit = 3) {
  const [state, setState] = useState({ models: [], loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    container
      .getPopularModels(limit)
      .then((models) => {
        if (!cancelled) setState({ models, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ models: [], loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [limit])

  return state
}
