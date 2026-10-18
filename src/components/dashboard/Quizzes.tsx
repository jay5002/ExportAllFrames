import { useState } from 'react'
import { blueTheme } from './theme'

const t = blueTheme

interface Question {
  q: string
  options: string[]
  answer: number
}

interface Quiz {
  id: number
  title: string
  course: string
  questions: Question[]
  duration: string
  totalMarks: number
  attempts: number
  bestScore?: number
  status: 'Not Started' | 'In Progress' | 'Completed'
}

const quizzes: Quiz[] = [
  {
    id: 1,
    title: 'React Hooks Fundamentals',
    course: 'Advanced React Patterns',
    duration: '15 min',
    totalMarks: 10,
    attempts: 0,
    status: 'Not Started',
    questions: [
      { q: 'Which hook is used to manage side effects?', options: ['useState', 'useEffect', 'useContext', 'useRef'], answer: 1 },
      { q: 'What does useState return?', options: ['A value', 'A function', 'A state and setter pair', 'An object'], answer: 2 },
      { q: 'When does useEffect run by default?', options: ['Only on mount', 'Only on unmount', 'After every render', 'Never'], answer: 2 },
    ],
  },
  {
    id: 2,
    title: 'Python Data Types',
    course: 'Python for Data Science',
    duration: '10 min',
    totalMarks: 8,
    attempts: 1,
    bestScore: 7,
    status: 'Completed',
    questions: [
      { q: 'Which is immutable in Python?', options: ['List', 'Dictionary', 'Tuple', 'Set'], answer: 2 },
      { q: 'What does len() return for an empty list?', options: ['None', '0', '-1', 'Error'], answer: 1 },
    ],
  },
  {
    id: 3,
    title: 'UX Principles Quiz',
    course: 'UI/UX Design Fundamentals',
    duration: '12 min',
    totalMarks: 10,
    attempts: 0,
    status: 'Not Started',
    questions: [
      { q: 'What does UX stand for?', options: ['User Experience', 'User Execution', 'Unit Experience', 'Unified Exchange'], answer: 0 },
      { q: 'Which principle focuses on reducing steps?', options: ['Visibility', 'Feedback', 'Efficiency', 'Consistency'], answer: 2 },
    ],
  },
  {
    id: 4,
    title: 'Machine Learning Basics',
    course: 'Machine Learning A-Z',
    duration: '20 min',
    totalMarks: 15,
    attempts: 2,
    bestScore: 12,
    status: 'Completed',
    questions: [
      { q: 'What is supervised learning?', options: ['Learning without labels', 'Learning with labelled data', 'Reinforcement learning', 'Deep learning'], answer: 1 },
      { q: 'Which algorithm is used for classification?', options: ['Linear Regression', 'K-Means', 'Logistic Regression', 'PCA'], answer: 2 },
    ],
  },
]

type ActiveState =
  | { mode: 'list' }
  | { mode: 'quiz'; quizId: number; current: number; selected: (number | null)[]; submitted: boolean }

