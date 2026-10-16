import { useState } from 'react'

export default function ThemePicker() {
  const options = [['navy', 'Navy & Paper'], ['graphite', 'Graphite'], ['clay', 'Clay & Linen']]
  const [theme, setTheme] = useState('graphite')
  return <div className="theme-picker"><span>Theme preview</span>{options.map(([value, label]) =>
    <button key={value} aria-pressed={theme === value} onClick={() => {
      document.documentElement.dataset.previewTheme = value
      setTheme(value)
    }}>{label}</button>)}
  </div>
}
