import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { backend } from '../../lib/backend'
import type { AssessmentWorkspace, Course, ManagedAssignment, ManagedQuiz, Submission } from '../../lib/types'

type Assessment = ManagedAssignment | ManagedQuiz
type Question = ManagedQuiz['questions'][number]
const blankQuestion = (): Question => ({ q: '', options: ['', ''], answer: 0, marks: 1 })
const publication = (item: Assessment) => item.status ?? 'Published'
const dateTime = (value?: string) => value ? new Date(value).toLocaleString() : 'Not recorded'
const deadlineInput = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
const emptyWorkspace: AssessmentWorkspace = { capability: '', assignments: [], quizzes: [], submissions: [], attempts: [] }

function AssessmentDialog({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])
  return <dialog ref={dialog} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
    className="m-auto max-h-full w-full max-w-3xl overflow-y-auto rounded-xl border border-sv-line bg-white p-0 text-sv-ink shadow-xl backdrop:bg-slate-900/40">
    <div className="flex items-start justify-between gap-4 border-b border-sv-line p-5">
      <div role="heading" aria-level={2} className="sv-section-title">{title}</div>
      <button type="button" className="sv-btn-ghost" onClick={onClose} disabled={busy} aria-label="Close dialog">Close</button>
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </dialog>
}

