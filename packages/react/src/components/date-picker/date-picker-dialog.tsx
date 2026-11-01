import type { ReactNode } from 'react'
import { useLocale, useObjectRef } from 'react-aria'
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
import { PickerDialogContext } from './context'

/* Compose's DatePickerDialog: React Aria's ModalOverlay, Modal and Dialog, drawn with the global
 * dialog utilities (dialog.css), which hold a DatePicker or a DateRangePicker over the actions.
 * Its fixed classes are in date-picker.css. */

// The props of React Aria's Modal, the container, the open and close ones its ModalOverlay's, as
// when a Modal is written alone; the Dialog's `aria-label`; and Compose's buttons, with the clear
// button the M3 design kit draws at the start of the actions.
export type DatePickerDialogProps = ModalOverlayProps &
  Pick<AriaDialogProps, 'aria-label'> &
  RefProps<HTMLDivElement> & {
    /**
     * To exit a date picker, the input can either be confirmed (OK) or dismissed
     * (Cancel).
     *
     * @see https://m3.material.io/components/date-pickers/guidelines
     */
    confirmButton: ReactNode
    dismissButton?: ReactNode
    clearButton?: ReactNode
  }

// A basic dialog (dialog.css) as wide as its picker, named by the picker's title. A press outside
// closes it, as Compose's does, unless `isDismissable={false}`. Portaled out of what sets the
// page's `dir`, it is laid out in the locale's direction unless given one, as React Aria's Popover.
/**
 * Like other kinds of dialogs, modal date pickers use an enter and exit
 * transition pattern to appear on the screen.
 *
 * To exit a date picker, the input can either be confirmed (OK) or dismissed
 * (Cancel). Interacting outside of the dialog will also dismiss the time
 * picker. Unless one of these actions is taken, a time picker will continue
 * to retain focus.
 *
 * @see https://m3.material.io/components/date-pickers/overview
 * @see https://m3.material.io/components/date-pickers/guidelines
 */
export function DatePickerDialog({
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
  clearButton,
  className,
  inert,
  children,
  ref,
  ...props
}: DatePickerDialogProps) {
  const { direction } = useLocale()
  const container = useObjectRef(ref)
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
          ref={container}
          // Inert as it leaves, so nothing in it is pressed again, and else as it is told.
          inert={!state.isOpen || inert}
          className={composeTailwindRenderProps(className, 'date-picker-modal')}
        >
          {composeRenderProps(children, (children) => (
            <AriaDialog aria-label={ariaLabel} className="dialog">
              <PickerDialogContext value={container}>{children}</PickerDialogContext>
              {/* The actions: the clear button at the start, dismiss and confirm at the end. */}
              <div className="date-picker-actions">
                {clearButton !== undefined && (
                  <span className="date-picker-actions-start">{clearButton}</span>
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
