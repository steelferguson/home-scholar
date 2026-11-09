import { useEffect, useState } from 'react'
import { stop } from '../../lib/playbackStore'
import Brand from '../Brand'

export default function PasswordSetup({ onSave, onCancel }) {
  useEffect(() => { stop() }, [])
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  return <main className="login-page"><section className="login-content family-panel">
    <Brand large />
    <h1>Set your parent password</h1>
    <p>You can still sign in with Google. Use this password to unlock parent controls on your child’s iPad.</p>
    <form className="login-form" onSubmit={async event => {
      event.preventDefault(); setError(null)
      if (password !== confirmation) { setError('The passwords don’t match.'); return }
      setBusy(true)
      try { await onSave(password) }
      catch (err) { setError(err.message); setPassword(''); setConfirmation('') }
      finally { setBusy(false) }
    }}>
      <label htmlFor="new-parent-password">New parent password</label>
      <input id="new-parent-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
      <label htmlFor="confirm-parent-password">Confirm password</label>
      <input id="confirm-parent-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={event => setConfirmation(event.target.value)} />
      <button disabled={busy}>{busy ? 'Saving…' : 'Save parent password'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    <button disabled={busy} className="quiet-button" onClick={onCancel}>Cancel</button>
  </section></main>
}
