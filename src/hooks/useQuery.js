import { useEffect, useState } from 'react'

// Keep results tied to their route and ignore responses from an older request.
export function useQuery(key, load) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  useEffect(() => {
    let active = true
    Promise.resolve().then(load).then(
      data => { if (active) setResult({ key, attempt, data }) },
      () => { if (active) setResult({ key, attempt, error: true }) },
    )
    return () => { active = false }
  }, [key, load, attempt])
  const current = result?.key === key && result?.attempt === attempt ? result : null
  return {
    data: current?.data,
    error: current?.error,
    loading: !current,
    retry: () => setAttempt(value => value + 1),
  }
}

export async function queryData(query) {
  const { data, error } = await query
  if (error) throw new Error('Could not load data')
  return data
}
