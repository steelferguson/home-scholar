import { figure, visualKey, sameFigure, chooseRules, applyRules, ruleCount, SHAPES, SHADINGS, SIZES, RULES } from '../figures.js'
import { buildItem } from '../item.js'

// A 2x2 matrix:  A -> B  as  C -> ?
//
// The rules that turn A into B must turn C into the answer.

const ATTRIBUTE_OF = {
  count_up: 'count', count_down: 'count', count_double: 'count',
  shade_step: 'shading', shade_back: 'shading',
  rotate_90: 'rotation', rotate_45: 'rotation',
  size_up: 'size', shape_next: 'shape', flip: 'flipped',
}

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

export function generateFigureMatrices({ level, seed, rng }) {
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
      const free = Object.keys(VARIATIONS).filter((attr) => !claimed.has(attr))
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
        prompt: { kind: 'matrix', cells: [a, b, c, null] },
        correct: { kind: 'figure', figure: correct },
        distractors: rng.shuffle(distractors).map((f) => ({ kind: 'figure', figure: f })),
        explain: `Going across, ${rules.map((r) => r.describe).join(', and ')}. Do the same to the bottom-left shape.`,
        key: (c2) => visualKey(c2.figure),
      })
    },
    (it) => it !== null,
  )
}
