import type { ElementType } from 'react'
import { composeRenderProps } from 'react-aria-components'
import { composeTailwindRenderProps } from '../../lib/aria'
import {
  Button as AriaButton,
  ToggleButton as AriaToggleButton,
  type ButtonProps as AriaButtonProps,
  type ToggleButtonProps as AriaToggleButtonProps,
} from '../../lib/button'
import { PendingIndicator } from './pending-indicator'
import { tv, type VariantProps } from '../../lib/tv'
import { Ripple } from '../ripple'

/* The container and disabled styles (button.css) and the M3 props' classes on it, a selected
 * toggle's as selected: (data-selected). Outlined and text drop the disabled fill with their
 * disabled:bg-transparent, which sorts after button-disabled. */
export const buttonStyles = tv({
  base: 'button-container disabled:button-disabled',
  variants: {
    variant: {
      elevated: 'bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2',
      filled: 'bg-primary text-on-primary hover:shadow-elevation-1',
      tonal: 'bg-secondary-container text-on-secondary-container hover:shadow-elevation-1',
      outlined:
        'bg-transparent text-on-surface-variant inset-ring-1 inset-ring-outline-variant disabled:bg-transparent disabled:inset-ring-on-surface/disabled-container',
      // Forced colors give it no border: it has no container.
      text: 'bg-transparent text-primary disabled:bg-transparent forced-colors:border-0',
    },
    // 32, 40, 56, 96 and 136dp: the line of its text style, 20, 20, 24, 32 and 40dp, which its
    // icon is as tall as (icon-*), and 6, 10, 16, 32 and 48dp above and below it.
    size: {
      xs: 'gap-space-50 px-space-150 py-space-75-variable text-label-lg icon-20',
      s: 'gap-space-100 px-space-200 py-space-125-variable text-label-lg icon-20',
      m: 'gap-space-100 px-space-300 py-space-200-variable text-title-md icon-24',
      l: 'gap-space-150 px-space-600 py-space-400-variable text-headline-sm icon-32',
      xl: 'gap-space-200 px-space-800 py-space-600-variable text-headline-lg icon-40',
    },
    shape: {
      round: '',
      square: '',
    },
    shapeMorph: { true: '', false: '' },
    // React Aria's ToggleButton. Selected, it would look unselected in forced-colors mode, so it
    // gets the system highlight fill instead.
    toggle: { true: 'selected:forced-colors:selected-fill', false: '' },
    // The shape a toggle rests in while selected: the other one, unless it keeps its own.
    selectedShape: {
      round: '',
      square: '',
    },
  },
  compoundVariants: [
    // Round, the corner is that of the padding its size gives it: half the height, the line of
    // its label and the padding (py- and rounded-space-<n>-variable), so it morphs smoothly.
    { shape: 'round', size: 'xs', class: 'rounded-space-75-variable' },
    { shape: 'round', size: 's', class: 'rounded-space-125-variable' },
    { shape: 'round', size: 'm', class: 'rounded-space-200-variable' },
    { shape: 'round', size: 'l', class: 'rounded-space-400-variable' },
    { shape: 'round', size: 'xl', class: 'rounded-space-600-variable' },

    { shape: 'square', size: ['xs', 's'], class: 'rounded-shape-md' },
    { shape: 'square', size: 'm', class: 'rounded-shape-lg' },
    { shape: 'square', size: ['l', 'xl'], class: 'rounded-shape-xl' },

    { selectedShape: 'round', size: 'xs', class: 'selected:rounded-space-75-variable' },
    { selectedShape: 'round', size: 's', class: 'selected:rounded-space-125-variable' },
    { selectedShape: 'round', size: 'm', class: 'selected:rounded-space-200-variable' },
    { selectedShape: 'round', size: 'l', class: 'selected:rounded-space-400-variable' },
    { selectedShape: 'round', size: 'xl', class: 'selected:rounded-space-600-variable' },

    { selectedShape: 'square', size: ['xs', 's'], class: 'selected:rounded-shape-md' },
    { selectedShape: 'square', size: 'm', class: 'selected:rounded-shape-lg' },
    { selectedShape: 'square', size: ['l', 'xl'], class: 'selected:rounded-shape-xl' },

    // Selected sorts after pressed, so a toggle's pressed corner names both, the same either way.
    {
      shapeMorph: true,
      size: ['xs', 's'],
      class: 'pressed:rounded-shape-sm selected:pressed:rounded-shape-sm',
    },
    {
      shapeMorph: true,
      size: 'm',
      class: 'pressed:rounded-shape-md selected:pressed:rounded-shape-md',
    },
    {
      shapeMorph: true,
      size: ['l', 'xl'],
      class: 'pressed:rounded-shape-lg selected:pressed:rounded-shape-lg',
    },

    { variant: 'outlined', size: ['l', 'xl'], class: 'inset-ring-2' },

    // A toggle's colors, unselected and selected.
    {
      variant: 'elevated',
      toggle: true,
      class: 'selected:bg-primary selected:text-on-primary selected:disabled:button-disabled',
    },
    {
      variant: 'filled',
      toggle: true,
      class:
        'bg-surface-container text-on-surface-variant selected:bg-primary selected:text-on-primary selected:disabled:button-disabled',
    },
    {
      variant: 'tonal',
      toggle: true,
      class: 'selected:bg-secondary selected:text-on-secondary selected:disabled:button-disabled',
    },
    {
      variant: 'outlined',
      toggle: true,
      class:
        'selected:bg-inverse-surface selected:text-inverse-on-surface selected:inset-ring-0 selected:disabled:button-disabled',
    },
  ],
  defaultVariants: {
    variant: 'filled',
    size: 's',
    shape: 'round',
    shapeMorph: false,
    toggle: false,
  },
})

