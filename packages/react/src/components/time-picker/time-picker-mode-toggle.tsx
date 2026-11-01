import { type Except } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Icon } from '../icon'
import { IconButton, type IconButtonProps } from '../icon-button'
import type { TimePickerDisplayMode } from './helpers'

// An icon of the toggle, the one of the mode shown, or faded out.
const icon = tv({
  base: '',
  variants: { shown: { true: '', false: 'time-picker-mode-toggle-icon-away' } },
})

// The props of the IconButton it is, not a toggle, the name and the press the caller's, with the
// display mode it swaps from, which picks its icon.
export type TimePickerModeToggleProps = Except<
  Extract<IconButtonProps, { isSelectable?: false }>,
  'children' | 'isSelectable'
> & {
  displayMode: TimePickerDisplayMode
}

// The button that swaps the dial and the time input, as Compose's TimePickerDialogDefaults draws
// it: an IconButton showing the filled keyboard over the dial and the filled clock over the input,
// faded through as the toggle video's; the caller wires it to the display mode, their state, in
// the dialog's actions.
/**
 * Icon buttons are used to switch between the input selector, represented by
 * a keyboard, and the dial selector, represented by a clock.
 *
 * Tapping the keyboard icon on a mobile time picker switches the view to the
 * input picker.
 *
 * @see https://m3.material.io/components/time-pickers/guidelines
 */
export function TimePickerModeToggle({ displayMode, ...props }: TimePickerModeToggleProps) {
  return (
    <IconButton {...props}>
      <span className="time-picker-mode-toggle-icons">
        <Icon
          name="keyboard"
          className={icon({ shown: displayMode === 'picker', className: 'icon-filled' })}
        />
        <Icon
          name="schedule"
          className={icon({ shown: displayMode === 'input', className: 'icon-filled' })}
        />
      </span>
    </IconButton>
  )
}
