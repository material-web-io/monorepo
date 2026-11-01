import {
  CalendarGridHeader as AriaCalendarGridHeader,
  type CalendarGridHeaderProps as AriaCalendarGridHeaderProps,
} from 'react-aria-components'
import { type RefProps } from '../../lib/aria'
import { twMerge } from '../../lib/tv'

// The props of React Aria's CalendarGridHeader, with the `ref` of the `<thead>` it renders.
export type CalendarGridHeaderProps = AriaCalendarGridHeaderProps &
  RefProps<HTMLTableSectionElement>

// React Aria's CalendarGridHeader, the day of week labels over a grid's days, in a 48dp row; hidden
// from assistive technology, as React Aria has them, since each day's name says its weekday.
export function CalendarGridHeader({ className, ...props }: CalendarGridHeaderProps) {
  return (
    <AriaCalendarGridHeader {...props} className={twMerge('calendar-grid-header', className)} />
  )
}
