import test from 'node:test'
import assert from 'node:assert/strict'
import { createFamilyStore } from '../src/lib/familyStore.js'
import { createProgressStore } from '../src/lib/progressStore.js'
import { visibleCourses, isAssigned } from '../src/lib/courseAccess.js'

const profiles = [{ id: 'zinc', user_id: 'family', name: 'Zinc', role: 'child' }, { id: 'rush', user_id: 'family', name: 'Rush', role: 'child' }, { id: 'parent', user_id: 'family', name: 'Parent', role: 'parent' }]
function fixture(saved = 'zinc', assigned = [{ profile_id: 'zinc', course_id: 'spanish-kids' }]) {
  const memory = new Map([['home-scholar:child:family', saved]])
  const storage = { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) }
  const assignments = [...assigned]
  const client = {
    auth: { signInWithPassword: async ({ password }) => password === 'test-parent-password' ? { data: { user: { id: 'family' } } } : { error: true } },
    from: table => table === 'course_assignments' ? assignmentsTable(assignments) : ({ select: () => ({ eq: () => ({ order: async () => ({ data: profiles }) }) }) }),
  }
  const create = () => createFamilyStore(client, { id: 'family', email: 'parent@example.test' }, storage)
  return { create, client, storage, assignments }
}
function assignmentsTable(rows) {
  const filters = []; let insert, remove = false
  const query = {
    select: () => query,
    insert: value => { insert = value; return query },
    delete: () => { remove = true; return query },
    eq: (key, value) => { filters.push([key, value]); return query },
    then: resolve => {
      if (insert) rows.push(insert)
      if (remove) for (let i = rows.length - 1; i >= 0; i--) if (filters.every(([k, v]) => rows[i][k] === v)) rows.splice(i, 1)
      return Promise.resolve({ data: insert ? [insert] : rows.map(row => ({ ...row })) }).then(resolve)
    },
  }
  return query
}
test('reopening remembers the child but never parent authorization', async () => {
  const { create } = fixture()
  const first = create(); await first.load(); await first.unlock('test-parent-password'); first.select('rush')
  const reopened = create(); await reopened.load()
  assert.equal(reopened.getSnapshot().active.id, 'rush')
  assert.equal(reopened.getSnapshot().unlocked, false)
})
test('missing and wrong passwords cannot unlock or switch children', async () => {
  const { create } = fixture(); const store = create(); await store.load()
  for (const password of ['', 'wrong']) await assert.rejects(store.unlock(password))
  assert.throws(() => store.select('rush'))
  await assert.rejects(store.create('Other'))
  assert.equal(store.getSnapshot().active.id, 'zinc')
})
test('explicit lock returns to the child and invalid legacy selections stay locked', async () => {
  const { create } = fixture(); const store = create(); await store.load(); await store.unlock('test-parent-password'); store.select('parent'); store.lock()
  assert.equal(store.getSnapshot().active.id, 'zinc')
  assert.equal(store.getSnapshot().unlocked, false)
  for (const invalid of ['parent', 'unknown']) {
    const other = fixture(invalid).create(); await other.load(); assert.equal(other.getSnapshot().active, null)
  }
})
test('backgrounding during a parent sign-in invalidates its late success', async () => {
  const { create, client } = fixture(); let finish
  client.auth.signInWithPassword = () => new Promise(resolve => { finish = resolve })
  const store = create(); await store.load(); const pending = store.unlock('test-parent-password'); store.background()
  finish({ data: { user: { id: 'family' } } }); await assert.rejects(pending)
  assert.equal(store.getSnapshot().unlocked, false)
})
test('successful authentication for a different user does not unlock parent controls', async () => {
  const { create, client } = fixture(); client.auth.signInWithPassword = async () => ({ data: { user: { id: 'other-family' } } })
  const store = create(); await store.load(); await assert.rejects(store.unlock('test-parent-password'))
})
test('profile load failures remain locked and visible', async () => {
  const { create, client } = fixture(); client.from = () => ({ select: () => ({ eq: () => ({ order: async () => ({ error: true }) }) }) })
  const store = create(); await store.load(); assert.ok(store.getSnapshot().error); assert.equal(store.getSnapshot().active, null)
})
test('two children save the same lesson without sharing progress, including reload', async () => {
  const rows = []
  const client = { from: () => {
    const filters = []; let payload
    const query = {
      select: () => query,
      eq: (key, value) => { filters.push([key,value]); return query },
      upsert: (value, options) => { assert.equal(options.onConflict, 'profile_id,lesson_id'); payload = value; return query },
      then: resolve => {
        if (payload) {
          const index = rows.findIndex(row => row.profile_id === payload.profile_id && row.lesson_id === payload.lesson_id)
          if (index < 0) rows.push(payload); else rows[index] = { ...rows[index], ...payload }
        }
        return Promise.resolve({ data: payload ? [payload] : rows.filter(row => filters.every(([k,v]) => row[k] === v)) }).then(resolve)
      },
    }; return query
  } }
  const zinc = createProgressStore(client, 'family', 'zinc'), rush = createProgressStore(client, 'family', 'rush')
  await zinc.markComplete('shared-lesson'); await rush.savePosition('shared-lesson', 25)
  await Promise.all([zinc.load(), rush.load()])
  assert.equal(zinc.getSnapshot().progress['shared-lesson'].status, 'completed')
  assert.equal(rush.getSnapshot().progress['shared-lesson'].status, 'in_progress')
  assert.equal(rush.getSnapshot().progress['shared-lesson'].last_position_seconds, 25)
})

