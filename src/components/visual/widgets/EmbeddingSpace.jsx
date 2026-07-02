import { useState } from 'react'

// Hand-placed 2D "embedding" coordinates, centered on the origin so that
// angles between position vectors are meaningful for cosine similarity.
const WORDS = [
  // animals (upper left)
  { w: 'cat', x: -0.72, y: 0.55, c: '#2563eb' },
  { w: 'dog', x: -0.60, y: 0.68, c: '#2563eb' },
  { w: 'kitten', x: -0.80, y: 0.44, c: '#2563eb' },
  { w: 'puppy', x: -0.66, y: 0.80, c: '#2563eb' },
  // foods (upper right)
  { w: 'pizza', x: 0.62, y: 0.62, c: '#16a34a' },
  { w: 'taco', x: 0.74, y: 0.52, c: '#16a34a' },
  { w: 'bread', x: 0.55, y: 0.74, c: '#16a34a' },
  { w: 'apple', x: 0.80, y: 0.68, c: '#16a34a' },
  // verbs (lower left)
  { w: 'run', x: -0.62, y: -0.60, c: '#d97706' },
  { w: 'walk', x: -0.72, y: -0.50, c: '#d97706' },
  { w: 'jump', x: -0.55, y: -0.72, c: '#d97706' },
  { w: 'swim', x: -0.80, y: -0.66, c: '#d97706' },
  // people/royalty (lower right) — king − man + woman ≈ queen
  { w: 'king', x: 0.60, y: -0.50, c: '#9333ea' },
  { w: 'queen', x: 0.78, y: -0.50, c: '#9333ea' },
  { w: 'man', x: 0.60, y: -0.76, c: '#9333ea' },
  { w: 'woman', x: 0.78, y: -0.76, c: '#9333ea' },
]

const W = 480, H = 340
const px = (x) => W / 2 + x * (W / 2 - 40)
const py = (y) => H / 2 - y * (H / 2 - 30)

const cosine = (a, b) => {
  const dot = a.x * b.x + a.y * b.y
  return dot / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y))
}

export default function EmbeddingSpace() {
  const [selected, setSelected] = useState([])

  const toggle = (w) => {
    if (selected.includes(w)) setSelected(selected.filter(s => s !== w))
    else setSelected([...selected.slice(-1), w])
  }

  const [a, b] = selected.map(s => WORDS.find(x => x.w === s))
  const sim = a && b ? cosine(a, b) : null

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        A 2D embedding space — tap two words to measure their similarity
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#e5e7eb" strokeWidth="1" />

        {a && b && (
          <g>
            <line x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke="#111827" strokeWidth="1.5" strokeDasharray="5 4" />
          </g>
        )}

        {WORDS.map(word => {
          const isSel = selected.includes(word.w)
          return (
            <g key={word.w} onClick={() => toggle(word.w)} className="cursor-pointer">
              <circle cx={px(word.x)} cy={py(word.y)} r={isSel ? 8 : 5} fill={word.c} opacity={isSel ? 1 : 0.75} stroke={isSel ? '#111827' : 'none'} strokeWidth="2" />
              <text x={px(word.x)} y={py(word.y) - 12} textAnchor="middle" fontSize="12" fontWeight={isSel ? 700 : 500} fill="#374151">
                {word.w}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="text-sm text-center mt-1 min-h-5">
        {sim !== null ? (
          <span className="text-gray-700">
            cosine(<span className="font-semibold">{a.w}</span>, <span className="font-semibold">{b.w}</span>) =
            <span className={`font-mono font-bold ml-1 ${sim > 0.9 ? 'text-green-600' : sim > 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {sim.toFixed(2)}
            </span>
            {sim > 0.9 && ' — nearly the same direction: very related'}
            {sim <= 0 && ' — pointing apart: unrelated meanings'}
          </span>
        ) : (
          <span className="text-gray-400">Nearby words mean similar things. Try cat &amp; kitten, then cat &amp; taco.</span>
        )}
      </p>
    </div>
  )
}
