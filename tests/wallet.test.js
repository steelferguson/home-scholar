import test from 'node:test'
import assert from 'node:assert/strict'
import { awardCents, chicagoDate, formatCents } from '../src/lib/wallet.js'

test('first lesson pays 10, a replay 5, a practice set 10 every time', () => {
  assert.deepEqual(awardCents({ kind: 'lesson' }), { kind: 'lesson', cents: 10, earnedToday: 10, cap: 50 })
  assert.equal(awardCents({ kind: 'lesson', alreadyPaidLesson: true }).kind, 'replay')
  assert.equal(awardCents({ kind: 'lesson', alreadyPaidLesson: true }).cents, 5)
  assert.equal(awardCents({ kind: 'practice', alreadyPaidLesson: true }).cents, 10)
})
test('the daily cap trims the last award and then pays nothing', () => {
  assert.equal(awardCents({ kind: 'lesson', earnedToday: 45 }).cents, 5)
  assert.equal(awardCents({ kind: 'practice', earnedToday: 50 }).cents, 0)
  assert.equal(awardCents({ kind: 'practice', earnedToday: 50 }).earnedToday, 50)
  assert.equal(awardCents({ kind: 'lesson', earnedToday: 0, cap: 0 }).cents, 0)
})
test('the day rolls over at midnight Central, not UTC', () => {
  assert.equal(chicagoDate(new Date('2026-11-15T05:30:00Z')), '2026-11-14')
  assert.equal(chicagoDate(new Date('2026-11-15T06:30:00Z')), '2026-11-15')
})
test('cents format as dollars', () => {
  assert.equal(formatCents(5), '$0.05'); assert.equal(formatCents(120), '$1.20'); assert.equal(formatCents(-25), '-$0.25')
})
