/* eslint-disable react-refresh/only-export-components -- dev-only entry point, HMR not needed */
import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import VisualLessonPlayer from './components/visual/VisualLessonPlayer'
import QuestionRound from './components/game/QuestionRound'
import { DEFAULT_COIN_PER_CORRECT, DEFAULT_ARCADE_SECONDS } from './components/game/constants'
import './index.css'

const ArcadeGame = lazy(() => import('./components/game/ArcadeGame'))

// Dev-only harness: preview local content JSONs (content/**) through the real
// lesson components without Supabase or uploads. Run `npm run dev` and open
// http://localhost:5173/preview.html
const modules = import.meta.glob('../content/*/*.json', { eager: true })

const LESSONS = Object.entries(modules).map(([path, mod]) => {
  const [, course, file] = path.match(/content\/([^/]+)\/([^/]+)\.json$/)
  return { key: `${course}/${file}`, course, file, content: mod.default }
}).sort((a, b) => a.key.localeCompare(b.key))

function contentUrlFor(content) {
  return URL.createObjectURL(new Blob([JSON.stringify(content)], { type: 'application/json' }))
}

function Preview() {
  const [selected, setSelected] = useState(null)
  const [arcade, setArcade] = useState(false)
  const [roundResult, setRoundResult] = useState(null)

  // One stable blob URL per selected lesson, revoked when it changes
  const contentUrl = useMemo(
    () => (selected ? contentUrlFor(selected.content) : null),
    [selected],
  )
  useEffect(() => () => { if (contentUrl) URL.revokeObjectURL(contentUrl) }, [contentUrl])

  if (!selected) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Content Preview</h1>
        <p className="text-sm text-gray-500 mb-6">Local files under <code>content/</code>, rendered with the real lesson components.</p>
        <div className="grid gap-2 max-w-lg">
          {LESSONS.map(l => (
            <button
              key={l.key}
              onClick={() => { setSelected(l); setArcade(false); setRoundResult(null) }}
              className="text-left bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-400"
            >
              <span className="text-xs text-gray-400 mr-2">{l.course}</span>
              <span className="font-medium">{l.content.title}</span>
              <span className="ml-2 text-xs text-gray-400">({l.content.type})</span>
            </button>
          ))}
          {LESSONS.length === 0 && <p className="text-gray-400">No content files found.</p>}
        </div>
      </div>
    )
  }

  const back = (
    <button onClick={() => { setSelected(null); setArcade(false); setRoundResult(null) }} className="text-sm text-blue-600 hover:underline">
      &larr; All lessons
    </button>
  )

  if (selected.content.type === 'quiz_game') {
    if (arcade) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-indigo-950 flex items-center justify-center text-white text-2xl">Loading arcade...</div>}>
          <ArcadeGame words={selected.content.words || []} seconds={selected.content.arcade_seconds ?? DEFAULT_ARCADE_SECONDS} onEnd={() => setArcade(false)} />
        </Suspense>
      )
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-indigo-600">
        <div className="p-4 flex items-center justify-between">
          <span className="bg-white/80 rounded px-2 py-1 text-sm">{back}</span>
          <button onClick={() => setArcade(true)} className="bg-yellow-400 text-yellow-900 font-bold rounded-full px-4 py-1.5 text-sm">
            🕹 Preview arcade
          </button>
        </div>
        {roundResult ? (
          <div className="text-center text-white pt-16">
            <p className="text-4xl font-black mb-2">Round done!</p>
            <p className="text-2xl">{roundResult.correct}/{roundResult.total} — +{roundResult.coins} 🪙</p>
          </div>
        ) : (
          <QuestionRound
            questions={selected.content.questions}
            coinPerCorrect={selected.content.coin_per_correct ?? DEFAULT_COIN_PER_CORRECT}
            onRoundEnd={(correct, total, coins) => setRoundResult({ correct, total, coins })}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-6">
        {back}
        <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-6">{selected.content.title}</h2>
        <VisualLessonPlayer
          key={selected.key}
          lesson={{ content_url: contentUrl }}
          savedStep={0}
          isCompleted={false}
          onSaveStep={() => {}}
          onMarkComplete={() => alert('Lesson complete!')}
        />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<Preview />)
