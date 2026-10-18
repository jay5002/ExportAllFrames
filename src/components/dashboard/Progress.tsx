import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { blueTheme } from './theme'

const t = blueTheme

const weeklyHours = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 4 },
  { day: 'Wed', hours: 3 },
  { day: 'Thu', hours: 5.5 },
  { day: 'Fri', hours: 4.5 },
  { day: 'Sat', hours: 7 },
  { day: 'Sun', hours: 6 },
]

const monthlyProgress = [
  { month: 'Oct', courses: 2, hours: 18 },
  { month: 'Nov', courses: 3, hours: 26 },
  { month: 'Dec', courses: 4, hours: 32 },
  { month: 'Jan', courses: 5, hours: 40 },
  { month: 'Feb', courses: 6, hours: 52 },
  { month: 'Mar', courses: 7, hours: 61 },
]

const courseProgress = [
  { name: 'Advanced React Patterns', progress: 68, color: '#2563eb' },
  { name: 'Python for Data Science', progress: 42, color: '#7c3aed' },
  { name: 'UI/UX Design Fundamentals', progress: 91, color: '#059669' },
  { name: 'Machine Learning A-Z', progress: 15, color: '#d97706' },
  { name: 'Full-Stack with Next.js', progress: 100, color: '#22c55e' },
  { name: 'TypeScript Deep Dive', progress: 0, color: '#6b7280' },
]

const achievements = [
  { emoji: '🔥', label: '12-Day Streak', sub: 'Current streak' },
  { emoji: '🎓', label: '5 Certificates', sub: 'Earned so far' },
  { emoji: '⚡', label: '156 Hours', sub: 'Total learned' },
  { emoji: '🏆', label: 'Top 10%', sub: 'In your cohort' },
]

const radialData = [{ name: 'Overall', value: 58, fill: '#2563eb' }]

export default function Progress() {
  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, margin: 0 }}>Progress</h1>
        <p style={{ fontSize: 13, color: t.cardMuted, margin: '4px 0 0' }}>
          Track your learning journey across all courses
        </p>
      </div>

      {/* Achievement badges */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        {achievements.map((a) => (
          <div key={a.label} style={{
            background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 160,
          }}>
            <span style={{ fontSize: 28 }}>{a.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: t.sectionText }}>{a.label}</div>
              <div style={{ fontSize: 11, color: t.cardMuted }}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Overall completion radial */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
          padding: '20px 24px', flex: '0 0 220px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 8, alignSelf: 'flex-start' }}>
            Overall Completion
          </div>
          <div style={{ width: 160, height: 160, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#e0eaff' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: t.logoColor }}>58%</div>
              <div style={{ fontSize: 10, color: t.cardMuted }}>complete</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: t.cardMuted, textAlign: 'center', marginTop: 8 }}>
            4 of 7 courses actively progressing
          </div>
        </div>

        {/* Weekly hours line chart */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
          padding: '20px 24px', flex: 1, minWidth: 240,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 4 }}>
            This Week
          </div>
          <div style={{ fontSize: 11, color: t.cardMuted, marginBottom: 14 }}>Daily learning hours</div>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={weeklyHours}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 8]} tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="hours" stroke={t.logoColor} strokeWidth={2.5}
                  dot={{ r: 4, fill: t.logoColor, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly trend */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
          padding: '20px 24px', flex: 1, minWidth: 240,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 4 }}>
            Monthly Trend
          </div>
          <div style={{ fontSize: 11, color: t.cardMuted, marginBottom: 14 }}>Hours learned per month</div>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-course progress bars */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14, padding: '20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 18 }}>
          Course Progress Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {courseProgress.map((c) => (
            <div key={c.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: t.sectionText }}>{c.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.color }}>
                  {c.progress === 100 ? '✓ Done' : `${c.progress}%`}
                </span>
              </div>
              <div style={{ height: 8, background: t.searchBg, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${c.progress}%`, borderRadius: 10,
                  background: c.progress === 0 ? '#e5e7eb' : c.color,
                  transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
