import { Icon, Ripple, twMerge } from '@material-web/react'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-aria-components'
import { Pre } from '../components/code'
import { react, tailwind } from '../components/names'
import { shapes } from '../components/shapes'
import { Linear, lit, onGradient, paint, Radial } from '../art/paint'
import { pageAt, sections, site } from '../nav'
import Components from '../pictures/components'
import Install from '../pictures/install'
import Overview from '../pictures/overview'
import Theme from '../pictures/theme'
import { useLastScrolledPast } from '../scroll'

/** A card of a part of the page: a link, with the symbol of where it leads. */
type Card = { href: string; title: string; description: string; icon: string }

// A card for a page of the site, under the page's own name and description unless given others.
const to = (path: string, icon: string, given?: Partial<Card>): Card => {
  const page = pageAt(path)
  if (!page) throw new Error(`The Get started page links to ${path}, which is no page`)
  return { href: path, title: page.title, description: page.description, icon, ...given }
}

// A card for a page elsewhere, which opens in a tab of its own.
const out = (href: string, title: string, description: string): Card => ({
  href,
  title,
  description,
  icon: 'arrow_outward',
})

// The three shapes over the title, each with how far it is turned: a clover of eight leaves,
// a slanted pill and a cookie of twelve sides.
const emblems = [
  ['clover8', 22.5],
  ['capsule', -45],
  ['cookie12', 0],
] as const

/** A part of the page: what its card in the header says, its text, its links and its picture. */
type Part = {
  id: string
  title: string
  summary: string
  text: ReactNode
  cards: Card[]
  /** The gradient its picture's shapes are on (styles.css). */
  ground: string
  /**
   * The shapes of its picture, in a box 128 wide and 160 tall that covers the panel, and what
   * stands on them (pictures/), which covers the middle: the shapes show around it.
   */
  art: ReactNode
  picture: ReactNode
}

