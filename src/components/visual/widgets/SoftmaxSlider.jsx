import { useState } from 'react'

const CLASSES = [
  { label: 'cat', color: 'bg-blue-500' },
  { label: 'dog', color: 'bg-green-500' },
  { label: 'bird', color: 'bg-purple-500' },
  { label: 'fish', color: 'bg-amber-500' },
]

export default function SoftmaxSlider({ initialLogits = [2.0, 1.0, 0.2, -1.0] }) {
  const [logits, setLogits] = useState(initialLogits)
  const [temp, setTemp] = useState(1)

  const scaled = logits.map(z => z / temp)
  const maxZ = Math.max(...scaled)
  const exps = scaled.map(z => Math.exp(z - maxZ))
  const sum = exps.reduce((a, b) => a + b, 0)
  const probs = exps.map(e => e / sum)

  const setLogit = (i, v) => {
    const next = [...logits]
    next[i] = v
    setLogits(next)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Raw logits (any number)</p>
          {CLASSES.map((c, i) => (
            <div key={c.label} className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600 w-10">{c.label}</span>
              <input
                type="range" min="-5" max="5" step="0.1" value={logits[i]}
                onChange={e => setLogit(i, parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono text-gray-700 w-12 text-right">{logits[i].toFixed(1)}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
            <span className="text-sm text-gray-600 w-10">🌡 T</span>
            <input
              type="range" min="0.1" max="5" step="0.1" value={temp}
              onChange={e => setTemp(parseFloat(e.target.value))}
              className="flex-1 accent-red-500"
            />
            <span className="text-sm font-mono text-gray-700 w-12 text-right">{temp.toFixed(1)}</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Softmax probabilities (always sum to 1)
          </p>
          {CLASSES.map((c, i) => (
            <div key={c.label} className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-600 w-10">{c.label}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                <div
                  className={`${c.color} h-5 rounded-full transition-all duration-200 flex items-center justify-end pr-1.5`}
                  style={{ width: `${Math.max(probs[i] * 100, 2)}%` }}
                >
                  {probs[i] > 0.12 && <span className="text-[10px] text-white font-semibold">{(probs[i] * 100).toFixed(0)}%</span>}
                </div>
              </div>
              {probs[i] <= 0.12 && <span className="text-[10px] text-gray-500 w-8">{(probs[i] * 100).toFixed(0)}%</span>}
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-2">
            {temp < 0.5 && 'Low temperature: sharp, nearly deterministic — the winner takes all.'}
            {temp >= 0.5 && temp <= 1.5 && 'Temperature ≈ 1: the standard softmax.'}
            {temp > 1.5 && 'High temperature: flattened — the model gets adventurous.'}
          </p>
        </div>
      </div>
    </div>
  )
}
