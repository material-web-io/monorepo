import { useContext, useEffect, type ReactNode } from 'react'
import { useCalendarHeading, useObjectRef } from 'react-aria'
import { composeTailwindRenderProps, type Except } from '../../lib/aria'
import { Button as AriaButton, type ButtonProps } from '../../lib/button'
import { Icon } from '../icon'
import { Ripple } from '../ripple'
import { ControlsContext, useCalendarState, type CalendarPickerKind } from './calendar-controls'

export type { CalendarPickerKind } from './calendar-controls'

// The props of a menu button: our Button's, which it is, but its `slot` and its children, which
// are its label: the month and year shown unless given. `picker` is the one it opens.
export type CalendarMenuButtonProps = Except<ButtonProps, 'slot' | 'children'> & {
  picker?: CalendarPickerKind
  children?: ReactNode
}

// The M3 design kit's menu button: its label and an 18dp arrow that turns while its picker is
// open, the years unless `picker="month"`; disabled with the calendar. Shift+M (months) or Shift+Y
// (years) focuses it, or the one there is, and the focus comes back to it as its picker closes.
/**
 * Month selection can be navigated with the corresponding back and next
 * arrows or by tapping the dropdown menu.
 *
 * To access the year picker, tap the year
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 */
export function CalendarMenuButton({
  picker = 'year',
  isDisabled,
  onPress,
  className,
  children,
  ref,
  ...props
}: CalendarMenuButtonProps) {
  const state = useCalendarState()
  const controls = useContext(ControlsContext)
  const heading = useCalendarHeading({}, state)
  const own = useObjectRef(ref)
  const openPicker = controls?.picker
  const isOpen = openPicker === picker
  const { register, takeClosed, buttonFor } = controls ?? {}

  // Registered as its picker's button, which Shift+M and Shift+Y look for.
  useEffect(() => {
    if (own.current) return register?.(picker, own.current)
  }, [register, picker, own])

  // The focus back on it once its picker has closed, after React Aria's list has let go of the
  // focus, which it takes back as its row is chosen.
  useEffect(() => {
    if (openPicker !== null || !takeClosed?.(picker)) return
    const id = setTimeout(() => own.current?.focus())
    return () => clearTimeout(id)
  }, [openPicker, takeClosed, picker, own])

  // Shift+M and Shift+Y from anywhere in the calendar.
  useEffect(() => {
    const root = own.current?.closest<HTMLElement>('[role="application"]')
    if (!root) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
      // The letter typed, lower case with Caps Lock on, or, on a layout whose key has no Latin
      // letter, the one in its place on a US keyboard: Shift+M on a Russian keyboard types Ь.
      const letter = (
        /^[A-Z]$/i.test(event.key) ? event.key : event.code.replace(/^Key/, '')
      ).toUpperCase()
      const wanted = letter === 'M' ? 'month' : letter === 'Y' ? 'year' : null
      if (!wanted || (buttonFor?.(wanted) ?? own.current) !== own.current) return
      event.preventDefault()
      own.current?.focus()
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
  }, [buttonFor, own])

  return (
    <AriaButton
      {...props}
      ref={own}
      slot={null}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      isDisabled={isDisabled ?? state.isDisabled}
      onPress={(event) => {
        controls?.setPicker(isOpen ? null : picker)
        onPress?.(event)
      }}
      className={composeTailwindRenderProps(className, 'calendar-menu-button')}
    >
      <Ripple />
      {children ?? heading}
      <Icon name="arrow_drop_down" className={isOpen ? 'calendar-menu-icon-open' : undefined} />
    </AriaButton>
  )
}
