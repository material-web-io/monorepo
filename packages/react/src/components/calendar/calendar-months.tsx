import { isSameMonth, startOfMonth } from '@internationalized/date'
import { useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties } from 'react'
import { useObjectRef } from 'react-aria'
import { type RefProps } from '../../lib/aria'
import { twMerge } from '../../lib/tv'
import { CalendarCell } from './calendar-cell'
import { useCalendarState } from './calendar-controls'
import { CalendarGrid } from './calendar-grid'
import { CalendarGridBody } from './calendar-grid-body'
import { CalendarHeading } from './calendar-heading'

// The props of the column: a `<div>`'s `className` and `style`, and its `ref`.
export type CalendarMonthsProps = Pick<ComponentProps<'div'>, 'className' | 'style'> &
  RefProps<HTMLDivElement>

// The months of the calendar's visible range, each under its CalendarHeading, in a column that
// scrolls, as Compose's range picker's: scrolled to the focused one as they mount, the focus
// scrolling itself afterwards; those far from its view keep their room, undrawn.
/**
 * Modal date pickers navigate across date ranges in several ways:
 *
 * - To navigate across months, scroll vertically
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 */
export function CalendarMonths({ className, style, ref }: CalendarMonthsProps) {
  const state = useCalendarState()
  // As many as React Aria's visible range holds, its duration in months or in years, of which a
  // calendar's may have thirteen: up to its end's, as a month added to the calendar's last stays.
  const { start, end } = state.visibleRange
  let count = 1
  for (let month = startOfMonth(start); !isSameMonth(month, end); month = month.add({ months: 1 }))
    count++
  const scrollerRef = useObjectRef(ref)
  const focusedMonth = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState({ first: 0, last: -1 })
  useLayoutEffect(() => {
    const el = scrollerRef.current!
    const month = focusedMonth.current
    if (month) el.scrollTop = month.offsetTop
    const update = () => {
      const { first, last } = nearMonths(el)
      setNear((near) => (near.first === first && near.last === last ? near : { first, last }))
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    // Again as the column's height changes, as a dialog grows into the layer.
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [scrollerRef])
  return (
    <div ref={scrollerRef} className={twMerge('calendar-months', className)} style={style}>
      {Array.from({ length: count }, (_, i) => {
        const month = start.add({ months: i })
        const isFocused = isSameMonth(month, state.focusedDate)
        return isFocused || (i >= near.first && i <= near.last) ? (
          <Month key={i} offset={i} ref={isFocused ? focusedMonth : undefined} />
        ) : (
          <MonthPlaceholder key={i} weeks={state.getWeeksInMonth(month)} />
        )
      })}
    </div>
  )
}

/* The first and last of a column's months within half its height of its view, as Compose's
 * LazyColumn lays out those near. React Aria draws each month drawn again as its range state
 * changes, as each day is pointed at; the others keep their room. */
function nearMonths(column: HTMLElement) {
  const months = [...column.children] as HTMLElement[]
  const top = column.scrollTop - column.clientHeight / 2
  const bottom = column.scrollTop + column.clientHeight * 1.5
  return {
    first: months.findIndex((month) => month.offsetTop + month.offsetHeight >= top),
    last: months.findLastIndex((month) => month.offsetTop <= bottom),
  }
}

// A month under its name, `offset` months past the calendar's first.
function Month({ offset, ref }: { offset: number } & RefProps<HTMLDivElement>) {
  return (
    <div ref={ref} className="calendar-month">
      <CalendarHeading offset={{ months: offset }} format={{ month: 'long', year: 'numeric' }} />
      <CalendarGrid offset={{ months: offset }}>
        <CalendarGridBody>{(date) => <CalendarCell date={date} />}</CalendarGridBody>
      </CalendarGrid>
    </div>
  )
}

// The room of a month not drawn, as tall as its `weeks`.
function MonthPlaceholder({ weeks }: { weeks: number }) {
  return (
    <div
      className="calendar-month-placeholder"
      style={{ '--calendar-weeks': weeks } as CSSProperties}
    />
  )
}
