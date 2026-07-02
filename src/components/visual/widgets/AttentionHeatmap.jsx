import { useState } from 'react'

// The classic coreference example: what does "it" refer to?
const TOKENS = ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', '___']

// Hand-crafted plausible attention rows (query → weights over all tokens).
// Base pattern: attend to self + neighbors; the interesting row is "it".
function buildMatrix(itFocus) {
  const n = TOKENS.length
  const m = []
  for (let q = 0; q < n; q++) {
    const row = new Array(n).fill(0.02)
    row[q] += 0.25
    if (q > 0) row[q - 1] += 0.15
    if (q < n - 1) row[q + 1] += 0.15
    m.push(row)
  }
  const IT = 7
  m[IT] = new Array(n).fill(0.02)
  if (itFocus === 'animal') {
    m[IT][1] = 0.55  // animal
    m[IT][5] = 0.10  // street
  } else {
    m[IT][1] = 0.10
    m[IT][5] = 0.55
  }
  m[IT][7] = 0.12
  m[IT][8] = 0.08
  // normalize rows
  return m.map(row => {
    const s = row.reduce((a, b) => a + b, 0)
    return row.map(v => v / s)
  })
}

export default function AttentionHeatmap() {
  const [lastWord, setLastWord] = useState('tired')
  const [queryIdx, setQueryIdx] = useState(7)

  const matrix = buildMatrix(lastWord === 'tired' ? 'animal' : 'street')
  const tokens = TOKENS.map(t => (t === '___' ? lastWord : t))
  const weights = matrix[queryIdx]
  const maxW = Math.max(...weights)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last word:</span>
        {['tired', 'wide'].map(w => (
          <button
            key={w}
            onClick={() => setLastWord(w)}
            className={`px-3 py-1 text-sm rounded-full border ${
              lastWord === w ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            ...too {w}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-2">Tap any word to see where its attention goes:</p>
      <div className="flex flex-wrap gap-1 mb-4 leading-loose">
        {tokens.map((t, i) => {
          const w = weights[i]
          const isQuery = i === queryIdx
          return (
            <button
              key={i}
              onClick={() => setQueryIdx(i)}
              className={`px-1.5 py-0.5 rounded text-base transition-all ${isQuery ? 'ring-2 ring-blue-600 font-bold' : ''}`}
              style={{ backgroundColor: isQuery ? '#dbeafe' : `rgba(245, 158, 11, ${(w / maxW) * 0.85})` }}
            >
              {t}
            </button>
          )
        })}
      </div>

      <div className="space-y-1">
        {tokens.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14 text-right font-mono">{t}</span>
            <div className="flex-1 bg-gray-200 rounded h-3 overflow-hidden">
              <div className="bg-amber-500 h-3 rounded transition-all duration-300" style={{ width: `${weights[i] * 100}%` }} />
            </div>
            <span className="text-[10px] text-gray-400 w-8 font-mono">{(weights[i] * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-600 mt-3 text-center">
        {queryIdx === 7
          ? `"it" attends mostly to "${lastWord === 'tired' ? 'animal' : 'street'}" — a ${lastWord === 'tired' ? 'tired animal' : 'wide street'} makes sense. Flip the last word and watch attention move.`
          : 'Most words mainly attend to themselves and their neighbors. Tap "it" for the interesting one.'}
      </p>
    </div>
  )
}
