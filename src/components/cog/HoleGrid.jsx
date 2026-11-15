// A square of paper as a lattice of hole positions. Used both for the folded
// paper in a prompt (where `folds` dims the part folded out of sight and marks
// the fold lines) and for a plain unfolded answer.

// The mastery band folds an 8x8 lattice, where a hole drawn at the 6x6 scale is
// a couple of pixels across. The grid is drawn larger to compensate rather than
// asking him to compare four patterns of dots he can barely see.
export default function HoleGrid({ grid = 4, holes = [], folds = [], size = 84 }) {
  const drawnSize = grid >= 8 ? Math.round(size * 1.15) : size
  const step = 100 / grid
  const punched = new Set(holes.map(([r, c]) => `${r},${c}`))
  const hiddenCol = (c) => folds.includes('vertical') && c >= grid / 2
  const hiddenRow = (r) => folds.includes('horizontal') && r >= grid / 2
  const hiddenDiagonal = (r, c) => folds.includes('diagonal') && r > c

  return (
    <svg viewBox="-4 -4 108 108" width={drawnSize} height={drawnSize} className="text-slate-700" role="img" aria-label={`paper with ${holes.length} holes`}>
      <rect x="0" y="0" width="100" height="100" rx="4" fill="white" stroke="currentColor" strokeWidth="3" />

      {/* the half folded behind, shown dimmed so the fold reads as a fold */}
      {folds.includes('vertical') && <rect x="50" y="0" width="50" height="100" fill="currentColor" opacity="0.07" />}
      {folds.includes('horizontal') && <rect x="0" y="50" width="100" height="50" fill="currentColor" opacity="0.07" />}
      {folds.includes('diagonal') && <polygon points="0,0 0,100 100,100" fill="currentColor" opacity="0.07" />}
      {folds.includes('diagonal') && <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 5" />}
      {folds.includes('vertical') && <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 5" />}
      {folds.includes('horizontal') && <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 5" />}

      {Array.from({ length: grid }, (_, r) =>
        Array.from({ length: grid }, (_, c) => {
          if (!punched.has(`${r},${c}`)) return null
          return (
            <circle
              key={`${r},${c}`}
              cx={step * (c + 0.5)}
              cy={step * (r + 0.5)}
              r={step * 0.32}
              fill="currentColor"
              opacity={hiddenCol(c) || hiddenRow(r) || hiddenDiagonal(r, c) ? 0.25 : 1}
            />
          )
        }),
      )}
    </svg>
  )
}
