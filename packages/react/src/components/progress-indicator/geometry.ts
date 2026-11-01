/* The outlines a progress indicator is clipped to (progress-indicator.tsx): a stroke of a
 * given thickness with round caps along a straight or a wavy center line, as one closed
 * path of cubic curves, the same number of them whatever the length, so that browsers
 * can go from one outline to the next. Lengths in px, angles in radians. */

export type Point = readonly [number, number]

/** The wave along a center line: its peak height, its length in px, and where in a wavelength it starts. */
export type Wave = { amplitude: number; wavelength: number; phase: number }

/* The shape of a wave over one wavelength, as a function of the position in wavelengths:
 * Material's, two parabolas of a half wavelength each, which peak at 1 and -1. */
function shape(u: number): [value: number, slope: number, curvature: number] {
  const f = u - Math.floor(u)
  if (f < 0.5) {
    const g = 2 * f
    return [4 * g * (1 - g), 8 * (1 - 2 * g), -32]
  }
  const g = 2 * f - 1
  return [-4 * g * (1 - g), -8 * (1 - 2 * g), 32]
}

const kappa = 0.5522847498 // A quarter circle's cubic handle, as a share of its radius

const fixed = (value: number) => (Math.round(value * 100) / 100).toString()

/** A closed path of cubic curves through nodes with tangents, with the caps given as quarter arcs. */
class Outline {
  private parts: string[] = []
  move([x, y]: Point) {
    this.parts.push(`M${fixed(x)} ${fixed(y)}`)
  }
  curve(a: Point, b: Point, to: Point) {
    this.parts.push(
      `C${fixed(a[0])} ${fixed(a[1])} ${fixed(b[0])} ${fixed(b[1])} ${fixed(to[0])} ${fixed(to[1])}`,
    )
  }
  /** A quarter circle from `from` to `to` about `center`, leaving along `out` and arriving along `in`. */
  arc(center: Point, radius: number, from: Point, out: Point, to: Point, inward: Point) {
    void center
    const k = kappa * radius
    this.curve(
      [from[0] + k * out[0], from[1] + k * out[1]],
      [to[0] - k * inward[0], to[1] - k * inward[1]],
      to,
    )
  }
  close() {
    return this.parts.join('') + 'Z'
  }
}

export type Sample = { point: Point; tangent: Point; normal: Point; normalRate: Point }

/* Each node of an edge: the center line's point and derivative there, with the unit normal
 * and its derivative, so that the edge offset by half the thickness has an exact tangent. */
export function sample(point: Point, first: Point, second: Point): Sample {
  const speed = Math.hypot(first[0], first[1])
  const unit: Point = [first[0] / speed, first[1] / speed]
  // The normal is the tangent turned a quarter turn; its rate comes from the curvature.
  const normal: Point = [unit[1], -unit[0]]
  const along = (first[0] * second[0] + first[1] * second[1]) / (speed * speed)
  const turn: Point = [
    (second[1] - first[1] * along) / speed,
    -(second[0] - first[0] * along) / speed,
  ]
  return { point, tangent: first, normal, normalRate: turn }
}

/** Draws the closed outline of a stroke of `thickness` along sampled center-line nodes, each `step` on in the parameter from the one before. */
export function strokeOutline(nodes: Sample[], thickness: number, step: number | number[]) {
  const r = thickness / 2
  const handle = (i: number) => (typeof step === 'number' ? step : step[i]!) / 3
  const offset = (s: Sample, side: number): Point => [
    s.point[0] + side * r * s.normal[0],
    s.point[1] + side * r * s.normal[1],
  ]
  const rate = (s: Sample, side: number): Point => [
    s.tangent[0] + side * r * s.normalRate[0],
    s.tangent[1] + side * r * s.normalRate[1],
  ]
  const unit = (s: Sample): Point => {
    const speed = Math.hypot(s.tangent[0], s.tangent[1])
    return [s.tangent[0] / speed, s.tangent[1] / speed]
  }
  const out = new Outline()
  const last = nodes.length - 1
  // One side out, along the direction of the stroke.
  out.move(offset(nodes[0]!, 1))
  for (let i = 0; i < last; i++) {
    const [a, b] = [nodes[i]!, nodes[i + 1]!]
    const [da, db] = [rate(a, 1), rate(b, 1)]
    const pa = offset(a, 1)
    const pb = offset(b, 1)
    const h = handle(i)
    out.curve([pa[0] + h * da[0], pa[1] + h * da[1]], [pb[0] - h * db[0], pb[1] - h * db[1]], pb)
  }
  // The cap at the end: half a circle from one side to the other, out through the tip.
  const end = nodes[last]!
  const t = unit(end)
  const tip: Point = [end.point[0] + r * t[0], end.point[1] + r * t[1]]
  out.arc(end.point, r, offset(end, 1), t, tip, [-end.normal[0], -end.normal[1]])
  out.arc(end.point, r, tip, [-end.normal[0], -end.normal[1]], offset(end, -1), [-t[0], -t[1]])
  // The other side back.
  for (let i = last; i > 0; i--) {
    const [a, b] = [nodes[i]!, nodes[i - 1]!]
    const [da, db] = [rate(a, -1), rate(b, -1)]
    const pa = offset(a, -1)
    const pb = offset(b, -1)
    const h = handle(i - 1)
    out.curve([pa[0] - h * da[0], pa[1] - h * da[1]], [pb[0] + h * db[0], pb[1] + h * db[1]], pb)
  }
  // The cap at the start, back through the tail to where the outline began: from the inner
  // side it leaves backward and passes the tail heading outward, over to the outer side.
  const start = nodes[0]!
  const s = unit(start)
  const tail: Point = [start.point[0] - r * s[0], start.point[1] - r * s[1]]
  out.arc(start.point, r, offset(start, -1), [-s[0], -s[1]], tail, start.normal)
  out.arc(start.point, r, tail, start.normal, offset(start, 1), s)
  return out.close()
}

