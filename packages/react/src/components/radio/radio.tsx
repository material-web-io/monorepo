import {
  composeRenderProps,
  RadioButton as AriaRadioButton,
  RadioField as AriaRadioField,
  type RadioButtonProps as AriaRadioButtonProps,
  type RadioButtonRenderProps,
  type RadioFieldProps as AriaRadioFieldProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { Ripple } from '../ripple'

/* React Aria's RadioField, a <div>; its RadioButton, the <label> that is pressed, the named group
 * its parts style from (group-selected/md-radio:); in that the state layer host around the outer
 * circle and the inner one in it. Their classes are fixed, in radio.css. */

// The state layer host, with the ripple and the two circles.
function RadioControl({ isSelected, isHovered, isFocusVisible, isDisabled }: RadioRenderProps) {
  return (
    <span className="radio-state-layer-host">
      {/* It takes the states of the label it is in, which it cannot see, as props. */}
      <Ripple
        variant={isSelected ? 'on-surface' : 'primary'}
        isHovered={isHovered}
        isFocusVisible={isFocusVisible}
        isDisabled={isDisabled}
      />
      <span aria-hidden className="radio-outer-circle">
        <span className="radio-inner-circle" />
      </span>
    </span>
  )
}

// What a radio button passes its children, given as a function: the state React Aria reports
// of its RadioButton, the label that is pressed.
export type RadioRenderProps = RadioButtonRenderProps

// The props of React Aria's RadioField, which `Radio` is built on, with the `ref` of the `<div>`
// it renders (`value`, which its `RadioGroup` selects it by, `isDisabled`, `inputRef`), and the
// `children` of its RadioButton: the label text, which names it, or `aria-label` with none.
export type RadioProps = Except<AriaRadioFieldProps, 'children'> &
  Pick<AriaRadioButtonProps, 'children'> &
  RefProps<HTMLDivElement>

// `className`, `style` and the ref go on the outermost element, the RadioField; its
// RadioButton, the label, holds the hidden input, the circles and the label text. Like React
// Aria's, it is one option of a `RadioGroup`, whose `value` selects it, and has no use alone.
/**
 * Radio buttons let people select one option from a set of options
 *
 * Radio buttons are the recommended way to allow users to make a single
 * selection from a list of options.
 *
 * Only one radio button can be selected at a time.
 *
 * Use radio buttons to:
 *
 * - Select a single option from a set
 * - Expose all available options
 *
 * Radio buttons are single-select, unlike checkboxes which are multi-select
 *
 * Always pair radio buttons with an adjacent label describing what the radio
 * button selects.
 *
 * Because only one radio button can be selected at a time, each choice must
 * have its own label.
 *
 * A radio button is successfully selected when a person clicks or taps either
 * the radio button icon or the label.
 *
 * If the UI text is correctly linked to the radio button, assistive tech such
 * as a screenreader will read the UI text, followed by the component’s role.
 *
 * The accessibility label for a group of radio buttons is typically the same
 * as its title. The role is Radio group.
 *
 * The accessibility label for an individual radio button is typically the
 * same as its adjacent text label.
 *
 * Don't apply density to radio buttons by default. This lowers their targets
 * below Material's recommendation of 48x48 CSS pixels.
 *
 * @see https://m3.material.io/components/radio-button/overview
 * @see https://m3.material.io/components/radio-button/guidelines
 * @see https://m3.material.io/components/radio-button/accessibility
 */
export function Radio({ className, children, ...props }: RadioProps) {
  return (
    <AriaRadioField
      {...props}
      className={composeTailwindRenderProps(className, 'inline-flex align-middle')}
    >
      <AriaRadioButton className="group/md-radio radio-button">
        {composeRenderProps(children, (label, state) => (
          <>
            <RadioControl {...state} />
            {label}
          </>
        ))}
      </AriaRadioButton>
    </AriaRadioField>
  )
}
