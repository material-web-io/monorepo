import { parseDate } from '@internationalized/date'
import {
  Button,
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerDialog,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
  DialogTrigger,
  Icon,
  type DatePickerRenderProps,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type DateValue } from 'react-aria-components'

const parts = ({ displayMode }: DatePickerRenderProps) => (
  <>
    <DatePickerHeader>
      <Heading slot="title">Select date</Heading>
      <DatePickerHeadline>
        {displayMode === 'picker' ? 'Selected date' : 'Entered date'}
      </DatePickerHeadline>
      <DatePickerModeToggle
        aria-label={
          displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to calendar mode'
        }
      />
    </DatePickerHeader>
    <DatePickerContent>
      <DatePickerCalendar />
      <DatePickerInput label="Date" />
    </DatePickerContent>
  </>
)

export default function Modal() {
  const [date, setDate] = useState<DateValue | null>(parseDate('2025-08-17'))
  const [picked, setPicked] = useState(date)
  return (
    <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(date)}>
      <Button variant="outlined">
        <Icon name="calendar_today" />
        {date ? date.toString() : 'Pick a date'}
      </Button>
      <DatePickerDialog
        clearButton={
          <Button variant="text" onPress={() => setPicked(null)}>
            Clear
          </Button>
        }
        dismissButton={
          <Button variant="text" slot="close">
            Cancel
          </Button>
        }
        confirmButton={
          <Button variant="text" slot="close" isDisabled={!picked} onPress={() => setDate(picked)}>
            OK
          </Button>
        }
      >
        <DatePicker value={picked} onChange={setPicked} autoFocus>
          {parts}
        </DatePicker>
      </DatePickerDialog>
    </DialogTrigger>
  )
}
