import type { ReactNode } from 'react'
import { useLocale } from 'react-aria'
import {
  composeRenderProps,
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  type DialogProps as AriaDialogProps,
  type ModalOverlayProps,
} from 'react-aria-components'
import {
  composeShouldCloseOnInteractOutside,
  composeTailwindRenderProps,
  type RefProps,
} from '../../lib/aria'

/* Compose's TimePickerDialog: React Aria's ModalOverlay, Modal and Dialog, drawn with the global
 * dialog utilities (dialog.css), which hold a TimePicker over the actions. Its fixed classes are
 * in time-picker.css. */

// The props of React Aria's Modal, the container, the open and close ones its ModalOverlay's, as
// when a Modal is written alone; the Dialog's `aria-label`; and Compose's buttons, the mode
// toggle at the start of the actions.
export type TimePickerDialogProps = ModalOverlayProps &
  Pick<AriaDialogProps, 'aria-label'> &
  RefProps<HTMLDivElement> & {
    /**
     * Text buttons are used to exit the dialog (Cancel) and save the selector
     * input (OK).
     *
     * @see https://m3.material.io/components/time-pickers/guidelines
     */
    confirmButton: ReactNode
    dismissButton?: ReactNode
    /**
     * The keyboard icon in the lower left toggles between the input picker and
     * the dial picker
     *
     * @see https://m3.material.io/components/time-pickers/guidelines
     */
    modeToggle?: ReactNode
  }

// A basic dialog (dialog.css) as wide as its picker, named by the picker's title. A press outside
// closes it, as Compose's does, unless `isDismissable={false}`. Portaled out of what sets the
// page's `dir`, it is laid out in the locale's direction unless given one, as React Aria's Popover.
/**
 * Like other kinds of dialogs, time pickers use an enter and exit transition
 * pattern to appear on the screen.
 *
 * To exit a time picker, the input can either be confirmed (OK) or dismissed
 * (Cancel). Interacting outside of the dialog will also dismiss the time
 * picker. Unless one of these actions is taken, a time picker will continue
 * to retain focus.
 *
 * Time pickers are modal windows above a scrim. This puts the time pickers at
 * the forefront of a person's view, calling attention to make a selection of
 * time.
 *
 * @see https://m3.material.io/components/time-pickers/guidelines
 */
export function TimePickerDialog({
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = true,
  isKeyboardDismissDisabled,
  shouldCloseOnInteractOutside,
  isEntering,
  isExiting,
  UNSTABLE_portalContainer,
  'aria-label': ariaLabel,
  confirmButton,
  dismissButton,
  modeToggle,
  className,
  inert,
  children,
  ref,
  ...props
}: TimePickerDialogProps) {
  const { direction } = useLocale()
  return (
    <AriaModalOverlay
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      shouldCloseOnInteractOutside={composeShouldCloseOnInteractOutside(
        shouldCloseOnInteractOutside,
      )}
      isEntering={isEntering}
      isExiting={isExiting}
      UNSTABLE_portalContainer={UNSTABLE_portalContainer}
      className="dialog-modal-overlay dialog-modal-overlay-basic"
    >
      {({ state }) => (
        <AriaModal
          dir={direction}
          {...props}
          ref={ref}
          // Inert as it leaves, so nothing in it is pressed again, and else as it is told.
          inert={!state.isOpen || inert}
          className={composeTailwindRenderProps(className, 'time-picker-modal')}
        >
          {composeRenderProps(children, (children) => (
            <AriaDialog aria-label={ariaLabel} className="dialog">
              {children}
              {/* The actions: the mode toggle at the start, dismiss and confirm at the end. */}
              <div className="time-picker-actions">
                {modeToggle !== undefined && (
                  <span className="time-picker-actions-start">{modeToggle}</span>
                )}
                {dismissButton}
                {confirmButton}
              </div>
            </AriaDialog>
          ))}
        </AriaModal>
      )}
    </AriaModalOverlay>
  )
}
