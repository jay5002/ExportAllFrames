import { useNavigate } from 'react-router-dom'
import HeroCard from './HeroCard'
import StatCards from './StatCard'
import WeeklyProgress from './WeeklyProgress'
import UpcomingPanel from './UpcomingPanel'

export default function DashboardHome() {
  const navigate = useNavigate()

  return (
    <div style={{
      flex: 1,
      padding: 20,
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      <HeroCard
        userName="Wankhede"
        pendingAssignments={3}
        coursesInProgress={7}
        onContinue={() => navigate('/courses')}
      />
      <StatCards
        onCoursesClick={() => navigate('/courses')}
        onProgressClick={() => navigate('/progress')}
      />
      <div style={{ display: 'flex', gap: 14 }}>
        <WeeklyProgress />
        <UpcomingPanel onViewAll={() => navigate('/assignments')} />
      </div>
    </div>
  )
}
