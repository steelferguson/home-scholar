// The database function award_wallet() is the one place that decides an
// award. This mirror exists so the rule can be unit tested and so the offline
// fixture behaves like production. Keep the two in step.
export const DAILY_CAP_CENTS = 50
export const LESSON_CENTS = 10
export const REPLAY_CENTS = 5
export const PRACTICE_CENTS = 10

export function awardCents({ kind, alreadyPaidLesson = false, earnedToday = 0, cap = DAILY_CAP_CENTS }) {
  const base = kind === 'practice' ? PRACTICE_CENTS : alreadyPaidLesson ? REPLAY_CENTS : LESSON_CENTS
  const cents = Math.min(base, Math.max(0, cap - earnedToday))
  return { kind: kind === 'lesson' && alreadyPaidLesson ? 'replay' : kind, cents, earnedToday: earnedToday + cents, cap }
}

// Day boundary is midnight in the family's home zone, not the device's.
export function chicagoDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

export const formatCents = cents => `${cents < 0 ? '-' : ''}$${(Math.abs(cents) / 100).toFixed(2)}`

const kindLabel = { lesson: 'Lesson', replay: 'Lesson again', practice: 'Practice set' }
export function entryLabel(entry) {
  if (entry.kind === 'adjustment') return entry.reason
  const title = entry.lesson?.title
  return title ? `${title}${entry.kind === 'replay' ? ' again' : ''}` : kindLabel[entry.kind] || entry.kind
}
