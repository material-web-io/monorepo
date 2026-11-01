import { parseDate } from '@internationalized/date'
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarMenuButton,
  CalendarPage,
  CalendarWeekdays,
  CalendarYearPicker,
  Icon,
  IconButton,
} from '@material-web/react'

export default function Basic() {
  return (
    <Calendar aria-label="Event date" defaultValue={parseDate('2025-08-17')} className="w-90">
      <div className="calendar-nav">
        <CalendarMenuButton />
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
      <div className="calendar-body">
        <div className="calendar-days">
          <CalendarWeekdays>
            {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
          </CalendarWeekdays>
          <CalendarPage>
            <CalendarGrid>
              <CalendarGridBody>{(date) => <CalendarCell date={date} />}</CalendarGridBody>
            </CalendarGrid>
          </CalendarPage>
        </div>
        <CalendarYearPicker />
      </div>
    </Calendar>
  )
}
