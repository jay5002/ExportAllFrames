import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { blueTheme } from './theme'
import Sidebar, { type PageId } from './Sidebar'
import Header from './Header'
import type { AccountRole } from './Header'

const routeToPage: Record<string, PageId> = {
  '/dashboard':     'dashboard',
  '/courses':       'courses',
  '/video-lessons': 'video-lessons',
  '/assignments':   'assignments',
  '/quizzes':       'quizzes',
  '/progress':      'progress',
  '/analytics':     'analytics',
  '/notifications': 'notifications',
  '/instructor':         'instructor',
  '/instructor/courses': 'instructor-courses',
  '/instructor/students':'instructor-students',
  '/instructor/grading': 'instructor-grading',
}

const pageToRoute: Record<PageId, string> = {
  dashboard:      '/dashboard',
  courses:        '/courses',
  'video-lessons':'/video-lessons',
  assignments:    '/assignments',
  quizzes:        '/quizzes',
  progress:       '/progress',
  analytics:      '/analytics',
  notifications:  '/notifications',
  profile:        '/dashboard',
  instructor:          '/instructor',
  'instructor-courses':'/instructor/courses',
  'instructor-students':'/instructor/students',
  'instructor-grading':'/instructor/grading',
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const t = blueTheme
  const activeRole: AccountRole = location.pathname.startsWith('/instructor') ? 'instructor' : 'student'

  const activePage: PageId = routeToPage[location.pathname] ?? 'dashboard'

  const handleNavigate = (page: PageId) => {
    navigate(pageToRoute[page])
  }

  const handleNotificationClick = () => {
    navigate('/notifications')
  }

  const handleRoleChange = (role: AccountRole) => {
    navigate(role === 'student' ? '/dashboard' : `/${role}`)
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
        onSwitchRole={() => handleRoleChange(activeRole === 'student' ? 'instructor' : 'student')}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Header
          userName="Wankhede"
          notificationCount={5}
          onNotificationClick={handleNotificationClick}
          activeRole={activeRole}
          onRoleChange={handleRoleChange}
        />
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
