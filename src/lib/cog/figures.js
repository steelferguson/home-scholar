// A figure is a plain spec, never markup, so items stay comparable, hashable and
// testable. Rendering happens in components/cog/Figure.jsx.
//
//   { shape, count, shading, rotation, size, flipped }
//
// Difficulty comes from how many transformation rules apply AT ONCE, not from
// fancier shapes. One rule is a level-1 item; three interacting rules is a
// level-12 item using the very same shape vocabulary.

export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star', 'arrow', 'trapezoid']

// Flipping only means something on a shape that isn't mirror-symmetric.
export const ASYMMETRIC = new Set(['arrow', 'trapezoid'])

export const SHADINGS = ['none', 'half', 'full']
export const ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315]
export const SIZES = [0.6, 0.8, 1.0]

export const figure = ({ shape = 'circle', count = 1, shading = 'none', rotation = 0, size = 1.0, flipped = false }) =>
  ({ shape, count, shading, rotation, size, flipped })

export const figureKey = (f) => `${f.shape}|${f.count}|${f.shading}|${f.rotation}|${f.size}|${f.flipped}`

// Rotational symmetry: how many times a shape looks identical in a full turn.
// A circle is `0`, meaning every rotation of it looks the same.
const SYMMETRY = { circle: 0, square: 4, diamond: 4, triangle: 3, pentagon: 5, hexagon: 6, star: 5, arrow: 1, trapezoid: 1 }

// Can the eye SEE this much rotation on this shape? Turning a square 90 degrees
// or a circle at all changes nothing on screen, so a rule that does it produces
// an item with no visible difference to reason about -- unanswerable, and
// unanswerable in a way that looks fine in the data.
export const rotationVisible = (shape, degrees) => {
  const order = SYMMETRY[shape] ?? 1
  if (order === 0) return false
  return (degrees * order) % 360 !== 0
}

// What the figure actually LOOKS like. Invisible attributes are dropped, so two
// specs that render identically compare equal. Used for every comparison that
// matters: distractor dedupe, and the check that a rule changed anything.
export const visualKey = (f) => {
  const order = SYMMETRY[f.shape] ?? 1
  const rotation = order === 0 ? 0 : f.rotation % (360 / order)
  const flipped = ASYMMETRIC.has(f.shape) ? f.flipped : false
  return `${f.shape}|${f.count}|${f.shading}|${rotation}|${f.size}|${flipped}`
}

export const sameFigure = (a, b) => visualKey(a) === visualKey(b)

const cycle = (arr, value, by) => arr[(arr.indexOf(value) + by + arr.length * 4) % arr.length]

// Every rule carries `fits`: the figures it can act on and still do what it
// says. Without this a rule silently wraps -- "gets bigger" turning a large
// shape small, "fills in" emptying a full one -- and the item becomes
// unanswerable while still looking fine. A wrapped rule is the worst kind of
// bad item, because the kid reasons correctly and is marked wrong.
export const RULES = [
  {
    name: 'count_up', from: 1, describe: 'one more shape each time',
    fits: (f) => f.count <= 3,
    apply: (f) => ({ ...f, count: f.count + 1 }),
  },
  {
    name: 'shade_step', from: 1, describe: 'the shading fills in one step',
    fits: (f) => f.shading !== 'full',
    apply: (f) => ({ ...f, shading: cycle(SHADINGS, f.shading, 1) }),
  },
  {
    name: 'rotate_90', from: 3, describe: 'the shape turns a quarter turn',
    fits: (f) => rotationVisible(f.shape, 90),
    apply: (f) => ({ ...f, rotation: (f.rotation + 90) % 360 }),
  },
  {
    name: 'size_up', from: 4, describe: 'the shape gets bigger',
    fits: (f) => f.size < SIZES[SIZES.length - 1],
    apply: (f) => ({ ...f, size: cycle(SIZES, f.size, 1) }),
  },
  {
    name: 'count_down', from: 5, describe: 'one fewer shape each time',
    fits: (f) => f.count >= 2,
    apply: (f) => ({ ...f, count: f.count - 1 }),
  },
  {
    name: 'shape_next', from: 6, describe: 'the shape changes to the next one along',
    fits: () => true,
    apply: (f) => ({ ...f, shape: cycle(SHAPES, f.shape, 1) }),
  },
  {
    name: 'rotate_45', from: 7, describe: 'the shape turns an eighth of a turn',
    fits: (f) => rotationVisible(f.shape, 45),
    apply: (f) => ({ ...f, rotation: (f.rotation + 45) % 360 }),
  },
  {
    name: 'count_double', from: 8, describe: 'the number of shapes doubles',
    fits: (f) => f.count * 2 <= 4,
    apply: (f) => ({ ...f, count: f.count * 2 }),
  },
  {
    name: 'shade_back', from: 9, describe: 'the shading empties out one step',
    fits: (f) => f.shading !== 'none',
    apply: (f) => ({ ...f, shading: cycle(SHADINGS, f.shading, -1) }),
  },
  {
    name: 'flip', from: 10, describe: 'the shape flips to face the other way',
    fits: (f) => ASYMMETRIC.has(f.shape),
    apply: (f) => ({ ...f, flipped: !f.flipped }),
  },
]

// How many rules fire at once. This IS the difficulty curve.
export function ruleCount(level) {
  if (level <= 4) return 1
  if (level <= 8) return 2
  if (level <= 12) return 3
  return 4
}

export const applyRules = (f, rules) => rules.reduce((acc, r) => r.apply(acc), f)

// Rules that would collide make an unreadable item, so they are never combined.
//
// Note count and size share the group `scale`. That is not tidiness: the
// renderer draws each copy smaller when there are more of them, so four large
// shapes are drawn smaller than one small shape. If a count rule and a size rule
// fire together, "the shape gets bigger" makes the shapes visibly SHRINK. The
// two dimensions are only comparable while the other is held still.
export const RULE_GROUP = {
  count_up: 'scale', count_down: 'scale', count_double: 'scale', size_up: 'scale',
  shade_step: 'shading', shade_back: 'shading',
  rotate_90: 'rotation', rotate_45: 'rotation',
  shape_next: 'shape', flip: 'flipped',
}
const ATTRIBUTE = RULE_GROUP

// `bases` are every figure the rules will be applied to (both stems of a 2x2
// matrix, every cell of a series). A rule is only eligible if it fits them all.
export function chooseRules(rng, level, bases, n) {
  const pool = RULES.filter((r) => level >= r.from && bases.every((b) => r.fits(b)))
  const chosen = []
  const usedAttributes = new Set()
  for (const rule of rng.shuffle(pool)) {
    if (usedAttributes.has(ATTRIBUTE[rule.name])) continue
    usedAttributes.add(ATTRIBUTE[rule.name])
    chosen.push(rule)
    if (chosen.length === n) break
  }
  return chosen
}
