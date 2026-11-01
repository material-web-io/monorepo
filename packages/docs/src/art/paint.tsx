/**
 * A color stop of a gradient: where along it, from 0 to 1, the `text-*` class of a theme color,
 * and how opaque it is there, if not wholly.
 */
export type Stop = readonly [offset: number, color: string, opacity?: number]

/**
 * The paints the pictures share, as the stops of a gradient, all in the theme's fixed colors, so
 * that a picture is the same in either scheme.
 */
export const paints = {
  // A sky, from deep violet at its top to lavender at its bottom.
  dusk: [
    [0.1, 'text-on-primary-fixed-variant'],
    [1, 'text-primary-fixed-dim'],
  ],
  // Pink, going lavender at its bottom.
  blush: [
    [0, 'text-tertiary-fixed-dim'],
    [1, 'text-primary-fixed-dim'],
  ],
  // The palest pink, going the palest lavender.
  moon: [
    [0, 'text-tertiary-fixed'],
    [1, 'text-primary-fixed'],
  ],
  // Dark glass, lit at the edge it starts from.
  glass: [
    [0, 'text-on-primary-fixed-variant'],
    [0.45, 'text-on-primary-fixed'],
  ],
  // Spheres, lavender and pink, for `Radial` with `lit`.
  pearl: [
    [0, 'text-primary-fixed'],
    [1, 'text-primary-fixed-dim'],
  ],
  rose: [
    [0, 'text-tertiary-fixed'],
    [1, 'text-tertiary-fixed-dim'],
  ],
  // A glow around something bright, fading out.
  glow: [
    [0, 'text-primary-fixed-dim', 0.45],
    [1, 'text-primary-fixed-dim', 0],
  ],
} satisfies Record<string, readonly Stop[]>

/**
 * The paints of the pictures on a gradient of styles.css (`docs-gradient-*`), in the violets and
 * pinks drawn on those, which are darker or lighter than the gradient in either scheme.
 */
export const onGradient = {
  // A dusk, from the deepest violet at its top to a soft violet at its bottom.
  dusk: [
    [0.1, 'text-art-deep'],
    [1, 'text-art-soft'],
  ],
  // The palest pink, going pale lavender.
  blush: [
    [0, 'text-art-pale-mist'],
    [1, 'text-art-lavender'],
  ],
  // The palest pink, going the palest lavender.
  moon: [
    [0, 'text-art-pale-mist'],
    [1, 'text-art-pale'],
  ],
  // Dark glass, lit at the edge it starts from.
  glass: [
    [0, 'text-art-violet'],
    [0.45, 'text-art-deep'],
  ],
  // Dark glass lit at both its edges, as a rim of light round it.
  rim: [
    [0, 'text-art-soft'],
    [0.18, 'text-art-violet'],
    [0.4, 'text-art-deep'],
    [0.82, 'text-art-deep'],
    [1, 'text-art-violet'],
  ],
  // Spheres for `Radial` with `lit`: a dark one, a lavender one and a pink one.
  orb: [
    [0, 'text-art-soft'],
    [0.45, 'text-art-violet'],
    [1, 'text-art-deep'],
  ],
  pearl: [
    [0, 'text-art-pale'],
    [1, 'text-art-lavender'],
  ],
  rose: [
    [0, 'text-art-pale-mist'],
    [1, 'text-art-lavender-mist'],
  ],
  // A glow around something bright, fading out.
  glow: [
    [0, 'text-art-pale', 0.5],
    [1, 'text-art-pale', 0],
  ],
} satisfies Record<string, readonly Stop[]>

/** Where a sphere's light is, for `Radial`: at its top left, as from a light up there. */
export const lit = { cx: 0.35, cy: 0.3, r: 0.8 }

/** A paint by the id of its gradient, for a `fill` or a `stroke`. */
export const paint = (id: string) => `url(#${id})`

const drawStops = (stops: readonly Stop[]) =>
  stops.map(([offset, color, opacity]) => (
    <stop
      key={`${offset} ${color}`}
      offset={offset}
      stopColor="currentColor"
      stopOpacity={opacity}
      className={color}
    />
  ))

type LinearProps = {
  /** Unique on the page: prefix it with the picture's name. */
  id: string
  stops: readonly Stop[]
  /** Where it runs from and to, in the picture's units: down it, from its top to its bottom. */
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

/** A gradient along a line across the picture, the same for every shape it fills. */
export function Linear({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 125 }: LinearProps) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      {drawStops(stops)}
    </linearGradient>
  )
}

type RadialProps = {
  /** Unique on the page: prefix it with the picture's name. */
  id: string
  stops: readonly Stop[]
  /** Its middle and its reach, in parts of the box of the shape it fills: all of it. */
  cx?: number
  cy?: number
  r?: number
}

/** A gradient out from a point of the shape it fills: a sphere's light (`lit`), or a glow. */
export function Radial({ id, stops, cx = 0.5, cy = 0.5, r = 0.5 }: RadialProps) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {drawStops(stops)}
    </radialGradient>
  )
}
