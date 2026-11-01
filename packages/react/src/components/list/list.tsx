import {
  GridList as AriaGridList,
  type GridListProps as AriaGridListProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'

export type { GridListRenderProps as ListRenderProps } from 'react-aria-components'

export type ListVariant = 'standard' | 'segmented'

// The list's fixed classes are in list.css; its style and its dividers are picked here.
const list = tv({
  base: 'list',
  variants: {
    variant: { standard: '', segmented: 'list-segmented' },
    divider: { true: 'list-divided', false: '' },
  },
})

// The props `List` has of its own. Their comments quote the M3 lists pages, which they list
// under @see; they add no wording of our own.
type ListBaseProps = {
  /**
   * Choose between standard and segmented styles
   *
   * The standard and segmented styles are a visual choice, and don’t affect a
   * list’s behavior.
   *
   * An expressive list has a segmented style and round corners
   *
   * Use gaps for contained lists. Gaps leverage expressive shape and
   * containment tactics.
   *
   * Use segmented gaps and filled list items to define a list group
   *
   * @default 'standard'
   * @see https://m3.material.io/components/lists/specs
   * @see https://m3.material.io/components/lists/guidelines
   */
  variant?: ListVariant
  /**
   * Gaps or dividers can separate lists into items and groups
   *
   * Limit dividers to uncontained or complex lists, only when a stronger
   * visual separation is necessary.
   *
   * Limit the use of dividers to uncontained lists
   *
   * @default false
   * @see https://m3.material.io/components/lists/guidelines
   */
  hasDivider?: boolean
}

// The props of React Aria's GridList, which a list is, with the `ref` of the `<div>` it renders
// in the `grid` role, and the M3 style and dividers.
export type ListProps<T extends object = object> = AriaGridListProps<T> &
  RefProps<HTMLDivElement> &
  ListBaseProps

// The list, React Aria's GridList: a column of ListItems, its rows, which it selects and acts on
// by their `id`, named by `aria-label` or `aria-labelledby`.
/**
 * Lists are continuous, vertical indexes of text and images
 *
 * Use lists to help people find a specific item and act on it
 *
 * Order list items in logical ways, like alphabetical or numerical
 *
 * Keep items short and easy to scan
 *
 * Show icons, text, and actions in a consistent format
 *
 * A list can have only one selection mode at a time. For example, a
 * single-action list can change to a multi-select list, but can’t be both at
 * once.
 *
 * Keyboard navigation:
 * - Tab: To move focus to the first list item, last list item, or outside of
 *   the list component
 * - Down and right arrow keys: Moves to the next element in the list; if the
 *   focused element is the last in the list, it wraps back to the top of the
 *   list
 * - Up and left arrow keys: Moves to the previous element in the list; if the
 *   focused element is the first in the list, it wraps back to the bottom of
 *   the list
 * - Space or Enter: To select a list item not yet selected
 *
 * On web, a list container’s accessibility label describes the type of
 * selection that can be made
 *
 * @see https://m3.material.io/components/lists/overview
 * @see https://m3.material.io/components/lists/specs
 * @see https://m3.material.io/components/lists/guidelines
 * @see https://m3.material.io/components/lists/accessibility
 */
export function List<T extends object>({
  variant = 'standard',
  hasDivider = false,
  className,
  ...props
}: ListProps<T>) {
  return (
    <AriaGridList
      {...props}
      className={composeTailwindRenderProps(className, list({ variant, divider: hasDivider }))}
    />
  )
}
