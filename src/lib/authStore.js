// Recovery authorization comes only from Supabase's validated recovery event.
// A URL, remembered login, or Google sign-in never authorizes a password change.
export function createAuthStore(client) {
  let state = { user: null, loading: true, recoveryUserId: null }
  let revision = 0
  let subscription
  const listeners = new Set()
  const publish = changes => { state = { ...state, ...changes }; listeners.forEach(fn => fn()) }
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn) },
    getSnapshot: () => state,
    start() {
      const initialRevision = revision
      const result = client.auth.onAuthStateChange((event, session) => {
        revision++
        const user = session?.user || null
        publish({ user, loading: false, recoveryUserId: event === 'PASSWORD_RECOVERY' && user
          ? user.id : ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event) && user?.id === state.recoveryUserId ? state.recoveryUserId : null })
      })
      subscription = result.data.subscription
      client.auth.getSession().then(({ data }) => {
        if (revision === initialRevision) publish({ user: data?.session?.user || null, loading: false })
      }).catch(() => { if (revision === initialRevision) publish({ loading: false }) })
    },
    stop() { revision++; subscription?.unsubscribe() },
    cancelRecovery() { publish({ recoveryUserId: null }) },
    async setRecoveryPassword(password) {
      const recoveryUserId = state.recoveryUserId
      if (!recoveryUserId || state.user?.id !== recoveryUserId) throw new Error('Open a new password setup link from your email.')
      if (password.length < 8) throw new Error('Use at least 8 characters.')
      const { data, error } = await client.auth.updateUser({ password })
      if (error || data?.user?.id !== recoveryUserId) throw new Error('Could not set your password. Try a stronger password or request a new email link.')
      if (state.recoveryUserId !== recoveryUserId || state.user?.id !== recoveryUserId) throw new Error('Your sign-in changed. Open a new email link.')
      publish({ recoveryUserId: null })
    },
  }
}

export async function sendParentPasswordLink(client, email, origin) {
  if (!email) throw new Error('This account has no email address for password setup.')
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/` })
  if (error) throw new Error('Could not send the email. Please wait a moment and try again.')
}
