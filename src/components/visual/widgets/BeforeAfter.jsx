import { useState } from 'react'

// Generic "bad version → good version" reveal. Content JSON supplies the two
// texts plus optional annotation notes; used heavily by the communication course.
export default function BeforeAfter({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  notes = [],
  buttonLabel = 'Show the rewrite',
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="rounded-lg border border-red-200 bg-white p-4">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-red-500 bg-red-50 rounded px-1.5 py-0.5 mb-2">
          {beforeLabel}
        </span>
        <p className="text-sm text-gray-700 whitespace-pre-line">{before}</p>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700"
        >
          {buttonLabel}
        </button>
      ) : (
        <>
          <div className="mt-3 rounded-lg border border-green-200 bg-white p-4">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-green-600 bg-green-50 rounded px-1.5 py-0.5 mb-2">
              {afterLabel}
            </span>
            <p className="text-sm text-gray-700 whitespace-pre-line">{after}</p>
          </div>
          {notes.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-600">
                  <span className="text-green-500 shrink-0">✓</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
