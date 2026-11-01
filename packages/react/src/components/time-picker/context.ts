import { createContext } from 'react'
import type { TimeValue } from 'react-aria-components'
import type { TimePickerDisplayMode, TimePickerLayout, TimePickerSelection } from './helpers'

/* What TimePicker hands the parts the caller writes in it, beside React Aria's TimeFieldStateContext,
 * which holds the time. Not exported from the package. */

/** What the picker gives its parts. */
export const PickerContext = createContext<{
  // Whether the dial or the time input shows, and which way the dial is laid out.
  displayMode: TimePickerDisplayMode
  layout: TimePickerLayout
  // The part of the time the dial sets, and its setter: a segment focused sets it, as does the
  // dial once an hour is picked.
  selection: TimePickerSelection
  setSelection: (selection: TimePickerSelection) => void
  // The time the dial starts from while the field holds none, React Aria's placeholder.
  placeholderValue: TimeValue
} | null>(null)
