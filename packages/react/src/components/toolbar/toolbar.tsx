import {
  Toolbar as AriaToolbar,
  type ToolbarProps as AriaToolbarProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv, type VariantProps } from '../../lib/tv'

export type { ToolbarRenderProps } from 'react-aria-components'

/* React Aria's Toolbar, a <div> of its elements, each in a cell of a 48dp target (toolbar.css), in
 * a row or a column by its orientation. Docked spans its container; floating is a pill around them.
 * The color is the fill and the icons', and the container of a selected toggle in it (toolbar.css). */
const toolbarStyles = tv({
  base: 'toolbar-container',
  variants: {
    variant: {
      // At least 64dp tall, square and flat, the first and last element 16dp from its ends and
      // the rest evenly spaced, never less than 4dp apart.
      docked: 'grid min-h-16 w-full justify-between gap-x-space-50 px-space-200',
      // As big as its elements, 8dp from their targets and 4dp between them, on elevation level 2.
      // Forced colors, which drop the fill and the shadow, outline it.
      floating:
        'inline-grid gap-space-50 rounded-shape-full p-space-100 shadow-elevation-2 forced-colors:container-border',
    },
    color: {
      standard: 'bg-surface-container text-on-surface-variant toolbar-standard',
      vibrant: 'bg-primary-container text-on-primary-container toolbar-vibrant',
    },
    orientation: { horizontal: 'grid-flow-col', vertical: 'grid-flow-row' },
  },
  defaultVariants: { variant: 'docked', color: 'standard', orientation: 'horizontal' },
})

type Variant = NonNullable<VariantProps<typeof toolbarStyles>['variant']>
type Color = NonNullable<VariantProps<typeof toolbarStyles>['color']>

// The props `Toolbar` adds to those of React Aria's Toolbar. Their comments quote the M3 toolbar
// pages, which each lists under @see; they add no wording of our own.
type ToolbarBaseProps = {
  // Docked is in the flow, as wide as what holds it; floating is in the flow too, as big as what
  // it holds: place either yourself. A FAB goes beside a floating one, 8dp away, not in it.
  /**
   * There are two variants of toolbars:
   *
   * - `docked`: Spans the full width of the window. It’s best used for global actions that
   *   remain the same across multiple pages.
   * - `floating`: Floats above the body content. It’s best used for contextual actions
   *   relevant to the body content or the specific page.
   *
   * The docked toolbar’s container spans the full width of the window.
   *
   * Avoid applying rounded corners to the container. This can imply the container expands or
   * changes upon interaction.
   *
   * As long as there's a minimum of 16dp padding on the leading and trailing edge, arrange
   * controls inside however you see fit. The 32dp padding between items is just the default.
   *
   * Only place docked toolbars at the bottom of the window.
   *
   * If using other bottom-aligned elements, such as a navigation bar, don't use a docked
   * toolbar.
   *
   * In compact breakpoints, elements in the toolbar should be evenly spaced.
   *
   * In medium breakpoints and larger, adjust the padding between controls to create a
   * comfortable layout.
   *
   * The floating toolbar’s container should be fully visible on screen. If more actions are
   * needed, use an overflow menu.
   *
   * The container should only be as big as needed to hold the items inside before reaching the
   * 16dp margin.
   *
   * Floating toolbars have elevation by default.
   *
   * If the content beneath the toolbar is visually distinct, elevation can be removed.
   *
   * Floating toolbars can be horizontal or vertical.
   *
   * Horizontal toolbars should have a minimum 16dp margin from the edge of the window.
   *
   * Vertical toolbars should have a minimum 24dp margin.
   *
   * To keep vertical toolbars compact, don’t use wide icon buttons.
   *
   * Vertical toolbars aren’t recommended for compact windows.
   *
   * Avoid using square icon buttons in floating toolbars. Their square shape conflicts with the
   * fully-rounded shape of the floating toolbar container.
   *
   * A FAB can be placed next to a floating toolbar to present one high-priority action
   * alongside a unified set of toolbar actions.
   *
   * @default 'docked'
   * @see https://m3.material.io/components/toolbars/overview
   * @see https://m3.material.io/components/toolbars/guidelines
   */
  variant?: Variant

  // Every React Aria toggle in it takes the scheme's colors, at any depth: flat in its icon
  // color, and selected in a container of its own. Other buttons keep their own colors.
  /**
   * There are two color configurations:
   *
   * - `standard`: A low-emphasis color scheme best used for focusing attention on the body
   *   content.
   * - `vibrant`: A high-emphasis color scheme that draws attention to the controls. It can
   *   also indicate a temporary change in the page behavior, such as entering edit mode.
   *
   * @default 'standard'
   * @see https://m3.material.io/components/toolbars/guidelines
   * @see https://m3.material.io/components/toolbars/specs
   */
  color?: Color
}

// The props of React Aria's Toolbar, which `Toolbar` is, with the `ref` of its <div>, and the M3
// props. Its `orientation` lays it out too: vertical, it is a column, as a floating toolbar can be.
export type ToolbarProps = AriaToolbarProps & RefProps<HTMLDivElement> & ToolbarBaseProps

// React Aria's keyboard: the arrow keys move between its elements, a text field's included, and Tab
// leaves the toolbar, where M3 has Tab move to the next element; back in, the focus returns to the
// element it left. A ButtonGroup in it is a group of its elements, which the same arrow keys reach.
/**
 * Toolbars display frequently used actions relevant to the current page
 *
 * All elements need a minimum 48x48dp target area to be accessible.
 *
 * The toolbar has no interactions by default. All interactions are with the elements placed
 * inside.
 *
 * On web, the toolbar container should have the toolbar role.
 *
 * Keyboard navigation:
 * - Tab or Arrows: Navigate between interactive elements
 * - Space or Enter: Activate the focused element
 *
 * @see https://m3.material.io/components/toolbars/overview
 * @see https://m3.material.io/components/toolbars/guidelines
 * @see https://m3.material.io/components/toolbars/accessibility
 */
export function Toolbar({ variant, color, orientation, className, ...props }: ToolbarProps) {
  return (
    <AriaToolbar
      {...props}
      orientation={orientation}
      className={composeTailwindRenderProps(
        className,
        toolbarStyles({ variant, color, orientation }),
      )}
    />
  )
}
