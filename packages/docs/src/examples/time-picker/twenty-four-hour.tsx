import { Time } from '@internationalized/date'
import {
  TimePicker,
  TimePickerContent,
  TimePickerDial,
  TimePickerHeader,
  TimePickerInput,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function TwentyFourHour() {
  return (
    <TimePicker aria-label="Time" hourCycle={24} defaultValue={new Time(20, 0)}>
      {({ selection }) => (
        <>
          <TimePickerHeader>
            <Heading slot="title">Select time</Heading>
          </TimePickerHeader>
          <TimePickerContent>
            <TimePickerInput />
            <TimePickerDial aria-label={selection === 'hour' ? 'Select hour' : 'Select minute'} />
          </TimePickerContent>
        </>
      )}
    </TimePicker>
  )
}
