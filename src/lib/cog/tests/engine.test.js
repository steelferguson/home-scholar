import test from 'node:test'
import assert from 'node:assert/strict'

import { generateItem, IMPLEMENTED, SUBTESTS } from '../index.js'
import { visualKey, sameFigure, RULES, chooseRules, ruleCount, SHAPES, SIZES, rotationVisible } from '../figures.js'
import { makeRng } from '../rng.js'
import { targetSeconds, clampLevel, MAX_LEVEL, MIN_LEVEL, MASTERY_FROM, PACE_FLOOR } from '../levels.js'
import { PAIRS, CATEGORIES, MASS, ADJECTIVES } from '../wordbank.js'

const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)
const SEEDS = Array.from({ length: 200 }, (_, i) => i)

// Every item the engine can produce at every level. Bad items are rare and
// look fine individually, so the tests sweep rather than spot-check.
const everyItem = function* () {
  for (const subtest of IMPLEMENTED) {
    for (const level of LEVELS) {
      for (const seed of SEEDS) yield { subtest, level, seed, item: generateItem(subtest, level, seed) }
    }
  }
}

const choiceKey = (c) => {
  if (c.kind === 'figure') return visualKey(c.figure)
  if (c.kind === 'holes') return c.holes.map(([r, col]) => `${r},${col}`).sort().join(' ')
  return c.text
}

test('every generator produces an item at every level', () => {
  for (const { subtest, level, seed, item } of everyItem()) {
    assert.ok(item, `${subtest} L${level} seed ${seed} produced no item`)
  }
})

test('items are well formed: 4 choices, a valid answer, an explanation', () => {
  for (const { subtest, level, seed, item } of everyItem()) {
    const where = `${subtest} L${level} seed ${seed}`
    assert.equal(item.choices.length, 4, `${where} had ${item.choices.length} choices`)
    assert.ok(item.answer >= 0 && item.answer < 4, `${where} answer index ${item.answer}`)
    assert.ok(item.explain && item.explain.length > 10, `${where} has no real explanation`)
    assert.equal(item.level, level)
    assert.ok(item.targetSeconds > 0)
  }
})

test('no two choices render the same', () => {
  // The nastiest bug class: two options that LOOK identical. The kid picks the
  // one that is right and is told they are wrong.
  for (const { subtest, level, seed, item } of everyItem()) {
    const keys = item.choices.map(choiceKey)
    assert.equal(new Set(keys).size, 4, `${subtest} L${level} seed ${seed} has choices that render identically: ${keys.join(', ')}`)
  }
})

test('the answer is not parked in one position', () => {
  // A kid who notices the answer is usually third learns the wrong lesson.
  const counts = [0, 0, 0, 0]
  let total = 0
  for (const { item } of everyItem()) { counts[item.answer]++; total++ }
  for (const [i, n] of counts.entries()) {
    const share = n / total
    assert.ok(share > 0.18 && share < 0.32, `answer landed in position ${i} ${(share * 100).toFixed(1)}% of the time`)
  }
})

test('items are reproducible from their id alone', () => {
  for (const subtest of IMPLEMENTED) {
    for (const level of [1, 6, 12]) {
      const a = generateItem(subtest, level, 99)
      const b = generateItem(subtest, level, 99)
      assert.deepEqual(a, b)
      assert.equal(a.id, `${subtest}:${level}:99`)
    }
  }
})

test('figure matrices always show a visible change across the top row', () => {
  // If A and B look the same there is no rule to spot and the item is
  // unanswerable, however reasonable the underlying spec looks.
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const item = generateItem('figure_matrices', level, seed)
      const [a, b, c] = item.prompt.cells
      assert.ok(!sameFigure(a, b), `L${level} seed ${seed}: A and B render identically`)
      assert.ok(!sameFigure(a, c), `L${level} seed ${seed}: A and C render identically`)
    }
  }
})

test('figure rules never wrap past the edge of what they claim to do', () => {
  // "Gets bigger" must never shrink; "one more" must never reset to one.
  for (const shape of SHAPES) {
    for (const count of [1, 2, 3, 4]) {
      for (const shading of ['none', 'half', 'full']) {
        for (const size of SIZES) {
          const f = { shape, count, shading, rotation: 0, size, flipped: false }
          for (const rule of RULES.filter((r) => r.fits(f))) {
            const out = rule.apply(f)
            assert.ok(out.count >= 1 && out.count <= 4, `${rule.name} produced count ${out.count}`)
            assert.ok(SIZES.includes(out.size), `${rule.name} produced size ${out.size}`)
            if (rule.name === 'size_up') assert.ok(out.size > f.size, 'size_up shrank the shape')
            if (rule.name === 'count_up') assert.ok(out.count > f.count, 'count_up reduced the count')
            if (rule.name === 'count_down') assert.ok(out.count < f.count, 'count_down raised the count')
            assert.ok(!sameFigure(f, out), `${rule.name} on ${shape}/${count}/${shading}/${size} changed nothing visible`)
          }
        }
      }
    }
  }
})

