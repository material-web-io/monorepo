import {
  CalendarHeaderCell as AriaCalendarHeaderCell,
  type CalendarHeaderCellProps as AriaCalendarHeaderCellProps,
} from 'react-aria-components'
import { type RefProps } from '../../lib/aria'
import { twMerge } from '../../lib/tv'

// The props of React Aria's CalendarHeaderCell, with the `ref` of the `<th>` it renders.
export type CalendarHeaderCellProps = AriaCalendarHeaderCellProps & RefProps<HTMLTableCellElement>

// React Aria's CalendarHeaderCell, a day of week label: body-large on-surface, in the middle of its
// column.
/**
 * Days of the week are not interactive and are therefore not focusable via
 * keyboard, yet the tooltip is available on hover.
 *
 * @see https://m3.material.io/components/date-pickers/accessibility
 */
export function CalendarHeaderCell({ className, ...props }: CalendarHeaderCellProps) {
  return (
    <AriaCalendarHeaderCell {...props} className={twMerge('calendar-header-cell', className)} />
  )
}
