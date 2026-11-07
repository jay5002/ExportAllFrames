import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Assignment, Course, Enrollment } from '../../lib/types'
import {
  assessmentPerformance, learningProgressSnapshot, coursePerformance, courseStatus, enrollmentTrend, weeklyActivity,
  type InstructorStudent, type InstructorSubmission,
} from './chartData'

const BLUE = '#2563eb'
const AXIS = { fontSize: 12, fill: '#475569' }
const GRID = '#e2e8f0'
const tooltipStyle = { borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(15 23 42 / .08)', fontSize: 13 }
const truncate = (value: string, max = 16) => value.length > max ? `${value.slice(0, max - 1)}…` : value

interface CardProps { title: string; subtitle: string; loading?: boolean; error?: string; empty?: string; label: string; height?: number; className?: string; footer?: ReactNode; children: ReactNode }

export function ChartCard({ title, subtitle, loading, error, empty, label, height = 240, className = '', footer, children }: CardProps) {
  return <section className={`sv-card sv-card-pad flex min-w-0 flex-col gap-4 ${className}`} aria-busy={loading}>
    <div><h2 className="sv-section-title">{title}</h2><p className="sv-meta mt-1">{subtitle}</p></div>
    <div className="min-w-0 flex-1" style={{ minHeight: height }}>
      {loading ? <p role="status" className="sv-state h-full justify-center" style={{ minHeight: height }}>Loading chart…</p>
        : error ? <p role="alert" className="sv-alert sv-alert-error">Unable to load this chart. {error}</p>
        : empty ? <p className="sv-empty flex items-center justify-center" style={{ minHeight: height }}>{empty}</p>
        : <div role="img" aria-label={label} className="w-full" style={{ height }}>{children}</div>}
    </div>
    {!loading && !error && !empty && footer}
  </section>
}

const Legend = ({ items }: { items: { name: string; value: number; color: string }[] }) => <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">{items.map(item => <li key={item.name} className="flex items-center gap-2 text-sm text-slate-700"><span className="size-3 rounded-sm" style={{ background: item.color }} aria-hidden="true" />{item.name}<strong className="font-semibold text-slate-900">{item.value}</strong></li>)}</ul>

interface StudentProps { enrollments: Enrollment[]; assignments: Assignment[]; courses: Course[]; loading: boolean; error: string }

export function StudentCharts({ enrollments, assignments, courses, loading, error }: StudentProps) {
  const week = weeklyActivity(enrollments, assignments)
  const status = courseStatus(courses, enrollments)
  const progress = learningProgressSnapshot(courses, enrollments)
  return <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    <ChartCard title="Weekly Learning Activity" subtitle="This week, Monday to Sunday: progress updates and assignment submissions" loading={loading} error={error}
      empty={week.total === 0 ? 'Learning activity will appear here as you study.' : undefined} label={`Learning activity this week: ${week.data.map(item => `${item.day} ${item.activities}`).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={week.data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke={GRID} /><XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} /><YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: '#eff6ff' }} contentStyle={tooltipStyle} formatter={value => [value, 'Activities']} />
        <Bar dataKey="activities" name="Activities" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart></ResponsiveContainer>
    </ChartCard>
    <ChartCard title="Learning Progress" subtitle="Overall lesson completion (%)" loading={loading} error={error}
      empty={progress.length === 0 ? 'No dated lesson-progress records are available yet. Complete lessons to record your progress.' : undefined}
      label={`Latest saved lesson completion: ${progress.map(item => `${item.date}: ${item.progress}%, ${item.completed} of ${item.total} lessons`).join(', ')}. Only one snapshot is available; no historical trend is inferred.`}>
      <div className="flex h-full min-w-0 flex-col gap-3">
        <div className="min-h-0 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={progress} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} padding={{ left: 12, right: 12 }} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={44} tickFormatter={value => `${value}%`} tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} wrapperStyle={{ maxWidth: '100%', whiteSpace: 'normal' }}
              formatter={(value, _name, item) => [`${value}% · ${item.payload.completed} / ${item.payload.total} lessons`, 'Completion']}
              labelFormatter={(_, payload) => payload?.[0] ? `Last progress update · ${payload[0].payload.date}` : ''} />
            <Line type="linear" dataKey="progress" name="Lesson completion" stroke={BLUE} strokeWidth={2.5}
              dot={{ r: 5, fill: BLUE, stroke: 'var(--color-sv-soft)', strokeWidth: 2 }} activeDot={{ r: 7 }} isAnimationActive={false} />
          </LineChart></ResponsiveContainer>
        </div>
        <p className="sv-meta">Latest saved snapshot only. More dated history is needed to show a progress trend.</p>
      </div>
    </ChartCard>
    <ChartCard title="Course Progress" subtitle="Your enrolled courses: completed, in progress, not started" loading={loading} error={error}
      empty={status.total === 0 ? 'Enroll in a course to see your progress breakdown.' : undefined} label={`Course progress: ${status.data.map(item => `${item.value} ${item.name.toLowerCase()}`).join(', ')}`} height={176}
      footer={<Legend items={status.data} />}>
      <ResponsiveContainer width="100%" height="100%"><PieChart>
        <Pie data={status.data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={status.data.filter(item => item.value).length > 1 ? 2 : 0} stroke="#fff" strokeWidth={2}>
          {status.data.map(item => <Cell key={item.name} fill={item.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value} ${Number(value) === 1 ? 'course' : 'courses'}`, name]} />
        <text x="50%" y="46%" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 28, fontWeight: 700 }}>{Math.round(status.data[0].value / (status.total || 1) * 100)}%</text>
        <text x="50%" y="46%" dy="22" textAnchor="middle" style={{ fontSize: 12, fill: '#64748b' }}>completed</text>
      </PieChart></ResponsiveContainer>
    </ChartCard>
  </div>
}

