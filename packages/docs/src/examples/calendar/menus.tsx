import { DateFormatter, parseDate } from '@internationalized/date'
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarMenuButton,
  CalendarMonthPicker,
  CalendarPage,
  CalendarWeekdays,
  CalendarYearPicker,
  Icon,
  IconButton,
} from '@material-web/react'
import { useLocale } from 'react-aria-components'

export default function Menus() {
  const { locale } = useLocale()
  const month = new DateFormatter(locale, { month: 'short' })
  const year = new DateFormatter(locale, { year: 'numeric' })
  return (
    <Calendar aria-label="Event date" defaultValue={parseDate('2025-08-17')} className="w-90">
      {({ state }) => {
        const shown = state.visibleRange.start.toDate(state.timeZone)
        return (
          <>
            <div className="calendar-nav gap-space-100">
              <CalendarMenuButton picker="month">{month.format(shown)}</CalendarMenuButton>
              <CalendarMenuButton picker="year">{year.format(shown)}</CalendarMenuButton>
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
              <CalendarMonthPicker />
              <CalendarYearPicker />
            </div>
          </>
        )
      }}
    </Calendar>
  )
}
