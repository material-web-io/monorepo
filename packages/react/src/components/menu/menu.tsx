import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { mergeRefs } from 'react-aria'
import {
  composeRenderProps,
  DEFAULT_SLOT,
  KeyboardContext,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  Popover as AriaPopover,
  Provider,
  TextContext,
  useSlottedContext,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Icon, IconContext } from '../icon'
import { Ripple } from '../ripple'

export type { MenuItemRenderProps } from 'react-aria-components'

export type MenuColor = 'standard' | 'vibrant'

// The color a Menu was given, or took from the Menu it is a submenu of, for its items.
const MenuColorContext = createContext<MenuColor>('standard')

// The list and its items take the colors of the menu's `color` (menu.css).
const list = tv({
  base: 'menu-list',
  variants: { color: { standard: 'menu-list-standard', vibrant: 'menu-list-vibrant' } },
})

const item = tv({
  base: 'group/md-menu-item menu-item',
  variants: { color: { standard: 'menu-item-standard', vibrant: 'menu-item-vibrant' } },
})

/* The root's panel grows on a spring, past its size before it settles there: past the window's
 * edge, should its padding leave it no margin, that would scroll the page for a moment.
 * As it starts to grow it is told how far it can, as a scale of its size (`--menu-open-max`). */
function limitGrowth(event: TransitionEvent) {
  const panel = event.currentTarget as HTMLElement
  if (event.target !== panel || event.propertyName !== '--menu-open') return
  const { clientWidth, clientHeight } = document.documentElement
  const box = panel.getBoundingClientRect()
  const style = getComputedStyle(panel)
  const [originX = 0, originY = 0] = style.transformOrigin.split(' ').map(parseFloat)
  // Along the way menu-panel has it grow: its size, how far along that it grows from, and
  // where it starts, how long it is as yet and where the window ends.
  const [size, origin, start, length, end] = /^(left|right)/.test(panel.dataset.placement ?? '')
    ? [parseFloat(style.width), originX, box.left, box.width, clientWidth]
    : [parseFloat(style.height), originY, box.top, box.height, clientHeight]
  // What it grows from stays where it is in the window, with room before it and after it.
  const at = start + (length / size) * origin
  const before = origin > 0 ? at / origin : Infinity
  const after = origin < size ? (end - at) / (size - origin) : Infinity
  panel.style.setProperty('--menu-open-max', `${Math.max(Math.min(before, after), 1)}`)
}

/* React Aria scrolls the item it focuses as the menu opens into view a frame on, measuring the
 * panel squeezed as it starts to grow. A frame on as well, after it, the list is scrolled from its
 * top as React Aria would scroll it with the panel at its full size. */
function revealFocused(panel: HTMLElement, list: HTMLElement) {
  requestAnimationFrame(() => {
    const item = document.activeElement
    if (!(item instanceof HTMLElement) || item === list || !list.contains(item)) return
    panel.style.setProperty('--menu-scale', '1')
    list.scrollTop = 0
    const [box, row] = [list.getBoundingClientRect(), item.getBoundingClientRect()]
    if (row.bottom > box.bottom) list.scrollTop = row.bottom - box.bottom
    panel.style.removeProperty('--menu-scale')
  })
}

/* Which way the list's rows do not fit it, as an `overflow`, read at the panel's full size as it
 * starts to grow, since they are stretched back past its end while it grows: until it has
 * opened, that is the only way the list scrolls (`--menu-overflow`, menu.css). */
function fitOverflow(event: TransitionEvent) {
  const panel = event.currentTarget as HTMLElement
  if (event.target !== panel || event.propertyName !== '--menu-open') return
  const list = panel.querySelector<HTMLElement>(':scope > [role="menu"]')
  if (!list) return
  panel.style.setProperty('--menu-scale', '1')
  panel.style.setProperty('--menu-overflow', 'auto')
  const { scrollWidth, clientWidth, scrollHeight, clientHeight } = list
  panel.style.removeProperty('--menu-scale')
  revealFocused(panel, list)
  const [x, y] = [scrollWidth > clientWidth, scrollHeight > clientHeight]
  panel.style.setProperty('--menu-overflow', `${x ? 'auto' : 'hidden'} ${y ? 'auto' : 'hidden'}`)
}

/* While the root's panel grows, or shrinks back, it says so (`data-growing`, menu.css): React
 * Aria's data-entering is gone the frame after the panel is placed, before it has grown at all,
 * and its rows are stretched past its end the whole way. */
