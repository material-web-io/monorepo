import { maxDate, minDate, toCalendarDate, type CalendarDate } from '@internationalized/date'
import { useContext, useState } from 'react'
import { type DateValue } from 'react-aria-components'
import { DateField, type DateFieldProps } from '../date-field'
import { DateRangeContext, PickerContext, VisibleRangeContext } from './context'
import { isAllowed, Pane, type Bounds } from './helpers'

// The `label`s of the start and end inputs' fields, the caller's text.
export type DateRangePickerInputProps = {
  startLabel?: DateFieldProps<DateValue>['label']
  endLabel?: DateFieldProps<DateValue>['label']
}

type Part = 'start' | 'end'

/** The day before the first one after `anchor` that is unavailable, if one is by `until`: where
 * React Aria's RangeCalendar stops a range from the anchor that may not hold one. */
function lastAvailable(
  anchor: CalendarDate,
  until: DateValue,
  isUnavailable: (date: DateValue) => boolean,
) {
  for (let day = anchor.add({ days: 1 }); day.compare(until) <= 0;) {
    if (isUnavailable(day)) return day.subtract({ days: 1 })
    const next = day.add({ days: 1 })
    // The calendar's last day, which a day added to stays at, is the last looked at.
    if (next.compare(day) <= 0) break
    day = next
  }
}

// A DateRangePicker's start and end inputs, two DateFields in the pane the months swap with,
// bounded as the months are and within the months they hold. Drawn anew each time they are
// swapped in, holding the range's ends or nothing, as Compose's are.
export function DateRangePickerInput(props: DateRangePickerInputProps) {
  return (
    <Pane of="input">
      <Fields {...props} />
    </Pane>
  )
}

// The inputs' fields, which show a date typed that cannot be an end, drawn invalid, until the pane
// draws them anew.
function Fields({ startLabel, endLabel }: DateRangePickerInputProps) {
  const { displayMode } = useContext(PickerContext)!
  const { calendar, autoFocus, state } = useContext(DateRangeContext)!
  const [visibleRange] = useContext(VisibleRangeContext)
  // A date typed that cannot be an end, which its field shows while that end is as the edit left
  // it, empty: an end given in its place replaces it.
  const [typed, setTyped] = useState<Record<Part, DateValue | null>>({ start: null, end: null })
  if ((typed.start && state.value.start) || (typed.end && state.value.end)) {
    setTyped({
      start: state.value.start ? null : typed.start,
      end: state.value.end ? null : typed.end,
    })
  }
  const {
    minValue,
    maxValue,
    isDateUnavailable,
    allowsNonContiguousRanges,
    isDisabled,
    isReadOnly,
    isInvalid,
  } = calendar
  // The start is checked as the day the months pick first: out of bounds outside the months they
  // hold, which could not show it, and unavailable as a day with no anchor yet.
  const startBounds: Bounds = {
    minValue: maxDate(minValue, visibleRange?.start),
    maxValue: minDate(maxValue, visibleRange?.end),
    isDateUnavailable: isDateUnavailable && ((date) => isDateUnavailable(date, null)),
  }
  // The end `end` as the day picked after a start that can be one, the anchor: unavailable as a
  // day with that anchor and, unless the range may hold one, past the first unavailable day on the
  // way to it, however far it is, as the inputs may be drawn with no months.
  const endBounds = (start: DateValue | null, end: DateValue | null): Bounds => {
    if (!isDateUnavailable || !start || !isAllowed(start, startBounds)) return startBounds
    const anchor = toCalendarDate(start)
    const isUnavailable = (date: DateValue) => isDateUnavailable(date, anchor)
    const until = minDate(startBounds.maxValue, end)
    return {
      ...startBounds,
      maxValue:
        allowsNonContiguousRanges || !until
          ? startBounds.maxValue
          : minDate(startBounds.maxValue, lastAvailable(anchor, until, isUnavailable)),
      isDateUnavailable: isUnavailable,
    }
  }
  const shown = { start: state.value.start ?? typed.start, end: state.value.end ?? typed.end }
  const bounds = { start: startBounds, end: endBounds(shown.start, shown.end) }
  // A date typed in `edited`: each field's date is its end if the months could pick it, as in
  // Compose's input, and the one just typed yields if the two are out of order.
  const enter = (edited: Part, value: DateValue | null) => {
    const dates = { ...shown, [edited]: value }
    const boundsOf = { start: startBounds, end: endBounds(dates.start, dates.end) }
    const fits = (part: Part) => !!dates[part] && isAllowed(dates[part], boundsOf[part])
    const isReversed =
      fits('start') &&
      fits('end') &&
      toCalendarDate(dates.start!).compare(toCalendarDate(dates.end!)) > 0
    const isEnd = (part: Part) => fits(part) && !(isReversed && part === edited)
    setTyped({ start: isEnd('start') ? null : dates.start, end: isEnd('end') ? null : dates.end })
    // React Aria's state takes an end at a time: the one typed, then the other if it changes too,
    // as a date held back for its order does once it is in order.
    for (const part of [edited, edited === 'start' ? 'end' : 'start'] as const) {
      const date = isEnd(part) ? dates[part] : null
      if (date !== state.value[part]) state.setDateTime(part, date)
    }
  }
  const field = (part: Part) =>
    ({
      ...bounds[part],
      description: null,
      granularity: 'day',
      validationBehavior: 'aria',
      isDisabled,
      isReadOnly,
      // A date typed within the bounds that is no end is on the wrong side of the other: invalid,
      // with no text, as React Aria's for it is its DateRangePicker's own.
      isInvalid: (!!typed[part] && isAllowed(typed[part], bounds[part])) || isInvalid,
      value: shown[part],
      onChange: (value: DateValue | null) => enter(part, value),
      className: 'date-range-picker-input-field',
    }) as const
  return (
    <div className="date-range-picker-input-fields">
      <DateField
        {...field('start')}
        label={startLabel}
        autoFocus={autoFocus && displayMode === 'input'}
      />
      <DateField {...field('end')} label={endLabel} />
    </div>
  )
}