type Variant = NonNullable<VariantProps<typeof buttonStyles>['variant']>
type Size = NonNullable<VariantProps<typeof buttonStyles>['size']>
type Shape = NonNullable<VariantProps<typeof buttonStyles>['shape']>

// A pending button's loading indicator, 1.5 times its icon, as M3 shows a 48dp one in a large
// button: the shape it draws is then about as large as the icon.
const pendingIndicatorSize: Record<Size, number> = { xs: 30, s: 30, m: 36, l: 48, xl: 60 }

// The props `Button` adds to those of React Aria's Button. The comments on them
// quote the M3 button pages, which each comment lists under @see; they add no
// wording of our own.
type ButtonBaseProps = {
  /**
   * Five color options: elevated, filled, tonal, outlined, and text
   *
   * - `elevated`: The elevated button style is the same as the tonal button, but
   *   with a shadow. To avoid overusing shadows, use the elevated style only when
   *   absolutely necessary, such as when the button requires visual separation
   *   from a visually prominent background.
   * - `filled`: The filled button style has the most visual impact after the FAB,
   *   and should be used for important, final actions that complete a flow, like
   *   Save, Join now, or Confirm.
   * - `tonal`: The tonal button style is useful in contexts where a
   *   lower-priority button requires slightly more emphasis than an outline
   *   would give, such as Next in an onboarding flow.
   * - `outlined`: The outlined style is ideal for medium-emphasis buttons which
   *   contain actions that are important, but aren’t the primary action in a
   *   product.
   * - `text`: The text button style should be used for the lowest priority
   *   actions, especially when presenting multiple options.
   *   There is no toggle text button.
   *
   * @default 'filled'
   * @see https://m3.material.io/components/buttons/overview
   * @see https://m3.material.io/components/buttons/guidelines
   * @see https://m3.material.io/components/buttons/specs
   */
  variant?: Variant

  /**
   * Five size recommendations: extra small, small, medium, large, and extra
   * large
   *
   * @default 's'
   * @see https://m3.material.io/components/buttons/overview
   * @see https://m3.material.io/components/buttons/specs
   */
  size?: Size

  /**
   * Two shape options: round and square
   *
   * - `round`: Buttons with a round shape have containers with fully rounded
   *   corners.
   * - `square`: Buttons with a square shape have containers with more subtle
   *   rounding that changes based on button size.
   *
   * Corner sizes of a square button: XS 12dp, S 12dp, M 16dp, L 28dp,
   * XL 28dp.
   *
   * In addition to changing shape when pressed, toggle buttons also change the
   * resting shape from round (unselected) to square (selected). If the resting
   * unselected shape is square, the selected shape should be round.
   *
   * @default 'round'
   * @see https://m3.material.io/components/buttons/overview
   * @see https://m3.material.io/components/buttons/guidelines
   * @see https://m3.material.io/components/buttons/specs
   */
  shape?: Shape

  /**
   * Shape morphs when pressed
   *
   * When pressed, buttons can morph to become more square. Both round and square
   * buttons should have the same pressed shape. The corner radius value differs
   * for each button size.
   *
   * Corner sizes of the pressed state: XS 8dp, S 8dp, M 12dp, L 16dp,
   * XL 16dp.
   *
   * In addition to changing shape when pressed, toggle buttons also change the
   * resting shape from round (unselected) to square (selected).
   *
   * @default false
   * @see https://m3.material.io/components/buttons/overview
   * @see https://m3.material.io/components/buttons/specs
   */
  hasShapeMorph?: boolean
}

// The default variant, React Aria's Button, which takes none of its ToggleButton's own props: given
// without `isSelectable`, they are a type error, not ignored. `isSelectable` is commented on both
// variants because the editor shows the comment of whichever declaration matches what you typed.
type DefaultVariant = {
  isSelected?: never
  defaultSelected?: never
  onChange?: never

  /**
   * Two variants: default and toggle
   *
   * Toggle buttons should be used for binary selections, such as Save or
   * Favorite. When toggle buttons are pressed, they can change color, shape, and
   * labels.
   *
   * By default, toggle buttons change from round to square when selected.
   *
   * There is no toggle text button.
   *
   * @default false
   * @see https://m3.material.io/components/buttons/overview
   * @see https://m3.material.io/components/buttons/guidelines
   * @see https://m3.material.io/components/buttons/specs
   */
  isSelectable?: false
}