function markGrowth(event: TransitionEvent) {
  const panel = event.currentTarget as HTMLElement
  if (event.target !== panel || event.propertyName !== '--menu-open') return
  const growing = panel
    .getAnimations()
    .some((it) => it instanceof CSSTransition && it.transitionProperty === '--menu-open')
  panel.toggleAttribute('data-growing', growing)
}

// Heard on the panel itself, as it is given its ref.
function watchGrowth(panel: HTMLElement | null) {
  panel?.addEventListener('transitionrun', limitGrowth)
  panel?.addEventListener('transitionrun', fitOverflow)
  for (const type of ['transitionrun', 'transitionend', 'transitioncancel'] as const)
    panel?.addEventListener(type, markGrowth)
}

// The props of React Aria's Popover, which the panel is, with the `ref` of the `<div>` it renders.
// In a MenuTrigger it is placed `'bottom start'` of the trigger unless given, and in a
// SubmenuTrigger `'end top'` of its item, as React Aria places them.
export type MenuPopoverProps = AriaPopoverProps & RefProps<HTMLElement>

// The panel, portaled and placed by React Aria: turned to the side with room, inside the window's
// padding, where the Menu in it scrolls. `--trigger-width` is the trigger's width
// (`className="w-(--trigger-width)"`). Modal, as React Aria's popovers are.
/**
 * A menu is positioned relative to the window edge. It typically appears
 * below, next to, or in front of the element that generates it.
 *
 * If a menu is in a position to be cut off, it should automatically
 * reposition to appear to the left, right, or above the element that
 * generates it.
 *
 * Menus can appear around or in front of the element that opened them
 *
 * Submenus should open next to the parent menu item without overlapping it.
 *
 * Submenus are best used on large screens where there's space.
 *
 * When a menu has multiple submenus, focus follows the current hovered or
 * focused submenu.
 *
 * As a person moves from one submenu to the next, the corners of the focused
 * submenu become more rounded, while the unfocused submenu becomes less
 * rounded.
 *
 * Menus can scroll when all menu items can’t display at once. In this
 * state, menus show a persistent scrollbar.
 *
 * Menus use an enter and exit transition. This animation creates a
 * relationship between the menu and the element that generates it.
 *
 * In dense products, such as on desktop, menus can open instantly to reduce
 * motion.
 *
 * @see https://m3.material.io/components/menus/guidelines
 */
export function MenuPopover({ className, ref, ...props }: MenuPopoverProps) {
  const panelRef = useMemo(() => mergeRefs(watchGrowth, ref ?? null), [ref])
  return (
    <AriaPopover
      // Flush to what opens it, a submenu's to its item's end edge over the menu's 4dp padding,
      // as the guidelines draw it, and 8dp from the window's sides, Compose's margins.
      offset={0}
      containerPadding={8}
      {...props}
      ref={panelRef}
      className={composeTailwindRenderProps(className, 'menu-panel')}
    />
  )
}

type MenuBaseProps = {
  /**
   * Menus have two color mappings:
   *
   * Standard: Surface-based, lower visual emphasis
   *
   * Vibrant: Tertiary-based, higher visual emphasis
   *
   * Vibrant menus are more prominent, and should be used sparingly.
   *
   * @default 'standard'
   * @see https://m3.material.io/components/menus/guidelines
   * @see https://m3.material.io/components/menus/specs
   */
  color?: MenuColor
}

// The props of React Aria's Menu, the list of items in the panel, with the `ref` of the `<div>`
// it renders, and the M3 color, which a submenu's Menu takes from its own unless given.
export type MenuProps<T extends object = object> = AriaMenuProps<T> &
  RefProps<HTMLDivElement> &
  MenuBaseProps

// The vertical menu, React Aria's Menu: in a MenuPopover, each row a MenuItem, grouped by React
// Aria's MenuSection with its Header, or parted by its Separator, which the list draws.
/**
 * Menus display a list of choices on a temporary surface
 *
 * Use a menu to show a temporary set of actions. To show actions on screen
 * at all times, use a toolbar instead.
 *
 * Menus temporarily appear in front of all other permanent UI elements.
 *
 * Vertical menu items can be grouped by adding a divider or small gap. Use
 * groups to bundle similar actions together.
 *
 * Dividers create a more subtle separation between items. Use a divider for:
 *
 * - Scrollable menus
 * - Text fields with a dropdown menu, where a grouped treatment isn’t
 *   appropriate
 *
 * On web, use a divider to separate menu items.
 *
 * Dividers and gaps can't receive focus.
 *
 * Keyboard navigation:
 * - Tab: Focus lands on menu
 * - Space or Enter: For closed menus: Opens menu or submenu. For open menus:
 *   Selects a menu item
 * - Up and Down arrows: For closed menus: Opens menu. For open menus: Moves
 *   focus to the next item
 * - Left and Right arrows: Opens or closes a submenu
 * - Letters: Focus moves to the next menu item starting with letter
 * - Escape: Closes menu
 *
 * People expect to exit a menu by:
 * - Selecting an option
 * - Tapping Escape or outside of the menu
 *
 * @see https://m3.material.io/components/menus/overview
 * @see https://m3.material.io/components/menus/guidelines
 * @see https://m3.material.io/components/menus/accessibility
 */
