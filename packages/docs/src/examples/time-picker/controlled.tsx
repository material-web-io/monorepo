import { Time } from '@internationalized/date'
import {
  TimePicker,
  TimePickerContent,
  TimePickerDial,
  TimePickerHeader,
  TimePickerInput,
  type TimePickerSelection,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type TimeValue } from 'react-aria-components'

export default function Controlled() {
  const [time, setTime] = useState<TimeValue | null>(new Time(20, 0))
  const [selection, setSelection] = useState<TimePickerSelection>('hour')
  return (
    <div className="flex flex-col gap-space-200">
      <TimePicker
        aria-label="Time"
        hourCycle={24}
        value={time}
        onChange={setTime}
        selection={selection}
        onSelectionChange={setSelection}
      >
        <TimePickerHeader>
          <Heading slot="title">Select time</Heading>
        </TimePickerHeader>
        <TimePickerContent>
          <TimePickerInput />
          <TimePickerDial aria-label={selection === 'hour' ? 'Select hour' : 'Select minute'} />
        </TimePickerContent>
      </TimePicker>
      <span className="px-space-300 text-body-md text-on-surface-variant">
        {time ? time.toString() : 'null'}, {selection}
      </span>
    </div>
  )
}
