import welcomeImg from '@/imports/welcome-ref-clear.png'

interface HeroCardProps {
  userName?: string
  pendingAssignments?: number
  coursesInProgress?: number
  onContinue?: () => void
}

export default function HeroCard({ userName = 'Learner', pendingAssignments = 0, coursesInProgress = 0, onContinue }: HeroCardProps) {
  return (
    <section className="flex overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 p-6 sm:p-8">
        <div>
          <p className="sv-eyebrow">Welcome back, {userName}</p>
          <h1 className="sv-title text-[28px] leading-9">Pick up where you left off</h1>
        </div>
        <p className="sv-desc max-w-[52ch]">
          You have <strong className="font-semibold text-slate-900">{pendingAssignments} pending {pendingAssignments === 1 ? 'assignment' : 'assignments'}</strong> and{' '}
          <strong className="font-semibold text-slate-900">{Math.max(coursesInProgress, 0)} {coursesInProgress === 1 ? 'course' : 'courses'}</strong> in progress. Every lesson counts.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={onContinue} className="sv-button">Browse courses</button>
        </div>
      </div>
      <div className="hidden w-1/3 max-w-[320px] shrink-0 items-center justify-center overflow-hidden rounded-r-xl bg-[#F1F6FF] p-4 md:flex">
        <img src={welcomeImg} alt="" className="h-auto max-h-full w-full object-contain" />
      </div>
    </section>
  )
}
