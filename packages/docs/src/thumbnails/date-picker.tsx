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

/** The top of a date picker: its title, the date selected, and the month under them. */
export default function DatePickerThumbnail() {
  return (
    <div className="flex size-full items-start justify-center-safe px-space-150 pt-space-250">
      <div className="docs-thumbnail-panel w-90 rounded-shape-xl bg-surface-container-high">
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
  )
}
