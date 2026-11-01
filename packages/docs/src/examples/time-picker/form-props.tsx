import { Time } from '@internationalized/date'
import {
  TimePicker,
  TimePickerContent,
  TimePickerDial,
  TimePickerHeader,
  TimePickerInput,
  type TimePickerRenderProps,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

const parts =
  (title: string) =>
  ({ selection }: TimePickerRenderProps) => (
    <>
      <TimePickerHeader>
        <Heading slot="title">{title}</Heading>
      </TimePickerHeader>
      <TimePickerContent>
        <TimePickerInput />
        <TimePickerDial aria-label={selection === 'hour' ? 'Select hour' : 'Select minute'} />
      </TimePickerContent>
    </>
  )

export default function FormProps() {
  const time = new Time(20, 0)
  return (
    <>
      <TimePicker aria-label="Disabled time" hourCycle={24} defaultValue={time} isDisabled>
        {parts('Disabled')}
      </TimePicker>
      <TimePicker aria-label="Read-only time" hourCycle={24} defaultValue={time} isReadOnly>
        {parts('Read-only')}
      </TimePicker>
    </>
  )
}
