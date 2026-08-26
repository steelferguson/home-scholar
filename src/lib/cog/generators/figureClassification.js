import { figure, visualKey, sameFigure, SHAPES, SHADINGS, SIZES } from '../figures.js'
import { buildItem } from '../item.js'

// Three figures that belong together; pick the fourth that joins them.
//
// Exactly one attribute is shared by all three (the invariant). Everything else
// varies, so nothing but the invariant can be the reason they group. The
// distractors break the invariant while matching the stems on something else --
// which is the trap for a kid who spots "they all have three" without checking
// whether three is really the point.

const ATTRIBUTES = ['shape', 'count', 'shading', 'size']

const VALUES = {
  shape: SHAPES,
  count: [1, 2, 3, 4],
  shading: SHADINGS,
  size: SIZES,
}

// How many attributes the three stems are allowed to differ on. More noise
// around the invariant is what makes a higher level harder.
const noiseFor = (level) => (level <= 4 ? 1 : level <= 8 ? 2 : 3)

// `size` is the subtlest invariant to notice, so it is held back.
const invariantsFor = (level) => (level <= 6 ? ['shape', 'count', 'shading'] : ATTRIBUTES)

export function generateFigureClassification({ level, seed, rng }) {
  const noise = noiseFor(level)

  return rng.attempt(
    () => {
      const invariant = rng.pick(invariantsFor(level))
      const shared = rng.pick(VALUES[invariant])
      const varying = rng.sample(ATTRIBUTES.filter((x) => x !== invariant), noise)

      const build = () => {
        const spec = { shape: 'circle', count: 1, shading: 'none', size: 0.8, rotation: 0, flipped: false }
        spec[invariant] = shared
        for (const attr of varying) spec[attr] = rng.pick(VALUES[attr].filter((v) => v !== shared))
        return figure(spec)
      }

      const stems = []
      for (let i = 0; i < 40 && stems.length < 3; i++) {
        const f = build()
        if (!stems.some((s) => sameFigure(s, f))) stems.push(f)
      }
      if (stems.length < 3) return null

      const correct = rng.attempt(build, (f) => !stems.some((s) => sameFigure(s, f)))
      if (!correct || stems.some((s) => sameFigure(s, correct))) return null

      // The stems may share MORE than the intended invariant by chance -- three
      // figures picked to share a shape can all happen to have two copies. A kid
      // reasoning "they all have two" is reasoning validly, so the answer has to
      // match the stems on every attribute they actually share, not just the one
      // this generator had in mind. Before this check, 6.8% of items had a wrong
      // choice that matched an accidental invariant the right answer missed.
      const sharedAttrs = ATTRIBUTES.filter((attr) => stems.every((f) => f[attr] === stems[0][attr]))
      if (!sharedAttrs.every((attr) => correct[attr] === stems[0][attr])) return null

      // Size can only be reasoned about while the count is held still: the
      // renderer draws each copy smaller when there are more of them, so a large
      // shape shown four times is drawn smaller than a small shape shown once.
      // "They are all the same size" is then not something the eye can check.
      const countVaries = stems.some((f) => f.count !== stems[0].count)
      if (countVaries && sharedAttrs.includes('size')) return null

      // A distractor is any figure that breaks the invariant. Building it from a
      // stem keeps everything else familiar, so only the invariant separates it.
      const distractors = []
      for (let i = 0; i < 40 && distractors.length < 5; i++) {
        const base = rng.pick([...stems, correct])
        const other = rng.pick(VALUES[invariant].filter((v) => v !== shared))
        const f = figure({ ...base, [invariant]: other })
        if (f[invariant] !== shared && !distractors.some((d) => sameFigure(d, f))) distractors.push(f)
      }
      if (distractors.length < 3) return null

      // The stems may share several attributes, but only the ones some wrong
      // answer breaks are doing any work. Naming all of them buries the point;
      // this explanation has to teach him what to look at next time.
      const kept = distractors.slice(0, 3)
      const deciding = sharedAttrs.filter((attr) => kept.some((d) => d[attr] !== stems[0][attr]))
      const name = (attr) => (attr === 'count' ? 'number of shapes' : attr)
      const decidingNames = (deciding.length ? deciding : sharedAttrs).map(name)

      return buildItem({
        subtest: 'figure_classification', level, seed, rng,
        prompt: { kind: 'figure_group', figures: stems },
        correct: { kind: 'figure', figure: correct },
        distractors: kept.map((f) => ({ kind: 'figure', figure: f })),
        explain: `All three have the same ${decidingNames.join(' and the same ')}. Only one of the answers does too.`,
        key: (c) => visualKey(c.figure),
      })
    },
    (it) => it !== null,
  )
}
