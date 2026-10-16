import { Link } from 'react-router-dom'
import Brand from './Brand'

export default function AppHeader({ user, onSignOut, backTo, backLabel }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/" aria-label="Home Scholar courses"><Brand /></Link>
        <div className="header-account">
          <span className="account-email">{user.email}</span>
          <button onClick={onSignOut} className="quiet-button">Sign out</button>
        </div>
      </div>
      {backTo && <nav className="header-breadcrumb"><Link to={backTo}>← {backLabel}</Link></nav>}
    </header>
  )
}
