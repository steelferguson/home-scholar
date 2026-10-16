export default function Brand({ large = false }) {
  return <span className={`brand ${large ? 'brand-large' : ''}`}>
    <img src="/brand/home-scholar.png" alt="" />
    <span>Home Scholar</span>
  </span>
}
