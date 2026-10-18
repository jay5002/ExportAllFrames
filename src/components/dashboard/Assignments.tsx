import { useState } from 'react'
import { blueTheme } from './theme'

const t = blueTheme

type Status = 'Pending' | 'Submitted' | 'Graded' | 'Overdue'

interface Assignment {
  id: number
  title: string
  course: string
  dueDate: string
  status: Status
  grade?: string
  priority: 'High' | 'Medium' | 'Low'
  description: string
}

const initialAssignments: Assignment[] = [
  {
    id: 1,
    title: 'Build a Custom Hook Library',
    course: 'Advanced React Patterns',
    dueDate: 'Mar 15, 2026',
    status: 'Pending',
    priority: 'High',
    description: 'Create a library of reusable custom hooks covering state, async, and DOM patterns.',
  },
  {
    id: 2,
    title: 'Data Visualization Project',
    course: 'Python for Data Science',
    dueDate: 'Mar 20, 2026',
    status: 'Pending',
    priority: 'High',
    description: 'Build interactive visualizations using matplotlib and seaborn on a real dataset.',
  },
  {
    id: 3,
    title: 'Figma Prototype Submission',
    course: 'UI/UX Design Fundamentals',
    dueDate: 'Mar 10, 2026',
    status: 'Submitted',
    priority: 'Medium',
    description: 'Submit a high-fidelity Figma prototype for the e-commerce checkout flow.',
  },
  {
    id: 4,
    title: 'Linear Regression Model',
    course: 'Machine Learning A-Z',
    dueDate: 'Mar 5, 2026',
    status: 'Graded',
    grade: 'A',
    priority: 'Low',
    description: 'Implement and evaluate a linear regression model on the housing price dataset.',
  },
  {
    id: 5,
    title: 'REST API with Next.js',
    course: 'Full-Stack with Next.js',
    dueDate: 'Feb 28, 2026',
    status: 'Graded',
    grade: 'A+',
    priority: 'Low',
    description: 'Build a fully functional REST API using Next.js API routes and Prisma ORM.',
  },
  {
    id: 6,
    title: 'TypeScript Generics Quiz Project',
    course: 'TypeScript Deep Dive',
    dueDate: 'Mar 8, 2026',
    status: 'Overdue',
    priority: 'High',
    description: 'Create a quiz app using advanced TypeScript generics and conditional types.',
  },
]

const statusColors: Record<Status, { bg: string; text: string }> = {
  Pending:   { bg: '#fef9c3', text: '#a16207' },
  Submitted: { bg: '#dbeafe', text: '#1d4ed8' },
  Graded:    { bg: '#dcfce7', text: '#15803d' },
  Overdue:   { bg: '#fee2e2', text: '#b91c1c' },
}

const priorityColors = {
  High:   { bg: '#fee2e2', text: '#b91c1c' },
  Medium: { bg: '#fef9c3', text: '#a16207' },
  Low:    { bg: '#dcfce7', text: '#15803d' },
}

const filters: (Status | 'All')[] = ['All', 'Pending', 'Submitted', 'Graded', 'Overdue']

export default function Assignments() {
  const [activeFilter, setActiveFilter] = useState<Status | 'All'>('All')
  const [assignments, setAssignments] = useState(initialAssignments)
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered =
    activeFilter === 'All' ? assignments : assignments.filter((a) => a.status === activeFilter)

  const submit = (id: number) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Submitted' as Status } : a))
    )
  }

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, margin: 0 }}>Assignments</h1>
        <p style={{ fontSize: 13, color: t.cardMuted, margin: '4px 0 0' }}>
          {assignments.filter((a) => a.status === 'Pending').length} pending ·{' '}
          {assignments.filter((a) => a.status === 'Overdue').length} overdue
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: activeFilter === f ? 'none' : `1px solid ${t.cardBorder}`,
              background: activeFilter === f ? t.logoColor : t.cardBg,
              color: activeFilter === f ? '#fff' : t.sidebarText,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f}
            {f !== 'All' && (
              <span style={{
                marginLeft: 5,
                background: activeFilter === f ? 'rgba(255,255,255,0.25)' : t.searchBg,
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: 10,
              }}>
                {assignments.filter((a) => a.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Assignment list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((a) => {
          const isOpen = expanded === a.id
          const sc = statusColors[a.status]
          const pc = priorityColors[a.priority]

          return (
            <div
              key={a.id}
              style={{
                background: t.cardBg,
                border: `1px solid ${isOpen ? t.logoColor : t.cardBorder}`,
                borderRadius: 14,
                overflow: 'hidden',
                boxShadow: isOpen ? `0 0 0 3px ${t.logoColor}18` : 'none',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
            >
              {/* Row */}
              <div
                onClick={() => setExpanded(isOpen ? null : a.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  cursor: 'pointer',
                }}
              >
                {/* Priority dot */}
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: pc.text,
                  flexShrink: 0,
                }} />

                {/* Title + course */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: t.cardMuted, marginTop: 2 }}>{a.course}</div>
                </div>

                {/* Due date */}
                <div style={{ fontSize: 11, color: t.cardMuted, flexShrink: 0, textAlign: 'right' }}>
                  <div>Due</div>
                  <div style={{ fontWeight: 600, color: a.status === 'Overdue' ? '#ef4444' : t.sectionText }}>
                    {a.dueDate}
                  </div>
                </div>

                {/* Priority badge */}
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: pc.bg,
                  color: pc.text,
                  borderRadius: 20,
                  padding: '3px 10px',
                  flexShrink: 0,
                }}>
                  {a.priority}
                </span>

                {/* Status badge */}
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: sc.bg,
                  color: sc.text,
                  borderRadius: 20,
                  padding: '3px 10px',
                  flexShrink: 0,
                }}>
                  {a.status === 'Graded' && a.grade ? `${a.status} · ${a.grade}` : a.status}
                </span>

                {/* Chevron */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M3 5l4 4 4-4" stroke={t.cardMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{
                  borderTop: `1px solid ${t.cardBorder}`,
                  padding: '14px 18px',
                  background: '#fafcff',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-start',
                }}>
                  <p style={{ flex: 1, fontSize: 13, color: t.sidebarText, margin: 0, lineHeight: 1.6 }}>
                    {a.description}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: `1px solid ${t.cardBorder}`,
                      background: '#fff',
                      color: t.sidebarText,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}>
                      View Details
                    </button>
                    {a.status === 'Pending' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); submit(a.id) }}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 20,
                          border: 'none',
                          background: t.logoColor,
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Submit →
                      </button>
                    )}
                    {a.status === 'Overdue' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); submit(a.id) }}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 20,
                          border: 'none',
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Submit Late →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
