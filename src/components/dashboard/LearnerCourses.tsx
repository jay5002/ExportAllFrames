import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { backend } from '../../lib/backend'
import useLearningData from '../../lib/useLearningData'
import type { Course, Enrollment, Lesson } from '../../lib/types'
import { CoursesIcon, VideoIcon } from './icons'
import { blueTheme } from './theme'

export default function LearnerCourses({ lessonsOnly = false }: { lessonsOnly?: boolean }) {
  const { courses, enrollments, setEnrollments, loading, error, reload } = useLearningData()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filter, setFilter] = useState('All courses')
  const [active, setActive] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  useEffect(() => { setQuery(searchParams.get('q') || '') }, [searchParams])
  async function enroll(course: Course) {
    if (busy) return
    setBusy(true); setFailure('')
    try {
      const item = await backend<Enrollment>(`/enrollments/${course.id}`, 'PUT', { completed: 0 })
      setEnrollments(current => [...current.filter(record => record.courseId !== course.id), item])
    } catch (error) { setFailure(error instanceof Error ? error.message : 'Unable to enroll') }
    finally { setBusy(false) }
  }
  async function open(course: Course) {
    if (busy) return
    setBusy(true); setFailure('')
    try {
      setLessons(await backend<Lesson[]>(`/courses/${course.id}/lessons`))
      setIndex(Math.min(enrollments.find(item => item.courseId === course.id)?.completed || 0, course.lessons - 1))
      setActive(course)
    } catch (error) { setFailure(error instanceof Error ? error.message : 'Unable to open course') }
    finally { setBusy(false) }
  }
  async function complete() {
    if (!active || busy) return
    setBusy(true); setFailure('')
    try {
      const current = enrollments.find(item => item.courseId === active.id)
      const item = await backend<Enrollment>(`/enrollments/${active.id}`, 'PUT', { completed: (current?.completed || 0) + 1 })
      setEnrollments(records => records.map(record => record.courseId === item.courseId ? item : record))
      if (index < lessons.length - 1) setIndex(value => value + 1)
    } catch (error) { setFailure(error instanceof Error ? error.message : 'Unable to save progress') }
    finally { setBusy(false) }
  }
  const visible = courses.filter(course => {
    const saved = enrollments.find(item => item.courseId === course.id)
    return course.name.toLowerCase().includes(query.toLowerCase()) &&
      (!lessonsOnly || !!saved) && (filter === 'All courses' || filter === 'Enrolled' && !!saved || filter === 'Completed' && saved?.completed === course.lessons)
  })
  const selected = lessons[index]
  const enrollment = enrollments.find(item => item.courseId === active?.id)
  const completedCount = enrollment?.completed || 0
  return <main className="sv-page">
    <div className="sv-page-header"><div>{active && <p className="sv-eyebrow">{active.category || 'Course'}</p>}<h1 className="sv-title">{active?.name || (lessonsOnly ? 'Video Lessons' : 'My Courses')}</h1><p className="sv-subtitle">{active ? `${completedCount} of ${active.lessons} lessons complete` : lessonsOnly ? 'Read, watch, and keep your progress moving.' : 'Explore your next skill. Learn at your own pace.'}</p></div><button disabled={busy || loading} className="sv-btn-secondary" onClick={() => { if (active) setActive(null); else void reload() }}>{active ? 'Back to courses' : 'Refresh'}</button></div>
    {(error || failure) && <p role="alert" className="sv-alert sv-alert-error">{error || failure}</p>}
    {(loading || busy) && <p role="status" className="sv-state">{busy ? 'Saving or opening course…' : 'Loading your courses…'}</p>}
    {active && selected ? <div className="sv-lesson-layout">
      <nav aria-label="Course lessons" className="sv-card sv-lesson-nav">{lessons.map((lesson, i) => <div key={lesson.id}>
        {lesson.module && lesson.module !== lessons[i - 1]?.module && <p className="sv-meta px-3 pb-1 pt-4 font-semibold uppercase tracking-wide">{lesson.module}</p>}
        <button onClick={() => setIndex(i)} aria-current={index === i} className="sv-lesson-item"><span className={i < completedCount ? 'sv-lesson-dot is-done' : 'sv-lesson-dot'} aria-hidden="true">{i < completedCount ? '✓' : i + 1}</span><span className="min-w-0 flex-1">{lesson.title}{i < completedCount && <span className="sr-only"> (completed)</span>}</span></button>
      </div>)}</nav>
      <article className="sv-card sv-lesson-article min-w-0">{selected.module && <p className="sv-eyebrow">{selected.module}</p>}<h2 className="sv-title">{selected.title}</h2>{selected.description && <p className="sv-desc mt-2 max-w-[68ch]">{selected.description}</p>}<div className="mt-6" />
        {selected.videoUrl && (/\.(mp4|webm|ogg)(\?|$)/i.test(selected.videoUrl) ? <video className="mb-6 aspect-video w-full rounded-lg bg-slate-900" controls src={selected.videoUrl} preload="metadata"><a href={selected.videoUrl}>Open video</a></video> : <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer" className="mb-6 flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700 no-underline"><VideoIcon color={blueTheme.logoColor} />Watch lesson video in a new tab</a>)}
        <p className="sv-prose">{selected.content}</p>
        <div className="sv-lesson-footer"><p className="sv-meta">Your progress is saved to your account.</p><button disabled={busy || index !== completedCount} className="sv-button" onClick={() => void complete()}>{index < completedCount ? 'Lesson completed' : index > completedCount ? 'Complete earlier lessons first' : 'Mark complete & continue'}</button></div>
      </article>
    </div> : !active && <>
      <div className="flex flex-wrap items-center gap-3"><input className="sv-field sm:max-w-xs" aria-label="Search courses" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a course…" /><div className="flex flex-wrap gap-2">{['All courses', 'Enrolled', 'Completed'].map(value => <button key={value} className="sv-chip" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
      {!loading && visible.length === 0 && <div className="sv-card sv-empty">{lessonsOnly ? 'Enroll in a course to start its lessons.' : 'No courses found. Published instructor courses will appear here.'}</div>}
      <div className="sv-grid-cards">{visible.map(course => {
        const saved = enrollments.find(item => item.courseId === course.id)
        const percent = Math.round((saved?.completed || 0) / course.lessons * 100)
        return <article key={course.id} className="sv-card flex h-full flex-col overflow-hidden">
          <div className="relative flex aspect-[16/9] w-full shrink-0 items-start justify-between gap-2 bg-blue-50 p-3">
            {course.thumbnail ? <img src={course.thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-blue-600"><CoursesIcon color={blueTheme.logoColor} size={36} /></span>}
            <span className="sv-badge relative bg-white/95 shadow-sm">{course.category || 'Course'}</span>
            <span className="sv-badge sv-badge-neutral relative bg-white/95 shadow-sm">{course.lessons} lessons</span>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <div><h2 className="sv-card-title line-clamp-2 min-h-12">{course.name}</h2><p className="sv-meta mt-1 truncate">By {course.instructor}{course.difficulty ? ` · ${course.difficulty}` : ''}{course.duration ? ` · ${course.duration}` : ''}</p></div>
            <p className="sv-desc line-clamp-3 min-h-[66px]">{course.description || 'A new opportunity to grow your skills.'}</p>
            <div className="mt-auto flex flex-col gap-4 pt-1">
              <div className={saved ? '' : 'invisible'} aria-hidden={!saved}><div className="sv-meta mb-2 flex justify-between"><span>{saved?.completed || 0}/{course.lessons} lessons</span><span className="font-semibold text-blue-700">{percent}%</span></div><progress aria-label={`${course.name} completion`} className="sv-progress" value={saved?.completed || 0} max={course.lessons} /></div>
              <button disabled={busy || loading} className="sv-button w-full" onClick={() => void (saved ? open(course) : enroll(course))}>{saved ? percent === 100 ? 'Review course' : 'Continue learning' : 'Enroll in course'}</button>
            </div>
          </div>
        </article>
      })}</div>
    </>}
  </main>
}
