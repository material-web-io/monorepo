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
  TimePickerModeToggle,
  TimePickerPeriodSelector,
  type TimePickerDisplayMode,
  type TimePickerRenderProps,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type TimeValue } from 'react-aria-components'

const parts = ({ displayMode, selection }: TimePickerRenderProps) => (
  <>
    <TimePickerHeader>
      <Heading slot="title">{displayMode === 'picker' ? 'Select time' : 'Enter time'}</Heading>
    </TimePickerHeader>
    <TimePickerContent>
      <TimePickerInput hourLabel="Hour" minuteLabel="Minute" />
      <TimePickerPeriodSelector aria-label="Select AM or PM" />
      <TimePickerDial aria-label={selection === 'hour' ? 'Select hour' : 'Select minute'} />
    </TimePickerContent>
  </>
)

export default function Basic() {
  const [time, setTime] = useState<TimeValue | null>(new Time(7, 0))
  const [picked, setPicked] = useState(time)
  const [displayMode, setDisplayMode] = useState<TimePickerDisplayMode>('picker')
  return (
    <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(time)}>
      <Button variant="outlined">
        <Icon name="schedule" />
        {time ? time.toString() : 'Pick a time'}
      </Button>
      <TimePickerDialog
        modeToggle={
          <TimePickerModeToggle
            displayMode={displayMode}
            onPress={() => setDisplayMode(displayMode === 'picker' ? 'input' : 'picker')}
            aria-label={
              displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to touch input mode'
            }
          />
        }
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
        <TimePicker aria-label="Time" value={picked} onChange={setPicked} displayMode={displayMode}>
          {parts}
        </TimePicker>
      </TimePickerDialog>
    </DialogTrigger>
  )
}
