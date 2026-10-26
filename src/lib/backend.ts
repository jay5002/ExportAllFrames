import { projectId, publicAnonKey } from '../../utils/supabase/info'
import { supabase } from './supabase'

export async function backend<T>(path: string, method = 'GET', body?: unknown, anonymous = false): Promise<T> {
  const { data, error } = anonymous ? { data: { session: null }, error: null } : await supabase.auth.getSession()
  if (error) throw error
  if (!anonymous && !data.session) throw new Error('Sign in to continue.')
  let response: Response
  try {
    response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6593f319${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        ...(data.session ? { 'X-Access-Token': data.session.access_token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new Error('Unable to reach SkillVerse. Check your connection and try again.')
  }
  const result = await response.json().catch(() => null)
  if (response.status === 401 && !anonymous) {
    await supabase.auth.signOut({ scope: 'local' })
    throw new Error('Your session has expired. Please sign in again.')
  }
  if (!response.ok) throw new Error(response.status === 404
    ? result?.error || 'This SkillVerse endpoint is unavailable. The latest server function must be deployed.'
    : result?.error || `Unable to complete this request (${response.status}).`)
  return result as T
}
