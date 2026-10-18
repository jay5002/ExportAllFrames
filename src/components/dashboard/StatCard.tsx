import { blueTheme } from './theme'
import { EnrolledIcon, HoursIcon, CertificateIcon, StreakIcon } from './icons'

interface StatCardProps {
  label: string
  value: string
  change: string
  iconColor: string
  icon: React.ReactNode
}

function StatCard({ label, value, change, iconColor, icon }: StatCardProps) {
  const t = blueTheme
  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, color: t.cardMuted, fontWeight: 500 }}>{label}</span>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: t.cardText, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: t.cardPositive, fontWeight: 500 }}>{change}</div>
    </div>
  )
}

interface StatCardsProps {
  onCoursesClick?: () => void
  onProgressClick?: () => void
}

export default function StatCards({ onCoursesClick, onProgressClick }: StatCardsProps = {}) {
  const t = blueTheme
  const stats = [
    {
      label: 'Enrolled Courses',
      value: '7',
      change: '↑ 12% this month',
      iconColor: t.cardIcon1,
      icon: <EnrolledIcon color={t.cardIcon1} />,
    },
    {
      label: 'Hours Learned',
      value: '156',
      change: '↑ 8% vs last week',
      iconColor: t.cardIcon2,
      icon: <HoursIcon color={t.cardIcon2} />,
    },
    {
      label: 'Certificates',
      value: '5',
      change: '↑ 1 this month',
      iconColor: t.cardIcon3,
      icon: <CertificateIcon color={t.cardIcon3} />,
    },
    {
      label: 'Day Streak',
      value: '12',
      change: '🔥 Keep it up!',
      iconColor: t.cardIcon4,
      icon: <StreakIcon color={t.cardIcon4} />,
    },
  ]

  const clicks: Record<string, (() => void) | undefined> = {
    'Enrolled Courses': onCoursesClick,
    'Hours Learned': onProgressClick,
    'Certificates': onProgressClick,
    'Day Streak': onProgressClick,
  }

  return (
    <div style={{ display: 'flex', gap: 14 }}>
      {stats.map((s) => (
        <div key={s.label} onClick={clicks[s.label]} style={{ flex: 1, cursor: clicks[s.label] ? 'pointer' : 'default' }}>
          <StatCard {...s} />
        </div>
      ))}
    </div>
  )
}
