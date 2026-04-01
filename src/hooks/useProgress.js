import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export function useProgress(userId) {
  const [progress, setProgress] = useState({})

  useEffect(() => {
    if (!userId) return
    supabase
      .from('user_progress')
      .select('lesson_id, status, last_position_seconds, completed_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        const map = {}
        for (const row of data || []) {
          map[row.lesson_id] = row
        }
        setProgress(map)
      })
  }, [userId])

  const updateProgress = useCallback(async (lessonId, updates) => {
    if (!userId) return
    const payload = {
      user_id: userId,
      lesson_id: lessonId,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase
      .from('user_progress')
      .upsert(payload, { onConflict: 'user_id,lesson_id' })
      .select()
    if (data?.[0]) {
      setProgress(prev => ({ ...prev, [lessonId]: data[0] }))
    }
  }, [userId])

  const markComplete = useCallback(async (lessonId) => {
    await updateProgress(lessonId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }, [updateProgress])

  const savePosition = useCallback(async (lessonId, seconds) => {
    await updateProgress(lessonId, {
      status: 'in_progress',
      last_position_seconds: Math.floor(seconds),
    })
  }, [updateProgress])

  return { progress, markComplete, savePosition }
}
