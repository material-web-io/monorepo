import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarHeading,
  CalendarPage,
  Icon,
  IconButton,
} from '@material-web/react'
import { useState } from 'react'

export default function Focused() {
  const [focused, setFocused] = useState(parseDate('2022-04-17'))
  return (
    <div className="flex w-90 flex-col items-center gap-space-200">
      <Button variant="outlined" onPress={() => setFocused(today(getLocalTimeZone()))}>
        Today
      </Button>
      <Calendar aria-label="Event date" focusedValue={focused} onFocusChange={setFocused}>
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
    </div>
  )
}
