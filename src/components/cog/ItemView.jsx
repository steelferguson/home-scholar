import Figure from './Figure'
import HoleGrid from './HoleGrid'

// Read-only rendering of an item's prompt and choices. The interactive player
// (timing, flag-and-skip, coaching) comes later and will reuse these pieces.

function Prompt({ prompt }) {
  switch (prompt.kind) {
    case 'series':
      return (
        <div className="flex flex-wrap items-center gap-3 text-2xl font-semibold text-slate-800">
          {prompt.terms.map((t, i) => <span key={i}>{t}</span>)}
          <span className="rounded-lg border-2 border-dashed border-blue-400 px-4 py-1 text-blue-500">?</span>
        </div>
      )

    case 'analogy':
      return (
        <p className="text-xl text-slate-800">
          <strong>{prompt.a1}</strong> is to <strong>{prompt.b1}</strong>{' '}
          as <strong>{prompt.a2}</strong> is to{' '}
          <span className="rounded-lg border-2 border-dashed border-blue-400 px-4 py-0.5 text-blue-500">?</span>
        </p>
      )

    case 'classification':
      return (
        <p className="text-xl text-slate-800">
          {prompt.words.map((w, i) => <strong key={i}>{w}{i < prompt.words.length - 1 ? ', ' : ''}</strong>)}
          {' and '}
          <span className="rounded-lg border-2 border-dashed border-blue-400 px-4 py-0.5 text-blue-500">?</span>
        </p>
      )

    case 'sentence':
      return (
        <p className="text-xl text-slate-800">
          {prompt.sentence.split('___').map((part, i, all) => (
            <span key={i}>
              {part}
              {i < all.length - 1 && <span className="rounded-lg border-2 border-dashed border-blue-400 px-5 py-0.5 text-blue-500">?</span>}
            </span>
          ))}
        </p>
      )

    case 'number_analogy':
      return (
        <div className="flex flex-wrap items-center gap-3">
          {prompt.pairs.map(([from, to], i) => (
            <span key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xl font-semibold text-slate-800">
              {from} <span className="text-slate-400">&rarr;</span>
              {to === null ? <span className="text-blue-500">?</span> : to}
            </span>
          ))}
        </div>
      )

    case 'equation':
      return (
        <div>
          {prompt.givens.length > 0 && (
            <p className="mb-2 text-base text-slate-500">{prompt.givens.join('   ')}</p>
          )}
          <p className="text-2xl font-semibold text-slate-800">
            {prompt.question.split('___').map((part, i, all) => (
              <span key={i}>
                {part}
                {i < all.length - 1 && <span className="rounded-lg border-2 border-dashed border-blue-400 px-4 py-0.5 text-blue-500">?</span>}
              </span>
            ))}
          </p>
        </div>
      )

    case 'figure_group':
      return (
        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 p-2">
          {prompt.figures.map((f, i) => (
            <div key={i} className="flex h-24 w-24 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Figure figure={f} size={80} />
            </div>
          ))}
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-blue-400">
            <span className="text-3xl text-blue-400">?</span>
          </div>
        </div>
      )

    case 'fold':
      return (
        <div className="inline-flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <HoleGrid grid={prompt.grid} holes={prompt.punches} folds={prompt.folds} size={96} />
          <span className="text-sm text-slate-500">
            Folded in half{prompt.folds.length > 1 ? ' twice' : ''}, then punched.
            <br />What does it look like unfolded?
          </span>
        </div>
      )

    case 'matrix':
      return (
        <div className="inline-grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2">
          {prompt.cells.map((cell, i) => (
            <div key={i} className="flex h-24 w-24 items-center justify-center rounded-lg border border-slate-200 bg-white">
              {cell
                ? <Figure figure={cell} size={80} />
                : <span className="text-3xl text-blue-400">?</span>}
            </div>
          ))}
        </div>
      )

    default:
      return <p className="text-slate-400">Unsupported prompt: {prompt.kind}</p>
  }
}

function Choice({ choice }) {
  if (choice.kind === 'figure') return <Figure figure={choice.figure} size={72} />
  if (choice.kind === 'holes') return <HoleGrid grid={choice.grid} holes={choice.holes} size={72} />
  return <span className="text-lg font-medium">{choice.text}</span>
}

export default function ItemView({ item, revealed = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <Prompt prompt={item.prompt} />

      <div className={`mt-4 grid gap-2 ${item.choices[0].kind === 'text' ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {item.choices.map((choice, i) => {
          const correct = revealed && i === item.answer
          return (
            <div
              key={i}
              className={`flex items-center justify-center rounded-lg border-2 px-3 py-2 ${
                correct ? 'border-green-500 bg-green-50' : 'border-slate-200'
              }`}
            >
              <Choice choice={choice} />
            </div>
          )
        })}
      </div>

      {revealed && (
        <p className="mt-3 border-t border-slate-100 pt-2 text-sm text-slate-500">{item.explain}</p>
      )}
    </div>
  )
}
