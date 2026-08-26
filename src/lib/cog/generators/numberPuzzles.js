import { buildItem, text } from '../item.js'

// Equations with a missing value, and at higher levels a shape standing for a
// number that must be resolved first.
//
//   Level 1-3   7 + ? = 12
//   Level 4-6   ? - 4 = 9      (and larger operands)
//   Level 7-9   △ = 5,  △ + 6 = ?
//   Level 10-12 △ = 4, □ = 3,  △ x □ + 2 = ?
//
// The distractors are the arithmetic a kid actually produces: the inverse
// operation, the symbol's own value handed back, and off-by-one.

const SYMBOLS = ['△', '□', '◇', '☆']

const forms = {
  // 7 + ? = 12  /  ? - 4 = 9
  //
  // The blank is always INSIDE the equation, never the result. "24 - 10 = ___"
  // is arithmetic homework; finding the missing part is the reasoning step this
  // subtest is actually about. Operands stay small for the same reason -- two
  // digit borrowing measures stamina, not thinking.
  missingOperand: (rng, level) => {
    const max = level <= 2 ? 12 : level <= 4 ? 20 : 30
    const a = rng.int(2, max)
    const b = rng.int(2, max)
    const total = a + b
    const subtract = level >= 4 && rng.next() < 0.4
    const blankFirst = rng.next() < 0.5

    const question = subtract
      ? (blankFirst ? `___ - ${b} = ${a}` : `${total} - ___ = ${a}`)
      : (blankFirst ? `___ + ${b} = ${total}` : `${a} + ___ = ${total}`)

    const correct = subtract
      ? (blankFirst ? total : b)
      : (blankFirst ? a : b)

    return {
      givens: [],
      question,
      correct,
      distractors: [
        correct + 1,
        correct - 1,
        subtract ? a + b : Math.abs(a - b), // ran the opposite operation
        total,
      ],
      explain: `${question.replace('___', correct)} — find what has to fill the blank to keep both sides equal.`,
    }
  },

  // △ = 5,  △ + 6 = ?
  oneSymbol: (rng, level) => {
    const sym = rng.pick(SYMBOLS)
    const value = rng.int(2, level >= 10 ? 12 : 9)
    const other = rng.int(2, level >= 10 ? 12 : 9)
    // By the top levels a one-symbol item should rarely be plain addition.
    const times = level >= 9 && rng.next() < (level >= 11 ? 0.8 : 0.5)
    const correct = times ? value * other : value + other
    return {
      givens: [`${sym} = ${value}`],
      question: `${sym} ${times ? 'x' : '+'} ${other} = ___`,
      correct,
      distractors: [value, other, correct + other, times ? value + other : value * other, correct + 1],
      explain: `${sym} is ${value}, so ${value} ${times ? 'x' : '+'} ${other} = ${correct}.`,
    }
  },

  // △ = 4, □ = 3,  △ x □ + 2 = ?
  twoSymbols: (rng) => {
    const [s1, s2] = rng.sample(SYMBOLS, 2)
    const v1 = rng.int(2, 9)
    const v2 = rng.int(2, 9)
    const c = rng.int(1, 9)
    const times = rng.next() < 0.6
    const core = times ? v1 * v2 : v1 + v2
    const correct = core + c
    return {
      givens: [`${s1} = ${v1}`, `${s2} = ${v2}`],
      question: `${s1} ${times ? 'x' : '+'} ${s2} + ${c} = ___`,
      correct,
      distractors: [core, correct - c + 1, times ? v1 + v2 + c : v1 * v2 + c, correct + 1, correct - 1],
      explain: `${s1} is ${v1} and ${s2} is ${v2}, so ${v1} ${times ? 'x' : '+'} ${v2} + ${c} = ${correct}.`,
    }
  },
}

const formsFor = (level) => {
  if (level <= 6) return [forms.missingOperand]
  if (level <= 9) return [forms.missingOperand, forms.oneSymbol]
  return [forms.oneSymbol, forms.twoSymbols]
}

export function generateNumberPuzzles({ level, seed, rng }) {
  return rng.attempt(
    () => {
      const built = rng.pick(formsFor(level))(rng, level)
      if (!Number.isInteger(built.correct) || built.correct < 0) return null

      return buildItem({
        subtest: 'number_puzzles', level, seed, rng,
        prompt: { kind: 'equation', givens: built.givens, question: built.question },
        correct: text(built.correct),
        distractors: built.distractors
          .filter((n) => Number.isFinite(n) && n >= 0 && n !== built.correct)
          .map(text),
        explain: built.explain,
        key: (c) => c.text,
      })
    },
    (it) => it !== null,
  )
}
