import type { ElementType } from 'react'
import { composeRenderProps } from 'react-aria-components'
import { composeTailwindRenderProps } from '../../lib/aria'
import {
  Button as AriaButton,
  ToggleButton as AriaToggleButton,
  type ButtonProps as AriaButtonProps,
  type ToggleButtonProps as AriaToggleButtonProps,
} from '../../lib/button'
import { tv, type VariantProps } from '../../lib/tv'
import { PendingIndicator } from '../button/pending-indicator'
import { Ripple } from '../ripple'

/* The container and disabled colors (icon-button.css) and the M3 props' classes on it, a selected
 * toggle's as selected: (data-selected). Outlined and standard drop the disabled fill with their
 * disabled:bg-transparent, which sorts after icon-button-disabled. */
const iconButtonStyles = tv({
  base: 'icon-button-container disabled:icon-button-disabled',
  variants: {
    variant: {
      filled: 'bg-primary text-on-primary',
      tonal: 'bg-secondary-container text-on-secondary-container',
      outlined:
        'bg-transparent text-on-surface-variant inset-ring-1 inset-ring-outline-variant disabled:bg-transparent disabled:inset-ring-on-surface/disabled-container',
      // Forced colors give it no border: it has no container.
      standard:
        'bg-transparent text-on-surface-variant disabled:bg-transparent forced-colors:border-0',
    },
    // 32, 40, 56, 96 and 136dp: its icon, 20, 24, 24, 32 and 40dp, and 6, 8, 16, 32 and 48dp
    // above and below it. The icon is its one line: the line height the round radius reckons with.
    size: {
      xs: 'py-space-75-variable leading-5 icon-20',
      s: 'py-space-100-variable leading-6 icon-24',
      m: 'py-space-200-variable leading-6 icon-24',
      l: 'py-space-400-variable leading-8 icon-32',
      xl: 'py-space-600-variable leading-10 icon-40',
    },
    width: {
      narrow: '',
      default: '',
      wide: '',
    },
    shape: {
      round: '',
      square: '',
    },
    shapeMorph: { true: '', false: '' },
    // React Aria's ToggleButton. Selected, it would look unselected in forced-colors mode, so it
    // gets the system highlight fill instead.
    toggle: { true: 'selected:forced-colors:selected-fill', false: '' },
    // The shape a toggle rests in while selected: the other one.
    selectedShape: {
      round: '',
      square: '',
    },
  },
  compoundVariants: [
    { size: 'xs', width: 'narrow', class: 'w-7' },
    { size: 'xs', width: 'default', class: 'w-8' },
    { size: 'xs', width: 'wide', class: 'w-10' },
    { size: 's', width: 'narrow', class: 'w-8' },
    { size: 's', width: 'default', class: 'w-10' },
    { size: 's', width: 'wide', class: 'w-13' },
    { size: 'm', width: 'narrow', class: 'w-12' },
    { size: 'm', width: 'default', class: 'w-14' },
    { size: 'm', width: 'wide', class: 'w-18' },
    { size: 'l', width: 'narrow', class: 'w-16' },
    { size: 'l', width: 'default', class: 'w-24' },
    { size: 'l', width: 'wide', class: 'w-32' },
    { size: 'xl', width: 'narrow', class: 'w-26' },
    { size: 'xl', width: 'default', class: 'w-34' },
    { size: 'xl', width: 'wide', class: 'w-46' },

    // Round, the corner is that of the padding its size gives it: half the height.
    { shape: 'round', size: 'xs', class: 'rounded-space-75-variable' },
    { shape: 'round', size: 's', class: 'rounded-space-100-variable' },
    { shape: 'round', size: 'm', class: 'rounded-space-200-variable' },
    { shape: 'round', size: 'l', class: 'rounded-space-400-variable' },
    { shape: 'round', size: 'xl', class: 'rounded-space-600-variable' },

    { shape: 'square', size: ['xs', 's'], class: 'rounded-shape-md' },
    { shape: 'square', size: 'm', class: 'rounded-shape-lg' },
    { shape: 'square', size: ['l', 'xl'], class: 'rounded-shape-xl' },

    { selectedShape: 'round', size: 'xs', class: 'selected:rounded-space-75-variable' },
    { selectedShape: 'round', size: 's', class: 'selected:rounded-space-100-variable' },
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

    // An app bar's or a search bar's leading button is on-surface where the rest are
    // on-surface-variant: a standard one, enabled and unselected, stacked so that its disabled and
    // selected colors still win.
    {
      variant: 'standard',
      class:
        'app-bar-leading:not-disabled:not-selected:text-on-surface search-field-leading:not-disabled:not-selected:text-on-surface',
    },

    // A toggle's colors, unselected and selected. Standard has no container, so only its icon
    // color changes.
    {
      variant: 'filled',
      toggle: true,
      class:
        'bg-surface-container-highest text-primary selected:bg-primary selected:text-on-primary selected:disabled:icon-button-disabled',
    },
    {
      variant: 'tonal',
      toggle: true,
      class:
        'selected:bg-secondary selected:text-on-secondary selected:disabled:icon-button-disabled',
    },
    {
      variant: 'outlined',
      toggle: true,
      class:
        'selected:bg-inverse-surface selected:text-inverse-on-surface selected:inset-ring-0 selected:disabled:icon-button-disabled',
    },
    {
      variant: 'standard',
      toggle: true,
      class: 'selected:text-primary selected:disabled:text-on-surface/disabled-content',
    },
  ],
  defaultVariants: {
    variant: 'standard',
    size: 's',
    width: 'default',
    shape: 'round',
    shapeMorph: false,
    toggle: false,
  },
})

