import { useContext, type CSSProperties } from 'react'
import {
  composeRenderProps,
  OverlayTriggerStateContext,
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components'
import type { RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'

// The close button's 56dp, and the 16dp below it that the stack reaches, as Compose's column does
// (FabMenuButtonPaddingBottom): the items scroll behind the button and show below it.
const closeButton = 56
const belowCloseButton = 16

// The stack of items, React Aria's Popover: a box of no size that React Aria places at the FAB's
// end, 16dp below the close button, which the list (fab-menu.tsx) hangs from by its own end and
// reaches up from, as far as the room React Aria finds above: the items' trailing edges keep to the
// FAB's whatever their widths do, where a box placed by its start edge slid with them. Under the
// FAB and its focus ring (z-index), so the close button is drawn over the items that scroll behind
// it. Closing, it is kept until the last item has collapsed (fab-menu-items-closed), when React
// Aria removes it.
const stack = tv({
  base: 'group/md-fab-menu outline-none exiting:fab-menu-items-closed',
})

// The props of React Aria's Popover, which the stack of items is, with the `ref` of the `<div>`
// it renders: placed `'top end'` of the FAB unless given, 16dp below its close button, the list's
// padding keeping the items 8dp above it, and never turned below it.
export type FabMenuPopoverProps = AriaPopoverProps & RefProps<HTMLElement>

// The stack, portaled and placed by React Aria at the FAB, capped at the room it has above, where
// the FabMenu in it scrolls. Modal, as React Aria's popovers are: the FAB is inert with the rest of
// the page, so a press on it falls through it, which the close button's own hit area in the stack
// catches, over the items that scroll behind the button, and closes the menu with.
/**
 * When the FAB menu can scroll, make sure the items scroll behind the close
 * button. The close button should always be easy to access and unobstructed.
 *
 * @see https://m3.material.io/components/fab-menu/guidelines
 * @see https://m3.material.io/components/fab-menu/accessibility
 */
export function FabMenuPopover({ className, style, children, ...props }: FabMenuPopoverProps) {
  const state = useContext(OverlayTriggerStateContext)
  return (
    <AriaPopover
      placement="top end"
      offset={-(closeButton + belowCloseButton)}
      // The list may reach the window's top edge, as Compose's column does.
      containerPadding={0}
      shouldFlip={false}
      // Given a cap, React Aria keeps it as it measures the resizing stack, instead of lifting it,
      // which would scroll the list back from its end. This one is above any room it finds.
      maxHeight={Infinity}
      {...props}
      className={composeRenderProps(className, (className) => stack({ className }))}
      // React Aria's own z-index is inline, so this is too: under the FAB's layer (fab-menu-button.tsx),
      // and under the focus ring's, which the FAB's keyboard focus moves it to (focus-indicator).
      style={composeRenderProps(
        style,
        (style) => ({ zIndex: 'calc(var(--z-index-focus-ring) - 1)', ...style }) as CSSProperties,
      )}
    >
      {composeRenderProps(children, (children) => (
        <>
          {children}
          <span
            aria-hidden="true"
            className="absolute end-0 rounded-full"
            style={{ bottom: belowCloseButton, width: closeButton, height: closeButton }}
            onClick={() => state?.close()}
          />
        </>
      ))}
    </AriaPopover>
  )
}
