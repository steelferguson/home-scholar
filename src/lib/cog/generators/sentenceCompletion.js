import { PAIRS, PAIRS_BY_WORD, CATEGORIES, membersFor, categoriesFor, tiersFor, isCountableNoun, IRREGULAR_PLURAL, MASS, ADJECTIVES, article, sentenceCase } from '../wordbank.js'
import { buildItem, text } from '../item.js'

// A sentence with a word missing.
//
// Sentences are built from the same relation bank the analogies use, rather than
// hand-written, so the item space grows with the bank instead of with authoring
// time. Each template states one relation plainly; the reasoning is in choosing
// which word satisfies it, not in decoding the sentence.

// Each template declares `ok`, the pairs it can phrase correctly. A template
// that cannot is skipped and the generator re-rolls, which costs a little
// variety and buys sentences that are never wrong.
const noun = (w) => isCountableNoun(w) && !IRREGULAR_PLURAL.has(w)
const a = (w) => `${article(w)} ${w}`

const TEMPLATES = {
  category: [
    { ok: (x) => noun(x), build: (x, y) => ({ sentence: `${a(x)} is a kind of ___.`, answer: y }) },
    { ok: (x) => MASS.has(x), build: (x, y) => ({ sentence: `${x} is a kind of ___.`, answer: y }) },
  ],
  part_whole: [
    { ok: (x, y) => noun(x) && noun(y), build: (x, y) => ({ sentence: `${a(x)} is part of ${a(y)}.`.replace(` ${y}.`, ' ___.'), answer: y }) },
    { ok: (x, y) => noun(x) && noun(y), build: (x, y) => ({ sentence: `Every ${y} has ${a(x)} in it.`.replace(`${article(x)} ${x}`, '___'), answer: x }) },
  ],
  opposite: [
    { ok: () => true, build: (x, y) => ({ sentence: `The opposite of ${x} is ___.`, answer: y }) },
    { ok: () => true, build: (x, y) => ({ sentence: `Something that is not ${y} at all is ___.`, answer: x }) },
  ],
  function: [
    { ok: (x) => noun(x), build: (x, y) => ({ sentence: `You use ${a(x)} to ___.`, answer: y }) },
    { ok: (x) => noun(x), build: (x, y) => ({ sentence: `When you need to ${y}, you reach for ${article(x)} ___.`, answer: x }) },
  ],
  worker_tool: [
    { ok: (x, y) => noun(x) && noun(y), build: (x, y) => ({ sentence: `${a(x)} works with ${article(y)} ___.`, answer: y }) },
  ],
  member_group: [
    { ok: (x, y) => noun(x) && noun(y), build: (x, y) => ({ sentence: `A group of ${x}s is called ${article(y)} ___.`, answer: y }) },
  ],
  made_of: [
    { ok: (x) => noun(x), build: (x, y) => ({ sentence: `${a(x)} is made of ___.`, answer: y }) },
  ],
  degree: [
    { ok: () => true, build: (x, y) => ({ sentence: `Far more than ${x} is ___.`, answer: y }) },
    { ok: () => true, build: (x, y) => ({ sentence: `A milder way of saying ${y} is ___.`, answer: x }) },
  ],
  cause_effect: [
    // "Too much" needs a mass noun: too much rain, not too much spark.
    { ok: (x) => MASS.has(x), build: (x, y) => ({ sentence: `Too much ${x} can lead to ___.`, answer: y }) },
  ],
  lacks: [
    { ok: (x) => noun(x), build: (x, y) => ({ sentence: `${a(x)} has almost no ___.`, answer: y }) },
    { ok: (x) => ADJECTIVES.has(x), build: (x, y) => ({ sentence: `Something ${x} has almost no ___.`, answer: y }) },
  ],
}

// Sentences sourced from the category bank rather than the relation pairs. This
// exists for variety: relation pairs alone gave only ~84 distinct sentences at
// level 1, few enough that he would meet the same one inside a week. The 141
// category words push that well past the floor.
function fromCategory({ level, seed, rng, tiers }) {
  const usable = categoriesFor(tiers, 2)
  const category = rng.pick(usable)
  const members = membersFor(category, tiers)
  const { singular, near } = CATEGORIES[category]

  const countable = CATEGORIES[category].countable !== false
  const [m1, m2] = rng.sample(members, 2)
  const one = (w) => (countable ? `${article(w)} ${w}` : w)
  const sentence = sentenceCase(rng.next() < 0.5
    ? `${one(m1)} is a kind of ___.`
    : `${one(m1)} and ${one(m2)} are both kinds of ___.`)

  const distractors = [
    rng.pick(near), // associated with the category but not what it IS
    ...rng.sample(usable.filter((c) => c !== category), 3).map((c) => CATEGORIES[c].singular),
  ]

  return buildItem({
    subtest: 'sentence_completion', level, seed, rng,
    prompt: { kind: 'sentence', sentence },
    correct: text(singular),
    distractors: distractors.map(text),
    explain: sentence.replace('___', singular),
    key: (c) => c.text,
  })
}

export function generateSentenceCompletion({ level, seed, rng }) {
  const tiers = tiersFor(level)
  const relations = Object.keys(TEMPLATES).filter((rel) => PAIRS[rel].some((p) => tiers.includes(p[2])))

  return rng.attempt(
    () => {
      if (rng.next() < 0.5) return fromCategory({ level, seed, rng, tiers })

      const relation = rng.pick(relations)
      const inTier = PAIRS[relation].filter((p) => tiers.includes(p[2]))
      if (inTier.length < 3) return null

      const [x, y] = rng.pick(inTier)
      const usable = TEMPLATES[relation].filter((t) => t.ok(x, y))
      if (!usable.length) return null
      const built = rng.pick(usable).build(x, y)
      const sentence = sentenceCase(built.sentence)
      const { answer } = built
      const stem = answer === y ? x : y

      const distractors = []

      // Strongest: a word genuinely tied to the stem, through a different
      // relation than the sentence asks about.
      for (const entry of PAIRS_BY_WORD.get(stem) || []) {
        if (entry.rel === relation) continue
        for (const w of [entry.a, entry.b]) if (w !== stem && w !== answer) distractors.push(w)
      }

      // Then: words that would answer the same sentence about a different pair.
      for (const pair of rng.shuffle(inTier)) {
        if (distractors.length >= 4) break
        const w = answer === y ? pair[1] : pair[0]
        if (w !== answer && w !== stem) distractors.push(w)
      }

      return buildItem({
        subtest: 'sentence_completion', level, seed, rng,
        prompt: { kind: 'sentence', sentence },
        correct: text(answer),
        distractors: distractors.map(text),
        explain: sentence.replace('___', answer),
        key: (c) => c.text,
      })
    },
    (it) => it !== null,
  )
}
