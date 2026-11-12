// Levels 1-16 span roughly "start of grade 3" to well past the test being
// prepared for. Level 1-4 ~ age 8, 5-8 ~ age 10, 9-12 ~ age 12+, and 13-16 is
// headroom for a kid who keeps climbing. Roughly a level a month.
//
// The mastery band is real content, not a faster clock: 3x3 figure matrices,
// simultaneous equations, second-difference series, three-fold paper and a
// harder vocabulary tier all unlock at 13. A quicker version of the same item
// is not a harder item, and pretending otherwise would stall him on a plateau
// while the number went up.

export const MIN_LEVEL = 1
export const MAX_LEVEL = 16
export const MASTERY_FROM = 13

export const clampLevel = (level) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)))

// Which band a level sits in. Generators use this to choose a rule family;
// `progress` positions the level inside its band (0 at the bottom, 1 at the top)
// so difficulty still climbs between band changes.
export function band(level) {
  const l = clampLevel(level)
  if (l <= 4) return { name: 'foundation', index: 0, progress: (l - 1) / 3 }
  if (l <= 8) return { name: 'stretch', index: 1, progress: (l - 5) / 3 }
  if (l <= 12) return { name: 'advanced', index: 2, progress: (l - 9) / 3 }
  return { name: 'mastery', index: 3, progress: (l - 13) / 3 }
}

// Pace target for one item, in seconds. Generous at level 1 (nothing is
// familiar yet), tightening to real test pace by level 12. Subtests that are
// inherently slower scale this with their own multiplier.
// Pace tightens to real test pace by level 12 and then stops. Past that the
// items get harder, not the clock faster -- squeezing the clock further would
// measure typing speed rather than reasoning, and CogAT itself is not that tight.
export const PACE_FLOOR = 16

export function targetSeconds(level, multiplier = 1) {
  const l = clampLevel(level)
  const base = Math.max(PACE_FLOOR, 30 - (l - 1) * (12 / 11)) // 30s at L1 -> 18s at L12 -> floor
  return Math.round(base * multiplier)
}

// Answered this fast AND wrong = careless, not "too hard". The distinction is
// the whole point of the coaching layer, so it lives here, not in the UI.
export const CARELESS_FRACTION = 0.35
export const carelessThresholdSeconds = (target) => target * CARELESS_FRACTION

// Unlock a rule once the level reaches its `from`. Generators declare rules with
// a `from` level and pull the unlocked set.
export const unlocked = (rules, level) => rules.filter((r) => clampLevel(level) >= r.from)
