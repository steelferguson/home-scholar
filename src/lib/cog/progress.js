import { clampLevel, carelessThresholdSeconds, MIN_LEVEL, MAX_LEVEL } from './levels.js'
import { SUBTESTS } from './item.js'

// Everything the engine remembers between bites. Plain serialisable data, so
// phase 4 can persist it as a row without translation.
//
// Level is tracked PER SUBTEST. He may be level 9 on number series and level 4
// on paper folding, and a single global level would hold back the first and
// bury him in the second.

export const WINDOW = 8        // attempts per subtest the level decision looks at
export const RECENT_MEMORY = 40 // item ids remembered per subtest, to avoid repeats

export const LEVEL_UP_ACCURACY = 0.85
export const LEVEL_DOWN_ACCURACY = 0.6

export function createProgress(startLevel = 1) {
  const levels = {}
  const history = {}
  const recent = {}
  const seen = {}
  for (const subtest of Object.keys(SUBTESTS)) {
    levels[subtest] = clampLevel(startLevel)
    history[subtest] = []
    recent[subtest] = []
    seen[subtest] = false
  }
  return { levels, history, recent, seen, bites: 0 }
}

// Fast and wrong is a different problem from slow and wrong, and they need
// opposite fixes: one is "slow down and read it", the other is "you need more
// practice at this". Collapsing them into one accuracy number hides the only
// thing worth knowing about a bright kid who tests badly.
export function classifyAttempt({ correct, seconds, targetSeconds, skipped }) {
  if (skipped) return 'skipped'
  if (correct) return seconds <= targetSeconds ? 'confident' : 'slow_correct'
  return seconds < carelessThresholdSeconds(targetSeconds) ? 'careless' : 'hard'
}

export function recordAttempt(progress, attempt) {
  const { subtest, itemId } = attempt
  const kind = classifyAttempt(attempt)
  const entry = {
    itemId,
    // Which bite this happened in, so the rotation can tell how long a subtest
    // has been waiting.
    bite: progress.bites,
    level: attempt.level,
    correct: !!attempt.correct,
    seconds: attempt.seconds,
    targetSeconds: attempt.targetSeconds,
    kind,
  }

  const history = [...progress.history[subtest], entry].slice(-WINDOW * 3)
  const recent = [itemId, ...progress.recent[subtest].filter((id) => id !== itemId)].slice(0, RECENT_MEMORY)

  return {
    ...progress,
    history: { ...progress.history, [subtest]: history },
    recent: { ...progress.recent, [subtest]: recent },
    seen: { ...progress.seen, [subtest]: true },
  }
}

// Only attempts AT OR ABOVE the current level count towards moving off it.
//
// Bites ramp difficulty within themselves and end below his level, so a plain
// "attempts at exactly this level" filter threw away most of the evidence and
// levels never moved -- ten perfect bites in a row promoted nothing. Items
// pitched below his level are not evidence he is ready for more.
const windowFor = (progress, subtest) =>
  progress.history[subtest].filter((e) => e.level >= progress.levels[subtest]).slice(-WINDOW)

export function subtestStats(progress, subtest) {
  const window = windowFor(progress, subtest)
  const answered = window.filter((e) => e.kind !== 'skipped')
  const wrong = answered.filter((e) => !e.correct)

  return {
    level: progress.levels[subtest],
    attempts: answered.length,
    accuracy: answered.length ? answered.filter((e) => e.correct).length / answered.length : null,
    // Of the ones he got wrong, how many were rushed rather than genuinely hard.
    carelessShare: wrong.length ? wrong.filter((e) => e.kind === 'careless').length / wrong.length : null,
    onPaceShare: answered.length
      ? answered.filter((e) => e.seconds <= e.targetSeconds).length / answered.length
      : null,
  }
}

// Level moves only on a full window, and moving UP also needs him to be on pace.
// Getting them right slowly means the level is not yet comfortable, and the test
// he is preparing for is timed.
export function levelFor(progress, subtest) {
  const stats = subtestStats(progress, subtest)
  const current = stats.level
  if (stats.attempts < WINDOW) return current

  if (stats.accuracy >= LEVEL_UP_ACCURACY && stats.onPaceShare >= 0.6) return clampLevel(current + 1)

  // Demote only when the misses are genuinely hard ones. If most of them were
  // careless -- answered fast and wrong -- the level is not the problem and
  // dropping it rewards rushing with easier work. Hold the level and let the
  // coaching layer deal with the rushing, which is what it is for.
  const mostlyCareless = stats.carelessShare !== null && stats.carelessShare >= 0.5
  if (stats.accuracy < LEVEL_DOWN_ACCURACY && !mostlyCareless) return clampLevel(current - 1)

  return current
}

// Applied once at the end of a bite rather than mid-bite, so difficulty never
// shifts under him while he is working.
export function settleBite(progress) {
  const levels = { ...progress.levels }
  const history = { ...progress.history }

  for (const subtest of Object.keys(progress.levels)) {
    const next = levelFor(progress, subtest)
    if (next !== levels[subtest]) {
      levels[subtest] = next
      // The window is about the level he is on now, so it starts fresh.
      history[subtest] = []
    }
  }

  return { ...progress, levels, history, bites: progress.bites + 1 }
}

// What the parent view and the end-of-bite summary read.
export function overview(progress) {
  const subtests = Object.keys(SUBTESTS).map((subtest) => ({ subtest, ...subtestStats(progress, subtest) }))
  const levels = subtests.map((s) => s.level)
  return {
    subtests,
    averageLevel: levels.reduce((a, b) => a + b, 0) / levels.length,
    strongest: [...subtests].sort((a, b) => b.level - a.level)[0],
    weakest: [...subtests].sort((a, b) => a.level - b.level)[0],
    atCeiling: levels.every((l) => l === MAX_LEVEL),
    atFloor: levels.every((l) => l === MIN_LEVEL),
  }
}
