import { useEffect, useState } from 'react'
import { backend } from '../../lib/backend'

type Course = { id: string; name: string; status: string; lessons: number; description?: string }
type Submission = { id: number; student: string; assignment: string; status: string; score?: number; feedback?: string }
type Message = { id: string; audience: string; body: string; createdAt: string; read: boolean }
type Enrollment = { courseId: string; completed: number }

export default function WorkspaceRecords({ view }: { view: 'courses' | 'inbox' }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  async function load() {
    setLoading(true)
    setError('')
    try {
      const [workspace, inbox, saved] = await Promise.all([
        backend<{ courses: Course[]; submissions: Submission[] }>('/workspace'),
        backend<Message[]>('/messages'), backend<Enrollment[]>('/enrollments'),
      ])
      setCourses(workspace.courses)
      setSubmissions(workspace.submissions)
      setMessages(inbox)
      setEnrollments(saved)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to load saved records')
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function update(action: () => Promise<void>) {
    if (saving) return
    setSaving(true)
    setError('')
    try { await action() } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save changes')
    } finally { setSaving(false) }
  }
  return <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 text-slate-700" aria-busy={loading || saving}>
    <div className="mb-3 flex items-center justify-between gap-4">
      <h2 className="text-base font-bold text-blue-950">{view === 'courses' ? 'Live instructor course library' : 'Workspace announcements & grades'}</h2>
      <button disabled={loading || saving} onClick={() => void load()} className="text-sm text-blue-700 disabled:opacity-50">Refresh</button>
    </div>
    <p className="mb-3 text-xs text-slate-500">Saved demo workspace · account switching shares this browser’s data. Sample learners are not signed-in accounts.</p>
    {loading && <p role="status" className="text-sm">Loading saved records…</p>}
    {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
    {!loading && view === 'courses' && courses.filter(course => course.status === 'Published').map(course => {
      const enrollment = enrollments.find(item => item.courseId === course.id)
      return <article key={course.id} className="border-t border-blue-50 py-3">
        <h3 className="text-sm font-semibold">{course.name}</h3>
        <p className="my-1 text-xs text-slate-500">{course.description || `${course.lessons} lessons`} {enrollment && `· ${enrollment.completed}/${course.lessons} completed`}</p>
        {enrollment && <progress value={enrollment.completed} max={course.lessons} className="mr-3 h-2 w-40" aria-label={`${course.name} progress`} />}
        <button disabled={saving || enrollment?.completed === course.lessons} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:opacity-50" onClick={() => void update(async () => {
          const updated = await backend<Enrollment>(`/enrollments/${course.id}`, 'PUT', { completed: enrollment ? enrollment.completed + 1 : 0 })
          setEnrollments(current => [...current.filter(item => item.courseId !== updated.courseId), updated])
        })}>{!enrollment ? 'Enroll' : enrollment.completed === course.lessons ? 'Completed' : 'Mark next lesson complete'}</button>
      </article>
    })}
    {!loading && view === 'inbox' && <>
      {messages.length === 0 && <p className="py-3 text-sm text-slate-500">No announcements yet. Send one from the Instructor workspace.</p>}
      {messages.map(message => <article key={message.id} className="border-t border-blue-50 py-3">
        <div className="mb-1 text-xs text-slate-500">{message.audience === 'all' ? 'All students' : message.audience} · {new Date(message.createdAt).toLocaleString()}</div>
        <p className="whitespace-pre-wrap text-sm">{message.body}</p>
        <button disabled={saving || message.read} className="mt-2 text-xs text-blue-700 disabled:text-slate-400" onClick={() => void update(async () => {
          const updated = await backend<Message>(`/messages/${message.id}`, 'PUT', {})
          setMessages(current => current.map(item => item.id === updated.id ? updated : item))
        })}>{message.read ? 'Read' : 'Mark as read'}</button>
      </article>)}
      <h3 className="mt-4 text-sm font-bold">Demo learner results</h3>
      {submissions.filter(item => item.status === 'Graded').map(item => <article key={item.id} className="border-t border-blue-50 py-3 text-sm">
        <strong>{item.student} · {item.assignment} · {item.score}/100</strong>
        <p className="mt-1 whitespace-pre-wrap text-slate-500">{item.feedback || 'No feedback provided yet.'}</p>
      </article>)}
    </>}
  </section>
}
