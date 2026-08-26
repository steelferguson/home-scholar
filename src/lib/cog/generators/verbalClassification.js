import { CATEGORIES, membersFor, categoriesFor, tiersFor } from '../wordbank.js'
import { buildItem, text } from '../item.js'

// Three words that belong together; pick the fourth that joins them.
//
// The item is only as good as its distractors. The strongest one is a word from
// the category's `near` list -- tightly associated with the category but not a
// member of it. A kid who reads the stem as "these are all bird-ish" picks
// `feather`; a kid who reads it as "these are all birds" does not. That is
// precisely the discrimination the subtest exists to measure.

export function generateVerbalClassification({ level, seed, rng }) {
  const tiers = tiersFor(level)
  const usable = categoriesFor(tiers, 4)

  return rng.attempt(
    () => {
      const category = rng.pick(usable)
      const members = membersFor(category, tiers)
      if (members.length < 4) return null

      const [w1, w2, w3, correct] = rng.sample(members, 4)

      // Harder levels lean on the associated-but-not-a-member trap; easier ones
      // keep two plainly unrelated options so an 8-year-old has footing.
      const nearCount = level <= 4 ? 1 : level <= 8 ? 2 : 3
      const distractors = rng.sample(CATEGORIES[category].near, nearCount)

      for (const other of rng.shuffle(usable.filter((c) => c !== category))) {
        if (distractors.length >= 3) break
        const pool = membersFor(other, tiers).filter((w) => !distractors.includes(w))
        if (pool.length) distractors.push(rng.pick(pool))
      }

      const clean = distractors.filter((w) => ![w1, w2, w3, correct].includes(w))

      return buildItem({
        subtest: 'verbal_classification', level, seed, rng,
        prompt: { kind: 'classification', words: [w1, w2, w3] },
        correct: text(correct),
        distractors: clean.map(text),
        explain: `${w1}, ${w2} and ${w3} are all ${category.replace(/_/g, ' ')} — and so is ${correct}.`,
        key: (c) => c.text,
      })
    },
    (it) => it !== null,
  )
}
