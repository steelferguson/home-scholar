import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { supabase } from '../../supabaseClient'
import { createWalletStore } from '../../lib/walletStore'
import { WalletContext } from '../../hooks/useWallet'

export default function WalletProvider({ userId, children }) {
  const store = useMemo(() => createWalletStore(supabase, userId), [userId])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => { store.load() }, [store])
  const value = useMemo(() => ({ ...state, summaryOf: store.summaryOf, award: store.award, adjust: store.adjust, retry: store.load }), [state, store])
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
