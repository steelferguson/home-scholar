export default function Brand({ large = false }) {
  return (
    <span className={`brand ${large ? 'brand-large' : ''}`}>
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M7 23 24 7l17 16" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M24 29c-5-4-12-6-17-6v14c6 0 13 2 17 6 4-4 11-6 17-6V23c-5 0-12 2-17 6Zm0 0v14" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <span>Home Scholar</span>
    </span>
  )
}
