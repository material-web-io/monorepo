import { parseDate } from '@internationalized/date'
import {
  CalendarCell,
  CalendarGrid,
  CalendarHeading,
  CalendarPage,
  Icon,
  IconButton,
  RangeCalendar,
} from '@material-web/react'
import type { DateValue } from 'react-aria-components'

const booked = [
  [parseDate('2025-02-11'), parseDate('2025-02-12')],
  [parseDate('2025-02-20'), parseDate('2025-02-22')],
] as const

const isBooked = (date: DateValue) =>
  booked.some(([start, end]) => date.compare(start) >= 0 && date.compare(end) <= 0)

export default function Unavailable() {
  return (
    <div className="w-90">
      <RangeCalendar
        aria-label="Trip dates"
        defaultValue={{ start: parseDate('2025-02-06'), end: parseDate('2025-02-14') }}
        minValue={parseDate('2025-02-04')}
        isDateUnavailable={isBooked}
        allowsNonContiguousRanges
      >
        <div className="calendar-nav">
          <CalendarHeading className="p-0" />
          <div className="calendar-nav-arrows">
            <span className="calendar-arrow-slot">
              <IconButton slot="previous" aria-label="Previous month">
                <Icon name="chevron_left" className="rtl:icon-mirrored" />
              </IconButton>
            </span>
            <span className="calendar-arrow-slot">
              <IconButton slot="next" aria-label="Next month">
                <Icon name="chevron_right" className="rtl:icon-mirrored" />
              </IconButton>
            </span>
          </div>
        </div>
        <div className="calendar-days">
          <CalendarPage>
            <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
          </CalendarPage>
        </div>
      </RangeCalendar>
    </div>
  )
}
