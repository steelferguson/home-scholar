import test from 'node:test'
import assert from 'node:assert/strict'
import { createProgressStore } from '../src/lib/progressStore.js'

function clientFixture({ rows = [], fail = false } = {}) {
  const written = []
  const client = { from: () => ({
    select: () => ({ eq: async () => ({ data: rows, error: fail }) }),
    upsert: payload => ({ select: async () => {
      written.push(payload)
      await new Promise(resolve => setTimeout(resolve, 1))
      return { data: fail ? null : [payload], error: fail }
    } }),
  }) }
  return { client, written }
}
test('a position save after completion does not un-complete the lesson', async () => {
  const { client, written } = clientFixture()
  const store = createProgressStore(client, 'learner')
  await store.load()
  await Promise.all([store.markComplete('lesson'), store.savePosition('lesson', 42)])
  assert.equal(written.at(-1).status, 'completed')
  assert.equal(store.getSnapshot().progress.lesson.status, 'completed')
})
test('the latest seek wins when progress saves overlap', async () => {
  const { client } = clientFixture()
  const store = createProgressStore(client, 'learner')
  await Promise.all([store.savePosition('lesson', 120), store.savePosition('lesson', 30)])
  assert.equal(store.getSnapshot().progress.lesson.last_position_seconds, 30)
})
test('a failed progress load and failed save are visible', async () => {
  const { client } = clientFixture({ fail: true })
  const store = createProgressStore(client, 'learner')
  await store.load()
  assert.equal(store.getSnapshot().loading, false)
  assert.ok(store.getSnapshot().error)
  await assert.rejects(store.savePosition('lesson', 30))
  assert.ok(store.getSnapshot().error)
  assert.equal(store.getSnapshot().progress.lesson, undefined)
})
test('position saves wait for initial progress so replays preserve completion', async () => {
  let finishLoad
  const { client, written } = clientFixture()
  const from = client.from
  client.from = () => ({ ...from(), select: () => ({ eq: () => new Promise(resolve => { finishLoad = resolve }) }) })
  const store = createProgressStore(client, 'learner')
  const loading = store.load()
  const saving = store.savePosition('lesson', 90)
  await new Promise(resolve => setTimeout(resolve, 0))
  assert.equal(written.length, 0)
  finishLoad({ data: [{ lesson_id: 'lesson', status: 'completed', last_position_seconds: 4, completed_at: '2026-10-01' }] })
  await Promise.all([loading, saving])
  assert.equal(store.getSnapshot().progress.lesson.last_position_seconds, 90)
  assert.equal(written[0].status, 'completed')
})

test('retry replaces cached progress with the latest server completion', async () => {
  let rows = [{ lesson_id: 'lesson', status: 'in_progress', last_position_seconds: 10 }]
  const { client, written } = clientFixture()
  const from = client.from
  client.from = () => ({ ...from(), select: () => ({ eq: async () => ({ data: rows }) }) })
  const store = createProgressStore(client, 'learner')
  await store.load()
  rows = [{ lesson_id: 'lesson', status: 'completed', last_position_seconds: 50, completed_at: '2026-10-16' }]
  await store.load()
  assert.equal(store.getSnapshot().progress.lesson.status, 'completed')
  assert.equal(store.getSnapshot().progress.lesson.last_position_seconds, 50)
  await store.savePosition('lesson', 60)
  assert.equal(written.at(-1).status, 'completed')
})

test('retry removes cached rows that are no longer on the server', async () => {
  let rows = [{ lesson_id: 'lesson', status: 'in_progress', last_position_seconds: 10 }]
  const client = { from: () => ({ select: () => ({ eq: async () => ({ data: rows }) }) }) }
  const store = createProgressStore(client, 'learner')
  await store.load()
  rows = []
  await store.load()
  assert.deepEqual(store.getSnapshot().progress, {})
})

test('a refresh cannot overwrite a completion saved while its request was pending', async () => {
  let finishWrite, finishRefresh
  let refreshing = false
  const client = { from: () => ({
    select: () => ({ eq: () => refreshing
      ? new Promise(resolve => { finishRefresh = resolve })
      : Promise.resolve({ data: [] }) }),
    upsert: payload => ({ select: () => new Promise(resolve => { finishWrite = () => resolve({ data: [payload] }) }) }),
  }) }
  const store = createProgressStore(client, 'learner')
  await store.load()
  const saving = store.markComplete('lesson')
  await new Promise(resolve => setTimeout(resolve, 0))
  refreshing = true
  const loading = store.load()
  finishWrite()
  await saving
  finishRefresh({ data: [{ lesson_id: 'lesson', status: 'in_progress', last_position_seconds: 10 }] })
  await loading
  assert.equal(store.getSnapshot().progress.lesson.status, 'completed')
})
