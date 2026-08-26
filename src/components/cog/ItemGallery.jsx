import { useState, useMemo } from 'react'
import { generateItem, IMPLEMENTED, SUBTESTS } from '../../lib/cog'
import ItemView from './ItemView'

// Dev-only. Dumps generated items so item QUALITY can be judged by eye, which is
// the one thing the test suite cannot do: a test can prove an item is
// well formed and unambiguous, not that it is a good question.

const COUNT = 12

export default function ItemGallery({ onBack }) {
  const [subtest, setSubtest] = useState(IMPLEMENTED[0])
  const [level, setLevel] = useState(1)
  const [page, setPage] = useState(0)
  const [revealed, setRevealed] = useState(true)

  const items = useMemo(
    () => Array.from({ length: COUNT }, (_, i) => generateItem(subtest, level, page * COUNT + i)),
    [subtest, level, page],
  )

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <button onClick={onBack} className="mb-4 text-sm text-blue-600 hover:underline">&larr; Back</button>
      <h1 className="text-2xl font-bold text-slate-900">CogAT item gallery</h1>
      <p className="mb-5 text-sm text-slate-500">Generated live. Levels 1-4 ~ age 8, 5-8 ~ age 10, 9-12 ~ age 12+.</p>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <select
          value={subtest}
          onChange={(e) => { setSubtest(e.target.value); setPage(0) }}
          className="rounded-lg border border-slate-300 px-3 py-1.5"
        >
          {IMPLEMENTED.map((s) => <option key={s} value={s}>{SUBTESTS[s].label}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          Level <strong className="w-6 text-slate-900">{level}</strong>
          <input
            type="range" min="1" max="12" value={level}
            onChange={(e) => { setLevel(Number(e.target.value)); setPage(0) }}
          />
        </label>

        <button onClick={() => setPage((p) => p + 1)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white">
          Another {COUNT}
        </button>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={revealed} onChange={(e) => setRevealed(e.target.checked)} />
          Show answers
        </label>

        <span className="text-sm text-slate-400">{items[0]?.targetSeconds}s target per item</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => <ItemView key={item.id} item={item} revealed={revealed} />)}
      </div>
    </div>
  )
}
