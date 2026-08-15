import { useEffect, useState } from 'react'
import { postToNative, onNativeEvent } from '../../lib/nativeBridge'

// Controls for audio played by the native shell. This component only sends
// commands and reflects status — the shell owns playback so it survives the
// screen locking. Progress is saved app-wide by useNativeAudioSync.

const RATES = [0.75, 1, 1.25, 1.5]

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function NativeAudioPlayer({ lesson, savedPosition = 0, courseTitle }) {
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [position, setPosition] = useState(savedPosition)
  const [duration, setDuration] = useState(
    lesson.duration_minutes ? lesson.duration_minutes * 60 : 0
  )
  const [rate, setRate] = useState(1)
  const [scrubbing, setScrubbing] = useState(false)

  useEffect(() => {
    return onNativeEvent((message) => {
      if (message.lessonId !== lesson.id) {
        // Another lesson took over the player
        if (message.type === 'playing') setPlaying(false)
        return
      }
      if (message.type === 'playing') {
        setPlaying(true)
        setStarted(true)
      } else if (message.type === 'ended') {
        setPlaying(false)
      } else if (message.type === 'paused') {
        setPlaying(false)
        if (!scrubbing) setPosition(message.position)
      } else if (message.type === 'status') {
        setPlaying(message.playing)
        if (message.duration > 0) setDuration(message.duration)
        if (!scrubbing) setPosition(message.position)
      }
    })
  }, [lesson.id, scrubbing])

  const handlePlayPause = () => {
    if (!started) {
      postToNative({
        type: 'play',
        lessonId: lesson.id,
        url: lesson.audio_url,
        title: lesson.title,
        subtitle: courseTitle,
        position: savedPosition,
        rate,
      })
      setStarted(true)
      setPlaying(true)
      return
    }
    postToNative({ type: playing ? 'pause' : 'resume' })
    setPlaying(!playing)
  }

  const handleSeek = (seconds) => {
    setPosition(seconds)
    postToNative({ type: 'seek', seconds })
  }

  const handleSkip = (delta) => {
    const next = Math.max(0, Math.min(duration || Infinity, position + delta))
    handleSeek(next)
  }

  const handleRate = (next) => {
    setRate(next)
    postToNative({ type: 'rate', rate: next })
  }

  return (
    <div className="space-y-3">
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={position}
        disabled={!duration}
        onChange={(e) => { setScrubbing(true); setPosition(Number(e.target.value)) }}
        onMouseUp={(e) => { setScrubbing(false); handleSeek(Number(e.target.value)) }}
        onTouchEnd={(e) => { setScrubbing(false); handleSeek(Number(e.target.value)) }}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatTime(position)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => handleSkip(-15)}
          className="text-sm text-gray-500 hover:text-gray-700"
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
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          30s &#8631;
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-sm text-gray-500">Speed:</span>
        {RATES.map((r) => (
          <button
            key={r}
            onClick={() => handleRate(r)}
            className={`px-2 py-1 text-xs rounded ${
              rate === r
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
