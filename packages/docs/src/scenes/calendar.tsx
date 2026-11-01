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
import { PhoneTop } from '../components/phone'

/** A calendar on the screen of a new event: the month it shows, a day selected. */
export default function CalendarScene() {
  return (
    <PhoneTop>
      <div className="flex shrink-0 flex-col px-space-300 pt-space-200 pb-space-100">
        <span className="text-headline-sm">New event</span>
        <span className="text-body-md text-on-surface-variant">Choose a date</span>
      </div>
      {/* As wide as it is on any phone: from its start, where the phone is narrower. */}
      <div className="flex shrink-0 justify-center-safe">
        <Calendar
          aria-label="Event date"
          defaultValue={parseDate('2025-06-04')}
          className="w-90 shrink-0"
        >
          <div className="calendar-nav">
            <CalendarMenuButton />
            <div className="calendar-nav-arrows">
              <span className="calendar-arrow-slot">
                <IconButton slot="previous" aria-label="Previous month">
                  <Icon name="chevron_left" />
                </IconButton>
              </span>
              <span className="calendar-arrow-slot">
                <IconButton slot="next" aria-label="Next month">
                  <Icon name="chevron_right" />
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
      </div>
    </PhoneTop>
  )
}
