// The authenticated parent session persists until a child is selected.
// Parent controls opened from a child require fresh authentication and stay temporary.
export function createFamilyStore(client, user, storage) {
  const key = `home-scholar:profile:${user.id}`
  const childKey = `home-scholar:child:${user.id}`
  let state = { profiles: [], assignments: {}, active: null, unlocked: false, loading: true, error: null }
  let generation = 0
  const listeners = new Set()
  const publish = changes => { state = { ...state, ...changes }; listeners.forEach(fn => fn()) }
  const remembered = () => {
    try { return state.profiles.find(p => p.id === storage.getItem(childKey) && p.role === 'child') || null }
    catch { return null }
  }
  const lock = () => {
    generation++
    const active = state.active?.role === 'child' ? state.active : remembered()
    storage.setItem(key, active?.id || 'locked')
    publish({ unlocked: false, active })
  }
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn) },
    getSnapshot: () => state,
    lock,
    background() {
      generation++
      // Screen lock and app switching must not stop a parent's listening session.
      if (state.active?.role !== 'parent') publish({ unlocked: false })
    },
    async load() {
      publish({ loading: true, error: null })
      try {
        const [{ data, error }, assigned] = await Promise.all([
          client.from('profiles').select('id,user_id,name,role,avatar_color').eq('user_id', user.id).order('created_at'),
          client.from('course_assignments').select('profile_id,course_id'),
        ])
        if (error || assigned.error) throw error || assigned.error
        const profiles = data || []
        const assignments = {}
        for (const row of assigned.data || []) (assignments[row.profile_id] ||= []).push(row.course_id)
        const saved = storage.getItem(key)
        const legacyChild = storage.getItem(childKey)
        const active = saved != null
          ? profiles.find(p => p.id === saved) || null
          : legacyChild != null
            ? profiles.find(p => p.id === legacyChild && p.role === 'child') || null
            : profiles.find(p => p.role === 'parent') || null
        const unlocked = active?.role === 'parent' || (saved == null && legacyChild == null)
        publish({ profiles, assignments, active, unlocked, loading: false })
      } catch { publish({ loading: false, error: 'Could not load your family. Please try again.' }) }
    },
    async unlock(password) {
      const attempt = ++generation
      const { data, error } = await client.auth.signInWithPassword({ email: user.email, password })
      if (attempt !== generation || error || data?.user?.id !== user.id) throw new Error('Parent sign-in failed. Check your password and try again.')
      publish({ unlocked: true })
    },
    select(profileId) {
      const active = state.profiles.find(p => p.id === profileId)
      const switchingKids = state.active?.role === 'child' && active?.role === 'child'
      if (!state.unlocked && !switchingKids) throw new Error('Parent sign-in required.')
      if (!active) throw new Error('Choose a family member.')
      // Persist before switching; a storage failure must not claim success.
      if (active.role === 'child') {
        storage.setItem(childKey, active.id)
        generation++
      }
      storage.setItem(key, active.id)
      publish({ active, unlocked: active.role === 'parent' })
    },
    async create(name, role = 'child') {
      if (!state.unlocked) throw new Error('Parent sign-in required.')
      if (!name.trim() || !['parent', 'child'].includes(role)) throw new Error('Enter a name.')
      const attempt = generation
      const { data, error } = await client.from('profiles').insert({ user_id: user.id, name: name.trim(), role }).select('id,user_id,name,role,avatar_color').single()
      if (error || !data) throw new Error('Could not add this profile. Please try again.')
      if (attempt === generation) publish({ profiles: [...state.profiles, data] })
      else await this.load()
    },
    async assign(profileId, courseId, assigned) {
      if (!state.unlocked) throw new Error('Parent sign-in required.')
      if (!state.profiles.some(p => p.id === profileId)) throw new Error('Choose a family member.')
      const { error } = assigned
        ? await client.from('course_assignments').insert({ profile_id: profileId, course_id: courseId })
        : await client.from('course_assignments').delete().eq('profile_id', profileId).eq('course_id', courseId)
      if (error) throw new Error('Could not update this course. Please try again.')
      const current = (state.assignments[profileId] || []).filter(id => id !== courseId)
      publish({ assignments: { ...state.assignments, [profileId]: assigned ? [...current, courseId] : current } })
    },
  }
}
