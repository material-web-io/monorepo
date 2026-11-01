import type { ReactNode } from 'react'
import type { Picture } from '../components/hero'
import { Linear, paint } from './paint'

// The pictures' tones (styles.css), each as the class that paints it and that of the pink of
// its tone, a mist that goes over it toward its foot.
const tones = {
  d: ['fill-art-deep', 'text-art-deep-mist'],
  v: ['fill-art-violet', 'text-art-violet-mist'],
  s: ['fill-art-soft', 'text-art-soft-mist'],
  l: ['fill-art-lavender', 'text-art-lavender-mist'],
  p: ['fill-art-pale', 'text-art-pale-mist'],
} as const

type Tone = keyof typeof tones

// The stops of a tone's mist: none of the pink where it starts, and most of it where it ends.
const mist = (tone: Tone) =>
  [
    [0, tones[tone][1], 0],
    [1, tones[tone][1], 0.8],
  ] as const

type GradedProps = {
  /** Unique on the page: prefix it with the picture's name. */
  id: string
  tone: Tone
  /** Where the mist starts, and where it is strongest. */
  from: readonly [number, number]
  to: readonly [number, number]
  children: ReactNode
}

/** Draws its shapes in a tone, a pink mist over it growing along a line. */
function Graded({ id, tone, from: [x1, y1], to: [x2, y2], children }: GradedProps) {
  return (
    <>
      <g className={tones[tone][0]}>{children}</g>
      <g fill={paint(id)}>
        <Linear id={id} stops={mist(tone)} x1={x1} y1={y1} x2={x2} y2={y2} />
        {children}
      </g>
    </>
  )
}

// The color picture's swatches, from the palest lavender to the deepest violet.
const swatches = ['p', 'l', 's', 'v', 'd'] as const

// The shape picture's squares, from the outside in, each 22 smaller than the one around it and
// sitting low in it: the top left of each, its width, its corner radius, from none to a circle's,
// and its tone.
const squares = [
  [17, 4.5, 116, 0, 'd'],
  [28, 21, 94, 8, 'v'],
  [39, 37.5, 72, 16, 's'],
  [50, 54, 50, 18, 'l'],
  [61, 70.5, 28, 14, 'p'],
] as const

// The spacing picture's hills, from the farthest to the nearest, each ridge twice as far in
// front of the last as that one of the one before it: their outlines, their tones, and the top
// of each and of the one in front, between which its mist grows.
const hills = [
  [
    'M-60 53.5C-42.2 53.3 -24.4 54.2 -6.6 55.5C11.2 56.8 29 58.2 46.8 58.5C64.6 58.7 82.4 57.8 100.2 56.5C118 55.2 135.8 53.8 153.6 53.5C171.4 53.3 189.2 54.2 207 55.5C224.8 56.8 242.6 58.2 260.4 58.5V200H-60Z',
    'l',
    53,
    67,
  ],
  [
    'M-60 61.7C-45.3 63.1 -30.7 65.4 -16 66.6C-1.4 67.8 13.3 67.7 28 66.3C42.6 64.9 57.3 62.6 71.9 61.4C86.6 60.2 101.3 60.3 115.9 61.7C130.6 63.1 145.3 65.4 159.9 66.6C174.6 67.8 189.2 67.7 203.9 66.3C218.6 64.9 233.2 62.6 247.9 61.4V200H-60Z',
    's',
    60,
    86,
  ],
  [
    'M-60 74.3C-47.4 73.3 -34.9 75.2 -22.3 78.2C-9.7 81.2 2.8 84.8 15.4 85.7C28 86.7 40.5 84.8 53.1 81.8C65.7 78.8 78.2 75.2 90.8 74.3C103.4 73.3 115.9 75.2 128.5 78.2C141.1 81.2 153.6 84.8 166.2 85.7C178.8 86.7 191.3 84.8 203.9 81.8C216.5 78.8 229 75.2 241.6 74.3V200H-60Z',
    'v',
    73,
    121,
  ],
  [
    'M-60 114.9C-44.3 119.4 -28.6 122 -12.9 120.5C2.8 119 18.5 113.5 34.2 109.1C50 104.6 65.7 102 81.4 103.5C97.1 105 112.8 110.5 128.5 114.9C144.2 119.4 159.9 122 175.6 120.5C191.3 119 207 113.5 222.7 109.1V200H-60Z',
    'd',
    102,
    176,
  ],
] as const

