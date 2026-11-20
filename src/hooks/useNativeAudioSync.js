import { useEffect, useRef } from 'react'
import { isNativeShell, onNativeEvent } from '../lib/nativeBridge'
import { useProgress } from './useProgress'
import { useFreeChoiceFinish } from './useFreeChoiceFinish'
import { getSnapshot } from '../lib/playbackStore'

// In the native shell, audio keeps playing while you navigate away from the
// lesson (or lock the phone), so progress can't be saved by the Lesson page.
// This listens app-wide instead.
const SAVE_INTERVAL_MS = 15000

export function useNativeAudioSync(userId) {
  const { savePosition, markComplete } = useProgress(userId)

  const finish = useFreeChoiceFinish()
  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])

  useEffect(() => {
    if (!isNativeShell || !userId) return
    let lastSave = 0

    return onNativeEvent((message) => {
      const current = getSnapshot()
      if (!current.active || current.lessonId !== message.lessonId || current.seeking || current.error) return
      if (message.type === 'ended') {
        const saved = finishRef.current
          ? finishRef.current(message.lessonId, current.attemptId)
          : markComplete(message.lessonId)
        saved.catch(() => {})
        return
      }
      // Pausing is the moment a position is most worth keeping
      if (message.type === 'paused') {
        lastSave = Date.now()
        savePosition(message.lessonId, message.position).catch(() => {})
        return
      }
      if (message.type !== 'status' || !message.playing) return
      if (Date.now() - lastSave < SAVE_INTERVAL_MS) return
      lastSave = Date.now()
      savePosition(message.lessonId, message.position).catch(() => {})
    })
  }, [userId, savePosition, markComplete])
}