type Variant = NonNullable<VariantProps<typeof iconButtonStyles>['variant']>
type Size = NonNullable<VariantProps<typeof iconButtonStyles>['size']>
type Width = NonNullable<VariantProps<typeof iconButtonStyles>['width']>
type Shape = NonNullable<VariantProps<typeof iconButtonStyles>['shape']>

// A pending button's loading indicator, 1.5 times its icon, as M3 shows a 48dp one in a large
// button: the shape it draws is then about as large as the icon.
const pendingIndicatorSize: Record<Size, number> = { xs: 30, s: 36, m: 36, l: 48, xl: 60 }

// The props `IconButton` adds to those of React Aria's Button. The comments on
// them quote the M3 icon button pages, which each comment lists under @see;
// they add no wording of our own.
type IconButtonBaseProps = {
  /**
   * There are four icon button color styles, in order of emphasis: filled,
   * tonal, outlined, standard
   *
   * For the highest emphasis, use the filled style. For the lowest emphasis,
   * use standard.
   *
   * - `filled`: Use the filled style for visual impact and key actions that
   *   require high emphasis. Avoid overusing the filled style on a screen. Use
   *   them sparingly.
   * - `tonal`: Use the tonal style as a middle ground between filled and
   *   outlined icon buttons. It’s useful for secondary actions paired with a
   *   high emphasis action.
   * - `outlined`: Use the outlined style for medium-emphasis buttons. It’s
   *   useful when the button isn’t the main focus of the interaction, such as
   *   browsing through sets of cards.
   * - `standard`: Use the standard style for low-emphasis buttons, or when
   *   placing buttons on a colorful surface.
   *
   * @default 'standard'
   * @see https://m3.material.io/components/icon-buttons/guidelines
   */
  variant?: Variant

  /**
   * Icon buttons are available in five different sizes:
   *
   * - Extra small - 32dp
   * - Small - 40dp (default)
   * - Medium - 56dp
   * - Large - 96dp
   * - Extra large - 136dp
   *
   * @default 's'
   * @see https://m3.material.io/components/icon-buttons/guidelines
   * @see https://m3.material.io/components/icon-buttons/specs
   */
  size?: Size

  // The height is set by `size`; width only changes the container's own
  // width, which defaults to a square.
  /**
   * Three widths: narrow, default, and wide
   *
   * Container widths in dp:
   *
   * - XS: narrow 28, default 32, wide 40
   * - S: narrow 32, default 40, wide 52
   * - M: narrow 48, default 56, wide 72
   * - L: narrow 64, default 96, wide 128
   * - XL: narrow 104, default 136, wide 184
   *
   * @default 'default'
   * @see https://m3.material.io/components/icon-buttons/specs
   */
  width?: Width

  /**
   * Two shapes: round and square
   *
   * Corner sizes of a square button: XS 12dp, S 12dp, M 16dp, L 28dp, XL 28dp.
   *
   * In addition to changing shape when pressed, toggle icon buttons also
   * change the resting shape from round (unselected) to square (selected) by
   * default. If the resting shape is square, the selected shape should be
   * round.
   *
   * @default 'round'
   * @see https://m3.material.io/components/icon-buttons/specs
   */
  shape?: Shape

  /**
   * Shape morphs when pressed
   *
   * While pressed, icon buttons can morph to become more square. Both round
   * and square icon buttons should have the same pressed shape radius.
   *
   * Corner sizes of the pressed state: XS 8dp, S 8dp, M 12dp, L 16dp, XL 16dp.
   *
   * @default false
   * @see https://m3.material.io/components/icon-buttons/specs
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
   * Toggle icon buttons allow a single choice to be selected or deselected,
   * such as adding or removing something from favorites.
   *
   * The default (left) and toggle (right) icon buttons are available in all
   * four color styles
   *
   * The icon should become filled to represent selection.
   *
   * If a filled version of the icon doesn't exist, use semibold weight instead.
   *
   * @default false
   * @see https://m3.material.io/components/icon-buttons/overview
   * @see https://m3.material.io/components/icon-buttons/guidelines
   */
  isSelectable?: false
}

