import { parseDate } from '@internationalized/date'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
  type DatePickerRenderProps,
} from '@material-web/react'
import { Heading } from 'react-aria-components'

const parts =
  (title: string) =>
  ({ displayMode }: DatePickerRenderProps) => (
    <>
      <DatePickerHeader>
        <Heading slot="title">{title}</Heading>
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

export default function FormProps() {
  const date = parseDate('2025-08-17')
  return (
    <>
      <DatePicker defaultValue={date} isDisabled>
        {parts('Disabled')}
      </DatePicker>
      <DatePicker defaultValue={date} isReadOnly>
        {parts('Read-only')}
      </DatePicker>
    </>
  )
}
