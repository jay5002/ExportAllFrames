import { useEffect, useState } from 'react'
import { backend } from '../../lib/backend'
import type { Quiz, Attempt } from '../../lib/types'

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [active, setActive] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<Attempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { setQuizzes(await backend<Quiz[]>('/quizzes')) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load quizzes') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  async function submit() {
    if (!active || saving || answers.some(answer => answer < 0)) return
    setSaving(true); setError('')
    try {
      const attempt = await backend<Attempt>(`/quizzes/${active.id}/attempts`, 'POST', { answers })
      setResult(attempt)
      setQuizzes(current => current.map(quiz => quiz.id === active.id ? { ...quiz, attempts: quiz.attempts + 1, bestScore: Math.max(quiz.bestScore, attempt.score) } : quiz))
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to submit quiz') }
    finally { setSaving(false) }
  }
  return <main className="flex-1 overflow-auto p-6">
    <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-extrabold text-slate-800">{active ? active.title : 'Quizzes'}</h1><p className="mt-1 text-sm text-slate-500">{active ? active.course : 'Check your understanding, one milestone at a time.'}</p></div><button className="sv-link" disabled={loading || saving} onClick={() => { if (active) { setActive(null); setResult(null); setError('') } else void load() }}>{active ? 'Back to quizzes' : 'Refresh'}</button></div>
    {error && <p role="alert" className="sv-alert sv-alert-error">{error}</p>}
    {loading && <p role="status" className="text-sm text-slate-500">Loading quizzes…</p>}
    {!loading && !active && quizzes.length === 0 && <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-sm text-slate-500">No quizzes available yet. Your enrolled courses’ quizzes will appear here.</div>}
    {!active && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{quizzes.map(quiz => <article key={quiz.id} className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-5">
      <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">{quiz.attempts ? 'Completed' : 'Not started'}</span><h2 className="font-bold text-slate-800">{quiz.title}</h2><p className="text-xs text-slate-400">{quiz.course}</p>
      <p className="text-xs text-slate-500">{quiz.questions.length} questions · {quiz.attempts} attempts</p>{quiz.attempts > 0 && <p className="text-sm font-semibold text-blue-700">Best score: {quiz.bestScore}%</p>}
      <button className="sv-button mt-auto" onClick={() => { setActive(quiz); setResult(null); setAnswers(Array(quiz.questions.length).fill(-1)); setError('') }}>{quiz.attempts ? 'Retake quiz' : 'Start quiz'}</button>
    </article>)}</div>}
    {active && (result ? <section className="mx-auto max-w-lg rounded-2xl border border-blue-100 bg-white p-8 text-center">
      <p className="text-sm font-semibold text-blue-500">QUIZ COMPLETE</p><h2 className="my-4 text-4xl font-extrabold text-blue-600">{result.score}%</h2><p className="text-slate-600">{result.correct} of {result.total} correct</p><p className="my-5 text-sm text-slate-400">Your result has been saved to your account.</p><button className="sv-button" onClick={() => { setActive(null); setResult(null) }}>Back to quizzes</button>
    </section> : <form className="mx-auto max-w-2xl space-y-5" onSubmit={event => { event.preventDefault(); void submit() }}>
      {active.questions.map((question, i) => <fieldset key={i} disabled={saving} className="rounded-2xl border border-blue-100 bg-white p-5"><legend className="px-2 text-sm font-bold text-slate-700">{i + 1}. {question.q}</legend><div className="space-y-2">{question.options.map((option, j) => <label key={j} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><input type="radio" name={`question-${i}`} value={j} required checked={answers[i] === j} onChange={() => setAnswers(current => current.map((answer, index) => index === i ? j : answer))} />{option}</label>)}</div></fieldset>)}
      <button disabled={saving || answers.some(answer => answer < 0)} className="sv-button w-full">{saving ? 'Saving result…' : 'Submit quiz'}</button>
    </form>)}
  </main>
}
