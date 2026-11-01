import { parseDate } from '@internationalized/date'
import {
  DatePickerContent,
  DatePickerHeader,
  DatePickerModeToggle,
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerHeadline,
  DateRangePickerInput,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function Range() {
  return (
    <div className="flex h-140 flex-col">
      <DateRangePicker defaultFocusedValue={parseDate('2025-08-17')}>
        {({ displayMode }) => (
          <>
            <DatePickerHeader>
              <Heading slot="title">Select dates</Heading>
              <DateRangePickerHeadline>
                {displayMode === 'picker' ? 'Start date – End date' : 'Enter dates'}
              </DateRangePickerHeadline>
              <DatePickerModeToggle
                aria-label={
                  displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to calendar mode'
                }
              />
            </DatePickerHeader>
            <DatePickerContent>
              <DateRangePickerCalendar />
              <DateRangePickerInput startLabel="Start date" endLabel="End date" />
            </DatePickerContent>
          </>
        )}
      </DateRangePicker>
    </div>
  )
}
