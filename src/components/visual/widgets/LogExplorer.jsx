import { useState } from 'react'

const W = 480, H = 260, PAD = 44
const MAX_LOSS = 5

const px = (p) => PAD + p * (W - PAD - 16)
const py = (loss) => (H - PAD) - (Math.min(loss, MAX_LOSS) / MAX_LOSS) * (H - PAD - 12)

// Curve: loss = -ln(p) for p in (0, 1] — state-independent, built once
const CURVE = (() => {
  const points = []
  for (let x = 0.007; x <= 1.0001; x += 0.005) {
    points.push(`${px(x).toFixed(1)},${py(-Math.log(x)).toFixed(1)}`)
  }
  return points.join(' ')
})()

export default function LogExplorer() {
  const [p, setP] = useState(0.3)
  const loss = -Math.log(p)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - 8} y2={H - PAD} stroke="#d1d5db" strokeWidth="1" />
        <line x1={PAD} y1={H - PAD} x2={PAD} y2={8} stroke="#d1d5db" strokeWidth="1" />
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <g key={t}>
            <line x1={px(t)} y1={H - PAD} x2={px(t)} y2={H - PAD + 4} stroke="#9ca3af" />
            <text x={px(t)} y={H - PAD + 16} textAnchor="middle" fontSize="10" fill="#6b7280">{t}</text>
          </g>
        ))}
        {[0, 1, 2, 3, 4, 5].map(l => (
          <g key={l}>
            <line x1={PAD - 4} y1={py(l)} x2={PAD} y2={py(l)} stroke="#9ca3af" />
            <text x={PAD - 8} y={py(l) + 3} textAnchor="end" fontSize="10" fill="#6b7280">{l}</text>
          </g>
        ))}
        <text x={(W + PAD) / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#374151">
          p — probability the model gave the correct answer
        </text>
        <text x={12} y={H / 2} textAnchor="middle" fontSize="11" fill="#374151" transform={`rotate(-90 12 ${H / 2})`}>
          loss = −log(p)
        </text>

        {/* Danger zone near p=0 */}
        <rect x={PAD} y={8} width={px(0.1) - PAD} height={H - PAD - 8} fill="#fef2f2" />
        <text x={px(0.05)} y={22} textAnchor="middle" fontSize="9" fill="#dc2626">loss explodes</text>

        {/* Curve */}
        <polyline points={CURVE} fill="none" stroke="#2563eb" strokeWidth="2.5" />

        {/* Marker */}
        <line x1={px(p)} y1={H - PAD} x2={px(p)} y2={py(loss)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" />
        <line x1={PAD} y1={py(loss)} x2={px(p)} y2={py(loss)} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 3" />
        <circle cx={px(p)} cy={py(loss)} r="6" fill="#f59e0b" stroke="white" strokeWidth="2" />
      </svg>

      <div className="flex items-center gap-3 mt-2">
        <span className="text-sm text-gray-500 shrink-0">p =</span>
        <input
          type="range" min="0.01" max="1" step="0.01" value={p}
          onChange={e => setP(parseFloat(e.target.value))}
          className="flex-1 accent-amber-500"
        />
        <span className="text-sm font-mono text-gray-700 w-12 text-right">{p.toFixed(2)}</span>
      </div>
      <p className="text-sm text-gray-600 mt-2 text-center">
        Model says <span className="font-mono font-semibold">{(p * 100).toFixed(0)}%</span> on the right answer
        → loss <span className={`font-mono font-semibold ${loss > 2.5 ? 'text-red-600' : 'text-gray-800'}`}>{loss.toFixed(2)}</span>
        {p >= 0.97 && ' — confident and correct: almost no penalty'}
        {p <= 0.1 && ' — confidently wrong gets punished brutally'}
      </p>
    </div>
  )
}
