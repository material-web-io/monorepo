import { Ripple, twMerge } from '@material-web/react'
import { Fragment, type ComponentType } from 'react'
import { Link } from 'react-aria-components'
import { useLocation } from 'react-router'
import { art } from '../art'
import { Hero, HeroArt } from '../components/hero'
import { heading } from '../components/mdx'
import { normalize, partsOf, referencesOf, sectionOf, type Page } from '../nav'

/** The picture of each component on its card, by the page's path (thumbnails/). */
const thumbnails = Object.fromEntries(
  Object.entries(
    import.meta.glob<ComponentType>('../thumbnails/*.tsx', { eager: true, import: 'default' }),
  ).map(([file, thumbnail]) => [`/components/${file.replace(/^.*\/|\.tsx$/g, '')}`, thumbnail]),
)

/**
 * A card for a page: its picture, the component's own where it has one, on its header's
 * ground, else its header's, its name and what it is.
 */
export function PageCard({ page }: { page: Page }) {
  const Thumbnail = thumbnails[page.path]
  const picture = art[page.path]
  return (
    <Link href={page.path} className="docs-card">
      <span className="docs-card-picture">
        {Thumbnail ? (
          // A picture of the component, not one to use: the card is the link.
          <span inert className={twMerge('docs-thumbnail', picture?.ground)}>
            <Thumbnail />
          </span>
        ) : (
          picture && <HeroArt {...picture} />
        )}
      </span>
      <span className="docs-card-text">
        <span className="docs-card-title">{page.title}</span>
        <span className="docs-card-description">{page.description}</span>
      </span>
      <Ripple />
    </Link>
  )
}

// The title of a part of the page, with the button that copies the link to it.
const PartHeading = heading('h2', 'docs-wide-heading')

// The id of a part's title: "Date & time pickers" is `date-time-pickers`.
const idOf = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/**
 * A section's own page: what it is, and a card for each of its pages, under the titles of its
 * parts where it has them.
 */
export default function Section() {
  const section = sectionOf(normalize(useLocation().pathname))
  if (!section) return null
  return (
    <>
      <Hero
        title={section.title}
        description={section.description}
        art={art[section.path]}
        references={referencesOf(section)}
      />
      <div className="docs-wide">
        {partsOf(section).map(({ title, pages }) => (
          <Fragment key={title ?? ''}>
            {title && <PartHeading id={idOf(title)}>{title}</PartHeading>}
            <ul className="docs-cards">
              {pages.map((page) => (
                <li key={page.path} className="contents">
                  <PageCard page={page} />
                </li>
              ))}
            </ul>
          </Fragment>
        ))}
      </div>
    </>
  )
}
