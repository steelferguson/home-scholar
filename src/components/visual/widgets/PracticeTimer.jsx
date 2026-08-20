import { useEffect, useState } from 'react'

// Timed speaking drill: shows a prompt (and optional framework steps to hit),
// counts down while the learner talks OUT LOUD, then invites another rep.
export default function PracticeTimer({ prompt, seconds = 60, steps = [], buttonLabel = 'Start speaking' }) {
  const [phase, setPhase] = useState('idle') // idle | running | done
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    if (phase !== 'running') return
    const id = setTimeout(() => {
      if (remaining <= 1) {
        setRemaining(0)
        setPhase('done')
      } else {
        setRemaining(remaining - 1)
      }
    }, 1000)
    return () => clearTimeout(id)
  }, [phase, remaining])

  const start = () => {
    setRemaining(seconds)
    setPhase('running')
  }

  const pct = (remaining / seconds) * 100

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        Speaking drill — out loud, not in your head
      </p>
      <p className="text-sm font-medium text-gray-800 mb-3">{prompt}</p>

      {steps.length > 0 && (
        <ol className="mb-4 space-y-1">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-600">
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}

      {phase === 'idle' && (
        <button
          onClick={start}
          className="w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700"
        >
          ▶ {buttonLabel} ({seconds}s)
        </button>
      )}

      {phase === 'running' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500">Keep talking...</span>
            <span className="text-lg font-mono font-bold text-gray-800">
              {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            onClick={() => setPhase('done')}
            className="mt-3 w-full rounded-lg border border-gray-300 bg-white text-gray-600 text-sm py-1.5 hover:bg-gray-100"
          >
            I finished early
          </button>
        </div>
      )}

      {phase === 'done' && (
        <div className="text-center">
          <p className="text-sm font-medium text-green-600 mb-2">
            Nice rep. Rough is fine — reps are what smooth it out.
          </p>
          <button
            onClick={start}
            className="rounded-lg border border-blue-300 bg-white text-blue-600 text-sm font-medium px-4 py-1.5 hover:bg-blue-50"
          >
            ↻ Go again
          </button>
        </div>
      )}
    </div>
  )
}
