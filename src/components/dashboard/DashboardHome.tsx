import { Link, useNavigate } from 'react-router-dom'
import HeroCard from './HeroCard'
import { useAuth } from '../auth/AuthProvider'
import useLearningData from '../../lib/useLearningData'
import { StudentCharts } from './charts'
import useStudentNotifications from '../../lib/useStudentNotifications'

export default function DashboardHome() {
  const { profile } = useAuth()
  const { enrollments, enrolled, completed, assignments, quizzes, loading, error, reload } = useLearningData()
  const navigate = useNavigate()
  const notifications = useStudentNotifications(true)
  const pending = assignments.filter(item => !item.submission)
  const metrics = [
    { label: 'Enrolled courses', value: enrolled.length, path: '/courses' },
    { label: 'Lessons completed', value: enrollments.reduce((total, item) => total + item.completed, 0), path: '/progress' },
    { label: 'Courses completed', value: completed.length, path: '/progress' },
    { label: 'Quiz attempts', value: quizzes.reduce((total, item) => total + item.attempts, 0), path: '/quizzes' },
  ]
  return <main className="sv-page">
    {loading && <p role="status" className="sv-state">Loading your learning dashboard…</p>}
    {error && <p role="alert" className="sv-alert sv-alert-error">{error} <button className="sv-link" onClick={() => void reload()}>Retry</button></p>}
    <HeroCard userName={profile?.name} pendingAssignments={pending.length} coursesInProgress={enrolled.length - completed.length} onContinue={() => navigate('/courses')} />
    <div className="sv-grid-stats">{metrics.map(metric => <Link key={metric.label} to={metric.path} className="sv-card sv-card-link p-5"><p className="sv-stat-label">{metric.label}</p><p className="sv-stat-value">{loading ? '—' : metric.value}</p></Link>)}</div>
    <Link to="/notifications" className="sv-card sv-card-link flex min-w-0 flex-wrap items-center justify-between gap-4 p-5">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="sv-section-title">Notifications</h2>{notifications.unread > 0 && <span className="sv-badge">{notifications.unread} unread</span>}</div>
        <p className="sv-meta mt-1">{notifications.loading ? 'Checking for course updates…' : notifications.error ? 'Unable to load notifications. Open Notifications to retry.' : notifications.items[0] ? notifications.items[0].title : 'No new announcements, assignment updates, or grades.'}</p>
      </div>
      <span className="sv-link shrink-0">View notifications</span>
    </Link>
    <StudentCharts courses={enrolled} enrollments={enrollments} assignments={assignments} loading={loading} error={error} />
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="sv-card sv-card-pad min-w-0 lg:col-span-2"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="sv-section-title">Continue your journey</h2><Link to="/courses" className="sv-link">View all</Link></div>
        {!loading && !enrolled.length && <p className="sv-empty">Your learning journey is a blank canvas. Explore courses to get started.</p>}
        {enrolled.slice(0, 4).map(course => {
          const saved = enrollments.find(item => item.courseId === course.id)
          return <Link to={`/courses?q=${encodeURIComponent(course.name)}`} key={course.id} className="sv-list-row"><div className="mb-2 flex items-baseline justify-between gap-3"><h3 className="min-w-0 text-sm font-semibold text-slate-800">{course.name}</h3><span className="sv-meta shrink-0 font-semibold text-blue-700">{Math.round((saved?.completed || 0) / course.lessons * 100)}%</span></div><progress value={saved?.completed || 0} max={course.lessons} aria-label={`${course.name} progress`} className="sv-progress" /></Link>
        })}
      </section>
      <section className="sv-card sv-card-pad min-w-0"><h2 className="sv-section-title mb-4">Coming up next</h2>{!loading && !pending.length && <p className="sv-empty">You’re all caught up. New assignments will appear here.</p>}{pending.slice().sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate)).slice(0, 4).map(item => <Link to="/assignments" key={item.id} className="sv-list-row"><h3 className="text-sm font-semibold text-slate-800">{item.title}</h3><p className="sv-meta mt-1">{item.course} · Due {new Date(item.dueDate).toLocaleDateString()}</p></Link>)}</section>
    </div>
  </main>
}