export function Menu<T extends object>({ color, className, ...props }: MenuProps<T>) {
  const inherited = useContext(MenuColorContext)
  const menuColor = color ?? inherited
  return (
    <MenuColorContext.Provider value={menuColor}>
      <AriaMenu
        {...props}
        className={composeTailwindRenderProps(className, list({ color: menuColor }))}
      />
    </MenuColorContext.Provider>
  )
}

// The props of React Aria's MenuItem, which an item is, rendered as a `<div>` in the `menuitem`
// role, or as an `<a>` given an `href`, with the `ref` of that element. `textValue` is what typing
// finds it by: its children when they are a plain string, else the textValue the types then
// require, of a string alone as the children, or of a textValue with any children.
export type MenuItemProps<T = object> = AriaMenuItemProps<T> &
  RefProps<HTMLDivElement> &
  ({ children: string; textValue?: string } | { textValue: string })

/* React Aria's slots in an item, and ours (menu.css): Text takes `leading` and `trailing` as well
 * as `label` and `description`, an Icon `leading`, `trailing` or none, a Keyboard `trailing` or
 * none. Any other slot throws, as React Aria's do; an element of yours is placed by its slot alone. */
function ItemSlots({ children }: { children: ReactNode }) {
  const text = useContext(TextContext)
  const keyboard = useSlottedContext(KeyboardContext) ?? {}
  const slots = text && 'slots' in text ? text.slots : undefined
  return (
    <Provider
      values={[
        [TextContext, { slots: { ...slots, leading: {}, trailing: {} } }],
        [KeyboardContext, { slots: { [DEFAULT_SLOT]: keyboard, trailing: keyboard } }],
        [IconContext, { slots: { [DEFAULT_SLOT]: {}, leading: {}, trailing: {} } }],
      ]}
    >
      {children}
    </Provider>
  )
}

// It draws its checkmark first, then its children as written, and a submenu's arrow last.
/**
 * Menu items can include label text, leading icons, trailing icons, and
 * keyboard commands.
 *
 * Menus have custom slots that support more flexible item layouts.
 *
 * When creating a complicated menu, think of the menu item as a container
 * with a swappable slot.
 *
 * Slots work best with simple content such as:
 *
 * - Images
 * - Progress indicators
 * - Color swatches
 *
 * Don't add buttons, switches, or other direct actions into the menu item.
 * Nested elements should only perform one action. Adding multiple actions
 * can break keyboard navigation and screen reader functionality.
 *
 * The accessibility label should be the same as the menu item text.
 *
 * For menu items with text and an icon, the icon’s accessibility label
 * should be marked as decorative to avoid redundant verbalizations.
 *
 * Space or Enter to select a menu item
 *
 * On web, menus can open submenus
 *
 * @see https://m3.material.io/components/menus/specs
 * @see https://m3.material.io/components/menus/guidelines
 * @see https://m3.material.io/components/menus/accessibility
 */
export function MenuItem<T extends object>({ className, children, ...props }: MenuItemProps<T>) {
  const color = useContext(MenuColorContext)
  // React Aria types to an item by its children when they are text, but it is handed a function.
  return (
    <AriaMenuItem
      textValue={typeof children === 'string' ? children : undefined}
      {...props}
      className={composeTailwindRenderProps(className, item({ color }))}
    >
      {composeRenderProps(children, (children, { hasSubmenu }) => (
        <>
          <Ripple />
          <span className="menu-item-check">
            <svg viewBox="0 0 20 20" aria-hidden>
              <path
                d="M4.59 9.88 8.1 13.38 15.41 6.09"
                pathLength={1}
                strokeWidth={1.5}
                className="menu-item-checkmark"
              />
            </svg>
          </span>
          <ItemSlots>{children}</ItemSlots>
          {hasSubmenu && <Icon slot="trailing" name="arrow_right" className="rtl:icon-mirrored" />}
        </>
      ))}
    </AriaMenuItem>
  )
}
