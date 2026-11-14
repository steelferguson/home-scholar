// Shown on a results screen after an award: what this finish paid.
export default function EarnedBanner({ earned, error, className = '' }) {
  if (error) return <p role="alert" className={`text-xl font-bold ${className}`}>{error}</p>
  if (!earned) return null
  if (earned.cents > 0) return <p className={`text-3xl font-black ${className}`} data-testid="earned">+{earned.cents}¢ 💵</p>
  return <p className={`text-xl font-bold ${className}`} data-testid="earned">Daily goal reached! Great practice. 💪</p>
}