// The elevation picture's stones, from the bottom up, each resting on the one under it: the
// middle of each, its width and its height, its tilt, and its tone, paler the higher it is.
const stones = [
  [75, 93.4, 80, 30, -3, 'd'],
  [78, 68.9, 60, 24, 4, 'v'],
  [73, 50, 45, 19, -5, 's'],
  [77, 36.1, 32, 14, 3, 'l'],
  [74, 26.8, 21, 10, -4, 'p'],
] as const

// The motion picture's pendulum, 116 long from a pivot at (75, -26), caught at even times through
// one swing: where its bob is, its tone and its rod's color, pale long ago and deep now.
const swing = [
  [13.5, 72.4, 'p', 'stroke-art-deep/20'],
  [21.1, 76.7, 'l', 'stroke-art-deep/30'],
  [43, 85.5, 'l', 'stroke-art-deep/40'],
  [75, 90, 's', 'stroke-art-deep/50'],
  [107, 85.5, 'v', 'stroke-art-deep/60'],
  [128.9, 76.7, 'v', 'stroke-art-deep/70'],
  [136.5, 72.4, 'd', 'stroke-art-deep/80'],
] as const

// The state picture's moons, along an arc from new to full: the middle of each, and its phase,
// from 0, new, to 1, full.
const moons = [
  [19.8, 79.8, 0],
  [42.6, 55.1, 0.25],
  [75, 46, 0.5],
  [107.4, 55.1, 0.75],
  [130.2, 79.8, 1],
] as const

// The lit part of a moon 13 wide at its phase, lit from the right: its edge on the right, a
// little wider than the moon, so that none of the dark shows around it, and the line where the
// light meets the dark, an ellipse narrowest at the half.
const lit = (x: number, y: number, phase: number) => {
  const r = 13.25
  const bulge = Math.abs(1 - 2 * phase) * r
  return `M${x} ${y - r}A${r} ${r} 0 0 1 ${x} ${y + r}A${bulge} ${r} 0 0 ${phase < 0.5 ? 0 : 1} ${x} ${y - r}Z`
}

// The forms in the layout picture's tiles, as the middle and the radius of a circle cut by its
// tile, 50 wide: a quarter about a corner, a half on a side, or a whole one.
const forms = {
  tl: [0, 0, 50],
  tr: [50, 0, 50],
  br: [50, 50, 50],
  bl: [0, 50, 50],
  t: [25, 0, 25],
  r: [50, 25, 25],
  b: [25, 50, 25],
  l: [0, 25, 25],
  o: [25, 25, 20],
} as const

// The layout picture's tiles in rows from (-100, -87.5), enough to fill a picture of any shape:
// each one's tone, or `_` where it is open onto the gradient, and the form in it, if any, with
// its tone.
const tiles: readonly (readonly (`${Tone | '_'} ${keyof typeof forms} ${Tone}` | Tone)[])[] = [
  ['d br l', '_ o v', 'v b p', 'd tl s', '_ br d', '_ o d', 'd t p'],
  ['v o p', 'd b l', '_ tr s', '_ br d', 'd bl l', '_ t v', 's br d'],
  ['_ tr d', 'v br p', 'd bl l', '_ b v', 'v o p', 'd bl s', '_ o v'],
  ['d r l', '_ tr v', 's l d', 'd', '_ tl d', 's b d', '_ tl v'],
  ['s tl p', 'd t s', '_ tr d', 'v o l', '_ tl d', 'd r p', 'v bl l'],
  ['_ tr v', '_ bl d', 'd o p', 's tr d', 'd t l', '_ br v', 'd o s'],
]

