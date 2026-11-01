import { parseDate } from '@internationalized/date'
import {
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
  RangeCalendar,
} from '@material-web/react'
import { useState } from 'react'
import type { DateValue, RangeValue } from 'react-aria-components'

export default function Range() {
  const [range, setRange] = useState<RangeValue<DateValue>>({
    start: parseDate('2025-02-03'),
    end: parseDate('2025-02-12'),
  })
  return (
    <div className="flex w-90 flex-col gap-space-100">
      <RangeCalendar aria-label="Trip dates" value={range} onChange={setRange}>
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
      </RangeCalendar>
      <p className="m-0 px-space-300 text-body-md text-on-surface-variant">
        {range.start.toString()} to {range.end.toString()}
      </p>
    </div>
  )
}
