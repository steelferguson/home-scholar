import test from 'node:test'
import assert from 'node:assert/strict'

import { buildBite, startBite, currentItem, isComplete, answerCurrent, flagCurrent, biteResult, BITE_SIZE } from '../session.js'
import { createProgress, recordAttempt, settleBite, subtestStats, overview, WINDOW } from '../progress.js'
import { SUBTESTS } from '../item.js'
import { IMPLEMENTED } from '../index.js'
import { MAX_LEVEL, MIN_LEVEL } from '../levels.js'

// Answer a whole bite, correct or not, at a chosen pace.
function playBite(progress, seed, { correct = true, fast = false } = {}) {
  const items = buildBite(progress, seed)
  let state = startBite(items)
  while (!isComplete(state)) {
    const item = currentItem(state)
    const choice = correct ? item.answer : (item.answer + 1) % 4
    state = answerCurrent(state, choice, fast ? 3 : item.targetSeconds * 0.8)
  }
  const result = biteResult(state)
  let next = progress
  for (const attempt of result.attempts) next = recordAttempt(next, attempt)
  return { progress: settleBite(next), result }
}

test('a bite is seven items spanning all three batteries', () => {
  let progress = createProgress(5)
  for (let seed = 0; seed < 20; seed++) {
    const items = buildBite(progress, seed)
    assert.equal(items.length, BITE_SIZE)
    for (const battery of ['verbal', 'quantitative', 'nonverbal']) {
      const count = items.filter((i) => SUBTESTS[i.subtest].battery === battery).length
      assert.ok(count >= 2, `only ${count} ${battery} items in a bite`)
    }
    progress = playBite(progress, seed).progress
  }
})

test('a bite never ends on an item above his level', () => {
  // How a bite ended is what he carries into the next one, so the last item is
  // deliberately below his level. Frustration is one of the four things this
  // course exists to fix.
  let progress = createProgress(6)
  for (let seed = 0; seed < 20; seed++) {
    const items = buildBite(progress, seed)
    const last = items[items.length - 1]
    assert.ok(last.level <= progress.levels[last.subtest], `bite ended at level ${last.level} above ${progress.levels[last.subtest]}`)
    for (const item of items) {
      assert.ok(Math.abs(item.level - progress.levels[item.subtest]) <= 1, 'an item strayed more than one level from his own')
    }
    progress = playBite(progress, seed).progress
  }
})

test('a bite avoids items he has just seen', () => {
  let progress = createProgress(2)
  const seenIds = new Set()
  for (let seed = 0; seed < 15; seed++) {
    for (const item of buildBite(progress, seed)) {
      assert.ok(!progress.recent[item.subtest].includes(item.id), `repeated ${item.id} while still in recent memory`)
      seenIds.add(item.id)
    }
    progress = playBite(progress, seed).progress
  }
  assert.ok(seenIds.size > 90, `only ${seenIds.size} distinct items across 15 bites`)
})

test('every format is met within the first few bites, and flagged the first time', () => {
  let progress = createProgress(3)
  const firstEncounters = new Set()
  for (let seed = 0; seed < 4; seed++) {
    for (const item of buildBite(progress, seed)) {
      if (item.isFirstEncounter) firstEncounters.add(item.subtest)
    }
    progress = playBite(progress, seed).progress
  }
  assert.equal(firstEncounters.size, IMPLEMENTED.length, 'not every format was introduced')
  // And once met, never introduced again.
  for (const item of buildBite(progress, 99)) {
    assert.equal(item.isFirstEncounter, false, `${item.subtest} was introduced twice`)
  }
})

test('flagging sends an item to the back and brings it round again', () => {
  const progress = createProgress(4)
  const items = buildBite(progress, 1)
  let state = startBite(items)

  const skipped = currentItem(state)
  state = flagCurrent(state)
  assert.notEqual(currentItem(state).id, skipped.id, 'flagging did not move on')

  // Answer everything else; the flagged item must be what is left.
  while (currentItem(state).id !== skipped.id) {
    state = answerCurrent(state, currentItem(state).answer, 10)
  }
  assert.equal(currentItem(state).id, skipped.id, 'the flagged item never came back')

  // It cannot be flagged a second time, or the bite would never end.
  const stuck = flagCurrent(state)
  assert.equal(currentItem(stuck).id, skipped.id, 'an item was flagged twice')

  state = answerCurrent(state, currentItem(state).answer, 10)
  assert.ok(isComplete(state))
  assert.equal(biteResult(state).flaggedAndRecovered, 1)
})

