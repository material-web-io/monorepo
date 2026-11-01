import { parseDate } from '@internationalized/date'
import {
  Button,
  DateField,
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerDialog,
  DatePickerHeader,
  DatePickerHeadline,
  DialogTrigger,
  Icon,
  IconButton,
} from '@material-web/react'
import { useState } from 'react'
import { Heading, type DateValue } from 'react-aria-components'

export default function WithDatePicker() {
  const [date, setDate] = useState<DateValue | null>(parseDate('2025-08-17'))
  const [picked, setPicked] = useState(date)
  return (
    <DateField
      label="Date"
      value={date}
      onChange={setDate}
      className="w-80"
      trailing={
        <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(date)}>
          <IconButton aria-label="Calendar">
            <Icon name="calendar_today" />
          </IconButton>
          <DatePickerDialog
            dismissButton={
              <Button variant="text" slot="close">
                Cancel
              </Button>
            }
            confirmButton={
              <Button
                variant="text"
                slot="close"
                isDisabled={!picked}
                onPress={() => setDate(picked)}
              >
                OK
              </Button>
            }
          >
            <DatePicker value={picked} onChange={setPicked} autoFocus>
              <DatePickerHeader>
                <Heading slot="title">Select date</Heading>
                <DatePickerHeadline>Selected date</DatePickerHeadline>
              </DatePickerHeader>
              <DatePickerContent>
                <DatePickerCalendar />
              </DatePickerContent>
            </DatePicker>
          </DatePickerDialog>
        </DialogTrigger>
      }
    />
  )
}
