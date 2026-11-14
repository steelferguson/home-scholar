import { useWallet } from '../../hooks/useWallet'
import { formatCents, entryLabel } from '../../lib/wallet'

// A child's money: balance, the daily goal bar, and the last few entries.
export default function WalletCard({ profile }) {
  const wallet = useWallet()
  if (!wallet || profile?.role !== 'child') return null
  const { balance, earnedToday, cap } = wallet.summaryOf(profile.id)
  const recent = (wallet.entries[profile.id] || []).slice(0, 5)
  const full = earnedToday >= cap
  return <section className="wallet-card" aria-labelledby="wallet-heading">
    <div className="wallet-balance">
      <h2 id="wallet-heading">My money</h2>
      <strong data-testid="wallet-balance">{wallet.loading ? '…' : formatCents(balance)}</strong>
    </div>
    {wallet.error ? <p role="alert">{wallet.error} <button onClick={wallet.retry}>Try again</button></p> : <>
      <div className="wallet-goal">
        <span>{full ? 'Daily goal reached! Come back tomorrow.' : `Today: ${earnedToday}¢ of ${cap}¢`}</span>
        <div className="wallet-goal-bar" role="progressbar" aria-label="Daily goal" aria-valuenow={earnedToday} aria-valuemin={0} aria-valuemax={cap}>
          <span style={{ width: `${Math.min(100, earnedToday / cap * 100)}%` }} />
        </div>
      </div>
      {recent.length > 0 && <ul className="wallet-recent">{recent.map(entry => <li key={entry.id}>
        <span>{entryLabel(entry)}</span><strong className={entry.cents < 0 ? 'is-negative' : ''}>{entry.cents > 0 ? '+' : ''}{entry.cents}¢</strong>
      </li>)}</ul>}
    </>}
  </section>
}
