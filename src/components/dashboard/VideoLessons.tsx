import { useState } from 'react'
import { blueTheme } from './theme'

const t = blueTheme

const videos = [
  {
    id: 1,
    title: 'React Hooks Deep Dive — useState & useEffect',
    course: 'Advanced React Patterns',
    duration: '18:42',
    watched: true,
    watchedTime: '18:42',
    img: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=480&h=270&fit=crop&auto=format',
    instructor: 'Sarah Mitchell',
    views: '4.2k',
    tag: 'React',
    tagColor: '#2563eb',
    tagBg: '#eff6ff',
  },
  {
    id: 2,
    title: 'Context API vs Redux — When to Use What',
    course: 'Advanced React Patterns',
    duration: '24:15',
    watched: true,
    watchedTime: '24:15',
    img: 'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=480&h=270&fit=crop&auto=format',
    instructor: 'Sarah Mitchell',
    views: '3.8k',
    tag: 'React',
    tagColor: '#2563eb',
    tagBg: '#eff6ff',
  },
  {
    id: 3,
    title: 'Custom Hooks — Building Reusable Logic',
    course: 'Advanced React Patterns',
    duration: '31:07',
    watched: false,
    watchedTime: '12:30',
    img: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=480&h=270&fit=crop&auto=format',
    instructor: 'Sarah Mitchell',
    views: '2.9k',
    tag: 'React',
    tagColor: '#2563eb',
    tagBg: '#eff6ff',
  },
  {
    id: 4,
    title: 'Pandas DataFrames — Cleaning & Transforming Data',
    course: 'Python for Data Science',
    duration: '22:55',
    watched: true,
    watchedTime: '22:55',
    img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=480&h=270&fit=crop&auto=format',
    instructor: 'James Rodrigo',
    views: '5.1k',
    tag: 'Python',
    tagColor: '#7c3aed',
    tagBg: '#f5f3ff',
  },
  {
    id: 5,
    title: 'Data Visualization with Matplotlib & Seaborn',
    course: 'Python for Data Science',
    duration: '28:40',
    watched: false,
    watchedTime: '0:00',
    img: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=480&h=270&fit=crop&auto=format',
    instructor: 'James Rodrigo',
    views: '3.4k',
    tag: 'Python',
    tagColor: '#7c3aed',
    tagBg: '#f5f3ff',
  },
  {
    id: 6,
    title: 'Neural Networks from Scratch in Python',
    course: 'Machine Learning A-Z',
    duration: '45:10',
    watched: false,
    watchedTime: '0:00',
    img: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&h=270&fit=crop&auto=format',
    instructor: 'David Chen',
    views: '6.7k',
    tag: 'AI / ML',
    tagColor: '#059669',
    tagBg: '#ecfdf5',
  },
  {
    id: 7,
    title: 'Figma Auto-Layout Mastery',
    course: 'UI/UX Design Fundamentals',
    duration: '19:20',
    watched: true,
    watchedTime: '19:20',
    img: 'https://images.unsplash.com/photo-1602576666092-bf6447a729fc?w=480&h=270&fit=crop&auto=format',
    instructor: 'Priya Sharma',
    views: '2.1k',
    tag: 'Design',
    tagColor: '#db2777',
    tagBg: '#fdf2f8',
  },
  {
    id: 8,
    title: 'Deploying Next.js Apps to Vercel',
    course: 'Full-Stack with Next.js',
    duration: '14:58',
    watched: false,
    watchedTime: '6:12',
    img: 'https://images.unsplash.com/photo-1628258334105-2a0b3d6efee1?w=480&h=270&fit=crop&auto=format',
    instructor: 'Yuki Tanaka',
    views: '4.4k',
    tag: 'Full-Stack',
    tagColor: '#d97706',
    tagBg: '#fffbeb',
  },
]

const filters = ['All Videos', 'Watched', 'In Progress', 'Not Started']

function PlayIcon({ size = 28, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="14" fill="rgba(0,0,0,0.45)" />
      <path d="M11 9.5l9 4.5-9 4.5V9.5z" fill={color} />
    </svg>
  )
}

