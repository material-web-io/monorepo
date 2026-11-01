import { useContext } from 'react'
import { ButtonContext, useSlottedContext } from 'react-aria-components'
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
} from '../calendar'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { DateContext, PickerContext } from './context'
import { Pane } from './helpers'

// A DatePicker's calendar, as Compose's modal picker draws it: the menu button and the arrows over
// the month, in the pane the input swaps with, taking the picker's props and value. Swapped in
// with a date, it is drawn anew with the focus on it, so that it opens at the date's month, as
// Compose's shows it.
export function DatePickerCalendar() {
  const { displayMode } = useContext(PickerContext)!
  const { calendar, autoFocus, date, setDate } = useContext(DateContext)!
  return (
    <Pane of="picker" anew={!!date}>
      <Calendar
        {...calendar}
        defaultFocusedValue={date ?? calendar.defaultFocusedValue}
        autoFocus={autoFocus && displayMode === 'picker'}
        value={date}
        onChange={setDate}
      >
        <CalendarNav />
        <CalendarBody />
      </Calendar>
    </Pane>
  )
}

// The month and year's menu button, which opens the years, and the arrows that page the months.
function CalendarNav() {
  return (
    <div className="calendar-nav">
      <CalendarMenuButton />
      <div className="calendar-nav-arrows">
        <CalendarArrow slot="previous" />
        <CalendarArrow slot="next" />
      </div>
    </div>
  )
}

// React Aria's previous or next button, named as React Aria names it in its locale, with the key
// that pages the same way, its chevron mirrored right to left.
function CalendarArrow({ slot }: { slot: 'previous' | 'next' }) {
  const isPrevious = slot === 'previous'
  // The name the calendar gives the slot, given again as IconButton's types ask for one.
  const ariaLabel = useSlottedContext(ButtonContext, slot)?.['aria-label'] ?? ''
  return (
    <span className="calendar-arrow-slot">
      <IconButton
        slot={slot}
        aria-label={ariaLabel}
        aria-keyshortcuts={isPrevious ? 'PageUp' : 'PageDown'}
      >
        <Icon name={isPrevious ? 'chevron_left' : 'chevron_right'} className="rtl:icon-mirrored" />
      </IconButton>
    </span>
  )
}

// The day of week labels over the page of the month, which slides as the months page, and the
// years over them when they are open.
function CalendarBody() {
  return (
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
  )
}
