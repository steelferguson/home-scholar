import { useState, useEffect, useCallback } from 'react'
import { useFamily } from './useFamily'
import { supabase } from '../supabaseClient'
import { DECK_SLUG, statRows } from '../lib/mathFacts'

// Per-profile miss counts for Math Facts, stored in flashcard_progress under
// the math-facts deck. Stats only steer which facts come up, so a missing
// deck or a failed read falls back to an even mix and never blocks practice.
export function useFactStats() {
  const { active } = useFamily()
  const profileId = active.id
  const [loaded, setLoaded] = useState(null) // { deckId, stats }

  useEffect(() => {
    let stale = false
    ;(async () => {
      try {
        const { data: deck } = await supabase.from('flashcard_decks').select('id').eq('slug', DECK_SLUG).maybeSingle()
        if (!deck?.id) throw new Error('no deck')
        const { data } = await supabase.from('flashcard_progress').select('card_key,correct_count,incorrect_count')
          .eq('profile_id', profileId).eq('deck_id', deck.id)
        const stats = Object.fromEntries((data || []).map(row => [row.card_key, row]))
        if (!stale) setLoaded({ deckId: deck.id, stats })
      } catch { if (!stale) setLoaded({ deckId: null, stats: {} }) }
    })()
    return () => { stale = true }
  }, [profileId])

  const record = useCallback(async summary => {
    if (!loaded?.deckId) return
    const rows = statRows(summary, loaded.stats).map(row => ({ ...row, profile_id: profileId, deck_id: loaded.deckId, last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
    const { error } = await supabase.from('flashcard_progress').upsert(rows, { onConflict: 'profile_id,deck_id,card_key' })
    if (!error) setLoaded({ deckId: loaded.deckId, stats: { ...loaded.stats, ...Object.fromEntries(rows.map(row => [row.card_key, row])) } })
  }, [loaded, profileId])

  return { ready: loaded !== null, stats: loaded?.stats || {}, record }
}