/** The pictures of the Theme section's pages. */
export const theme: Record<string, Picture> = {
  // A tonal palette as a fan of swatches on a gradient, from the palest lavender to the deepest
  // violet, each going pink toward the pin below the picture it turns on.
  '/theme/color': {
    ground: 'docs-gradient-blush',
    shapes: (
      <>
        {swatches.toReversed().map((tone, index) => (
          <g key={tone} transform={`rotate(${(swatches.length - 1 - index) * 16} 16 158)`}>
            <Graded id={`color-${tone}`} tone={tone} from={[0, 13]} to={[0, 125]}>
              <rect x={1} y={13} width={30} height={162} rx={15} />
            </Graded>
          </g>
        ))}
      </>
    ),
  },

  // A type specimen: a bold A in the deepest violet and a bold a in a softer one, each going
  // pink toward its foot, on a gradient, in the site's own typeface, a full stop after them,
  // under the lines of their heights.
  '/theme/typography': {
    ground: 'docs-gradient-ember',
    shapes: (
      <>
        <path
          d="M-300 20H450M-300 42H450M-300 129H450"
          strokeWidth={0.5}
          className="stroke-art-deep/30"
        />
        <path d="M-300 104H450" strokeWidth={0.7} className="stroke-art-deep/50" />
        <Graded id="typography-cap" tone="d" from={[0, 20]} to={[0, 104]}>
          <text x={-4} y={104} fontSize={118} className="font-brand font-bold select-none">
            A
          </text>
        </Graded>
        <Graded id="typography-small" tone="s" from={[0, 42]} to={[0, 104]}>
          <text x={76} y={104} fontSize={118} className="font-brand font-bold select-none">
            a
          </text>
          <circle cx={145} cy={99} r={5} />
        </Graded>
      </>
    ),
  },

  // Squares nested on a gradient, each sitting low in the one around it and rounder than it,
  // from a sharp one of the deepest violet to a circle of the palest lavender, each going pink
  // toward its foot.
  '/theme/shape': {
    ground: 'docs-gradient-dawn',
    shapes: (
      <>
        {squares.map(([x, y, size, radius, tone]) => (
          <Graded key={tone} id={`shape-${tone}`} tone={tone} from={[0, y]} to={[0, y + size]}>
            <rect x={x} y={y} width={size} height={size} rx={radius} />
          </Graded>
        ))}
      </>
    ),
  },

  // Flat hills under a pale sun on a gradient, each ridge twice as far in front of the last as
  // that one of the one before it, from lavender far off to the deepest violet near, each going
  // pink toward its foot.
  '/theme/spacing': {
    ground: 'docs-gradient-dusk',
    shapes: (
      <>
        <Graded id="spacing-sun" tone="p" from={[0, 24]} to={[0, 64]}>
          <circle cx={104} cy={44} r={20} />
        </Graded>
        {hills.map(([outline, tone, top, foot]) => (
          <Graded key={tone} id={`spacing-${tone}`} tone={tone} from={[0, top]} to={[0, foot]}>
            <path d={outline} />
          </Graded>
        ))}
      </>
    ),
  },

  // A cairn on a gradient: stones stacked on their shadow, each smaller and paler than the one
  // it rests on, from the deepest violet to the palest lavender, each going pink toward its
  // foot.
  '/theme/elevation': {
    ground: 'docs-gradient-glow',
    shapes: (
      <>
        <ellipse cx={75} cy={106} rx={52} ry={4} className="fill-art-deep/20" />
        {stones.map(([x, y, width, height, tilt, tone]) => (
          <g key={y} transform={`rotate(${tilt} ${x} ${y})`}>
            <Graded
              id={`elevation-${y}`}
              tone={tone}
              from={[0, y - height * 0.58]}
              to={[0, y + height * 0.42]}
            >
              <path
                d={`M${x - width / 2} ${y}A${width / 2} ${height * 0.58} 0 0 1 ${x + width / 2} ${y}A${width / 2} ${height * 0.42} 0 0 1 ${x - width / 2} ${y}Z`}
              />
            </Graded>
          </g>
        ))}
      </>
    ),
  },

  // A pendulum on a gradient caught at even times through one swing, as a chronophotograph
  // would: close together where it slows to turn and far apart where it is fastest, from the
  // palest lavender long ago to the deepest violet now, each bob going pink toward its foot.
  '/theme/motion': {
    ground: 'docs-gradient-blush',
    shapes: (
      <>
        {swing.map(([x, y, , rod]) => (
          <path key={x} d={`M75 -26L${x} ${y}`} strokeWidth={0.8} className={rod} />
        ))}
        <circle cx={75} cy={-26} r={2} className="fill-art-deep" />
        {swing.map(([x, y, tone]) => (
          <Graded key={x} id={`motion-${x}`} tone={tone} from={[0, y - 10]} to={[0, y + 10]}>
            <circle cx={x} cy={y} r={10} />
          </Graded>
        ))}
      </>
    ),
  },

  // A moon in its phases on a gradient, rising new along an arc, half at its top and setting
  // full: one thing in its states, its dark in the deepest violet and its light in the palest
  // lavender, each going pink toward its foot.
  '/theme/state': {
    ground: 'docs-gradient-ember',
    shapes: (
      <>
        {moons.map(([x, y, phase]) => (
          <g key={x}>
            {phase < 1 && (
              <Graded id={`state-dark-${x}`} tone="d" from={[0, y - 13]} to={[0, y + 13]}>
                <circle cx={x} cy={y} r={13} />
              </Graded>
            )}
            {phase > 0 && (
              <Graded id={`state-light-${x}`} tone="p" from={[0, y - 13]} to={[0, y + 13]}>
                <path d={lit(x, y, phase)} />
              </Graded>
            )}
          </g>
        ))}
      </>
    ),
  },

  // Tiles in the manner of the Bauhaus filling the picture, each holding a quarter of a circle,
  // half of one or a whole one, in the violets from the deepest to the palest, each going pink
  // toward its tile's bottom right, some open onto the gradient. Each tile runs a unit under the
  // next, so no seam shows.
  '/theme/layout': {
    ground: 'docs-gradient-dawn',
    shapes: (
      <>
        <defs>
          {Object.keys(tones).map((tone) => (
            <Linear key={tone} id={`layout-${tone}`} stops={mist(tone as Tone)} x2={50} y2={50} />
          ))}
        </defs>
        {tiles.map((row, y) =>
          row.map((tile, x) => {
            const [ground, form, color] = tile.split(' ') as [
              Tone | '_',
              keyof typeof forms | undefined,
              Tone | undefined,
            ]
            const [cx, cy, r] = form ? forms[form] : []
            // A form against the tile's left or top edge covers it, and the ground starts a unit
            // in from it, so that none of the ground shows between the form and the tile before.
            const left = cx === 0 ? 1 : 0
            const top = cy === 0 ? 1 : 0
            return (
              <svg key={`${x} ${y}`} x={-100 + x * 50} y={-87.5 + y * 50} width={51} height={51}>
                {ground !== '_' && (
                  <g fill={paint(`layout-${ground}`)}>
                    <rect
                      x={left}
                      y={top}
                      width={51 - left}
                      height={51 - top}
                      className={tones[ground][0]}
                    />
                    <rect x={left} y={top} width={51 - left} height={51 - top} />
                  </g>
                )}
                {color && (
                  <g fill={paint(`layout-${color}`)}>
                    <circle cx={cx} cy={cy} r={r} className={tones[color][0]} />
                    <circle cx={cx} cy={cy} r={r} />
                  </g>
                )}
              </svg>
            )
          }),
        )}
      </>
    ),
  },

  // A gentle ramp of a softer violet up to an open doorway in a wall of the deepest violet on
  // a gradient, its light falling out onto the ramp, each going pink toward the near end of it.
  '/theme/accessibility': {
    ground: 'docs-gradient-dusk',
    shapes: (
      <>
        <defs>
          <Linear
            id="accessibility-light"
            stops={[
              [0, 'text-tertiary-fixed', 0.6],
              [1, 'text-tertiary-fixed', 0],
            ]}
            y1={96}
            y2={150}
          />
        </defs>
        <Graded id="accessibility-wall" tone="d" from={[0, -40]} to={[0, 176]}>
          <rect x={70} y={-300} width={380} height={800} />
        </Graded>
        <Graded id="accessibility-door" tone="p" from={[0, 30]} to={[0, 96]}>
          <path d="M86 96V48A18 18 0 0 1 122 48V96Z" />
        </Graded>
        <Graded id="accessibility-ramp" tone="s" from={[122, 0]} to={[-60, 0]}>
          <path d="M-300 150L86 96H122V400H-300Z" />
        </Graded>
        <path d="M86 96H122V160H36Z" fill={paint('accessibility-light')} />
      </>
    ),
  },
}
