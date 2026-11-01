import { type ComponentProps, type ReactNode } from 'react'
import { type MappedDateValue } from 'react-aria'
import { type DateFieldProps as AriaDateFieldProps, type DateValue } from 'react-aria-components'
import { useControlledState } from 'react-stately/useControlledState'
import { type Except } from '../../lib/aria'
import { twMerge } from '../../lib/tv'
import { type CalendarProps } from '../calendar'
import { DateContext, PickerContext } from './context'
import {
  renderChildren,
  root,
  useDisplayMode,
  type DatePickerRenderProps,
  type DisplayModeProps,
} from './helpers'

/* Compose's DatePicker, of the parts the caller writes in it (date-picker-*.tsx), with the text in
 * their own language. A DatePickerDialog holds it. Fixed classes: date-picker.css. */

export type { DatePickerDisplayMode, DatePickerRenderProps } from './helpers'

// React Aria's Calendar's props, but `onChange`, React Aria's DateField's, which the input calls
// with `null` too. `className`, `style` and the `ref` go on the outermost `<div>`; the children
// are the parts, or a function of the display mode that returns them.
export type DatePickerProps<T extends DateValue> = Except<
  CalendarProps<T>,
  'onChange' | 'className' | 'style' | 'children' | 'visibleDuration'
> &
  Pick<AriaDateFieldProps<T>, 'onChange'> &
  Pick<ComponentProps<'div'>, 'className' | 'style'> &
  DisplayModeProps & {
    children?: ReactNode | ((values: DatePickerRenderProps) => ReactNode)
  }

// Compose's DatePicker: the header over the calendar or the date input, which swap. The `value` is
// the date picked or typed; one typed past the bounds, or unavailable, makes it `null`, as in
// Compose's input. It draws no text of its own.
/**
 * Date pickers let people select a date, or a range of dates
 *
 * Date pickers can display past, present, or future dates
 *
 * Clearly indicate important dates, such as current and selected days
 *
 * Follow common patterns, like a calendar view
 *
 * Each input is a separate tab stop, which improves discoverability of the
 * control.
 *
 * Interactive targets for all elements meet Material's 48x48dp minimum touch
 * target requirement. Increasing density would negatively impact
 * accessibility by limiting tappable/clickable targets.
 *
 * Keyboard navigation
 *
 * - Page up/down: Move to the same date on next/previous month
 * - Home/End: Move to the first day of the month
 * - Shift + Page up/down: Moves to the same date in the next/previous year
 * - Shift + M: Moves to the month list dropdown
 * - Shift + Y: Moves to the year list dropdown
 *
 * @see https://m3.material.io/components/date-pickers/overview
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://m3.material.io/components/date-pickers/accessibility
 */
export function DatePicker<T extends DateValue>({
  displayMode,
  defaultDisplayMode,
  onDisplayModeChange,
  value,
  defaultValue,
  onChange,
  autoFocus,
  className,
  style,
  ref,
  children,
  ...props
}: DatePickerProps<T>) {
  const [date, setDate] = useControlledState<DateValue | null, MappedDateValue<T> | null>(
    value,
    defaultValue ?? null,
    onChange,
  )
  const picker = useDisplayMode({ displayMode, defaultDisplayMode, onDisplayModeChange })
  const calendar = props as CalendarProps<DateValue>
  return (
    <div ref={ref} className={twMerge(root, className)} style={style}>
      <PickerContext value={{ ...picker, isRange: false }}>
        <DateContext value={{ calendar, autoFocus, date, setDate }}>
          {renderChildren(children, { displayMode: picker.displayMode })}
        </DateContext>
      </PickerContext>
    </div>
  )
}
