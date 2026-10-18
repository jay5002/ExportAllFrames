import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { blueTheme } from './theme'

const weeklyData = [
  { day: 'Mon', hours: 2 },
  { day: 'Tue', hours: 3.5 },
  { day: 'Wed', hours: 2.5 },
  { day: 'Thu', hours: 5 },
  { day: 'Fri', hours: 4 },
  { day: 'Sat', hours: 6.5 },
  { day: 'Sun', hours: 5.5 },
]

export default function WeeklyProgress() {
  const t = blueTheme

  return (
    <div
      style={{
        background: t.cardBg,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 12,
        padding: '16px 18px',
        flex: 1.4,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 2 }}>
        Weekly Progress
      </div>
      <div style={{ fontSize: 11, color: t.cardMuted, marginBottom: 14 }}>
        Hours spent learning this week
      </div>
      <div style={{ width: '100%', height: 130 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeklyData} barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: t.cardMuted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 8]}
            tick={{ fontSize: 10, fill: t.cardMuted }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: t.cardText,
            }}
          />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
            {weeklyData.map((_, i) => (
              <Cell key={i} fill={t.chartBarFill[i % t.chartBarFill.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
