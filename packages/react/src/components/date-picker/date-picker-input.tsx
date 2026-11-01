import { useContext, useState } from 'react'
import { type DateValue } from 'react-aria-components'
import { DateField, type DateFieldProps } from '../date-field'
import { DateContext, PickerContext } from './context'
import { isAllowed, Pane, type Bounds } from './helpers'

// The `label` of the input's field, the caller's text.
export type DatePickerInputProps = Pick<DateFieldProps<DateValue>, 'label'>

// A DatePicker's date input, a DateField with no supporting text, as Compose's, in the pane the
// calendar swaps with, bounded and in the states the calendar is. Drawn anew each time it is
// swapped in, holding the value or nothing, as Compose's is.
export function DatePickerInput({ label }: DatePickerInputProps) {
  return (
    <Pane of="input">
      <Field label={label} />
    </Pane>
  )
}

// The input's field, which shows a date typed that cannot be the value, drawn invalid, until the
// pane draws it anew.
function Field({ label }: DatePickerInputProps) {
  const { displayMode } = useContext(PickerContext)!
  const { calendar, autoFocus, date, setDate } = useContext(DateContext)!
  const { minValue, maxValue, isDateUnavailable, isDisabled, isReadOnly, isInvalid } = calendar
  const bounds: Bounds = { minValue, maxValue, isDateUnavailable }
  // A date typed that cannot be the value, which the field shows while the value is as the edit
  // left it, empty: a date given in its place replaces it.
  const [typed, setTyped] = useState<DateValue | null>(null)
  if (typed && date) setTyped(null)
  const enter = (value: DateValue | null) => {
    const allowed = !!value && isAllowed(value, bounds)
    setTyped(allowed ? null : value)
    setDate(allowed ? value : null)
  }
  return (
    <DateField
      {...bounds}
      label={label}
      description={null}
      granularity="day"
      validationBehavior="aria"
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isInvalid={isInvalid}
      autoFocus={autoFocus && displayMode === 'input'}
      value={date ?? typed}
      onChange={enter}
      className="date-picker-input-field"
    />
  )
}
