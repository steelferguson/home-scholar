import { useSyncExternalStore } from 'react'
import * as playback from '../../lib/playbackStore'
import AudioControls from './AudioControls'

export default function NativeAudioPlayer({ lesson, courseTitle, courseSlug, savedPosition = 0 }) {
  const state = useSyncExternalStore(playback.subscribe, playback.getSnapshot)
  const current = state.active && state.lessonId === lesson.id
  const duration = current && state.duration ? state.duration : (lesson.duration_minutes || 0) * 60
  const toggle = () => {
    if (!current || state.error) playback.play({ lesson, courseTitle, courseSlug, position: current ? state.position : savedPosition })
    else if (state.playing) playback.pause()
    else playback.resume()
  }
  return <AudioControls position={current ? state.position : savedPosition} duration={duration}
    playing={current && state.playing} rate={state.rate} onSeek={playback.seek}
    onToggle={toggle} onRate={playback.setRate} disabled={!current}
    message={current ? state.error || (state.buffering ? 'Loading audio…' : '') : 'Press play to begin'} />
}
