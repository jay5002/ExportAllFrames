import { useState, useRef, useEffect } from 'react'
import { blueTheme } from './theme'
import { SearchIcon, BellIcon } from './icons'
import { useNavigate } from 'react-router-dom'
import { backend } from '../../lib/backend'
import type { Course } from '../../lib/types'

const t = blueTheme

interface HeaderProps {
  userName?: string
  notificationCount?: number
  onNotificationClick?: () => void
  activeRole?: AccountRole
  onRoleChange?: (role: AccountRole) => void
  canTeach?: boolean
  onSignOut?: () => void
}

export type AccountRole = 'student' | 'instructor'

export default function Header({
  userName = 'Wankhede',
  notificationCount = 2,
  onNotificationClick,
  activeRole = 'student',
  onRoleChange,
  canTeach = false,
  onSignOut,
}: HeaderProps) {
  const navigate = useNavigate()
  const [searchCourses, setSearchCourses] = useState<Course[]>([])
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    void backend<{ courses: Course[] }>(activeRole === 'instructor' ? '/workspace' : '/workspace?view=learning').then(data => { if (active) setSearchCourses(data.courses) }).catch(() => {})
    return () => { active = false }
  }, [activeRole])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const accounts = [
    { id: 'student' as const, name: userName, role: 'Student', initial: userName[0].toUpperCase() },
    ...(canTeach ? [{ id: 'instructor' as const, name: userName, role: 'Instructor', initial: userName[0].toUpperCase() }] : []),
  ]
  const activeAccount = accounts.find((account) => account.id === activeRole) ?? accounts[0]

  const suggestions = query.length > 0
    ? searchCourses.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : []

  const showDropdown = focused && suggestions.length > 0

  return (
    <header
      style={{
        height: 56,
        background: t.headerBg,
        borderBottom: `1px solid ${t.headerBorder}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        flexShrink: 0,
        zIndex: 50,
        position: 'relative',
      }}
    >
      {/* Search */}
      <div style={{ flex: 1, maxWidth: 340, position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, pointerEvents: 'none' }}>
            <SearchIcon color={t.sidebarMuted} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search courses, lessons..."
            style={{
              width: '100%',
              background: focused ? '#fff' : t.searchBg,
              border: `1px solid ${focused ? t.logoColor : t.searchBorder}`,
              borderRadius: 20,
              padding: '7px 12px 7px 30px',
              fontSize: 12,
              color: t.sidebarText,
              outline: 'none',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                color: t.cardMuted, fontSize: 16, lineHeight: 1, padding: 0,
              }}
            >×</button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#fff', border: `1px solid ${t.cardBorder}`,
            borderRadius: 12, boxShadow: '0 8px 24px rgba(37,99,235,0.12)',
            zIndex: 200, overflow: 'hidden',
          }}>
            {suggestions.map((s) => (
              <div
              key={s.id}
                onMouseDown={() => { navigate(`${activeRole === 'instructor' ? '/instructor/courses' : '/courses'}?q=${encodeURIComponent(s.name)}`); setQuery(''); setFocused(false) }}
                style={{
                  padding: '10px 14px', fontSize: 13, color: t.sectionText,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f6ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <SearchIcon color={t.cardMuted} size={12} />
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Bell */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={onNotificationClick}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: t.searchBg, border: `1px solid ${t.searchBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e0eaff')}
          onMouseLeave={(e) => (e.currentTarget.style.background = t.searchBg)}
        >
          <BellIcon color={t.sidebarText} />
        </button>
        {notificationCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#ef4444', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff',
            pointerEvents: 'none',
          }}>
            {notificationCount}
          </div>
        )}
      </div>

      {/* Avatar + account dropdown */}
      <div ref={accountRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setAccountOpen((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: accountOpen ? '#eff6ff' : 'transparent',
            border: `1px solid ${accountOpen ? t.logoColor : 'transparent'}`,
            borderRadius: 24, padding: '4px 10px 4px 4px',
            cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={(e) => { if (!accountOpen) e.currentTarget.style.background = '#f8faff' }}
          onMouseLeave={(e) => { if (!accountOpen) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 700,
            boxShadow: '0 2px 6px rgba(37,99,235,0.3)', flexShrink: 0,
          }}>
            {activeAccount.initial}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.sectionText }}>{activeAccount.name}</div>
            <div style={{ fontSize: 10, color: t.cardMuted }}>{activeAccount.role}</div>
          </div>
          {/* Chevron */}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: accountOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 2 }}>
            <path d="M2 4l4 4 4-4" stroke={t.cardMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dropdown */}
        {accountOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#fff', border: `1px solid ${t.cardBorder}`,
            borderRadius: 14, boxShadow: '0 8px 28px rgba(37,99,235,0.14)',
            zIndex: 300, minWidth: 220, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${t.cardBorder}`, background: '#fafcff' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.cardMuted, letterSpacing: '0.06em' }}>YOUR WORKSPACES</div>
            </div>

            {/* Account list */}
            {accounts.map((acc) => {
              const active = acc.id === activeRole
              return (
              <div
                key={acc.role}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onRoleChange?.(acc.id)
                  setAccountOpen(false)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    onRoleChange?.(acc.id)
                    setAccountOpen(false)
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', cursor: 'pointer',
                  background: active ? '#eff6ff' : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8faff' }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: active
                    ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)'
                    : acc.role === 'Instructor' ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : 'linear-gradient(135deg,#059669,#065f46)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                }}>
                  {acc.initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: t.sectionText }}>{acc.name}</div>
                  <div style={{ fontSize: 10, color: t.cardMuted }}>{acc.role}</div>
                </div>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" fill={t.logoColor} opacity=".15" />
                    <path d="M4 7l2 2 4-4" stroke={t.logoColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              )
            })}

            {/* Divider + actions */}
            <div style={{ borderTop: `1px solid ${t.cardBorder}` }}>
              {[
                { label: 'Switch account', danger: false },
                { label: 'Sign Out', danger: true },
              ].map((item) => (
                <div
                  key={item.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setAccountOpen(false); onSignOut?.() }}
                  onKeyDown={(event) => { if (event.key === 'Enter') { setAccountOpen(false); onSignOut?.() } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', cursor: 'pointer', fontSize: 13,
                    color: item.danger ? '#ef4444' : t.sectionText,
                    fontWeight: item.danger ? 600 : 400,
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = item.danger ? '#fff5f5' : '#f8faff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" /></svg>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
