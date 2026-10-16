export default function Brand({ large = false }) {
  return (
    <span className={`brand ${large ? 'brand-large' : ''}`}>
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="currentColor" />
        <path d="M12 26V22a12 12 0 0 1 24 0v4" stroke="#F6D78B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 35c-4-3-8-4-12-4V20c4 0 8 1 12 4 4-3 8-4 12-4v11c-4 0-8 1-12 4Z" fill="#FFFDF6" />
        <path d="M24 24v11" stroke="#246052" strokeWidth="2" />
      </svg>
      <span>Home Scholar<span className="brand-caption">A little learning, every day.</span></span>
    </span>
  )
}
