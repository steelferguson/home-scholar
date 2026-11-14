import test from 'node:test'
import assert from 'node:assert/strict'
import { createWalletStore } from '../src/lib/walletStore.js'

const zinc = { id: 'zinc', role: 'child' }, parent = { id: 'parent', role: 'parent' }
function fixture() {
  const calls = []
  const rows = [{ id: 'e1', profile_id: 'zinc', cents: 10, kind: 'lesson', created_at: '2026-11-14T10:00:00Z' }]
  const client = {
    rpc: async (name, args) => {
      calls.push([name, args])
      if (name === 'wallet_summary') return { data: [{ profile_id: 'zinc', balance: 10, earned_today: 10, cap: 50 }] }
      return { data: [{ cents: args.p_kind === 'practice' ? 10 : 5, earned_today: 20, cap: 50 }] }
    },
    from: () => {
      let inserted
      const query = { select: () => query, order: () => query, limit: () => query, single: () => query,
        insert: value => { inserted = { id: 'e2', created_at: 'now', ...value }; rows.unshift(inserted); return query },
        then: resolve => Promise.resolve({ data: inserted || rows }).then(resolve) }
      return query
    },
  }
  return { store: createWalletStore(client, 'family'), calls, rows }
}
test('loads balances and recent entries per child', async () => {
  const { store } = fixture(); await store.load()
  assert.deepEqual(store.summaryOf('zinc'), { balance: 10, earnedToday: 10, cap: 50 })
  assert.deepEqual(store.summaryOf('rush'), { balance: 0, earnedToday: 0, cap: 50 })
  assert.equal(store.getSnapshot().entries.zinc.length, 1)
})
test('awards go through the database function and only for children', async () => {
  const { store, calls } = fixture(); await store.load()
  assert.equal(await store.award(parent, 'practice'), null)
  assert.equal(await store.award(null, 'practice'), null)
  const result = await store.award(zinc, 'lesson', 'lesson-1')
  assert.deepEqual(result, { cents: 5, earnedToday: 20, cap: 50 })
  assert.deepEqual(calls.at(-1), ['award_wallet', { p_profile_id: 'zinc', p_kind: 'lesson', p_lesson_id: 'lesson-1' }])
  assert.equal(store.summaryOf('zinc').balance, 15)
  assert.equal(store.getSnapshot().entries.zinc[0].kind, 'replay')
})
test('a capped award adds no entry and a failed one throws', async () => {
  const { store } = fixture(); await store.load()
  const client = { rpc: async () => ({ data: [{ cents: 0, earned_today: 50, cap: 50 }] }) }
  const capped = createWalletStore(client, 'family')
  assert.deepEqual(await capped.award(zinc, 'practice'), { cents: 0, earnedToday: 50, cap: 50 })
  assert.deepEqual(capped.getSnapshot().entries.zinc, [])
  assert.equal(capped.summaryOf('zinc').balance, 0)
  const failing = createWalletStore({ rpc: async () => ({ error: true }) }, 'family')
  await assert.rejects(failing.award(zinc, 'practice'), /could not be saved/)
})
test('adjustments need a whole non-zero amount and a reason, then change the balance', async () => {
  const { store } = fixture(); await store.load()
  await assert.rejects(store.adjust('zinc', 0, 'x')); await assert.rejects(store.adjust('zinc', 2.5, 'x')); await assert.rejects(store.adjust('zinc', 25, '  '))
  await store.adjust('zinc', -25, 'bought a toy')
  assert.equal(store.summaryOf('zinc').balance, -15)
  assert.equal(store.summaryOf('zinc').earnedToday, 10, 'adjustments never count toward the daily goal')
  assert.equal(store.getSnapshot().entries.zinc[0].reason, 'bought a toy')
})
