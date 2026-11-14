// Math Facts: single-digit addition (0+0..9+9) and the matching subtraction
// (0-0..18-9). A set is 20 fresh questions; facts a child misses come back
// more often. Pure functions so the rules can be unit tested.
export const SET_SIZE = 20
export const DECK_SLUG = 'math-facts'

export function allFacts(operation) {
  const facts = []
  for (let a = 0; a <= 9; a++) for (let b = 0; b <= 9; b++) {
    if (operation !== 'subtraction') facts.push({ key: `${a}+${b}`, a, b, op: '+', answer: a + b })
    if (operation !== 'addition') facts.push({ key: `${a + b}-${b}`, a: a + b, b, op: '-', answer: a })
  }
  return facts
}

// Weight 1 for a fresh fact; each miss adds more than each success takes away,
// so a fact a child misses twice shows up about three times as often.
export function factWeight(stat) {
  if (!stat) return 1
  return 1 + 3 * (stat.incorrect_count || 0) / (1 + (stat.correct_count || 0))
}

// Weighted sample without replacement. rng returns [0, 1).
export function buildSet(facts, stats = {}, size = SET_SIZE, rng = Math.random) {
  const pool = facts.map(fact => ({ fact, weight: factWeight(stats[fact.key]) }))
  const set = []
  while (set.length < size && pool.length) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0)
    let roll = rng() * total
    let index = pool.findIndex(item => (roll -= item.weight) < 0)
    if (index < 0) index = pool.length - 1
    set.push(pool.splice(index, 1)[0].fact)
  }
  return set
}

// A session walks the set; a wrong answer shows the right one and sends the
// fact to the end of the queue. The set is done when every fact is answered.
export function createSession(set) {
  const queue = [...set]
  const results = {} // key -> { correct: first-try boolean, misses }
  let answered = 0
  return {
    get current() { return queue[0] || null },
    get total() { return set.length },
    get answered() { return answered },
    get done() { return queue.length === 0 },
    answer(value) {
      const fact = queue.shift()
      if (!fact) return null
      const correct = Number(value) === fact.answer
      const entry = results[fact.key] ||= { correct: true, misses: 0 }
      if (correct) answered++
      else { entry.correct = false; entry.misses++; queue.push(fact) }
      return { fact, correct }
    },
    summary() {
      const keys = Object.keys(results)
      return { total: set.length, firstTry: keys.filter(key => results[key].correct).length, results }
    },
  }
}

// Merge a session's results into stored stats rows for upsert.
export function statRows(summary, existing = {}) {
  return Object.entries(summary.results).map(([key, entry]) => ({
    card_key: key,
    correct_count: (existing[key]?.correct_count || 0) + (entry.correct ? 1 : 0),
    incorrect_count: (existing[key]?.incorrect_count || 0) + entry.misses,
  }))
}
