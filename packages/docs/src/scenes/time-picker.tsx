import { Time } from '@internationalized/date'
import {
  TimePicker,
  TimePickerContent,
  TimePickerDial,
  TimePickerHeader,
  TimePickerInput,
} from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

/**
 * A time picker as it is open, which it only is over a page: its title, the time selected,
 * and the dial under them, over the scrim. On the 24-hour clock: a 12-hour time is spaced one way where the page is
 * built and another in a browser, which would not match.
 */
export default function TimePickerScene() {
  return (
    <PhoneTop>
      <div className="absolute inset-0 bg-scrim/32" />
      <div className="relative flex shrink-0 justify-center-safe pt-space-100">
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
    </PhoneTop>
  )
}
