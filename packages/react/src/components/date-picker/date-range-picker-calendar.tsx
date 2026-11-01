import { isSameDay } from '@internationalized/date'
import { useContext, useEffect, useLayoutEffect, useRef } from 'react'
import { RangeCalendarStateContext } from 'react-aria-components'
import { CalendarHeaderCell, CalendarMonths, CalendarWeekdays, RangeCalendar } from '../calendar'
import { AnchorContext, DateRangeContext, PickerContext, VisibleRangeContext } from './context'
import { Pane } from './helpers'

// A DateRangePicker's months, as Compose's range picker draws them: the RangeCalendar's day of
// week labels over its months in a column that scrolls, in the pane the inputs swap with, taking
// the picker's props and range. Swapped in with a start, typed alone too, drawn anew on it.
export function DateRangePickerCalendar() {
  const { displayMode, header } = useContext(PickerContext)!
  const { calendar, autoFocus, state } = useContext(DateRangeContext)!
  const { start, end } = state.value
  const months = useRef<HTMLDivElement>(null)
  // Scrolled by as much as the header grows or shrinks, as the headline takes a line more or
  // less with an end picked, so that the days stay where they are under the pointer.
  useLayoutEffect(() => {
    const el = header.current
    if (!el) return
    let height: number | undefined
    const observer = new ResizeObserver(([entry]) => {
      const next = entry!.borderBoxSize[0]!.blockSize
      if (height !== undefined && months.current) months.current.scrollTop += next - height
      height = next
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [header])
  return (
    <Pane of="picker" fill anew={!!start}>
      <RangeCalendar
        {...calendar}
        defaultFocusedValue={start ?? calendar.defaultFocusedValue}
        autoFocus={autoFocus && displayMode === 'picker'}
        value={start && end ? { start, end } : null}
        onChange={state.setDateRange}
      >
        <Anchor />
        <VisibleRange />
        <CalendarWeekdays>
          {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
        </CalendarWeekdays>
        <CalendarMonths ref={months} />
      </RangeCalendar>
    </Pane>
  )
}

// Sets the anchor to the RangeCalendar's, the day picked first, as it is picked, and to null as
// the second ends the range or React Aria lets it go.
function Anchor() {
  const { anchorDate } = useContext(RangeCalendarStateContext)!
  const [, setAnchor] = useContext(AnchorContext)
  useEffect(() => setAnchor(anchorDate), [setAnchor, anchorDate])
  return null
}

// Sets the visible range to the RangeCalendar's as its months mount and as React Aria moves
// them, the focus taken past either end; before paint, so that the inputs are never drawn
// without their bounds. By day: React Aria's end is new with each `visibleDuration` object.
function VisibleRange() {
  const { start, end } = useContext(RangeCalendarStateContext)!.visibleRange
  const [, setVisibleRange] = useContext(VisibleRangeContext)
  useLayoutEffect(
    () =>
      setVisibleRange((range) =>
        range && isSameDay(range.start, start) && isSameDay(range.end, end)
          ? range
          : { start, end },
      ),
    [setVisibleRange, start, end],
  )
  return null
}
