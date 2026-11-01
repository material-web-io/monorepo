import { Time } from '@internationalized/date'
import {
  Button,
  DialogTrigger,
  Icon,
  TimePicker,
  TimePickerContent,
  TimePickerDial,
  TimePickerDialog,
  TimePickerHeader,
  TimePickerInput,
  TimePickerPeriodSelector,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type TimeValue } from 'react-aria-components'

export default function Empty() {
  const [time, setTime] = useState<TimeValue | null>(null)
  const [picked, setPicked] = useState(time)
  return (
    <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(time)}>
      <Button variant="outlined">
        <Icon name="schedule" />
        {time ? time.toString() : 'Pick a time'}
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
        <TimePicker
          aria-label="Time"
          value={picked}
          onChange={setPicked}
          placeholderValue={new Time(12, 0)}
        >
          {({ selection }) => (
            <>
              <TimePickerHeader>
                <Heading slot="title">Select time</Heading>
              </TimePickerHeader>
              <TimePickerContent>
                <TimePickerInput />
                <TimePickerPeriodSelector aria-label="Select AM or PM" />
                <TimePickerDial
                  aria-label={selection === 'hour' ? 'Select hour' : 'Select minute'}
                />
              </TimePickerContent>
            </>
          )}
        </TimePicker>
      </TimePickerDialog>
    </DialogTrigger>
  )
}
