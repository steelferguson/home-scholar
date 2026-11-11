import test from 'node:test'
import assert from 'node:assert/strict'
import { createFamilyStore } from '../src/lib/familyStore.js'
function fixture() {
  const rows = [{ id: 'parent', role: 'parent' }, { id: 'zinc', role: 'child' }]
  const memory = new Map()
  const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
  const client = { auth: { signInWithPassword: async ({ password }) => password === 'test-password' ? { data: { user: { id: 'family' } } } : { error: true } }, from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: rows }) }) }) }) }
  return { create: () => createFamilyStore(client, { id: 'family', email: 'parent@example.test' }, storage), storage }
}
test('an authenticated family session starts in parent mode without a second login', async () => {
  const { create } = fixture(); const store = create(); await store.load()
  assert.equal(store.getSnapshot().active?.id, 'parent')
  assert.equal(store.getSnapshot().unlocked, true)
})
test('parent selection persists after returning from a child and reopening', async () => {
  const { create } = fixture(); const store = create(); await store.load()
  await store.unlock('test-password'); store.select('zinc'); await store.unlock('test-password'); store.select('parent')
  const reopened = create(); await reopened.load()
  assert.equal(reopened.getSnapshot().active?.id, 'parent')
  assert.equal(reopened.getSnapshot().unlocked, true)
})
test('screen lock leaves parent identity and authorization unchanged', async () => {
  const { create } = fixture(); const store = create(); await store.load()
  await store.unlock('test-password'); store.select('parent'); store.background()
  assert.equal(store.getSnapshot().active?.id, 'parent')
  assert.equal(store.getSnapshot().unlocked, true)
})
test('switching to a child persists the lock, including temporary parent controls', async () => {
  const { create } = fixture(); const store = create(); await store.load()
  await store.unlock('test-password'); store.select('zinc')
  const reopened = create(); await reopened.load()
  assert.equal(reopened.getSnapshot().active?.id, 'zinc'); assert.equal(reopened.getSnapshot().unlocked, false)
  await assert.rejects(reopened.unlock('wrong'))
  assert.throws(() => reopened.select('parent'))
  await reopened.unlock('test-password'); reopened.background()
  assert.equal(reopened.getSnapshot().active?.id, 'zinc'); assert.equal(reopened.getSnapshot().unlocked, false)
})
test('explicit lock persists across reload even without a previous child', async () => {
  const { create } = fixture(); const store = create(); await store.load()
  await store.unlock('test-password'); store.select('parent'); store.lock()
  const reopened = create(); await reopened.load()
  assert.equal(reopened.getSnapshot().active, null); assert.equal(reopened.getSnapshot().unlocked, false)
})
