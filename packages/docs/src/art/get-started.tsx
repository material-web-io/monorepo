import type { Picture } from '../components/hero'
import { Linear, lit, onGradient, paint, Radial, type Stop } from './paint'

// A beam of light in a color, from nothing where it starts to bright where it lands.
const beam = (color: string): readonly Stop[] => [
  [0, color, 0],
  [1, color, 0.75],
]

/** The pictures of the Get started section's pages. */
export const getStarted: Record<string, Picture> = {
  // Installing, in the manner of m3.material.io's Foundations pictures: glowing balls drop into
  // the neck of a glass vessel, dark against a gradient, beside a blush of pink. A grain over all.
  '/get-started/installation': {
    ground: 'docs-gradient-dusk',
    shapes: (
      <>
        <defs>
          <Linear
            id="installation-blush"
            stops={[
              [0, 'text-art-lavender-mist'],
              [1, 'text-art-lavender'],
            ]}
          />
          <Linear id="installation-moon" stops={onGradient.moon} />
          <Linear id="installation-glass" stops={onGradient.glass} x1={52} x2={128} y2={0} />
          <Radial id="installation-pearl" stops={onGradient.pearl} {...lit} />
          <Radial id="installation-rose" stops={onGradient.rose} {...lit} />
          <Radial id="installation-glow" stops={onGradient.glow} />
        </defs>
        <rect x={-300} y={-300} width={362} height={800} fill={paint('installation-blush')} />
        <path
          d="M-300 -10H8C38 -10 52 28 52 63S38 136 8 136H-300Z"
          fill={paint('installation-moon')}
        />
        <path
          d="M90 44C96 44 100 45 100 47C100 50 96 51 96 54V60C96 70 128 76 128 104C128 130 122 150 122 220H58C58 150 52 130 52 104C52 76 84 70 84 60V54C84 51 80 50 80 47C80 45 84 44 90 44Z"
          fill={paint('installation-glass')}
        />
        <path
          d="M59 104C59 88 68 80 78 73"
          strokeWidth={2}
          strokeLinecap="round"
          className="stroke-art-lavender/25 fill-none"
        />
        <circle cx={90} cy={30} r={24} fill={paint('installation-glow')} />
        <circle cx={90} cy={30} r={11} fill={paint('installation-pearl')} />
        <circle cx={90} cy={6} r={5.5} fill={paint('installation-rose')} />
      </>
    ),
  },

  // Reached every way: three pale beams of light meet on one glowing pill, in a dark round
  // window on a gradient, past which they fade out.
  '/get-started/react-aria': {
    ground: 'docs-gradient-glow',
    shapes: (
      <>
        <defs>
          <Radial
            id="react-aria-window"
            stops={[
              [0, 'text-art-violet'],
              [1, 'text-art-deep'],
            ]}
          />
          <Linear id="react-aria-left" stops={beam('text-art-pale-mist')} x1={-40} x2={74} y2={0} />
          <Linear id="react-aria-top" stops={beam('text-art-pale')} y1={-20} y2={52} />
          <Linear
            id="react-aria-low"
            stops={beam('text-art-lavender-mist')}
            x1={22}
            y1={160}
            x2={87}
            y2={75}
          />
          <Radial id="react-aria-pearl" stops={onGradient.pearl} {...lit} />
          <Radial id="react-aria-glow" stops={onGradient.glow} />
        </defs>
        <circle cx={98} cy={64} r={56} fill={paint('react-aria-window')} />
        <path d="M-40 30L74 59V69L-40 100Z" fill={paint('react-aria-left')} />
        <path d="M62 -20H134L102 52H94Z" fill={paint('react-aria-top')} />
        <path d="M-4 160H50L90 76L84 74Z" fill={paint('react-aria-low')} />
        <ellipse cx={98} cy={64} rx={50} ry={36} fill={paint('react-aria-glow')} />
        <rect x={70} y={51} width={56} height={26} rx={13} fill={paint('react-aria-pearl')} />
      </>
    ),
  },

  // One form in three finishes: the same arch, matte, in dark glass, and glowing pale.
  '/get-started/styling': {
    ground: 'docs-gradient-dawn',
    shapes: (
      <>
        <defs>
          <Linear id="styling-glass" stops={onGradient.glass} x1={58} x2={92} y2={0} />
          <Radial id="styling-pearl" stops={onGradient.pearl} {...lit} />
          <Radial id="styling-glow" stops={onGradient.glow} />
        </defs>
        <path d="M16 160V53A17 17 0 0 1 50 53V160Z" className="fill-art-violet" />
        <path d="M58 160V53A17 17 0 0 1 92 53V160Z" fill={paint('styling-glass')} />
        <path
          d="M63 104V56C63 50 66 45 71 42"
          strokeWidth={2}
          strokeLinecap="round"
          className="stroke-art-lavender/25 fill-none"
        />
        <ellipse cx={117} cy={76} rx={36} ry={58} fill={paint('styling-glow')} />
        <path d="M100 160V53A17 17 0 0 1 134 53V160Z" fill={paint('styling-pearl')} />
      </>
    ),
  },

  // Forms that fit together: a disc settled in the doorway of a dark arch, a pink band on the
  // arch's crown, between a pale strip and a gradient.
  '/get-started/composition': {
    ground: 'docs-gradient-blush',
    shapes: (
      <>
        <defs>
          <Linear id="composition-moon" stops={onGradient.moon} />
          <Linear id="composition-blush" stops={onGradient.blush} y1={20} y2={70} />
          <Linear id="composition-glass" stops={onGradient.glass} x1={46} x2={126} y2={0} />
          <Radial id="composition-pearl" stops={onGradient.pearl} {...lit} />
          <Radial id="composition-glow" stops={onGradient.glow} />
        </defs>
        <rect x={-300} y={-300} width={348} height={800} fill={paint('composition-moon')} />
        <path
          d="M36 70A50 50 0 0 1 136 70H126A40 40 0 0 0 46 70Z"
          fill={paint('composition-blush')}
        />
        <path
          d="M46 160V70A40 40 0 0 1 126 70V160ZM66 160V94A20 20 0 0 1 106 94V160Z"
          fillRule="evenodd"
          fill={paint('composition-glass')}
        />
        <circle cx={86} cy={96} r={34} fill={paint('composition-glow')} />
        <circle cx={86} cy={96} r={18} fill={paint('composition-pearl')} />
      </>
    ),
  },
}
