import { useContext, type ElementType } from 'react'
import { composeRenderProps, OverlayTriggerStateContext } from 'react-aria-components'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  type ButtonRenderProps as AriaButtonRenderProps,
} from '../../lib/button'
import { tv } from '../../lib/tv'
import { PendingIndicator } from '../button/pending-indicator'
import { Icon } from '../icon'
import { Ripple } from '../ripple'
import type { FabMenuColor, FabMenuSize } from './context'

// The FAB: the 56dp close button's box with the FAB's size around it while the menu is closed,
// given back as margin as it opens (fab-menu-button), so it keeps its footprint and shrinks from
// its top end corner; with the focus ring on the keyboard focus React Aria reports. On the FAB's
// layer (z-fab), over the items that scroll behind it, one layer down (fab-menu-popover.tsx).
const button = tv({
  base: [
    'group/md-fab-menu relative z-fab box-content inline-flex h-14 w-14 shrink-0 touch-manipulation appearance-none items-center justify-center border-0 button-pending shadow-elevation-3 outline-none select-none not-disabled:cursor-pointer hover:shadow-elevation-4 pending:cursor-progress',
    'focus-ring fab-menu-button transition-fab-menu-button',
    'disabled:bg-on-surface/disabled-container disabled:text-on-surface/disabled-content disabled:shadow-none',
    // The border it gets there is outside the content box, so that box gives it room.
    'forced-colors:h-13.5 forced-colors:w-13.5 forced-colors:container-border',
  ],
  variants: {
    color: {
      primary: 'bg-primary-container text-on-primary-container',
      secondary: 'bg-secondary-container text-on-secondary-container',
      tertiary: 'bg-tertiary-container text-on-tertiary-container',
    },
    size: {
      baseline: 'rounded-shape-lg',
      medium: 'rounded-shape-lg-inc fab-menu-inset-3',
      large: 'rounded-shape-xl fab-menu-inset-5',
    },
    open: { true: 'rounded-shape-xl fab-menu-open', false: '' },
  },
  compoundVariants: [
    { color: 'primary', open: true, class: 'bg-primary text-on-primary' },
    { color: 'secondary', open: true, class: 'bg-secondary text-on-secondary' },
    { color: 'tertiary', open: true, class: 'bg-tertiary text-on-tertiary' },
  ],
})

// The FAB's icon and the close icon share one grid cell, each centered by its own
// nested grid (not inline line-height) so mismatched sizes don't skew either, and
// cross-fade as the menu opens.
const buttonIcon = tv({
  base: 'col-start-1 row-start-1 grid place-items-center transition-fade',
  variants: {
    icon: { fab: '', close: '' },
    open: { true: '', false: '' },
  },
  compoundVariants: [
    { icon: 'fab', open: true, class: 'opacity-0' },
    { icon: 'close', open: false, class: 'opacity-0' },
  ],
})

// The FAB's icon matches the FAB size it stands in for, per Fab's own
// baseline/medium/large icon sizing (fab.tsx); the close icon it cross-fades
// with is a fixed 20dp, per the specs page's "close button icon size", each
// set on its cell.
const iconSize: Record<FabMenuSize, string> = {
  baseline: 'icon-24',
  medium: 'icon-28',
  large: 'icon-36',
}

// A pending FAB's loading indicator, 1.5 times its icon, as M3 shows a 48dp one in a large
// button: the shape it draws is then about as large as the icon.
const pendingIndicatorSize: Record<FabMenuSize, number> = { baseline: 36, medium: 42, large: 54 }

// A FAB menu's FAB has no visible text of its own, so it is always icon-only - unlike
// Fab, which can grow a label - and so, like IconButton, must always be named by the caller.
type Label = { 'aria-label': string } | { 'aria-labelledby': string }

type FabMenuButtonBaseProps = {
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

  // The FAB's own size: the close button it shrinks into is 56dp whatever it is.
  /**
   * One FAB menu size for all sizes of FABs.
   *
   * @default 'baseline'
   * @see https://m3.material.io/components/fab-menu/overview
   * @see https://m3.material.io/components/fab-menu/specs
   */
  size?: FabMenuSize
}

// What a FAB menu's FAB passes its class and its children, given as functions: the state React
// Aria reports of its Button, pressed while the menu is open.
export type FabMenuButtonRenderProps = AriaButtonRenderProps

// The props of React Aria's Button, which the FAB is, from React Aria's hooks on the element
// given as `elementType` (lib/button), with the `ref` of that element, and the M3 props. Its
// children are its icon, which the close icon takes the place of while the menu is open;
// `isDisabled` disables the whole menu.
export type FabMenuButtonProps<T extends ElementType = 'button'> = AriaButtonProps<T> &
  Label &
  FabMenuButtonBaseProps

// The FAB the menu opens from: a FAB while the menu is closed, the 56dp close button once open,
// whatever `size` is. React Aria's MenuTrigger makes it the trigger, as the button in it. It
// doesn't position itself - place it with your layout, e.g. `fixed right-space-200 bottom-space-200 z-fab`.
/**
 * The FAB opens the menu.
 *
 * The FAB's accessibility label should describe the menu that the FAB will
 * open.
 *
 * @see https://m3.material.io/components/fab-menu/guidelines
 * @see https://m3.material.io/components/fab-menu/accessibility
 */
export function FabMenuButton<T extends ElementType = 'button'>({
  color = 'primary',
  size = 'baseline',
  className,
  children,
  ...props
}: FabMenuButtonProps<T>) {
  const open = useContext(OverlayTriggerStateContext)?.isOpen ?? false
  return (
    <AriaButton
      {...props}
      className={composeRenderProps(className, (className) =>
        button({ color, size, open, className }),
      )}
    >
      {composeRenderProps(children, (children, { isPending }) => (
        <>
          <Ripple />
          <span className="grid place-items-center">
            <span className={buttonIcon({ icon: 'fab', open, className: iconSize[size] })}>
              {children}
            </span>
            <span className={buttonIcon({ icon: 'close', open, className: 'icon-20' })}>
              <Icon name="close" />
            </span>
          </span>
          {isPending && <PendingIndicator size={pendingIndicatorSize[size]} />}
        </>
      ))}
    </AriaButton>
  )
}
