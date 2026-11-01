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

function Parts() {
  return (
    <>
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
    </>
  )
}

export default function FormProps() {
  const date = parseDate('2025-08-17')
  return (
    <>
      <Calendar aria-label="Disabled" defaultValue={date} isDisabled className="w-90">
        <Parts />
      </Calendar>
      <Calendar aria-label="Read-only" defaultValue={date} isReadOnly className="w-90">
        <Parts />
      </Calendar>
    </>
  )
}
