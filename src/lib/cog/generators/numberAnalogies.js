import { band, unlocked } from '../levels.js'
import { buildItem, text } from '../item.js'

// [4 -> 7]  [5 -> 8]  [9 -> ?]
//
// Two worked pairs establish a rule; the third applies it. Unlike a series this
// gives the rule away twice, so the difficulty is in spotting WHICH rule fits
// both pairs -- which is why the distractors are all rules that fit one pair.

const RULES = [
  { name: 'add',      from: 1,  make: (rng, b) => { const k = rng.int(2, 4 + Math.round(b.progress * 6)); return { f: (n) => n + k, explain: `add ${k}`, near: k } } },
  { name: 'subtract', from: 3,  make: (rng, b) => { const k = rng.int(2, 4 + Math.round(b.progress * 5)); return { f: (n) => n - k, explain: `take away ${k}`, near: k, floor: k + 1 } } },
  { name: 'double',   from: 4,  make: () => ({ f: (n) => n * 2, explain: 'double it', near: 2 }) },
  { name: 'multiply', from: 6,  make: (rng) => { const k = rng.int(3, 4); return { f: (n) => n * k, explain: `multiply by ${k}`, near: k } } },
  { name: 'halve',    from: 7,  make: () => ({ f: (n) => n / 2, explain: 'halve it', near: 2, even: true, floor: 2 }) },
  { name: 'mul_add',  from: 8,  make: (rng) => { const k = rng.int(2, 3), c = rng.int(1, 6); return { f: (n) => n * k + c, explain: `multiply by ${k} then add ${c}`, near: c } } },
  { name: 'square',   from: 10, make: () => ({ f: (n) => n * n, explain: 'multiply it by itself', near: 2, ceiling: 12 }) },
  { name: 'mul_sub',  from: 11, make: (rng) => { const k = rng.int(2, 3), c = rng.int(1, 5); return { f: (n) => n * k - c, explain: `multiply by ${k} then take away ${c}`, near: c } } },
]

const magnitudeCap = (level) => (level <= 4 ? 60 : level <= 8 ? 200 : 500)

export function generateNumberAnalogies({ level, seed, rng }) {
  const b = band(level)
  const pool = unlocked(RULES, level)
  const cap = magnitudeCap(level)

  return rng.attempt(
    () => {
      // Bias towards the rules this level has only just unlocked, keeping the
      // older ones in rotation so earlier patterns stay warm.
      const recent = pool.slice(-3)
      const rule = (rng.next() < 0.65 ? rng.pick(recent) : rng.pick(pool)).make(rng, b)
      const lo = rule.floor || 1
      const hi = Math.min(rule.ceiling || 20, cap)

      const stems = rng.sample(
        Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter((n) => !rule.even || n % 2 === 0),
        3,
      )
      if (stems.length < 3) return null

      const pairs = stems.map((n) => [n, rule.f(n)])
      const [, , [x3, correct]] = pairs
      if (pairs.some(([, out]) => !Number.isInteger(out) || out < 0 || Math.abs(out) > cap)) return null
      if (new Set(pairs.flat()).size < 6) return null

      const distractors = [
        x3 + (pairs[0][1] - pairs[0][0]),  // reused the first pair's DIFFERENCE rather than its rule
        correct + rule.near,
        correct - rule.near,
        pairs[1][1],                        // repeated the previous answer
        correct + 1,
      ].filter((n) => Number.isFinite(n) && n >= 0 && n !== correct)

      return buildItem({
        subtest: 'number_analogies', level, seed, rng,
        prompt: { kind: 'number_analogy', pairs: [pairs[0], pairs[1], [x3, null]] },
        correct: text(correct),
        distractors: rng.shuffle(distractors).map(text),
        explain: `In each pair you ${rule.explain}. So ${x3} becomes ${correct}.`,
        key: (c) => c.text,
      })
    },
    (it) => it !== null,
  )
}
