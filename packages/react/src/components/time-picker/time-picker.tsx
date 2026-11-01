import { Time } from '@internationalized/date'
import type { ReactNode } from 'react'
import {
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
  type TimeValue,
} from 'react-aria-components'
import { useControlledState } from 'react-stately/useControlledState'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { PickerContext } from './context'
import {
  renderChildren,
  type TimePickerDisplayMode,
  type TimePickerLayout,
  type TimePickerRenderProps,
  type TimePickerSelection,
} from './helpers'

/* Compose's TimePicker and TimeInput as one, of the parts the caller writes in it (time-picker-*.tsx),
 * with the text in their own language, on React Aria's TimeField, which holds the time. A
 * TimePickerDialog holds it. Fixed classes: time-picker.css. */

export type {
  TimePickerDisplayMode,
  TimePickerLayout,
  TimePickerRenderProps,
  TimePickerSelection,
} from './helpers'

// React Aria's TimeField's props, but the bounds and the granularity, which the dial has none of:
// hours and minutes, as Compose's. `className`, `style` and the `ref` go on the TimeField's `<div>`;
// the children are the parts, or a function of the display mode and the selection that returns them.
export type TimePickerProps<T extends TimeValue> = Except<
  AriaTimeFieldProps<T>,
  'children' | 'minValue' | 'maxValue' | 'granularity'
> &
  RefProps<HTMLDivElement> & {
    // Whether the dial or the time input shows, as Compose's `TimePickerDisplayMode`: the caller's,
    // as in Compose's TimePickerDialog, whose mode toggle sits in the dialog's actions.
    /**
     * Time input pickers allow people to specify a time using keyboard numbers.
     * This input option should be accessible from any other mobile time picker
     * interface by tapping the keyboard icon.
     *
     * For time selection that doesn’t require a dial view, make a time input
     * picker the default option
     *
     * @see https://m3.material.io/components/time-pickers/guidelines
     * @see https://m3.material.io/components/time-pickers/accessibility
     */
    displayMode?: TimePickerDisplayMode
    // The dial under the time or beside it, as Compose's `TimePickerLayoutType`.
    /**
     * The clock dial interface adapts to a device’s orientation. In landscape
     * mode, the stacked input and selection options are positioned side-by-side.
     *
     * @see https://m3.material.io/components/time-pickers/guidelines
     */
    layout?: TimePickerLayout
    // The part of the time the dial sets, as Compose's `TimePickerSelectionMode`, hour unless given.
    // As React Aria pairs them: `defaultSelection` and `onSelectionChange`.
    selection?: TimePickerSelection
    defaultSelection?: TimePickerSelection
    onSelectionChange?: (selection: TimePickerSelection) => void
    children?: ReactNode | ((values: TimePickerRenderProps) => ReactNode)
  }

// React Aria's placeholder: midnight, as Compose's state starts.
const midnight = new Time()

// Compose's TimePicker: React Aria's TimeField, whose segments the time input draws as the spec's
// time selectors in both modes, with the period selector and the dial, which set the field.
/**
 * Time pickers help people select and set a specific time
 *
 * Time pickers are modal and cover the main content
 *
 * Two variants: dial and input
 *
 * People can select hours, minutes, or periods of time
 *
 * Make sure time can easily be selected by hand on a mobile device
 *
 * Time pickers should allow manual time entry through text input, rather than
 * exclusively through the dial selector. This makes it easier for those using
 * keyboard inputs rather than touchscreens.
 *
 * Keyboard navigation
 *
 * - Tab: Focus lands on (non-disabled) time slot
 * - Space or Enter: Activates the (non-disabled) time slot
 *
 * @see https://m3.material.io/components/time-pickers/overview
 * @see https://m3.material.io/components/time-pickers/guidelines
 * @see https://m3.material.io/components/time-pickers/accessibility
 */
export function TimePicker<T extends TimeValue>({
  displayMode = 'picker',
  layout = 'vertical',
  selection,
  defaultSelection = 'hour',
  onSelectionChange,
  placeholderValue,
  shouldForceLeadingZeros = true,
  className,
  children,
  ref,
  ...props
}: TimePickerProps<T>) {
  const [selected, setSelection] = useControlledState(
    selection,
    defaultSelection,
    onSelectionChange,
  )
  return (
    <AriaTimeField
      {...props}
      ref={ref}
      placeholderValue={placeholderValue}
      shouldForceLeadingZeros={shouldForceLeadingZeros}
      className={composeTailwindRenderProps(className, 'time-picker')}
    >
      <PickerContext
        value={{
          displayMode,
          layout,
          selection: selected,
          setSelection,
          placeholderValue: placeholderValue ?? midnight,
        }}
      >
        {renderChildren(children, { displayMode, selection: selected })}
      </PickerContext>
    </AriaTimeField>
  )
}
