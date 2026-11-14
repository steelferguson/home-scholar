// Offline browser fixture: all auth and data stay in this browser.
import { supabase as coursesBackend } from './fixtures/supabase'
import { awardCents, chicagoDate } from '../src/lib/wallet'
const user = { id: 'family', email: 'parent@example.test' }
const initial = [{ id: 'zinc', user_id: 'family', name: 'Zinc', role: 'child' }, { id: 'rush', user_id: 'family', name: 'Rush', role: 'child' }, { id: 'parent', user_id: 'family', name: 'Parent', role: 'parent' }]
const listeners = new Set()
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user } } }),
    onAuthStateChange: fn => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } } },
    signInWithPassword: async ({ password }) => {
      if (password !== 'test-parent-password') return { error: true }
      listeners.forEach(fn => fn('SIGNED_IN', { user: { ...user } }))
      return { data: { user, session: { user } } }
    },
    signOut: async () => { listeners.forEach(fn => fn('SIGNED_OUT', null)); return {} },
  },
  // Mirrors award_wallet() and wallet_summary() from scripts/setup_wallet.sql.
  rpc: async (name, args = {}) => {
    const key = 'fixture:wallet_entries'
    const rows = JSON.parse(localStorage.getItem(key) || '[]')
    const today = profileId => rows.filter(r => r.profile_id === profileId && r.kind !== 'adjustment' && chicagoDate(new Date(r.created_at)) === chicagoDate()).reduce((sum, r) => sum + r.cents, 0)
    if (name === 'wallet_summary') {
      const profiles = JSON.parse(localStorage.getItem('fixture:profiles') || 'null') || initial
      return { data: profiles.filter(p => p.role === 'child').map(p => ({ profile_id: p.id, balance: rows.filter(r => r.profile_id === p.id).reduce((sum, r) => sum + r.cents, 0), earned_today: today(p.id), cap: 50 })) }
    }
    if (name === 'award_wallet') {
      const paid = rows.some(r => r.profile_id === args.p_profile_id && r.lesson_id === args.p_lesson_id && r.kind === 'lesson')
      const result = awardCents({ kind: args.p_kind, alreadyPaidLesson: args.p_kind === 'lesson' && paid, earnedToday: today(args.p_profile_id) })
      if (result.cents > 0) { rows.push({ id: crypto.randomUUID(), user_id: user.id, profile_id: args.p_profile_id, cents: result.cents, kind: result.kind, lesson_id: args.p_lesson_id, created_at: new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(rows)) }
      return { data: [{ cents: result.cents, earned_today: result.earnedToday, cap: result.cap }] }
    }
    return { error: { message: `fixture: unknown rpc ${name}` } }
  },
  from(table) {
    if (!['profiles','user_progress','player_state','quiz_results','course_assignments','flashcard_decks','flashcard_progress','wallet_entries'].includes(table)) return coursesBackend.from(table)
    const key = `fixture:${table}`
    let rows = JSON.parse(localStorage.getItem(key) || 'null') || (table === 'profiles' ? initial : table === 'flashcard_decks' ? [{ id: 'deck-math', slug: 'math-facts' }] : [])
    let filters = [], payload, single = false, remove = false
    const query = {
      select: () => query, order: () => query, limit: () => query,
      eq: (field, value) => { filters.push([field,value]); return query },
      single: () => { single = true; return query }, maybeSingle: () => { single = true; return query },
      insert: value => { payload = { id: crypto.randomUUID(), ...value }; return query },
      delete: () => { remove = true; return query },
      upsert: value => { payload = value; return query },
      // flashcard_progress upserts a batch keyed by card; everything else is one row keyed by lesson.
      then: resolve => {
        if (payload && table === 'wallet_entries') {
          const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload }
          rows.push(row); localStorage.setItem(key, JSON.stringify(rows))
          return Promise.resolve({ data: single ? row : [row] }).then(resolve)
        }
        if (remove) {
          rows = rows.filter(row => !filters.every(([k,v]) => row[k] === v)); localStorage.setItem(key, JSON.stringify(rows))
        } else if (payload) {
          for (const item of Array.isArray(payload) ? payload : [payload]) {
            rows = rows.filter(row => !(row.profile_id === item.profile_id && (item.card_key ? row.card_key === item.card_key : row.lesson_id === item.lesson_id) && table !== 'profiles'))
            rows.push(item)
          }
          localStorage.setItem(key, JSON.stringify(rows))
        }
        const data = payload ? (Array.isArray(payload) ? payload : [payload]) : rows.filter(row => filters.every(([k,v]) => row[k] === v))
        return Promise.resolve({ data: single ? data[0] || null : data }).then(resolve)
      },
    }; return query
  },
}
