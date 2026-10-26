import { useEffect, useState, type FormEvent } from 'react'
import { backend } from '../../lib/backend'
import type { Lesson } from '../../lib/types'

type AssignmentRecord = { id: string; title: string; description: string; dueDate: string }
type QuizRecord = { id: string; title: string; questions: { q: string; options: string[]; answer: number }[] }

const quizText = (quiz?: QuizRecord) => quiz ? quiz.questions.map(item => [item.q, ...item.options.map((option, i) => `${i === item.answer ? '*' : ''}${option}`)].join('\n')).join('\n\n') : ''

export default function CurriculumEditor({ courseId, count }: { courseId: string; count: number }) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([])
  const [editingAssignment, setEditingAssignment] = useState('')
  const [editingQuiz, setEditingQuiz] = useState('')
  const [tab, setTab] = useState<'lessons' | 'assignment' | 'quiz'>('lessons')
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function loadAssessments() {
    const records = await backend<{ assignments: AssignmentRecord[]; quizzes: QuizRecord[] }>(`/courses/${courseId}/assessments`)
    setAssignments(records.assignments); setQuizzes(records.quizzes)
  }
  async function load() {
    setBusy(true); setError('')
    try {
      const [records] = await Promise.all([backend<Lesson[]>(`/courses/${courseId}/lessons`), loadAssessments()])
      setLessons(Array.from({ length: count }, (_, i) => records[i] || { id: String(i + 1), title: `Lesson ${i + 1}`, content: '', videoUrl: '' }))
      setLoaded(true)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load curriculum') }
    finally { setBusy(false) }
  }
  useEffect(() => { void load() }, [courseId, count])
  async function save(action: () => Promise<unknown>, message: string) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await action(); setNotice(message) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save') }
    finally { setBusy(false) }
  }
  function saveAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const body = { courseId, title: data.get('title'), description: data.get('description'), dueDate: data.get('dueDate') }
    void save(async () => {
      if (editingAssignment) await backend(`/assignments/${editingAssignment}`, 'PUT', body)
      else { await backend('/assignments', 'POST', body); form.reset() }
      await loadAssessments()
    }, editingAssignment ? 'Assignment updated.' : 'Assignment created for enrolled students.')
  }
  function saveQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const blocks = String(data.get('questions')).trim().split(/\n\s*\n/)
    const questions = blocks.map(block => {
      const [q, ...raw] = block.split('\n').map(line => line.trim()).filter(Boolean)
      const marked = raw.map((option, i) => option.startsWith('*') ? i : -1).filter(i => i >= 0)
      if (!q || raw.length < 2 || marked.length !== 1) throw new Error('Each question needs at least two options and exactly one correct option marked with *.')
      return { q, options: raw.map(option => option.replace(/^\*/, '').trim()), answer: marked[0] }
    })
    void save(async () => {
      if (editingQuiz) await backend(`/quizzes/${editingQuiz}`, 'PUT', { title: data.get('title'), questions })
      else { await backend('/quizzes', 'POST', { courseId, title: data.get('title'), questions }); form.reset() }
      await loadAssessments()
    }, editingQuiz ? 'Quiz updated. Scores will be calculated by the server.' : 'Quiz created. Scores will be calculated by the server.')
  }
  const update = (field: keyof Lesson, value: string) => setLessons(current => current.map((lesson, i) => i === index ? { ...lesson, [field]: value } : lesson))
  const assignment = assignments.find(item => item.id === editingAssignment)
  const quiz = quizzes.find(item => item.id === editingQuiz)
  return <section className="mt-5 border-t border-blue-100 pt-4">
    <div className="mb-4 flex flex-wrap gap-3">{(['lessons', 'assignment', 'quiz'] as const).map(item => <button type="button" className="sv-link" aria-pressed={tab === item} key={item} onClick={() => { setTab(item); setNotice(''); setError('') }}>{item === 'lessons' ? 'Lesson content' : item === 'assignment' ? `Assignments (${assignments.length})` : `Quizzes (${quizzes.length})`}</button>)}</div>
    {error && <p role="alert" className="sv-alert sv-alert-error">{error}{!loaded && <button className="sv-link" onClick={() => void load()}>Retry</button>}</p>}
    {notice && <p role="status" className="sv-alert sv-alert-success">{notice}</p>}
    <fieldset disabled={busy || !loaded} className="space-y-3 border-0">
      {tab === 'lessons' && <>
        <label className="block text-xs font-semibold">Select lesson<select className="sv-field mt-2" value={index} onChange={event => setIndex(Number(event.target.value))}>{lessons.map((lesson, i) => <option value={i} key={lesson.id}>{i + 1}. {lesson.title}</option>)}</select></label>
        <input className="sv-field" aria-label="Lesson title" value={lessons[index]?.title || ''} onChange={event => update('title', event.target.value)} maxLength={160} />
        <input className="sv-field" aria-label="Module name" value={lessons[index]?.module || ''} onChange={event => update('module', event.target.value)} maxLength={120} placeholder="Module name, e.g. Module 1: Getting Started" />
        <input className="sv-field" aria-label="Lesson summary" value={lessons[index]?.description || ''} onChange={event => update('description', event.target.value)} maxLength={500} placeholder="One-sentence lesson summary" />
        <textarea className="sv-field" aria-label="Lesson content" rows={5} value={lessons[index]?.content || ''} onChange={event => update('content', event.target.value)} maxLength={20000} placeholder="Write the lesson content…" />
        <input className="sv-field" aria-label="HTTPS video URL" value={lessons[index]?.videoUrl || ''} onChange={event => update('videoUrl', event.target.value)} placeholder="Optional HTTPS video link" type="url" />
        <button className="sv-button" onClick={() => void save(() => backend(`/courses/${courseId}/lessons`, 'PUT', { lessons }), 'All lesson content saved. You can publish when every lesson has content.')}>{busy ? 'Saving…' : 'Save all lessons'}</button>
      </>}
      {tab === 'assignment' && <form className="space-y-3" key={editingAssignment || 'new'} onSubmit={saveAssignment}>
        <label className="block text-xs font-semibold">Assignment<select className="sv-field mt-2" value={editingAssignment} onChange={event => { setEditingAssignment(event.target.value); setNotice('') }}><option value="">New assignment</option>{assignments.map(item => <option value={item.id} key={item.id}>Edit: {item.title}</option>)}</select></label>
        <input className="sv-field" name="title" aria-label="Assignment title" placeholder="Assignment title" defaultValue={assignment?.title} maxLength={160} required />
        <textarea className="sv-field" name="description" aria-label="Assignment instructions" placeholder="What should students submit?" defaultValue={assignment?.description} rows={5} maxLength={8000} required />
        <label className="block text-xs font-semibold">Due date<input className="sv-field mt-2" name="dueDate" type="date" defaultValue={assignment?.dueDate.slice(0, 10)} required /></label>
        <button className="sv-button">{editingAssignment ? 'Save assignment' : 'Create assignment'}</button>
      </form>}
      {tab === 'quiz' && <form className="space-y-3" key={editingQuiz || 'new'} onSubmit={event => { try { saveQuiz(event) } catch (failure) { setError(failure instanceof Error ? failure.message : 'Check your questions') } }}>
        <label className="block text-xs font-semibold">Quiz<select className="sv-field mt-2" value={editingQuiz} onChange={event => { setEditingQuiz(event.target.value); setNotice('') }}><option value="">New quiz</option>{quizzes.map(item => <option value={item.id} key={item.id}>Edit: {item.title}</option>)}</select></label>
        <input className="sv-field" name="title" aria-label="Quiz title" placeholder="Quiz title" defaultValue={quiz?.title} maxLength={160} required />
        <p className="text-xs leading-relaxed text-slate-500">Enter the question, then one option per line. Mark the correct option with *. Separate questions with a blank line.</p>
        <textarea className="sv-field" aria-label="Quiz questions and answers" name="questions" rows={10} defaultValue={quizText(quiz)} placeholder={'Which hook manages side effects?\nuseState\n*useEffect\nuseRef\n\nWhat does HTML describe?\n*Structure\nStyling'} required />
        <button className="sv-button">{editingQuiz ? 'Save quiz' : 'Create quiz'}</button>
      </form>}
    </fieldset>
  </section>
}