export default function Quizzes() {
  const [state, setState] = useState<ActiveState>({ mode: 'list' })
  const [quizData, setQuizData] = useState(quizzes)

  if (state.mode === 'quiz') {
    const quiz = quizData.find((q) => q.id === state.quizId)!
    const { current, selected, submitted } = state
    const q = quiz.questions[current]
    const isLast = current === quiz.questions.length - 1

    const select = (i: number) => {
      if (submitted) return
      const next = [...selected]
      next[current] = i
      setState({ ...state, selected: next })
    }

    const advance = () => {
      if (!isLast) {
        setState({ ...state, current: current + 1 })
      } else {
        // score
        const score = quiz.questions.reduce(
          (acc, q2, idx) => acc + (selected[idx] === q2.answer ? 1 : 0),
          0
        )
        setQuizData((prev) =>
          prev.map((q2) =>
            q2.id === quiz.id
              ? {
                  ...q2,
                  status: 'Completed',
                  attempts: q2.attempts + 1,
                  bestScore: Math.max(q2.bestScore ?? 0, score),
                }
              : q2
          )
        )
        setState({ ...state, submitted: true })
      }
    }

    if (submitted) {
      const score = quiz.questions.reduce(
        (acc, q2, idx) => acc + (selected[idx] === q2.answer ? 1 : 0),
        0
      )
      const pct = Math.round((score / quiz.questions.length) * 100)
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.pageBg }}>
          <div style={{
            background: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
            borderRadius: 20,
            padding: 40,
            textAlign: 'center',
            maxWidth: 380,
            width: '100%',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: pct >= 70 ? '#dcfce7' : '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 32,
            }}>
              {pct >= 70 ? '🎉' : '📚'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, marginBottom: 8 }}>
              {pct >= 70 ? 'Great job!' : 'Keep practising!'}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: t.logoColor, marginBottom: 4 }}>
              {score}/{quiz.questions.length}
            </div>
            <div style={{ fontSize: 13, color: t.cardMuted, marginBottom: 28 }}>
              {pct}% correct · {quiz.title}
            </div>
            <button
              onClick={() => setState({ mode: 'list' })}
              style={{
                padding: '10px 28px', borderRadius: 20, border: 'none',
                background: t.logoColor, color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%',
              }}
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      )
    }

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.pageBg, padding: 24, overflow: 'auto' }}>
        {/* Quiz header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setState({ mode: 'list' })}
            style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.sidebarText, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.sectionText }}>{quiz.title}</div>
            <div style={{ fontSize: 11, color: t.cardMuted }}>{quiz.course}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: t.cardMuted }}>
            {current + 1} / {quiz.questions.length}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: t.searchBg, borderRadius: 10, marginBottom: 28 }}>
          <div style={{
            height: '100%', borderRadius: 10,
            width: `${((current + 1) / quiz.questions.length) * 100}%`,
            background: `linear-gradient(90deg, #93c5fd, ${t.logoColor})`,
            transition: 'width 0.3s',
          }} />
        </div>

        {/* Question card */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16,
          padding: 28, maxWidth: 620, width: '100%', margin: '0 auto',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.sectionText, marginBottom: 22, lineHeight: 1.4 }}>
            Q{current + 1}. {q.q}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, i) => {
              const picked = selected[current] === i
              return (
                <div
                  key={i}
                  onClick={() => select(i)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${picked ? t.logoColor : t.cardBorder}`,
                    background: picked ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    fontWeight: picked ? 600 : 400,
                    color: picked ? t.logoColor : t.sectionText,
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1.5px solid ${picked ? t.logoColor : '#d1d5db'}`,
                    background: picked ? t.logoColor : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 10, color: '#fff', fontWeight: 700,
                  }}>
                    {picked ? '✓' : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </div>
              )
            })}
          </div>

          <button
            onClick={advance}
            disabled={selected[current] == null}
            style={{
              marginTop: 22,
              width: '100%',
              padding: '11px 0',
              borderRadius: 20,
              border: 'none',
              background: selected[current] != null ? t.logoColor : '#e5e7eb',
              color: selected[current] != null ? '#fff' : '#9ca3af',
              fontSize: 13,
              fontWeight: 700,
              cursor: selected[current] != null ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {isLast ? 'Submit Quiz' : 'Next Question →'}
          </button>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, margin: 0 }}>Quizzes</h1>
        <p style={{ fontSize: 13, color: t.cardMuted, margin: '4px 0 0' }}>
          {quizData.filter((q) => q.status === 'Completed').length} completed · {quizData.filter((q) => q.status === 'Not Started').length} not started
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {quizData.map((quiz) => {
          const pct = quiz.bestScore != null ? Math.round((quiz.bestScore / quiz.questions.length) * 100) : null
          return (
            <div key={quiz.id} style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 10px',
                  background: quiz.status === 'Completed' ? '#dcfce7' : '#eff6ff',
                  color: quiz.status === 'Completed' ? '#15803d' : t.logoColor,
                }}>
                  {quiz.status}
                </span>
                <span style={{ fontSize: 11, color: t.cardMuted }}>{quiz.duration}</span>
              </div>

              <div style={{ fontSize: 15, fontWeight: 700, color: t.sectionText }}>{quiz.title}</div>
              <div style={{ fontSize: 11, color: t.cardMuted }}>{quiz.course}</div>

              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: t.cardMuted }}>
                <span>📋 {quiz.questions.length} questions</span>
                <span>🔄 {quiz.attempts} attempt{quiz.attempts !== 1 ? 's' : ''}</span>
              </div>

              {pct != null && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: t.cardMuted }}>Best score</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 70 ? '#15803d' : '#b91c1c' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: t.searchBg, borderRadius: 10 }}>
                    <div style={{
                      height: '100%', borderRadius: 10, width: `${pct}%`,
                      background: pct >= 70 ? '#22c55e' : '#ef4444',
                    }} />
                  </div>
                </div>
              )}

              <button
                onClick={() => setState({
                  mode: 'quiz', quizId: quiz.id, current: 0,
                  selected: Array(quiz.questions.length).fill(null), submitted: false,
                })}
                style={{
                  marginTop: 4,
                  padding: '8px 0', borderRadius: 20, border: 'none',
                  background: quiz.status === 'Completed' ? `${t.logoColor}15` : t.logoColor,
                  color: quiz.status === 'Completed' ? t.logoColor : '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%',
                }}
              >
                {quiz.status === 'Completed' ? 'Retake Quiz' : 'Start Quiz →'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
