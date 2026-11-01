import type { Picture } from '../components/hero'
import { Linear, lit, paint, paints, Radial, type Stop } from './paint'

// A dawn sky, from deep violet up high to pink at the horizon.
const ember: readonly Stop[] = [
  [0.1, 'text-on-primary-fixed-variant'],
  [1, 'text-tertiary-fixed-dim'],
]

// Dark water or ground under a horizon, deep violet going deeper.
const deep: readonly Stop[] = [
  [0, 'text-on-primary-fixed-variant'],
  [1, 'text-on-primary-fixed'],
]

// A pink glow around something bright, fading out.
const blaze: readonly Stop[] = [
  [0, 'text-tertiary-fixed', 0.6],
  [1, 'text-tertiary-fixed', 0],
]

/** The pictures of the home page and of the sections' own pages. */
export const site: Record<string, Picture> = {
  // The cover of the album on the home page's wall (wall/player.tsx), "Lumen": a sun going down
  // on a violet night, pale pink to lavender, cut by bars of the dark across its lower half, a
  // pink glow around it and a dark sea under it.
  '/': {
    ground: 'bg-on-primary-fixed',
    shapes: (
      <>
        <defs>
          <Linear
            id="home-sky"
            stops={[
              [0, 'text-on-primary-fixed'],
              [1, 'text-on-primary-fixed-variant'],
            ]}
            y2={100}
          />
          <Linear
            id="home-sun"
            stops={[
              [0, 'text-tertiary-fixed'],
              [1, 'text-primary-fixed-dim'],
            ]}
            y1={30}
            y2={100}
          />
          <filter
            id="home-bloom"
            filterUnits="userSpaceOnUse"
            x={-150}
            y={-150}
            width={450}
            height={425}
          >
            <feGaussianBlur stdDeviation={10} />
          </filter>
          <mask id="home-bars">
            <rect x={-300} y={-300} width={750} height={800} fill="white" />
            <path d="M-300 72h750v1.6h-750zm0 7h750v2.4h-750zm0 7.5h750v3.2h-750zm0 7.5h750v4h-750z" />
          </mask>
        </defs>
        <rect x={-300} y={-300} width={750} height={800} fill={paint('home-sky')} />
        <ellipse
          cx={75}
          cy={72}
          rx={50}
          ry={40}
          filter={paint('home-bloom')}
          className="fill-tertiary-fixed-dim/55"
        />
        <circle cx={75} cy={66} r={36} fill={paint('home-sun')} mask={paint('home-bars')} />
        <rect x={-300} y={102} width={750} height={300} className="fill-on-primary-fixed" />
        <path d="M-300 102H450" strokeWidth={0.8} className="stroke-tertiary-fixed/80" />
      </>
    ),
  },

  // Beginning: a pale sun rising out of dark water into a rose dawn, its light on the water.
  '/get-started': {
    ground: 'bg-on-primary-fixed-variant',
    shapes: (
      <>
        <defs>
          <Linear id="get-started-ember" stops={ember} y2={84} />
          <Linear id="get-started-deep" stops={deep} y1={84} y2={125} />
          <Radial id="get-started-pearl" stops={paints.pearl} {...lit} />
          <Radial id="get-started-blaze" stops={blaze} />
        </defs>
        <rect x={-300} y={-300} width={750} height={800} fill={paint('get-started-ember')} />
        <circle cx={75} cy={84} r={78} fill={paint('get-started-blaze')} />
        <circle cx={75} cy={84} r={32} fill={paint('get-started-pearl')} />
        <rect x={-300} y={84} width={750} height={400} fill={paint('get-started-deep')} />
        <rect x={51} y={91} width={48} height={3.5} rx={1.75} className="fill-primary-fixed/50" />
        <rect x={59} y={99} width={32} height={3} rx={1.5} className="fill-primary-fixed/35" />
        <rect x={66} y={106} width={18} height={2.5} rx={1.25} className="fill-primary-fixed/20" />
      </>
    ),
  },

  // The tonal palette as a sunrise of tones: bands from pale to deep around a glowing source.
  '/theme': {
    ground: 'bg-tertiary-fixed',
    shapes: (
      <>
        <defs>
          <Linear id="theme-moon" stops={paints.moon} />
          <Linear id="theme-dusk" stops={paints.dusk} y1={140} y2={0} />
          <Linear id="theme-glass" stops={paints.glass} x1={13} x2={137} y2={0} />
          <Radial id="theme-pearl" stops={paints.pearl} {...lit} />
          <Radial id="theme-glow" stops={paints.glow} />
        </defs>
        <rect x={-300} y={-300} width={750} height={800} fill={paint('theme-moon')} />
        <circle cx={75} cy={134} r={128} className="fill-primary-fixed-dim" />
        <circle cx={75} cy={134} r={106} className="fill-tertiary-fixed-dim" />
        <circle cx={75} cy={134} r={84} fill={paint('theme-dusk')} />
        <circle cx={75} cy={134} r={62} fill={paint('theme-glass')} />
        <circle cx={75} cy={134} r={52} fill={paint('theme-glow')} />
        <circle cx={75} cy={134} r={26} fill={paint('theme-pearl')} />
      </>
    ),
  },

  // Building blocks in balance: a slab, a pill and a sphere, stacked in a dusk-lit niche.
  '/components': {
    ground: 'bg-tertiary-fixed-dim',
    shapes: (
      <>
        <defs>
          <Linear id="components-blush" stops={paints.blush} />
          <Linear id="components-dusk" stops={paints.dusk} y1={20} />
          <Linear id="components-glass" stops={paints.glass} x1={47} x2={103} y2={0} />
          <Radial id="components-pearl" stops={paints.pearl} {...lit} />
          <Radial id="components-rose" stops={paints.rose} {...lit} />
          <Radial id="components-glow" stops={paints.glow} />
        </defs>
        <rect x={-300} y={-300} width={750} height={800} fill={paint('components-blush')} />
        <path d="M33 300V60A42 42 0 0 1 117 60V300Z" fill={paint('components-dusk')} />
        <rect x={47} y={92} width={56} height={80} rx={7} fill={paint('components-glass')} />
        <rect x={55} y={76} width={40} height={16} rx={8} fill={paint('components-rose')} />
        <circle cx={75} cy={60} r={34} fill={paint('components-glow')} />
        <circle cx={75} cy={61} r={15} fill={paint('components-pearl')} />
      </>
    ),
  },
}
