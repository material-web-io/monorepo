import {
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
  type TagGroupProps as AriaTagGroupProps,
  type TagListProps as AriaTagListProps,
} from 'react-aria-components'
import type { Except, RefProps } from '../../lib/aria'

// The props of React Aria's TagGroup, which `ChipGroup` is, with the `ref` of its `<div>`, and
// those of the TagList inside it, which holds its chips: its `children`, or a function of each
// of its `items`, with their `dependencies`, and what it shows when empty.
export type ChipGroupProps<T extends object> = Except<AriaTagGroupProps, 'children'> &
  Pick<AriaTagListProps<T>, 'children' | 'items' | 'dependencies' | 'renderEmptyState'> &
  RefProps<HTMLDivElement>

/**
 * Chips appear as a group of interactive elements
 *
 * When displaying multiple chips together, place them inline as a row of
 * options, not listed vertically. Overflowing chips should break to the next
 * line.
 *
 * Keep an 8dp minimum space between chips. Chips must also have a minimum 48dp
 * target size, regardless of placement or density. If required, the target can
 * extend beyond the visible container of the chip.
 *
 * For multi-select chip sets, Space or Enter will select the focused chip and
 * allow you to select all of the chips. Space or Enter will also deselect a
 * focused selected chip.
 *
 * @see https://m3.material.io/components/chips/guidelines
 * @see https://m3.material.io/components/chips/accessibility
 */
export function ChipGroup<T extends object>({
  children,
  items,
  dependencies,
  renderEmptyState,
  ...props
}: ChipGroupProps<T>) {
  return (
    <AriaTagGroup {...props}>
      <AriaTagList
        items={items}
        dependencies={dependencies}
        renderEmptyState={renderEmptyState}
        className="chip-group-list"
      >
        {children}
      </AriaTagList>
    </AriaTagGroup>
  )
}
