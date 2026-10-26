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
  return <main className="flex-1 overflow-auto p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-slate-800">{active?.name || (lessonsOnly ? 'Video Lessons' : 'My Courses')}</h1><p className="mt-1 text-sm text-slate-400">{active ? `${enrollment?.completed || 0} of ${active.lessons} lessons complete` : lessonsOnly ? 'Read, watch, and keep your progress moving.' : 'Explore your next skill. Learn at your own pace.'}</p></div><button disabled={busy || loading} className="sv-link" onClick={() => { if (active) setActive(null); else void reload() }}>{active ? 'Back to courses' : 'Refresh'}</button></div>
    {(error || failure) && <p role="alert" className="sv-alert sv-alert-error">{error || failure}</p>}
    {(loading || busy) && <p role="status" className="mb-4 text-sm text-blue-600">{busy ? 'Saving or opening course…' : 'Loading your courses…'}</p>}
    {active && selected ? <div className="grid gap-5 lg:grid-cols-4">
      <nav aria-label="Course lessons" className="space-y-2 rounded-2xl border border-blue-100 bg-white p-3 lg:col-span-1">{lessons.map((lesson, i) => <div key={lesson.id}>
        {lesson.module && lesson.module !== lessons[i - 1]?.module && <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">{lesson.module}</p>}
        <button onClick={() => setIndex(i)} className={index === i ? 'w-full rounded-xl bg-blue-50 p-3 text-left text-sm font-semibold text-blue-700' : 'w-full rounded-xl p-3 text-left text-sm text-slate-500'}>{i < (enrollment?.completed || 0) ? 'Completed · ' : `${i + 1}. `}{lesson.title}</button>
      </div>)}</nav>
      <article className="rounded-2xl border border-blue-100 bg-white p-6 lg:col-span-3">{selected.module && <p className="mb-1 text-xs font-semibold text-blue-600">{selected.module}</p>}<h2 className="text-xl font-bold text-slate-800">{selected.title}</h2>{selected.description && <p className="mb-5 mt-1 text-sm text-slate-500">{selected.description}</p>}{!selected.description && <div className="mb-5" />}
        {selected.videoUrl && (/\.(mp4|webm|ogg)(\?|$)/i.test(selected.videoUrl) ? <video className="mb-5 aspect-video w-full rounded-xl bg-slate-900" controls src={selected.videoUrl} preload="metadata"><a href={selected.videoUrl}>Open video</a></video> : <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer" className="mb-5 flex items-center gap-3 rounded-xl bg-blue-50 p-5 text-sm font-semibold text-blue-700"><VideoIcon color={blueTheme.logoColor} />Watch lesson video in a new tab</a>)}
        <p className="whitespace-pre-wrap text-sm leading-loose text-slate-600">{selected.content}</p>
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-blue-50 pt-5"><p className="text-xs text-slate-400">Your progress is saved to your account.</p><button disabled={busy || index !== enrollment?.completed} className="sv-button" onClick={() => void complete()}>{index < (enrollment?.completed || 0) ? 'Lesson completed' : index > (enrollment?.completed || 0) ? 'Complete earlier lessons first' : 'Mark complete & continue'}</button></div>
      </article>
    </div> : !active && <>
      <div className="mb-6 flex flex-wrap items-center gap-3"><input className="sv-field max-w-xs" aria-label="Search courses" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a course…" /><div className="flex gap-2">{['All courses', 'Enrolled', 'Completed'].map(value => <button key={value} className={filter === value ? 'sv-button' : 'sv-link px-3'} onClick={() => setFilter(value)}>{value}</button>)}</div></div>
      {!loading && visible.length === 0 && <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center text-sm text-slate-400">{lessonsOnly ? 'Enroll in a course to start its lessons.' : 'No courses found. Published instructor courses will appear here.'}</div>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visible.map(course => {
        const saved = enrollments.find(item => item.courseId === course.id)
        const percent = Math.round((saved?.completed || 0) / course.lessons * 100)
        return <article key={course.id} className="flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white">
          <div className="relative flex h-36 items-end justify-between bg-gradient-to-br from-blue-50 via-blue-100 to-sky-100 p-4">
            {course.thumbnail ? <img src={course.thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" /> : <span className="absolute left-4 top-4 flex size-12 items-center justify-center rounded-2xl bg-white/80"><CoursesIcon color={blueTheme.logoColor} size={25} /></span>}
            {course.thumbnail && <span className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />}
            <span className="relative rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700">{course.category || 'Course'}</span>
            <span className="relative rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700">{course.lessons} lessons</span>
          </div>
          <div className="flex flex-1 flex-col p-5"><h2 className="font-bold text-slate-800">{course.name}</h2><p className="mt-1 text-xs text-slate-400">By {course.instructor}{course.difficulty ? ` · ${course.difficulty}` : ''}{course.duration ? ` · ${course.duration}` : ''}</p><p className="my-4 line-clamp-2 text-sm leading-relaxed text-slate-500">{course.description || 'A new opportunity to grow your skills.'}</p>
            {saved && <div className="mb-4 mt-auto"><div className="mb-2 flex justify-between text-xs text-slate-400"><span>{saved.completed}/{course.lessons} lessons</span><span className="font-semibold text-blue-600">{percent}%</span></div><progress aria-label={`${course.name} completion`} className="h-2 w-full accent-blue-600" value={saved.completed} max={course.lessons} /></div>}
            <button disabled={busy || loading} className="sv-button mt-auto w-full" onClick={() => void (saved ? open(course) : enroll(course))}>{saved ? percent === 100 ? 'Review course' : 'Continue learning' : 'Enroll in course'}</button>
          </div>
        </article>
      })}</div>
    </>}
  </main>
}
