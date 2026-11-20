import { useFamily } from './useFamily'
import { useWallet } from './useWallet'
import { useProgress } from './useProgress'
import { hasFreeChoice } from '../lib/courseAccess'
import { supabase } from '../supabaseClient'

export function useFreeChoiceFinish() {
  const family = useFamily()
  const wallet = useWallet()
  const progress = useProgress()
  if (!hasFreeChoice(family?.active)) return null
  return async (lessonId, attemptId) => {
    const { data, error } = await supabase.rpc('finish_free_choice', {
      p_profile_id: family.active.id, p_lesson_id: lessonId, p_attempt_id: attemptId,
    })
    if (error || !Number.isInteger(data)) throw new Error('Couldn’t save this lesson. Try again.')
    await Promise.allSettled([wallet.retry(), progress.retry()])
    return { cents: data }
  }
}