test('a child sees only assigned courses; parents and the unassigned see all or none', () => {
  const courses = [{ id: 'spanish-kids' }, { id: 'czech' }, { id: 'math' }]
  const assignments = { zinc: ['spanish-kids', 'math'] }
  assert.deepEqual(visibleCourses(courses, profiles[0], assignments).map(c => c.id), ['spanish-kids', 'math'])
  assert.deepEqual(visibleCourses(courses, profiles[1], assignments), [])
  assert.equal(visibleCourses(courses, profiles[2], assignments).length, 3)
  assert.equal(visibleCourses(courses, null, assignments).length, 3)
  assert.equal(isAssigned(profiles[1], assignments, 'czech'), false)
})
test('assignments load with the family and only an unlocked parent can change them', async () => {
  const { create, assignments } = fixture(); const store = create(); await store.load()
  assert.deepEqual(store.getSnapshot().assignments, { zinc: ['spanish-kids'] })
  await assert.rejects(store.assign('rush', 'spanish-kids', true))
  assert.equal(assignments.length, 1)
  await store.unlock('test-parent-password')
  await store.assign('rush', 'spanish-kids', true); await store.assign('rush', 'math', true)
  assert.deepEqual(store.getSnapshot().assignments.rush, ['spanish-kids', 'math'])
  await store.assign('rush', 'spanish-kids', false)
  assert.deepEqual(store.getSnapshot().assignments.rush, ['math'])
  assert.deepEqual(assignments.map(r => `${r.profile_id}:${r.course_id}`), ['zinc:spanish-kids', 'rush:math'])
  await assert.rejects(store.assign('stranger', 'math', true))
  const reopened = create(); await reopened.load()
  assert.deepEqual(reopened.getSnapshot().assignments, { zinc: ['spanish-kids'], rush: ['math'] })
})
test('a failed assignment write changes nothing and surfaces an error', async () => {
  const { create, client } = fixture(); const store = create(); await store.load(); await store.unlock('test-parent-password')
  const real = client.from; client.from = table => table === 'course_assignments' ? { insert: () => ({ then: resolve => Promise.resolve({ error: true }).then(resolve) }) } : real(table)
  await assert.rejects(store.assign('rush', 'math', true), /Could not update/)
  assert.equal(store.getSnapshot().assignments.rush, undefined)
})
test('an assignments load failure keeps the family locked and visible as an error', async () => {
  const { create, client } = fixture(); const real = client.from
  client.from = table => table === 'course_assignments' ? { select: () => ({ then: resolve => Promise.resolve({ error: true }).then(resolve) }) } : real(table)
  const store = create(); await store.load(); assert.ok(store.getSnapshot().error); assert.equal(store.getSnapshot().active, null)
})
