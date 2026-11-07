import { useEffect, useRef, useState } from 'react'
import { backend } from '../../lib/backend'
import type { Quiz, Attempt, QuizSession } from '../../lib/types'

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [active, setActive] = useState<Quiz | null>(null)
  const [session, setSession] = useState<QuizSession | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<Attempt | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAnswer, setSavingAnswer] = useState(false)
  const [error, setError] = useState('')
  const [savedSessions, setSavedSessions] = useState(false)
  const deadline = useRef<number | null>(null)
  const autoSubmitted = useRef(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const [items, health] = await Promise.all([
        backend<Quiz[]>('/quizzes'),
        backend<{ capabilities?: string[] }>('/health', 'GET', undefined, true).catch(() => null),
      ])
      setQuizzes(items)
      setSavedSessions(health?.capabilities?.includes('assessment-management-v1') === true)
    }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load quizzes') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (!session || result || deadline.current === null) return
    const update = () => setRemaining(Math.max(0, Math.ceil((deadline.current! - Date.now()) / 1000)))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [session, result])

  async function start(quiz: Quiz) {
    if (saving) return
    if (!savedSessions) {
      if (quiz.duration) { setError('This timed quiz requires the updated SkillVerse server. No attempt has been started.'); return }
      // Preserve the original untimed-quiz workflow until the server upgrade is
      // deployed. Submission still goes to the real, existing scoring endpoint.
      setActive(quiz); setSession(null); setAnswers(quiz.questions.map(() => -1)); setResult(null); setRemaining(null); setError('')
      deadline.current = null
      return
    }
    setSaving(true); setError('')
    try {
      const saved = await backend<QuizSession>(`/quizzes/${encodeURIComponent(quiz.id)}/start`, 'POST', {})
      if (!saved.id || !Array.isArray(saved.questions) || !Array.isArray(saved.answers) || !Number.isFinite(Date.parse(saved.serverTime))) throw new Error('The connected server does not support saved quiz sessions yet.')
      deadline.current = saved.expiresAt ? Date.now() + Date.parse(saved.expiresAt) - Date.parse(saved.serverTime) : null
      autoSubmitted.current = false
      setSession(saved); setActive({ ...quiz, questions: saved.questions }); setAnswers(saved.answers); setResult(null)
      setRemaining(deadline.current === null ? null : Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)))
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to start quiz') }
    finally { setSaving(false) }
  }
  async function saveAnswer(index: number, value: number) {
    if (!active || saving || remaining === 0) return
    const previous = answers
    const next = answers.map((answer, i) => i === index ? value : answer)
    setAnswers(next)
    if (!session) return
    setSaving(true); setSavingAnswer(true); setError('')
    try {
      await backend(`/quizzes/${encodeURIComponent(active.id)}/attempts/${encodeURIComponent(session.id)}`, 'PUT', { answers: next })
    } catch (failure) {
      setAnswers(previous)
      setError(failure instanceof Error ? failure.message : 'Your answer could not be saved. Please select it again.')
    } finally { setSaving(false); setSavingAnswer(false) }
  }
  async function submit(expired = false) {
    if (!active || saving || (!expired && answers.some(answer => answer < 0))) return
    setSaving(true); setError('')
    try {
      const attempt = await backend<Attempt>(`/quizzes/${encodeURIComponent(active.id)}/attempts`, 'POST', session ? { attemptId: session.id, answers } : { answers })
      setResult(attempt)
      setQuizzes(current => current.map(quiz => quiz.id === active.id ? { ...quiz, inProgress: false, attempts: quiz.attempts + 1, bestScore: Math.max(quiz.bestScore, attempt.score) } : quiz))
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to submit quiz. Your server-saved answers are retained.') }
    finally { setSaving(false) }
  }
  useEffect(() => {
    if (remaining === 0 && active && session && !result && !saving && !autoSubmitted.current) {
      autoSubmitted.current = true
      void submit(true)
    }
  }, [remaining, active, session, result, saving])

  function back() {
    if (saving) return
    if (active && !result && !window.confirm(session ? 'Leave this quiz? Your server-saved answers will be available when you resume. A time limit keeps running.' : 'Leave this quiz? Answers not submitted will be discarded.')) return
    setActive(null); setSession(null); setResult(null); setRemaining(null); setError(''); deadline.current = null
    void load()
  }
  const timeLabel = remaining === null ? '' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`

  return <main className="sv-page">
    <div className="sv-page-header"><div><h1 className="sv-title">{active ? active.title : 'Quizzes'}</h1><p className="sv-subtitle">{active ? active.course : 'Check your understanding, one milestone at a time.'}</p></div><button className="sv-btn-secondary" disabled={loading || saving} onClick={() => { if (active) back(); else void load() }}>{active ? 'Back to quizzes' : 'Refresh'}</button></div>
    {error && <p role="alert" className="sv-alert sv-alert-error">{error}</p>}
    {loading && <p role="status" className="sv-state">Loading quizzes…</p>}
    {!loading && !active && quizzes.length === 0 && <div className="sv-card sv-empty">No quizzes available yet. Your enrolled courses’ published quizzes will appear here.</div>}
    {!active && <div className="sv-grid-cards">{quizzes.map(quiz => <article key={quiz.id} className="sv-card sv-card-pad flex h-full flex-col gap-3">
      <span className={`sv-badge ${quiz.inProgress ? 'sv-badge-warn' : quiz.attempts ? 'sv-badge-success' : 'sv-badge-neutral'}`}>{quiz.inProgress ? 'Attempt in progress' : quiz.attempts ? 'Completed' : 'Not started'}</span>
      <div><h2 className="sv-card-title">{quiz.title}</h2><p className="sv-meta mt-1">{quiz.course}</p></div>
      {quiz.description && <p className="sv-desc whitespace-pre-wrap">{quiz.description}</p>}
      <p className="sv-desc">{quiz.questions.length} questions · {quiz.attempts} {quiz.attempts === 1 ? 'attempt' : 'attempts'}</p>
      <p className="sv-meta">{quiz.duration ? `${quiz.duration} minutes` : 'No time limit'} · {quiz.passingScore !== undefined || savedSessions ? `Pass mark ${quiz.passingScore ?? 50}%` : 'Passing score not set'} · {quiz.maxMarks ?? quiz.questions.reduce((sum, question) => sum + (question.marks ?? 1), 0)} marks</p>
      <p className="sv-desc font-semibold text-blue-700">{quiz.attempts > 0 ? `Best score: ${quiz.bestScore}%` : '\u00a0'}</p>
      <button className="sv-button mt-auto w-full" disabled={saving || loading} onClick={() => void start(quiz)}>{saving ? 'Opening…' : quiz.inProgress ? 'Resume quiz' : quiz.attempts ? 'Retake quiz' : 'Start quiz'}</button>
    </article>)}</div>}
    {active && (result ? <section className="sv-card sv-card-pad mx-auto w-full max-w-lg text-center">
      <p className="sv-eyebrow">Quiz complete</p><h2 className="my-3 text-5xl font-bold text-blue-600">{result.score}%</h2>
      <p className="sv-desc">{result.correct} of {result.total} correct{result.marks !== undefined && ` · ${result.marks} / ${result.maxMarks} marks`}</p>
      {result.passed !== undefined && <p className={`sv-badge mx-auto mt-3 ${result.passed ? 'sv-badge-success' : 'sv-badge-neutral'}`}>{result.passed ? 'Passed' : 'Below passing score'} · Pass mark {result.passingScore ?? active.passingScore ?? 50}%</p>}
      {result.status === 'Expired' && <p className="sv-desc mt-3">Time expired. Your last server-saved answers were graded; late answers were not accepted.</p>}
      <p className="sv-meta my-4">Your result has been saved to your account.</p><button className="sv-button" onClick={back}>Back to quizzes</button>
    </section> : <form className="mx-auto flex w-full max-w-2xl flex-col gap-4" onSubmit={event => { event.preventDefault(); void submit(remaining === 0) }}>
      <section className="sv-card sv-card-pad space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="sv-label">{active.questions.reduce((sum, question) => sum + (question.marks ?? 1), 0)} marks{session && ` · Pass mark ${session.passingScore}%`}</p>{remaining !== null && <p className={`sv-badge ${remaining <= 60 ? 'sv-badge-warn' : ''}`} role="timer" aria-label={`Time remaining ${timeLabel}`}>Time remaining {timeLabel}</p>}</div>
        {active.instructions && <p className="sv-desc whitespace-pre-wrap">{active.instructions}</p>}
        <p className="sv-meta">{session ? `Answers are saved to the server as you select them. ${remaining !== null ? 'The server enforces the time limit, including time away from this page.' : 'You can leave and resume this attempt.'}` : 'This is an untimed quiz on the existing server. Answers are saved only when you submit; leaving discards unsent answers.'}</p>
        {savingAnswer && <p className="sv-state" role="status">Saving answer…</p>}
      </section>
      {active.questions.map((question, i) => <fieldset key={i} disabled={saving || remaining === 0} className="sv-card sv-card-pad min-w-0">
        <legend className="sv-card-title mb-4 float-left w-full">{i + 1}. {question.q}<span className="sv-meta mt-1 block">{question.marks ?? 1} {(question.marks ?? 1) === 1 ? 'mark' : 'marks'}</span></legend>
        <div className="clear-both flex flex-col gap-2">{question.options.map((option, j) => <label key={j} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm text-slate-700 transition-colors ${answers[i] === j ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}><input type="radio" className="size-4 shrink-0 accent-blue-600" name={`question-${i}`} value={j} required={remaining !== 0} checked={answers[i] === j} onChange={() => void saveAnswer(i, j)} /><span className="min-w-0 break-words">{option}</span></label>)}</div>
      </fieldset>)}
      <button disabled={saving || (remaining !== 0 && answers.some(answer => answer < 0))} className="sv-button w-full">{saving ? savingAnswer ? 'Saving answer…' : 'Saving result…' : remaining === 0 ? 'Retrieve saved result' : 'Submit quiz'}</button>
    </form>)}
  </main>
}
