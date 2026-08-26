import { PAIRS, RELATIONS, PAIRS_BY_WORD, tiersFor } from '../wordbank.js'
import { buildItem, text } from '../item.js'

// "dog is to animal as rose is to ___"
//
// Two pairs sharing a relation. The whole difficulty of the item lives in the
// distractors, so they are built in a deliberate order of strength:
//
//   1. wrong relation, real association -- a word genuinely connected to the
//      stem, just not the way the example connects its pair. This is the trap
//      for a bright kid answering on gut association instead of relation.
//   2. right relation, wrong pair -- the correct *kind* of word, from someone
//      else's pair. Catches "I see the pattern" without checking the specifics.
//   3. the example's own answer echoed back. Catches pure surface matching.
//   4. an unrelated word of the right tier, as filler.
//
// Easy levels keep the weak filler so an 8-year-old can find footing; hard
// levels drop it and run on traps 1-3 only.

const relationsFor = (level, tiers) =>
  Object.entries(RELATIONS)
    .filter(([, meta]) => meta.minTier <= Math.max(...tiers))
    .map(([rel]) => rel)
    .filter((rel) => PAIRS[rel].some((p) => tiers.includes(p[2])))

export function generateVerbalAnalogies({ level, seed, rng }) {
  const tiers = tiersFor(level)
  const usesFiller = level <= 5
  const relations = relationsFor(level, tiers)

  return rng.attempt(
    () => {
      const relation = rng.pick(relations)
      const inTier = PAIRS[relation].filter((p) => tiers.includes(p[2]))
      if (inTier.length < 2) return null

      const [[a1, b1], [a2, b2]] = rng.sample(inTier, 2)
      if (new Set([a1, b1, a2, b2]).size < 4) return null

      const distractors = []

      // 1. real association with the stem, pulled through the wrong relation
      for (const entry of PAIRS_BY_WORD.get(a2) || []) {
        if (entry.rel === relation) continue
        const other = entry.a === a2 ? entry.b : entry.a
        if (other !== a2 && other !== b2) distractors.push(other)
      }

      // 2. right relation, someone else's answer
      for (const [pa, pb] of rng.shuffle(inTier)) {
        if (pa === a2 || pb === b2 || pb === b1) continue
        distractors.push(pb)
        if (distractors.length >= 3) break
      }

      // 3. the example's own answer, echoed
      distractors.push(b1)

      // 4. filler from another relation, easy levels only
      if (usesFiller) {
        const otherRel = rng.pick(relations.filter((r) => r !== relation))
        const pool = PAIRS[otherRel].filter((p) => tiers.includes(p[2]))
        if (pool.length) distractors.push(rng.pick(pool)[1])
      }

      const clean = distractors.filter((w) => w && w !== b2 && w !== a2 && w !== a1)

      return buildItem({
        subtest: 'verbal_analogies', level, seed, rng,
        prompt: { kind: 'analogy', a1, b1, a2 },
        correct: text(b2),
        distractors: clean.map(text),
        explain: `${a1} ${RELATIONS[relation].label} ${b1}, so ${a2} ${RELATIONS[relation].label} ${b2}.`,
        key: (c) => c.text,
      })
    },
    (it) => it !== null,
  )
}
