import { Link, useNavigate } from 'react-router-dom'
import HeroCard from './HeroCard'
import { useAuth } from '../auth/AuthProvider'
import useLearningData from '../../lib/useLearningData'

export default function DashboardHome() {
  const { profile } = useAuth()
  const { enrollments, enrolled, completed, assignments, quizzes, loading, error, reload } = useLearningData()
  const navigate = useNavigate()
  const pending = assignments.filter(item => !item.submission)
  const metrics = [
    { label: 'Enrolled courses', value: enrolled.length, path: '/courses' },
    { label: 'Lessons completed', value: enrollments.reduce((total, item) => total + item.completed, 0), path: '/progress' },
    { label: 'Courses completed', value: completed.length, path: '/progress' },
    { label: 'Quiz attempts', value: quizzes.reduce((total, item) => total + item.attempts, 0), path: '/quizzes' },
  ]
  return <main className="flex flex-1 flex-col gap-5 overflow-auto p-6">
    {loading && <p role="status" className="text-sm text-blue-600">Loading your learning dashboard…</p>}
    {error && <p role="alert" className="sv-alert sv-alert-error">{error} <button className="sv-link" onClick={() => void reload()}>Retry</button></p>}
    <HeroCard userName={profile?.name} pendingAssignments={pending.length} coursesInProgress={enrolled.length - completed.length} onContinue={() => navigate('/courses')} />
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{metrics.map(metric => <Link key={metric.label} to={metric.path} className="rounded-2xl border border-blue-100 bg-white p-5 no-underline"><p className="text-xs font-medium text-slate-400">{metric.label}</p><p className="mt-2 text-3xl font-extrabold text-slate-800">{loading ? '—' : metric.value}</p></Link>)}</div>
    <div className="grid gap-5 lg:grid-cols-3">
      <section className="rounded-2xl border border-blue-100 bg-white p-5 lg:col-span-2"><div className="mb-4 flex justify-between"><h2 className="font-bold text-slate-800">Continue your journey</h2><Link to="/courses" className="sv-link">View all</Link></div>
        {!loading && !enrolled.length && <p className="py-8 text-sm text-slate-400">Your learning journey is a blank canvas. Explore courses to get started.</p>}
        {enrolled.slice(0, 4).map(course => {
          const saved = enrollments.find(item => item.courseId === course.id)
          return <Link to={`/courses?q=${encodeURIComponent(course.name)}`} key={course.id} className="block border-t border-blue-50 py-4 no-underline"><div className="mb-2 flex justify-between gap-3"><h3 className="text-sm font-semibold text-slate-700">{course.name}</h3><span className="text-xs text-blue-600">{Math.round((saved?.completed || 0) / course.lessons * 100)}%</span></div><progress value={saved?.completed || 0} max={course.lessons} aria-label={`${course.name} progress`} className="h-2 w-full accent-blue-600" /></Link>
        })}
      </section>
      <section className="rounded-2xl border border-blue-100 bg-white p-5"><h2 className="mb-4 font-bold text-slate-800">Coming up next</h2>{!loading && !pending.length && <p className="py-8 text-sm text-slate-400">You’re all caught up. New assignments will appear here.</p>}{pending.slice().sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate)).slice(0, 4).map(item => <Link to="/assignments" key={item.id} className="block border-t border-blue-50 py-4 no-underline"><h3 className="text-sm font-semibold text-slate-700">{item.title}</h3><p className="mt-2 text-xs text-slate-400">{item.course} · Due {new Date(item.dueDate).toLocaleDateString()}</p></Link>)}</section>
    </div>
  </main>
}
