import { useContext } from 'react'
import { useDateFormatter } from 'react-aria'
import {
  RadioButton as AriaRadioButton,
  RadioField as AriaRadioField,
  RadioGroup as AriaRadioGroup,
  TimeFieldStateContext,
  type RadioGroupProps as AriaRadioGroupProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Ripple } from '../ripple'
import { PickerContext } from './context'

/* The day period, React Aria's RadioGroup of AM and PM, each a RadioField whose RadioButton is the
 * half of the box pressed, which sets the field's day period segment, hidden in the time input.
 * Fixed classes: time-picker.css. */

// The box: AM over PM after the time, as tall as the boxes in either mode, or side by side under
// the time on a horizontal dial, from where it moves to after the minute as the input swaps in.
const group = tv({
  base: 'time-picker-period',
  variants: {
    layout: {
      vertical: 'time-picker-period-vertical',
      horizontal: 'time-picker-period-horizontal',
    },
    mode: { picker: '', input: '' },
  },
  compoundVariants: [
    { layout: 'vertical', mode: 'picker', class: 'time-picker-period-vertical-picker' },
    { layout: 'vertical', mode: 'input', class: 'time-picker-period-vertical-input' },
    { layout: 'horizontal', mode: 'picker', class: 'time-picker-period-horizontal-picker' },
    { layout: 'horizontal', mode: 'input', class: 'time-picker-period-horizontal-input' },
  ],
})

// The props of React Aria's RadioGroup, which it is, but its value and options, the field's, and
// the children: its name, by `aria-label` or `aria-labelledby`, `className` and `style`.
export type TimePickerPeriodSelectorProps = Except<
  AriaRadioGroupProps,
  | 'children'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'isDisabled'
  | 'isReadOnly'
  | 'orientation'
  | 'isRequired'
  | 'isInvalid'
  | 'validate'
  | 'validationBehavior'
  | 'name'
  | 'form'
>

/** The day period of the hour 0 and of the hour 12 as the locale writes them, AM and PM. */
function usePeriodNames() {
  const formatter = useDateFormatter({ hour: 'numeric', hour12: true })
  const periodOf = (hour: number) =>
    formatter.formatToParts(new Date(2000, 0, 1, hour)).find((part) => part.type === 'dayPeriod')
      ?.value ?? ''
  return [periodOf(0), periodOf(12)]
}

// A TimePicker's period selector: React Aria's RadioGroup of AM and PM, the locale's names of them,
// which sets the field's day period, the hour going forward or back twelve; the selected one
// filled. Drawn only while the field has a day period: none on a 24-hour clock.
/**
 * For people using a 12-hour clock, an AM/PM selector appears to the right of
 * minutes. For people using a 24-hour clock, the AM/PM selector shouldn’t
 * appear.
 *
 * AM/PM selection: AM or PM, Radio button (in list)
 *
 * @see https://m3.material.io/components/time-pickers/guidelines
 * @see https://m3.material.io/components/time-pickers/accessibility
 */
export function TimePickerPeriodSelector({ className, ...props }: TimePickerPeriodSelectorProps) {
  const { displayMode, layout, placeholderValue } = useContext(PickerContext)!
  const state = useContext(TimeFieldStateContext)!
  const [am, pm] = usePeriodNames()
  const period = state.segments.find((part) => part.type === 'dayPeriod')
  if (!period) return null
  // The segment's period, 0 or 1, or the placeholder's while it is unset.
  const value = period.value ?? (placeholderValue.hour >= 12 ? 1 : 0)
  const horizontal = layout === 'horizontal' && displayMode === 'picker'
  return (
    <AriaRadioGroup
      {...props}
      value={value === 1 ? 'pm' : 'am'}
      onChange={(next) => state.setSegment('dayPeriod', next === 'pm' ? 1 : 0)}
      isDisabled={state.isDisabled}
      isReadOnly={state.isReadOnly}
      orientation={horizontal ? 'horizontal' : 'vertical'}
      className={composeTailwindRenderProps(className, group({ layout, mode: displayMode }))}
    >
      <AriaRadioField value="am" className="time-picker-period-option">
        <AriaRadioButton className="time-picker-period-option-button">
          <Ripple />
          {am}
        </AriaRadioButton>
      </AriaRadioField>
      <AriaRadioField value="pm" className="time-picker-period-option">
        <AriaRadioButton className="time-picker-period-option-button">
          <Ripple />
          {pm}
        </AriaRadioButton>
      </AriaRadioField>
    </AriaRadioGroup>
  )
}
