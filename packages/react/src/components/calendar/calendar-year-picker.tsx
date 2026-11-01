import { isSameYear, today } from '@internationalized/date'
import { useContext, type ComponentProps } from 'react'
import {
  CalendarYearPicker as AriaCalendarYearPicker,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type CalendarYearPickerProps as AriaCalendarYearPickerProps,
} from 'react-aria-components'
import { type Except } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Ripple } from '../ripple'
import { ControlsContext, useCalendarState } from './calendar-controls'
import { chosen, PickerRoom } from './calendar-picker-room'

/* Scrolls a list to its chosen row as the row mounts, the row before it at the top, as the
 * guideline video and Compose show the years: React Aria renders rows a render after the list, so
 * the row says when it is there. The focus scrolls no further, the row being in view. */
function anchorChosen(row: HTMLElement | null) {
  if (row?.getAttribute('aria-selected') !== 'true') return
  const list = row.parentElement
  if (!list) return
  const { rowGap, paddingTop } = getComputedStyle(list)
  const above = (parseFloat(rowGap) || 0) + (parseFloat(paddingTop) || 0)
  list.scrollTop = row.offsetTop - row.offsetHeight - above
}

// A year: the current one ringed.
const yearOption = tv({
  base: 'calendar-year-option',
  variants: { current: { true: 'calendar-year-current', false: '' } },
})

// The props of React Aria's CalendarYearPicker, but its children, which are drawn here, and the
// `className` and `style` of the room it opens in.
export type CalendarYearPickerProps = Except<AriaCalendarYearPickerProps, 'children'> &
  Pick<ComponentProps<'div'>, 'className' | 'style'>

// React Aria's CalendarYearPicker, the modal picker's years, opened over the days by the year menu
// button: a ListBox grid three to a row, as Compose's, the chosen year filled and this year ringed,
// its row second from the top. Pressing a year, the one shown too, shows it and closes the picker.
/**
 * To navigate across years, tap the year picker and scroll vertically
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 */
export function CalendarYearPicker({
  visibleYears,
  format,
  className,
  style,
}: CalendarYearPickerProps) {
  const state = useCalendarState()
  const controls = useContext(ControlsContext)
  // About a hundred years each side of the focused one, and `extra` more, so that the first starts
  // a row of Compose's 1900–2100 grid and each year is in Compose's column.
  const extra = (((state.focusedDate.year - 2000) % 3) + 3) % 3
  const current = today(state.timeZone)
  return (
    <PickerRoom kind="year" className={className} style={style}>
      <AriaCalendarYearPicker visibleYears={visibleYears ?? 201 + 2 * extra} format={format}>
        {(aria) => (
          <AriaListBox
            aria-label={aria['aria-label']}
            className="calendar-year-picker"
            layout="grid"
            selectionMode="single"
            selectedKeys={[aria.value]}
            disallowEmptySelection
            autoFocus
            items={aria.items}
            onSelectionChange={(keys) => {
              const key = chosen(keys)
              if (key !== undefined) aria.onChange(key)
            }}
          >
            {(item) => (
              <AriaListBoxItem
                id={item.id}
                ref={anchorChosen}
                textValue={item.formatted}
                onPress={controls?.close}
                className={yearOption({ current: isSameYear(item.date, current) })}
              >
                <Ripple />
                {item.formatted}
              </AriaListBoxItem>
            )}
          </AriaListBox>
        )}
      </AriaCalendarYearPicker>
    </PickerRoom>
  )
}
