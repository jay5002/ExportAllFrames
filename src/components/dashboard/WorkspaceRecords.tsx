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
  return <section className="sv-card sv-card-pad" aria-busy={loading || saving}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="sv-section-title">Your announcements & grades</h2><p className="sv-meta mt-1">Updates from your instructors. Read status is saved to your account.</p></div>
      <div className="flex gap-2"><button className="sv-btn-secondary" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(current => !current)}>{unreadOnly ? 'Show all' : 'Unread only'}</button><button disabled={loading || saving} onClick={() => void load()} className="sv-btn-secondary">Refresh</button></div>
    </div>
    {loading && <p role="status" className="sv-state mt-4">Loading notifications…</p>}
    {error && <p role="alert" className="sv-alert sv-alert-error mt-4">{error}</p>}
    {!loading && <>
      <div className="mt-4">
      {visible.length === 0 && <p className="sv-empty">{unreadOnly ? 'You’re all caught up.' : 'No announcements yet. Updates from your instructors will appear here.'}</p>}
      {visible.map(message => <article key={message.id} className="border-t border-slate-100 py-4 first:border-t-0">
        <div className="mb-2 flex flex-wrap items-center gap-2"><span className="sv-meta">{message.author} · {message.audience === 'all' ? 'All learners' : message.audience} · {new Date(message.createdAt).toLocaleString()}</span>{!message.read && <span className="sv-badge">New</span>}</div>
        <p className="sv-desc max-w-[75ch] whitespace-pre-wrap text-slate-700">{message.body}</p>
        <button disabled={saving || message.read} className="sv-link mt-2 -ml-2 disabled:text-slate-500" onClick={() => void read(message.id)}>{message.read ? 'Read' : 'Mark as read'}</button>
      </article>)}
      </div>
      <h3 className="sv-section-title mt-6 border-t border-slate-200 pt-6">Your assignment results</h3>
      {!submissions.some(item => item.status === 'Graded') && <p className="sv-desc mt-3">Your grades and instructor feedback will appear here.</p>}
      {submissions.filter(item => item.status === 'Graded').map(item => <article key={item.id} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-slate-900">{item.assignment}</strong><span className="sv-badge sv-badge-success">{item.score}/100</span></div><p className="sv-desc mt-2 whitespace-pre-wrap">{item.feedback || 'No written feedback provided yet.'}</p>
      </article>)}
    </>}
  </section>
}
