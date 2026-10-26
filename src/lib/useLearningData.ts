import { useCallback, useEffect, useState } from 'react'
import { backend } from './backend'
import type { Assignment, Course, Enrollment, Quiz } from './types'

export default function useLearningData() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [workspace, saved, work, tests] = await Promise.all([
        backend<{ courses: Course[] }>('/workspace?view=learning'), backend<Enrollment[]>('/enrollments'),
        backend<Assignment[]>('/assignments'), backend<Quiz[]>('/quizzes'),
      ])
      setCourses(workspace.courses); setEnrollments(saved); setAssignments(work); setQuizzes(tests)
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to load your learning records') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void reload() }, [reload])
  const enrolled = courses.filter(course => enrollments.some(item => item.courseId === course.id))
  const completed = enrolled.filter(course => enrollments.find(item => item.courseId === course.id)?.completed === course.lessons)
  const visibleEnrollments = enrollments.filter(item => courses.some(course => course.id === item.courseId))
  return { courses, enrollments: visibleEnrollments, setEnrollments, assignments, quizzes, enrolled, completed, loading, error, reload }
}
