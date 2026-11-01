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
import { useState } from 'react'
import type { DateValue } from 'react-aria-components'

export default function Controlled() {
  const [date, setDate] = useState<DateValue>(parseDate('2025-08-17'))
  return (
    <div className="flex w-90 flex-col gap-space-100">
      <Calendar aria-label="Event date" value={date} onChange={setDate}>
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
      </Calendar>
      <p className="m-0 px-space-300 text-body-md text-on-surface-variant">{date.toString()}</p>
    </div>
  )
}
