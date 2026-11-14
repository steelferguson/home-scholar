// Offline browser fixture: all auth and data stay in this browser.
import { supabase as coursesBackend } from './fixtures/supabase'
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
  from(table) {
    if (!['profiles','user_progress','player_state','quiz_results','course_assignments','flashcard_decks','flashcard_progress'].includes(table)) return coursesBackend.from(table)
    const key = `fixture:${table}`
    let rows = JSON.parse(localStorage.getItem(key) || 'null') || (table === 'profiles' ? initial : table === 'flashcard_decks' ? [{ id: 'deck-math', slug: 'math-facts' }] : [])
    let filters = [], payload, single = false, remove = false
    const query = {
      select: () => query, order: () => query,
      eq: (field, value) => { filters.push([field,value]); return query },
      single: () => { single = true; return query }, maybeSingle: () => { single = true; return query },
      insert: value => { payload = { id: crypto.randomUUID(), ...value }; return query },
      delete: () => { remove = true; return query },
      upsert: value => { payload = value; return query },
      // flashcard_progress upserts a batch keyed by card; everything else is one row keyed by lesson.
      then: resolve => {
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
