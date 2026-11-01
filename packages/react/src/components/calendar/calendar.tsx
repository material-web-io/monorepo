import {
  Calendar as AriaCalendar,
  composeRenderProps,
  type CalendarProps as AriaCalendarProps,
  type DateValue,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { ControlsProvider } from './calendar-controls'

/* React Aria's Calendar, drawn as the M3 date pickers draw it, and each of its parts in a file of
 * its own (calendar-*.tsx), with the M3 parts React Aria has none of. The date pickers
 * (../date-picker) are pieced from them. Their fixed classes are in calendar.css. */

// The props of React Aria's Calendar, with the `ref` of the `<div>` it renders. Its children are
// drawn as written: the calendar's parts, or anything else React Aria's Calendar takes.
export type CalendarProps<T extends DateValue> = AriaCalendarProps<T> & RefProps<HTMLDivElement>

// React Aria's Calendar: body-large on-surface, as wide as what holds it. Its previous and next
// buttons (`slot="previous"`, `slot="next"`) slide the page as they turn it, and a menu button in
// it opens its picker over the days.
/**
 * Clearly indicate important dates, such as current and selected days
 *
 * Follow common patterns, like a calendar view
 *
 * Selection is indicated through color, drawing visual attention. In date
 * ranges, start and end dates are selected, while dates in-between appear
 * connected with a subtle highlight.
 *
 * Keyboard navigation
 *
 * - Page up/down: Move to the same date on next/previous month
 * - Home/End: Move to the first day of the month
 * - Shift + Page up/down: Moves to the same date in the next/previous year
 * - Shift + M: Moves to the month list dropdown
 * - Shift + Y: Moves to the year list dropdown
 *
 * To support screen reader users, labels are used to enumerate the complete
 * date. This allows screen reader users to hear the full context of "Monday,
 * August 17” instead of just part of the date.
 *
 * @see https://m3.material.io/components/date-pickers/overview
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://m3.material.io/components/date-pickers/accessibility
 */
export function Calendar<T extends DateValue>({ className, children, ...props }: CalendarProps<T>) {
  return (
    <AriaCalendar {...props} className={composeTailwindRenderProps(className, 'calendar')}>
      {composeRenderProps(children, (children) => (
        <ControlsProvider>{children}</ControlsProvider>
      ))}
    </AriaCalendar>
  )
}