// The toggle variant, React Aria's ToggleButton, given `isSelectable`: `variant` again without
// `text`, since a text button cannot be selected, and commented again for the same reason.
type ToggleVariant = {
  /**
   * Two variants: default and toggle
   *
   * Toggle buttons should be used for binary selections, such as Save or
   * Favorite. When toggle buttons are pressed, they can change color, shape, and
   * labels.
   *
   * By default, toggle buttons change from round to square when selected.
   *
   * There is no toggle text button.
   *
   * @default false
   * @see https://m3.material.io/components/buttons/overview
   * @see https://m3.material.io/components/buttons/guidelines
   * @see https://m3.material.io/components/buttons/specs
   */
  isSelectable: true

  /**
   * Five color options: elevated, filled, tonal, outlined, and text
   *
   * - `elevated`: The elevated button style is the same as the tonal button, but
   *   with a shadow. To avoid overusing shadows, use the elevated style only when
   *   absolutely necessary, such as when the button requires visual separation
   *   from a visually prominent background.
   * - `filled`: The filled button style has the most visual impact after the FAB,
   *   and should be used for important, final actions that complete a flow, like
   *   Save, Join now, or Confirm.
   * - `tonal`: The tonal button style is useful in contexts where a
   *   lower-priority button requires slightly more emphasis than an outline
   *   would give, such as Next in an onboarding flow.
   * - `outlined`: The outlined style is ideal for medium-emphasis buttons which
   *   contain actions that are important, but aren’t the primary action in a
   *   product.
   *
   * Toggle buttons don’t use the text style
   *
   * @default 'filled'
   * @see https://m3.material.io/components/buttons/overview
   * @see https://m3.material.io/components/buttons/guidelines
   * @see https://m3.material.io/components/buttons/specs
   */
  variant?: Exclude<Variant, 'text'>
}

// The props of React Aria's Button, which `Button` is, or of its ToggleButton, which it is given
// `isSelectable`, each from React Aria's hooks on the element given as `elementType` (lib/button),
// with the `ref` of that element, and the M3 props. Its children are drawn as they are given: an
// `Icon` among them is sized to the button and decorative, so the label text alone names it. A
// text button cannot be selected.
export type ButtonProps<T extends ElementType = 'button'> = ButtonBaseProps &
  ((AriaButtonProps<T> & DefaultVariant) | (AriaToggleButtonProps<T> & ToggleVariant))

// The ripple is hidden from assistive technology. A toggle button is exposed
// with `aria-pressed`; keep its label the same in both states, since a label
// that changes together with `aria-pressed` is announced as a contradiction.
/**
 * Buttons communicate actions that people can take.
 *
 * Keyboard navigation:
 * - Tab: Navigate to a button.
 * - Space or Enter: Activate a button.
 *
 * The accessibility label for a button should match the visible label text on
 * the button such as Done, Send, or Reply. It can contain extra contextual
 * information if necessary.
 *
 * @see https://m3.material.io/components/buttons/guidelines
 * @see https://m3.material.io/components/buttons/accessibility
 */
export function Button<T extends ElementType = 'button'>({
  variant,
  size = 's',
  shape = 'round',
  hasShapeMorph,
  isSelectable,
  className,
  children,
  ...props
}: ButtonProps<T>) {
  // A toggle, React Aria's ToggleButton, given isSelectable; the types already keep it off text
  // buttons, this covers untyped callers.
  const toggle = variant !== 'text' && isSelectable
  // React Aria's ToggleButton for a toggle, else its Button: the two take the same props but the
  // toggle's own, and report the same state but isSelected.
  const AriaButtonRoot = (toggle ? AriaToggleButton : AriaButton) as typeof AriaButton
  return (
    <AriaButtonRoot
      {...(props as AriaButtonProps<T>)}
      className={composeTailwindRenderProps(
        className as AriaButtonProps<T>['className'],
        buttonStyles({
          variant,
          size,
          shape,
          // Selected, a toggle rests in the other shape.
          selectedShape: toggle ? (shape === 'round' ? 'square' : 'round') : undefined,
          shapeMorph: hasShapeMorph,
          toggle,
        }),
      )}
    >
      {composeRenderProps(children as AriaButtonProps<T>['children'], (children, { isPending }) => (
        <>
          <Ripple />
          {children}
          {isPending && <PendingIndicator size={pendingIndicatorSize[size]} />}
        </>
      ))}
    </AriaButtonRoot>
  )
}
