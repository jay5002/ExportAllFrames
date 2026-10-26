import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { backend } from '../../lib/backend'
import { useAuth } from './AuthProvider'

function FieldIcon({ kind }: { kind: 'mail' | 'lock' | 'eye' | 'eye-off' | 'user' }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'mail' ? <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></> :
      kind === 'lock' ? <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></> :
      kind === 'user' ? <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> :
      <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{kind === 'eye-off' && <path d="m3 21 18-18" />}</>}
  </svg>
}
export default function AuthPage({ mode = 'login' }: { mode?: 'login' | 'signup' | 'forgot' | 'reset' }) {
  const { profile, loading, refresh, error: accountError, session, signOut } = useAuth()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [role, setRole] = useState<'student' | 'instructor'>('student')
  const [resetDone, setResetDone] = useState(false)
  if (profile && !loading && mode !== 'reset') {
    const from = location.state?.from
    const destination = typeof from === 'string' && from !== '/' && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : profile.role === 'instructor' ? '/instructor' : '/dashboard'
    return <Navigate to={destination} replace />
  }
  const title = mode === 'signup' ? 'Start your journey' : mode === 'forgot' ? 'Forgot password?' : mode === 'reset' ? 'A fresh start' : 'Welcome Back'
  const subtitle = mode === 'signup' ? 'A world of learning starts with one account.' : mode === 'forgot' ? "We’ll send you a link to reset your password." : mode === 'reset' ? 'Choose a new password for your SkillVerse account.' : 'Sign in to continue your learning journey with SkillVerse.'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') || '').trim()
    const password = String(data.get('password') || '')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await refresh()
      } else if (mode === 'signup') {
        const result = await backend<{ message: string }>('/auth/register', 'POST', { email, password, name: data.get('name'), role, redirectTo: `${window.location.origin}/login` }, true)
        setNotice(result.message)
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
        if (error) throw error
        setNotice('If an account exists for this email, a reset link is on its way. Please check your inbox.')
      } else {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        await supabase.auth.signOut()
        setResetDone(true)
        setNotice('Your password has been updated. Sign in with your new password.')
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to continue. Please try again.')
    } finally { setBusy(false) }
  }
  return <main className="auth-page">
    <div className="auth-orbit auth-orbit-one" aria-hidden="true" /><div className="auth-orbit auth-orbit-two" aria-hidden="true" />
    <section className="auth-card" aria-labelledby="auth-title">
      <Link className="auth-brand" to="/login" aria-label="SkillVerse home">Skill<span>Verse</span></Link>
      <div className="auth-heading"><h1 id="auth-title">{title}</h1><p>{subtitle}</p></div>
      {error && <div className="sv-alert sv-alert-error" role="alert">{error}</div>}
      {accountError && session && <div className="sv-alert sv-alert-error" role="alert">{accountError}<div className="mt-3 flex gap-4"><button type="button" className="sv-link" disabled={loading} onClick={() => void refresh()}>Retry connection</button><button type="button" className="sv-link" onClick={() => void signOut().catch(() => setError('Unable to sign out. Please try again.'))}>Sign out</button></div></div>}
      {notice && <div className="sv-alert sv-alert-success" role="status">{notice}</div>}
      {!resetDone && <form onSubmit={submit} className="auth-form" aria-busy={busy}>
        {mode === 'signup' && <label className="auth-label">Full name<div className="auth-input-wrap"><FieldIcon kind="user" /><input name="name" autoComplete="name" placeholder="Enter your full name" maxLength={100} required /></div></label>}
        {mode !== 'reset' && <label className="auth-label">Email address<div className="auth-input-wrap"><FieldIcon kind="mail" /><input name="email" type="email" autoComplete="email" placeholder="Enter your email" maxLength={254} required /></div></label>}
        {mode !== 'forgot' && <label className="auth-label">Password<div className="auth-input-wrap"><FieldIcon kind="lock" /><input name="password" type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'} minLength={mode === 'login' ? 1 : 10} maxLength={128} required /><button type="button" className="auth-eye" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(value => !value)}><FieldIcon kind={visible ? 'eye' : 'eye-off'} /></button></div>{mode !== 'login' && <span className="auth-hint">Use at least 10 characters.</span>}</label>}
        {mode === 'signup' && <fieldset className="auth-roles"><legend>I’m here to</legend><div>{(['student', 'instructor'] as const).map(value => <label key={value} className={role === value ? 'auth-role is-selected' : 'auth-role'}><input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} /><span>{value === 'student' ? 'Learn as a Student' : 'Teach as an Instructor'}</span></label>)}</div></fieldset>}
        {mode === 'login' && <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : mode === 'reset' ? 'Update Password' : 'Sign In'}</button>
      </form>}
      {mode === 'login' ? <><div className="auth-divider"><span>OR</span></div><p className="auth-footer">Don’t have an account? <Link to="/signup">Create an account</Link></p></> :
        <p className="auth-footer auth-footer-spaced">{mode === 'signup' ? 'Already have an account? ' : ''}<Link to="/login">Back to sign in</Link></p>}
    </section>
    <p className="auth-bottom">Your next chapter starts here.</p>
  </main>
}
