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
  return generate({ level: lvl, seed, rng: makeRng(hashString(`${subtest}:${lvl}:${seed}`)) })
}

export { SUBTESTS }