test('rotation rules are never chosen where rotation cannot be seen', () => {
  assert.equal(rotationVisible('circle', 90), false)
  assert.equal(rotationVisible('square', 90), false)
  assert.equal(rotationVisible('square', 45), true)
  assert.equal(rotationVisible('triangle', 90), true)
  const rng = makeRng(7)
  for (const shape of SHAPES) {
    const base = { shape, count: 1, shading: 'none', rotation: 0, size: 0.6, flipped: false }
    for (const level of LEVELS) {
      for (const rule of chooseRules(rng, level, [base], ruleCount(level))) {
        if (rule.name.startsWith('rotate_')) {
          assert.ok(rotationVisible(shape, rule.name === 'rotate_90' ? 90 : 45), `${rule.name} chosen for ${shape}, where it is invisible`)
        }
      }
    }
  }
})

test('number series stay in reasoning range rather than becoming arithmetic slogs', () => {
  const cap = (level) => (level <= 4 ? 100 : level <= 8 ? 300 : 1000)
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const item = generateItem('number_series', level, seed)
      for (const c of item.choices) {
        assert.ok(Math.abs(Number(c.text)) <= cap(level), `L${level} seed ${seed} choice ${c.text} exceeds the cap`)
      }
      assert.equal(item.prompt.terms.length, 5)
      assert.ok(item.prompt.terms.every(Number.isInteger), `L${level} seed ${seed} produced a non-integer term`)
    }
  }
})

test('verbal analogy stems are distinct, and never give the answer away', () => {
  // Note: the example's own answer (b1) appearing among the choices is
  // deliberate -- it is the trap for surface pattern-matching. What must never
  // happen is the CORRECT answer showing up in the stem.
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const { prompt, choices, answer } = generateItem('verbal_analogies', level, seed)
      const stem = [prompt.a1, prompt.b1, prompt.a2]
      assert.equal(new Set(stem).size, 3, `L${level} seed ${seed} repeats a stem word: ${stem.join(', ')}`)
      assert.ok(!stem.includes(choices[answer].text), `L${level} seed ${seed} shows the answer in the stem`)
    }
  }
})

test('word bank pairs are distinct and tiered', () => {
  for (const [relation, pairs] of Object.entries(PAIRS)) {
    for (const [a, b, tier] of pairs) {
      assert.notEqual(a, b, `${relation} pair repeats a word`)
      assert.ok([1, 2, 3, 4].includes(tier), `${relation} pair ${a}:${b} has tier ${tier}`)
    }
    const keys = pairs.map(([a, b]) => `${a}:${b}`)
    assert.equal(new Set(keys).size, keys.length, `${relation} has a duplicate pair`)
  }
})

test('pace tightens as levels rise, and levels are clamped', () => {
  assert.ok(targetSeconds(1) > targetSeconds(12))
  assert.equal(clampLevel(0), MIN_LEVEL)
  assert.equal(clampLevel(99), MAX_LEVEL)
})

test('every subtest offers enough distinct items at every level', () => {
  // The quiet failure: a level whose rules and parameter ranges are both narrow
  // produces a handful of items forever. Nothing errors, the tests pass, and he
  // meets the same question three times in one sitting. Level 1 of number
  // series was exactly this -- 24 distinct items -- before the ranges widened.
  const FLOOR = {
    number_series: 100, verbal_analogies: 150, figure_matrices: 400,
    verbal_classification: 150, sentence_completion: 150,
    number_analogies: 150, number_puzzles: 150,
    figure_classification: 200, paper_folding: 40,
  }
  const SAMPLE = 800
  for (const subtest of IMPLEMENTED) {
    for (const level of LEVELS) {
      const prompts = new Set()
      for (let seed = 0; seed < SAMPLE; seed++) {
        prompts.add(JSON.stringify(generateItem(subtest, level, seed).prompt))
      }
      assert.ok(
        prompts.size >= FLOOR[subtest],
        `${subtest} L${level} offers only ${prompts.size} distinct items (floor ${FLOOR[subtest]})`,
      )
    }
  }
})