export default function InstructorAssessments({ kind }: { kind: 'assignments' | 'quizzes' }) {
  const assignmentMode = kind === 'assignments'
  const singular = assignmentMode ? 'assignment' : 'quiz'
  const title = assignmentMode ? 'Assignments' : 'Quizzes'
  const [workspace, setWorkspace] = useState<AssessmentWorkspace>(emptyWorkspace)
  const [courses, setCourses] = useState<Course[]>([])
  const [learners, setLearners] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [legacyApi, setLegacyApi] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([blankQuestion()])
  const [detail, setDetail] = useState<Assessment | null>(null)
  const [grading, setGrading] = useState<Submission | null>(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const teaching = await backend<{ courses: Course[]; submissions: Submission[]; students: { studentId: string; name: string }[] }>('/workspace')
      const ownedIds = new Set(teaching.courses.map(course => course.id))
      try {
        const data = await backend<AssessmentWorkspace>('/instructor/assessments')
        if (data.capability !== 'assessment-management-v1') throw new Error('The connected server does not support assessment management yet. No changes have been saved.')
        setWorkspace(data); setLegacyApi(false)
      } catch (failure) {
        if (!(failure instanceof Error) || !failure.message.includes('API endpoint not found')) throw failure
        const [assignments, quizzes] = await Promise.all([
          backend<ManagedAssignment[]>('/assignments'),
          backend<ManagedQuiz[]>('/quizzes'),
        ])
        setWorkspace({
          capability: 'legacy-2.0.0',
          assignments: assignments.filter(item => ownedIds.has(item.courseId)),
          quizzes: quizzes.filter(item => ownedIds.has(item.courseId)).map(quiz => ({
            ...quiz,
            questions: quiz.questions.map(q => ({ ...q, answer: typeof q.answer === 'number' ? q.answer : 0, marks: q.marks ?? 1 })),
          })),
          submissions: teaching.submissions,
          attempts: [],
        })
        setLegacyApi(true)
      }
      setCourses(teaching.courses)
      setLearners(Object.fromEntries(teaching.students.map(student => [student.studentId, student.name])))
      setLoaded(true)
    } catch (failure) {
      setLoaded(false)
      setError(failure instanceof Error ? failure.message : 'Unable to load your assessments')
    } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => {
    setEditorOpen(false); setDetail(null); setGrading(null); setQuery(''); setCourseFilter(''); setStatusFilter(''); setNotice('')
  }, [kind])

  const allItems: Assessment[] = assignmentMode ? workspace.assignments : workspace.quizzes
  const visible = allItems.filter(item =>
    (!courseFilter || item.courseId === courseFilter) && (!statusFilter || publication(item) === statusFilter) &&
    `${item.title} ${item.course}`.toLowerCase().includes(query.toLowerCase()))
  const responses = (id: string) => assignmentMode ? workspace.submissions.filter(item => item.assignmentId === id).length : workspace.attempts.filter(item => item.quizId === id).length
  const gradingLocked = !!editing && (assignmentMode
    ? workspace.submissions.some(item => item.assignmentId === editing.id)
    : workspace.attempts.some(item => item.quizId === editing.id))
  const totalMarks = questions.reduce((sum, question) => sum + (Number(question.marks ?? 1) || 0), 0)

  function openEditor(item: Assessment | null = null) {
    setEditing(item); setQuestions(item && 'questions' in item ? structuredClone(item.questions) : [blankQuestion()])
    setError(''); setNotice(''); setEditorOpen(true)
  }
  function closeEditor() {
    if (!busy && window.confirm('Close the editor? Unsaved changes will be discarded.')) setEditorOpen(false)
  }
  async function saveAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !loaded) return
    if (legacyApi && editing) {
      setError('Editing existing assessments requires the latest server deployment (API 2.1.0). You can create new assessments on the current server.')
      return
    }
    const form = new FormData(event.currentTarget)
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const status = legacyApi ? 'Published' : (button?.value === 'Published' ? 'Published' : 'Draft')
    const body = {
      courseId: editing?.courseId ?? form.get('courseId'), title: form.get('title'),
      description: form.get('description'), instructions: form.get('instructions'), status,
      ...(assignmentMode ? {
        dueDate: editing && 'dueDate' in editing && String(form.get('dueDate')) === deadlineInput(editing.dueDate)
          ? editing.dueDate : new Date(String(form.get('dueDate'))).toISOString(),
        maxMarks: Number(form.get('maxMarks')),
      } : { questions, duration: Number(form.get('duration')), passingScore: Number(form.get('passingScore')) }),
    }
    setBusy(true); setError(''); setNotice('')
    try {
      await backend(editing ? `/${kind}/${encodeURIComponent(editing.id)}` : `/${kind}`, editing ? 'PUT' : 'POST', body)
      setEditorOpen(false)
      await load()
      setNotice(`${assignmentMode ? 'Assignment' : 'Quiz'} ${status === 'Published' ? 'published' : 'saved as a draft'}. ${status === 'Published' ? 'Enrolled students can access it when its course is published.' : 'Drafts are hidden from students.'}`)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save assessment') }
    finally { setBusy(false) }
  }
  async function saveGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!grading || busy) return
    const form = new FormData(event.currentTarget)
    const maxMarks = grading.maxMarks ?? 100
    const marks = Number(form.get('marks'))
    const score = Math.round(marks / maxMarks * 100)
    setBusy(true); setError(''); setNotice('')
    try {
      const saved = await backend<Submission>(`/submissions/${encodeURIComponent(grading.id)}`, 'PUT', legacyApi ? { score, feedback: form.get('feedback') } : { marks, score, feedback: form.get('feedback') })
      setWorkspace(current => ({ ...current, submissions: current.submissions.map(item => item.id === saved.id ? saved : item) }))
      setGrading(null); setNotice('Grade and feedback saved. The student can see them in Assignments and Notifications.')
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save grade') }
    finally { setBusy(false) }
  }
  function updateQuestion(index: number, update: Partial<Question>) {
    setQuestions(current => current.map((question, i) => i === index ? { ...question, ...update } : question))
  }

  const alerts = <>
    {error && <div role="alert" className="sv-alert sv-alert-error">{error}</div>}
    {notice && <div role="status" className="sv-alert sv-alert-success">{notice}</div>}
  </>
  const detailSubmissions = detail ? workspace.submissions.filter(item => item.assignmentId === detail.id) : []
  const detailAttempts = detail ? workspace.attempts.filter(item => item.quizId === detail.id) : []

  return <main className="sv-page">
    <div className="sv-page-header">
      <div><p className="sv-eyebrow">Instructor workspace · Assessments</p><h1 className="sv-title">{title}</h1><p className="sv-subtitle">{assignmentMode ? 'Set meaningful work. Review submissions and give feedback.' : 'Build course quizzes and follow every learner’s results.'}</p></div>
      <div className="flex flex-wrap gap-2"><button className="sv-btn-secondary" disabled={loading || busy} onClick={() => void load()}>Refresh</button><button className="sv-button" disabled={!loaded || loading || busy || !courses.length} onClick={() => openEditor()}>Create {singular}</button></div>
    </div>
    {!editorOpen && !detail && alerts}
    {loading && <p role="status" className="sv-state">Loading your {kind} and saved results…</p>}
    {!loading && !loaded && <div className="sv-card sv-card-pad space-y-3"><p className="sv-desc">Assessment management requires the updated existing SkillVerse server. Publishing is disabled until a supported server responds. No local sample records are used.</p><button className="sv-btn-secondary" onClick={() => void load()}>Retry connection</button></div>}
    {loaded && <>
      <div className="sv-grid-stats">
        {[['Total '+kind, allItems.length], ['Published', allItems.filter(item => publication(item) === 'Published').length],
          [assignmentMode ? 'Awaiting grading' : 'Completed attempts', assignmentMode ? workspace.submissions.filter(item => item.status === 'Pending').length : workspace.attempts.filter(item => item.status !== 'InProgress').length]].map(([label, value]) =>
          <section key={label} className="sv-card p-5"><p className="sv-stat-label">{label}</p><p className="sv-stat-value">{value}</p></section>)}
      </div>
      <section className="sv-card min-w-0 overflow-hidden">
        <div className="grid gap-3 border-b border-sv-line p-5 sm:grid-cols-3">
          <label className="sv-label">Search<input className="sv-field mt-1" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${kind}…`} /></label>
          <label className="sv-label">Course<select className="sv-field mt-1" value={courseFilter} onChange={event => setCourseFilter(event.target.value)}><option value="">All your courses</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
          <label className="sv-label">Publication<select className="sv-field mt-1" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="">All statuses</option><option>Draft</option><option>Published</option></select></label>
        </div>
        {!visible.length ? <div className="sv-empty"><p>{allItems.length ? 'No assessments match your filters.' : `No ${kind} yet. Create your first ${singular} for one of your courses.`}</p>{!courses.length && <Link to="/instructor/courses" className="sv-link mt-3">Create a course first</Link>}</div> :
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Your {kind}, publication status, and saved learner responses</caption>
            <thead className="hidden bg-sv-surface text-sv-muted xl:table-header-group"><tr><th className="p-4 font-medium">{assignmentMode ? 'Assignment / course' : 'Quiz / course'}</th><th className="p-4 font-medium">{assignmentMode ? 'Deadline' : 'Duration'}</th><th className="p-4 font-medium">Marks</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">{assignmentMode ? 'Submissions' : 'Attempts'}</th><th className="p-4 font-medium">Actions</th></tr></thead>
            <tbody>{visible.map(item => <tr key={item.id} className="grid grid-cols-1 items-start border-b border-sv-line last:border-b-0 sm:grid-cols-2 xl:table-row">
              <td className="col-span-full min-w-0 p-4 align-top"><p className="break-words font-semibold text-sv-ink [overflow-wrap:anywhere]">{item.title}</p><p className="sv-meta mt-1 break-words">{courses.find(course => course.id === item.courseId)?.name ?? item.course}</p></td>
              <td className="p-4 align-top text-sv-muted"><span className="sv-meta mb-1 block xl:sr-only">{assignmentMode ? 'Deadline' : 'Duration'}</span>{'dueDate' in item ? dateTime(item.dueDate) : item.duration ? `${item.duration} min` : 'Untimed'}</td>
              <td className="p-4 align-top"><span className="sv-meta mb-1 block xl:sr-only">Maximum marks</span>{item.maxMarks ?? ('questions' in item ? item.questions.reduce((sum, question) => sum + (question.marks ?? 1), 0) : 100)}</td>
              <td className="p-4 align-top"><span className={`sv-badge ${publication(item) === 'Published' ? 'sv-badge-success' : 'sv-badge-neutral'}`}>{publication(item)}</span>{courses.find(course => course.id === item.courseId)?.status === 'Draft' && <p className="sv-meta mt-2">Course is draft · not visible to students</p>}</td>
              <td className="p-4 align-top"><span className="sv-meta mb-1 block xl:sr-only">{assignmentMode ? 'Submissions' : 'Attempts'}</span>{responses(item.id)}</td>
              <td className="col-span-full p-4 align-top"><div className="flex flex-wrap gap-2"><button className="sv-btn-secondary" disabled={busy || loading || legacyApi} title={legacyApi ? 'Editing existing assessments requires server API 2.1.0' : undefined} onClick={() => openEditor(item)}>Edit</button><button className="sv-link" disabled={busy || loading} onClick={() => { setDetail(item); setGrading(null); setError(''); setNotice('') }}>{assignmentMode ? 'View submissions' : 'View results'}</button></div></td>
            </tr>)}</tbody>
          </table>}
      </section>
      {legacyApi && <p className="sv-meta">Connected to server API 2.0.0 compatibility mode: your existing assessments and student submissions are loaded, and new assessments publish directly. Editing existing assessments, draft status, and quiz attempt reports require deploying server API 2.1.0.</p>}
      <p className="sv-meta">Published assessments are available only to enrolled students in published courses. Existing records without a publication status remain published.</p>
    </>}

    {editorOpen && <AssessmentDialog title={`${editing ? 'Edit' : 'Create'} ${singular}`} busy={busy} onClose={closeEditor}>
      <div className="mb-4 space-y-3">{alerts}</div>
      <form key={editing?.id ?? 'new'} onSubmit={event => void saveAssessment(event)} className="space-y-5">
        <fieldset disabled={busy} className="min-w-0 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sv-label">Course<select name="courseId" className="sv-field mt-1" defaultValue={editing?.courseId ?? courseFilter} disabled={!!editing} required><option value="">Select your course</option>{courses.map(course => <option value={course.id} key={course.id}>{course.name}{course.status === 'Draft' ? ' (Draft)' : ''}</option>)}</select></label>
            <label className="sv-label">Title<input name="title" className="sv-field mt-1" defaultValue={editing?.title} maxLength={160} required autoFocus /></label>
          </div>
          <label className="sv-label">Description<textarea name="description" className="sv-field mt-1" defaultValue={editing?.description} rows={3} maxLength={8000} placeholder="Explain the assessment’s purpose and learning outcomes." /></label>
          <label className="sv-label">Instructions<textarea name="instructions" className="sv-field mt-1" defaultValue={editing?.instructions} rows={4} maxLength={12000} placeholder="Explain what students should do and how their work will be assessed." /></label>
          {assignmentMode ? <div className="grid gap-4 sm:grid-cols-2">
            <label className="sv-label">Deadline (your local time)<input className="sv-field mt-1" name="dueDate" type="datetime-local" defaultValue={deadlineInput(editing && 'dueDate' in editing ? editing.dueDate : undefined)} required /></label>
            <label className="sv-label">Maximum marks<input className="sv-field mt-1" name="maxMarks" type="number" min={1} max={10000} step={1} defaultValue={editing?.maxMarks ?? 100} readOnly={gradingLocked} required /></label>
          </div> : <>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="sv-label">Duration (minutes)<input className="sv-field mt-1" name="duration" type="number" min={0} max={240} defaultValue={editing && 'questions' in editing ? editing.duration ?? 0 : 0} readOnly={gradingLocked} required /><span className="sv-meta mt-1 block">0 = no time limit</span></label>
              <label className="sv-label">Passing score (%)<input className="sv-field mt-1" name="passingScore" type="number" min={0} max={100} defaultValue={editing && 'questions' in editing ? editing.passingScore ?? 50 : 50} readOnly={gradingLocked} required /></label>
              <div><p className="sv-label">Total marks</p><p className="sv-stat-value">{totalMarks}</p><p className="sv-meta">Sum of question marks</p></div>
            </div>
            <fieldset disabled={gradingLocked} className="min-w-0 space-y-4">
              <legend className="sv-section-title mb-3">Multiple-choice questions</legend>
              {questions.map((question, index) => <div key={index} className="rounded-lg border border-sv-line bg-sv-surface p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="sv-label">Question {index + 1}</p><button type="button" className="sv-btn-ghost" disabled={questions.length === 1} onClick={() => setQuestions(current => current.filter((_, i) => i !== index))}>Remove question</button></div>
                <label className="sv-label">Question text<textarea className="sv-field mt-1" value={question.q} onChange={event => updateQuestion(index, { q: event.target.value })} required maxLength={1000} rows={2} /></label>
                <div className="mt-3 space-y-3">{question.options.map((option, optionIndex) => <div className="flex items-center gap-2" key={optionIndex}>
                  <input type="radio" name={`correct-${index}`} checked={question.answer === optionIndex} onChange={() => updateQuestion(index, { answer: optionIndex })} aria-label={`Question ${index + 1}: mark option ${optionIndex + 1} as correct`} className="size-4 shrink-0 accent-blue-600" />
                  <input className="sv-field min-w-0" aria-label={`Question ${index + 1}, option ${optionIndex + 1}`} value={option} onChange={event => updateQuestion(index, { options: question.options.map((value, i) => i === optionIndex ? event.target.value : value) })} maxLength={500} required />
                  <button className="sv-btn-ghost shrink-0" type="button" disabled={question.options.length <= 2} aria-label={`Remove option ${optionIndex + 1}`} onClick={() => updateQuestion(index, { options: question.options.filter((_, i) => i !== optionIndex), answer: question.answer === optionIndex ? 0 : question.answer > optionIndex ? question.answer - 1 : question.answer })}>Remove</button>
                </div>)}</div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3"><button type="button" className="sv-btn-secondary" disabled={question.options.length >= 6} onClick={() => updateQuestion(index, { options: [...question.options, ''] })}>Add option</button><label className="sv-label">Question marks<input className="sv-field mt-1 w-full sm:w-28" type="number" min={1} max={1000} value={question.marks ?? 1} required onChange={event => updateQuestion(index, { marks: Number(event.target.value) })} /></label></div>
              </div>)}
              <button type="button" className="sv-btn-secondary" disabled={questions.length >= 50} onClick={() => setQuestions(current => [...current, blankQuestion()])}>Add question</button>
              <p className="sv-meta">Select the radio button beside the correct answer. Each question supports 2–6 options; up to 50 questions.</p>
            </fieldset>
          </>}
          {gradingLocked && <p className="sv-alert sv-alert-success">{assignmentMode ? 'Maximum marks are locked because students have submitted work.' : 'Questions, marks, duration, and passing score are locked because attempts already exist. Descriptive text and publication can still be updated.'} Existing learner records will not be reset.</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-sv-line pt-5">
            <button type="button" className="sv-btn-ghost" onClick={closeEditor}>Cancel</button>
            {!legacyApi && <button type="submit" className="sv-btn-secondary" value="Draft">{busy ? 'Saving…' : 'Save as draft'}</button>}
            <button type="submit" className="sv-button" value="Published">{busy ? 'Saving…' : 'Save and publish'}</button>
          </div>
        </fieldset>
      </form>
    </AssessmentDialog>}

    {detail && <AssessmentDialog title={`${assignmentMode ? 'Submissions' : 'Results'} · ${detail.title}`} busy={busy} onClose={() => { setDetail(null); setGrading(null) }}>
      <div className="mb-4 space-y-3">{alerts}<p className="sv-meta">{detail.course}</p></div>
      {assignmentMode ? <>
        {!detailSubmissions.length && <p className="sv-empty">No student submissions yet. Submitted work will appear here and in Grading.</p>}
        {detailSubmissions.map(item => <article className="border-t border-sv-line py-4" key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{item.student}</p><p className="sv-meta mt-1">Submitted {dateTime(item.submitted)}</p></div><span className={`sv-badge ${item.status === 'Graded' ? 'sv-badge-success' : 'sv-badge-warn'}`}>{item.status}</span></div>
          <p className="sv-desc mt-3 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{item.content}</p>
          {item.status === 'Graded' && <div className="mt-3 rounded-lg bg-sv-soft p-3"><p className="sv-label">{item.marks ?? Number(((item.score ?? 0) / 100 * (item.maxMarks ?? detail.maxMarks ?? 100)).toFixed(2))} / {item.maxMarks ?? detail.maxMarks ?? 100} marks · {item.score}%</p><p className="sv-desc mt-1 whitespace-pre-wrap">{item.feedback || 'No written feedback.'}</p></div>}
          {grading?.id === item.id ? <form key={item.id} className="mt-4 space-y-3" onSubmit={event => void saveGrade(event)}>
            <fieldset disabled={busy} className="space-y-3">
              <label className="sv-label">Marks out of {item.maxMarks ?? detail.maxMarks ?? 100}<input autoFocus name="marks" className="sv-field mt-1" type="number" min={0} max={item.maxMarks ?? detail.maxMarks ?? 100} step="0.01" defaultValue={item.marks ?? (item.score === undefined ? '' : item.score / 100 * (item.maxMarks ?? detail.maxMarks ?? 100))} required /></label>
              <label className="sv-label">Feedback<textarea name="feedback" className="sv-field mt-1" maxLength={4000} rows={4} defaultValue={item.feedback} /></label>
              <div className="flex flex-wrap gap-2"><button className="sv-button">{busy ? 'Saving…' : 'Save grade and feedback'}</button><button type="button" className="sv-btn-ghost" onClick={() => setGrading(null)}>Cancel</button></div>
            </fieldset>
          </form> : <button className="sv-btn-secondary mt-3" disabled={busy} onClick={() => { setGrading(item); setNotice('') }}>{item.status === 'Graded' ? 'Edit grade' : 'Grade submission'}</button>}
        </article>)}
        <Link to="/instructor/grading" className="sv-link mt-3" onClick={() => setDetail(null)}>Open the full grading queue</Link>
      </> : <>
        {!detailAttempts.length && <p className="sv-empty">{legacyApi ? 'Detailed quiz attempt history requires server API 2.1.0 (`GET /instructor/assessments`).' : 'No quiz attempts yet. Saved learner results will appear here.'}</p>}
        <div className="space-y-3">{detailAttempts.map(attempt => {
          const expired = attempt.status === 'InProgress' && !!attempt.expiresAt && Date.parse(attempt.expiresAt) <= Date.now()
          return <article key={attempt.id} className="rounded-lg border border-sv-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{attempt.student ?? learners[attempt.studentId] ?? attempt.studentId}</p><p className="sv-meta mt-1">{dateTime(attempt.createdAt ?? attempt.startedAt)}</p></div><span className={`sv-badge ${attempt.status === 'InProgress' ? 'sv-badge-warn' : attempt.passed ? 'sv-badge-success' : 'sv-badge-neutral'}`}>{attempt.status === 'InProgress' ? expired ? 'Time expired · awaiting finalization' : 'In progress' : `${attempt.status === 'Expired' ? 'Time expired · ' : ''}${attempt.passed === undefined ? 'Completed' : attempt.passed ? 'Passed' : 'Below passing score'}`}</span></div>
            {attempt.status !== 'InProgress' && <p className="sv-desc mt-3"><strong>{attempt.score}%</strong>{attempt.marks !== undefined && ` · ${attempt.marks} / ${attempt.maxMarks} marks`} · {attempt.correct} / {attempt.total} correct{attempt.passingScore !== undefined && ` · Pass mark ${attempt.passingScore}%`}</p>}
          </article>
        })}</div>
      </>}
    </AssessmentDialog>}
  </main>
}
