import type { Assignment, Course, Enrollment } from '../../lib/types'

export type InstructorStudent = { courseId: string; enrolledAt?: string }
export type InstructorSubmission = { course: string; courseId: string; status: 'Pending' | 'Graded'; score?: number }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const shortDate = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

function validDate(value?: string) {
  const time = value ? Date.parse(value) : NaN
  return Number.isFinite(time) ? new Date(time) : null
}

export function weeklyActivity(enrollments: Enrollment[], assignments: Assignment[], now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
  const counts = DAYS.map(day => ({ day, activities: 0 }))
  const stamps = [
    ...enrollments.map(item => item.updatedAt),
    ...assignments.map(item => item.submission?.submitted),
  ]
  for (const stamp of stamps) {
    const date = validDate(stamp ?? undefined)
    if (date && date >= start && date < end) counts[(date.getDay() + 6) % 7].activities += 1
  }
  return { data: counts, total: counts.reduce((sum, item) => sum + item.activities, 0) }
}

export function courseStatus(courses: Course[], enrollments: Enrollment[]) {
  let completed = 0, inProgress = 0, notStarted = 0
  for (const course of courses) {
    const saved = enrollments.find(item => item.courseId === course.id)
    if (!saved) continue
    if (course.lessons > 0 && saved.completed >= course.lessons) completed += 1
    else if (saved.completed > 0) inProgress += 1
    else notStarted += 1
  }
  const total = completed + inProgress + notStarted
  return { total, data: [
    { name: 'Completed', value: completed, color: '#16a34a' },
    { name: 'In progress', value: inProgress, color: '#2563eb' },
    { name: 'Not started', value: notStarted, color: '#e0a25c' },
  ] }
}

export function assignmentScoreTrend(assignments: Assignment[]) {
  return assignments
    .flatMap(item => {
      const submission = item.submission
      const date = validDate(submission?.submitted)
      return submission?.status === 'Graded' && typeof submission.score === 'number' && date
        ? [{ time: date.getTime(), date: shortDate(date), score: submission.score, title: item.title, course: item.course }]
        : []
    })
    .sort((a, b) => a.time - b.time)
}

export function learningProgressSnapshot(courses: Course[], enrollments: Enrollment[], now = new Date()) {
  const saved = new Map(enrollments.map(item => [item.courseId, item]))
  const enrolled = [...new Map(courses.map(course => [course.id, course])).values()]
    .filter(course => saved.has(course.id))
  let completed = 0, total = 0, latest = -Infinity
  for (const course of enrolled) {
    const record = saved.get(course.id)!
    const date = validDate(record.updatedAt)
    if (!Number.isInteger(course.lessons) || course.lessons < 0 || !Number.isInteger(record.completed) ||
      record.completed < 0 || record.completed > course.lessons || !date || date > now) return []
    completed += record.completed
    total += course.lessons
    latest = Math.max(latest, date.getTime())
  }
  // Enrollment updates replace the previous count. Combining different course
  // snapshots into a historical series would invent past overall completion.
  return total > 0 ? [{
    time: latest,
    date: new Date(latest).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    progress: Math.round(completed / total * 100),
    completed,
    total,
  }] : []
}

export function enrollmentTrend(students: InstructorStudent[]) {
  const dated = students.flatMap(item => { const date = validDate(item.enrolledAt); return date ? [date] : [] })
  dated.sort((a, b) => a.getTime() - b.getTime())
  const days = new Map<string, { date: string; enrollments: number }>()
  for (const date of dated) {
    const key = dayKey(date)
    const entry = days.get(key) ?? { date: shortDate(date), enrollments: 0 }
    entry.enrollments += 1
    days.set(key, entry)
  }
  let running = 0
  const data = [...days.values()].map(item => ({ date: item.date, newEnrollments: item.enrollments, total: running += item.enrollments }))
  return { data, undated: students.length - dated.length }
}

export function coursePerformance(courses: { name: string; students: number; completion: number; status: string }[]) {
  return courses.filter(course => course.students > 0).map(course => ({ name: course.name, completion: course.completion, students: course.students }))
}

export function assessmentPerformance(submissions: InstructorSubmission[]) {
  const byCourse = new Map<string, { name: string; sum: number; graded: number; pending: number }>()
  for (const item of submissions) {
    const entry = byCourse.get(item.courseId) ?? { name: item.course, sum: 0, graded: 0, pending: 0 }
    if (item.status === 'Graded' && typeof item.score === 'number') { entry.sum += item.score; entry.graded += 1 } else entry.pending += 1
    byCourse.set(item.courseId, entry)
  }
  const data = [...byCourse.values()].filter(item => item.graded > 0).map(item => ({ name: item.name, average: Math.round(item.sum / item.graded), graded: item.graded, pending: item.pending }))
  return { data, submissions: submissions.length }
}
