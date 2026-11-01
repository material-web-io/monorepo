import { parseDate } from '@internationalized/date'
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarHeading,
  Icon,
  IconButton,
} from '@material-web/react'

export default function Anatomy() {
  return (
    <Calendar aria-label="Event date" defaultValue={parseDate('2025-08-17')} className="w-90">
      <div className="flex items-center justify-between px-space-150">
        <IconButton slot="previous" aria-label="Previous month">
          <Icon name="chevron_left" className="rtl:icon-mirrored" />
        </IconButton>
        <CalendarHeading className="p-0" />
        <IconButton slot="next" aria-label="Next month">
          <Icon name="chevron_right" className="rtl:icon-mirrored" />
        </IconButton>
      </div>
      <div className="px-space-150">
        <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
      </div>
    </Calendar>
  )
}
