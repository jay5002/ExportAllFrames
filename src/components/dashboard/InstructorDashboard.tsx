import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { backend } from '../../lib/backend'
import { useNavigate } from 'react-router-dom'
import { blueTheme } from './theme'

const t = blueTheme

interface InstructorDashboardProps {
  view?: 'overview' | 'courses' | 'students' | 'grading'
}

interface Course {
  id?: string
  description?: string
  name: string
  students: number
  status: 'Published' | 'Draft'
  completion: number
  lessons: number
}

interface Submission {
  feedback?: string
  id: number
  student: string
  initials: string
  assignment: string
  course: string
  submitted: string
  status: 'Pending' | 'Graded'
  score?: number
}

interface Student {
  name: string
  initials: string
  course: string
  progress: number
  lastActive: string
}

const activity = [
  { initials: 'AK', title: 'Aarav submitted React Architecture', time: '12 minutes ago', color: '#2563eb', target: 'grading' as const },
  { initials: 'SM', title: 'Sara completed TypeScript Deep Dive', time: '48 minutes ago', color: '#7c3aed', target: 'students' as const },
  { initials: 'RL', title: 'Rohan asked a question in Lesson 8', time: '2 hours ago', color: '#059669', target: 'students' as const },
]

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
        position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(15,23,42,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} style={{
        width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16,
        border: `1px solid ${t.cardBorder}`, boxShadow: '0 24px 64px rgba(30,58,138,0.22)', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: t.sectionText }}>{title}</div>
          <button onClick={onClose} aria-label="Close dialog" style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none', background: t.searchBg,
            color: t.sidebarText, cursor: 'pointer', fontSize: 18, lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

const fieldStyle = {
  width: '100%', border: `1px solid ${t.searchBorder}`, background: '#fff', borderRadius: 9,
  padding: '9px 11px', fontSize: 12, color: t.sectionText, outline: 'none',
}

