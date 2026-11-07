import { Link } from 'react-router-dom'
import useLearningData from '../../lib/useLearningData'

export default function LearningProgress({ analytics = false }: { analytics?: boolean }) {
  const { enrolled, enrollments, completed, assignments, quizzes, loading, error, reload } = useLearningData()
  const lessons = enrollments.reduce((total, item) => total + item.completed, 0)
  const total = enrolled.reduce((count, course) => count + course.lessons, 0)
  const graded = assignments.filter(item => item.submission?.status === 'Graded')
  return <main className="sv-page">
    <div className="sv-page-header"><div><h1 className="sv-title">{analytics ? 'Learning Analytics' : 'Your Progress'}</h1><p className="sv-subtitle">A clear picture of your learning, based on saved activity.</p></div><button className="sv-btn-secondary" onClick={() => void reload()} disabled={loading}>Refresh</button></div>
    {loading && <p role="status" className="sv-state">Loading your progress…</p>}{error && <p role="alert" className="sv-alert sv-alert-error">{error}</p>}
    <div className="sv-grid-stats">{[
      ['Overall completion', `${total ? Math.round(lessons / total * 100) : 0}%`],
      ['Lessons completed', `${lessons} / ${total}`],
      ['Completed courses', completed.length],
      ['Average assignment grade', graded.length ? `${Math.round(graded.reduce((sum, item) => sum + (item.submission?.score || 0), 0) / graded.length)}%` : 'No grades yet'],
    ].map(([label, value]) => <section key={label} className="sv-card sv-card-pad !p-5"><p className="sv-stat-label">{label}</p><p className={`sv-stat-value ${String(value).length > 8 ? '!text-xl' : ''}`}>{loading ? '—' : value}</p></section>)}</div>
    <section className="sv-card sv-card-pad"><h2 className="sv-section-title mb-4">Course completion</h2>{!loading && !enrolled.length && <p className="sv-desc">Enroll in a course to start tracking your progress. <Link className="sv-link" to="/courses">Explore courses</Link></p>}{enrolled.map(course => {
      const saved = enrollments.find(item => item.courseId === course.id)
      return <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0" key={course.id}><div className="mb-2 flex items-baseline justify-between gap-4"><Link className="min-w-0 text-sm font-semibold text-slate-800 no-underline hover:text-blue-700" to={`/courses?q=${encodeURIComponent(course.name)}`}>{course.name}</Link><p className="sv-meta shrink-0">{saved?.completed}/{course.lessons} lessons</p></div><progress className="sv-progress" value={saved?.completed || 0} max={course.lessons} aria-label={course.name} /></div>
    })}</section>
    {analytics && <section className="sv-card sv-card-pad"><h2 className="sv-section-title mb-4">Quiz performance</h2>{quizzes.filter(quiz => quiz.attempts).length === 0 && <p className="sv-desc">Complete a quiz to see your results here.</p>}{quizzes.filter(quiz => quiz.attempts).map(quiz => <div key={quiz.id} className="flex items-center justify-between gap-4 border-t border-slate-100 py-4 first:border-t-0 first:pt-0 last:pb-0"><div className="min-w-0"><h3 className="text-sm font-semibold text-slate-800">{quiz.title}</h3><p className="sv-meta mt-1">{quiz.attempts} {quiz.attempts === 1 ? 'attempt' : 'attempts'}</p></div><p className="sv-badge shrink-0">{quiz.bestScore}% best</p></div>)}</section>}
  </main>
}
