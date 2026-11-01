import {
  CalendarGridBody as AriaCalendarGridBody,
  type CalendarGridBodyProps as AriaCalendarGridBodyProps,
} from 'react-aria-components'
import { type RefProps } from '../../lib/aria'
import { twMerge } from '../../lib/tv'

// The props of React Aria's CalendarGridBody, with the `ref` of the `<tbody>` it renders.
export type CalendarGridBodyProps = AriaCalendarGridBodyProps & RefProps<HTMLTableSectionElement>

// React Aria's CalendarGridBody, a grid's weeks, a 48dp row each, a CalendarCell in each of its
// cells.
export function CalendarGridBody({ className, ...props }: CalendarGridBodyProps) {
  return <AriaCalendarGridBody {...props} className={twMerge('calendar-grid-body', className)} />
}
