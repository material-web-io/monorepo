import { useState } from 'react'
import {
  composeRenderProps,
  CheckboxButton as AriaCheckboxButton,
  CheckboxField as AriaCheckboxField,
  type CheckboxButtonProps as AriaCheckboxButtonProps,
  type CheckboxButtonRenderProps,
  type CheckboxFieldProps as AriaCheckboxFieldProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Ripple } from '../ripple'

/* React Aria's CheckboxField, a <div>; its CheckboxButton, the <label> that is pressed, the named
 * group its parts style from (group-selected/md-checkbox:); in that the state layer host around the
 * container and its icon. Their classes are fixed, in checkbox.css. */

/* Each mark is a unit rect turned and stretched from its own start, so a shape is one
 * translate/rotate/scale set that transitions between the check and the dash. From unselected
 * the shape snaps and, for a check, the marks are drawn (checkbox-mark-draw). */
const mark = tv({
  base: 'checkbox-mark',
  variants: {
    morph: {
      true: 'transition-transform duration-short-2 ease-standard',
      false: 'transition-none',
    },
    draw: { true: 'checkbox-mark-draw', false: '' },
  },
})

type Arm = { translate: string; rotate: string; scale: string }

// In the 18-unit viewBox: the check runs (3.6, 9) - (7.2, 12.6) - (14.4, 5.4)
// and the dash 4 - 14 at y 9, both 2 thick; the arms overlap 0.4 at the joint.
const shapes: Record<'selected' | 'indeterminate', [Arm, Arm]> = {
  selected: [
    { translate: '3.6px 9px', rotate: '45deg', scale: '5.49 1' },
    { translate: '6.917px 12.883px', rotate: '-45deg', scale: '10.58 1' },
  ],
  indeterminate: [
    { translate: '4px 9px', rotate: '0deg', scale: '5.4 1' },
    { translate: '8.6px 9px', rotate: '0deg', scale: '5.4 1' },
  ],
}

// The three states of the spec: `true` selected, `false` unselected, or `'indeterminate'`.
type Selected = boolean | 'indeterminate'

// The marks of a state; an unselected checkbox keeps those of the state before it.
const shapeOf = (selected: Selected) =>
  selected === 'indeterminate' ? shapes.indeterminate : shapes.selected

// The state layer host, with the ripple and the container and its icon. A component of its own,
// since the state before the current one is kept across renders, which the render prop below
// cannot do.
function CheckboxControl({
  isSelected,
  isIndeterminate,
  isInvalid,
  isHovered,
  isFocusVisible,
  isDisabled,
}: CheckboxRenderProps) {
  const selected: Selected = isIndeterminate ? 'indeterminate' : isSelected

  // The state before this one, kept while this one lasts: it decides whether
  // the marks morph, get drawn, or keep their last shape while fading out.
  const [last, setLast] = useState(selected)
  const [from, setFrom] = useState(selected)
  if (selected !== last) {
    setLast(selected)
    setFrom(last)
  }

  const filled = selected !== false
  const shape = shapeOf(selected === false ? from : selected)
  const morph = filled && from !== false
  const draw = selected === true && from === false

  return (
    <span className="checkbox-state-layer-host">
      {/* It takes the states of the label it is in, which it cannot see, as props. */}
      <Ripple
        variant={isInvalid ? 'error' : filled ? 'on-surface' : 'primary'}
        isHovered={isHovered}
        isFocusVisible={isFocusVisible}
        isDisabled={isDisabled}
      />
      <span aria-hidden className="checkbox-container">
        <svg viewBox="0 0 18 18" className="checkbox-icon">
          {shape.map((arm, i) => (
            <rect
              key={i}
              y={-1}
              width={1}
              height={2}
              className={mark({ morph, draw })}
              style={arm}
            />
          ))}
        </svg>
      </span>
    </span>
  )
}

// What a checkbox passes its children, given as a function: the state React Aria reports
// of its CheckboxButton, the label that is pressed.
export type CheckboxRenderProps = CheckboxButtonRenderProps

// The props of React Aria's CheckboxField, which `Checkbox` is built on, with the `ref` of the
// `<div>` it renders (`isSelected`, `defaultSelected`, `onChange(isSelected)`, `isIndeterminate`,
// `isInvalid`, `isDisabled`, `isReadOnly`, `isRequired`, `name`, `value`, `inputRef`), and the
// `children` of its CheckboxButton: the label text, which names it, or `aria-label` with none.
export type CheckboxProps = Except<AriaCheckboxFieldProps, 'children'> &
  Pick<AriaCheckboxButtonProps, 'children'> &
  RefProps<HTMLDivElement>

// `className`, `style` and the ref go on the outermost element, the CheckboxField; its
// CheckboxButton, the label, holds the hidden input, the container and the label text.
/**
 * Checkboxes let users select one or more items from a list, or turn an item
 * on or off
 *
 * Use checkboxes to:
 *
 * - Select one or more options from a list
 * - Present a list containing sub-selections
 * - Turn an item on or off in a desktop environment
 * - Visually group similar options together
 *
 * Checkboxes should be used instead of switches if multiple, related options
 * can be selected from a list. Checkboxes visually group similar items
 * effectively and take up less space than switches.
 *
 * Users should be able to select either the text label or the checkbox to
 * select an option.
 *
 * If the UI text is correctly linked to the checkbox, assistive tech (such as
 * a screen reader) will read the UI text followed by the component’s role.
 *
 * The accessibility label for an individual checkbox is typically the same as
 * its adjacent text label.
 *
 * Don't apply density to checkboxes by default — this lowers their targets
 * below our best practice of 48x48 CSS pixels.
 *
 * @see https://m3.material.io/components/checkbox/overview
 * @see https://m3.material.io/components/checkbox/guidelines
 * @see https://m3.material.io/components/checkbox/accessibility
 */
export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <AriaCheckboxField
      {...props}
      className={composeTailwindRenderProps(className, 'inline-flex align-middle')}
    >
      <AriaCheckboxButton className="group/md-checkbox checkbox-button">
        {composeRenderProps(children, (label, state) => (
          <>
            <CheckboxControl {...state} />
            {label}
          </>
        ))}
      </AriaCheckboxButton>
    </AriaCheckboxField>
  )
}
