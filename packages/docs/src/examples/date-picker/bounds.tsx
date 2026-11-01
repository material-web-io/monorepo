import { isWeekend, parseDate } from '@internationalized/date'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
} from '@material-web/react'
import { Heading, useLocale } from 'react-aria-components'

export default function Bounds() {
  const { locale } = useLocale()
  return (
    <DatePicker
      defaultValue={parseDate('2025-08-18')}
      minValue={parseDate('2025-08-11')}
      maxValue={parseDate('2025-10-31')}
      isDateUnavailable={(date) => isWeekend(date, locale)}
    >
      {({ displayMode }) => (
        <>
          <DatePickerHeader>
            <Heading slot="title">Select a weekday</Heading>
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
