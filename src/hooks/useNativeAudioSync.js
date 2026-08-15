import { useEffect } from 'react'
import { isNativeShell, onNativeEvent } from '../lib/nativeBridge'
import { useProgress } from './useProgress'

// In the native shell, audio keeps playing while you navigate away from the
// lesson (or lock the phone), so progress can't be saved by the Lesson page.
// This listens app-wide instead.
const SAVE_INTERVAL_MS = 15000

export function useNativeAudioSync(userId) {
  const { savePosition, markComplete } = useProgress(userId)

  useEffect(() => {
    if (!isNativeShell || !userId) return
    let lastSave = 0

    return onNativeEvent((message) => {
      if (message.type === 'ended') {
        markComplete(message.lessonId)
        return
      }
      // Pausing is the moment a position is most worth keeping
      if (message.type === 'paused') {
        lastSave = Date.now()
        savePosition(message.lessonId, message.position)
        return
      }
      if (message.type !== 'status' || !message.playing) return
      if (Date.now() - lastSave < SAVE_INTERVAL_MS) return
      lastSave = Date.now()
      savePosition(message.lessonId, message.position)
    })
  }, [userId, savePosition, markComplete])
}
