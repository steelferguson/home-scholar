import { Link } from 'react-router-dom'
import { useFamily } from '../hooks/useFamily'
import Brand from './Brand'

export default function AppHeader({ user, backTo, backLabel }) {
  const family = useFamily()
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" aria-label="Home Scholar courses"><Brand /></Link>
        <div className="header-account">
          <span className="account-email">{family?.active?.name || user.email}</span>
          <Link to="/parent" className="quiet-button">Parent</Link>
        </div>
      </div>
      {backTo && <nav className="header-breadcrumb"><Link to={backTo}>← {backLabel}</Link></nav>}
    </header>
  )
}
