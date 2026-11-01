import {
  CalendarCell as AriaCalendarCell,
  composeRenderProps,
  type CalendarCellProps as AriaCalendarCellProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { Ripple } from '../ripple'

// The props of React Aria's CalendarCell, with the `ref` of the `<td>` it renders.
export type CalendarCellProps = AriaCalendarCellProps & RefProps<HTMLTableCellElement>

// React Aria's CalendarCell, a day: a 40dp round button in its 48dp cell, today ringed and the
// selected day filled in primary, at 38% outside the month or the bounds, struck out unavailable.
// Its children, the day's number unless given, are drawn over its ripple.
/**
 * Clearly indicate important dates, such as current and selected days
 *
 * Dates should have contrast of at least 4.5:1 between the link text colors
 * and the background.
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://m3.material.io/components/date-pickers/accessibility
 */
export function CalendarCell({ className, children, ...props }: CalendarCellProps) {
  return (
    <AriaCalendarCell {...props} className={composeTailwindRenderProps(className, 'calendar-cell')}>
      {composeRenderProps(children, (children, { formattedDate }) => (
        <>
          <Ripple />
          {children ?? formattedDate}
        </>
      ))}
    </AriaCalendarCell>
  )
}
