import { Link } from 'react-router-dom'

export default function LoadState({ loading, message, onRetry, backTo }) {
  return (
    <div className="state-card" role={loading ? 'status' : 'alert'} aria-live="polite">
      {loading && <span className="loading-spinner" aria-hidden="true" />}
      <p>{message}</p>
      {!loading && <div className="state-actions">
        {onRetry && <button className="primary-button" onClick={onRetry}>Try again</button>}
        {backTo && <Link className="quiet-button" to={backTo}>Back to courses</Link>}
      </div>}
    </div>
  )
}
