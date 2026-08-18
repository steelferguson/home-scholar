import { useState, useSyncExternalStore } from 'react'
import * as playback from '../../lib/playbackStore'
import { formatTime } from '../../lib/formatTime'

// Controls for audio played by the native shell. Playback state lives in
// playbackStore, not here, because the audio outlives this page — see MiniPlayer.

const RATES = [0.75, 1, 1.25, 1.5]

export default function NativeAudioPlayer({ lesson, courseTitle, courseSlug, savedPosition = 0 }) {
  const state = useSyncExternalStore(playback.subscribe, playback.getSnapshot)
  const [scrubbing, setScrubbing] = useState(null) // local position while dragging

  const isCurrent = state.active && state.lessonId === lesson.id
  const position = scrubbing ?? (isCurrent ? state.position : savedPosition)
  const duration = isCurrent && state.duration
    ? state.duration
    : (lesson.duration_minutes ? lesson.duration_minutes * 60 : 0)
  const playing = isCurrent && state.playing

  const handlePlayPause = () => {
    if (!isCurrent) {
      playback.play({ lesson, courseTitle, courseSlug, position: savedPosition })
    } else if (playing) {
      playback.pause()
    } else {
      playback.resume()
    }
  }

  const handleSkip = (delta) => {
    const next = Math.max(0, Math.min(duration || Infinity, position + delta))
    playback.seek(next)
  }

  return (
    <div className="space-y-3">
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={position}
        disabled={!duration || !isCurrent}
        onChange={(e) => setScrubbing(Number(e.target.value))}
        onMouseUp={(e) => { setScrubbing(null); playback.seek(Number(e.target.value)) }}
        onTouchEnd={(e) => { setScrubbing(null); playback.seek(Number(e.target.value)) }}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatTime(position)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => handleSkip(-15)}
          disabled={!isCurrent}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
        >
          &#8630; 15s
        </button>
        <button
          onClick={handlePlayPause}
          className="w-14 h-14 rounded-full bg-blue-600 text-white text-xl flex items-center justify-center hover:bg-blue-700 transition"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <button
          onClick={() => handleSkip(30)}
          disabled={!isCurrent}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
        >
          30s &#8631;
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-sm text-gray-500">Speed:</span>
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => playback.setRate(r)}
            className={`px-2 py-1 text-xs rounded ${
              state.rate === r
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {r}x
          </button>
        ))}
      </div>
    </div>
  )
}
