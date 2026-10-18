import { useState } from 'react'
import WorkspaceRecords from './WorkspaceRecords'
import { blueTheme } from './theme'

const t = blueTheme

const courses = [
  {
    id: 1,
    title: 'Advanced React Patterns',
    instructor: 'Sarah Mitchell',
    category: 'Frontend',
    categoryColor: '#2563eb',
    categoryBg: '#eff6ff',
    progress: 68,
    lessons: 24,
    lessonsCompleted: 16,
    hours: '12h 30m',
    rating: 4.9,
    img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=220&fit=crop&auto=format',
    status: 'In Progress',
  },
  {
    id: 2,
    title: 'Python for Data Science',
    instructor: 'James Rodrigo',
    category: 'Data Science',
    categoryColor: '#7c3aed',
    categoryBg: '#f5f3ff',
    progress: 42,
    lessons: 36,
    lessonsCompleted: 15,
    hours: '18h 45m',
    rating: 4.8,
    img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=220&fit=crop&auto=format',
    status: 'In Progress',
  },
  {
    id: 3,
    title: 'UI/UX Design Fundamentals',
    instructor: 'Priya Sharma',
    category: 'Design',
    categoryColor: '#db2777',
    categoryBg: '#fdf2f8',
    progress: 91,
    lessons: 20,
    lessonsCompleted: 18,
    hours: '10h 15m',
    rating: 4.7,
    img: 'https://images.unsplash.com/photo-1602576666092-bf6447a729fc?w=400&h=220&fit=crop&auto=format',
    status: 'In Progress',
  },
  {
    id: 4,
    title: 'Machine Learning A-Z',
    instructor: 'David Chen',
    category: 'AI / ML',
    categoryColor: '#059669',
    categoryBg: '#ecfdf5',
    progress: 15,
    lessons: 48,
    lessonsCompleted: 7,
    hours: '24h 00m',
    rating: 4.9,
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=220&fit=crop&auto=format',
    status: 'In Progress',
  },
  {
    id: 5,
    title: 'Full-Stack with Next.js',
    instructor: 'Yuki Tanaka',
    category: 'Full-Stack',
    categoryColor: '#d97706',
    categoryBg: '#fffbeb',
    progress: 100,
    lessons: 30,
    lessonsCompleted: 30,
    hours: '15h 20m',
    rating: 5.0,
    img: 'https://images.unsplash.com/photo-1628258334105-2a0b3d6efee1?w=400&h=220&fit=crop&auto=format',
    status: 'Completed',
  },
  {
    id: 6,
    title: 'TypeScript Deep Dive',
    instructor: 'Emma Fischer',
    category: 'Frontend',
    categoryColor: '#2563eb',
    categoryBg: '#eff6ff',
    progress: 0,
    lessons: 22,
    lessonsCompleted: 0,
    hours: '11h 10m',
    rating: 4.6,
    img: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=400&h=220&fit=crop&auto=format',
    status: 'Not Started',
  },
  {
    id: 7,
    title: 'React Native Mobile Dev',
    instructor: 'Carlos Vega',
    category: 'Mobile',
    categoryColor: '#0891b2',
    categoryBg: '#ecfeff',
    progress: 33,
    lessons: 28,
    lessonsCompleted: 9,
    hours: '14h 00m',
    rating: 4.7,
    img: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=400&h=220&fit=crop&auto=format',
    status: 'In Progress',
  },
]

const filters = ['All', 'In Progress', 'Completed', 'Not Started']

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="#f59e0b">
      <path d="M5.5 1l1.2 2.4 2.7.4-1.95 1.9.46 2.7L5.5 7.1 3.07 8.4l.46-2.7L1.6 3.8l2.7-.4z" />
    </svg>
  )
}

export default function MyCourses() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered =
    activeFilter === 'All' ? courses : courses.filter((c) => c.status === activeFilter)

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      <WorkspaceRecords view="courses" />
      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, margin: 0 }}>
          My Courses
        </h1>
        <p style={{ fontSize: 13, color: t.cardMuted, margin: '4px 0 0' }}>
          {courses.length} courses enrolled · {courses.filter((c) => c.status === 'Completed').length} completed
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: activeFilter === f ? 'none' : `1px solid ${t.cardBorder}`,
              background: activeFilter === f ? t.logoColor : t.cardBg,
              color: activeFilter === f ? '#fff' : t.sidebarText,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {f}
            {f !== 'All' && (
              <span
                style={{
                  marginLeft: 6,
                  background: activeFilter === f ? 'rgba(255,255,255,0.25)' : t.searchBg,
                  borderRadius: 10,
                  padding: '1px 6px',
                  fontSize: 10,
                }}
              >
                {courses.filter((c) => c.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 18,
        }}
      >
        {filtered.map((course) => (
          <div
            key={course.id}
            style={{
              background: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 14,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'box-shadow 0.15s',
            }}
          >
            {/* Thumbnail */}
            <div style={{ position: 'relative', height: 150, background: '#e0eaff' }}>
              <img
                src={course.img}
                alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Category badge */}
              <span
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: course.categoryBg,
                  color: course.categoryColor,
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: '3px 10px',
                }}
              >
                {course.category}
              </span>
              {/* Status badge */}
              {course.status === 'Completed' && (
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: '#22c55e',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 20,
                    padding: '3px 10px',
                  }}
                >
                  ✓ Done
                </span>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.sectionText, lineHeight: 1.3 }}>
                {course.title}
              </div>
              <div style={{ fontSize: 11, color: t.cardMuted }}>by {course.instructor}</div>

              {/* Rating + meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <StarIcon />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>{course.rating}</span>
                </span>
                <span style={{ fontSize: 11, color: t.cardMuted }}>
                  {course.lessonsCompleted}/{course.lessons} lessons
                </span>
                <span style={{ fontSize: 11, color: t.cardMuted }}>{course.hours}</span>
              </div>

              {/* Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: t.cardMuted }}>Progress</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.logoColor }}>{course.progress}%</span>
                </div>
                <div style={{ height: 6, background: t.searchBg, borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${course.progress}%`,
                      borderRadius: 10,
                      background:
                        course.progress === 100
                          ? '#22c55e'
                          : `linear-gradient(90deg, #93c5fd, #2563eb)`,
                    }}
                  />
                </div>
              </div>

              {/* CTA */}
              <button
                style={{
                  marginTop: 4,
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 20,
                  border: course.progress === 0 ? `1.5px solid ${t.logoColor}` : 'none',
                  background: course.progress === 0 ? 'transparent' : course.progress === 100 ? '#f0fdf4' : t.logoColor,
                  color: course.progress === 0 ? t.logoColor : course.progress === 100 ? '#22c55e' : '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {course.progress === 0 ? 'Start Course' : course.progress === 100 ? '✓ Completed' : 'Continue →'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
