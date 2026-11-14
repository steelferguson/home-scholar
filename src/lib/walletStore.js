// Balances for every child in the family, plus the two writes: an award
// (decided by the database function award_wallet) and a parent adjustment.
export function createWalletStore(client, userId) {
  let state = { summaries: {}, entries: {}, loading: true, error: null }
  const listeners = new Set()
  const publish = changes => { state = { ...state, ...changes }; listeners.forEach(fn => fn()) }
  const summaryOf = profileId => state.summaries[profileId] || { balance: 0, earnedToday: 0, cap: 50 }
  const shape = row => ({ balance: row.balance, earnedToday: row.earned_today, cap: row.cap })
  return {
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn) },
    getSnapshot: () => state,
    summaryOf,
    async load() {
      publish({ loading: true, error: null })
      const [summary, recent] = await Promise.all([
        client.rpc('wallet_summary'),
        client.from('wallet_entries').select('id,profile_id,cents,kind,reason,created_at,lesson:lessons(title)').order('created_at', { ascending: false }).limit(60),
      ])
      if (summary.error || recent.error) { publish({ loading: false, error: 'Could not load the wallet.' }); return }
      const summaries = Object.fromEntries((summary.data || []).map(row => [row.profile_id, shape(row)]))
      const entries = {}
      for (const row of recent.data || []) (entries[row.profile_id] ||= []).push(row)
      publish({ summaries, entries, loading: false })
    },
    // Returns { cents, earnedToday, cap } or null when this profile cannot earn.
    async award(profile, kind, lessonId = null) {
      if (!profile || profile.role !== 'child') return null
      const { data, error } = await client.rpc('award_wallet', { p_profile_id: profile.id, p_kind: kind, p_lesson_id: lessonId })
      const row = Array.isArray(data) ? data[0] : data
      if (error || !row) throw new Error('Your money could not be saved. Please ask a parent to check the connection.')
      const result = { cents: row.cents, earnedToday: row.earned_today, cap: row.cap }
      const previous = summaryOf(profile.id)
      const entry = row.cents > 0 ? [{ id: `local-${Date.now()}`, profile_id: profile.id, cents: row.cents, kind: row.kind || kind, created_at: new Date().toISOString() }] : []
      publish({
        summaries: { ...state.summaries, [profile.id]: { ...result, balance: previous.balance + row.cents } },
        entries: { ...state.entries, [profile.id]: [...entry, ...(state.entries[profile.id] || [])] },
      })
      return result
    },
    async adjust(profileId, cents, reason) {
      if (!Number.isInteger(cents) || cents === 0) throw new Error('Enter an amount in cents, like 25 or -10.')
      if (!reason?.trim()) throw new Error('Give a reason for the change.')
      const { data, error } = await client.from('wallet_entries').insert({ user_id: userId, profile_id: profileId, cents, kind: 'adjustment', reason: reason.trim() }).select().single()
      if (error || !data) throw new Error('Could not save the adjustment. Please try again.')
      const previous = summaryOf(profileId)
      publish({
        summaries: { ...state.summaries, [profileId]: { ...previous, balance: previous.balance + cents } },
        entries: { ...state.entries, [profileId]: [data, ...(state.entries[profileId] || [])] },
      })
    },
  }
}
