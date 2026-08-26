import { makeRng, hashString } from './rng.js'
import { SUBTESTS } from './item.js'
import { clampLevel } from './levels.js'
import { generateNumberSeries } from './generators/numberSeries.js'
import { generateVerbalAnalogies } from './generators/verbalAnalogies.js'
import { generateFigureMatrices } from './generators/figureMatrices.js'

export const GENERATORS = {
  number_series: generateNumberSeries,
  verbal_analogies: generateVerbalAnalogies,
  figure_matrices: generateFigureMatrices,
}

export const IMPLEMENTED = Object.keys(GENERATORS)

// The only entry point. An item is a pure function of (subtest, level, seed),
// so `id` alone is enough to rebuild it -- which is what lets a bite be replayed
// and a wrong answer be revisited without storing the item itself.
export function generateItem(subtest, level, seed) {
  const generate = GENERATORS[subtest]
  if (!generate) throw new Error(`No generator for subtest "${subtest}"`)
  const lvl = clampLevel(level)

  // A generator re-rolls internally when it builds a degenerate item, but it can
  // still come back empty. Retry on deterministically derived seeds, then fail
  // loudly: a null item here would surface as a crash mid-lesson, which is the
  // worst possible place to discover it.
  for (let salt = 0; salt < 5; salt++) {
    const rng = makeRng(hashString(`${subtest}:${lvl}:${seed}:${salt}`))
    const item = generate({ level: lvl, seed, rng })
    if (item) return item
  }
  throw new Error(`Generator "${subtest}" could not build an item at level ${lvl} (seed ${seed})`)
}

export { SUBTESTS }
