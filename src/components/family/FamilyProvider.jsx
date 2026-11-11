import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { supabase } from '../../supabaseClient'
import { createFamilyStore } from '../../lib/familyStore'
import { FamilyContext } from '../../hooks/useFamily'

export default function FamilyProvider({ user, children }) {
  const { id, email } = user
  const store = useMemo(() => createFamilyStore(supabase, { id, email }, localStorage), [id, email])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => { store.load() }, [store])
  useEffect(() => {
    const lock = () => store.background()
    const onVisibility = () => { if (document.hidden) lock() }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', lock)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', lock)
    }
  }, [store])
  const value = { ...state, store }
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
}
