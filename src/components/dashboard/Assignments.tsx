import { useEffect, useState, type FormEvent } from 'react'
import { backend } from '../../lib/backend'
import type { Assignment } from '../../lib/types'

function status(item: Assignment) {
  if (item.submission) return item.submission.status === 'Graded' ? 'Graded' : 'Submitted'
  return Date.parse(item.dueDate) + 86400000 < Date.now() ? 'Overdue' : 'Pending'
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
  return <main className="flex-1 overflow-auto p-6">
    <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-extrabold text-slate-800">Assignments</h1><p className="mt-1 text-sm text-slate-500">Your work, instructor feedback, and next steps.</p></div><button className="sv-link" disabled={loading || saving} onClick={() => void load()}>Refresh</button></div>
    {error && <p className="sv-alert sv-alert-error" role="alert">{error}</p>}
    <div className="mb-5 flex flex-wrap gap-2">{['All', 'Pending', 'Overdue', 'Submitted', 'Graded'].map(value => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'sv-button' : 'rounded-full border border-blue-100 bg-white px-4 py-2 text-xs text-slate-500'}>{value}</button>)}</div>
    {loading && <p role="status" className="text-sm text-slate-500">Loading your assignments…</p>}
    {!loading && items.filter(item => filter === 'All' || status(item) === filter).length === 0 && <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-sm text-slate-500">No assignments here yet. Enroll in a course to see its assignments.</div>}
    <div className="space-y-4">{items.filter(item => filter === 'All' || status(item) === filter).map(item => <article key={item.id} className="rounded-2xl border border-blue-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium text-blue-600">{item.course}</p><h2 className="mt-1 font-bold text-slate-800">{item.title}</h2></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{status(item)}</span></div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{item.description}</p>
      <p className="my-3 text-xs text-slate-400">Due {new Date(item.dueDate).toLocaleDateString()}</p>
      {item.submission ? <div className="rounded-xl bg-slate-50 p-4 text-sm"><p className="whitespace-pre-wrap text-slate-600">{item.submission.content}</p>{item.submission.status === 'Graded' ? <><p className="mt-3 font-bold text-blue-700">{item.submission.score}/100</p><p className="mt-1 whitespace-pre-wrap text-slate-600">{item.submission.feedback || 'No written feedback provided.'}</p></> : <p className="mt-3 text-xs text-slate-400">Submitted successfully · Awaiting instructor review</p>}</div> :
        <form onSubmit={event => void submit(event, item)} className="space-y-3"><textarea className="sv-field" name="content" aria-label={`Your submission for ${item.title}`} required rows={4} maxLength={20000} placeholder="Write your response or paste a link to your work…" /><button disabled={saving} className="sv-button">{saving ? 'Submitting…' : status(item) === 'Overdue' ? 'Submit late' : 'Submit assignment'}</button></form>}
    </article>)}</div>
  </main>
}
