import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { blueTheme } from './theme'
import Sidebar, { type PageId } from './Sidebar'
import Header from './Header'
import type { AccountRole } from './Header'
import { useAuth } from '../auth/AuthProvider'
import useStudentNotifications from '../../lib/useStudentNotifications'

const routeToPage: Record<string, PageId> = {
  '/dashboard':     'dashboard',
  '/courses':       'courses',
  '/video-lessons': 'video-lessons',
  '/assignments':   'assignments',
  '/quizzes':       'quizzes',
  '/progress':      'progress',
  '/notifications': 'notifications',
  '/instructor':         'instructor',
  '/instructor/courses': 'instructor-courses',
  '/instructor/students':'instructor-students',
  '/instructor/assignments':'instructor-assignments',
  '/instructor/quizzes':'instructor-quizzes',
  '/instructor/grading': 'instructor-grading',
}

const pageToRoute: Record<PageId, string> = {
  dashboard:      '/dashboard',
  courses:        '/courses',
  'video-lessons':'/video-lessons',
  assignments:    '/assignments',
  quizzes:        '/quizzes',
  progress:       '/progress',
  notifications:  '/notifications',
  profile:        '/dashboard',
  instructor:          '/instructor',
  'instructor-courses':'/instructor/courses',
  'instructor-students':'/instructor/students',
  'instructor-assignments':'/instructor/assignments',
  'instructor-quizzes':'/instructor/quizzes',
  'instructor-grading':'/instructor/grading',
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const t = blueTheme
  const activeRole: AccountRole = profile?.role === 'instructor' ? 'instructor' : 'student'
  const { unread } = useStudentNotifications(activeRole === 'student')

  const activePage: PageId = routeToPage[location.pathname] ?? (activeRole === 'instructor' ? 'instructor' : 'dashboard')

  const handleNavigate = (page: PageId) => {
    const route = pageToRoute[page]
    if (activeRole === 'instructor' && !route.startsWith('/instructor')) {
      navigate('/instructor')
      return
    }
    navigate(route)
  }

  const handleRoleChange = (role: AccountRole) => {
    if (!profile || role !== profile.role) return
    navigate(role === 'instructor' ? '/instructor' : '/dashboard')
  }

  const switchAccount = () => {
    void signOut().then(() => navigate('/login')).catch(() => {
      window.alert('Unable to sign out. Please check your connection and try again.')
    })
  }

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      background: t.pageBg,
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
    }}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        role={activeRole}
        onSwitchRole={switchAccount}
        userName={profile?.name}
        notificationCount={unread}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Header
          userName={profile?.name}
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
          canTeach={profile?.role === 'instructor'}
          onSignOut={switchAccount}
        />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
