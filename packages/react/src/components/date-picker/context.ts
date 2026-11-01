import type { CalendarDate } from '@internationalized/date'
import { createContext, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { DateValue, RangeValue } from 'react-aria-components'
import type { DateRangePickerState } from 'react-stately/useDateRangePickerState'
import type { CalendarProps, RangeCalendarProps } from '../calendar'
import type { DatePickerDisplayMode } from './helpers'

/* What DatePicker and DateRangePicker hand the parts the caller writes in them. Not exported from
 * the package. */

/** A value and its setter, as `useState` returns them. */
type State<T> = [T, Dispatch<SetStateAction<T>>]

/** What a picker of either kind gives its parts. */
export const PickerContext = createContext<{
  // Whether the calendar or the input shows, and the mode toggle's swap of them.
  displayMode: DatePickerDisplayMode
  toggle: () => void
  isRange: boolean
  // The calendar's pane and the input's, which the focus moves into as they swap.
  panes: Record<DatePickerDisplayMode, RefObject<HTMLDivElement | null>>
  // The header, which a range's months keep still under as it grows or shrinks.
  header: RefObject<HTMLDivElement | null>
} | null>(null)

/** DatePickerDialog's container, whose height cap the picker's room lifts while it resizes, so
 * that the dialog follows its overshoot past the layer it fills too. */
export const PickerDialogContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

/** DatePicker's calendar props, and its date and the date's setter. */
export const DateContext = createContext<{
  calendar: CalendarProps<DateValue>
  autoFocus?: boolean
  date: DateValue | null
  setDate: (value: DateValue | null) => void
} | null>(null)

/** DateRangePicker's months' props, and its range, held in React Aria's DateRangePicker state. */
export const DateRangeContext = createContext<{
  calendar: RangeCalendarProps<DateValue> &
    Required<Pick<RangeCalendarProps<DateValue>, 'visibleDuration'>>
  autoFocus?: boolean
  state: DateRangePickerState
} | null>(null)

/** The months the RangeCalendar holds, which bound the inputs too: its months set it, the inputs
 * read it. */
export const VisibleRangeContext = createContext<State<RangeValue<CalendarDate> | null>>([
  null,
  () => {},
])

/** The day picked first in the months, until the second ends the range, as React Aria holds it:
 * its months set it, the headline reads it. */
export const AnchorContext = createContext<State<DateValue | null>>([null, () => {}])
