// Parent authorization lives only in memory. Only a child's identity is remembered.
export function createFamilyStore(client, user, storage) {
  const key = `home-scholar:child:${user.id}`
  let state = { profiles: [], active: null, unlocked: false, loading: true, error: null }
  let generation = 0
  const listeners = new Set()
  const publish = changes => { state = { ...state, ...changes }; listeners.forEach(fn => fn()) }
  const remembered = () => {
    try { return state.profiles.find(p => p.id === storage.getItem(key) && p.role === 'child') || null }
    catch { return null }
  }
  const lock = () => {
    generation++
    publish({ unlocked: false, active: state.active?.role === 'child' ? state.active : remembered() })
  }
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn) },
    getSnapshot: () => state,
    lock,
    async load() {
      publish({ loading: true, error: null })
      try {
        const { data, error } = await client.from('profiles').select('id,user_id,name,role,avatar_color').eq('user_id', user.id).order('created_at')
        if (error) throw error
        publish({ profiles: data || [], loading: false })
        publish({ active: remembered() })
      } catch { publish({ loading: false, error: 'Could not load your family. Please try again.' }) }
    },
    async unlock(password) {
      const attempt = ++generation
      const { data, error } = await client.auth.signInWithPassword({ email: user.email, password })
      if (attempt !== generation || error || data?.user?.id !== user.id) throw new Error('Parent sign-in failed. Check your password and try again.')
      publish({ unlocked: true })
    },
    select(profileId) {
      if (!state.unlocked) throw new Error('Parent sign-in required.')
      const active = state.profiles.find(p => p.id === profileId)
      if (!active) throw new Error('Choose a family member.')
      if (active.role === 'child') {
        // Fail visibly if the device cannot remember the child.
        storage.setItem(key, active.id)
        generation++
      }
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
  }
}
