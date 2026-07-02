import { useState, useEffect, useRef } from 'react'

// Loss surface tilted so the RIGHT valley is the deeper (global) minimum;
// the ball starts on the left and tends to settle in the local one
const f = (x) => 0.1 * x ** 4 - x ** 2 - 0.3 * x + 4
const grad = (x) => 0.4 * x ** 3 - 2 * x - 0.3

const W = 480, H = 240, PAD = 30
const X_MIN = -4, X_MAX = 4
const Y_MIN = 0, Y_MAX = 16

const px = (x) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD)
const py = (y) => (H - PAD) - ((Math.min(y, Y_MAX) - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD - 10)

const START_X = -3.4

// The loss surface never changes — build the polyline once
const CURVE = (() => {
  const points = []
  for (let cx = X_MIN; cx <= X_MAX + 0.001; cx += 0.05) {
    points.push(`${px(cx).toFixed(1)},${py(f(cx)).toFixed(1)}`)
  }
  return points.join(' ')
})()

export default function GradientDescentBall() {
  const [x, setX] = useState(START_X)
  const [lr, setLr] = useState(0.1)
  const [trail, setTrail] = useState([START_X])
  const [running, setRunning] = useState(false)
  const timerRef = useRef(null)

  const step = () => {
    setX(prev => {
      const next = prev - lr * grad(prev)
      const clamped = Math.max(-4.4, Math.min(4.4, next))
      setTrail(t => [...t.slice(-40), clamped])
      return clamped
    })
  }

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(step, 250)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, lr])

  useEffect(() => {
    if (running && Math.abs(grad(x)) < 0.02) setRunning(false)
  }, [x, running])

  const reset = () => {
    setRunning(false)
    setX(START_X)
    setTrail([START_X])
  }

  const diverged = Math.abs(x) >= 4.35
  const converged = Math.abs(grad(x)) < 0.02

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polyline points={CURVE} fill="none" stroke="#94a3b8" strokeWidth="2.5" />
        <text x={px(2.15)} y={py(f(2.15)) + 18} textAnchor="middle" fontSize="10" fill="#16a34a">global min</text>
        <text x={px(-2.35)} y={py(f(-2.35)) + 18} textAnchor="middle" fontSize="10" fill="#d97706">local min</text>

        {/* Trail */}
        {trail.map((tx, i) => (
          <circle key={i} cx={px(tx)} cy={py(f(tx))} r="3" fill="#3b82f6" opacity={(i + 1) / trail.length * 0.5} />
        ))}

        {/* Ball */}
        <circle cx={px(x)} cy={py(f(x)) - 7} r="8" fill="#2563eb" stroke="white" strokeWidth="2" />

        <text x={W - 10} y={16} textAnchor="end" fontSize="11" fill="#374151" fontFamily="monospace">
          loss = {f(x).toFixed(2)}   slope = {grad(x).toFixed(2)}
        </text>
      </svg>

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <span className="text-sm text-gray-500">learning rate</span>
        <input
          type="range" min="0.01" max="1.2" step="0.01" value={lr}
          onChange={e => setLr(parseFloat(e.target.value))}
          className="flex-1 min-w-32 accent-blue-600"
        />
        <span className="text-sm font-mono text-gray-700 w-12">{lr.toFixed(2)}</span>
        <button onClick={step} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100">Step</button>
        <button
          onClick={() => setRunning(r => !r)}
          className={`px-3 py-1.5 text-sm rounded-lg text-white ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={reset} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100">Reset</button>
      </div>
      <p className="text-sm mt-2 text-center min-h-5">
        {diverged && <span className="text-red-600 font-medium">Diverged! The learning rate is so big the ball flew off the surface. Reset and try smaller.</span>}
        {!diverged && converged && trail.length > 1 && (
          <span className="text-green-700 font-medium">
            Settled at x = {x.toFixed(2)} — {x > 0 ? 'the global minimum 🎉' : 'the LOCAL minimum. Try a bigger learning rate to escape it!'}
          </span>
        )}
        {!diverged && !converged && <span className="text-gray-500">Each step moves against the slope: x ← x − lr · f′(x)</span>}
      </p>
    </div>
  )
}
