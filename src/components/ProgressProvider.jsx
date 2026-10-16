import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { supabase } from '../supabaseClient'
import { createProgressStore } from '../lib/progressStore'
import { ProgressContext } from '../hooks/useProgress'

export default function ProgressProvider({ userId, children }) {
  const store = useMemo(() => createProgressStore(supabase, userId), [userId])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => { store.load() }, [store])
  const value = useMemo(() => ({ ...state, savePosition: store.savePosition,
    markComplete: store.markComplete, retry: store.load }), [state, store])
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
