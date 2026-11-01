import {
  CheckboxGroup as AriaCheckboxGroup,
  type CheckboxGroupProps as AriaCheckboxGroupProps,
  type CheckboxGroupRenderProps as AriaCheckboxGroupRenderProps,
} from 'react-aria-components'
import type { RefProps } from '../../lib/aria'

// What a checkbox group passes its className, style and children, given as functions: the state
// React Aria reports of it.
export type CheckboxGroupRenderProps = AriaCheckboxGroupRenderProps

// The props of React Aria's CheckboxGroup, which `CheckboxGroup` is built on, with the `ref` of the
// `<div>` it renders: `value`, `defaultValue` and `onChange(value)`, the `value`s of the selected
// checkboxes, `name`, `isDisabled`, `isReadOnly`, `isRequired` and `isInvalid`; `children` is its
// render prop too. Named by `aria-label`, or by a `Label` in it, and described by a
// `Text slot="description"`.
export type CheckboxGroupProps = AriaCheckboxGroupProps & RefProps<HTMLDivElement>

// React Aria's CheckboxGroup as it is, in which each `Checkbox` is one of its options, selected by
// its `value`. It lays nothing out, so give it the layout of its checkboxes, such as a column.
/**
 * Multiple checkboxes in a list can be selected.
 *
 * Checkboxes can be selected or unselected regardless of the state of the
 * other checkboxes in a group.
 *
 * Use checkboxes to select multiple related options in a list.
 *
 * @see https://m3.material.io/components/checkbox/guidelines
 * @see https://m3.material.io/components/checkbox/accessibility
 */
export function CheckboxGroup(props: CheckboxGroupProps) {
  return <AriaCheckboxGroup {...props} />
}
