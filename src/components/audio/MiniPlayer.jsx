import { useSyncExternalStore } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as playback from '../../lib/playbackStore'
import { formatTime } from '../../lib/formatTime'

// Persistent bar showing what's playing, since audio keeps going after you
// leave the lesson page. Hidden on the lesson's own page, which has full controls.

export default function MiniPlayer() {
  const state = useSyncExternalStore(playback.subscribe, playback.getSnapshot)
  const navigate = useNavigate()
  const location = useLocation()

  if (!state.active) return null

  const lessonPath = `/course/${state.courseSlug}/lesson/${state.lessonNumber}`
  if (location.pathname === lessonPath) return null

  const percent = state.duration ? (state.position / state.duration) * 100 : 0

  return (
    <>
      {/* keeps the bar from covering the end of the page */}
      <div className="h-20" />
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(lessonPath)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-sm font-medium text-gray-900 truncate">{state.title}</p>
          <p className="text-xs text-gray-500 truncate">
            {state.courseTitle}
            {state.duration
              ? ` · ${formatTime(state.position)} / ${formatTime(state.duration)}`
              : ''}
          </p>
        </button>
        <button
          onClick={() => playback.seek(Math.max(0, state.position - 15))}
          className="text-xs text-gray-500 hover:text-gray-700 shrink-0"
          aria-label="Back 15 seconds"
        >
          &#8630; 15s
        </button>
        <button
          onClick={() => (state.playing ? playback.pause() : playback.resume())}
          className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shrink-0"
          aria-label={state.playing ? 'Pause' : 'Play'}
        >
          {state.playing ? '❚❚' : '▶'}
        </button>
        <button
          onClick={playback.stop}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0 px-1"
          aria-label="Close player"
        >
          ×
        </button>
        </div>
      </div>
    </>
  )
}
