import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFamily } from '../../hooks/useFamily'
import { stop } from '../../lib/playbackStore'
import Brand from '../Brand'
import { supabase } from '../../supabaseClient'
import { sendParentPasswordLink } from '../../lib/authStore'
import { useWallet } from '../../hooks/useWallet'
import { formatCents, entryLabel } from '../../lib/wallet'

export default function ParentPage({ user, onSignOut }) {
  const { profiles, active, unlocked, loading, error: loadError, store } = useFamily()
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [adjusting, setAdjusting] = useState({}) // profileId -> { cents, reason }
  const wallet = useWallet()
  const navigate = useNavigate()
  const children = profiles.filter(p => p.role === 'child')
  const run = async action => {
    setBusy(true); setError(null)
    try { await action() } catch (err) { setError(err.message || 'Please try again.') }
    finally { setBusy(false) }
  }
  return <main className="login-page"><section className="login-content family-panel">
    <Brand large />
    <h1>{unlocked ? 'Family profiles' : 'Parent access'}</h1>
    {loading ? <p role="status">Loading your family…</p> : loadError ? <><p role="alert">{loadError}</p><button onClick={() => store.load()}>Try again</button></> : !unlocked ? <>
      <p>Enter your family account password to open parent controls.</p>
      <form className="login-form" onSubmit={event => { event.preventDefault(); const entered = password; setPassword(''); run(() => store.unlock(entered)) }}>
        <label htmlFor="parent-password">Parent password</label>
        <input id="parent-password" type="password" autoComplete="off" required value={password} onChange={event => setPassword(event.target.value)} />
        <button disabled={busy}>{busy ? 'Checking…' : 'Unlock parent controls'}</button>
      </form>
      <p>Signed in with Google, or forgot your password? Set a parent password using a link sent to your account’s email.</p>
      <button disabled={busy || emailSent} onClick={() => run(async () => {
        await sendParentPasswordLink(supabase, user.email, window.location.origin)
        setEmailSent(true)
      })}>{emailSent ? 'Email requested' : 'Email me a password setup link'}</button>
      {emailSent && <p role="status">Check your account’s email and open the link to set your password. Then return here and enter it to unlock parent controls. If the link has expired, reopen this page to request another.</p>}
    </> : <>
      <p>Choose who will use this iPad. Kids can switch between child profiles themselves.</p>
      <div className="family-profiles">{profiles.map(profile => <button key={profile.id} disabled={busy} onClick={() => run(() => {
        stop(); store.select(profile.id); navigate('/', { replace: true })
      })}>{profile.name}<span>{profile.role === 'parent' ? 'Parent' : 'Child'}</span></button>)}</div>
      <form className="login-form" onSubmit={event => { event.preventDefault(); run(async () => { await store.create(name); setName('') }) }}>
        <label htmlFor="child-name">Add a child</label><input id="child-name" maxLength={60} required value={name} onChange={event => setName(event.target.value)} placeholder="Child’s name" />
        <button disabled={busy}>Add child</button>
      </form>
      {!profiles.some(p => p.role === 'parent') && <button disabled={busy} onClick={() => run(() => store.create('Parent', 'parent'))}>Create parent profile</button>}
      {children.length > 0 && wallet && <section className="family-money" aria-labelledby="family-money-heading">
        <h2 id="family-money-heading">Money</h2>
        <p>The daily plan pays 10¢ per math set, then 10¢ for new Spanish or 5¢ for a repeat. Extra practice earns no money. Change a balance here with a reason.</p>
        {wallet.error && <p role="alert">{wallet.error} <button onClick={wallet.retry}>Try again</button></p>}
        {children.map(child => { const sum = wallet.summaryOf(child.id); const draft = adjusting[child.id] || { cents: '', reason: '' }
          const setDraft = changes => setAdjusting({ ...adjusting, [child.id]: { ...draft, ...changes } })
          return <fieldset key={child.id}>
            <legend>{child.name}</legend>
            <div className="money-row"><span>Balance</span><strong data-testid={`balance-${child.name}`}>{wallet.loading ? '…' : formatCents(sum.balance)}</strong></div>
            <div className="money-row"><span>Earned today</span><span>{sum.earnedToday}¢ of {sum.cap}¢</span></div>
            <form className="money-adjust" onSubmit={event => { event.preventDefault(); run(async () => { await wallet.adjust(child.id, Number(draft.cents), draft.reason); setDraft({ cents: '', reason: '' }) }) }}>
              <label htmlFor={`cents-${child.id}`}>Change (cents, minus to take away)</label>
              <input id={`cents-${child.id}`} type="number" step="1" required value={draft.cents} onChange={event => setDraft({ cents: event.target.value })} placeholder="25 or -10" />
              <label htmlFor={`reason-${child.id}`}>Reason</label>
              <input id={`reason-${child.id}`} maxLength={120} required value={draft.reason} onChange={event => setDraft({ reason: event.target.value })} placeholder="Why" />
              <button disabled={busy}>Adjust {child.name}’s balance</button>
            </form>
            {(wallet.entries[child.id] || []).slice(0, 5).map(entry => <div className="money-row money-entry" key={entry.id}><span>{entryLabel(entry)}</span><span>{entry.cents > 0 ? '+' : ''}{entry.cents}¢</span></div>)}
          </fieldset> })}
      </section>}
      <button className="quiet-button" onClick={() => { stop(); store.lock() }}>Lock parent controls</button>
      <button className="quiet-button" disabled={busy} onClick={() => run(async () => { if (!store.getSnapshot().unlocked) throw new Error('Parent sign-in required.'); await onSignOut() })}>Sign out of family account</button>
    </>}
    {error && <p role="alert">{error}</p>}
    {active && <Link to="/" onClick={() => { if (active.role === 'child') store.lock() }}>Back to {active.name}’s courses</Link>}
  </section></main>
}
