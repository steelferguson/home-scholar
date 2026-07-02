import { useState, useEffect } from 'react'

// Fetches a lesson's content JSON (visual + quiz_game lessons). Results are
// keyed to the URL so a stale response from a previous lesson can never bleed
// into the current one.
export function useLessonContent(url) {
  const [result, setResult] = useState(null) // { url, content } | { url, failed }

  useEffect(() => {
    if (!url) return
    let stale = false
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(content => { if (!stale) setResult({ url, content }) })
      .catch(() => { if (!stale) setResult({ url, failed: true }) })
    return () => { stale = true }
  }, [url])

  const current = result && result.url === url ? result : null
  return {
    content: current?.content ?? null,
    error: !url || !!current?.failed,
  }
}