const parts: Part[] = [
  {
    id: 'whats-material-3-for-react-and-tailwind',
    title: `What’s ${site.title}?`,
    summary: 'Two libraries that bring Material Design 3 to React and Tailwind CSS.',
    text: (
      <>
        <p className="docs-p">
          {site.title} brings Material Design 3 to the web as two libraries. {react} is a library of
          accessible React components, and {tailwind} is a theme that provides the Material 3 design
          tokens for Tailwind CSS v4.
        </p>
        <p className="docs-p">
          The two work together or apart. The components come with the theme, and the theme can be
          used on its own, with your own components or with another framework.
        </p>
        <p className="docs-p">
          Both follow the Material 3 Expressive specification, and support light and dark color
          schemes, contrast levels, forced-colors mode and reduced motion.
        </p>
      </>
    ),
    cards: [
      out(
        'https://m3.material.io',
        'Material Design 3',
        'The design system that both libraries implement.',
      ),
      out(
        'https://react-aria.adobe.com/',
        'React Aria',
        'The props, parts and providers that the components accept.',
      ),
      out(site.repository, 'Source code', 'Both libraries and this documentation, on GitHub.'),
    ],
    // Two libraries as two forms on a gradient: a dark cookie setting in its top corner and a pink
    // clover rising from the bottom one, with a small moon across from them.
    ground: 'docs-gradient-blush',
    art: (
      <>
        <defs>
          <Linear id="start-overview-blush" stops={onGradient.blush} y1={-1} y2={1} />
          <Radial id="start-overview-orb" stops={onGradient.orb} {...lit} />
          <Radial id="start-overview-glow" stops={onGradient.glow} />
          <Radial id="start-overview-pearl" stops={onGradient.pearl} {...lit} />
        </defs>
        <circle cx={112} cy={20} r={58} fill={paint('start-overview-glow')} />
        <path
          d={shapes.cookie}
          transform="translate(112 20) rotate(12) scale(38)"
          fill={paint('start-overview-orb')}
        />
        <path
          d={shapes.clover}
          transform="translate(4 152) rotate(20) scale(44)"
          fill={paint('start-overview-blush')}
        />
        <circle cx={24} cy={24} r={18} fill={paint('start-overview-glow')} />
        <circle cx={24} cy={24} r={7} fill={paint('start-overview-pearl')} />
      </>
    ),
    picture: <Overview />,
  },
  {
    id: 'install',
    title: 'Install',
    summary: 'Install the components, or the theme on its own.',
    text: (
      <>
        <p className="docs-p">
          To use the components, install {react} in a React 19 project that uses Tailwind CSS v4. It
          includes {tailwind} as a dependency, so the theme comes with it.
        </p>
        <Pre>
          <code>npm install @material-web/react</code>
        </Pre>
        <p className="docs-p">
          To use the theme on its own, install {tailwind} in a project that uses Tailwind CSS v4.
        </p>
        <Pre>
          <code>npm install @material-web/tailwind</code>
        </Pre>
        <p className="docs-p">
          Then import the library’s stylesheet, and load the Roboto and Material Symbols Outlined
          fonts.
        </p>
      </>
    ),
    cards: [to('/get-started/installation', 'download')],
    // As the Installation page's picture: the shapes over the page's title fall one after the
    // other down a beam of light toward the card, under which those already in lie in a heap,
    // large and cropped by the bottom edge, against the glow of the gradient.
    ground: 'docs-gradient-glow',
    art: (
      <>
        <defs>
          <Linear
            id="start-install-beam"
            stops={[
              [0, 'text-art-pale', 0],
              [1, 'text-art-pale', 0.35],
            ]}
            y1={-20}
            y2={52}
          />
          <Radial id="start-install-glow" stops={onGradient.glow} />
          <Radial id="start-install-orb" stops={onGradient.orb} {...lit} />
          <Radial id="start-install-pearl" stops={onGradient.pearl} {...lit} />
          <Radial id="start-install-rose" stops={onGradient.rose} {...lit} />
        </defs>
        <path d="M60 -20H68L82 64H46Z" fill={paint('start-install-beam')} />
        <path
          d={shapes.capsule}
          transform="translate(98 150) rotate(-12) scale(28)"
          fill={paint('start-install-pearl')}
        />
        <path
          d={shapes.cookie12}
          transform="translate(28 158) rotate(10) scale(32)"
          fill={paint('start-install-orb')}
        />
        <path
          d={shapes.clover8}
          transform="translate(66 152) rotate(22.5) scale(20)"
          fill={paint('start-install-rose')}
        />
        <path
          d={shapes.capsule}
          transform="translate(64 6) rotate(-45) scale(4)"
          fill={paint('start-install-pearl')}
        />
        <path
          d={shapes.cookie12}
          transform="translate(64 21) rotate(10) scale(5.5)"
          fill={paint('start-install-rose')}
        />
        <circle cx={64} cy={40} r={20} fill={paint('start-install-glow')} />
        <path
          d={shapes.clover8}
          transform="translate(64 40) rotate(22.5) scale(8)"
          fill={paint('start-install-pearl')}
        />
      </>
    ),
    picture: <Install />,
  },
  {
    id: 'tailwind-theme',
    title: 'Tailwind theme',
    summary: 'A library of Material 3 design tokens for Tailwind CSS.',
    text: (
      <>
        <p className="docs-p">
          {tailwind} provides the Material 3 design tokens for Tailwind CSS v4. Each token is
          available as a CSS custom property named after the specification, and as a Tailwind
          utility that works alongside Tailwind’s own.
        </p>
        <p className="docs-p">
          Data attributes set the color scheme, the contrast level and the motion scheme, on the
          root element or on any element to apply them to its content. The theme does not depend on
          React, so it works with any framework that uses Tailwind CSS.
        </p>
      </>
    ),
    cards: [
      to('/theme', 'token', { title: 'All tokens' }),
      to('/theme/color', 'contrast'),
      to('/theme/typography', 'text_fields'),
    ],
    // A gradient and a dusk side by side, as a light scheme beside a dark one: a dark glass arch
    // hangs over the gradient, a moon over the dusk, and a pale cookie rises across both.
    ground: 'docs-gradient-dusk',
    art: (
      <>
        <defs>
          <Linear id="start-theme-dusk" stops={onGradient.dusk} y2={160} />
          <Linear id="start-theme-glass" stops={onGradient.rim} x1={14} x2={50} y2={0} />
          <Radial id="start-theme-glow" stops={onGradient.glow} />
          <Radial id="start-theme-pearl" stops={onGradient.pearl} {...lit} />
        </defs>
        <rect x={64} y={-300} width={364} height={760} fill={paint('start-theme-dusk')} />
        <path d="M14 -20V20C14 32 22 42 32 42S50 32 50 20V-20Z" fill={paint('start-theme-glass')} />
        <circle cx={64} cy={154} r={62} fill={paint('start-theme-glow')} />
        <path
          d={shapes.cookie12}
          transform="translate(64 156) rotate(15) scale(40)"
          fill={paint('start-theme-pearl')}
        />
        <circle cx={96} cy={26} r={20} fill={paint('start-theme-glow')} />
        <circle cx={96} cy={26} r={8} fill={paint('start-theme-pearl')} />
      </>
    ),
    picture: <Theme />,
  },
  {
    id: 'react-components',
    title: 'React components',
    summary: 'A library of accessible Material 3 components for React.',
    text: (
      <>
        <p className="docs-p">
          {react} provides the Material 3 components for React: the interactive building blocks of a
          user interface, from buttons and text fields to navigation, dialogs and date pickers.
          Every component follows the Material 3 specification and adapts to the theme.
        </p>
        <p className="docs-p">
          Every component is accessible, with keyboard navigation, focus management and form
          integration, and accepts React Aria props.
        </p>
        <p className="docs-p">
          Components are styled with Tailwind classes that use the tokens of {tailwind}, and you
          customize them the same way, by passing classes of your own. Their content is composed
          from children and slots rather than configured through props.
        </p>
      </>
    ),
    cards: [
      to('/components', 'widgets', { title: 'All components' }),
      to('/get-started/react-aria', 'accessibility_new'),
      to('/get-started/styling', 'format_paint'),
      to('/get-started/composition', 'dashboard_customize'),
    ],
    // Forms as building blocks: a moon high in its corner, a glass arch lit at its rims rising at
    // the other side and a pink flower out of the top one, with a small rose sphere under it all.
    ground: 'docs-gradient-dawn',
    art: (
      <>
        <defs>
          <Linear id="start-components-glass" stops={onGradient.rim} x1={84} x2={148} y2={0} />
          <Linear id="start-components-blush" stops={onGradient.blush} y1={-1} y2={1} />
          <Radial id="start-components-glow" stops={onGradient.glow} />
          <Radial id="start-components-pearl" stops={onGradient.pearl} {...lit} />
          <Radial id="start-components-rose" stops={onGradient.rose} {...lit} />
        </defs>
        <path
          d="M84 260V140C84 120 98 106 116 106S148 120 148 140V260Z"
          fill={paint('start-components-glass')}
        />
        <path
          d={shapes.flower}
          transform="translate(6 22) rotate(10) scale(42)"
          fill={paint('start-components-blush')}
        />
        <circle cx={98} cy={16} r={32} fill={paint('start-components-glow')} />
        <circle cx={98} cy={16} r={12} fill={paint('start-components-pearl')} />
        <circle cx={22} cy={142} r={14} fill={paint('start-components-glow')} />
        <circle cx={22} cy={142} r={6} fill={paint('start-components-rose')} />
      </>
    ),
    picture: <Components />,
  },
]

