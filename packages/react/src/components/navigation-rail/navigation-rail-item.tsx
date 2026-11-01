import type { ReactNode } from 'react'
import {
  composeRenderProps,
  TextContext,
  ToggleButton,
  type ToggleButtonProps,
  type ToggleButtonRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Ripple } from '../ripple'
import { useNavigationRail } from './context'

type Layout = 'collapsed' | 'expanded'

/* The item (navigation-rail.css): collapsed, 64dp and 4dp from the next; expanded, 56dp with
 * nothing between; on the way, what the rail's progress makes of it. A secondary destination is
 * only seen in an expanded rail, and is as one's all along. */
const item = tv({
  base: 'group/md-navigation-rail-item navigation-rail-item',
  variants: { secondary: { true: 'min-h-14', false: 'navigation-rail-item-primary' } },
})

// What the indicator of an expanded rail hugs, its children drawn in it as they are given.
const content = tv({
  base: 'navigation-rail-item-content',
  variants: { secondary: { true: 'h-14', false: 'navigation-rail-item-content-primary' } },
})

// The indicator's box: 56 by 32dp around the icon collapsed, all of the content expanded.
const box = tv({
  base: 'navigation-rail-item-box',
  variants: { secondary: { true: 'w-full', false: 'navigation-rail-item-box-primary' } },
})

/* A selected item's label is secondary under the icon and on-secondary-container beside it, in
 * the indicator: one color for both of its labels, which the rail's layout picks and which
 * fades from the other, as that of the one label Compose draws does. */
const selectedLabel = {
  collapsed: 'group-selected/md-navigation-rail-item:text-secondary',
  expanded: 'group-selected/md-navigation-rail-item:text-on-secondary-container',
} as const

// The label beside the icon, an expanded rail's: clear in a collapsed rail, at the item's edge.
const labelBeside = tv({
  base: 'navigation-rail-label-beside navigation-rail-label',
  variants: {
    layout: {
      collapsed: `navigation-rail-label-beside-out ${selectedLabel.collapsed}`,
      expanded: `navigation-rail-label-beside-in ${selectedLabel.expanded}`,
    },
    // A secondary destination's indicator is as tall as its item all along.
    secondary: { true: '', false: 'navigation-rail-label-beside-level' },
  },
})

// The label under the icon, a collapsed rail's: clear in an expanded rail, where it takes no room.
const labelBelow = tv({
  base: 'navigation-rail-label-below navigation-rail-label',
  variants: {
    layout: {
      collapsed: selectedLabel.collapsed,
      expanded: `whitespace-nowrap ${selectedLabel.expanded}`,
    },
  },
})

/* What an item draws: the indicator, and the state layer and ripple, in the indicator's box,
 * which takes no pointer and so is given the item's states, then its children. The label slot,
 * React Aria's Text, is drawn beside the icon and under it, the one its rail doesn't show hidden. */
function NavigationRailItemContent({
  isHovered,
  isFocusVisible,
  isDisabled,
  layout,
  secondary,
  children,
}: Pick<ToggleButtonRenderProps, 'isHovered' | 'isFocusVisible' | 'isDisabled'> & {
  layout: Layout
  secondary: boolean
  children: ReactNode
}) {
  return (
    <TextContext.Provider
      value={{
        slots: {
          label: {
            // A secondary destination is never seen in a collapsed rail: no label under its icon.
            'aria-hidden': (!secondary && layout === 'collapsed') || undefined,
            className: labelBeside({ layout, secondary }),
            render: (props) => (
              <>
                <span {...props} />
                {!secondary && (
                  <span
                    aria-hidden={layout === 'expanded' || undefined}
                    className={labelBelow({ layout })}
                  >
                    {props.children}
                  </span>
                )}
              </>
            ),
          },
        },
      }}
    >
      <span className={content({ secondary })}>
        <span className={box({ secondary })}>
          <span aria-hidden className="navigation-rail-item-indicator" />
          <Ripple isHovered={isHovered} isFocusVisible={isFocusVisible} isDisabled={isDisabled} />
        </span>
        {children}
      </span>
    </TextContext.Provider>
  )
}

// The state React Aria's ToggleButton reports of an item, which its class and children are given.
export type NavigationRailItemRenderProps = ToggleButtonRenderProps

// React Aria's ToggleButton's props, which the item is, with the `ref` of its `<button>`. Its
// children are drawn as they are given, as a FAB's are: its label is React Aria's `Text` given
// `slot="label"`, which names it, and an `Icon` takes the item's size and colors.
export type NavigationRailItemProps = ToggleButtonProps & RefProps<HTMLButtonElement>

// A child of a `NavigationRail`, laid out as the rail is, and collapsed outside one. Selected,
// it is the page being shown: `isSelected` is yours to set, and `onChange` or `onPress` to hear.
/**
 * When a navigation item is tapped, the active indicator appears, providing the following
 * feedback to the user that it is selected:
 * - A ripple passes through the indicator
 * - The icon switches from outlined to filled
 * - The icon and text change color
 *
 * The active indicator shows which page is being displayed.
 *
 * Use the active indicator only for the current open page
 *
 * When a destination is selected, the icon fills and changes color. An active indicator
 * appears behind the icon.
 *
 * When hovered, the hover state appears, providing a visual cue that the destination is
 * interactive.
 *
 * The navigation item’s target area always spans the full width of the nav rail, even if
 * the item container hugs its contents.
 *
 * The active indicator hugs the label text in the expanded nav rail.
 *
 * The accessibility label for a navigation item is typically the same as the adjacent text
 * label.
 *
 * @see https://m3.material.io/components/navigation-rail/specs
 * @see https://m3.material.io/components/navigation-rail/guidelines
 * @see https://m3.material.io/components/navigation-rail/accessibility
 */
export function NavigationRailItem({ className, children, ...props }: NavigationRailItemProps) {
  const rail = useNavigationRail()
  const layout: Layout = rail?.expanded ? 'expanded' : 'collapsed'
  const secondary = rail?.secondary ?? false
  return (
    <ToggleButton {...props} className={composeTailwindRenderProps(className, item({ secondary }))}>
      {composeRenderProps(children, (children, { isHovered, isFocusVisible, isDisabled }) => (
        <NavigationRailItemContent
          isHovered={isHovered}
          isFocusVisible={isFocusVisible}
          isDisabled={isDisabled}
          layout={layout}
          secondary={secondary}
        >
          {children}
        </NavigationRailItemContent>
      ))}
    </ToggleButton>
  )
}
