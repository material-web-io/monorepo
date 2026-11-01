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

export default function Months() {
  return (
    <RangeCalendar
      aria-label="Trip dates"
      defaultValue={{ start: parseDate('2025-02-24'), end: parseDate('2025-03-05') }}
      visibleDuration={{ months: 2 }}
    >
      <div className="calendar-nav">
        <div className="calendar-nav-arrows">
          <span className="calendar-arrow-slot">
            <IconButton slot="previous" aria-label="Previous">
              <Icon name="chevron_left" className="rtl:icon-mirrored" />
            </IconButton>
          </span>
          <span className="calendar-arrow-slot">
            <IconButton slot="next" aria-label="Next">
              <Icon name="chevron_right" className="rtl:icon-mirrored" />
            </IconButton>
          </span>
        </div>
      </div>
      <div className="calendar-days">
        <CalendarPage className="flex flex-wrap gap-x-space-300">
          {[0, 1].map((months) => (
            <div key={months} className="min-w-60 flex-1">
              <CalendarHeading offset={{ months }} />
              <CalendarGrid offset={{ months }}>
                {(date) => <CalendarCell date={date} />}
              </CalendarGrid>
            </div>
          ))}
        </CalendarPage>
      </div>
    </RangeCalendar>
  )
}
