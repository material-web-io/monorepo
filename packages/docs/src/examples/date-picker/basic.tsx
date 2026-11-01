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

export default function Basic() {
  return (
    <DatePicker defaultValue={parseDate('2025-08-17')}>
      {({ displayMode }) => (
        <>
          <DatePickerHeader>
            <Heading slot="title">Select date</Heading>
            <DatePickerHeadline>
              {displayMode === 'picker' ? 'Selected date' : 'Entered date'}
            </DatePickerHeadline>
            <DatePickerModeToggle
              aria-label={
                displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to calendar mode'
              }
            />
          </DatePickerHeader>
          <DatePickerContent>
            <DatePickerCalendar />
            <DatePickerInput label="Date" />
          </DatePickerContent>
        </>
      )}
    </DatePicker>
  )
}
