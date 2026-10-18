import { useState } from 'react'
import WorkspaceRecords from './WorkspaceRecords'
import { blueTheme } from './theme'

const t = blueTheme

type NType = 'assignment' | 'quiz' | 'course' | 'system' | 'achievement'

interface Notification {
  id: number
  type: NType
  title: string
  body: string
  time: string
  read: boolean
}

const typeConfig: Record<NType, { emoji: string; bg: string; color: string }> = {
  assignment:  { emoji: '📋', bg: '#fee2e2', color: '#b91c1c' },
  quiz:        { emoji: '🧠', bg: '#fef9c3', color: '#a16207' },
  course:      { emoji: '📘', bg: '#eff6ff', color: '#2563eb' },
  system:      { emoji: '🔔', bg: '#f3f4f6', color: '#4b5563' },
  achievement: { emoji: '🏆', bg: '#dcfce7', color: '#15803d' },
}

const initial: Notification[] = [
  { id: 1, type: 'assignment', title: 'Assignment Due Tomorrow', body: '"Build a Custom Hook Library" is due on Mar 15. Submit before the deadline to avoid late penalties.', time: '2h ago', read: false },
  { id: 2, type: 'achievement', title: 'You earned a badge! 🎉', body: 'Congratulations! You completed 5 certificates and unlocked the "Knowledge Seeker" badge.', time: '5h ago', read: false },
  { id: 3, type: 'quiz', title: 'New Quiz Available', body: 'A new quiz "React Hooks Fundamentals" has been added to Advanced React Patterns. Try it now!', time: '1d ago', read: false },
  { id: 4, type: 'course', title: 'New Lesson Unlocked', body: 'Lesson 17 "Custom Hooks — Building Reusable Logic" is now available in Advanced React Patterns.', time: '1d ago', read: true },
  { id: 5, type: 'system', title: 'Weekly Report Ready', body: 'Your weekly learning report for Mar 3–9 is ready. You logged 32.5 hours — your best week yet!', time: '2d ago', read: true },
  { id: 6, type: 'assignment', title: 'Assignment Graded', body: 'Your submission for "REST API with Next.js" has been graded. You scored A+ (98/100). Great work!', time: '3d ago', read: true },
  { id: 7, type: 'course', title: 'Course Progress Milestone', body: 'You\'re 90% through UI/UX Design Fundamentals. Just 2 lessons left to complete the course!', time: '4d ago', read: true },
  { id: 8, type: 'achievement', title: '12-Day Streak! 🔥', body: 'You\'ve maintained a 12-day learning streak. Keep it up to unlock the "Dedicated Learner" badge at 14 days.', time: '5d ago', read: true },
]

const filters = ['All', 'Unread', 'Assignments', 'Quizzes', 'Courses', 'Achievements']

export default function Notifications() {
  const [notifs, setNotifs] = useState(initial)
  const [filter, setFilter] = useState('All')

  const unreadCount = notifs.filter((n) => !n.read).length

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: number) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  const dismiss = (id: number) => setNotifs((prev) => prev.filter((n) => n.id !== id))

  const filterFn = (n: Notification) => {
    if (filter === 'All') return true
    if (filter === 'Unread') return !n.read
    if (filter === 'Assignments') return n.type === 'assignment'
    if (filter === 'Quizzes') return n.type === 'quiz'
    if (filter === 'Courses') return n.type === 'course'
    if (filter === 'Achievements') return n.type === 'achievement'
    return true
  }

  const visible = notifs.filter(filterFn)

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      <WorkspaceRecords view="inbox" />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, margin: 0 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 10, background: '#ef4444', color: '#fff',
                fontSize: 12, fontWeight: 700, borderRadius: 12, padding: '2px 9px', verticalAlign: 'middle',
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: t.cardMuted, margin: '4px 0 0' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            padding: '7px 16px', borderRadius: 20,
            border: `1px solid ${t.cardBorder}`, background: t.cardBg,
            color: t.logoColor, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 20,
            border: filter === f ? 'none' : `1px solid ${t.cardBorder}`,
            background: filter === f ? t.logoColor : t.cardBg,
            color: filter === f ? '#fff' : t.sidebarText,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: t.cardMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.sectionText }}>All clear!</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>No notifications in this category.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((n) => {
            const cfg = typeConfig[n.type]
            return (
              <div key={n.id} style={{
                background: n.read ? t.cardBg : '#fafcff',
                border: `1px solid ${n.read ? t.cardBorder : '#c7d9ff'}`,
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                position: 'relative',
                transition: 'border-color 0.15s',
              }}
                onClick={() => markRead(n.id)}
              >
                {/* Unread dot */}
                {!n.read && (
                  <div style={{
                    position: 'absolute', top: 16, right: 56,
                    width: 8, height: 8, borderRadius: '50%', background: t.logoColor,
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: cfg.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {cfg.emoji}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: n.read ? 600 : 700,
                    color: t.sectionText, marginBottom: 3,
                  }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: t.sidebarText, lineHeight: 1.5, marginBottom: 6 }}>
                    {n.body}
                  </div>
                  <div style={{ fontSize: 11, color: t.cardMuted }}>{n.time}</div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}
                  style={{
                    width: 24, height: 24, borderRadius: '50%', border: 'none',
                    background: 'transparent', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    color: t.cardMuted, fontSize: 16, lineHeight: 1,
                  }}
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