test('the row difference in a figure matrix is never an attribute a rule touches', () => {
  // Rows differ by one attribute, and no rule may write it -- otherwise the row
  // difference and the transformation argue over the same thing. Stated
  // observably: whatever separates the rows must be constant ALONG each row and
  // must survive untouched into the answer. Holds for the 2x2 matrices up to
  // level 12 and the 3x3 matrices of the mastery band alike.
  const ATTRS = ['shape', 'count', 'shading', 'size', 'rotation', 'flipped']
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const item = generateItem('figure_matrices', level, seed)
      const { columns, cells } = item.prompt
      const answer = item.choices[item.answer].figure
      const rows = columns === 3
        ? [cells.slice(0, 3), cells.slice(3, 6), [...cells.slice(6, 8), answer]]
        : [[cells[0], cells[1]], [cells[2], answer]]

      const where = `figure_matrices ${columns}x${columns} L${level} seed ${seed}`
      const differing = ATTRS.filter((attr) => rows.some((row) => row[0][attr] !== rows[0][0][attr]))
      assert.equal(differing.length, 1, `${where}: rows differ in ${differing.length} attributes (${differing.join(', ')})`)

      const attr = differing[0]
      for (const row of rows) {
        for (const cell of row) {
          assert.equal(cell[attr], row[0][attr], `${where}: a rule wrote ${attr}, which is also the row difference`)
        }
      }
    }
  }
})

test('mastery matrices are 3x3 and apply the rule twice across each row', () => {
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const item = generateItem('figure_matrices', level, seed)
      const expected = level >= MASTERY_FROM ? 3 : 2
      assert.equal(item.prompt.columns, expected, `L${level} seed ${seed}: expected a ${expected}x${expected} matrix`)
      assert.equal(item.prompt.cells.length, expected === 3 ? 9 : 4, `L${level} seed ${seed}: wrong number of cells`)
      assert.ok(item.prompt.cells.slice(0, -1).every(Boolean), 'a shown cell was empty')
      assert.equal(item.prompt.cells[item.prompt.cells.length - 1], null, 'the missing cell was filled in')
    }
  }
})

test('all nine CogAT subtests have a generator', () => {
  const expected = [
    'verbal_analogies', 'verbal_classification', 'sentence_completion',
    'number_series', 'number_analogies', 'number_puzzles',
    'figure_matrices', 'figure_classification', 'paper_folding',
  ]
  assert.deepEqual([...IMPLEMENTED].sort(), [...expected].sort())
  for (const subtest of expected) assert.ok(SUBTESTS[subtest], `${subtest} has no entry in SUBTESTS`)
})

test('sentences are grammatical', () => {
  // An 8-year-old reads these. "A group of fishs is called a ___", "a bald has
  // almost no ___" and "a wind and a snow are both kinds of ___" all shipped
  // before the word bank carried countability and part-of-speech tags.
  const badArticle = new RegExp(`\\b(a|an) (${[...MASS, ...ADJECTIVES].join('|')})\\b`, 'i')
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const { sentence } = generateItem('sentence_completion', level, seed).prompt
      assert.match(sentence, /^[A-Z]/, `not capitalised: "${sentence}"`)
      assert.match(sentence, /\.$/, `no full stop: "${sentence}"`)
      assert.equal((sentence.match(/___/g) || []).length, 1, `wrong number of blanks: "${sentence}"`)
      assert.doesNotMatch(sentence, badArticle, `article on a mass noun or adjective: "${sentence}"`)
      assert.doesNotMatch(sentence, /\ba (a|e|i|o)[a-z]/i, `"a" before a vowel: "${sentence}"`)
      assert.doesNotMatch(sentence, /\b(fish|sheep|deer)s\b/i, `bad plural: "${sentence}"`)
    }
  }
})

test('figure classification has exactly one defensible answer', () => {
  // The stems can share MORE than the intended invariant by chance. Whatever
  // they actually share, the correct answer must match all of it and no wrong
  // answer may. 6.8% of items failed this before it was enforced.
  const ATTRS = ['shape', 'count', 'shading', 'size']
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const item = generateItem('figure_classification', level, seed)
      const stems = item.prompt.figures
      const shared = ATTRS.filter((attr) => stems.every((f) => f[attr] === stems[0][attr]))
      assert.ok(shared.length > 0, `L${level} seed ${seed}: the stems share nothing`)

      const matches = item.choices.filter((c) => shared.every((attr) => c.figure[attr] === stems[0][attr]))
      assert.equal(matches.length, 1, `L${level} seed ${seed}: ${matches.length} choices match everything the stems share`)
      assert.equal(item.choices.indexOf(matches[0]), item.answer, `L${level} seed ${seed}: the matching choice is not the answer`)
    }
  }
})

