import { type CalendarDate } from '@internationalized/date'
import { useState, type ComponentProps, type ReactNode } from 'react'
import { type MappedDateValue } from 'react-aria'
import { type DateValue, type RangeValue } from 'react-aria-components'
import { useDateRangePickerState } from 'react-stately/useDateRangePickerState'
import { type Except } from '../../lib/aria'
import { twMerge } from '../../lib/tv'
import { type RangeCalendarProps } from '../calendar'
import { AnchorContext, DateRangeContext, PickerContext, VisibleRangeContext } from './context'
import {
  renderChildren,
  root,
  useDisplayMode,
  type DatePickerRenderProps,
  type DisplayModeProps,
} from './helpers'

/* Compose's DateRangePicker, of the parts the caller writes in it (date-range-picker-*.tsx and
 * DatePicker's), with the text in their own language. A DatePickerDialog holds it. Fixed classes:
 * date-picker.css. */

// React Aria's RangeCalendar's props, `visibleDuration` 24 months unless given, with `onChange`
// called with `null` too, as the inputs clear the range; `className`, `style`, the `ref` and the
// children as DatePicker's.
export type DateRangePickerProps<T extends DateValue> = Except<
  RangeCalendarProps<T>,
  'onChange' | 'className' | 'style' | 'children'
> &
  Pick<ComponentProps<'div'>, 'className' | 'style'> &
  DisplayModeProps & {
    onChange?: (value: RangeValue<MappedDateValue<T>> | null) => void
    children?: ReactNode | ((values: DatePickerRenderProps) => ReactNode)
  }

// Compose's DateRangePicker: the header over the months, a column that fills the picker's height,
// or the start and end inputs, which swap. The range, held in React Aria's DateRangePicker state,
// is reported once both ends hold dates the months could pick, in order, and `null` until then.
/**
 * Date pickers let people select a date, or a range of dates
 *
 * Date range selection provides a start and end date. Common use cases include:
 *
 * - Booking a flight
 * - Reserving a hotel
 *
 * Modal date pickers navigate across date ranges in several ways:
 *
 * - To select a range of dates, tap the start and end dates on the calendar
 * - To navigate across months, scroll vertically
 *
 * Selection is indicated through color, drawing visual attention. In date
 * ranges, start and end dates are selected, while dates in-between appear
 * connected with a subtle highlight.
 *
 * On compact breakpoints, such as mobile, a full-screen modal date picker is
 * recommended to increase readability and touch target size. It can cover
 * the entire screen.
 *
 * Mobile full-screen pickers also have an additional close affordance (x)
 * icon button and Save confirmation.
 *
 * @see https://m3.material.io/components/date-pickers/overview
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://m3.material.io/components/date-pickers/accessibility
 */
export function DateRangePicker<T extends DateValue>({
  displayMode,
  defaultDisplayMode,
  onDisplayModeChange,
  value,
  defaultValue,
  onChange,
  visibleDuration = { months: 24 },
  autoFocus,
  className,
  style,
  ref,
  children,
  ...props
}: DateRangePickerProps<T>) {
  // The range and the ends the inputs hold before it is whole, as React Aria's DateRangePicker
  // holds them.
  const state = useDateRangePickerState({ value, defaultValue, onChange })
  const picker = useDisplayMode({ displayMode, defaultDisplayMode, onDisplayModeChange })
  const calendar = { ...(props as RangeCalendarProps<DateValue>), visibleDuration }
  return (
    <div ref={ref} className={twMerge(root, 'date-range-picker', className)} style={style}>
      <PickerContext value={{ ...picker, isRange: true }}>
        <DateRangeContext value={{ calendar, autoFocus, state }}>
          <AnchorScope>
            <VisibleRangeScope>
              {renderChildren(children, { displayMode: picker.displayMode })}
            </VisibleRangeScope>
          </AnchorScope>
        </DateRangeContext>
      </PickerContext>
    </div>
  )
}

// The anchor's state, held apart from DateRangePicker: as it changes, only the months' Anchor and
// the headline draw again, not the RangeCalendar, which would draw every day of its months again.
function AnchorScope({ children }: { children: ReactNode }) {
  const anchor = useState<DateValue | null>(null)
  return <AnchorContext value={anchor}>{children}</AnchorContext>
}

// The visible range's state, held apart as the anchor's is: as it is set, only the inputs draw
// again, not the RangeCalendar.
function VisibleRangeScope({ children }: { children: ReactNode }) {
  const visibleRange = useState<RangeValue<CalendarDate> | null>(null)
  return <VisibleRangeContext value={visibleRange}>{children}</VisibleRangeContext>
}