function StartCard({ href, title, description, icon }: Card) {
  const isOut = href.startsWith('http')
  return (
    <Link
      href={href}
      target={isOut ? '_blank' : undefined}
      rel={isOut ? 'noreferrer' : undefined}
      className="docs-start-card"
    >
      <span className="docs-start-card-text">
        <span className="docs-card-title">{title}</span>
        <span className="docs-card-description">{description}</span>
      </span>
      <span className="docs-start-badge">
        <svg aria-hidden="true" viewBox="-1 -1 2 2" className="absolute inset-0 size-full">
          <path d={shapes.clover} transform="rotate(45)" className="fill-surface" />
        </svg>
        <Icon name={icon} className="relative icon-24" />
      </span>
      <Ripple />
    </Link>
  )
}

/** What the page hands the site's shell: it fills the window, however wide. */
export const handle = { isFullWidth: true }

/**
 * The Get started section's own page: its title over a card for each of its parts, then the
 * parts, each what it is about and where to read on, beside the picture of the one in view.
 */
export default function GetStarted() {
  const section = sections.find(({ path }) => path === '/get-started')
  // The part the middle of the window is in: the first one, until the page has a window.
  const shown =
    useLastScrolledPast(
      parts.map((part) => part.id),
      () => window.innerHeight / 2,
    ) ?? parts[0]?.id
  if (!section) return null
  return (
    <>
      <header className="docs-start-hero">
        {/* The three shapes over the title, writ large in the corners: the clover of dark glass in
          the top left one, the pill pale in the top right one by a small dark sphere, and the
          cookie pink, rising in the bottom right one. Each corner is a square as large as two
          fifths of the header, so the middle stays calm. A fine grain lies over all of it. */}
        <svg aria-hidden="true" className="absolute inset-0 size-full">
          <defs>
            <Radial id="start-header-orb" stops={onGradient.orb} {...lit} />
            <Radial id="start-header-glow" stops={onGradient.glow} />
            <Radial id="start-header-pearl" stops={onGradient.pearl} {...lit} />
            <Radial id="start-header-rose" stops={onGradient.rose} {...lit} />
          </defs>
          <svg
            width="40%"
            height="100%"
            viewBox="0 0 120 120"
            preserveAspectRatio="xMinYMin meet"
            overflow="visible"
          >
            <circle cx={18} cy={6} r={88} fill={paint('start-header-glow')} />
            <path
              d={shapes.clover8}
              transform="translate(18 6) rotate(22.5) scale(62)"
              fill={paint('start-header-orb')}
            />
          </svg>
          <svg
            x="60%"
            width="40%"
            height="100%"
            viewBox="0 0 120 120"
            preserveAspectRatio="xMaxYMin meet"
            overflow="visible"
          >
            <circle cx={98} cy={22} r={54} fill={paint('start-header-glow')} />
            <path
              d={shapes.capsule}
              transform="translate(98 22) rotate(-45) scale(36)"
              fill={paint('start-header-pearl')}
            />
            <circle cx={112} cy={72} r={7} fill={paint('start-header-orb')} />
          </svg>
          <svg
            x="60%"
            width="40%"
            height="100%"
            viewBox="0 0 120 120"
            preserveAspectRatio="xMaxYMax meet"
            overflow="visible"
          >
            <path
              d={shapes.cookie12}
              transform="translate(94 124) rotate(8) scale(50)"
              fill={paint('start-header-rose')}
            />
            <circle cx={24} cy={106} r={14} fill={paint('start-header-glow')} />
            <circle cx={24} cy={106} r={5} fill={paint('start-header-pearl')} />
          </svg>
        </svg>
        <div aria-hidden="true" className="docs-grain" />
        <div className="docs-start-hero-text">
          <div aria-hidden="true" className="flex gap-space-200">
            {emblems.map(([shape, turn]) => (
              <svg key={shape} viewBox="-1 -1 2 2" className="size-10 fill-on-primary-container">
                <path d={shapes[shape]} transform={`rotate(${turn})`} />
              </svg>
            ))}
          </div>
          <h1 className="docs-hero-title">{section.title}</h1>
          <p className="docs-start-description">{section.description}</p>
          <nav aria-label="On this page" className="w-full">
            <ul className="docs-start-jumps">
              {parts.map(({ id, title, summary }) => (
                <li key={id} className="contents">
                  <Link href={`#${id}`} className="docs-card">
                    <span className="docs-card-text">
                      <span className="docs-card-title">{title}</span>
                      <span className="docs-card-description">{summary}</span>
                    </span>
                    <Ripple />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <div className="docs-start-slides">
        <div className="min-w-0">
          {parts.map(({ id, title, text, cards }, index) => (
            <Fragment key={id}>
              {index > 0 && (
                <svg aria-hidden="true" viewBox="0 0 164 16" className="docs-start-squiggle">
                  <path
                    d="M2 8Q12-2 22 8T42 8T62 8T82 8T102 8T122 8T142 8T162 8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <section aria-labelledby={id} className="docs-start-part">
                <div className="docs-start-text">
                  <h2 id={id} className="docs-start-heading">
                    {title}
                  </h2>
                  {text}
                </div>
                <ul className="docs-start-cards">
                  {cards.map((card) => (
                    <li key={card.href} className="contents">
                      <StartCard {...card} />
                    </li>
                  ))}
                </ul>
              </section>
            </Fragment>
          ))}
        </div>
        {/* Pictures to look at, not to use: of the page's parts, only the one in view shows. */}
        <div inert className="docs-start-pictures">
          {parts.map(({ id, ground, art, picture }) => (
            <div
              key={id}
              className={
                id === shown ? 'docs-start-picture opacity-100' : 'docs-start-picture opacity-0'
              }
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 128 160"
                preserveAspectRatio="xMidYMid slice"
                className={twMerge('absolute inset-0 size-full', ground)}
              >
                {art}
              </svg>
              <div aria-hidden="true" className="docs-grain" />
              <div className="docs-start-stage">{picture}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
