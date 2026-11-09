import { supabase as profiles } from './profile-backend'
const user = { id: 'family', email: 'parent@example.test' }
const listeners = new Set()
let password = null
export const recoveryFixture = {
  emails: 0,
  updates: 0,
  deliver: () => listeners.forEach(fn => fn('PASSWORD_RECOVERY', { user })),
}
export const supabase = { ...profiles, auth: {
  getSession: async () => ({ data: { session: { user } } }),
  onAuthStateChange: fn => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } } },
  resetPasswordForEmail: async () => { recoveryFixture.emails++; return {} },
  updateUser: async value => { password = value.password; recoveryFixture.updates++; listeners.forEach(fn => fn('USER_UPDATED', { user })); return { data: { user } } },
  signInWithPassword: async value => value.password === password ? { data: { user } } : { error: true },
} }
