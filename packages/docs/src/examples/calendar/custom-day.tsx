import { parseDate } from '@internationalized/date'
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarHeading,
  CalendarPage,
  Icon,
  IconButton,
} from '@material-web/react'

const events = ['2025-08-05', '2025-08-14', '2025-08-17', '2025-08-22']

export default function CustomDay() {
  return (
    <Calendar aria-label="Event date" defaultValue={parseDate('2025-08-17')} className="w-90">
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
          <CalendarGrid>
            {(date) => (
              <CalendarCell date={date}>
                {({ formattedDate }) => (
                  <>
                    {formattedDate}
                    {events.includes(date.toString()) && (
                      <span className="absolute inset-x-0 bottom-space-50 mx-auto size-1 rounded-shape-full bg-current" />
                    )}
                  </>
                )}
              </CalendarCell>
            )}
          </CalendarGrid>
        </CalendarPage>
      </div>
    </Calendar>
  )
}
