import { useContext, useState, type ComponentProps } from 'react'
import { TimeFieldStateContext } from 'react-aria-components'
import { tv, twMerge } from '../../lib/tv'
import { PickerContext } from './context'

// The parts laid out as the spec's vertical dial or its horizontal one, which a horizontal picker
// keeps in input mode, the selector's row and column sized by the stylesheet; cut, a new layout or
// clock taken at once, as Compose's parts take one, with no swap's time to move in.
const content = tv({
  base: 'time-picker-content',
  variants: {
    layout: {
      vertical: 'time-picker-content-vertical',
      horizontal: 'time-picker-content-horizontal',
    },
    mode: { picker: '', input: '' },
    cut: { true: 'time-picker-content-cut', false: '' },
  },
  compoundVariants: [
    { layout: 'horizontal', mode: 'picker', class: 'time-picker-content-horizontal-under' },
    { layout: 'horizontal', mode: 'input', class: 'time-picker-content-horizontal-input' },
  ],
})

// The `className`, `style` and children of its `<div>`.
export type TimePickerContentProps = Pick<ComponentProps<'div'>, 'className' | 'style' | 'children'>

// The room under a picker's header holding the parts written in it, laid out for the picker's
// layout and shrinking to the input as the dial folds away. Only a swap of the modes moves the
// parts over time: a change of the layout or of the clock, 12 or 24 hours, cuts to it.
/**
 * Hours and minutes should have separate inputs. For people using a 12-hour
 * clock, an AM/PM selector appears to the right of minutes. For people using a
 * 24-hour clock, the AM/PM selector shouldn’t appear.
 *
 * @see https://m3.material.io/components/time-pickers/guidelines
 */
export function TimePickerContent({ className, ...props }: TimePickerContentProps) {
  const { layout, displayMode } = useContext(PickerContext)!
  const state = useContext(TimeFieldStateContext)!
  const is24Hour = !state.segments.some((part) => part.type === 'dayPeriod')
  // What was last drawn, and whether its last change kept the mode.
  const [drawn, setDrawn] = useState({ displayMode, layout, is24Hour, cut: false })
  if (drawn.displayMode !== displayMode || drawn.layout !== layout || drawn.is24Hour !== is24Hour) {
    setDrawn({ displayMode, layout, is24Hour, cut: drawn.displayMode === displayMode })
  }
  return (
    <div
      {...props}
      className={twMerge(content({ layout, mode: displayMode, cut: drawn.cut }), className)}
    />
  )
}
