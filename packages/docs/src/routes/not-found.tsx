import { Linear, paint } from '../art/paint'
import { ButtonLink } from '../components/link'

// The parts of the picture, back to front, and their paints: the 0 an arch over a cup, overlapping
// in its middle, then the fours, each a diagonal, a stem and a bar: the first's a triangle and a
// stem round at the foot, the second's a quarter of an oval and a stem square on the baseline.
const parts = [
  {
    d: 'M92 72V46A38 38 0 0 1 168 46V72H146V46A16 16 0 0 0 114 46V72Z',
    fill: 'not-found-lavender',
  },
  { d: 'M92 48V74A38 38 0 0 0 168 74V48H146V74A16 16 0 0 1 114 74V48Z', fill: 'not-found-pink' },
  { d: 'M68 8L10 82H68Z', fill: 'not-found-pink' },
  { d: 'M57 19A11 11 0 0 1 79 19V101A11 11 0 0 1 57 101Z', fill: 'not-found-violet' },
  { d: 'M14 70H90A10 10 0 0 1 90 90H14A10 10 0 0 1 14 70Z', fill: 'not-found-lavender' },
  { d: 'M226 8V82H168A58 74 0 0 1 226 8Z', fill: 'not-found-lavender' },
  { d: 'M215 19A11 11 0 0 1 237 19V112H215Z', fill: 'not-found-violet' },
  { d: 'M172 70H248A10 10 0 0 1 248 90H172A10 10 0 0 1 172 70Z', fill: 'not-found-pink' },
].map((part, index) => ({ ...part, id: `not-found-part-${index}` }))

/**
 * The page at an address the site has no page at: as tall as the window leaves it, and in its
 * middle 404 over what happened and the way back home.
 */
export default function NotFound() {
  return (
    <section className="docs-not-found">
      {/* 404 of flat shapes laid over each other as in print, darker where they overlap: deep
        violet stems (pale in a dark scheme), lavender and pink diagonals and bars, and a 0 of a
        lavender arch over a pink cup. The pictures' grain lies over the shapes alone. */}
      <div aria-hidden="true" className="docs-not-found-picture">
        <svg viewBox="0 0 260 120" className="docs-not-found-art">
          <defs>
            <Linear
              id="not-found-violet"
              stops={[
                [0, 'text-primary'],
                [1, 'text-on-primary-container'],
              ]}
              y1={8}
              y2={112}
            />
            <Linear
              id="not-found-lavender"
              stops={[
                [0, 'text-primary-fixed-dim'],
                [1, 'text-art-soft'],
              ]}
              y1={8}
              y2={112}
            />
            <Linear
              id="not-found-pink"
              stops={[
                [0, 'text-tertiary-fixed-dim'],
                [1, 'text-art-coral'],
              ]}
              y1={8}
              y2={112}
            />
            {/* The parts in parts of the picture, where its grain lies. */}
            <clipPath
              id="not-found-shapes"
              clipPathUnits="objectBoundingBox"
              transform={`scale(${1 / 260} ${1 / 120})`}
            >
              {parts.map(({ id }) => (
                <use key={id} href={`#${id}`} />
              ))}
            </clipPath>
          </defs>
          <g className="isolate">
            {parts.map(({ id, d, fill }) => (
              <path key={id} id={id} d={d} fill={paint(fill)} className="mix-blend-multiply" />
            ))}
          </g>
        </svg>
        <div className="docs-not-found-grain" />
      </div>
      <div className="docs-not-found-text">
        <h1 className="docs-hero-title">Page not found</h1>
        <p className="docs-hero-description">The page you are looking for does not exist.</p>
        <div className="docs-hero-actions">
          <ButtonLink href="/" size="m">
            Go to the home page
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
