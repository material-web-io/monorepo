import { parseDate } from '@internationalized/date'
import {
  Button,
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
} from '@material-web/react'
import { Heading } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/* A date picker in input mode in a dialog's container, with the dialog's actions, drawn in place
 * of the open dialog: the picture of the slots named, the dialog's or the header's. */
function PickerDialog({ slots, showLegend }: { slots: string[]; showLegend?: boolean }) {
  return (
    <SlotPicture slots={slots} showLegend={showLegend}>
      <SlotCanvas>
        <div className="docs-thumbnail-panel w-90 max-w-full rounded-shape-xl bg-surface-container-high text-body-lg">
          <DatePicker defaultDisplayMode="input" defaultValue={parseDate('2025-08-17')}>
            <DatePickerHeader>
              <Heading slot="title" level={3}>
                Select date
              </Heading>
              <DatePickerHeadline>Entered date</DatePickerHeadline>
              <DatePickerModeToggle aria-label="Switch to calendar mode" />
            </DatePickerHeader>
            <DatePickerContent>
              <DatePickerCalendar />
              <DatePickerInput label="Date" />
            </DatePickerContent>
          </DatePicker>
          <div className="flex justify-end gap-space-100 ps-space-150 pe-space-125 pt-space-50 pb-space-150">
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

/** The slot of a date picker's dialog: the buttons that close it. */
export function DatePickerDialogSlots({ showLegend }: { showLegend?: boolean }) {
  return <PickerDialog slots={['close']} showLegend={showLegend} />
}

/** The slot of a date picker's header: its title. */
export function DatePickerHeaderSlots({ showLegend }: { showLegend?: boolean }) {
  return <PickerDialog slots={['title']} showLegend={showLegend} />
}
