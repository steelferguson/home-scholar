// One store per signed-in user, shared by pages and background audio.
export function createProgressStore(client, userId) {
  let state = { progress: {}, loading: Boolean(userId), error: null }
  const listeners = new Set()
  const writes = new Map()
  const writtenVersions = new Map()
  let writeVersion = 0
  let loadVersion = 0
  let initialLoad = null
  let loadFailed = false
  const publish = changes => {
    state = { ...state, ...changes }
    listeners.forEach(listener => listener())
  }
  const performLoad = async () => {
    const version = ++loadVersion
    const startedAtWrite = writeVersion
    publish({ loading: Boolean(userId), error: null })
    if (!userId) return
    try {
      const { data, error } = await client.from('user_progress')
        .select('lesson_id, status, last_position_seconds, completed_at').eq('user_id', userId)
      if (error) throw new Error('Could not load progress')
      if (version === loadVersion) {
        loadFailed = false
        const progress = Object.fromEntries((data || []).map(row => [row.lesson_id, row]))
        // A response may predate a save that finished during this request.
        for (const [lessonId, writtenAt] of writtenVersions) {
          if (writtenAt > startedAtWrite) progress[lessonId] = state.progress[lessonId]
        }
        publish({
          progress,
          loading: false,
        })
      }
    } catch {
      if (version === loadVersion) {
        loadFailed = true
        publish({ loading: false, error: 'Your saved progress could not be loaded.' })
      }
    }
  }
  const load = () => { initialLoad = performLoad(); return initialLoad }
  const update = (lessonId, updates) => {
    if (!userId) return Promise.resolve()
    const task = (writes.get(lessonId) || Promise.resolve()).catch(() => {}).then(async () => {
      if (state.loading) await (initialLoad || load())
      if (loadFailed) throw new Error('Load your saved progress before saving changes.')
      // A replay or a delayed position save must never undo completion.
      const previous = state.progress[lessonId]
      const changes = previous?.status === 'completed' && updates.status === 'in_progress'
        ? { ...updates, status: 'completed', completed_at: previous.completed_at }
        : updates
      try {
        const { data, error } = await client.from('user_progress').upsert({
          user_id: userId, lesson_id: lessonId, ...changes, updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' }).select()
        if (error || !data?.[0]) throw new Error('Save failed')
        writtenVersions.set(lessonId, ++writeVersion)
        publish({ progress: { ...state.progress, [lessonId]: data[0] }, error: null })
      } catch {
        publish({ error: 'Your progress could not be saved. Please try again.' })
        throw new Error('Your progress could not be saved. Please try again.')
      }
    })
    writes.set(lessonId, task)
    // Remove only this write; a newer write may already be queued.
    const cleanup = () => { if (writes.get(lessonId) === task) writes.delete(lessonId) }
    task.then(cleanup, cleanup)
    return task
  }
  return {
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot: () => state,
    load,
    markComplete: lessonId => update(lessonId, { status: 'completed', completed_at: new Date().toISOString() }),
    savePosition: (lessonId, seconds) => Number.isFinite(seconds) && seconds >= 0
      ? update(lessonId, { status: 'in_progress', last_position_seconds: Math.floor(seconds) })
      : Promise.resolve(),
  }
}
