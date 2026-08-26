import test from 'node:test'
import assert from 'node:assert/strict'

import { generateItem, IMPLEMENTED } from '../index.js'
import { visualKey, sameFigure, RULES, chooseRules, ruleCount, SHAPES, SIZES, rotationVisible } from '../figures.js'
import { makeRng } from '../rng.js'
import { targetSeconds, clampLevel, MAX_LEVEL, MIN_LEVEL } from '../levels.js'
import { PAIRS } from '../wordbank.js'

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

const choiceKey = (c) => (c.kind === 'figure' ? visualKey(c.figure) : c.text)

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
      assert.ok([1, 2, 3].includes(tier), `${relation} pair ${a}:${b} has tier ${tier}`)
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
  const FLOOR = { number_series: 100, verbal_analogies: 150, figure_matrices: 400 }
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
