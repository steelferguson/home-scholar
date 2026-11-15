import { figure, visualKey, sameFigure, chooseRules, applyRules, ruleCount, SHAPES, SHADINGS, SIZES, RULE_GROUP } from '../figures.js'
import { buildItem } from '../item.js'
import { MASTERY_FROM } from '../levels.js'

// A 2x2 matrix:  A -> B  as  C -> ?
//
// The rules that turn A into B must turn C into the answer.

// Shared with chooseRules, so the row difference reserves the same groups the
// rules do -- including `scale`, which covers count AND size together.
const ATTRIBUTE_OF = RULE_GROUP

// The row difference is chosen per group, not per attribute.
const GROUP_OF = { shape: 'shape', count: 'scale', shading: 'shading', size: 'scale' }

const VARIATIONS = {
  shape: (rng, f) => ({ ...f, shape: rng.pick(SHAPES.filter((s) => s !== f.shape)) }),
  shading: (rng, f) => ({ ...f, shading: rng.pick(SHADINGS.filter((s) => s !== f.shading)) }),
  count: (rng, f) => ({ ...f, count: rng.pick([1, 2, 3, 4].filter((c) => c !== f.count)) }),
  size: (rng, f) => ({ ...f, size: rng.pick(SIZES.filter((s) => s !== f.size)) }),
}

// Start small and empty so growth rules have somewhere to go.
const baseFigure = (rng) => figure({
  shape: rng.pick(SHAPES),
  count: rng.int(1, 2),
  shading: rng.pick(['none', 'half']),
  size: rng.pick([0.6, 0.8]),
  rotation: rng.pick([0, 90, 180, 270]),
})

function build2x2({ level, seed, rng }) {
  const n = ruleCount(level)

  return rng.attempt(
    () => {
      const a = baseFigure(rng)

      // Rules first, then C. An earlier version probed for rules, chose C's
      // varied attribute against the probe, then re-chose the rules -- which
      // silently landed on a different set a third of the time, so the
      // "attribute no rule touches" guarantee below was not actually held.
      const rules = chooseRules(rng, level, [a], n)
      if (rules.length < n) return null

      // C is A with ONE attribute changed that no rule touches. If a rule and
      // the row difference wrote the same attribute the item would have two
      // defensible readings, which is how a bright kid gets told they are wrong
      // for reasoning correctly.
      const claimed = new Set(rules.map((r) => ATTRIBUTE_OF[r.name]))
      const free = Object.keys(VARIATIONS).filter((attr) => !claimed.has(GROUP_OF[attr]))
      if (!free.length) return null
      const c = VARIATIONS[rng.pick(free)](rng, a)

      // A rule that fits A may not fit C once C differs; re-roll rather than
      // ship a rule that wraps on the bottom row only.
      if (!rules.every((r) => r.fits(c))) return null

      const b = applyRules(a, rules)
      const correct = applyRules(c, rules)
      if (sameFigure(a, b) || sameFigure(c, correct) || sameFigure(correct, b)) return null

      const distractors = [
        c,                                    // did nothing: the stem copied straight down
        ...rules.map((r) => applyRules(c, rules.filter((x) => x !== r))), // caught all but one rule
        applyRules(correct, rules),           // applied the rules one time too many
        b,                                    // grabbed the answer already on screen
        ...(rules[0] ? [applyRules(c, [rules[0]])] : []),
      ].filter((f) => !sameFigure(f, correct))

      return buildItem({
        subtest: 'figure_matrices', level, seed, rng,
        prompt: { kind: 'matrix', columns: 2, cells: [a, b, c, null] },
        correct: { kind: 'figure', figure: correct },
        distractors: rng.shuffle(distractors).map((f) => ({ kind: 'figure', figure: f })),
        explain: `Going across, ${rules.map((r) => r.describe).join(', and ')}. Do the same to the bottom-left shape.`,
        key: (c2) => visualKey(c2.figure),
      })
    },
    (it) => it !== null,
  )
}

// From the mastery band the matrix becomes 3x3 and the rule applies TWICE across
// each row: A -> B -> C. Spotting a transformation is one thing; carrying it
// through a second step, on a third row you have not seen worked, is the step up
// that makes levels past 12 mean something.
//
// Fewer rules fire than in a 2x2 at the same level -- applying two rules twice
// is already harder than applying four rules once, and four compounding
// transformations produce a figure nobody could check.
const rulesFor3x3 = (level) => (level >= 15 ? 3 : 2)

function build3x3({ level, seed, rng }) {
  const n = rulesFor3x3(level)

  return rng.attempt(
    () => {
      const a = baseFigure(rng)

      // Rules first, then the rows. Choosing rules, deriving the row difference
      // from a probe, and then re-choosing the rules is how the 2x2 path used to
      // break its own guarantee a third of the time; do not reintroduce it here.
      const rules = chooseRules(rng, level, [a], n)
      if (rules.length < n) return null

      // Three row starts, differing on one attribute no rule touches.
      const claimed = new Set(rules.map((r) => ATTRIBUTE_OF[r.name]))
      const free = Object.keys(VARIATIONS).filter((attr) => !claimed.has(GROUP_OF[attr]))
      if (!free.length) return null

      const attr = rng.pick(free)
      const rowStarts = [a]
      for (let i = 0; i < 30 && rowStarts.length < 3; i++) {
        const candidate = VARIATIONS[attr](rng, a)
        if (!rowStarts.some((f) => f[attr] === candidate[attr])) rowStarts.push(candidate)
      }
      if (rowStarts.length < 3) return null

      // Every rule must survive BOTH steps on every row, or a row wraps halfway
      // across and the pattern stops being true where it is applied twice.
      if (!rules.every((r) => rowStarts.every((f) => r.fits(f)))) return null
      const midpoints = rowStarts.map((f) => applyRules(f, rules))
      if (!rules.every((r) => midpoints.every((m) => r.fits(m)))) return null

      const rows = rowStarts.map((start, i) => [start, midpoints[i], applyRules(midpoints[i], rules)])
      const correct = rows[2][2]

      const flat = rows.flat()
      if (flat.some((f, i) => flat.findIndex((g) => sameFigure(f, g)) !== i)) return null

      const distractors = [
        rows[2][1],                              // stopped after one step
        rows[2][0],                              // never transformed the row at all
        applyRules(correct, rules),              // carried it one step too far
        rows[1][2],                              // finished the row above instead
        rows[0][2],
      ].filter((f) => !sameFigure(f, correct))

      return buildItem({
        subtest: 'figure_matrices', level, seed, rng,
        prompt: { kind: 'matrix', columns: 3, cells: [...rows[0], ...rows[1], rows[2][0], rows[2][1], null] },
        correct: { kind: 'figure', figure: correct },
        distractors: rng.shuffle(distractors).map((f) => ({ kind: 'figure', figure: f })),
        explain: `Going across each row, ${rules.map((r) => r.describe).join(', and ')} — twice over, once for each step.`,
        key: (c) => visualKey(c.figure),
      })
    },
    (it) => it !== null,
  )
}

export function generateFigureMatrices(args) {
  return args.level >= MASTERY_FROM ? build3x3(args) : build2x2(args)
}
