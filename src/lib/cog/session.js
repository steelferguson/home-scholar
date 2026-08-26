import { makeRng, hashString } from './rng.js'
import { generateItem, IMPLEMENTED } from './index.js'
import { SUBTESTS } from './item.js'
import { clampLevel } from './levels.js'

// A BITE is the unit of everything: seven items, about four minutes, coins at
// the end. Sessions are built from bites so stopping is always clean and
// "one more?" is always cheap -- which is the shape a 10-15 minute habit needs
// if it has to survive four times a week for a year.

export const BITE_SIZE = 7

// Difficulty ramps up through the bite and then comes back down. The last item
// is deliberately below his level: a bite should not end on a failure, because
// how it ended is what he carries to the next one.
const RAMP = [-1, -1, 0, 0, 1, 1, -1]

const BATTERIES = ['verbal', 'quantitative', 'nonverbal']

// Least-recently-used rotation, so every format keeps coming back. Formats he
// has never met are surfaced first: unfamiliarity is one of the four things
// this course exists to fix, and it is fixed purely by exposure.
function chooseSubtests(progress, rng, count) {
  // Bites since this subtest last came up. Never seen sorts first, always.
  const staleness = (subtest) => {
    const history = progress.history[subtest]
    if (!progress.seen[subtest] || !history.length) return Infinity
    return progress.bites - history[history.length - 1].bite
  }

  // Shuffle first so equal staleness breaks randomly rather than by array order.
  const stalestFirst = (list) => rng.shuffle(list).sort((a, b) => staleness(b) - staleness(a))

  const pool = IMPLEMENTED.filter((subtest) => SUBTESTS[subtest])
  const chosen = []

  // Two from each battery, so a bite is never all one kind of thinking.
  for (const battery of BATTERIES) {
    const inBattery = pool.filter((subtest) => SUBTESTS[subtest].battery === battery)
    chosen.push(...stalestFirst(inBattery).slice(0, 2))
  }

  // Remaining slots go to whatever has waited longest overall.
  for (const subtest of stalestFirst(pool.filter((s) => !chosen.includes(s)))) {
    if (chosen.length >= count) break
    chosen.push(subtest)
  }

  return rng.shuffle(chosen.slice(0, count))
}

// Seeds are drawn until one produces an item he has not met recently. Level 1 of
// some subtests is small enough that repeats are otherwise inevitable.
function freshItem(subtest, level, rng, recent) {
  for (let tries = 0; tries < 30; tries++) {
    const item = generateItem(subtest, level, rng.int(0, 100000))
    if (!recent.includes(item.id)) return item
  }
  return generateItem(subtest, level, rng.int(0, 100000))
}

export function buildBite(progress, seed = 0) {
  const rng = makeRng(hashString(`bite:${progress.bites}:${seed}`))
  const subtests = chooseSubtests(progress, rng, BITE_SIZE)

  return subtests.map((subtest, i) => {
    const level = clampLevel(progress.levels[subtest] + RAMP[i % RAMP.length])
    const item = freshItem(subtest, level, rng, progress.recent[subtest])
    return {
      ...item,
      // The first time a format ever appears he gets shown how it works before
      // being asked to do it. Being handed an unfamiliar format cold is the
      // thing that rattles him.
      isFirstEncounter: !progress.seen[subtest],
    }
  })
}

// ---------------------------------------------------------------------------
// Running a bite.
//
// Flagging is a real answer, not a giveaway: a flagged item goes to the back of
// the queue and comes round again before the bite ends. That is the habit a
// timed test rewards, and he cannot learn it if skipping means losing the item.

export function startBite(items) {
  return {
    items,
    queue: items.map((_, i) => i),
    position: 0,
    answers: items.map(() => null),
    flagged: new Set(),
    startedAt: null,
  }
}

export const currentItem = (state) =>
  state.position < state.queue.length ? state.items[state.queue[state.position]] : null

export const isComplete = (state) => state.position >= state.queue.length

export function answerCurrent(state, choiceIndex, seconds) {
  const index = state.queue[state.position]
  const item = state.items[index]
  const answers = [...state.answers]
  answers[index] = {
    choiceIndex,
    seconds,
    correct: choiceIndex === item.answer,
    wasFlagged: state.flagged.has(index),
  }
  return { ...state, answers, position: state.position + 1 }
}

export function flagCurrent(state) {
  const index = state.queue[state.position]
  // Already come round once: it has to be answered now, or the bite never ends.
  if (state.flagged.has(index)) return state

  const flagged = new Set(state.flagged)
  flagged.add(index)
  const queue = [...state.queue]
  queue.splice(state.position, 1)
  queue.push(index)
  return { ...state, queue, flagged }
}

// Turned into attempts for progress.recordAttempt, then a summary for the
// end-of-bite screen.
export function biteResult(state) {
  const attempts = state.items.map((item, index) => {
    const answer = state.answers[index]
    return {
      subtest: item.subtest,
      itemId: item.id,
      level: item.level,
      correct: answer ? answer.correct : false,
      seconds: answer ? answer.seconds : 0,
      targetSeconds: item.targetSeconds,
      skipped: !answer,
      wasFlagged: answer ? answer.wasFlagged : true,
    }
  })

  const answered = attempts.filter((a) => !a.skipped)
  const correct = answered.filter((a) => a.correct)
  const wrong = answered.filter((a) => !a.correct)
  const rushed = wrong.filter((a) => a.seconds < a.targetSeconds * 0.35)

  return {
    attempts,
    correct: correct.length,
    total: attempts.length,
    seconds: answered.reduce((sum, a) => sum + a.seconds, 0),
    // Kept apart on purpose. "You got three wrong" is not useful; "two of those
    // three you answered in four seconds" is something he can act on.
    carelessMisses: rushed.length,
    hardMisses: wrong.length - rushed.length,
    flaggedAndRecovered: attempts.filter((a) => a.wasFlagged && a.correct).length,
  }
}
