import { useContext } from 'react'
import {
  composeRenderProps,
  TextContext,
  ToggleButton as AriaToggleButton,
  type ToggleButtonProps as AriaToggleButtonProps,
  type ToggleButtonRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Ripple } from '../ripple'
import { NavigationBarContext } from './context'

// The item (navigation-bar.css): an equal share of the bar, or centered, as wide as its content
// asks. Vertical, its content 6dp from the top and bottom; horizontal, the indicator 12dp from them.
const item = tv({
  base: 'group/md-navigation-bar-item navigation-bar-item',
  variants: {
    layout: {
      vertical: 'flex-col py-space-75',
      horizontal: 'items-center justify-center py-space-150',
    },
    arrangement: {
      'equal-weight': 'min-w-0 flex-1 basis-0',
      centered: 'navigation-bar-item-centered',
    },
  },
  defaultVariants: { layout: 'vertical', arrangement: 'equal-weight' },
})

// What the item holds, over the indicator's box: vertical, the box's row and the label's;
// horizontal, the icon and the label side by side, 4dp apart and 16dp from the box's ends, in a
// box at least 40dp tall.
const content = tv({
  base: 'navigation-bar-item-content',
  variants: {
    layout: {
      vertical: 'navigation-bar-item-content-vertical',
      horizontal: 'flex min-h-10 max-w-full min-w-0 items-center gap-space-50 px-space-200',
    },
  },
})

// The indicator's box: vertical, 56 by 32dp in the first row, at its middle; horizontal, the
// whole of what the item holds.
const stateLayerHost = tv({
  base: 'navigation-bar-state-layer-host',
  variants: {
    layout: {
      vertical: 'inset-y-0 left-1/2 row-start-1 row-end-2 w-14 -translate-x-1/2',
      horizontal: 'inset-0',
    },
  },
})

// The label, React Aria's Text in the label slot: vertical, under the indicator; horizontal,
// in it, on one line, cut where the item has no more room.
const label = tv({
  variants: {
    layout: { vertical: 'navigation-bar-label-vertical', horizontal: 'min-w-0 truncate' },
  },
})

// What an item passes its class and its children, given as functions: the state React Aria's
// ToggleButton reports of it.
export type NavigationBarItemRenderProps = ToggleButtonRenderProps

// The props of React Aria's ToggleButton, which the item is, with the `ref` of its `<button>`.
// Its children are drawn as they are given: its label is React Aria's `Text` in the label slot,
// and an `Icon` takes the item's size and colors.
export type NavigationBarItemProps = AriaToggleButtonProps & RefProps<HTMLButtonElement>

// A child of a `NavigationBar`, whose layout and arrangement it takes.
// `isSelected` is the caller's, on the item of the view being shown, and said as `aria-pressed`;
// selecting one item does not deselect the others.
/**
 * Navigation items hold all elements for each destination: the icon, label text, and
 * active indicator. They can be vertical, with the text below the icon and indicator, or
 * horizontal, with the icon and text beside each other inside the indicator.
 *
 * The active indicator shows which page from the nav bar is currently being displayed.
 *
 * The icon becomes filled and the active indicator expands from the center of the icon
 * when switching between destinations.
 *
 * When hovered, the active indicator appears in a reduced state providing a visual cue
 * that the destination is interactive
 *
 * When clicked (in both active and inactive states), a ripple passes through the indicator
 *
 * Initial focus lands directly on the first navigation item, since that is the first
 * interactive element of the component.
 *
 * The accessibility label for a navigation item is typically the same as the destination
 * name.
 *
 * @see https://m3.material.io/components/navigation-bar/guidelines
 * @see https://m3.material.io/components/navigation-bar/accessibility
 */
export function NavigationBarItem({ className, children, ...props }: NavigationBarItemProps) {
  const variants = useContext(NavigationBarContext)
  return (
    <AriaToggleButton {...props} className={composeTailwindRenderProps(className, item(variants))}>
      {composeRenderProps(children, (children, { isHovered, isFocusVisible, isDisabled }) => (
        <span className={content(variants)}>
          {/* The box takes no pointer, so the item's states reach its layer as props. */}
          <span className={stateLayerHost(variants)}>
            <span aria-hidden className="navigation-bar-active-indicator" />
            <Ripple isHovered={isHovered} isFocusVisible={isFocusVisible} isDisabled={isDisabled} />
          </span>
          <TextContext.Provider value={{ slots: { label: { className: label(variants) } } }}>
            {children}
          </TextContext.Provider>
        </span>
      ))}
    </AriaToggleButton>
  )
}