export type LinearOutline = {
  /** Where the center line starts and ends along the track, in px from its start. */
  from: number
  to: number
  thickness: number
  /** The center line's height. */
  y: number
  wave?: Wave
  /** How many nodes the center line is drawn through, the same for every outline of one animation. */
  nodes: number
  /**
   * With a wave, the spacing of fixed nodes from the track's start that the center line is drawn
   * through, so that as the stroke's ends move the nodes stay on the wave and only its ends
   * travel between one outline and the next; the nodes past its end are gathered there.
   */
  grid?: number
}

/** The outline of a horizontal stroke, straight or along a wave, with round caps. */
export function linearOutline({ from, to, thickness, y, wave, nodes, grid }: LinearOutline) {
  const xs: number[] = []
  if (grid && wave && to > from) {
    xs.push(from)
    for (let k = Math.ceil(from / grid); k * grid < to && xs.length < nodes - 1; k++) {
      if (k * grid > from) xs.push(k * grid)
    }
    while (xs.length < nodes) xs.push(to)
  } else {
    const step = nodes > 1 ? (to - from) / (nodes - 1) : 0
    for (let i = 0; i < nodes; i++) xs.push(from + i * step)
  }
  const samples: Sample[] = []
  for (const x of xs) {
    if (!wave || wave.amplitude === 0) {
      samples.push(sample([x, y], [1, 0], [0, 0]))
      continue
    }
    const { amplitude, wavelength, phase } = wave
    const [value, slope, curvature] = shape(x / wavelength - phase)
    const dy = (amplitude * slope) / wavelength
    const ddy = (amplitude * curvature) / (wavelength * wavelength)
    samples.push(sample([x, y + amplitude * value], [1, dy], [0, ddy]))
  }
  return strokeOutline(
    samples,
    thickness,
    xs.slice(1).map((x, i) => x - xs[i]!),
  )
}

export type CircularOutline = {
  center: Point
  /** The radius of the center line. */
  radius: number
  /** Where the arc starts, clockwise from the top, and how far it sweeps, in radians. */
  start: number
  sweep: number
  thickness: number
  nodes: number
}

/** The outline of an arc of the circle, with round caps. */
export function circularOutline({
  center,
  radius,
  start,
  sweep,
  thickness,
  nodes,
}: CircularOutline) {
  const step = nodes > 1 ? sweep / (nodes - 1) : 0
  const samples: Sample[] = []
  for (let i = 0; i < nodes; i++) {
    const a = start + i * step
    const [sin, cos] = [Math.sin(a), Math.cos(a)]
    const r = radius
    const point: Point = [center[0] + r * sin, center[1] - r * cos]
    const first: Point = [r * cos, r * sin]
    const second: Point = [-r * sin, r * cos]
    samples.push(sample(point, first, second))
  }
  return strokeOutline(samples, thickness, step)
}

/** The outline of a dot: a circle, drawn with the same curves as a stroke of no length. */
export function dotOutline(center: Point, diameter: number, nodes: number) {
  return linearOutline({ from: center[0], to: center[0], y: center[1], thickness: diameter, nodes })
}
