import { getLocalTimeZone, toCalendarDate } from '@internationalized/date'
import { Fragment, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useDateFormatter } from 'react-aria'
import { type DateValue } from 'react-aria-components'
import { useControlledState } from 'react-stately/useControlledState'
import { tv } from '../../lib/tv'
import { type CalendarProps } from '../calendar'
import { PickerContext } from './context'

/* What DatePicker and DateRangePicker (date-picker.tsx, date-range-picker.tsx) and their parts
 * share: the width, the display mode and its panes, and the dates they can take. Not exported
 * from the package. */

/** The calendar or the date input, as Compose's `DisplayMode` names them. */
export type DatePickerDisplayMode = 'picker' | 'input'

export type DisplayModeProps = {
  // Whether the calendar or the date input shows, as Compose's state's `displayMode`. As React Aria
  // pairs them: `defaultDisplayMode`, `picker` unless given, and `onDisplayModeChange`.
  /**
   * Don’t use a modal date picker to prompt for dates in the distant past or
   * future, such as a date of birth. In these cases, use a modal input picker
   * or a docked date picker instead.
   *
   * Modal date inputs allow the manual entry of dates using the numbers on a
   * keyboard. People can input a date or a range of dates in a dialog.
   *
   * For dates that don’t require a calendar view, the modal date input can be
   * the default view
   *
   * @see https://m3.material.io/components/date-pickers/guidelines
   */
  displayMode?: DatePickerDisplayMode
  defaultDisplayMode?: DatePickerDisplayMode
  onDisplayModeChange?: (displayMode: DatePickerDisplayMode) => void
}

/** What a picker's function children are called with: the display mode, which the text the caller
 * writes in its parts can follow. */
export type DatePickerRenderProps = { displayMode: DatePickerDisplayMode }

// The picker's width, 360dp over the calendar and the input alike.
export const root = 'date-picker w-90'

// The calendar and the input, one in front and one away, above or below.
const pane = tv({
  base: 'date-picker-pane',
  variants: {
    place: {
      in: 'date-picker-pane-in',
      above: 'date-picker-pane-above',
      below: 'date-picker-pane-below',
    },
    // The range picker's months fill their room; the rest sit at the top of theirs.
    fill: { true: 'date-picker-pane-fill', false: 'date-picker-pane-top' },
  },
})

/**
 * Formats a date as the headline writes it, as Compose's does, e.g. `Aug 17, 2025`; and a range
 * as the locale writes one in that format, what they share written once, split before its end:
 * `Aug 17 – ` and `23, 2025`, or the whole and nothing for a day.
 */
export function useHeadlineFormat() {
  const formatter = useDateFormatter({ year: 'numeric', month: 'short', day: 'numeric' })
  const toDate = (date: DateValue) => toCalendarDate(date).toDate(getLocalTimeZone())
  const format = (date: DateValue) => formatter.format(toDate(date))
  const formatRange = (start: DateValue, end: DateValue) => {
    const parts = formatter.formatRangeToParts(toDate(start), toDate(end))
    const at = parts.findIndex((part) => part.source === 'endRange')
    const text = (from: number, to?: number) =>
      parts
        .slice(from, to)
        .map((part) => part.value)
        .join('')
    return at < 0 ? [text(0), ''] : [text(0, at), text(at)]
  }
  return { format, formatRange }
}

export type Bounds = Pick<CalendarProps<DateValue>, 'minValue' | 'maxValue' | 'isDateUnavailable'>

/** Whether a date can be picked: within the bounds, day by day, and not unavailable. */
export function isAllowed(date: DateValue, { minValue, maxValue, isDateUnavailable }: Bounds) {
  const day = toCalendarDate(date)
  if (minValue && day.compare(toCalendarDate(minValue)) < 0) return false
  if (maxValue && day.compare(toCalendarDate(maxValue)) > 0) return false
  return !isDateUnavailable?.(date)
}

/** Focuses the day of a calendar that is in the tab order, or the year or month of a picker open
 * over the days, which are inert meanwhile, or the first segment of a field. */
const focusIn = (el: HTMLElement | null) =>
  [
    ...(el?.querySelectorAll<HTMLElement>(
      '[role="gridcell"] [tabindex="0"], [role="option"][tabindex="0"], [role="spinbutton"]',
    ) ?? []),
  ]
    .find((target) => !target.closest('[inert]'))
    ?.focus()

/* The display mode, as Compose's state holds it, given or kept here, and the toggle that swaps it
 * and moves the focus into the pane swapped in; with the refs PickerContext hands the parts. */
export function useDisplayMode({
  displayMode,
  defaultDisplayMode = 'picker',
  onDisplayModeChange,
}: DisplayModeProps) {
  const [mode, setMode] = useControlledState(displayMode, defaultDisplayMode, onDisplayModeChange)
  const picker = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLDivElement>(null)
  const header = useRef<HTMLDivElement>(null)
  const swapped = useRef(false)
  useEffect(() => {
    if (!swapped.current) return
    swapped.current = false
    focusIn((mode === 'picker' ? picker : input).current)
  }, [mode])
  const toggle = () => {
    swapped.current = true
    setMode(mode === 'picker' ? 'input' : 'picker')
  }
  return { displayMode: mode, toggle, panes: { picker, input }, header }
}

/** Calls a picker's children with its render props when they are a function. */
export const renderChildren = (
  children: ReactNode | ((values: DatePickerRenderProps) => ReactNode),
  values: DatePickerRenderProps,
) => (typeof children === 'function' ? children(values) : children)

/* The pane of the mode `of`, the calendar or the input: in front while the picker's mode is its
 * own, else away and inert, the calendar above and the input below. Swapped in, its parts are
 * drawn anew unless `anew` is false, as Compose composes a mode's content anew. */
export function Pane({
  of,
  fill = false,
  anew = true,
  children,
}: {
  of: DatePickerDisplayMode
  fill?: boolean
  anew?: boolean
  children: ReactNode
}) {
  const { displayMode, panes } = useContext(PickerContext)!
  const isIn = displayMode === of
  // The mode last drawn in, and the times the pane has been swapped in anew, which key its parts.
  const [drawn, setDrawn] = useState({ displayMode, times: 0 })
  if (drawn.displayMode !== displayMode) {
    setDrawn({ displayMode, times: isIn && anew ? drawn.times + 1 : drawn.times })
  }
  const away = of === 'picker' ? 'above' : 'below'
  return (
    <div ref={panes[of]} inert={!isIn} className={pane({ place: isIn ? 'in' : away, fill })}>
      <Fragment key={drawn.times}>{children}</Fragment>
    </div>
  )
}
