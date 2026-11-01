// A closed curve around 0,0 whose radius changes with the angle, scaled to reach 1 from it:
// drawn through `steps` points, each the corner of a curve between the middles of its sides.
const curve = (radius: (angle: number) => number, steps = 96) => {
  const points = Array.from({ length: steps }, (_, step) => {
    const angle = (step / steps) * 2 * Math.PI
    return [radius(angle) * Math.cos(angle), radius(angle) * Math.sin(angle)] as const
  })
  const reach = Math.max(...points.map(([x, y]) => Math.hypot(x, y)))
  const at = (x: number, y: number) => `${(x / reach).toFixed(3)} ${(y / reach).toFixed(3)}`
  const turns = points.map(([x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % steps]!
    return `Q${at(x, y)} ${at((x + nextX) / 2, (y + nextY) / 2)}`
  })
  const [firstX, firstY] = points[0]!
  const [lastX, lastY] = points[steps - 1]!
  return `M${at((firstX + lastX) / 2, (firstY + lastY) / 2)}${turns.join('')}Z`
}

// How far a point of a star is out, from 0 in a hollow to 1 at a tip: `sharp` narrows the tips.
const tip = (points: number, angle: number, sharp: number) =>
  ((1 + Math.cos(points * angle)) / 2) ** sharp

// How far out the outline of a ring of round leaves is at an angle: `leaves` circles of a
// `radius`, their middles a `distance` from 0,0, the first to the right.
const ring = (leaves: number, distance: number, radius: number) => (angle: number) => {
  const span = (2 * Math.PI) / leaves
  const off = ((((angle + span / 2) % span) + span) % span) - span / 2
  return distance * Math.cos(off) + Math.sqrt(radius ** 2 - (distance * Math.sin(off)) ** 2)
}

// A circle of round bumps with round hollows between them, the hollows `depth` in from the
// bumps' reach of 1 and `tight` times as round: arcs, of the radius at which each bump touches
// the hollows by it.
const scallop = (bumps: number, depth: number, tight: number) => {
  const half = Math.PI / bumps
  const middle = (distance: number, angle: number) =>
    [distance * Math.cos(angle), distance * Math.sin(angle)] as const
  // How far apart a bump of a radius and the hollow after it are: nothing when they touch.
  const apart = (radius: number) => {
    const [x, y] = middle(1 - depth + tight * radius, half)
    return Math.hypot(x - (1 - radius), y) - (1 + tight) * radius
  }
  let [less, more] = [0, 0.5]
  for (let step = 0; step < 40; step++) {
    const radius = (less + more) / 2
    if (apart(radius) > 0) less = radius
    else more = radius
  }
  const [bump, hollow] = [less, tight * less]
  // Where a bump meets a hollow: on the line between their middles, the bump's radius along it.
  const meet = (at: number, after: number) => {
    const [bumpX, bumpY] = middle(1 - bump, at * 2 * half)
    const [hollowX, hollowY] = middle(1 - depth + hollow, (after * 2 + 1) * half)
    const share = 1 / (1 + tight)
    return `${(bumpX + (hollowX - bumpX) * share).toFixed(3)} ${(bumpY + (hollowY - bumpY) * share).toFixed(3)}`
  }
  const [out, back] = [bump.toFixed(3), hollow.toFixed(3)]
  const arcs = Array.from(
    { length: bumps },
    (_, at) => `A${out} ${out} 0 0 1 ${meet(at, at)}A${back} ${back} 0 0 0 ${meet(at + 1, at)}`,
  )
  return `M${meet(0, -1)}${arcs.join('')}Z`
}

/**
 * The outlines of a few of Material 3's shapes, each a path around 0,0 that reaches 1 from it,
 * to be placed, turned and sized by a `transform`.
 */
export const shapes = {
  circle: 'M-1 0A1 1 0 1 0 1 0A1 1 0 1 0-1 0Z',
  pill: 'M-0.55-0.45H0.55A0.45 0.45 0 0 1 0.55 0.45H-0.55A0.45 0.45 0 0 1-0.55-0.45Z',
  capsule: 'M-0.22-0.78H0.22A0.78 0.78 0 0 1 0.22 0.78H-0.22A0.78 0.78 0 0 1-0.22-0.78Z',
  arch: 'M-0.7 1V-0.3A0.7 0.7 0 0 1 0.7-0.3V1Z',
  half: 'M-1 0A1 1 0 0 1 1 0Z',
  cookie: curve((angle) => 1 + 0.07 * Math.cos(9 * angle), 108),
  cookie12: scallop(12, 0.12, 0.7),
  clover: curve((angle) => 1 + 0.22 * Math.cos(4 * angle)),
  clover8: curve(ring(8, 0.64, 0.36), 144),
  flower: curve((angle) => 1 + 0.13 * Math.cos(8 * angle)),
  sunny: curve((angle) => 0.76 + 0.24 * tip(8, angle, 1.2)),
  burst: curve((angle) => 0.62 + 0.38 * tip(11, angle, 1.6), 132),
  star: curve((angle) => 0.48 + 0.52 * tip(5, angle, 1.5), 120),
  heart:
    'M0 0.9C-0.86 0.34-1-0.06-1-0.36A0.52 0.52 0 0 1 0-0.52A0.52 0.52 0 0 1 1-0.36C1-0.06 0.86 0.34 0 0.9Z',
  puffy: curve(
    (angle) =>
      1 +
      0.17 * Math.cos(3 * angle + 0.5) +
      0.1 * Math.cos(5 * angle + 2.1) +
      0.07 * Math.cos(2 * angle + 4),
  ),
}
