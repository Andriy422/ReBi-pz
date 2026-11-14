import { useEffect, useState } from 'react'
import { container } from '../../di/container'

export function useCatalogItem(id) {
  const [state, setState] = useState({ id: null, model: null, error: null })

  useEffect(() => {
    let cancelled = false
    container
      .getCatalogItem(id)
      .then((model) => {
        if (!cancelled) setState({ id, model, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ id, model: null, error })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const loading = state.id !== id
  return { model: loading ? null : state.model, loading, error: loading ? null : state.error }
}
