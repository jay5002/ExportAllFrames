import { useEffect, useState } from 'react'
import { backend } from '../../lib/backend'
import type { Submission } from '../../lib/types'

type Message = { id: string; author: string; audience: string; body: string; createdAt: string; read: boolean }

export default function WorkspaceRecords() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unreadOnly, setUnreadOnly] = useState(false)
  async function load() {
    setLoading(true); setError('')
    try {
      const [workspace, inbox] = await Promise.all([
        backend<{ submissions: Submission[] }>('/workspace?view=learning'),
        backend<Message[]>('/messages'),
      ])
      setSubmissions(workspace.submissions); setMessages(inbox)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load notifications') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function read(id: string) {
    if (saving) return
    setSaving(true); setError('')
    try {
      const updated = await backend<Message>(`/messages/${id}`, 'PUT', {})
      setMessages(current => current.map(item => item.id === updated.id ? updated : item))
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to mark announcement as read') }
    finally { setSaving(false) }
  }
  const visible = messages.filter(item => !unreadOnly || !item.read)
  return <section className="rounded-2xl border border-blue-100 bg-white p-5 text-slate-700" aria-busy={loading || saving}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-base font-bold text-blue-950">Your announcements & grades</h2>
      <div className="flex gap-4"><button className="sv-link" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(current => !current)}>{unreadOnly ? 'Show all' : 'Unread only'}</button><button disabled={loading || saving} onClick={() => void load()} className="sv-link">Refresh</button></div>
    </div>
    <p className="mb-3 text-xs text-slate-500">Updates from your instructors. Read status is saved to your account.</p>
    {loading && <p role="status" className="text-sm">Loading notifications…</p>}
    {error && <p role="alert" className="sv-alert sv-alert-error">{error}</p>}
    {!loading && <>
      {visible.length === 0 && <p className="py-4 text-sm text-slate-400">{unreadOnly ? 'You’re all caught up.' : 'No announcements yet. Updates from your instructors will appear here.'}</p>}
      {visible.map(message => <article key={message.id} className="border-t border-blue-50 py-4">
        <div className="mb-2 text-xs text-slate-400">{message.author} · {message.audience === 'all' ? 'All learners' : message.audience} · {new Date(message.createdAt).toLocaleString()}</div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
        <button disabled={saving || message.read} className="sv-link mt-3 disabled:text-slate-400" onClick={() => void read(message.id)}>{message.read ? 'Read' : 'Mark as read'}</button>
      </article>)}
      <h3 className="mt-5 text-sm font-bold">Your assignment results</h3>
      {!submissions.some(item => item.status === 'Graded') && <p className="mt-3 text-sm text-slate-400">Your grades and instructor feedback will appear here.</p>}
      {submissions.filter(item => item.status === 'Graded').map(item => <article key={item.id} className="mt-3 border-t border-blue-50 py-4 text-sm">
        <strong>{item.assignment} · {item.score}/100</strong><p className="mt-2 whitespace-pre-wrap text-slate-500">{item.feedback || 'No written feedback provided yet.'}</p>
      </article>)}
    </>}
  </section>
}
