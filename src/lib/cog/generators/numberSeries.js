import { band, unlocked } from '../levels.js'
import { buildItem, text } from '../item.js'

// A rule builds the whole series from a seed value, and reports the two deltas
// the eye is meant to catch. Distractors are then built from *plausible wrong
// readings* of that rule, never from random numbers -- a random distractor is
// free marks for a guesser and teaches nothing.

const SHOWN = 5 // terms displayed; the answer is the 6th

const series = (start, step) => {
  const terms = [start]
  for (let i = 1; i <= SHOWN; i++) terms.push(step(terms[i - 1], i))
  return terms
}

const RULES = [
  {
    name: 'add', from: 1,
    make: (rng, b) => {
      // Ranges are deliberately wide even at level 1. The early levels have only
      // one rule available, so if the parameters are narrow too the whole item
      // space collapses and he sees the same series again within one sitting.
      const k = rng.int(2, 5 + Math.round(b.progress * 7))
      const terms = series(rng.int(1, 30), (prev) => prev + k)
      return { terms, explain: `Each number goes up by ${k}.`, near: k }
    },
  },
  {
    name: 'subtract', from: 3,
    make: (rng, b) => {
      const k = rng.int(2, 5 + Math.round(b.progress * 6))
      const start = k * SHOWN + rng.int(2, 30)
      const terms = series(start, (prev) => prev - k)
      return { terms, explain: `Each number goes down by ${k}.`, near: k }
    },
  },
  {
    name: 'alternating', from: 4,
    make: (rng) => {
      const a = rng.int(2, 6), c = rng.int(2, 9)
      if (a === c) return null
      const terms = series(rng.int(1, 10), (prev, i) => prev + (i % 2 === 1 ? a : c))
      return { terms, explain: `The jumps alternate: +${a}, then +${c}, then +${a} again.`, near: Math.abs(a - c) || 2 }
    },
  },
  {
    name: 'multiply', from: 5,
    make: (rng, b) => {
      const k = rng.int(2, b.index >= 2 ? 4 : 3)
      const terms = series(rng.int(1, 4), (prev) => prev * k)
      return { terms, explain: `Each number is the one before it times ${k}.`, near: k }
    },
  },
  {
    name: 'growing', from: 6,
    make: (rng, b) => {
      const first = rng.int(1, 4), grow = rng.int(1, 1 + Math.round(b.progress * 2))
      const terms = series(rng.int(1, 9), (prev, i) => prev + first + (i - 1) * grow)
      return { terms, explain: `The jump gets bigger each time, growing by ${grow} every step.`, near: grow }
    },
  },
  {
    name: 'multiply_add', from: 7,
    make: (rng) => {
      const k = rng.int(2, 3), c = rng.int(1, 5)
      const terms = series(rng.int(1, 5), (prev) => prev * k + c)
      return { terms, explain: `Times ${k}, then add ${c}, every step.`, near: c }
    },
  },
  {
    name: 'interleaved', from: 8,
    make: (rng) => {
      const a0 = rng.int(1, 9), b0 = rng.int(10, 30)
      const da = rng.int(2, 6), db = -rng.int(2, 5)
      const terms = []
      for (let i = 0; i <= SHOWN; i++) {
        terms.push(i % 2 === 0 ? a0 + (i / 2) * da : b0 + ((i - 1) / 2) * db)
      }
      return { terms, explain: `Two series are woven together: the 1st, 3rd, 5th numbers go up by ${da}; the 2nd, 4th, 6th go down by ${-db}.`, near: da }
    },
  },
  {
    name: 'fibonacci', from: 9,
    make: (rng) => {
      const terms = [rng.int(1, 6), rng.int(2, 9)]
      for (let i = 2; i <= SHOWN; i++) terms.push(terms[i - 1] + terms[i - 2])
      return { terms, explain: `Each number is the two before it added together.`, near: terms[1] }
    },
  },
  {
    name: 'squares', from: 10,
    make: (rng) => {
      const c = rng.int(-3, 5), start = rng.int(1, 3)
      const terms = []
      for (let i = 0; i <= SHOWN; i++) { const n = start + i; terms.push(n * n + c) }
      return { terms, explain: `These are the square numbers${c ? ` with ${c > 0 ? `${c} added` : `${-c} taken away`}` : ''}: ${start}x${start}, ${start + 1}x${start + 1}, and so on.`, near: 2 }
    },
  },
  {
    name: 'multiply_subtract', from: 11,
    make: (rng) => {
      const k = rng.int(2, 3), c = rng.int(1, 6)
      const terms = series(rng.int(3, 8), (prev) => prev * k - c)
      return { terms, explain: `Times ${k}, then take away ${c}, every step.`, near: c }
    },
  },
  {
    name: 'doubling_jump', from: 13,
    make: (rng) => {
      const d = rng.int(1, 3)
      let step = d
      const terms = series(rng.int(1, 8), (prev) => { const out = prev + step; step *= 2; return out })
      return { terms, explain: `The jump doubles every time: +${d}, +${d * 2}, +${d * 4}, and so on.`, near: d }
    },
  },
  {
    name: 'alternating_ops', from: 14,
    make: (rng) => {
      const k = rng.int(2, 3), c = rng.int(2, 7)
      const terms = series(rng.int(1, 6), (prev, i) => (i % 2 === 1 ? prev * k : prev + c))
      return { terms, explain: `The steps alternate: times ${k}, then add ${c}, then times ${k} again.`, near: c }
    },
  },
  {
    name: 'fib_plus', from: 15,
    make: (rng) => {
      const c = rng.int(1, 4)
      const terms = [rng.int(1, 5), rng.int(2, 7)]
      for (let i = 2; i <= SHOWN; i++) terms.push(terms[i - 1] + terms[i - 2] + c)
      return { terms, explain: `Add the two numbers before it, then add ${c} more.`, near: c }
    },
  },
]

// Hard levels must mean harder *patterns*, not bigger multiplication. A series
// whose numbers run away is testing arithmetic stamina, which is not what CogAT
// measures and not what we are training.
const magnitudeCap = (level) => (level <= 4 ? 100 : level <= 8 ? 300 : 1000)

export function generateNumberSeries({ level, seed, rng }) {
  const b = band(level)
  const cap = magnitudeCap(level)
  const pool = unlocked(RULES, level)
  // Bias towards the newest rules the level has unlocked, but keep older ones in
  // rotation so earlier patterns stay warm.
  const recent = pool.slice(-3)
  const item = rng.attempt(
    () => {
      const rule = rng.next() < 0.65 ? rng.pick(recent) : rng.pick(pool)
      const made = rule.make(rng, b)
      if (!made) return null

      const shown = made.terms.slice(0, SHOWN)
      const correct = made.terms[SHOWN]
      const last = shown[SHOWN - 1]
      const lastDelta = last - shown[SHOWN - 2]

      const distractors = [
        last + lastDelta,        // repeated the previous jump instead of the rule's next one
        correct + made.near,     // right idea, arithmetic slipped
        correct - made.near,
        last,                    // stalled: just repeated the last term
        correct + 1,
        correct - 1,
      ].filter((n) => Number.isFinite(n) && n !== correct)

      return buildItem({
        subtest: 'number_series', level, seed, rng,
        prompt: { kind: 'series', terms: shown },
        correct: text(correct),
        distractors: rng.shuffle(distractors).map(text),
        explain: `${made.explain} After ${last} comes ${correct}.`,
        key: (c) => c.text,
      })
    },
    (it) => it !== null && it.choices.every((c) => Math.abs(Number(c.text)) <= cap),
  )
  return item
}
