export type Profile = { id: string; name: string; role: 'student' | 'instructor' }
export type Course = { id: string; name: string; description: string; instructor: string; category?: string; difficulty?: string; duration?: string; thumbnail?: string; lessons: number; status: 'Draft' | 'Published'; students: number; completion: number }
export type Lesson = { id: string; title: string; content: string; videoUrl: string; module?: string; description?: string }
export type Enrollment = { courseId: string; completed: number; updatedAt: string }
export type Submission = { id: string; assignmentId: string; assignment: string; student: string; initials: string; course: string; content: string; status: 'Pending' | 'Graded'; score?: number; feedback?: string; submitted: string }
export type Assignment = { id: string; courseId: string; course: string; title: string; description: string; dueDate: string; submission: Submission | null }
export type Quiz = { id: string; title: string; course: string; questions: { q: string; options: string[] }[]; attempts: number; bestScore: number }
export type Attempt = { id: string; score: number; correct: number; total: number }
