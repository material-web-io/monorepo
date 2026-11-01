import { Time } from '@internationalized/date'
import {
  TimePicker,
  TimePickerContent,
  TimePickerDial,
  TimePickerHeader,
  TimePickerInput,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

/**
 * The top of a time picker: its title, the time selected, and the dial under them. On the
 * 24-hour clock: a 12-hour time is spaced one way where the page is built and another in a
 * browser, which would not match.
 */
export default function TimePickerThumbnail() {
  return (
    <div className="flex size-full items-start justify-center-safe px-space-150 pt-space-250">
      <div className="docs-thumbnail-panel rounded-shape-xl bg-surface-container-high">
        <TimePicker aria-label="Time" hourCycle={24} defaultValue={new Time(19, 30)}>
          <TimePickerHeader>
            <Heading slot="title">Select time</Heading>
          </TimePickerHeader>
          <TimePickerContent>
            <TimePickerInput hourLabel="Hour" minuteLabel="Minute" />
            <TimePickerDial aria-label="Select hour" />
          </TimePickerContent>
        </TimePicker>
      </div>
    </div>
  )
}
