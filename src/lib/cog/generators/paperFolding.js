import { buildItem } from '../item.js'

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
const GRID = 6
const MIRROR = GRID - 1

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

// Reflect punches back out across whichever fold lines were made.
function unfold(punches, folds) {
  let holes = punches
  if (folds.includes('vertical')) holes = [...holes, ...holes.map(([r, c]) => [r, MIRROR - c])]
  if (folds.includes('horizontal')) holes = [...holes, ...holes.map(([r, c]) => [MIRROR - r, c])]
  return dedupe(holes)
}

// Punches must sit in the part of the paper still showing after folding.
const punchArea = (folds) => {
  const all = Array.from({ length: GRID }, (_, i) => i)
  const half = all.slice(0, GRID / 2)
  const rows = folds.includes('horizontal') ? half : all
  const cols = folds.includes('vertical') ? half : all
  return rows.flatMap((r) => cols.map((c) => [r, c]))
}

function planFor(level, rng) {
  if (level <= 4) return { folds: [rng.pick(['vertical', 'horizontal'])], punches: rng.int(1, 2) }
  if (level <= 8) return { folds: [rng.pick(['vertical', 'horizontal'])], punches: rng.int(2, 3) }
  // Two folds quadruple every punch, so the punch count comes back down --
  // three punches here would be twelve holes to compare across four options.
  return { folds: ['vertical', 'horizontal'], punches: level >= 11 ? rng.int(2, 3) : rng.int(1, 2) }
}

export function generatePaperFolding({ level, seed, rng }) {
  return rng.attempt(
    () => {
      const { folds, punches: punchCount } = planFor(level, rng)
      const area = punchArea(folds)
      if (area.length < punchCount) return null

      // Sorted, so the same set of punches is the same item however it was
      // drawn. Unsorted, two seeds produced identical-looking items that every
      // distinct-item count treated as two.
      const punches = rng.sample(area, punchCount).sort((x, y) => x[0] - y[0] || x[1] - y[1])
      const correct = unfold(punches, folds)

      const candidates = [
        punches,                                            // never unfolded it
        unfold(punches, [folds[0]]),                        // unfolded one fold, forgot the other
        unfold(punches, [folds.includes('vertical') ? 'horizontal' : 'vertical']), // mirrored the wrong way
        dedupe([...correct, ...rng.sample(area, 1)]),       // one hole too many
        correct.slice(0, Math.max(1, correct.length - 1)),  // one hole missing
        unfold(punches.map(([r, c]) => [r, Math.min(MIRROR, c + 1)]), folds), // punched a column over
      ]

      const distractors = candidates.filter((h) => h.length && key(h) !== key(correct))
      if (new Set(distractors.map(key)).size < 3) return null

      return buildItem({
        subtest: 'paper_folding', level, seed, rng,
        prompt: { kind: 'fold', grid: GRID, folds, punches },
        correct: { kind: 'holes', grid: GRID, holes: correct },
        distractors: distractors.map((holes) => ({ kind: 'holes', grid: GRID, holes })),
        explain: folds.length === 1
          ? `One fold, so every hole appears twice — once where it was punched and once mirrored across the fold.`
          : `Two folds, so each punch becomes four holes, mirrored across both fold lines.`,
        key: (c) => key(c.holes),
      })
    },
    (it) => it !== null,
  )
}