interface InstructorProps {
  courses: { name: string; students: number; completion: number; status: string }[]
  students: InstructorStudent[]
  submissions: InstructorSubmission[]
  loading: boolean
  error: string
}

export function InstructorCharts({ courses, students, submissions, loading, error }: InstructorProps) {
  const enrollments = enrollmentTrend(students)
  const performance = coursePerformance(courses)
  const assessments = assessmentPerformance(submissions)
  const rows = (count: number) => Math.max(220, count * 48 + 32)
  const showAssessments = loading || !!error || assessments.submissions > 0
  return <div className="grid gap-6 md:grid-cols-2">
    <ChartCard title="Enrollment Trends" subtitle="Total enrolled learners over time" loading={loading} error={error}
      empty={enrollments.data.length === 0 ? students.length > 0 ? 'Enrollment dates are recorded for new enrollments. Trends will appear as learners enroll.' : 'Enrollment trends will appear here as learners enroll.' : undefined}
      label={`Total enrollments over time: ${enrollments.data.map(item => `${item.date} ${item.total}`).join(', ')}`}
      footer={enrollments.undated > 0 ? <p className="sv-meta">{enrollments.undated} earlier {enrollments.undated === 1 ? 'enrollment has' : 'enrollments have'} no recorded date and {enrollments.undated === 1 ? 'is' : 'are'} not shown.</p> : undefined}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={enrollments.data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid vertical={false} stroke={GRID} /><XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} padding={{ left: 12, right: 12 }} /><YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [value, name === 'total' ? 'Total enrolled' : 'New enrollments']} />
        <Line type="monotone" dataKey="total" name="total" stroke={BLUE} strokeWidth={2.5} dot={{ r: 4, fill: BLUE, strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </LineChart></ResponsiveContainer>
    </ChartCard>
    <ChartCard title="Course Performance" subtitle="Average completion rate by course" loading={loading} error={error}
      empty={performance.length === 0 ? 'Course completion will appear here once learners enroll.' : undefined}
      label={`Completion by course: ${performance.map(item => `${item.name} ${item.completion}%`).join(', ')}`} height={rows(performance.length)}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={performance} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID} /><XAxis type="number" domain={[0, 100]} unit="%" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis type="category" dataKey="name" width={112} tick={AXIS} tickLine={false} axisLine={false} tickFormatter={value => truncate(String(value), 18)} />
        <Tooltip cursor={{ fill: '#eff6ff' }} contentStyle={tooltipStyle} formatter={(value, _name, item) => [`${value}% · ${item.payload.students} ${item.payload.students === 1 ? 'learner' : 'learners'}`, 'Completion']} />
        <Bar dataKey="completion" fill={BLUE} radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart></ResponsiveContainer>
    </ChartCard>
    {showAssessments && <ChartCard title="Assessment Performance" subtitle="Average graded assignment score by course" loading={loading} error={error} className="md:col-span-2"
      empty={assessments.data.length === 0 ? `${assessments.submissions} ${assessments.submissions === 1 ? 'submission is' : 'submissions are'} waiting to be graded. Results will appear here once graded.` : undefined}
      label={`Average assignment score by course: ${assessments.data.map(item => `${item.name} ${item.average}%`).join(', ')}`} height={rows(assessments.data.length)}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={assessments.data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID} /><XAxis type="number" domain={[0, 100]} unit="%" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} />
        <YAxis type="category" dataKey="name" width={112} tick={AXIS} tickLine={false} axisLine={false} tickFormatter={value => truncate(String(value), 18)} />
        <Tooltip cursor={{ fill: '#eff6ff' }} contentStyle={tooltipStyle} formatter={(value, _name, item) => [`${value}% average · ${item.payload.graded} graded, ${item.payload.pending} pending`, 'Score']} />
        <Bar dataKey="average" fill="#1d4ed8" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart></ResponsiveContainer>
    </ChartCard>}
  </div>
}
