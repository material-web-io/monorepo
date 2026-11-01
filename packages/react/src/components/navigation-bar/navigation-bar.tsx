import { useMemo } from 'react'
import {
  Toolbar as AriaToolbar,
  type ToolbarProps as AriaToolbarProps,
  type ToolbarRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import {
  NavigationBarContext,
  type NavigationBarArrangement,
  type NavigationBarLayout,
} from './context'

// The container (navigation-bar.css). Equal weight, its items divide it equally; centered, they
// sit together in its middle, the space left over at its two ends.
const bar = tv({
  base: 'navigation-bar',
  variants: {
    arrangement: { 'equal-weight': '', centered: 'navigation-bar-centered' },
  },
  defaultVariants: { arrangement: 'equal-weight' },
})

// What the bar passes its class and its children, given as functions: the state React Aria's
// Toolbar reports of it.
export type NavigationBarRenderProps = ToolbarRenderProps

// The props `NavigationBar` adds to those of React Aria's Toolbar. The comments on them quote
// the M3 navigation bar pages, which each comment lists under @see; they add no wording of our
// own.
type NavigationBarBaseProps = {
  // Its items', but for one given a `layout` of its own.
  /**
   * The navigation items can be vertical or horizontal.
   *
   * They can be vertical, with the text below the icon and indicator, or horizontal, with
   * the icon and text beside each other inside the indicator.
   *
   * - `vertical`: Use vertical items in compact windows, like mobile
   * - `horizontal`: Use horizontal items in medium windows, like tablets
   *
   * @default 'vertical'
   * @see https://m3.material.io/components/navigation-bar/guidelines
   * @see https://m3.material.io/components/navigation-bar/specs
   */
  layout?: NavigationBarLayout

  // Compose's two, by its names, and apart from `layout` as there: horizontal items in a
  // medium window take `centered` as well.
  /**
   * Vertical navigation items dynamically change width to equally fit the container.
   *
   * Horizontal items are centered in the nav bar with outer margins.
   *
   * - `equal-weight`: The items are equally distributed on the Short Navigation Bar.
   *   This configuration is recommended for small width screens.
   * - `centered`: The items are centered on the Short Navigation Bar.
   *   This configuration is recommended for medium width screens.
   *
   * @default 'equal-weight'
   * @see https://m3.material.io/components/navigation-bar/specs
   * @see https://m3.material.io/components/navigation-bar/guidelines
   * @see https://developer.android.com/reference/kotlin/androidx/compose/material3/ShortNavigationBarArrangement
   */
  arrangement?: NavigationBarArrangement
}

// The props of React Aria's Toolbar, which the bar is, always horizontal, with the `ref` of its
// `<div>`, and the M3 props.
export type NavigationBarProps = Except<AriaToolbarProps, 'orientation'> &
  RefProps<HTMLDivElement> &
  NavigationBarBaseProps

// Its children are its `NavigationBarItem`s, or components that draw them, each a child of the
// toolbar in the page. It is no landmark: put it in a `<nav>`. It is in the flow, as wide as what
// holds it. Its keys are React Aria's toolbar's: Tab reaches it once, the arrow keys move on.
/**
 * Navigation bars let people switch between UI views on smaller devices
 *
 * Navigation bars provide access to three to five destinations. The nav bar is
 * positioned at the bottom of windows for convenient access.
 *
 * Each destination is represented by an icon and label text. One navigation destination
 * is always active.
 *
 * Navigation bars should be used for:
 * - Three to five main pages in the product
 * - Mobile or tablet only
 *
 * The container should always be placed at the bottom of the product and span the full
 * length of the window. Navigation items are centered within the container.
 *
 * The container has a color fill to provide separation from other content.
 *
 * Navigation bar destinations have fixed positions. Don’t scroll them or modify their
 * positions.
 *
 * Keyboard navigation:
 * - Space / Enter: Selects the focused navigation item
 *
 * @see https://m3.material.io/components/navigation-bar/overview
 * @see https://m3.material.io/components/navigation-bar/guidelines
 * @see https://m3.material.io/components/navigation-bar/accessibility
 */
export function NavigationBar({
  layout = 'vertical',
  arrangement = 'equal-weight',
  className,
  ...props
}: NavigationBarProps) {
  const value = useMemo(() => ({ layout, arrangement }), [layout, arrangement])
  return (
    <NavigationBarContext.Provider value={value}>
      <AriaToolbar
        {...props}
        className={composeTailwindRenderProps(className, bar({ arrangement }))}
      />
    </NavigationBarContext.Provider>
  )
}
