import { stop } from '../lib/playbackStore'
import { Link, useNavigate } from 'react-router-dom'
import { useFamily } from '../hooks/useFamily'
import Brand from './Brand'

export default function AppHeader({ user, backTo, backLabel }) {
  const family = useFamily()
  const navigate = useNavigate()
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" aria-label="Home Scholar courses"><Brand /></Link>
        <div className="header-account">
          <span className="account-email">{family?.active?.name || user.email}</span>
          {family?.active?.role === 'child' && <label>Switch kid <select aria-label="Switch kid" value={family.active.id} onChange={e => {
            stop()
            family.store.select(e.target.value)
            navigate('/', { replace: true })
          }}>
            {family.profiles.filter(p => p.role === 'child').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>}
          <Link to="/parent" className="quiet-button">Parent</Link>
        </div>
      </div>
      {backTo && <nav className="header-breadcrumb"><Link to={backTo}>← {backLabel}</Link></nav>}
    </header>
  )
}
