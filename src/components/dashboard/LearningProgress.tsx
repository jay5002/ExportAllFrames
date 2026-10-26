import { Link } from 'react-router-dom'
import useLearningData from '../../lib/useLearningData'

export default function LearningProgress({ analytics = false }: { analytics?: boolean }) {
  const { enrolled, enrollments, completed, assignments, quizzes, loading, error, reload } = useLearningData()
  const lessons = enrollments.reduce((total, item) => total + item.completed, 0)
  const total = enrolled.reduce((count, course) => count + course.lessons, 0)
  const graded = assignments.filter(item => item.submission?.status === 'Graded')
  return <main className="flex-1 overflow-auto p-6">
    <div className="mb-6 flex justify-between"><div><h1 className="text-2xl font-extrabold text-slate-800">{analytics ? 'Learning Analytics' : 'Your Progress'}</h1><p className="mt-1 text-sm text-slate-400">A clear picture of your learning, based on saved activity.</p></div><button className="sv-link" onClick={() => void reload()} disabled={loading}>Refresh</button></div>
    {loading && <p role="status" className="mb-4 text-sm text-blue-600">Loading your progress…</p>}{error && <p role="alert" className="sv-alert sv-alert-error">{error}</p>}
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{[
      ['Overall completion', `${total ? Math.round(lessons / total * 100) : 0}%`],
      ['Lessons completed', `${lessons} / ${total}`],
      ['Completed courses', completed.length],
      ['Average assignment grade', graded.length ? `${Math.round(graded.reduce((sum, item) => sum + (item.submission?.score || 0), 0) / graded.length)}%` : 'No grades yet'],
    ].map(([label, value]) => <section key={label} className="rounded-2xl border border-blue-100 bg-white p-5"><p className="text-xs text-slate-400">{label}</p><p className="mt-3 text-2xl font-extrabold text-slate-800">{loading ? '—' : value}</p></section>)}</div>
    <section className="mb-5 rounded-2xl border border-blue-100 bg-white p-6"><h2 className="mb-4 font-bold text-slate-800">Course completion</h2>{!loading && !enrolled.length && <p className="text-sm text-slate-400">Enroll in a course to start tracking your progress. <Link className="sv-link" to="/courses">Explore courses</Link></p>}{enrolled.map(course => {
      const saved = enrollments.find(item => item.courseId === course.id)
      return <div className="border-t border-blue-50 py-4" key={course.id}><div className="mb-3 flex justify-between"><Link className="text-sm font-semibold text-slate-700 no-underline" to={`/courses?q=${encodeURIComponent(course.name)}`}>{course.name}</Link><p className="text-xs text-blue-600">{saved?.completed}/{course.lessons} lessons</p></div><progress className="h-3 w-full accent-blue-600" value={saved?.completed || 0} max={course.lessons} aria-label={course.name} /></div>
    })}</section>
    {analytics && <section className="rounded-2xl border border-blue-100 bg-white p-6"><h2 className="mb-4 font-bold text-slate-800">Quiz performance</h2>{quizzes.filter(quiz => quiz.attempts).length === 0 && <p className="text-sm text-slate-400">Complete a quiz to see your results here.</p>}{quizzes.filter(quiz => quiz.attempts).map(quiz => <div key={quiz.id} className="flex justify-between gap-4 border-t border-blue-50 py-4 text-sm"><div><h3 className="font-semibold text-slate-700">{quiz.title}</h3><p className="mt-1 text-xs text-slate-400">{quiz.attempts} attempts</p></div><p className="font-bold text-blue-600">{quiz.bestScore}% best score</p></div>)}</section>}
  </main>
}
