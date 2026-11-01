import { Time } from '@internationalized/date'
import {
  Button,
  TimePicker,
  TimePickerContent,
  TimePickerHeader,
  TimePickerInput,
} from '@material-web/react'
import { Heading } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/* A time picker in input mode in a dialog's container, with the dialog's actions, drawn in place
 * of the open dialog: the picture of the slots named, the dialog's or the header's. */
function PickerDialog({ slots, showLegend }: { slots: string[]; showLegend?: boolean }) {
  return (
    <SlotPicture slots={slots} showLegend={showLegend}>
      <SlotCanvas>
        <div className="docs-thumbnail-panel rounded-shape-xl bg-surface-container-high text-body-lg">
          {/* In 24 hours, as the time between the hour and a period is written with a space
              that differs between the server's and the browser's locale data. */}
          <TimePicker
            aria-label="Time"
            hourCycle={24}
            defaultValue={new Time(19, 30)}
            displayMode="input"
          >
            <TimePickerHeader>
              <Heading slot="title" level={3}>
                Enter time
              </Heading>
            </TimePickerHeader>
            <TimePickerContent>
              <TimePickerInput hourLabel="Hour" minuteLabel="Minute" />
            </TimePickerContent>
          </TimePicker>
          <div className="flex min-h-12 items-center justify-end gap-space-100 px-space-300 pb-space-300">
            <Button variant="text" slot="close">
              Cancel
            </Button>
            <Button variant="text" slot="close">
              OK
            </Button>
          </div>
        </div>
      </SlotCanvas>
    </SlotPicture>
  )
}

/** The slot of a time picker's dialog: the buttons that close it. */
export function TimePickerDialogSlots({ showLegend }: { showLegend?: boolean }) {
  return <PickerDialog slots={['close']} showLegend={showLegend} />
}

/** The slot of a time picker's header: its title. */
export function TimePickerHeaderSlots({ showLegend }: { showLegend?: boolean }) {
  return <PickerDialog slots={['title']} showLegend={showLegend} />
}
