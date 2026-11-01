import { useContext } from 'react'
import {
  CalendarGrid as AriaCalendarGrid,
  RangeCalendarStateContext,
  type CalendarGridProps as AriaCalendarGridProps,
} from 'react-aria-components'
import { type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { CalendarGridBody } from './calendar-grid-body'
import { CalendarGridHeader } from './calendar-grid-header'
import { CalendarHeaderCell } from './calendar-header-cell'

// A grid, a range calendar's drawing the band of the range in its cells: React Aria's highlighted
// range, which runs from the start to the day hovered or focused while the end is being picked.
const grid = tv({
  base: 'calendar-grid',
  variants: {
    range: { true: 'calendar-grid-range', false: '' },
  },
})

// The props of React Aria's CalendarGrid, with the `ref` of the `<table>` it renders.
export type CalendarGridProps = AriaCalendarGridProps & RefProps<HTMLTableElement>

// React Aria's CalendarGrid, a month's days: seven 48dp columns spread evenly across its width, as
// Compose spreads them. Given a function, it draws the CalendarGridHeader and the CalendarGridBody,
// as React Aria's draws its own; given them, as they are written.
/**
 * Follow common patterns, like a calendar view
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 */
export function CalendarGrid({ className, children, ...props }: CalendarGridProps) {
  const isRange = useContext(RangeCalendarStateContext) !== null
  return (
    <AriaCalendarGrid {...props} className={grid({ range: isRange, className })}>
      {typeof children === 'function' ? (
        <>
          <CalendarGridHeader>
            {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
          </CalendarGridHeader>
          <CalendarGridBody>{children}</CalendarGridBody>
        </>
      ) : (
        children
      )}
    </AriaCalendarGrid>
  )
}
