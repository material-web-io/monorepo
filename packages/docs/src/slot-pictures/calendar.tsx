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
import type { ReactNode } from 'react'
import { Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

const slots = ['previous', 'next', 'errorMessage']

// What a calendar in the picture holds: its heading and arrows, its days, and an error message.
function Parts({ error }: { error: ReactNode }) {
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
      <Text slot="errorMessage">{error}</Text>
    </>
  )
}

/** The slots of a calendar: its previous and next buttons, and its error message. */
export function CalendarSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={slots} showLegend={showLegend}>
      <SlotCanvas>
        <div className="w-90 max-w-full">
          <Calendar aria-label="Delivery" defaultValue={parseDate('2025-08-17')} isInvalid>
            <Parts error="Deliveries are on weekdays" />
          </Calendar>
        </div>
      </SlotCanvas>
    </SlotPicture>
  )
}
