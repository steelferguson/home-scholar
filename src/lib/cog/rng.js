// Seeded RNG. Every item is a pure function of (subtest, level, seed), so an
// item a kid saw last Tuesday can be replayed exactly from its id alone.

export function makeRng(seed) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min, max) => min + Math.floor(next() * (max - min + 1))
  const pick = (arr) => arr[int(0, arr.length - 1)]

  const shuffle = (arr) => {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i)
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }

  // n distinct members of arr, in random order
  const sample = (arr, n) => shuffle(arr).slice(0, n)

  // Repeatedly call fn until it returns a value passing `ok`, or give up.
  // Generators use this to reject degenerate items (duplicate distractors,
  // impossible arithmetic) without ever looping forever.
  const attempt = (fn, ok, tries = 40) => {
    let last = null
    for (let i = 0; i < tries; i++) {
      last = fn()
      if (ok(last)) return last
    }
    return last
  }

  return { next, int, pick, shuffle, sample, attempt }
}

// Stable 32-bit hash, so a string id can seed the RNG that rebuilds the item.
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
