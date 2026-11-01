import { parseDate } from '@internationalized/date'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerHeader,
  DatePickerHeadline,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function CalendarOnly() {
  return (
    <DatePicker defaultValue={parseDate('2025-08-17')}>
      <DatePickerHeader>
        <Heading slot="title">Select date</Heading>
        <DatePickerHeadline>Selected date</DatePickerHeadline>
      </DatePickerHeader>
      <DatePickerContent>
        <DatePickerCalendar />
      </DatePickerContent>
    </DatePicker>
  )
}
