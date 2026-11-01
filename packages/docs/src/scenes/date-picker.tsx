import { parseDate } from '@internationalized/date'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
} from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

/** A date picker that fills a phone's screen: its title, the date selected, and the month. */
export default function DatePickerScene() {
  return (
    <PhoneTop>
      {/* As wide as it is on any phone: from its start, where the phone is narrower. */}
      <div className="flex shrink-0 justify-center-safe">
        <div className="w-90 shrink-0">
          <DatePicker defaultValue={parseDate('2025-08-17')}>
            <DatePickerHeader>
              <Heading slot="title">Select date</Heading>
              <DatePickerHeadline>Selected date</DatePickerHeadline>
              <DatePickerModeToggle aria-label="Switch to text input mode" />
            </DatePickerHeader>
            <DatePickerContent>
              <DatePickerCalendar />
              <DatePickerInput label="Date" />
            </DatePickerContent>
          </DatePicker>
        </div>
      </div>
    </PhoneTop>
  )
}
