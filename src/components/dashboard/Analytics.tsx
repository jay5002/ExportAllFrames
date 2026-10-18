import { useState } from 'react'
import {
  BarChart, Bar, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie,
} from 'recharts'
import { blueTheme } from './theme'

const t = blueTheme

const ranges = ['This Week', 'This Month', 'All Time']

const weekData = [
  { day: 'Mon', hours: 2.5, lessons: 3 },
  { day: 'Tue', hours: 4, lessons: 5 },
  { day: 'Wed', hours: 3, lessons: 4 },
  { day: 'Thu', hours: 5.5, lessons: 7 },
  { day: 'Fri', hours: 4.5, lessons: 6 },
  { day: 'Sat', hours: 7, lessons: 9 },
  { day: 'Sun', hours: 6, lessons: 8 },
]

const monthData = [
  { day: 'W1', hours: 18, lessons: 22 },
  { day: 'W2', hours: 24, lessons: 30 },
  { day: 'W3', hours: 21, lessons: 26 },
  { day: 'W4', hours: 32, lessons: 40 },
]

const categoryData = [
  { name: 'Frontend', value: 38, fill: '#2563eb' },
  { name: 'Data Science', value: 22, fill: '#7c3aed' },
  { name: 'Design', value: 18, fill: '#db2777' },
  { name: 'AI / ML', value: 14, fill: '#059669' },
  { name: 'Full-Stack', value: 8, fill: '#d97706' },
]

const topCourses = [
  { name: 'Advanced React Patterns', hours: 42, lessons: 16 },
  { name: 'Python for Data Science', hours: 35, lessons: 15 },
  { name: 'UI/UX Design Fundamentals', hours: 28, lessons: 18 },
  { name: 'Machine Learning A-Z', hours: 18, lessons: 7 },
  { name: 'Full-Stack with Next.js', hours: 33, lessons: 30 },
]

const barFills = ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#3b82f6']

const kpis = [
  { label: 'Avg. Daily Hours', value: '4.6h', change: '+0.8h vs last week', up: true },
  { label: 'Lessons / Day', value: '6.0', change: '+2 vs last week', up: true },
  { label: 'Completion Rate', value: '82%', change: '+5% vs last week', up: true },
  { label: 'Quiz Avg. Score', value: '87%', change: '-3% vs last week', up: false },
]

export default function Analytics() {
  const [range, setRange] = useState('This Week')
  const data = range === 'This Week' ? weekData : monthData

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: t.cardMuted, margin: '4px 0 0' }}>Deep dive into your learning patterns</p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: 4 }}>
          {ranges.map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '5px 14px', borderRadius: 16, border: 'none',
              background: range === r ? t.logoColor : 'transparent',
              color: range === r ? '#fff' : t.sidebarText,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        {kpis.map((k) => (
          <div key={k.label} style={{
            background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
            padding: '16px 20px', flex: 1, minWidth: 160,
          }}>
            <div style={{ fontSize: 11, color: t.cardMuted, fontWeight: 500, marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: t.sectionText, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 11, marginTop: 4, color: k.up ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
              {k.up ? '↑' : '↓'} {k.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Hours bar chart */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
          padding: '20px 24px', flex: 1.4, minWidth: 280,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 4 }}>Hours Learned</div>
          <div style={{ fontSize: 11, color: t.cardMuted, marginBottom: 14 }}>{range}</div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {data.map((_, i) => <Cell key={i} fill={barFills[i % barFills.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lessons line chart */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
          padding: '20px 24px', flex: 1, minWidth: 240,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 4 }}>Lessons Completed</div>
          <div style={{ fontSize: 11, color: t.cardMuted, marginBottom: 14 }}>{range}</div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: t.cardMuted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="lessons" stroke="#7c3aed" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Category pie */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
          padding: '20px 24px', flex: '0 0 280px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 16 }}>By Category</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {categoryData.map((c) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.fill, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: t.sectionText }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: t.cardMuted, marginLeft: 'auto' }}>{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top courses table */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 14,
          padding: '20px 24px', flex: 1, minWidth: 280,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, marginBottom: 16 }}>Top Courses by Hours</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCourses.sort((a, b) => b.hours - a.hours).map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#fef9c3' : t.searchBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: i === 0 ? '#a16207' : t.cardMuted, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: t.sectionText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 11, color: t.cardMuted, flexShrink: 0 }}>{c.hours}h</span>
                <span style={{ fontSize: 11, color: t.logoColor, flexShrink: 0 }}>{c.lessons} lessons</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