// The toggle variant, React Aria's ToggleButton, given `isSelectable`; every color style can be one.
type ToggleVariant = {
  /**
   * Two variants: default and toggle
   *
   * Toggle icon buttons allow a single choice to be selected or deselected,
   * such as adding or removing something from favorites.
   *
   * The default (left) and toggle (right) icon buttons are available in all
   * four color styles
   *
   * The icon should become filled to represent selection.
   *
   * If a filled version of the icon doesn't exist, use semibold weight instead.
   *
   * @default false
   * @see https://m3.material.io/components/icon-buttons/overview
   * @see https://m3.material.io/components/icon-buttons/guidelines
   */
  isSelectable: true
}

// An icon button has no visible text, so nothing names it unless the caller does.
type Label = { 'aria-label': string } | { 'aria-labelledby': string }

// The props of React Aria's Button, which `IconButton` is, or of its ToggleButton, which it is
// given `isSelectable`, each from React Aria's hooks on the element given as `elementType`
// (lib/button), with the `ref` of that element, a required name, and the M3 props. Its children
// are drawn as they are given: an `Icon` among them is sized to the button.
export type IconButtonProps<T extends ElementType = 'button'> = IconButtonBaseProps &
  Label &
  ((AriaButtonProps<T> & DefaultVariant) | (AriaToggleButtonProps<T> & ToggleVariant))

// An icon button has no visible label, so the types require `aria-label` or
// `aria-labelledby`. The ripple is hidden from assistive technology, and a
// toggle's `aria-pressed` label must stay the same in both states.
/**
 * Icon buttons help people take actions with a single tap.
 *
 * Keyboard navigation:
 * - Tab: Focus lands on (non-disabled) icon button.
 * - Space or Enter: Activates the (non-disabled) icon button.
 *
 * The accessibility label for icon buttons describes the action the button
 * is executing, such as Add to favorites, Bookmark, or Send message.
 *
 * @see https://m3.material.io/components/icon-buttons/guidelines
 * @see https://m3.material.io/components/icon-buttons/accessibility
 */
export function IconButton<T extends ElementType = 'button'>({
  variant,
  size = 's',
  width,
  shape = 'round',
  hasShapeMorph,
  isSelectable,
  className,
  children,
  ...props
}: IconButtonProps<T>) {
  // React Aria's ToggleButton given isSelectable, else its Button: the two take the same props but
  // the toggle's own, and report the same state but isSelected.
  const AriaButtonRoot = (isSelectable ? AriaToggleButton : AriaButton) as typeof AriaButton
  return (
    <AriaButtonRoot
      {...(props as AriaButtonProps<T>)}
      className={composeTailwindRenderProps(
        className as AriaButtonProps<T>['className'],
        iconButtonStyles({
          variant,
          size,
          width,
          shape,
          // Selected, a toggle rests in the other shape.
          selectedShape: isSelectable ? (shape === 'round' ? 'square' : 'round') : undefined,
          shapeMorph: hasShapeMorph,
          toggle: isSelectable,
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
