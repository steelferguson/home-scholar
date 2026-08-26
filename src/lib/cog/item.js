import { targetSeconds } from './levels.js'

// The one shape every generator returns. `prompt` and `choices` are content
// objects the renderer switches on, so text and figure items share a player.
//
//   Content = { kind: 'text', text }
//           | { kind: 'figure', figure }        (see figures.js)
//           | { kind: 'matrix', cells, missing } (2x2 figure matrix)
//           | { kind: 'series', terms }         (numbers with a blank)

export const SUBTESTS = {
  verbal_analogies:     { battery: 'verbal',       label: 'Word Analogies',      pace: 1.0 },
  verbal_classification:{ battery: 'verbal',       label: 'Which Word Belongs',         pace: 0.9 },
  sentence_completion:  { battery: 'verbal',       label: 'Sentence Completion', pace: 1.1 },
  number_series:        { battery: 'quantitative', label: 'Number Series',       pace: 1.1 },
  number_analogies:     { battery: 'quantitative', label: 'Number Analogies',    pace: 1.1 },
  number_puzzles:       { battery: 'quantitative', label: 'Number Puzzles',      pace: 1.3 },
  figure_matrices:      { battery: 'nonverbal',    label: 'Figure Matrices',     pace: 1.2 },
  figure_classification:{ battery: 'nonverbal',    label: 'Which Shape Belongs',  pace: 1.0 },
  paper_folding:        { battery: 'nonverbal',    label: 'Paper Folding',       pace: 1.4 },
}

export const text = (t) => ({ kind: 'text', text: String(t) })

// Assemble the final item: drop duplicate distractors, shuffle, record where the
// answer landed. Returns null when there aren't enough distinct choices, which
// tells the generator to re-roll rather than ship a broken item.
export function buildItem({ subtest, level, seed, rng, prompt, correct, distractors, explain, key = JSON.stringify }) {
  const correctKey = key(correct)
  const seen = new Set([correctKey])
  const kept = []
  for (const d of distractors) {
    const k = key(d)
    if (seen.has(k)) continue
    seen.add(k)
    kept.push(d)
  }
  if (kept.length < 3) return null

  const choices = rng.shuffle([correct, ...kept.slice(0, 3)])
  return {
    id: `${subtest}:${level}:${seed}`,
    subtest,
    battery: SUBTESTS[subtest].battery,
    level,
    prompt,
    choices,
    answer: choices.findIndex((c) => key(c) === correctKey),
    explain,
    targetSeconds: targetSeconds(level, SUBTESTS[subtest].pace),
  }
}
