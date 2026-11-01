import { Icon } from '@material-web/react'
import { Hero } from '../components/hero'
import { ButtonLink } from '../components/link'
import { react, tailwind } from '../components/names'
import { Version } from '../components/release'
import { sections, site } from '../nav'
import { Wall } from '../wall/wall'
import { PageCard } from './section'

const features = [
  {
    icon: 'widgets',
    title: 'React components',
    text: (
      <>
        {react} is a library of Material 3 components for React, from buttons and text fields to
        navigation, dialogs and date pickers.
      </>
    ),
  },
  {
    icon: 'palette',
    title: 'Tailwind theme',
    text: (
      <>
        {tailwind} is a theme that provides the Material 3 design tokens for Tailwind CSS v4, for
        use with the components or on its own.
      </>
    ),
  },
  {
    icon: 'accessibility_new',
    title: 'Accessibility',
    text: 'Every component is accessible, with keyboard navigation and focus management, and accepts React Aria props.',
  },
  {
    icon: 'straighten',
    title: 'Material 3 Expressive',
    text: 'Both libraries follow the Material 3 Expressive specification, and support light and dark color schemes, contrast levels and reduced motion.',
  },
]

/** The home page: what the project is, where to start and what is in it. */
export default function Home() {
  return (
    <>
      <Hero
        title={site.title}
        description={site.description}
        overline={<Version className="text-title-md text-on-surface-variant" />}
        actions={
          <ButtonLink href="/get-started" size="l">
            Get started
          </ButtonLink>
        }
      >
        <Wall />
      </Hero>
      <div className="docs-wide">
        <h2 className="docs-wide-heading">Overview</h2>
        <ul className="docs-cards medium-screen:grid-cols-2 large-screen:grid-cols-2">
          {features.map(({ icon, title, text }) => (
            <li key={title} className="docs-feature">
              <Icon name={icon} className="text-primary icon-40" />
              <span className="docs-card-title">{title}</span>
              <span className="docs-card-description">{text}</span>
            </li>
          ))}
        </ul>
        <h2 className="docs-wide-heading">Explore the documentation</h2>
        <ul className="docs-cards">
          {sections.map((section) => (
            <li key={section.path} className="contents">
              <PageCard page={section} />
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
