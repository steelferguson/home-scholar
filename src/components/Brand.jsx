// Use the wordmark while the replacement symbol is being selected.
export default function Brand({ large = false }) {
  return <span className={`brand ${large ? 'brand-large' : ''}`}>Home Scholar</span>
}
