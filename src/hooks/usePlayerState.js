import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const DEFAULT_STATE = { coins: 0, streak_days: 0, last_played_at: null }

// Yesterday computed via setDate so DST-length days compare correctly
function yesterdayString() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toDateString()
}

// Coins + daily streak for the kids' game loop (player_state table),
// plus quiz round history (quiz_results table).
//
// Every write re-reads the stored row first: local state is a display cache
// only, so a slow/failed initial load or a second open tab can't clobber the
// real balance. (True atomicity would need a DB-side increment RPC.)
export function usePlayerState(userId) {
  const [state, setState] = useState(DEFAULT_STATE)

  useEffect(() => {
    if (!userId) return
    let stale = false
    supabase.from('player_state').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (!stale && data) setState(data) })
    return () => { stale = true }
  }, [userId])

  const fetchFresh = useCallback(async () => {
    const { data } = await supabase
      .from('player_state').select('*').eq('user_id', userId).maybeSingle()
    return data || DEFAULT_STATE
  }, [userId])

  const save = useCallback(async (updates) => {
    const { data } = await supabase
      .from('player_state')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
      .select()
    if (data?.[0]) setState(data[0])
  }, [userId])

  const recordQuizResult = useCallback(async (lessonId, correctCount, totalCount, coinsEarned) => {
    const resultInsert = supabase.from('quiz_results').insert({
      user_id: userId,
      lesson_id: lessonId,
      correct_count: correctCount,
      total_count: totalCount,
      coins_earned: coinsEarned,
    })

    const fresh = await fetchFresh()

    // Streak: playing on consecutive days grows it; a same-day round keeps it
    const today = new Date().toDateString()
    const last = fresh.last_played_at ? new Date(fresh.last_played_at).toDateString() : null
    let streak = fresh.streak_days
    if (last === today) { /* already counted today */ }
    else if (last === yesterdayString()) streak += 1
    else streak = 1

    await Promise.all([
      resultInsert,
      save({
        coins: fresh.coins + coinsEarned,
        streak_days: streak,
        last_played_at: new Date().toISOString(),
      }),
    ])
  }, [userId, fetchFresh, save])

  const spendCoins = useCallback(async (amount) => {
    const fresh = await fetchFresh()
    if (fresh.coins < amount) {
      setState(fresh)
      return false
    }
    await save({ coins: fresh.coins - amount })
    return true
  }, [fetchFresh, save])

  return { playerState: state, recordQuizResult, spendCoins }
}
