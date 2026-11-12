import { buildItem } from '../item.js'
import { MASTERY_FROM } from '../levels.js'

// A square of paper is folded, holes are punched through it, and the question is
// what the paper looks like unfolded.
//
// The paper is a GRID x GRID lattice of hole positions. A fold reflects one half
// onto the other; unfolding mirrors every punch back across each fold line. So
// one fold doubles the holes, two folds quadruple them.
//
// The mistake this subtest is built to catch is forgetting to unfold at all --
// answering with just the punched holes. That is distractor one, every time.

// A 4x4 lattice looks fine until you fold it twice: the punch area shrinks to
// 2x2, which is FOUR possible items for the whole of levels 9 and 10. A 6x6
// lattice leaves a 3x3 area after two folds, and the item space stops
// collapsing exactly where the levels get hard.
// A 4x4 lattice looks fine until you fold it twice: the punch area shrinks to
// 2x2, which is FOUR possible items for the whole of levels 9 and 10. A 6x6
// lattice leaves a 3x3 area after two folds, and the mastery band moves to 8x8
// so a third fold still leaves room to punch.
const gridFor = (level) => (level >= MASTERY_FROM ? 8 : 6)

// Each fold is a reflection. Unfolding undoes them in reverse order, which
// matters once a diagonal is involved: a diagonal and a straight fold do not
// commute, so applying them in the wrong order gives a pattern that is wrong in
// a way that still looks plausible.
const MIRRORS = {
  vertical: (grid) => ([r, c]) => [r, grid - 1 - c],
  horizontal: (grid) => ([r, c]) => [grid - 1 - r, c],
  diagonal: () => ([r, c]) => [c, r],
}

// Above this the four options stop being comparable at a glance.
const HOLE_LIMIT = 16

const key = (holes) => holes.map(([r, c]) => `${r},${c}`).sort().join(' ')
const dedupe = (holes) => {
  const seen = new Set()
  return holes.filter(([r, c]) => {
    const k = `${r},${c}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function unfold(punches, folds, grid) {
  let holes = punches
  for (const fold of [...folds].reverse()) {
    const mirror = MIRRORS[fold](grid)
    holes = dedupe([...holes, ...holes.map(mirror)])
  }
  return holes
}

// The part of the paper still showing once every fold is made.
const punchArea = (folds, grid) => {
  let cells = Array.from({ length: grid }, (_, r) => Array.from({ length: grid }, (_, c) => [r, c])).flat()
  for (const fold of folds) {
    if (fold === 'vertical') cells = cells.filter(([, c]) => c < grid / 2)
    if (fold === 'horizontal') cells = cells.filter(([r]) => r < grid / 2)
    // The diagonal runs through whatever quadrant is left, so it is the same
    // r <= c test either way.
    if (fold === 'diagonal') cells = cells.filter(([r, c]) => r <= c)
  }
  return cells
}

function planFor(level, rng) {
  if (level <= 4) return { folds: [rng.pick(['vertical', 'horizontal'])], punches: rng.int(1, 2) }
  if (level <= 8) return { folds: [rng.pick(['vertical', 'horizontal'])], punches: rng.int(2, 3) }
  // Two folds quadruple every punch, so the punch count comes back down --
  // three punches here would be twelve holes to compare across four options.
  if (level <= 12) return { folds: ['vertical', 'horizontal'], punches: level >= 11 ? rng.int(2, 3) : rng.int(1, 2) }
  // Mastery: a diagonal fold is a new axis to reason about, and then all three
  // together give eight-fold symmetry.
  if (level <= 14) return { folds: ['diagonal'], punches: rng.int(2, 3) }
  return { folds: ['vertical', 'horizontal', 'diagonal'], punches: rng.int(1, 3) }
}

export function generatePaperFolding({ level, seed, rng }) {
  return rng.attempt(
    () => {
      const grid = gridFor(level)
      const { folds, punches: punchCount } = planFor(level, rng)
      const area = punchArea(folds, grid)
      if (area.length < punchCount) return null

      // Sorted, so the same set of punches is the same item however it was
      // drawn. Unsorted, two seeds produced identical-looking items that every
      // distinct-item count treated as two.
      const punches = rng.sample(area, punchCount).sort((x, y) => x[0] - y[0] || x[1] - y[1])
      const correct = unfold(punches, folds, grid)

      // Eight-fold symmetry turns three punches into up to twenty-four holes,
      // which is not an item any more -- it is four dense patterns to compare
      // dot by dot. Three punches are allowed only when they land on the fold
      // axes and collapse into something readable.
      if (correct.length > HOLE_LIMIT) return null

      const candidates = [
        punches,                                              // never unfolded it
        unfold(punches, folds.slice(-1), grid),               // undid the last fold only
        unfold(punches, folds.slice(0, -1), grid),            // forgot the last fold
        unfold(punches, [...folds].reverse(), grid),          // undid them in the wrong order
        dedupe([...correct, ...rng.sample(area, 1)]),         // one hole too many
        correct.slice(0, Math.max(1, correct.length - 1)),    // one hole missing
        unfold(punches.map(([r, c]) => [r, Math.min(grid - 1, c + 1)]), folds, grid), // punched a column over
      ]

      const distractors = candidates.filter((h) => h.length && key(h) !== key(correct))
      if (new Set(distractors.map(key)).size < 3) return null

      return buildItem({
        subtest: 'paper_folding', level, seed, rng,
        prompt: { kind: 'fold', grid, folds, punches },
        correct: { kind: 'holes', grid, holes: correct },
        distractors: distractors.map((holes) => ({ kind: 'holes', grid, holes })),
        explain: `${folds.length} fold${folds.length > 1 ? 's' : ''}, so each punch becomes ${2 ** folds.length} holes, mirrored back across ${folds.length > 1 ? 'every fold line in turn' : 'the fold line'}.`,
        key: (c) => key(c.holes),
      })
    },
    (it) => it !== null,
  )
}
