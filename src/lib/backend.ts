import { projectId, publicAnonKey } from '../../utils/supabase/info'

export async function backend<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let workspace = localStorage.getItem('skillverse-workspace')
  if (!workspace) {
    workspace = crypto.randomUUID()
    localStorage.setItem('skillverse-workspace', workspace)
  }
  const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6593f319${path}`, {
    method,
    headers: { Authorization: `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json', 'X-Workspace': workspace },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error || `Backend request failed (${response.status}). Deploy the Supabase server function in Make settings.`)
  return result as T
}
