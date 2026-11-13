import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { backend } from '../../lib/backend'
import { useNavigate } from 'react-router-dom'
import { blueTheme } from './theme'
import CurriculumEditor from './CurriculumEditor'
import { InstructorCharts } from './charts'
import { useSearchParams } from 'react-router-dom'

const t = blueTheme

interface InstructorDashboardProps {
  view?: 'overview' | 'courses' | 'students' | 'grading'
}

interface Course {
  id: string
  description?: string
  name: string
  students: number
  status: 'Published' | 'Draft'
  completion: number
  lessons: number
  category?: string
  difficulty?: string
  duration?: string
  thumbnail?: string
}

interface Submission {
  feedback?: string
  id: string
  content?: string
  studentId: string
  courseId: string
  student: string
  initials: string
  assignment: string
  course: string
  submitted: string
  status: 'Pending' | 'Graded'
  score?: number
}

interface Student {
  id: string
  studentId: string
  courseId: string
  name: string
  initials: string
  course: string
  progress: number
  lastActive: string
  enrolledAt?: string
}

function MiniIcon({ kind, color }: { kind: string; color: string }) {
  if (kind === 'people') {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="8" cy="6" r="3" stroke={color} strokeWidth="1.6" /><path d="M2.5 16c0-3 2.4-5.5 5.5-5.5s5.5 2.5 5.5 5.5M14 4.5a2.7 2.7 0 0 1 0 5.2M15 11c1.7.8 2.5 2.4 2.5 4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" /></svg>
  }
  if (kind === 'chart') {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 16V9m5 7V4m5 12v-6m4 6H2" stroke={color} strokeWidth="1.7" strokeLinecap="round" /></svg>
  }
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="3" stroke={color} strokeWidth="1.6" /><path d="M6.5 8h7M6.5 12h4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" /></svg>
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(15,23,42,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} style={{
        width: '100%', maxWidth: 540, maxHeight: '90dvh', background: '#fff', borderRadius: 12,
        border: `1px solid ${t.cardBorder}`, boxShadow: '0 24px 64px rgba(15,23,42,0.2)', overflow: 'auto',
      }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 600, color: t.sectionText }}>{title}</div>
          <button onClick={onClose} aria-label="Close dialog" style={{
            width: 36, height: 36, borderRadius: 8, border: 'none', background: t.searchBg,
            color: t.sidebarText, cursor: 'pointer', fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

const fieldStyle = {
  width: '100%', border: `1px solid ${t.searchBorder}`, background: '#fff', borderRadius: 8,
  minHeight: 40, padding: '9px 12px', fontSize: 14, color: t.sectionText, outline: 'none',
}

function DetailFields({ course }: { course?: Course }) {
  const label = { fontSize: 13, fontWeight: 600, color: t.sectionText }
  return <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <label style={label}>Category<input name="category" maxLength={60} defaultValue={course?.category} placeholder="e.g. Programming" style={{ ...fieldStyle, marginTop: 6 }} /></label>
      <label style={label}>Difficulty<select name="difficulty" defaultValue={course?.difficulty ?? ''} style={{ ...fieldStyle, marginTop: 6 }}><option value="">Not set</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
      <label style={label}>Estimated duration<input name="duration" maxLength={40} defaultValue={course?.duration} placeholder="e.g. 6 hours" style={{ ...fieldStyle, marginTop: 6 }} /></label>
      <label style={label}>Thumbnail URL<input name="thumbnail" type="url" defaultValue={course?.thumbnail} placeholder="https://…" style={{ ...fieldStyle, marginTop: 6 }} /></label>
    </div>
  </>
}

const detailsFrom = (data: FormData) => ({
  category: String(data.get('category') ?? ''), difficulty: String(data.get('difficulty') ?? ''),
  duration: String(data.get('duration') ?? ''), thumbnail: String(data.get('thumbnail') ?? ''),
})

export default function InstructorDashboard({ view = 'overview' }: InstructorDashboardProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState<'course' | 'message' | 'grade' | 'student' | 'course-detail' | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  useEffect(() => { setQuery(searchParams.get('q') || '') }, [searchParams])
  const activity = submissions.slice(-5).reverse().map(item => ({ initials: item.initials, title: `${item.student} submitted ${item.assignment}`, time: new Date(item.submitted).toLocaleDateString(), color: t.logoColor, target: 'grading' as const }))

  const loadWorkspace = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await backend<{ courses: Course[]; submissions: Submission[]; students: Student[] }>('/workspace')
      setCourses(data.courses)
      setSubmissions(data.submissions)
      setStudents(data.students)
      setConnected(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to load workspace')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void loadWorkspace() }, [])

  const save = async (action: () => Promise<void>) => {
    if (saving || loading) return
    setSaving(true)
    setError('')
    try { await action() } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save changes')
    } finally { setSaving(false) }
  }

  const viewNames = {
    overview: 'Overview',
    courses: 'My Courses',
    students: 'Students',
    grading: 'Grading queue',
  }
  const pendingCount = submissions.filter((submission) => submission.status === 'Pending').length
  const metrics = [
    { label: 'Course enrollments', value: String(students.length), change: 'Enrollment records across your courses', tone: '#2563eb', icon: 'people', target: 'students' as const },
    { label: 'Published courses', value: String(courses.filter((course) => course.status === 'Published').length), change: 'Currently published', tone: '#7c3aed', icon: 'course', target: 'courses' as const },
    { label: 'Submissions to grade', value: String(pendingCount), change: 'Awaiting feedback', tone: '#d97706', icon: 'course', target: 'grading' as const },
    { label: 'Average completion', value: `${students.length ? Math.round(students.reduce((total, student) => total + student.progress, 0) / students.length) : 0}%`, change: 'Average across all enrollments', tone: '#059669', icon: 'chart', target: 'overview' as const },
  ]

  const filteredCourses = useMemo(
    () => courses.filter((course) => course.name.toLowerCase().includes(query.toLowerCase())),
    [courses, query],
  )
  const filteredStudents = useMemo(
    () => students.filter((student) => `${student.name} ${student.course}`.toLowerCase().includes(query.toLowerCase())),
    [query, students],
  )
  const filteredSubmissions = useMemo(
    () => submissions.filter((submission) => `${submission.student} ${submission.assignment} ${submission.course}`.toLowerCase().includes(query.toLowerCase())),
    [query, submissions],
  )

  const showNotice = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2600)
  }

  const loadSamples = () => void save(async () => {
    const result = await backend<{ courses: { created: boolean }[] }>('/seed/sample-courses', 'POST')
    await loadWorkspace()
    const added = result.courses.filter(item => item.created).length
    showNotice(added ? `${added} sample courses were added and published` : 'Sample courses already exist')
  })

  const createCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const lessons = Number(data.get('lessons')) || 1
    if (!name) return
    void save(async () => {
      const course = await backend<Course>('/courses', 'POST', { name, lessons, description: String(data.get('description') ?? ''), ...detailsFrom(data) })
      setCourses(current => [...current, course])
      setModal(null)
      navigate('/instructor/courses')
      showNotice(`${name} was saved as a draft`)
    })
  }

  const submitGrade = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSubmission) return
    const score = Math.max(0, Math.min(100, Number(grade)))
    const feedback = String(new FormData(event.currentTarget).get('feedback') ?? '')
    void save(async () => {
      const updated = await backend<Submission>(`/submissions/${selectedSubmission.id}`, 'PUT', { score, feedback })
      setSubmissions(current => current.map(submission => submission.id === updated.id ? updated : submission))
      setModal(null)
      showNotice(`Grade saved for ${updated.student}`)
    })
  }

  const openGrade = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGrade(submission.score === undefined ? '' : String(submission.score))
    setModal('grade')
  }

  const mainTitle = view === 'courses' ? 'Course library' : view === 'students' ? 'Learner directory' : view === 'grading' ? 'Recent submissions' : 'Course performance'
  const mainSubtitle = view === 'courses' ? 'Create, publish, and manage your curriculum' : view === 'students' ? 'Track progress and connect with learners' : view === 'grading' ? 'Review learner work and provide feedback' : 'Your active teaching portfolio'

  return (
    <div className="sv-page">
      {loading && <p role="status" className="sv-state">Connecting to your saved workspace…</p>}
      {error && <div role="alert" className="fixed right-6 top-20 z-[800] max-w-sm sv-alert sv-alert-error shadow-md">{error} <button onClick={() => void loadWorkspace()} className="underline">Retry loading</button></div>}
      {saving && <div role="status" className="sv-state">Saving to SkillVerse…</div>}
      <fieldset disabled={loading || saving || !connected} className="contents">
      {notice && <div style={{
        position: 'fixed', right: 24, top: 80, zIndex: 700, background: '#1e3a8a', color: '#fff',
        padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500, maxWidth: 'calc(100vw - 48px)',
        boxShadow: '0 10px 28px rgba(15,23,42,0.2)',
      }}>{notice}</div>}

      <div className="sv-page-header">
        <div>
          <p className="sv-eyebrow">Instructor workspace</p>
          <h1 className="sv-title">{viewNames[view]}</h1>
          <p className="sv-subtitle">Teach, support, and celebrate every learner.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {connected && !courses.some(course => course.id.startsWith('sample-')) && <button onClick={loadSamples} className="sv-btn-secondary">Load sample courses</button>}
          <button onClick={() => setModal('course')} className="sv-button">+ Create course</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 16 }}>
        {metrics.map((metric) => (
          <button key={metric.label} onClick={() => navigate(metric.target === 'overview' ? '/instructor' : `/instructor/${metric.target}`)} style={{
            background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 12,
            padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start', minWidth: 0,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{
              width: 40, height: 40, borderRadius: 10, background: `${metric.tone}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><MiniIcon kind={metric.icon} color={metric.tone} /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 13, color: t.cardMuted, fontWeight: 500 }}>{metric.label}</span>
              <span style={{ display: 'block', fontSize: 28, lineHeight: '36px', color: t.sectionText, fontWeight: 700 }}>{metric.value}</span>
              <span style={{ display: 'block', fontSize: 12, color: t.cardMuted }}>{metric.change}</span>
            </span>
          </button>
        ))}
      </div>

      {view === 'overview' && <InstructorCharts courses={courses} students={students} submissions={submissions} loading={loading} error={error} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ fontSize: 16, lineHeight: '24px', fontWeight: 600, color: t.sectionText }}>{mainTitle}</div>
              <div style={{ fontSize: 12, color: t.cardMuted, marginTop: 2 }}>{mainSubtitle}</div>
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={`Filter ${view}`} placeholder={view === 'overview' ? 'Filter courses…' : `Filter ${view}…`} className="sv-field w-full sm:w-52" />
          </div>

          {(view === 'overview' || view === 'courses') && filteredCourses.map((course) => (
            <button key={course.id} onClick={() => { setSelectedName(course.name); setSelectedId(course.id); setModal('course-detail') }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', flexWrap: 'wrap',
              border: 'none', borderBottom: `1px solid ${t.chartGrid}`, background: '#fff', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MiniIcon kind="course" color={t.logoColor} />
              </span>
              <span style={{ flex: '1 1 180px', minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: t.sectionText }}>{course.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: t.cardMuted, marginTop: 2 }}>{course.students} students · {course.lessons} lessons</span>
              </span>
              <span style={{ fontSize: 12, color: t.cardMuted, minWidth: 100 }}>{course.status === 'Draft' ? `${course.lessons} lessons` : `${course.completion}% completion`}</span>
              <span style={{
                borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                color: course.status === 'Draft' ? '#d97706' : '#059669',
                background: course.status === 'Draft' ? '#fffbeb' : '#ecfdf5',
              }}>{course.status}</span>
            </button>
          ))}

          {view === 'students' && filteredStudents.map((student) => (
            <button key={student.id} onClick={() => { setSelectedName(student.name); setSelectedId(student.id); setModal('student') }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', flexWrap: 'wrap',
              border: 'none', borderBottom: `1px solid ${t.chartGrid}`, background: '#fff', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', background: '#eff6ff', color: t.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{student.initials}</span>
              <span style={{ flex: '1 1 180px', minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: t.sectionText }}>{student.name}</span>
                <span style={{ display: 'block', fontSize: 12, color: t.cardMuted, marginTop: 2 }}>{student.course}</span>
              </span>
              <span style={{ width: 120 }}>
                <span style={{ display: 'block', fontSize: 12, color: t.sectionText, fontWeight: 600, marginBottom: 4 }}>{student.progress}% complete</span>
                <span style={{ display: 'block', height: 6, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${student.progress}%`, height: '100%', background: t.logoColor }} />
                </span>
              </span>
              <span style={{ fontSize: 12, color: t.cardMuted, minWidth: 80 }}>{student.lastActive}</span>
            </button>
          ))}

          {view === 'grading' && filteredSubmissions.map((submission) => (
            <div key={submission.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', flexWrap: 'wrap', borderBottom: `1px solid ${t.chartGrid}` }}>
              <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', background: '#eff6ff', color: t.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{submission.initials}</span>
              <span style={{ flex: '1 1 180px', minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: t.sectionText }}>{submission.assignment}</span>
                <span style={{ display: 'block', fontSize: 12, color: t.cardMuted, marginTop: 2 }}>{submission.student} · {submission.course}</span>
              </span>
              <span style={{ fontSize: 12, color: t.cardMuted }}>{submission.submitted}</span>
              <button onClick={() => openGrade(submission)} style={{
                border: `1px solid ${submission.status === 'Graded' ? '#bbf7d0' : t.cardBorder}`, borderRadius: 8,
                background: submission.status === 'Graded' ? '#ecfdf5' : '#fff', color: submission.status === 'Graded' ? '#059669' : t.logoColor,
                minHeight: 36, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{submission.status === 'Graded' ? `${submission.score}% · Edit` : 'Grade'}</button>
            </div>
          ))}

          {((view === 'students' && filteredStudents.length === 0) || (view === 'grading' && filteredSubmissions.length === 0) || ((view === 'overview' || view === 'courses') && filteredCourses.length === 0)) && (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 14, color: t.cardMuted }}>No matching results found.</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1e3a8a', borderRadius: 12, padding: 20, color: '#fff' }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, letterSpacing: '0.06em' }}>QUICK ACTIONS</div>
            <div style={{ fontSize: 18, fontWeight: 600, margin: '4px 0 16px' }}>Keep learners moving</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/instructor/grading')} style={{
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, background: '#fff',
                color: '#1e3a8a', minHeight: 36, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Grade work</button>
              <button onClick={() => setModal('message')} style={{
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, background: 'rgba(255,255,255,0.1)',
                color: '#fff', minHeight: 36, padding: '0 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Message class</button>
            </div>
          </div>

          <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 16, lineHeight: '24px', fontWeight: 600, color: t.sectionText, marginBottom: 16 }}>Recent activity</div>
            {activity.length === 0 && <p className="sv-meta">Learner submissions will appear here.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activity.map((item) => (
                <button key={item.title} onClick={() => navigate(`/instructor/${item.target}`)} style={{
                  display: 'flex', width: '100%', gap: 10, alignItems: 'center', border: 'none',
                  background: 'transparent', padding: '4px 0', textAlign: 'left', cursor: 'pointer',
                }}>
                  <span style={{ width: 32, height: 32, borderRadius: '50%', background: `${item.color}15`, color: item.color, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.initials}</span>
                  <span>
                    <span style={{ display: 'block', fontSize: 13, color: t.sectionText, fontWeight: 500, lineHeight: '18px' }}>{item.title}</span>
                    <span style={{ display: 'block', fontSize: 12, color: t.cardMuted, marginTop: 2 }}>{item.time}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal === 'course' && (
        <Modal title="Create a new course" onClose={() => setModal(null)}>
          <form onSubmit={createCourse} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>Course title<input name="name" required autoFocus placeholder="e.g. Practical React Performance" style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>Number of lessons<input name="lessons" type="number" min="1" defaultValue="8" style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>Description<textarea name="description" rows={3} placeholder="What will learners achieve?" style={{ ...fieldStyle, marginTop: 6, resize: 'vertical' }} /></label>
            <DetailFields />
            <button type="submit" className="sv-button">Create draft</button>
          </form>
        </Modal>
      )}

      {modal === 'message' && (
        <Modal title="Message your class" onClose={() => setModal(null)}>
          <form onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            void save(async () => {
              await backend('/messages', 'POST', { audience: data.get('audience'), body: data.get('body') })
              setModal(null)
              showNotice('Announcement saved to the student inbox')
            })
          }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>Audience<select name="audience" defaultValue="all" style={{ ...fieldStyle, marginTop: 6 }}><option value="all">All active students</option>{courses.filter((course) => course.status === 'Published').map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>Message<textarea name="body" required maxLength={4000} autoFocus rows={5} placeholder="Write an announcement..." style={{ ...fieldStyle, marginTop: 6, resize: 'vertical' }} /></label>
            <button type="submit" className="sv-button">Send message</button>
          </form>
        </Modal>
      )}

      {modal === 'grade' && selectedSubmission && (
        <Modal title={`Grade ${selectedSubmission.assignment}`} onClose={() => setModal(null)}>
          <form onSubmit={submitGrade} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 12, borderRadius: 10, background: t.searchBg, fontSize: 13, color: t.sidebarText }}><strong style={{ color: t.sectionText }}>{selectedSubmission.student}</strong><br />{selectedSubmission.course}<p className="mt-3 whitespace-pre-wrap">{selectedSubmission.content}</p></div>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>Score out of 100<input value={grade} onChange={(event) => setGrade(event.target.value)} type="number" min="0" max="100" required autoFocus style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>Feedback<textarea name="feedback" defaultValue={selectedSubmission.feedback ?? ''} maxLength={4000} rows={4} placeholder="Add constructive feedback..." style={{ ...fieldStyle, marginTop: 6, resize: 'vertical' }} /></label>
            <button type="submit" className="sv-button">Save grade</button>
          </form>
        </Modal>
      )}

      {(modal === 'student' || modal === 'course-detail') && (
        <Modal title={selectedName} onClose={() => setModal(null)}>
          <div style={{ fontSize: 14, color: t.sidebarText, lineHeight: 1.6 }}>
            {modal === 'student' ? (() => {
              const student = students.find(item => item.id === selectedId)
              return student ? `${student.course} · ${student.progress}% complete · Last active: ${student.lastActive}` : 'Learner not found'
            })() : (() => {
              const course = courses.find(item => item.id === selectedId)
              return course ? `${course.lessons} lessons · ${course.students} enrolled · ${course.status}. ${course.description ?? ''}` : 'Course not found'
            })()}
          </div>
          {modal === 'student' && submissions.filter(item => `${item.studentId}:${item.courseId}` === selectedId).map(item => <p key={item.id} className="mt-3 text-sm">{item.assignment}: {item.status === 'Graded' ? `${item.score}/100 — ${item.feedback ?? 'No feedback yet'}` : 'Awaiting review'}</p>)}
          {modal === 'course-detail' && (() => {
            const course = courses.find(item => item.id === selectedId)
            if (!course) return null
            return <form key={`${course.id}:${course.name}:${course.category}:${course.difficulty}:${course.duration}:${course.thumbnail}`} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }} onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              void save(async () => {
                const updated = await backend<Course>(`/courses/${course.id}`, 'PUT', { name: String(data.get('name') ?? ''), description: String(data.get('description') ?? ''), ...detailsFrom(data) })
                setCourses(current => current.map(item => item.id === updated.id ? updated : item))
                setSelectedName(updated.name)
                showNotice('Course details saved')
              })
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.sectionText }}>Course details</div>
              <input name="name" required maxLength={160} defaultValue={course.name} aria-label="Course title" style={fieldStyle} />
              <textarea name="description" rows={3} maxLength={4000} defaultValue={course.description} aria-label="Course description" style={{ ...fieldStyle, resize: 'vertical' }} />
              <DetailFields course={course} />
              <button type="submit" className="sv-btn-secondary">Save course details</button>
            </form>
          })()}
          {modal === 'course-detail' && (() => {
            const course = courses.find(item => item.id === selectedId)
            return course?.id ? <CurriculumEditor key={course.id} courseId={course.id} count={course.lessons} /> : null
          })()}
          {modal === 'course-detail' && <button className="sv-btn-secondary mt-4" onClick={() => {
            const course = courses.find(item => item.id === selectedId)
            if (!course?.id) return
            void save(async () => {
              const updated = await backend<Course>(`/courses/${course.id}`, 'PUT', { status: course.status === 'Draft' ? 'Published' : 'Draft' })
              setCourses(current => current.map(item => item.id === updated.id ? updated : item))
              showNotice(`Course ${updated.status.toLowerCase()}`)
            })
          }}>{courses.find(item => item.id === selectedId)?.status === 'Draft' ? 'Publish course' : 'Unpublish course'}</button>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
            <button onClick={() => { setModal(null); navigate(modal === 'student' ? '/instructor/grading' : '/instructor/courses') }} className="sv-button flex-1">
              {modal === 'student' ? 'View submissions' : 'Manage course'}
            </button>
            <button onClick={() => { setModal(null); setModal('message') }} className="sv-btn-secondary flex-1">Send message</button>
          </div>
        </Modal>
      )}
      </fieldset>
    </div>
  )
}
