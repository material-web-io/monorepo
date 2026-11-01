import {
  composeRenderProps,
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  type SwitchButtonProps as AriaSwitchButtonProps,
  type SwitchButtonRenderProps,
  type SwitchFieldProps as AriaSwitchFieldProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { Ripple } from '../ripple'

/* React Aria's SwitchField, a <div>; its SwitchButton, the <label> that is pressed, the named
 * group its parts style from (group-selected/md-switch:); in that the switch, its track and the
 * state layer host with the handle and its icons. Their classes are fixed, in switch.css. */

// Holding an icon in both states, the handle is 24dp unselected as well, and disabled pressed too.
const handle = tv({
  base: 'switch-handle',
  variants: {
    icon: {
      true: 'size-6 group-disabled/md-switch:size-6',
      false: 'size-4 group-disabled/md-switch:size-4',
    },
  },
  defaultVariants: { icon: false },
})

// Material Symbols' check and close, in their 24-unit viewBox.
const paths = {
  selected: 'M9.55 18.2 3.65 12.3 5.275 10.675 9.55 14.95 18.725 5.775 20.35 7.4Z',
  unselected:
    'M6.4 19.2 4.8 17.6 10.4 12 4.8 6.4 6.4 4.8 12 10.4 17.6 4.8 19.2 6.4 13.6 12 19.2 17.6 17.6 19.2 12 13.6Z',
}

// The switch itself: the track, and the state layer host with the ripple and the handle.
function SwitchControl({
  icons = 'none',
  isHovered,
  isFocusVisible,
  isDisabled,
}: SwitchRenderProps & SwitchBaseProps) {
  return (
    <span className="switch-host">
      <span aria-hidden className="switch-track" />
      <span aria-hidden className="switch-state-layer-host">
        {/* It takes no pointer, so the switch's states reach its layer as props. */}
        <Ripple isHovered={isHovered} isFocusVisible={isFocusVisible} isDisabled={isDisabled} />
        <span className={handle({ icon: icons === 'both' })}>
          {icons !== 'none' && (
            <svg viewBox="0 0 24 24" className="switch-selected-icon">
              <path d={paths.selected} />
            </svg>
          )}
          {icons === 'both' && (
            <svg viewBox="0 0 24 24" className="switch-unselected-icon">
              <path d={paths.unselected} />
            </svg>
          )}
        </span>
      </span>
    </span>
  )
}

// What a switch passes its children, given as a function: the state React Aria reports of
// its SwitchButton, the label that is pressed.
export type SwitchRenderProps = SwitchButtonRenderProps

// The prop `Switch` adds to those of React Aria's SwitchField. Its comment quotes the M3
// switch pages, which it lists under @see; it adds no wording of our own.
type SwitchBaseProps = {
  // `'selected'` draws a check in the selected handle; `'both'` also draws an X
  // in the unselected one, which is then 24dp instead of 16dp.
  /**
   * The switch handle can contain an optional icon.
   *
   * Icons can be used to visually emphasize the switch’s selection. The icon’s
   * meaning should be clear and unambiguous to help the people understand
   * whether switch is on or off.
   *
   * - Without icons
   * - Icon on selected switch
   * - Icon on selected and unselected switch
   *
   * @default 'none'
   * @see https://m3.material.io/components/switch/guidelines
   * @see https://m3.material.io/components/switch/specs
   */
  icons?: 'none' | 'selected' | 'both'
}

// The props of React Aria's SwitchField, which `Switch` is built on, with the `ref` of the `<div>`
// it renders (`isSelected`, `defaultSelected`, `onChange(isSelected)`, `isDisabled`, `inputRef`),
// and the `children` of its SwitchButton: the label text, which names it, or `aria-label`.
export type SwitchProps = Except<AriaSwitchFieldProps, 'children'> &
  Pick<AriaSwitchButtonProps, 'children'> &
  RefProps<HTMLDivElement> &
  SwitchBaseProps

// `className`, `style` and the ref go on the outermost element, the SwitchField; its
// SwitchButton, the label, holds the hidden input, the switch and the label text.
// Dragging the handle, a touch gesture in the spec, is not supported.
/**
 * Switches toggle the selection of an item on and off
 *
 * Switches are best used to adjust settings and other standalone options.
 *
 * The effects of a switch should start immediately, without needing to save.
 *
 * Use switches to:
 *
 * - Toggle a single item on or off
 * - Immediately activate or deactivate something
 *
 * Use switches (not radio buttons) if the items in a list can be independently
 * controlled
 *
 * Switches control binary options, not opposing ones. A binary option
 * represents a single selection that's either on or off.
 *
 * Switches should always be paired with an inline label describing what the
 * switch controls when selected.
 *
 * Keep labels short and direct. A label should describe what the control does
 * when the switch is on.
 *
 * A switch is successfully toggled when the handle slides to the other side of
 * the track after an interaction.
 *
 * The switch handle increases in size to indicate interactivity for both touch
 * and cursor control interactions.
 *
 * The switch is toggled using Space or Enter
 *
 * The accessibility label for a switch uses the adjacent label text if
 * implemented correctly.
 *
 * Assistive tech such as a screen reader will read the UI text followed by the
 * component’s role.
 *
 * Don't apply density to switches by default — this lowers their targets below
 * our best practice of 48x48 CSS pixels.
 *
 * @see https://m3.material.io/components/switch/overview
 * @see https://m3.material.io/components/switch/guidelines
 * @see https://m3.material.io/components/switch/accessibility
 */
export function Switch({ icons, className, children, onKeyDown, ...props }: SwitchProps) {
  return (
    <AriaSwitchField
      {...props}
      // Heard on the hidden input, which Enter clicks: React Aria's own toggles on Space alone,
      // and Enter would submit the form. Let through to the page, as a key unheard is.
      onKeyDown={(event) => {
        event.continuePropagation()
        onKeyDown?.(event)
        if (event.key !== 'Enter' || event.repeat || event.isDefaultPrevented()) return
        event.preventDefault()
        event.currentTarget.click()
      }}
      className={composeTailwindRenderProps(className, 'inline-flex align-middle')}
    >
      <AriaSwitchButton className="group/md-switch switch-button">
        {composeRenderProps(children, (label, state) => (
          <>
            <SwitchControl {...state} icons={icons} />
            {label}
          </>
        ))}
      </AriaSwitchButton>
    </AriaSwitchField>
  )
}
