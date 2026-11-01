import { Button, Icon, twMerge } from '@material-web/react'
import type { ReactNode } from 'react'
import type { Reference } from '../nav'
import { Logo } from './logos'

/**
 * The picture in a page's header: shapes that stand for what the page is about, on a
 * ground, in the theme's colors, which follow its scheme and its contrast.
 */
export type Picture = {
  /** The color under the shapes, a background. */
  ground: string
  /**
   * The shapes, as SVG, in a box 150 wide and 125 tall. A shape that runs to an edge of the
   * picture is drawn far past it: the panel shows what is around the box.
   */
  shapes: ReactNode
}

/**
 * Draws a picture whole in the middle of the panel it is in, as large as fits, over a ground
 * that fills the panel: a page's header, or its card (routes/section.tsx). A device drawn over
 * it covers its middle, so the picture of a page that has one draws its shapes at the sides.
 * A fine grain lies over all of it, under what stands on it.
 */
export function HeroArt({ ground, shapes }: Picture) {
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 150 125"
        className={twMerge('absolute inset-0 size-full', ground)}
      >
        {shapes}
      </svg>
      <div aria-hidden="true" className="docs-grain" />
    </>
  )
}

type HeroProps = {
  title: string
  description: string
  /** What stands over the title: the section a page is in. */
  overline?: ReactNode
  /** The buttons under the description. */
  actions?: ReactNode
  /** The links under the description, before its buttons, to what the page is built on. */
  references?: Reference[]
  /** What the second panel shows, over its picture. */
  children?: ReactNode
  /** The picture of the second panel (art/). */
  art?: Picture
}

/**
 * The top of a page: its title and what it is in one panel, and beside it a second one with a
 * picture, under what a page draws over it.
 */
export function Hero({
  title,
  description,
  overline,
  actions,
  references = [],
  children,
  art,
}: HeroProps) {
  return (
    <header className="docs-hero">
      <div className="docs-hero-text">
        {overline}
        <h1 className="docs-hero-title">{title}</h1>
        <p className="docs-hero-description">{description}</p>
        {(actions || references.length > 0) && (
          <div className="docs-hero-actions">
            {references.map((reference) => (
              <Button
                key={reference.title}
                variant="tonal"
                elementType="a"
                href={reference.href}
                target="_blank"
                rel="noreferrer"
              >
                {'logo' in reference ? (
                  <Logo name={reference.logo} />
                ) : (
                  <Icon name={reference.icon} />
                )}
                {reference.title}
              </Button>
            ))}
            {actions}
          </div>
        )}
      </div>
      <div className="docs-hero-visual">
        {art && <HeroArt {...art} />}
        {children}
      </div>
    </header>
  )
}
