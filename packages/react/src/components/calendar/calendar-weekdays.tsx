import { Fragment, type ComponentProps } from 'react'
import { useCalendarGrid } from 'react-aria'
import {
  CalendarContext,
  RangeCalendarContext,
  useSlottedContext,
  type CalendarGridHeaderProps as AriaCalendarGridHeaderProps,
  type CalendarGridProps as AriaCalendarGridProps,
} from 'react-aria-components'
import { type RefProps } from '../../lib/aria'
import { twMerge } from '../../lib/tv'
import { useCalendarState } from './calendar-controls'

// The props of the day of week labels: React Aria's CalendarGridHeader's function of a day's name,
// CalendarGrid's `weekdayStyle`, and the `className`, `style` and `ref` of their `<table>`.
export type CalendarWeekdaysProps = Pick<AriaCalendarGridHeaderProps, 'children'> &
  Pick<AriaCalendarGridProps, 'weekdayStyle'> &
  Pick<ComponentProps<'table'>, 'className' | 'style'> &
  RefProps<HTMLTableElement>

// The day of week labels once over a calendar's grids, as Compose draws them, so that they don't
// page or scroll with the days: an aria-hidden table in the grids' columns, each label what the
// children draw for React Aria's name of the day (useCalendarGrid, from the first day of the week).
/**
 * Days of the week are not interactive and are therefore not focusable via
 * keyboard, yet the tooltip is available on hover.
 *
 * @see https://m3.material.io/components/date-pickers/accessibility
 */
export function CalendarWeekdays({
  weekdayStyle = 'narrow',
  className,
  style,
  children,
  ref,
}: CalendarWeekdaysProps) {
  const state = useCalendarState()
  const single = useSlottedContext(CalendarContext)
  const range = useSlottedContext(RangeCalendarContext)
  const { weekDays } = useCalendarGrid(
    { weekdayStyle, firstDayOfWeek: (single ?? range)?.firstDayOfWeek },
    state,
  )
  return (
    <table ref={ref} aria-hidden className={twMerge('calendar-weekdays', className)} style={style}>
      <thead>
        <tr>
          {weekDays.map((day, i) => (
            <Fragment key={i}>{children(day)}</Fragment>
          ))}
        </tr>
      </thead>
    </table>
  )
}