function progressFromTime(watched: string, total: string): number {
  const toSeconds = (t: string) => {
    const parts = t.split(':').map(Number)
    return parts[0] * 60 + parts[1]
  }
  const w = toSeconds(watched)
  const tot = toSeconds(total)
  if (tot === 0) return 0
  return Math.round((w / tot) * 100)
}

export default function VideoLessons() {
  const [activeFilter, setActiveFilter] = useState('All Videos')
  const [activeVideo, setActiveVideo] = useState<number | null>(null)

  const filterFn = (v: (typeof videos)[0]) => {
    if (activeFilter === 'All Videos') return true
    if (activeFilter === 'Watched') return v.watched
    const pct = progressFromTime(v.watchedTime, v.duration)
    if (activeFilter === 'In Progress') return pct > 0 && !v.watched
    if (activeFilter === 'Not Started') return pct === 0
    return true
  }

  const filtered = videos.filter(filterFn)

  return (
    <div style={{ flex: 1, padding: 24, overflow: 'auto', background: t.pageBg }}>
      {/* Page header */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.sectionText, margin: 0 }}>
          Video Lessons
        </h1>
        <p style={{ fontSize: 13, color: t.cardMuted, margin: '4px 0 0' }}>
          {videos.length} videos · {videos.filter((v) => v.watched).length} watched
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
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 18,
        }}
      >
        {filtered.map((video) => {
          const pct = progressFromTime(video.watchedTime, video.duration)
          const isActive = activeVideo === video.id

          return (
            <div
              key={video.id}
              style={{
                background: t.cardBg,
                border: `1px solid ${isActive ? t.logoColor : t.cardBorder}`,
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                boxShadow: isActive ? `0 0 0 2px ${t.logoColor}33` : 'none',
              }}
              onClick={() => setActiveVideo(isActive ? null : video.id)}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', height: 160, background: '#e0eaff' }}>
                <img
                  src={video.img}
                  alt={video.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.1)',
                  }}
                >
                  <PlayIcon />
                </div>
                {/* Duration */}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 6,
                    padding: '3px 7px',
                  }}
                >
                  {video.duration}
                </span>
                {/* Watched badge */}
                {video.watched && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#22c55e',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 20,
                      padding: '3px 8px',
                    }}
                  >
                    ✓ Watched
                  </span>
                )}
                {/* Tag */}
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    background: video.tagBg,
                    color: video.tagColor,
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 20,
                    padding: '3px 9px',
                  }}
                >
                  {video.tag}
                </span>

                {/* Progress bar on thumbnail */}
                {pct > 0 && !video.watched && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'rgba(255,255,255,0.3)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: t.logoColor,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: t.sectionText,
                    lineHeight: 1.35,
                  }}
                >
                  {video.title}
                </div>
                <div style={{ fontSize: 11, color: t.cardMuted }}>{video.course}</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 2,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: `${t.logoColor}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                        color: t.logoColor,
                      }}
                    >
                      {video.instructor[0]}
                    </div>
                    <span style={{ fontSize: 11, color: t.cardMuted }}>{video.instructor}</span>
                  </div>
                  <span style={{ fontSize: 11, color: t.cardMuted }}>{video.views} views</span>
                </div>

                {/* Progress row */}
                {pct > 0 && !video.watched && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: t.cardMuted }}>
                        {video.watchedTime} / {video.duration}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.logoColor }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: t.searchBg, borderRadius: 10 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 10,
                          background: `linear-gradient(90deg, #93c5fd, ${t.logoColor})`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  style={{
                    marginTop: 6,
                    width: '100%',
                    padding: '7px 0',
                    borderRadius: 20,
                    border: 'none',
                    background: video.watched
                      ? '#f0fdf4'
                      : pct > 0
                      ? t.logoColor
                      : `${t.logoColor}15`,
                    color: video.watched ? '#22c55e' : pct > 0 ? '#fff' : t.logoColor,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {video.watched ? '✓ Rewatch' : pct > 0 ? '▶ Resume' : '▶ Play'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
