interface IconProps {
  color: string
  size?: number
}

export function DashboardIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" fill={color} />
      <rect x="9" y="1" width="6" height="6" rx="1" fill={color} />
      <rect x="1" y="9" width="6" height="6" rx="1" fill={color} />
      <rect x="9" y="9" width="6" height="6" rx="1" fill={color} />
    </svg>
  )
}

export function CoursesIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 2h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.3" />
      <path d="M11 2h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1" stroke={color} strokeWidth="1.3" />
    </svg>
  )
}

export function VideoIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="10" height="10" rx="1.5" stroke={color} strokeWidth="1.3" />
      <path d="M11 6l4-2v8l-4-2V6z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

export function AssignmentsIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="3" y="2" width="10" height="13" rx="1.5" stroke={color} strokeWidth="1.3" />
      <path d="M6 2v2h4V2" stroke={color} strokeWidth="1.3" />
      <path d="M5 7h6M5 10h4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function QuizzesIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="1.3" />
      <path d="M6.5 6.5C6.5 5.7 7.2 5 8 5s1.5.7 1.5 1.5c0 1-1.5 1.5-1.5 2.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11" r=".6" fill={color} />
    </svg>
  )
}

export function ProgressIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 12L5 8l3 2 3-4 3 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function AnalyticsIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="9" width="3" height="5" rx="0.5" fill={color} />
      <rect x="6.5" y="6" width="3" height="8" rx="0.5" fill={color} />
      <rect x="11" y="3" width="3" height="11" rx="0.5" fill={color} />
    </svg>
  )
}

export function NotificationsIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2a5 5 0 0 0-5 5v3l-1 1h12l-1-1V7a5 5 0 0 0-5-5z" stroke={color} strokeWidth="1.3" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.3" />
    </svg>
  )
}

export function ProfileIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke={color} strokeWidth="1.3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function SearchIcon({ color, size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke={color} strokeWidth="1.2" />
      <path d="M9.5 9.5L12 12" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function BellIcon({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2a5 5 0 0 0-5 5v3l-1 1h12l-1-1V7a5 5 0 0 0-5-5z" stroke={color} strokeWidth="1.3" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.3" />
    </svg>
  )
}

// Stat card icons
export function EnrolledIcon({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="16" height="16" rx="3" stroke={color} strokeWidth="1.4" />
      <path d="M7 8h8M7 12h6M7 16h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function HoursIcon({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.4" />
      <path d="M11 7v4l2.5 2.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function CertificateIcon({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="10" r="5" stroke={color} strokeWidth="1.4" />
      <path d="M8 15l-1 5 4-2 4 2-1-5" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

export function StreakIcon({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <path
        d="M11 3C8 7 7 10 9 13c1 1.5 0 4-2 4 2 0 7 .5 8-4 .5-2-1-3-1-3s2 1 2 4c2-3 1-8-5-11z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
