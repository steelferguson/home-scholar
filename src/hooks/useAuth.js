import { useSyncExternalStore } from 'react'
import { supabase } from '../supabaseClient'
import { createAuthStore } from '../lib/authStore'

// Subscribe during module initialization, before the recovery callback can finish.
const store = createAuthStore(supabase)
store.start()
if (import.meta.hot) import.meta.hot.dispose(() => store.stop())

export function useAuth() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return {
    ...state,
    signInWithEmail: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUpWithEmail: (email, password) => supabase.auth.signUp({ email, password }),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
    signOut: () => supabase.auth.signOut(),
    setRecoveryPassword: store.setRecoveryPassword,
    cancelRecovery: store.cancelRecovery,
  }
}
