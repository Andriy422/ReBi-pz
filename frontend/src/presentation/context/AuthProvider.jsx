import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { container } from '../../di/container'

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, loading: true })

  useEffect(() => {
    let cancelled = false
    container
      .getCurrentUser()
      .then((user) => {
        if (!cancelled) setState({ user, loading: false })
      })
      .catch(() => {
        if (!cancelled) setState({ user: null, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async () => {
    const user = await container.signInWithGoogle()
    setState({ user, loading: false })
    return user
  }, [])

  const signOut = useCallback(async () => {
    await container.signOut()
    setState({ user: null, loading: false })
  }, [])

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
