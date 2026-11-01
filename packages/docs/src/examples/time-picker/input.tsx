import { Time } from '@internationalized/date'
import {
  Button,
  DialogTrigger,
  Icon,
  TimePicker,
  TimePickerContent,
  TimePickerDialog,
  TimePickerHeader,
  TimePickerInput,
  TimePickerPeriodSelector,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type TimeValue } from 'react-aria-components'

export default function InputOnly() {
  const [time, setTime] = useState<TimeValue | null>(new Time(7, 0))
  const [picked, setPicked] = useState(time)
  return (
    <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(time)}>
      <Button variant="outlined">
        <Icon name="schedule" />
        {time ? time.toString() : 'Enter a time'}
      </Button>
      <TimePickerDialog
        dismissButton={
          <Button variant="text" slot="close">
            Cancel
          </Button>
        }
        confirmButton={
          <Button variant="text" slot="close" isDisabled={!picked} onPress={() => setTime(picked)}>
            OK
          </Button>
        }
      >
        <TimePicker aria-label="Time" value={picked} onChange={setPicked} displayMode="input">
          <TimePickerHeader>
            <Heading slot="title">Enter time</Heading>
          </TimePickerHeader>
          <TimePickerContent>
            <TimePickerInput hourLabel="Hour" minuteLabel="Minute" />
            <TimePickerPeriodSelector aria-label="Select AM or PM" />
          </TimePickerContent>
        </TimePicker>
      </TimePickerDialog>
    </DialogTrigger>
  )
}
