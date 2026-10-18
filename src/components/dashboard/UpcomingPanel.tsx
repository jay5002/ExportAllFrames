import { blueTheme } from './theme'

interface Assignment {
  title: string
  subtitle: string
  due: string
}

const defaultAssignments: Assignment[] = [
  {
    title: 'Build a Custom Hook Library',
    subtitle: 'Advanced React Patterns',
    due: 'Due: Mar 15',
  },
  {
    title: 'Data Visualization Project',
    subtitle: 'Python for Data Science',
    due: 'Due: Mar 20',
  },
]

interface UpcomingPanelProps {
  assignments?: Assignment[]
  onViewAll?: () => void
}

export default function UpcomingPanel({ assignments = defaultAssignments, onViewAll }: UpcomingPanelProps) {
  const t = blueTheme

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 12,
        padding: '16px 18px',
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: t.sectionText }}>Upcoming</span>
        <span onClick={onViewAll} style={{ fontSize: 12, color: t.logoColor, cursor: 'pointer', fontWeight: 500 }}>
          View All
        </span>
      </div>

      {assignments.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            padding: '10px 0',
            borderBottom: i < assignments.length - 1 ? `1px solid ${t.cardBorder}` : 'none',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: t.upcomingBadge,
              flexShrink: 0,
              marginTop: 4,
            }}
          />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.upcomingTitle }}>
              {item.title}
            </div>
            <div style={{ fontSize: 11, color: t.upcomingSubtitle, marginBottom: 2 }}>
              {item.subtitle}
            </div>
            <div style={{ fontSize: 10, color: t.upcomingDue, fontWeight: 600 }}>{item.due}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
