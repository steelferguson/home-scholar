import test from 'node:test'
import assert from 'node:assert/strict'
import { allFacts, buildSet, createSession, factWeight, statRows, SET_SIZE } from '../src/lib/mathFacts.js'

test('fact banks: 100 addition, 100 subtraction, 200 mixed, every subtraction answer 0-9', () => {
  assert.equal(allFacts('addition').length, 100)
  assert.equal(allFacts('subtraction').length, 100)
  assert.equal(allFacts('mixed').length, 200)
  for (const fact of allFacts('subtraction')) { assert.ok(fact.answer >= 0 && fact.answer <= 9); assert.equal(fact.a - fact.b, fact.answer) }
  assert.equal(new Set(allFacts('mixed').map(f => f.key)).size, 200)
})
test('a set is 20 distinct facts', () => {
  const set = buildSet(allFacts('addition'))
  assert.equal(set.length, SET_SIZE)
  assert.equal(new Set(set.map(f => f.key)).size, SET_SIZE)
})
test('missed facts come up more often', () => {
  assert.equal(factWeight(undefined), 1)
  assert.ok(factWeight({ correct_count: 0, incorrect_count: 2 }) > 2.5 * factWeight({ correct_count: 2, incorrect_count: 0 }))
  const stats = { '7+8': { correct_count: 0, incorrect_count: 5 } }
  let seed = 1; const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  let hits = 0
  for (let i = 0; i < 200; i++) if (buildSet(allFacts('addition'), stats, 20, rng).some(f => f.key === '7+8')) hits++
  assert.ok(hits > 130, `weighted fact appeared in ${hits}/200 sets`)
})
test('a wrong answer returns at the end of the set and counts against first-try', () => {
  const set = allFacts('addition').slice(0, 3)
  const session = createSession(set)
  assert.equal(session.total, 3)
  assert.deepEqual(session.answer(set[0].answer), { fact: set[0], correct: true })
  assert.equal(session.answer(99).correct, false)
  assert.equal(session.current.key, set[2].key)
  session.answer(set[2].answer)
  assert.equal(session.done, false)
  assert.equal(session.current.key, set[1].key, 'missed fact comes back last')
  session.answer(set[1].answer)
  assert.equal(session.done, true)
  assert.equal(session.answered, 3)
  assert.equal(session.answer(1), null)
  const summary = session.summary()
  assert.equal(summary.firstTry, 2)
  assert.deepEqual(summary.results[set[1].key], { correct: false, misses: 1 })
})
test('stat rows add to what is stored', () => {
  const session = createSession(allFacts('addition').slice(0, 2))
  session.answer(0); session.answer(0); session.answer(0); session.answer(1)
  const rows = statRows(session.summary(), { '0+1': { correct_count: 4, incorrect_count: 1 } })
  assert.deepEqual(rows.sort((a, b) => a.card_key.localeCompare(b.card_key)), [
    { card_key: '0+0', correct_count: 1, incorrect_count: 0 },
    { card_key: '0+1', correct_count: 4, incorrect_count: 3 },
  ])
})
