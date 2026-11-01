import { parseDate } from '@internationalized/date'
import {
  CalendarHeaderCell,
  CalendarMonths,
  CalendarWeekdays,
  RangeCalendar,
} from '@material-web/react'

export default function Scrolling() {
  return (
    <div className="flex h-140 w-90 flex-col">
      <RangeCalendar
        aria-label="Trip dates"
        defaultValue={{ start: parseDate('2025-08-17'), end: parseDate('2025-08-23') }}
        visibleDuration={{ months: 24 }}
      >
        <CalendarWeekdays>
          {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
        </CalendarWeekdays>
        <CalendarMonths />
      </RangeCalendar>
    </div>
  )
}