test('paper folding answers are the punches mirrored across every fold', () => {
  // Folds are undone in REVERSE order. A diagonal and a straight fold do not
  // commute, so undoing them in the order they were made gives a pattern that
  // is wrong while still looking plausible.
  const MIRRORS = {
    vertical: (grid) => ([r, c]) => [r, grid - 1 - c],
    horizontal: (grid) => ([r, c]) => [grid - 1 - r, c],
    diagonal: () => ([r, c]) => [c, r],
  }
  const norm = (holes) => [...new Set(holes.map(([r, c]) => `${r},${c}`))].sort().join(' ')

  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const item = generateItem('paper_folding', level, seed)
      const { folds, punches, grid } = item.prompt

      let expected = punches.map(([r, c]) => [r, c])
      for (const fold of [...folds].reverse()) {
        const mirror = MIRRORS[fold](grid)
        expected = [...expected, ...expected.map(mirror)]
      }

      assert.equal(norm(item.choices[item.answer].holes), norm(expected), `L${level} seed ${seed}: wrong unfold`)

      // Punches must lie in the part of the paper still visible after folding.
      for (const [r, c] of punches) {
        if (folds.includes('vertical')) assert.ok(c < grid / 2, `L${level} seed ${seed}: punch outside the folded paper`)
        if (folds.includes('horizontal')) assert.ok(r < grid / 2, `L${level} seed ${seed}: punch outside the folded paper`)
        if (folds.includes('diagonal')) assert.ok(r <= c, `L${level} seed ${seed}: punch across the diagonal fold`)
      }
    }
  }
})

test('category bank is well formed', () => {
  for (const [name, cat] of Object.entries(CATEGORIES)) {
    assert.ok(cat.singular, `${name} has no singular label`)
    assert.ok(cat.near.length >= 3, `${name} has too few associated-but-not-member words`)
    const words = cat.words.map(([w]) => w)
    assert.equal(new Set(words).size, words.length, `${name} repeats a word`)
    for (const w of words) assert.ok(!cat.near.includes(w), `${name}: "${w}" is both a member and an associate`)
  }
})

test('size is never asked about while the count is changing', () => {
  // The renderer shrinks each copy as the count rises, so four large shapes are
  // drawn smaller than one small shape. Any item that asks the eye to compare
  // size across different counts is unanswerable, however sound its spec.
  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const matrix = generateItem('figure_matrices', level, seed)
      const [a, b] = matrix.prompt.cells
      assert.ok(
        a.count === b.count || a.size === b.size,
        `figure_matrices L${level} seed ${seed}: a rule changes count and size together`,
      )

      const group = generateItem('figure_classification', level, seed)
      const stems = group.prompt.figures
      const countVaries = stems.some((f) => f.count !== stems[0].count)
      const sizeShared = stems.every((f) => f.size === stems[0].size)
      assert.ok(
        !(countVaries && sizeShared),
        `figure_classification L${level} seed ${seed}: shared size across differing counts`,
      )
    }
  }
})

test('the mastery band raises difficulty with content, not with the clock', () => {
  // A faster version of the same item is not a harder item. Past level 12 the
  // pace floors and the material changes instead.
  assert.equal(targetSeconds(MAX_LEVEL), Math.round(PACE_FLOOR))
  assert.ok(targetSeconds(12) >= targetSeconds(MASTERY_FROM))

  for (const level of LEVELS.filter((l) => l >= MASTERY_FROM)) {
    for (const seed of SEEDS.slice(0, 60)) {
      assert.equal(generateItem('figure_matrices', level, seed).prompt.columns, 3)
      assert.ok(generateItem('paper_folding', level, seed).prompt.folds.includes('diagonal'))
    }
  }
  // Simultaneous equations only exist in the mastery band.
  const mastery = SEEDS.slice(0, 80).map((seed) => generateItem('number_puzzles', MASTERY_FROM, seed))
  assert.ok(mastery.some((item) => item.prompt.givens.length === 2 && item.prompt.givens.every((g) => /[+-]/.test(g))))
})
