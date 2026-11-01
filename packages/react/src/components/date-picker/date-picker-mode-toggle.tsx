import { useContext } from 'react'
import { composeTailwindRenderProps, type Except } from '../../lib/aria'
import { Icon } from '../icon'
import { IconButton, type IconButtonProps } from '../icon-button'
import { PickerContext } from './context'

// The props of the IconButton it is, not a toggle, the name the caller's, but its icon and press.
export type DatePickerModeToggleProps = Except<
  Extract<IconButtonProps, { isSelectable?: false }>,
  'children' | 'onPress' | 'isSelectable'
>

// The button at the end of a DatePickerHeader's headline that swaps the calendar and the input,
// an IconButton drawn for the other mode, which takes the focus into it. Its name is the caller's,
// which may follow the picker's display mode, as its function children are given it.
/**
 * You can swap between the modal date picker and modal date input using the
 * edit or calendar icon.
 *
 * @see https://m3.material.io/components/date-pickers/guidelines
 */
export function DatePickerModeToggle({ className, ...props }: DatePickerModeToggleProps) {
  const { displayMode, toggle } = useContext(PickerContext)!
  return (
    <IconButton
      {...props}
      onPress={toggle}
      className={composeTailwindRenderProps(className, 'date-picker-mode-toggle')}
    >
      <Icon name={displayMode === 'picker' ? 'edit' : 'date_range'} className="icon-filled" />
    </IconButton>
  )
}
