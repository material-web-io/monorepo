import {
  composeRenderProps,
  RangeCalendar as AriaRangeCalendar,
  type DateValue,
  type RangeCalendarProps as AriaRangeCalendarProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { ControlsProvider } from './calendar-controls'

// The props of React Aria's RangeCalendar, with the `ref` of the `<div>` it renders. Its children
// are drawn as written, as Calendar's are.
export type RangeCalendarProps<T extends DateValue> = AriaRangeCalendarProps<T> &
  RefProps<HTMLDivElement>

// React Aria's RangeCalendar, as Calendar is, filling the column it is in: its grids draw the band
// of the range between its ends.
/**
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
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://m3.material.io/components/date-pickers/specs
 */
export function RangeCalendar<T extends DateValue>({
  className,
  children,
  ...props
}: RangeCalendarProps<T>) {
  return (
    <AriaRangeCalendar
      {...props}
      className={composeTailwindRenderProps(className, 'calendar calendar-range')}
    >
      {composeRenderProps(children, (children) => (
        <ControlsProvider>{children}</ControlsProvider>
      ))}
    </AriaRangeCalendar>
  )
}
