import type { ComponentProps } from 'react'
import { twMerge } from '../../lib/tv'

// Every prop of a `<div>`, `className` and the ref included, is the header's own.
export type NavigationRailHeaderProps = ComponentProps<'div'>

// The first child of a `NavigationRail`, for what is at its top. Its children are drawn as
// written, in a column from its start edge, each centered in a row at least 56dp tall.
/**
 * The navigation rail can display navigation items, a menu, and a floating action button
 * (FAB) in a vertical orientation.
 *
 * The menu icon and FAB should always be top-aligned.
 *
 * The menu button can transition between the collapsed and expanded navigation rails.
 *
 * When the navigation rail is expanded, the menu icon should change to represent that it
 * can be collapsed.
 *
 * The container of the navigation rail is ideal for anchoring the FAB to the top of a
 * screen, placing the app’s key action above navigation destinations.
 *
 * When nested within another component, such as the navigation rail, the FAB's resting
 * elevation should be level 0.
 *
 * The top of the rail can also be used for a logo, however avoid using logos that could be
 * mistaken as buttons.
 *
 * Don’t use a logo as a menu button to expand the navigation rail.
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 */
export function NavigationRailHeader({ className, children, ...props }: NavigationRailHeaderProps) {
  return (
    <div
      {...props}
      data-navigation-rail-header=""
      className={twMerge('group/md-navigation-rail-header navigation-rail-header', className)}
    >
      {children}
    </div>
  )
}
