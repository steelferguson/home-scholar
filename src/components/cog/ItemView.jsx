import Figure from './Figure'

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
  return choice.kind === 'figure'
    ? <Figure figure={choice.figure} size={72} />
    : <span className="text-lg font-medium">{choice.text}</span>
}

export default function ItemView({ item, revealed = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <Prompt prompt={item.prompt} />

      <div className={`mt-4 grid gap-2 ${item.choices[0].kind === 'figure' ? 'grid-cols-4' : 'grid-cols-2'}`}>
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
