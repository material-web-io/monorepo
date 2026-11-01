import { useLayoutEffect, useMemo, useRef } from 'react'
import { mergeRefs } from 'react-aria'
import {
  composeRenderProps,
  Menu as AriaMenu,
  type MenuProps as AriaMenuProps,
} from 'react-aria-components'
import type { RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { FabMenuContext, type FabMenuColor } from './context'

/* What opens a FAB menu is React Aria's own MenuTrigger, which the menu exports, around the
 * FabMenuButton and the FabMenuPopover, as React Aria composes any menu. */

// The list in the stack, React Aria's Menu, hung from the stack's end by its own, 6dp across for
// the items' focus rings, so its items end where the FAB does, and padded below for the close
// button they scroll behind (fab-menu-list, see fab-menu-popover.tsx). It holds the keyboard focus
// while open and scrolls when capped at the room above, the stack's inherited max-height, starting
// at the end nearest the FAB. A `<div>`, so its padding is in that height only with box-border.
const list = tv({
  base: 'absolute -end-space-75 bottom-0 box-border scrollbar-hidden flex max-h-[inherit] w-max flex-col items-end gap-space-50 overflow-y-auto px-space-75 fab-menu-list pt-space-75 outline-none',
})

type FabMenuBaseProps = {
  /**
   * Available in primary, secondary, and tertiary color sets.
   *
   * Use the primary FAB menu color set with the primary or primary container
   * FAB color styles.
   *
   * Use the secondary FAB menu color set with the secondary or secondary
   * container FAB color styles.
   *
   * Use the tertiary FAB menu color set with the tertiary or tertiary
   * container FAB color styles.
   *
   * @default 'primary'
   * @see https://m3.material.io/components/fab-menu/overview
   * @see https://m3.material.io/components/fab-menu/guidelines
   */
  color?: FabMenuColor
}

// The props of React Aria's Menu, the list of items in the stack, with the `ref` of the `<div>`
// it renders, and the M3 color set, which its items take. Its children are its FabMenuItems, or a
// function that draws one for each of its `items`, and `onAction` hears each item, by its `id`.
export type FabMenuProps<T extends object = object> = AriaMenuProps<T> &
  RefProps<HTMLDivElement> &
  FabMenuBaseProps

// The list in a FabMenuPopover, React Aria's Menu: each item a FabMenuItem. Scrolled to the end
// nearest the FAB rather than the browser's default top once React Aria has drawn its items, a
// render after the list - unless the keyboard opened it, when React Aria keeps its item in view.
/**
 * A FAB menu opens from a FAB to show multiple related actions. It should
 * always appear in the same place as the FAB that opened it.
 *
 * On web, a FAB menu is a combination of a FAB and a menu component. The FAB
 * opens the menu. Follow the accessibility guidelines for FABs and menus.
 *
 * Keyboard navigation:
 * - Space or Enter: For closed menus: Opens menu or submenu. For open menus:
 *   Selects a menu item
 * - Up and Down arrows: For closed menus: Opens menu. For open menus: Moves
 *   focus to the next item
 * - Letters: Focus moves to the next menu item starting with letter
 * - Escape: Closes menu
 *
 * People expect to exit a menu by:
 * - Selecting an option
 * - Tapping Escape or outside of the menu
 *
 * FAB menus can contain 2–6 items. These should be closely related under a
 * single action, like Share.
 *
 * @see https://m3.material.io/components/fab-menu/overview
 * @see https://m3.material.io/components/fab-menu/guidelines
 * @see https://m3.material.io/components/fab-menu/accessibility
 * @see https://m3.material.io/components/menus/accessibility
 * @see https://m3.material.io/components/fab-menu/specs
 */
export function FabMenu<T extends object>({
  color = 'primary',
  className,
  ref,
  ...props
}: FabMenuProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const mergedRef = useMemo(() => mergeRefs(listRef, ref ?? null), [ref])
  useLayoutEffect(() => {
    const element = listRef.current
    if (!element) return
    const toEnd = () => {
      const focused = document.activeElement
      if (focused === element || !element.contains(focused)) {
        element.scrollTop = element.scrollHeight
      }
    }
    const drawn = new MutationObserver(() => {
      drawn.disconnect()
      toEnd()
    })
    drawn.observe(element, { childList: true })
    toEnd()
    return () => drawn.disconnect()
  }, [])
  const context = useMemo(() => ({ color }), [color])
  return (
    <FabMenuContext.Provider value={context}>
      <AriaMenu
        {...props}
        ref={mergedRef}
        className={composeRenderProps(className, (className) => list({ className }))}
      />
    </FabMenuContext.Provider>
  )
}
