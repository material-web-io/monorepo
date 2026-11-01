import {
  RadioGroup as AriaRadioGroup,
  type RadioGroupProps as AriaRadioGroupProps,
} from 'react-aria-components'
import type { RefProps } from '../../lib/aria'

// The props of React Aria's RadioGroup, which `RadioGroup` is built on, with the `ref` of the
// `<div>` it renders: `value`, `defaultValue`, `onChange(value)`, `name`, `isDisabled`,
// `isReadOnly`, `isRequired`, `isInvalid` and `orientation`; `children` is its render prop too.
// Named by `aria-label`, or by a `Label` in it, and described by a `Text slot="description"`.
export type RadioGroupProps = AriaRadioGroupProps & RefProps<HTMLDivElement>

// React Aria's RadioGroup as it is, in which each `Radio` is one of its options. It lays nothing
// out, so give it the layout of its radio buttons, such as a column.
/**
 * Only one radio button can be selected at a time.
 *
 * Radio buttons are single-select, unlike checkboxes which are multi-select
 *
 * The accessibility label for a group of radio buttons is typically the same
 * as its title. The role is Radio group.
 *
 * Tab: Navigate to a radio group or the radio button selected within it.
 *
 * @see https://m3.material.io/components/radio-button/overview
 * @see https://m3.material.io/components/radio-button/accessibility
 */
export function RadioGroup(props: RadioGroupProps) {
  return <AriaRadioGroup {...props} />
}
