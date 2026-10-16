// Local-only fixture backend. No credentials, external requests, or production writes.
const courses = [
  { id: 'spanish', slug: 'spanish', title: 'Spanish — Unit 1', description: 'Find your voice in Spanish. Build everyday conversation skills, one listening session at a time.' },
  { id: 'harmony', slug: 'harmony', title: 'Harmony & Music Theory', description: 'Hear how music works. Explore rhythm, chords, and the ideas that bring a song to life.' },
  { id: 'ai', slug: 'ai', title: 'AI Systems Design', description: 'Big ideas, made practical. Step through how modern AI systems fit together.' },
  { id: 'czech', slug: 'czech', title: 'Czech — Unit 2', description: 'Keep the conversation going with immersive audio lessons for everyday Czech.' },
  { id: 'python', slug: 'python', title: 'Practical Python', description: 'Learn by doing. Short visual walkthroughs to sharpen your coding fluency.' },
  { id: 'kids', slug: 'kids', title: 'Spanish Quest', description: 'A little adventure in every lesson. Listen, discover new words, and play.', audience: 'kids' },
]
const lessons = courses.flatMap(course => Array.from({ length: 4 }, (_, i) => ({
  id: `${course.id}-${i + 1}`, course_id: course.id, lesson_number: i + 1,
  title: ['A new beginning', 'The building blocks', 'Putting it into practice', 'Your next step'][i],
  lesson_type: ['ai', 'python'].includes(course.id) ? 'visual' : course.id === 'kids' ? 'quiz_game' : 'audio',
  audio_url: '/tests/tone.wav', duration_minutes: 2,
  content_url: '/tests/visual.json',
})))
const progress = [{ lesson_id: 'spanish-1', status: 'completed', completed_at: '2026-10-01' }, { lesson_id: 'spanish-2', status: 'in_progress', last_position_seconds: 20 }]
let scenario = 'normal'
let hold = false
const user = { id: 'fixture-learner', email: 'learner@example.test' }
const listeners = new Set()
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
export const fixture = {
  setScenario: value => { scenario = value },
  hold: value => { hold = value },
}
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user } } }),
    onAuthStateChange: callback => { listeners.add(callback); return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } } },
    signOut: async () => { listeners.forEach(callback => callback('SIGNED_OUT', null)); return {} },
    signInWithPassword: async () => { listeners.forEach(callback => callback('SIGNED_IN', { user })); return { data: { session: { user } } } },
    signUp: async () => ({ data: { session: null } }),
    signInWithOAuth: async () => ({ error: { message: 'Fixture: OAuth is unavailable.' } }),
  },
  from: table => {
    let filters = [], single = false, payload
    const chain = {
      select: () => chain,
      eq: (field, value) => { filters.push([field, value]); return chain },
      order: () => chain,
      single: () => { single = true; return chain },
      maybeSingle: () => { single = true; return chain },
      upsert: value => { payload = value; return chain },
      then: (resolve, reject) => (async () => {
        while (hold) await wait(30)
        await wait(80)
        if (scenario === 'error' || (scenario === 'progress-error' && table === 'user_progress')) return { data: null, error: { message: 'Fixture request failed' } }
        if (payload) {
          const index = progress.findIndex(row => row.lesson_id === payload.lesson_id)
          if (index >= 0) progress[index] = { ...progress[index], ...payload }
          else progress.push(payload)
          return { data: [progress.find(row => row.lesson_id === payload.lesson_id)] }
        }
        let data = scenario === 'empty' ? [] : table === 'courses' ? courses : table === 'lessons' ? lessons : progress
        data = data.filter(row => filters.every(([field, value]) => field === 'user_id' || row[field] === value))
        return { data: single ? data[0] || null : data.map(row => ({ ...row })) }
      })().then(resolve, reject),
    }
    return chain
  },
}