export default function InstructorDashboard({ view = 'overview' }: InstructorDashboardProps) {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [modal, setModal] = useState<'course' | 'message' | 'grade' | 'student' | 'course-detail' | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [grade, setGrade] = useState('85')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)

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
    { label: 'Demo learners', value: String(students.length), change: 'Sample learner directory', tone: '#2563eb', icon: 'people', target: 'students' as const },
    { label: 'Published courses', value: String(courses.filter((course) => course.status === 'Published').length), change: 'Currently published', tone: '#7c3aed', icon: 'course', target: 'courses' as const },
    { label: 'Submissions to grade', value: String(pendingCount), change: 'Awaiting feedback', tone: '#d97706', icon: 'course', target: 'grading' as const },
    { label: 'Average completion', value: `${students.length ? Math.round(students.reduce((total, student) => total + student.progress, 0) / students.length) : 0}%`, change: 'Sample learner progress', tone: '#059669', icon: 'chart', target: 'overview' as const },
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

  const createCourse = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const lessons = Number(data.get('lessons')) || 1
    if (!name) return
    void save(async () => {
      const course = await backend<Course>('/courses', 'POST', { name, lessons, description: String(data.get('description') ?? '') })
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
    setGrade(String(submission.score ?? 85))
    setModal('grade')
  }

  const mainTitle = view === 'courses' ? 'Course library' : view === 'students' ? 'Learner directory' : view === 'grading' ? 'Recent submissions' : 'Course performance'
  const mainSubtitle = view === 'courses' ? 'Create, publish, and manage your curriculum' : view === 'students' ? 'Track progress and connect with learners' : view === 'grading' ? 'Review learner work and provide feedback' : 'Your active teaching portfolio'

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      {loading && <p role="status">Connecting to your saved workspace…</p>}
      {error && <div role="alert" className="fixed right-6 top-20 z-[800] max-w-sm rounded-xl bg-red-50 p-4 text-sm text-red-800">{error} <button onClick={() => void loadWorkspace()} className="underline">Retry loading</button></div>}
      {saving && <div role="status" className="mb-4 text-sm text-blue-700">Saving to SkillVerse…</div>}
      <fieldset disabled={loading || saving || !connected} className="contents">
      {notice && <div style={{
        position: 'fixed', right: 24, top: 72, zIndex: 700, background: '#1e3a8a', color: '#fff',
        padding: '11px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
        boxShadow: '0 10px 28px rgba(30,58,138,0.22)',
      }}>{notice}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, color: t.logoColor, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 6 }}>INSTRUCTOR WORKSPACE</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: t.sectionText, margin: 0 }}>{viewNames[view]}</h1>
          <p style={{ fontSize: 13, color: t.cardMuted, margin: '5px 0 0' }}>Teach, support, and celebrate every learner.</p>
        </div>
        <button onClick={() => setModal('course')} style={{
          border: 'none', borderRadius: 10, background: t.logoColor, color: '#fff',
          padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 5px 14px rgba(37,99,235,0.22)',
        }}>+ Create course</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
        {metrics.map((metric) => (
          <button key={metric.label} onClick={() => navigate(metric.target === 'overview' ? '/instructor' : `/instructor/${metric.target}`)} style={{
            background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
            padding: '17px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{
              width: 38, height: 38, borderRadius: 11, background: `${metric.tone}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><MiniIcon kind={metric.icon} color={metric.tone} /></span>
            <span>
              <span style={{ display: 'block', fontSize: 11, color: t.cardMuted, fontWeight: 600 }}>{metric.label}</span>
              <span style={{ display: 'block', fontSize: 23, color: t.sectionText, fontWeight: 800, margin: '2px 0' }}>{metric.value}</span>
              <span style={{ display: 'block', fontSize: 10, color: metric.tone, fontWeight: 600 }}>{metric.change}</span>
            </span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(240px, 0.8fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '17px 20px', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.sectionText }}>{mainTitle}</div>
              <div style={{ fontSize: 10, color: t.cardMuted, marginTop: 2 }}>{mainSubtitle}</div>
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Filter ${view}...`} style={{
              width: 170, border: `1px solid ${t.searchBorder}`, background: t.searchBg,
              borderRadius: 18, padding: '7px 11px', fontSize: 11, outline: 'none', color: t.sectionText,
            }} />
          </div>

          {(view === 'overview' || view === 'courses') && filteredCourses.map((course) => (
            <button key={course.name} onClick={() => { setSelectedName(course.name); setModal('course-detail') }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
              border: 'none', borderBottom: `1px solid ${t.chartGrid}`, background: '#fff', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MiniIcon kind="course" color={t.logoColor} />
              </span>
              <span style={{ flex: 1, minWidth: 120 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.sectionText }}>{course.name}</span>
                <span style={{ display: 'block', fontSize: 10, color: t.cardMuted, marginTop: 2 }}>{course.students} students · {course.lessons} lessons</span>
              </span>
              <span style={{ fontSize: 10, color: t.cardMuted, minWidth: 78 }}>{course.status === 'Draft' ? `${course.lessons} lessons` : `${course.completion}% completion`}</span>
              <span style={{
                borderRadius: 20, padding: '4px 9px', fontSize: 10, fontWeight: 700,
                color: course.status === 'Draft' ? '#d97706' : '#059669',
                background: course.status === 'Draft' ? '#fffbeb' : '#ecfdf5',
              }}>{course.status}</span>
            </button>
          ))}

          {view === 'students' && filteredStudents.map((student) => (
            <button key={student.name} onClick={() => { setSelectedName(student.name); setModal('student') }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
              border: 'none', borderBottom: `1px solid ${t.chartGrid}`, background: '#fff', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#eff6ff', color: t.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{student.initials}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.sectionText }}>{student.name}</span>
                <span style={{ display: 'block', fontSize: 10, color: t.cardMuted, marginTop: 2 }}>{student.course}</span>
              </span>
              <span style={{ width: 110 }}>
                <span style={{ display: 'block', fontSize: 10, color: t.sectionText, fontWeight: 700, marginBottom: 4 }}>{student.progress}% complete</span>
                <span style={{ display: 'block', height: 5, background: '#e0eaff', borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ display: 'block', width: `${student.progress}%`, height: '100%', background: t.logoColor }} />
                </span>
              </span>
              <span style={{ fontSize: 10, color: t.cardMuted, minWidth: 70 }}>{student.lastActive}</span>
            </button>
          ))}

          {view === 'grading' && filteredSubmissions.map((submission) => (
            <div key={submission.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: `1px solid ${t.chartGrid}` }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#eff6ff', color: t.logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{submission.initials}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.sectionText }}>{submission.assignment}</span>
                <span style={{ display: 'block', fontSize: 10, color: t.cardMuted, marginTop: 2 }}>{submission.student} · {submission.course}</span>
              </span>
              <span style={{ fontSize: 10, color: t.cardMuted }}>{submission.submitted}</span>
              <button onClick={() => openGrade(submission)} style={{
                border: `1px solid ${submission.status === 'Graded' ? '#bbf7d0' : t.cardBorder}`, borderRadius: 8,
                background: submission.status === 'Graded' ? '#ecfdf5' : '#fff', color: submission.status === 'Graded' ? '#059669' : t.logoColor,
                padding: '6px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>{submission.status === 'Graded' ? `${submission.score}% · Edit` : 'Grade'}</button>
            </div>
          ))}

          {((view === 'students' && filteredStudents.length === 0) || (view === 'grading' && filteredSubmissions.length === 0) || ((view === 'overview' || view === 'courses') && filteredCourses.length === 0)) && (
            <div style={{ padding: 30, textAlign: 'center', fontSize: 12, color: t.cardMuted }}>No matching results found.</div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(145deg,#1e3a8a,#2563eb)', borderRadius: 14, padding: '18px 20px', color: '#fff', boxShadow: '0 8px 20px rgba(37,99,235,0.16)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.72, letterSpacing: '0.06em' }}>QUICK ACTIONS</div>
            <div style={{ fontSize: 17, fontWeight: 800, margin: '6px 0 14px' }}>Keep learners moving</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/instructor/grading')} style={{
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, background: '#fff',
                color: '#1e3a8a', padding: '7px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>Grade work</button>
              <button onClick={() => setModal('message')} style={{
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, background: 'rgba(255,255,255,0.1)',
                color: '#fff', padding: '7px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}>Message class</button>
            </div>
          </div>

          <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14, padding: '17px 18px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.sectionText, marginBottom: 14 }}>Recent activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activity.map((item) => (
                <button key={item.title} onClick={() => navigate(`/instructor/${item.target}`)} style={{
                  display: 'flex', width: '100%', gap: 10, alignItems: 'center', border: 'none',
                  background: 'transparent', padding: '4px 0', textAlign: 'left', cursor: 'pointer',
                }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: `${item.color}15`, color: item.color, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.initials}</span>
                  <span>
                    <span style={{ display: 'block', fontSize: 10, color: t.sectionText, fontWeight: 600, lineHeight: 1.35 }}>{item.title}</span>
                    <span style={{ display: 'block', fontSize: 9, color: t.cardMuted, marginTop: 2 }}>{item.time}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal === 'course' && (
        <Modal title="Create a new course" onClose={() => setModal(null)}>
          <form onSubmit={createCourse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sectionText }}>Course title<input name="name" required autoFocus placeholder="e.g. Practical React Performance" style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sectionText }}>Number of lessons<input name="lessons" type="number" min="1" defaultValue="8" style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sectionText }}>Description<textarea name="description" rows={3} placeholder="What will learners achieve?" style={{ ...fieldStyle, marginTop: 6, resize: 'vertical' }} /></label>
            <button type="submit" style={{ border: 'none', borderRadius: 9, padding: 10, background: t.logoColor, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Create draft</button>
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
          }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sectionText }}>Audience<select name="audience" defaultValue="all" style={{ ...fieldStyle, marginTop: 6 }}><option value="all">All active students</option>{courses.filter((course) => course.status === 'Published').map((course) => <option key={course.name}>{course.name}</option>)}</select></label>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sectionText }}>Message<textarea name="body" required maxLength={4000} autoFocus rows={5} placeholder="Write an announcement..." style={{ ...fieldStyle, marginTop: 6, resize: 'vertical' }} /></label>
            <button type="submit" style={{ border: 'none', borderRadius: 9, padding: 10, background: t.logoColor, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Send message</button>
          </form>
        </Modal>
      )}

      {modal === 'grade' && selectedSubmission && (
        <Modal title={`Grade ${selectedSubmission.assignment}`} onClose={() => setModal(null)}>
          <form onSubmit={submitGrade} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 10, background: t.searchBg, fontSize: 11, color: t.sidebarText }}><strong style={{ color: t.sectionText }}>{selectedSubmission.student}</strong><br />{selectedSubmission.course}</div>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sectionText }}>Score out of 100<input value={grade} onChange={(event) => setGrade(event.target.value)} type="number" min="0" max="100" required autoFocus style={{ ...fieldStyle, marginTop: 6 }} /></label>
            <label style={{ fontSize: 11, fontWeight: 700, color: t.sectionText }}>Feedback<textarea name="feedback" defaultValue={selectedSubmission.feedback ?? ''} maxLength={4000} rows={4} placeholder="Add constructive feedback..." style={{ ...fieldStyle, marginTop: 6, resize: 'vertical' }} /></label>
            <button type="submit" style={{ border: 'none', borderRadius: 9, padding: 10, background: t.logoColor, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save grade</button>
          </form>
        </Modal>
      )}

      {(modal === 'student' || modal === 'course-detail') && (
        <Modal title={selectedName} onClose={() => setModal(null)}>
          <div style={{ fontSize: 12, color: t.sidebarText, lineHeight: 1.6 }}>
            {modal === 'student' ? (() => {
              const student = students.find(item => item.name === selectedName)
              return student ? `${student.course} · ${student.progress}% complete · Last active: ${student.lastActive}` : 'Learner not found'
            })() : (() => {
              const course = courses.find(item => item.name === selectedName)
              return course ? `${course.lessons} lessons · ${course.students} enrolled · ${course.status}. ${course.description ?? ''}` : 'Course not found'
            })()}
          </div>
          {modal === 'student' && submissions.filter(item => item.student === selectedName).map(item => <p key={item.id} className="mt-3 text-sm">{item.assignment}: {item.status === 'Graded' ? `${item.score}/100 — ${item.feedback ?? 'No feedback yet'}` : 'Awaiting review'}</p>)}
          {modal === 'course-detail' && <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white" onClick={() => {
            const course = courses.find(item => item.name === selectedName)
            if (!course?.id) return
            void save(async () => {
              const updated = await backend<Course>(`/courses/${course.id}`, 'PUT', { status: course.status === 'Draft' ? 'Published' : 'Draft' })
              setCourses(current => current.map(item => item.id === updated.id ? updated : item))
              showNotice(`Course ${updated.status.toLowerCase()}`)
            })
          }}>{courses.find(item => item.name === selectedName)?.status === 'Draft' ? 'Publish course' : 'Unpublish course'}</button>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button onClick={() => { setModal(null); navigate(modal === 'student' ? '/instructor/grading' : '/instructor/courses') }} style={{ flex: 1, border: 'none', borderRadius: 9, padding: 9, background: t.logoColor, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {modal === 'student' ? 'View submissions' : 'Manage course'}
            </button>
            <button onClick={() => { setModal(null); setModal('message') }} style={{ flex: 1, border: `1px solid ${t.cardBorder}`, borderRadius: 9, padding: 9, background: '#fff', color: t.sectionText, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Send message</button>
          </div>
        </Modal>
      )}
      </fieldset>
    </div>
  )
}
