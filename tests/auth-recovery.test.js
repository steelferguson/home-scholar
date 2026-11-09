import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthStore, sendParentPasswordLink } from '../src/lib/authStore.js'

function fixture() {
  let listener, finishSession
  const writes = [], emails = []
  const user = { id: 'family', email: 'parent@example.test' }
  const client = { auth: {
    onAuthStateChange: fn => { listener = fn; return { data: { subscription: { unsubscribe() {} } } } },
    getSession: () => new Promise(resolve => { finishSession = resolve }),
    updateUser: async payload => { writes.push(payload); listener('USER_UPDATED', { user }); return { data: { user } } },
    resetPasswordForEmail: async (...args) => { emails.push(args); return {} },
  } }
  const store = createAuthStore(client); store.start()
  return { store, client, user, writes, emails, emit: (event, nextUser = user) => listener(event, nextUser ? { user: nextUser } : null), finishSession: () => finishSession({ data: { session: { user } } }) }
}
test('a Google or remembered session cannot change the parent password', async () => {
  for (const event of ['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED']) {
    const f = fixture(); f.emit(event)
    await assert.rejects(f.store.setRecoveryPassword('new-test-password'))
    assert.equal(f.writes.length, 0)
  }
})
test('validated email recovery permits password setup but never authorizes parent controls', async () => {
  const f = fixture(); f.emit('PASSWORD_RECOVERY')
  await f.store.setRecoveryPassword('new-test-password')
  assert.equal(f.writes.length, 1)
  assert.equal(f.store.getSnapshot().recoveryUserId, null)
  await assert.rejects(f.store.setRecoveryPassword('second-test-password'))
})
test('late initial session cannot overwrite the recovery callback', async () => {
  const f = fixture(); f.emit('PASSWORD_RECOVERY'); f.finishSession(); await Promise.resolve()
  assert.equal(f.store.getSnapshot().recoveryUserId, 'family')
})
test('cancel, sign-out, or another account revoke recovery authorization', async () => {
  for (const revoke of [f => f.store.cancelRecovery(), f => f.emit('SIGNED_OUT', null), f => f.emit('SIGNED_IN', { id: 'other' })]) {
    const f = fixture(); f.emit('PASSWORD_RECOVERY'); revoke(f)
    await assert.rejects(f.store.setRecoveryPassword('new-test-password')); assert.equal(f.writes.length, 0)
  }
})
test('wrong-user or failed password update cannot complete setup', async () => {
  for (const response of [{ error: true }, { data: { user: { id: 'other' } } }]) {
    const f = fixture(); f.emit('PASSWORD_RECOVERY'); f.client.auth.updateUser = async () => response
    await assert.rejects(f.store.setRecoveryPassword('new-test-password'))
    assert.equal(f.store.getSnapshot().recoveryUserId, 'family')
  }
})
test('email setup requests use the account address and root callback, without unlocking anything', async () => {
  const f = fixture(); f.emit('SIGNED_IN')
  await sendParentPasswordLink(f.client, f.user.email, 'https://example.test')
  assert.deepEqual(f.emails, [['parent@example.test', { redirectTo: 'https://example.test/' }]])
  assert.equal(f.store.getSnapshot().recoveryUserId, null)
  f.client.auth.resetPasswordForEmail = async () => ({ error: true })
  await assert.rejects(sendParentPasswordLink(f.client, f.user.email, 'https://example.test'))
})

test('returning from a password manager preserves validated same-user recovery', async () => {
  const f = fixture(); f.emit('PASSWORD_RECOVERY'); f.emit('SIGNED_IN')
  assert.equal(f.store.getSnapshot().recoveryUserId, 'family')
  await f.store.setRecoveryPassword('new-test-password')
  assert.equal(f.writes.length, 1)
})
