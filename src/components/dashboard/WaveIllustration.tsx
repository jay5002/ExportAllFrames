export default function WaveIllustration() {
  return (
    <svg width="200" height="120" viewBox="0 0 200 120" fill="none" style={{ display: 'block' }}>
      <path
        d="M0 60 Q25 40 50 60 Q75 80 100 60 Q125 40 150 60 Q175 80 200 60 L200 120 L0 120Z"
        fill="rgba(59,130,246,0.08)"
      />
      <path
        d="M0 75 Q30 55 60 75 Q90 95 120 75 Q150 55 180 75 Q195 85 200 80 L200 120 L0 120Z"
        fill="rgba(59,130,246,0.12)"
      />
      <path
        d="M0 90 Q40 70 80 90 Q120 110 160 90 Q185 78 200 85 L200 120 L0 120Z"
        fill="rgba(59,130,246,0.16)"
      />
      <circle cx="160" cy="35" r="22" fill="rgba(96,165,250,0.25)" />
      <circle cx="160" cy="35" r="14" fill="rgba(59,130,246,0.35)" />
      <circle cx="160" cy="27" r="5" fill="#bfdbfe" />
      <path d="M149 43c0-6.1 5-11 11-11s11 5 11 11" fill="#bfdbfe" opacity=".8" />
    </svg>
  )
}
