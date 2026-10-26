import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { backend } from '../../lib/backend'
import type { Profile } from '../../lib/types'

type Auth = { session: Session | null; profile: Profile | null; loading: boolean; error: string; refresh: () => Promise<void>; signOut: () => Promise<void> }
const AuthContext = createContext<Auth | null>(null)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider is required')
  return context
}
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const generation = useRef(0)
  const refresh = useCallback(async () => {
    const request = ++generation.current
    setLoading(true)
    setError('')
    try {
      const { data, error: failure } = await supabase.auth.getSession()
      if (failure) throw failure
      const account = data.session ? await backend<Profile>('/auth/me') : null
      if (request === generation.current) {
        setSession(data.session)
        setProfile(account)
      }
    } catch (failure) {
      if (request === generation.current) {
        setProfile(null)
        setError(failure instanceof Error ? failure.message : 'Unable to load account')
      }
    } finally { if (request === generation.current) setLoading(false) }
  }, [])
  useEffect(() => {
    void refresh()
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      // Leave the Auth callback before calling getSession (avoids its lock).
      window.setTimeout(() => void refresh(), 0)
    })
    return () => { generation.current++; data.subscription.unsubscribe() }
  }, [refresh])
  const signOut = async () => {
    const { error: failure } = await supabase.auth.signOut()
    if (failure) throw failure
    generation.current++
    setSession(null)
    setProfile(null)
    setError('')
    setLoading(false)
  }
  return <AuthContext.Provider value={{ session, profile, loading, error, refresh, signOut }}>{children}</AuthContext.Provider>
}
export function ProtectedRoute({ instructor = false }: { instructor?: boolean }) {
  const { session, profile, loading, error, refresh, signOut } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-page"><p role="status">Opening your workspace…</p></div>
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (error || !profile) return <div className="auth-page"><div className="auth-card"><p role="alert">{error || 'Unable to load your account.'}</p><div className="mt-6 flex gap-4"><button className="sv-button" onClick={() => void refresh()}>Try again</button><button className="sv-link" onClick={() => void signOut().catch(() => supabase.auth.signOut({ scope: 'local' }))}>Back to sign in</button></div></div></div>
  if (instructor && profile.role !== 'instructor') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
