import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const DEFAULT_STATE = { coins: 0, streak_days: 0, last_played_at: null }

// Coins + daily streak for the kids' game loop (player_state table),
// plus quiz round history (quiz_results table).
export function usePlayerState(userId) {
  const [state, setState] = useState(DEFAULT_STATE)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('player_state').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }) => {
        if (data) setState(data)
        setLoaded(true)
      })
  }, [userId])

  const save = useCallback(async (updates) => {
    const payload = { user_id: userId, ...updates }
    const { data } = await supabase
      .from('player_state')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
    if (data?.[0]) setState(data[0])
  }, [userId])

  const recordQuizResult = useCallback(async (lessonId, correctCount, totalCount, coinsEarned) => {
    await supabase.from('quiz_results').insert({
      user_id: userId,
      lesson_id: lessonId,
      correct_count: correctCount,
      total_count: totalCount,
      coins_earned: coinsEarned,
    })

    // Streak: playing on consecutive days grows it; a same-day round keeps it
    const today = new Date().toDateString()
    const last = state.last_played_at ? new Date(state.last_played_at).toDateString() : null
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    let streak = state.streak_days
    if (last === today) { /* already counted today */ }
    else if (last === yesterday) streak += 1
    else streak = 1

    await save({
      coins: state.coins + coinsEarned,
      streak_days: streak,
      last_played_at: new Date().toISOString(),
    })
  }, [userId, state, save])

  const spendCoins = useCallback(async (amount) => {
    if (state.coins < amount) return false
    await save({ coins: state.coins - amount })
    return true
  }, [state, save])

  return { playerState: state, loaded, recordQuizResult, spendCoins }
}
