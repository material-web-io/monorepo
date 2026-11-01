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

/** The top of a calendar: the month it shows and its first weeks, a day selected. */
export default function CalendarThumbnail() {
  return (
    <div className="flex size-full items-start justify-center-safe px-space-150 pt-space-250">
      <div className="docs-thumbnail-panel rounded-shape-xl bg-surface-container-high pt-space-100">
        <Calendar aria-label="Event date" defaultValue={parseDate('2025-06-04')} className="w-90">
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
    </div>
  )
}
