import { useMemo } from 'react'
import {
  composeRenderProps,
  Toolbar,
  type ToolbarProps,
  type ToolbarRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { useMeasuredWidth } from '../../lib/use-measured-width'
import { NavigationRailContext } from './context'

/* The room the rail takes beside the content: 96dp collapsed, as wide as what it holds
 * expanded, none of a rail that hides: on the spring unless a measurement has just landed.
 * What it holds is always laid out as wide as the expanded rail, and cut at the rail's edge. */
const rail = tv({
  base: 'group/md-navigation-rail navigation-rail bg-surface text-on-surface-variant',
  variants: {
    // With no room it is hidden, the rail and all it holds, and out of reach.
    room: { collapsed: 'w-24', expanded: 'navigation-rail-width', none: 'invisible w-0' },
    /* An item is as wide as the rail is at the moment. A rail that hides comes in from the
     * window's edge instead: what it holds stays whole, at the rail's far side. */
    hide: { true: 'justify-end', false: '@container' },
    animate: { true: '', false: '' },
  },
  // A rail that hides is hidden once it has gone, and not before.
  compoundVariants: [
    { animate: true, room: ['collapsed', 'expanded'], class: 'transition-navigation-rail-width' },
    { animate: true, room: 'none', class: 'transition-navigation-rail-hidden' },
  ],
})

// What the rail holds, drawn as it is written: the header, the items and the secondary
// destinations, down from the top or with the items in the rail's middle, carrying how far the
// rail is expanded.
const content = tv({
  base: 'navigation-rail-content',
  variants: {
    arrangement: { top: 'navigation-rail-top-aligned', center: 'navigation-rail-centered' },
    expanded: { true: 'navigation-rail-expanded', false: '' },
  },
})

export type NavigationRailArrangement = 'top' | 'center'

// The props `NavigationRail` adds to React Aria's. The comments on them quote the M3
// navigation rail pages, which each comment lists under @see; they add no wording of our own.
type NavigationRailBaseProps = {
  // Controlled: change it from the menu button's `onPress`.
  /**
   * There are two variants of navigation rails, collapsed and expanded, which can easily
   * transform into each other when the menu button is selected.
   *
   * The collapsed nav rail runs along the leading edge of the window, and should contain
   * 3–7 navigation items. It should not be hidden.
   *
   * When the navigation rail transitions from collapsed to expanded, the contents of the
   * page should automatically adjust to fit.
   *
   * The contents of the navigation rail also expand to fill the space. For example, the
   * FAB should transition into an extended FAB.
   *
   * @default false
   * @see https://m3.material.io/components/navigation-rail/guidelines
   */
  isExpanded?: boolean

  // Collapsed, such a rail takes no room and shows nothing: the menu button that expands
  // it is the page's, outside the rail. It is never drawn as a collapsed rail.
  /**
   * In immersive experiences, the expanded navigation rail can be hidden entirely,
   * appearing only when the menu icon is selected.
   *
   * The collapsed navigation rail should not be hidden.
   *
   * When the navigation rail is hidden, the body content can fill in the remaining space
   * as long as the menu icon is still accessible.
   *
   * @default false
   * @see https://m3.material.io/components/navigation-rail/guidelines
   */
  isHiddenOnCollapse?: boolean

  // Centered, the items are in the middle of the whole rail, as in Compose, not of the
  // room under the header.
  /**
   * Navigation rail items can be aligned as a group to the top or center of a layout. On
   * tablets, use center alignment to make it easier to reach items.
   *
   * The menu icon and FAB should always be top-aligned.
   *
   * @default 'top'
   * @see https://m3.material.io/components/navigation-rail/guidelines
   */
  arrangement?: NavigationRailArrangement
}

// What React Aria's Toolbar reports of the rail, which its class, style and children are given.
export type NavigationRailRenderProps = ToolbarRenderProps

// React Aria's Toolbar's props, which the rail is, always vertical, with the `ref` of its
// `<div>`, and the M3 props. Name it with `aria-label`.
export type NavigationRailProps = Except<ToolbarProps, 'orientation'> &
  RefProps<HTMLDivElement> &
  NavigationRailBaseProps

// Its children are drawn as they are written: a `NavigationRailHeader` first, for what is at its
// top, its `NavigationRailItem`s, then `NavigationRailSection`s for what only shows expanded. It
// is as tall as what holds it stretches it, and at least as its content.
/**
 * Navigation rails let people switch between UI views on mid-sized devices
 *
 * Use navigation rails in medium, expanded, large, or extra-large window sizes
 *
 * Can contain 3-7 destinations plus an optional FAB
 *
 * Always put the rail in the same place, even on different screens of an app
 *
 * The navigation rail should be placed on the leading edge of the window. This is the left
 * side for left-to-right languages, and the right side for right-to-left languages.
 *
 * The container fill can be turned off so the nav rail appears directly on the surface.
 * When doing this, make sure all items have a minimum of 3:1 color contrast.
 *
 * A vertical divider can help separate the rail from app content. The divider should be
 * positioned on the edge of the rail container that’s adjacent to the app’s content area.
 *
 * Initial focus lands directly on the first interactive item, whether it’s the menu, the
 * FAB, or the first navigation item.
 *
 * From the FAB or menu, Tab brings the person to the navigation items. Tab or Arrows then
 * navigate between items.
 *
 * Keyboard navigation:
 * - Tab / Arrows: Navigate between interactive elements
 * - Space / Enter: Selects an interactive element
 *
 * @see https://m3.material.io/components/navigation-rail/overview
 * @see https://m3.material.io/components/navigation-rail/guidelines
 * @see https://m3.material.io/components/navigation-rail/accessibility
 */
export function NavigationRail({
  isExpanded = false,
  isHiddenOnCollapse = false,
  arrangement = 'top',
  className,
  style,
  children,
  ...props
}: NavigationRailProps) {
  const { ref: contentRef, width, animate } = useMeasuredWidth<HTMLDivElement>(children)
  // A rail that hides is never drawn collapsed: it leaves as the expanded rail it was.
  const laidOutExpanded = isExpanded || isHiddenOnCollapse
  const value = useMemo(() => ({ expanded: laidOutExpanded }), [laidOutExpanded])

  return (
    <NavigationRailContext.Provider value={value}>
      <Toolbar
        {...props}
        orientation="vertical"
        data-expanded={isExpanded || undefined}
        className={composeTailwindRenderProps(
          className,
          rail({
            room: isExpanded ? 'expanded' : isHiddenOnCollapse ? 'none' : 'collapsed',
            hide: isHiddenOnCollapse,
            animate,
          }),
        )}
        style={
          width === undefined
            ? style
            : composeRenderProps(style, (style) => ({
                '--navigation-rail-width': `${width}px`,
                ...style,
              }))
        }
      >
        {composeRenderProps(children, (children) => (
          <div ref={contentRef} className={content({ arrangement, expanded: laidOutExpanded })}>
            {children}
          </div>
        ))}
      </Toolbar>
    </NavigationRailContext.Provider>
  )
}
