import welcomeImg from '@/imports/welcome-ref.png'

interface HeroCardProps {
  userName?: string
  pendingAssignments?: number
  coursesInProgress?: number
  onContinue?: () => void
}

export default function HeroCard({
  userName = 'Wankhede',
  pendingAssignments = 3,
  coursesInProgress = 7,
  onContinue,
}: HeroCardProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(125deg, #1e2a5e 0%, #2d2b6b 40%, #1a1842 100%)',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        minHeight: 200,
        position: 'relative',
      }}
    >
      {/* Left — text */}
      <div
        style={{
          flex: 1,
          padding: '32px 36px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#93c5fd',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          Welcome back, {userName} &nbsp;·&nbsp; {pendingAssignments} pending &nbsp;·&nbsp; {coursesInProgress} courses in progress
        </div>

        {/* Heading */}
        <div
          style={{
            fontSize: 'clamp(22px, 2.6vw, 32px)',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: 14,
          }}
        >
          Upgrade your learning<br />
          Skills &amp; Upgrade your life
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 13,
            color: '#a5b4fc',
            lineHeight: 1.7,
            marginBottom: 26,
            maxWidth: 420,
          }}
        >
          You have{' '}
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>{pendingAssignments} pending assignments</span>{' '}
          and{' '}
          <span style={{ color: '#34d399', fontWeight: 600 }}>{coursesInProgress} courses</span>{' '}
          in progress. Keep pushing — every lesson counts.
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button
            onClick={onContinue}
            style={{
              padding: '11px 26px',
              borderRadius: 8,
              border: 'none',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.01em',
              boxShadow: '0 4px 16px rgba(37,99,235,0.45)',
              transition: 'background 0.15s, transform 0.12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
          >
            Find Courses
          </button>
          <button
            onClick={onContinue}
            style={{
              padding: '11px 26px',
              borderRadius: 8,
              border: '2px solid rgba(255,255,255,0.35)',
              background: 'transparent',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.01em',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa'
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Right — illustration */}
      <div
        style={{
          flexShrink: 0,
          width: '38%',
          maxWidth: 340,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <img
          src={welcomeImg}
          alt="Student learning online"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            display: 'block',
          }}
        />
      </div>
    </div>
  )
}
