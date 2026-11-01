import { useContext, type ReactNode } from 'react'
import { AnchorContext, DateRangeContext, PickerContext } from './context'
import { useHeadlineFormat } from './helpers'

// Its children, what it draws while there is neither end.
export type DateRangePickerHeadlineProps = { children?: ReactNode }

// A DateRangePicker's headline: the range as React Aria's locale writes it, `Aug 17 – 23, 2025`,
// split before its end, which wraps onto a line of its own when they don't fit; an end alone, the
// day picked first in the months too while they show, as a date; or the caller's children while
// there is neither.
export function DateRangePickerHeadline({ children }: DateRangePickerHeadlineProps) {
  const { displayMode } = useContext(PickerContext)!
  const [anchor] = useContext(AnchorContext)
  const { state } = useContext(DateRangeContext)!
  const { format, formatRange } = useHeadlineFormat()
  const { start, end } =
    anchor && displayMode === 'picker' ? { start: anchor, end: null } : state.value
  const date = start ?? end
  const [head, tail] = start && end ? formatRange(start, end) : [date && format(date), '']
  return (
    <span className="date-range-picker-headline">
      {date ? (
        <>
          <span>{head}</span>
          <span>{tail}</span>
        </>
      ) : (
        children
      )}
    </span>
  )
}
