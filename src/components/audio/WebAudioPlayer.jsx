import { useCallback, useEffect, useRef, useState } from 'react'
import AudioControls from './AudioControls'

export default function WebAudioPlayer({ lesson, savedPosition, progressReady, completed, onSave, onComplete }) {
  const audioRef = useRef(null)
  const restoredRef = useRef(false)
  const interactedRef = useRef(false)
  const lastSaveRef = useRef(0)
  const seekSaveRef = useRef(null)
  const retryPositionRef = useRef(null)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [message, setMessage] = useState('Loading audio…')
  const [error, setError] = useState(false)
  const save = useCallback(seconds => { onSave(lesson.id, seconds).catch(() => {}) }, [lesson.id, onSave])
  const restore = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audio.readyState < 1) return
    if (retryPositionRef.current !== null) {
      audio.currentTime = Math.min(retryPositionRef.current, Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.1) : retryPositionRef.current)
      retryPositionRef.current = null
      setPosition(audio.currentTime)
      return
    }
    if (!progressReady || restoredRef.current) return
    restoredRef.current = true
    if (!interactedRef.current && !completed && savedPosition > 0) {
      audio.currentTime = Math.min(savedPosition, Number.isFinite(audio.duration) ? Math.max(0, audio.duration - 0.1) : savedPosition)
      setPosition(audio.currentTime)
    }
  }, [savedPosition, progressReady, completed])
  useEffect(restore, [restore])
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      clearTimeout(seekSaveRef.current)
      if (interactedRef.current && audio && Number.isFinite(audio.currentTime)) save(retryPositionRef.current ?? audio.currentTime)
    }
  }, [save])
  const seek = seconds => {
    const audio = audioRef.current
    if (!audio || audio.readyState < 1) return
    interactedRef.current = true
    restoredRef.current = true
    audio.currentTime = seconds
    setPosition(seconds)
  }
  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    interactedRef.current = true
    restoredRef.current = true
    if (!audio.paused) { audio.pause(); return }
    try { await audio.play(); setError(false) }
    catch { setError(true); setMessage('Audio could not play. Please try again.') }
  }
  return <>
    <audio ref={audioRef} src={lesson.audio_url} preload="metadata"
      onLoadedMetadata={() => { audioRef.current.playbackRate = rate; setDuration(audioRef.current.duration); setMessage(''); restore() }}
      onPlay={() => { setPlaying(true); setMessage('') }}
      onPlaying={() => { setPlaying(true); setMessage('') }}
      onWaiting={() => setMessage('Buffering audio…')}
      onCanPlay={() => setMessage('')}
      onError={() => { setError(true); setPlaying(false); setMessage('We couldn’t load this audio.') }}
      onTimeUpdate={() => {
        const audio = audioRef.current
        if (retryPositionRef.current !== null) return
        setPosition(audio.currentTime)
        if (!audio.paused && Date.now() - lastSaveRef.current >= 10000) {
          lastSaveRef.current = Date.now(); save(audio.currentTime)
        }
      }}
      onSeeked={() => {
        if (retryPositionRef.current !== null) return
        setMessage('')
        clearTimeout(seekSaveRef.current)
        if (interactedRef.current) seekSaveRef.current = setTimeout(() => save(audioRef.current.currentTime), 400)
      }}
      onPause={() => { clearTimeout(seekSaveRef.current); setPlaying(false); if (interactedRef.current && retryPositionRef.current === null) save(audioRef.current.currentTime) }}
      onEnded={() => { setPlaying(false); onComplete().catch(() => {}) }} />
    <AudioControls position={position} duration={duration} playing={playing} rate={rate}
      onSeek={seek} onToggle={toggle} onRate={value => { setRate(value); audioRef.current.playbackRate = value }}
      disabled={!duration || error} message={message} />
    {error && <button className="quiet-button" onClick={() => {
      clearTimeout(seekSaveRef.current)
      if (restoredRef.current || interactedRef.current) retryPositionRef.current ??= audioRef.current.currentTime
      setError(false)
      setMessage('Loading audio…')
      audioRef.current.load()
    }}>Retry audio</button>}
  </>
}
