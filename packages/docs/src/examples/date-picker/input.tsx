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

export default function InputFirst() {
  return (
    <DatePicker defaultDisplayMode="input" defaultFocusedValue={parseDate('1990-01-01')}>
      {({ displayMode }) => (
        <>
          <DatePickerHeader>
            <Heading slot="title">Date of birth</Heading>
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
            <DatePickerInput label="Date of birth" />
          </DatePickerContent>
        </>
      )}
    </DatePicker>
  )
}
