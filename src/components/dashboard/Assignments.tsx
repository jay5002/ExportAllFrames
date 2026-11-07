import { useEffect, useState, type FormEvent } from 'react'
import { backend } from '../../lib/backend'
import type { Assignment } from '../../lib/types'

function status(item: Assignment) {
  if (item.submission) return item.submission.status === 'Graded' ? 'Graded' : 'Submitted'
  return Date.parse(item.dueDate) + (item.dueDate.includes('T') ? 0 : 86400000) < Date.now() ? 'Overdue' : 'Pending'
}
export default function Assignments() {
  const [items, setItems] = useState<Assignment[]>([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { setItems(await backend<Assignment[]>('/assignments')) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load assignments') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function submit(event: FormEvent<HTMLFormElement>, item: Assignment) {
    event.preventDefault()
    if (saving) return
    const content = new FormData(event.currentTarget).get('content')
    setSaving(true); setError('')
    try {
      const submission = await backend<NonNullable<Assignment['submission']>>(`/assignments/${item.id}/submit`, 'POST', { content })
      setItems(current => current.map(record => record.id === item.id ? { ...record, submission } : record))
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to submit work') }
    finally { setSaving(false) }
  }
  const visible = items.filter(item => filter === 'All' || status(item) === filter)
  const tone = (value: string) => value === 'Graded' ? 'sv-badge-success' : value === 'Overdue' ? 'sv-badge-danger' : value === 'Submitted' ? '' : 'sv-badge-warn'
  return <main className="sv-page">
    <div className="sv-page-header"><div><h1 className="sv-title">Assignments</h1><p className="sv-subtitle">Your work, instructor feedback, and next steps.</p></div><button className="sv-btn-secondary" disabled={loading || saving} onClick={() => void load()}>Refresh</button></div>
    {error && <p className="sv-alert sv-alert-error" role="alert">{error}</p>}
    <div className="flex flex-wrap gap-2">{['All', 'Pending', 'Overdue', 'Submitted', 'Graded'].map(value => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className="sv-chip">{value}</button>)}</div>
    {loading && <p role="status" className="sv-state">Loading your assignments…</p>}
    {!loading && visible.length === 0 && <div className="sv-card sv-empty">No assignments here yet. Enroll in a course to see its assignments.</div>}
    <div className="flex flex-col gap-4">{visible.map(item => <article key={item.id} className="sv-card sv-card-pad flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="sv-meta font-semibold text-blue-700">{item.course}</p><h2 className="sv-card-title mt-1">{item.title}</h2></div><span className={`sv-badge ${tone(status(item))}`}>{status(item)}</span></div>
      <p className="sv-desc max-w-[75ch] whitespace-pre-wrap">{item.description}</p>
      {item.instructions && <div className="rounded-lg bg-sv-soft p-4"><p className="sv-label">Instructions</p><p className="sv-desc mt-1 whitespace-pre-wrap">{item.instructions}</p></div>}
      <p className="sv-meta">Due {item.dueDate.includes('T') ? new Date(item.dueDate).toLocaleString() : new Date(item.dueDate).toLocaleDateString()} · {item.maxMarks ?? 100} maximum marks</p>
      {item.submission ? <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="sv-desc whitespace-pre-wrap">{item.submission.content}</p>{item.submission.status === 'Graded' ? <div className="mt-4 border-t border-slate-200 pt-4"><p className="sv-card-title text-blue-700">{item.submission.marks !== undefined ? `${item.submission.marks}/${item.submission.maxMarks ?? item.maxMarks ?? 100} marks · ${item.submission.score}%` : `${item.submission.score}/100`}</p><p className="sv-desc mt-1 whitespace-pre-wrap">{item.submission.feedback || 'No written feedback provided.'}</p></div> : <p className="sv-meta mt-3">Submitted successfully · Awaiting instructor review</p>}</div> :
        <form onSubmit={event => void submit(event, item)} className="flex flex-col gap-3"><textarea className="sv-field" name="content" aria-label={`Your submission for ${item.title}`} required rows={4} maxLength={20000} placeholder="Write your response or paste a link to your work…" /><button disabled={saving} className="sv-button w-full sm:w-fit">{saving ? 'Submitting…' : status(item) === 'Overdue' ? 'Submit late' : 'Submit assignment'}</button></form>}
    </article>)}</div>
  </main>
}
