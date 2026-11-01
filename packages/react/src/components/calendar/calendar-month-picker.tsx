import { useContext, type ComponentProps } from 'react'
import {
  CalendarMonthPicker as AriaCalendarMonthPicker,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  type CalendarMonthPickerProps as AriaCalendarMonthPickerProps,
} from 'react-aria-components'
import { type Except } from '../../lib/aria'
import { Icon } from '../icon'
import { Ripple } from '../ripple'
import { ControlsContext } from './calendar-controls'
import { chosen, PickerRoom } from './calendar-picker-room'

/* Scrolls a list to its chosen row as the row mounts, the row in the middle, as the spec's month
 * menu shows August. */
function centerChosen(row: HTMLElement | null) {
  if (row?.getAttribute('aria-selected') !== 'true') return
  const list = row.parentElement
  if (!list) return
  list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2
}

// The props of React Aria's CalendarMonthPicker, but its children, which are drawn here, and the
// `className` and `style` of the room it opens in. `format` is `long` unless given, as the spec's.
export type CalendarMonthPickerProps = Except<AriaCalendarMonthPickerProps, 'children'> &
  Pick<ComponentProps<'div'>, 'className' | 'style'>

// React Aria's CalendarMonthPicker, the docked picker's month menu, opened over the days by the
// month menu button: a ListBox of 48dp rows, the chosen one filled with surface-variant, checked
// and scrolled to the middle. Pressing a month, the one shown too, shows it and closes the menu.
/**
 * Month selection can be navigated with the corresponding back and next
 * arrows or by tapping the dropdown menu.
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 * @see https://m3.material.io/components/date-pickers/specs
 */
export function CalendarMonthPicker({
  format = 'long',
  className,
  style,
}: CalendarMonthPickerProps) {
  const controls = useContext(ControlsContext)
  return (
    <PickerRoom kind="month" className={className} style={style}>
      <AriaCalendarMonthPicker format={format}>
        {(aria) => (
          <AriaListBox
            aria-label={aria['aria-label']}
            className="calendar-month-picker"
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
                ref={centerChosen}
                textValue={item.formatted}
                onPress={controls?.close}
                className="calendar-month-option"
              >
                <Ripple />
                <Icon name="check" />
                {item.formatted}
              </AriaListBoxItem>
            )}
          </AriaListBox>
        )}
      </AriaCalendarMonthPicker>
    </PickerRoom>
  )
}
