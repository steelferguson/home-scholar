import { useCallback, useEffect, useRef, useState } from 'react'
import { isNativeShell, onNativeEvent } from '../lib/nativeBridge'
import { useProgress } from './useProgress'
import { useFamily } from './useFamily'
import { useFreeChoiceFinish } from './useFreeChoiceFinish'
import { getSnapshot } from '../lib/playbackStore'

// In the native shell, audio keeps playing while you navigate away from the
// lesson (or lock the phone), so progress can't be saved by the Lesson page.
// This listens app-wide instead.
const SAVE_INTERVAL_MS = 15000

export function useNativeAudioSync(userId) {
  const { savePosition, markComplete } = useProgress(userId)

  const { active } = useFamily()
  const prefix = `home-scholar:pending-audio:${userId}:${active.id}:`
  const [failed, setFailed] = useState(false)
  const finishing = useRef(new Set())
  const finish = useFreeChoiceFinish()
  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])

  const retry = useCallback(async () => {
    if (!finishRef.current) return
    for (const key of Object.keys(localStorage).filter(key => key.startsWith(prefix))) {
      const lessonId = localStorage.getItem(key)
      if (!lessonId || finishing.current.has(key)) continue
      finishing.current.add(key)
      try {
        await finishRef.current(lessonId, key.slice(prefix.length))
        localStorage.removeItem(key)
      } catch { setFailed(true); return }
      finally { finishing.current.delete(key) }
    }
    setFailed(Object.keys(localStorage).some(key => key.startsWith(prefix) && !finishing.current.has(key)))
  }, [prefix])
  useEffect(() => {
    if (!isNativeShell) return
    retry()
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [retry])

  useEffect(() => {
    if (!isNativeShell || !userId) return
    let lastSave = 0

    return onNativeEvent((message) => {
      const current = getSnapshot()
      if (!current.active || current.lessonId !== message.lessonId || current.seeking || current.error) return
      if (message.type === 'ended') {
        if (finishRef.current) {
          localStorage.setItem(prefix + current.attemptId, message.lessonId)
          void retry()
        } else markComplete(message.lessonId).catch(() => {})
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
  }, [userId, savePosition, markComplete, prefix, retry])
  return failed ? retry : null
}
