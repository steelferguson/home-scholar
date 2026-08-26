import { useId } from 'react'
import { ASYMMETRIC } from '../../lib/cog/figures.js'

// Renders a figure spec from lib/cog/figures.js. The spec is the truth; this
// file only draws it.

const R = 44 // shape radius inside a 100x100 cell

const regular = (sides, startAngle = -90) =>
  Array.from({ length: sides }, (_, i) => {
    const a = ((startAngle + (360 / sides) * i) * Math.PI) / 180
    return [50 + R * Math.cos(a), 50 + R * Math.sin(a)]
  })

const star = (points = 5) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = ((-90 + (180 / points) * i) * Math.PI) / 180
    const r = i % 2 === 0 ? R : R * 0.42
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]
  })

const POLYGONS = {
  square: regular(4, -45),
  triangle: regular(3),
  diamond: regular(4),
  pentagon: regular(5),
  hexagon: regular(6),
  star: star(5),
  arrow: [[14, 38], [56, 38], [56, 16], [90, 50], [56, 84], [56, 62], [14, 62]],
  trapezoid: [[24, 74], [76, 74], [62, 26], [38, 26]],
}

const pointsAttr = (pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

// Where each copy sits when a figure has more than one shape.
const SLOTS = {
  1: [[50, 50, 1.0]],
  2: [[29, 50, 0.54], [71, 50, 0.54]],
  3: [[31, 33, 0.46], [69, 33, 0.46], [50, 71, 0.46]],
  4: [[31, 31, 0.46], [69, 31, 0.46], [31, 69, 0.46], [69, 69, 0.46]],
}

// `half` is drawn as a genuine half-fill rather than a hatch. A hatch pattern
// scales down with the shape, so at three or four small copies it reads as solid
// and `half` becomes indistinguishable from `full` -- an item the kid cannot
// fairly answer. A half-fill stays unambiguous at every size.
function Shape({ figure: f, clipId }) {
  const outline = { fill: f.shading === 'full' ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 5, strokeLinejoin: 'round' }
  const body = f.shape === 'circle'
    ? <circle cx="50" cy="50" r={R} {...outline} />
    : <polygon points={pointsAttr(POLYGONS[f.shape])} {...outline} />

  return (
    <>
      {f.shading === 'half' && (
        <rect x="0" y="0" width="50" height="100" fill="currentColor" clipPath={`url(#${clipId})`} />
      )}
      {body}
    </>
  )
}

export default function Figure({ figure: f, size = 96, className = '', title }) {
  const clipId = `cog-clip-${useId().replace(/[:]/g, '')}`
  const slots = SLOTS[Math.min(4, Math.max(1, f.count))]
  const flip = ASYMMETRIC.has(f.shape) && f.flipped

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`text-slate-700 ${className}`}
      role="img"
      aria-label={title || `${f.count} ${f.shading === 'none' ? 'empty' : f.shading === 'half' ? 'half-filled' : 'filled'} ${f.shape}`}
    >
      {/* One clip path per figure, resolved in each copy's own transformed
          space, so a rotated or scaled shape clips correctly without a
          duplicate definition per copy. */}
      <defs>
        <clipPath id={clipId}>
          {f.shape === 'circle'
            ? <circle cx="50" cy="50" r={R} />
            : <polygon points={pointsAttr(POLYGONS[f.shape])} />}
        </clipPath>
      </defs>
      {slots.map(([cx, cy, slotScale], i) => {
        const scale = slotScale * f.size
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${flip ? -scale : scale} ${scale}) rotate(${f.rotation}) translate(-50 -50)`}>
            <Shape figure={f} clipId={clipId} />
          </g>
        )
      })}
    </svg>
  )
}
