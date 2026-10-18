import { useState } from 'react'
import { blueTheme } from './theme'
import {
  DashboardIcon,
  CoursesIcon,
  VideoIcon,
  AssignmentsIcon,
  QuizzesIcon,
  ProgressIcon,
  AnalyticsIcon,
  NotificationsIcon,
  ProfileIcon,
} from './icons'

export type PageId =
  | 'dashboard'
  | 'courses'
  | 'video-lessons'
  | 'assignments'
  | 'quizzes'
  | 'progress'
  | 'analytics'
  | 'notifications'
  | 'profile'
  | 'instructor'
  | 'instructor-courses'
  | 'instructor-students'
  | 'instructor-grading'

interface NavItem {
  id: PageId
  icon: React.FC<{ color: string }>
  label: string
  badge?: number
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: DashboardIcon, label: 'Dashboard' },
  { id: 'courses', icon: CoursesIcon, label: 'My Courses', badge: 7 },
  { id: 'video-lessons', icon: VideoIcon, label: 'Video Lessons', badge: 3 },
  { id: 'assignments', icon: AssignmentsIcon, label: 'Assignments', badge: 2 },
  { id: 'quizzes', icon: QuizzesIcon, label: 'Quizzes' },
  { id: 'progress', icon: ProgressIcon, label: 'Progress' },
  { id: 'analytics', icon: AnalyticsIcon, label: 'Analytics' },
  { id: 'notifications', icon: NotificationsIcon, label: 'Notifications', badge: 5 },
]

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  role?: 'student' | 'instructor'
  onSwitchRole?: () => void
}

const instructorItems: NavItem[] = [
  { id: 'instructor', icon: DashboardIcon, label: 'Overview' },
  { id: 'instructor-courses', icon: CoursesIcon, label: 'My Courses', badge: 4 },
  { id: 'instructor-students', icon: ProfileIcon, label: 'Students', badge: 126 },
  { id: 'instructor-grading', icon: AssignmentsIcon, label: 'Grading', badge: 12 },
]

export default function Sidebar({ activePage, onNavigate, role = 'student', onSwitchRole }: SidebarProps) {
  const t = blueTheme
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredId, setHoveredId] = useState<PageId | null>(null)
  const visibleItems = role === 'instructor' ? instructorItems : navItems
  const panelName = role === 'instructor' ? 'Instructor Panel' : 'Student Panel'
  const sectionName = role === 'instructor' ? 'TEACHING' : 'LEARNING'
  const roleName = role === 'instructor' ? 'Instructor' : 'Student'

  const W = collapsed ? 82 : 220

  return (
    <aside
      style={{
        width: W,
        minWidth: W,
        background: '#ffffff',
        borderRight: '1px solid #e0eaff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'width 0.25s cubic-bezier(.4,0,.2,1), min-width 0.25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '2px 0 12px rgba(37,99,235,0.06)',
      }}
    >
      {/* ── Logo row + collapse toggle ────────────────────── */}
      <div
        style={{
          height: 64,
          padding: collapsed ? '0 8px' : '0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #f0f4ff',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L15 5.5V12.5L9 16L3 12.5V5.5L9 2Z" fill="white" opacity=".85" />
            <path d="M9 6.5L11.5 8V11L9 12.5L6.5 11V8L9 6.5Z" fill="white" />
          </svg>
        </div>

        {/* Text — slides + fades out when collapsed */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            opacity: collapsed ? 0 : 1,
            maxWidth: collapsed ? 0 : 200,
            transition: 'opacity 0.2s, max-width 0.25s cubic-bezier(.4,0,.2,1)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.01em' }}>
            SkillVerse
          </div>
          <div style={{ fontSize: 10, color: '#93c5fd', fontWeight: 500 }}>{panelName}</div>
        </div>

        {/* Collapse toggle — always last in the row, never overlaps logo */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '1.5px solid #e0eaff',
            background: '#f8faff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
            marginLeft: collapsed ? 'auto' : 0,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.25s',
            }}
          >
            <path d="M6.5 2L3.5 5l3 3" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* ── Nav section label ─────────────────────────────── */}
      {!collapsed && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#93c5fd',
            letterSpacing: '0.1em',
            padding: '14px 20px 6px',
          }}
        >
          {sectionName}
        </div>
      )}

      {/* ── Nav items ─────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 4px' : '0 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {visibleItems.map(({ id, icon: Icon, label, badge }) => {
          const active = activePage === id
          const hovered = hoveredId === id

          return (
            <div key={id} style={{ position: 'relative', marginBottom: 2 }}>
              {/* Tooltip when collapsed */}
              {collapsed && hovered && (
                <div
                  style={{
                    position: 'absolute',
                    left: 76,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#1e3a8a',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    padding: '5px 12px',
                    whiteSpace: 'nowrap',
                    zIndex: 100,
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  {label}
                  {badge ? ` (${badge})` : ''}
                  {/* Arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -5,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderRight: '5px solid #1e3a8a',
                    }}
                  />
                </div>
              )}

              <div
                onClick={() => onNavigate(id)}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 10,
                  padding: collapsed ? '10px 0' : '9px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: 10,
                  cursor: 'pointer',
                  position: 'relative',
                  background: active
                    ? 'linear-gradient(90deg,#eff6ff,#dbeafe)'
                    : hovered
                    ? '#f8faff'
                    : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      width: 3,
                      height: '60%',
                      background: t.logoColor,
                      borderRadius: '0 3px 3px 0',
                    }}
                  />
                )}

                {/* Icon */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon color={active ? t.sidebarActiveText : hovered ? '#3b82f6' : t.sidebarText} />
                </div>

                {/* Label + badge */}
                {!collapsed && (
                  <>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: active ? 700 : 500,
                        color: active ? t.sidebarActiveText : hovered ? '#3b82f6' : t.sidebarText,
                        flex: 1,
                        transition: 'color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {label}
                    </span>
                    {badge !== undefined && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: active ? t.logoColor : '#e0eaff',
                          color: active ? '#fff' : t.logoColor,
                          borderRadius: 10,
                          padding: '2px 7px',
                          minWidth: 18,
                          textAlign: 'center',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </>
                )}

                {/* Badge dot when collapsed */}
                {collapsed && badge !== undefined && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: collapsed ? '18%' : 8,
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#2563eb',
                      border: '1.5px solid #fff',
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── User / Switch Role footer ─────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #f0f4ff',
          padding: collapsed ? '12px 0' : '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          alignItems: collapsed ? 'center' : 'stretch',
        }}
      >
        {/* Switch Role row */}
        {!collapsed && (
          <button
            onClick={onSwitchRole}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid #e0eaff',
              background: '#f8faff',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6 Q6 2 10 6 Q6 10 2 6Z" stroke={t.logoColor} strokeWidth="1.3" />
              </svg>
            </div>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Switch Role</span>
          </button>
        )}

        {/* Avatar row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: collapsed ? 0 : '2px 4px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(37,99,235,0.3)',
            }}
          >
            W
          </div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a', whiteSpace: 'nowrap' }}>
                Wankhede
              </div>
              <div style={{ fontSize: 10, color: '#93c5fd' }}>{roleName}</div>
            </div>
          )}
          {!collapsed && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4" r="1.2" fill="#93c5fd" />
              <circle cx="7" cy="7" r="1.2" fill="#93c5fd" />
              <circle cx="7" cy="10" r="1.2" fill="#93c5fd" />
            </svg>
          )}
        </div>
      </div>
    </aside>
  )
}
