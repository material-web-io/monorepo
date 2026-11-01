import { parseDate } from '@internationalized/date'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
  type DatePickerDisplayMode,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type DateValue } from 'react-aria-components'

export default function Controlled() {
  const [value, setValue] = useState<DateValue | null>(parseDate('2025-08-17'))
  const [displayMode, setDisplayMode] = useState<DatePickerDisplayMode>('picker')
  return (
    <div className="flex flex-col gap-space-200">
      <DatePicker
        value={value}
        onChange={setValue}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
      >
        <DatePickerHeader>
          <Heading slot="title">Select date</Heading>
          <DatePickerHeadline>No date</DatePickerHeadline>
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
      </DatePicker>
      <span className="px-space-300 text-body-md text-on-surface-variant">
        {value ? value.toString() : 'null'}, {displayMode}
      </span>
    </div>
  )
}
