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
import { useState } from 'react'
import { Text, type DateValue, type RangeValue } from 'react-aria-components'

export default function Invalid() {
  const [range, setRange] = useState<RangeValue<DateValue>>({
    start: parseDate('2025-02-06'),
    end: parseDate('2025-02-18'),
  })
  const isInvalid = range.end.compare(range.start) > 7
  return (
    <div className="w-90">
      <RangeCalendar aria-label="Stay" value={range} onChange={setRange} isInvalid={isInvalid}>
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
        {isInvalid && <Text slot="errorMessage">Maximum stay duration is 1 week</Text>}
      </RangeCalendar>
    </div>
  )
}
