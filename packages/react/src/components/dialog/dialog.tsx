import {
  composeRenderProps,
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type DialogProps as AriaDialogProps,
  type ModalOverlayProps as AriaModalOverlayProps,
  type ModalRenderProps,
} from 'react-aria-components'
import {
  composeShouldCloseOnInteractOutside,
  composeTailwindRenderProps,
  type RefProps,
} from '../../lib/aria'
import { tv } from '../../lib/tv'

/* React Aria's ModalOverlay, the layer and the scrim; its Modal, the container; and in that its
 * Dialog, the column in the role, which holds what it is given. Their fixed classes are in
 * dialog.css; what a basic or a full-screen dialog has of its own is picked here. */

// What opens a dialog is React Aria's own DialogTrigger, around the button and the Dialog.
export { DialogTrigger, type DialogTriggerProps } from 'react-aria-components'

const overlay = tv({
  base: 'dialog-modal-overlay',
  variants: {
    fullScreen: { false: 'dialog-modal-overlay-basic', true: '' },
  },
})

const modal = tv({
  base: 'dialog-modal',
  variants: {
    fullScreen: { false: 'dialog-modal-basic', true: 'dialog-modal-full-screen' },
  },
})

// What a Dialog passes its className, style and children, given as functions: the state React
// Aria reports of its Modal, whose `state.close()` closes it.
export type DialogRenderProps = ModalRenderProps

// The prop `Dialog` adds to those of React Aria's Modal. Its comment quotes the M3
// dialogs pages, which it lists under @see; it adds no wording of our own.
type DialogBaseProps = {
  // A full-screen dialog fills the window, up to 560dp wide, and is no alert dialog: a small
  // `AppBar` of yours heads it. Else it is a basic dialog.
  /**
   * Two variants: basic and full-screen
   *
   * Full-screen dialogs fill the entire screen, containing actions that require a series of
   * tasks to complete. One example is creating a calendar entry with the event title, date,
   * location, and time.
   *
   * Full-screen dialogs may be used for content or tasks that meet any of these criteria:
   *
   * - Dialogs that include components which require keyboard input, such as form fields
   * - When changes aren’t saved instantly
   * - When components within the dialog open additional dialogs
   *
   * Full-screen dialogs are for compact breakpoints only, like mobile devices. For medium and
   * expanded breakpoints, use a basic dialog.
   *
   * Dialogs can swap variants as the breakpoint changes. For example, a full-screen dialog can
   * change into a basic dialog at larger breakpoints.
   *
   * Because they take up the entire screen, full-screen dialogs are the only dialogs over which
   * other dialogs can appear.
   *
   * @default false
   * @see https://m3.material.io/components/dialogs/overview
   * @see https://m3.material.io/components/dialogs/guidelines
   */
  isFullScreen?: boolean
}

// The props of React Aria's Modal, with the `ref` of the container's `<div>`: what opens it,
// `isOpen`, `defaultOpen` and `onOpenChange`, unless a DialogTrigger does, `isDismissable`, on
// unless set, which its scrim closes it by, `isKeyboardDismissDisabled` and the rest; and the
// `aria-label` of React Aria's Dialog, which names one with no title.
export type DialogProps = AriaModalOverlayProps &
  Pick<AriaDialogProps, 'aria-label'> &
  RefProps<HTMLDivElement> &
  DialogBaseProps

// React Aria's Modal in a ModalOverlay of its own, as React Aria's is when written alone, around
// its Dialog. The overlay takes the props that open and close it, the Dialog the `aria-label`,
// and the container the rest, its `ref` and `className`; it is inert as it leaves. What it holds
// is yours, drawn as given. An `alertdialog`, a `dialog` full-screen, named by a React Aria
// `Heading` in it with `slot="title"` or else, in a `DialogTrigger`, by the trigger, and
// described by a `Text` with `slot="description"`; a button in it with `slot="close"` closes it.
/**
 * Dialogs provide important prompts in a user flow
 *
 * Use dialogs to make sure users act on information
 *
 * Should be dedicated to completing a single task
 *
 * Can also display information relevant to the task
 *
 * Commonly used to confirm high-risk actions like deleting progress
 *
 * A dialog is a modal window that appears in front of app content to provide critical
 * information or ask for a decision. Dialogs disable all app functionality when they appear, and
 * remain on screen until confirmed, dismissed, or a required action has been taken.
 *
 * Basic dialogs appear in a center position by default.
 *
 * Their position can be overridden to provide a more ergonomic experience.
 *
 * Basic dialogs can be custom-positioned anywhere on larger screens, respecting margins to
 * prevent edge collision.
 *
 * Dialogs don’t scroll with elements outside of the dialog, such as the background.
 *
 * Dialog containers appear above other screen elements and hold the dialog’s headline, text,
 * buttons, and list items.
 *
 * To focus attention on the dialog, surfaces behind the container are scrimmed with a temporary
 * overlay to make them less prominent.
 *
 * Basic dialog padding and size measurements
 *
 * - Container shape: 28dp corner radius
 * - Container height: Dynamic
 * - Container width: Min 280dp; Max 560dp
 * - Top/Left/right/bottom padding: 24dp
 *
 * Full-screen dialog padding and size measurements
 *
 * - Container shape: 0dp corner radius
 * - Container width: Container width; Max 560dp
 *
 * Dialogs retain focus until dismissed or an action has been taken, such as choosing a setting.
 *
 * When a dialog appears, focus should automatically land on the first interactive element
 * within the dialog.
 *
 * Keyboard navigation:
 *
 * - Tab: Focus lands on the next interactive element contained in the dialog, or the first
 *   element if focus is currently on the last element
 * - Shift + Tab: Focus lands on the previous interactive element contained in the dialog, or the
 *   last element if focus is currently on the first element
 * - Space or Enter: Triggers or commits the action of the focused element
 * - Escape: Closes the dialog
 *
 * The accessibility label for a dialog is typically the same as the dialog’s title or headline.
 *
 * On web, basic dialogs should have the alert dialog role.
 *
 * @see https://m3.material.io/components/dialogs/overview
 * @see https://m3.material.io/components/dialogs/guidelines
 * @see https://m3.material.io/components/dialogs/specs
 * @see https://m3.material.io/components/dialogs/accessibility
 */
export function Dialog({
  isFullScreen = false,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = true,
  isKeyboardDismissDisabled,
  isEntering,
  isExiting,
  UNSTABLE_portalContainer,
  shouldCloseOnInteractOutside,
  'aria-label': ariaLabel,
  className,
  inert,
  children,
  ...props
}: DialogProps) {
  return (
    <AriaModalOverlay
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      isEntering={isEntering}
      isExiting={isExiting}
      UNSTABLE_portalContainer={UNSTABLE_portalContainer}
      shouldCloseOnInteractOutside={composeShouldCloseOnInteractOutside(
        shouldCloseOnInteractOutside,
      )}
      className={overlay({ fullScreen: isFullScreen })}
    >
      {({ state }) => (
        <AriaModal
          {...props}
          // Inert as it leaves, so nothing in it is pressed again, and else as it is told.
          inert={!state.isOpen || inert}
          className={composeTailwindRenderProps(className, modal({ fullScreen: isFullScreen }))}
        >
          {composeRenderProps(children, (children) => (
            <AriaDialog
              role={isFullScreen ? 'dialog' : 'alertdialog'}
              aria-label={ariaLabel}
              className="dialog"
            >
              {children}
            </AriaDialog>
          ))}
        </AriaModal>
      )}
    </AriaModalOverlay>
  )
}
