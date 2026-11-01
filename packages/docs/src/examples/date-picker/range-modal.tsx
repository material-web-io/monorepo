import { parseDate } from '@internationalized/date'
import {
  Button,
  DatePickerContent,
  DatePickerDialog,
  DatePickerHeader,
  DatePickerModeToggle,
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerHeadline,
  DateRangePickerInput,
  DialogTrigger,
  Icon,
  type DatePickerRenderProps,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type DateValue, type RangeValue } from 'react-aria-components'

const parts = ({ displayMode }: DatePickerRenderProps) => (
  <>
    <DatePickerHeader>
      <Heading slot="title">Select dates</Heading>
      <DateRangePickerHeadline>
        {displayMode === 'picker' ? 'Start date – End date' : 'Enter dates'}
      </DateRangePickerHeadline>
      <DatePickerModeToggle
        aria-label={
          displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to calendar mode'
        }
      />
    </DatePickerHeader>
    <DatePickerContent>
      <DateRangePickerCalendar />
      <DateRangePickerInput startLabel="Start date" endLabel="End date" />
    </DatePickerContent>
  </>
)

export default function RangeModal() {
  const [dates, setDates] = useState<RangeValue<DateValue> | null>({
    start: parseDate('2025-08-17'),
    end: parseDate('2025-08-23'),
  })
  const [picked, setPicked] = useState(dates)
  return (
    <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(dates)}>
      <Button variant="outlined">
        <Icon name="date_range" />
        {dates ? `${dates.start.toString()} – ${dates.end.toString()}` : 'Pick the dates'}
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
          <Button variant="text" slot="close" isDisabled={!picked} onPress={() => setDates(picked)}>
            OK
          </Button>
        }
      >
        <DateRangePicker value={picked} onChange={setPicked} autoFocus>
          {parts}
        </DateRangePicker>
      </DatePickerDialog>
    </DialogTrigger>
  )
}