test('the bite result keeps careless misses apart from hard ones', () => {
  const progress = createProgress(4)
  const items = buildBite(progress, 2)
  let state = startBite(items)

  // First two wrong and rushed, next two wrong but considered, rest correct.
  let i = 0
  while (!isComplete(state)) {
    const item = currentItem(state)
    const wrong = (item.answer + 1) % 4
    if (i < 2) state = answerCurrent(state, wrong, item.targetSeconds * 0.1)
    else if (i < 4) state = answerCurrent(state, wrong, item.targetSeconds * 1.4)
    else state = answerCurrent(state, item.answer, item.targetSeconds * 0.7)
    i++
  }

  const result = biteResult(state)
  assert.equal(result.carelessMisses, 2)
  assert.equal(result.hardMisses, 2)
  assert.equal(result.correct, BITE_SIZE - 4)
})

test('an unanswered item counts as skipped, not as wrong on purpose', () => {
  const progress = createProgress(4)
  const state = startBite(buildBite(progress, 3))
  const result = biteResult(state)
  assert.equal(result.attempts.filter((a) => a.skipped).length, BITE_SIZE)
  assert.equal(result.correct, 0)
  assert.equal(result.hardMisses, 0, 'skipped items were counted as misses')
})

test('levels rise on strong, on-pace work and never exceed the ceiling', () => {
  let progress = createProgress(10)
  for (let seed = 0; seed < 60; seed++) progress = playBite(progress, seed, { correct: true }).progress
  const levels = Object.values(progress.levels)
  assert.ok(levels.every((l) => l <= MAX_LEVEL), 'a level went past the ceiling')
  assert.ok(levels.some((l) => l > 10), 'nothing was promoted despite perfect work')
})

test('levels fall on genuinely hard misses but hold on careless ones', () => {
  // Dropping the level for rushing rewards rushing with easier work. The
  // coaching layer deals with rushing; the level is about difficulty.
  const hard = (() => {
    let progress = createProgress(8)
    for (let seed = 0; seed < 30; seed++) progress = playBite(progress, seed, { correct: false, fast: false }).progress
    return progress
  })()
  const careless = (() => {
    let progress = createProgress(8)
    for (let seed = 0; seed < 30; seed++) progress = playBite(progress, seed, { correct: false, fast: true }).progress
    return progress
  })()

  assert.ok(Object.values(hard.levels).every((l) => l < 8), 'hard misses did not lower the level')
  assert.ok(Object.values(hard.levels).every((l) => l >= MIN_LEVEL), 'a level went below the floor')
  assert.ok(Object.values(careless.levels).every((l) => l === 8), 'careless misses lowered the level')
})

test('a level change clears the window it was judged on', () => {
  let progress = createProgress(5)
  for (let seed = 0; seed < 40; seed++) {
    const before = { ...progress.levels }
    progress = playBite(progress, seed, { correct: true }).progress
    for (const subtest of Object.keys(progress.levels)) {
      if (progress.levels[subtest] !== before[subtest]) {
        assert.ok(subtestStats(progress, subtest).attempts < WINDOW, `${subtest} kept its old window after a level change`)
      }
    }
  }
})

test('a bite is reproducible from the same progress and seed', () => {
  const progress = createProgress(6)
  const a = buildBite(progress, 7).map((i) => i.id)
  const b = buildBite(progress, 7).map((i) => i.id)
  assert.deepEqual(a, b)
  assert.notDeepEqual(a, buildBite(progress, 8).map((i) => i.id))
})

test('the overview reports per-subtest levels rather than one global level', () => {
  let progress = createProgress(4)
  for (let seed = 0; seed < 10; seed++) progress = playBite(progress, seed).progress
  const view = overview(progress)
  assert.equal(view.subtests.length, Object.keys(SUBTESTS).length)
  assert.ok(view.strongest.level >= view.weakest.level)
  assert.ok(view.averageLevel >= MIN_LEVEL && view.averageLevel <= MAX_LEVEL)
})
