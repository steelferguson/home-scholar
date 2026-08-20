import { useMemo, useState } from 'react'

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '')

// Tap-the-word game: find every occurrence of the target words/phrases
// (filler words, hedges, jargon...) hidden in a passage. Targets may be
// multi-word phrases ("you know"); tapping any word of an occurrence finds it.
export default function WordHunt({ prompt, text, targets = [] }) {
  const { tokens, occurrences, tokenToOcc } = useMemo(() => {
    const tokens = text.split(/(\s+)/)
    const wordIdxs = []
    tokens.forEach((t, i) => {
      if (t.trim() && norm(t)) wordIdxs.push(i)
    })
    const words = wordIdxs.map((i) => norm(tokens[i]))

    const occurrences = []
    const tokenToOcc = new Map()
    targets.forEach((target) => {
      const parts = target.toLowerCase().split(/\s+/).map(norm).filter(Boolean)
      if (!parts.length) return
      for (let w = 0; w + parts.length <= words.length; w++) {
        const hit = parts.every((p, k) => words[w + k] === p)
        if (!hit) continue
        const tokenIdxs = parts.map((_, k) => wordIdxs[w + k])
        if (tokenIdxs.some((i) => tokenToOcc.has(i))) continue // overlaps a prior match
        const id = occurrences.length
        occurrences.push({ id, tokenIdxs })
        tokenIdxs.forEach((i) => tokenToOcc.set(i, id))
      }
    })
    return { tokens, occurrences, tokenToOcc }
  }, [text, targets])

  const [found, setFound] = useState(() => new Set())
  const [missIdx, setMissIdx] = useState(null)

  const clickWord = (i) => {
    const occId = tokenToOcc.get(i)
    if (occId === undefined) {
      setMissIdx(i)
      setTimeout(() => setMissIdx((cur) => (cur === i ? null : cur)), 700)
      return
    }
    setFound((prev) => new Set(prev).add(occId))
  }

  const revealAll = () => setFound(new Set(occurrences.map((o) => o.id)))
  const complete = occurrences.length > 0 && found.size === occurrences.length

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      {prompt && <p className="text-sm font-medium text-gray-700 mb-3">{prompt}</p>}
      <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-7 text-gray-700">
        {tokens.map((t, i) => {
          if (!t.trim()) return t
          const occId = tokenToOcc.get(i)
          const isFound = occId !== undefined && found.has(occId)
          return (
            <button
              key={i}
              onClick={() => clickWord(i)}
              className={`rounded px-0.5 -mx-0.5 transition-colors ${
                isFound
                  ? 'bg-amber-200 text-amber-900 font-medium line-through'
                  : missIdx === i
                    ? 'bg-red-100 text-red-500'
                    : 'hover:bg-blue-50'
              }`}
            >
              {t}
            </button>
          )
        })}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`text-sm font-medium ${complete ? 'text-green-600' : 'text-gray-500'}`}>
          {complete
            ? `All ${occurrences.length} found — imagine how much tighter that sounds without them.`
            : `Found ${found.size} of ${occurrences.length}`}
        </span>
        {!complete && (
          <button onClick={revealAll} className="text-xs text-blue-600 hover:underline shrink-0">
            Reveal all
          </button>
        )}
      </div>
    </div>
  )
}
