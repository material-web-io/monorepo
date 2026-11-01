import {
  ToggleButtonGroup as AriaToggleButtonGroup,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
  type ToggleButtonGroupRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv, type VariantProps } from '../../lib/tv'

/* React Aria's ToggleButtonGroup, a <div> of buttons, which its ToggleButtons given an `id` take
 * their selection from. Standard hugs them, spaced by size; connected spans its container, 2dp
 * apart, and draws their corners from here (`*:`), since the buttons take only their own props. */
const buttonGroupStyles = tv({
  base: 'items-center',
  variants: {
    variant: { standard: 'inline-flex', connected: 'flex w-full gap-space-25 *:grow' },
    size: { xs: '', s: '', m: '', l: '', xl: '' },
    shape: { round: '', square: '' },
  },
  compoundVariants: [
    { variant: 'standard', size: 'xs', class: 'gap-4.5' },
    { variant: 'standard', size: 's', class: 'gap-space-150' },
    { variant: 'standard', size: ['m', 'l', 'xl'], class: 'gap-space-100' },

    // xs and s buttons are 48dp wide at least, so the targets, which 2dp can't part, don't overlap.
    { variant: 'connected', size: ['xs', 's'], class: '*:min-w-12' },
    // The inner corners, on logical sides so the group mirrors right to left, and smaller pressed:
    // a selected one's too, which names both to outweigh a morphing toggle's selected:pressed: corner.
    {
      variant: 'connected',
      size: ['xs', 's', 'm'],
      class: `*:not-first:rounded-s-shape-sm *:not-last:rounded-e-shape-sm *:not-first:pressed:rounded-s-shape-xs *:not-last:pressed:rounded-e-shape-xs *:not-first:selected:pressed:rounded-s-shape-xs *:not-last:selected:pressed:rounded-e-shape-xs`,
    },
    {
      variant: 'connected',
      size: 'l',
      class: `*:not-first:rounded-s-shape-lg *:not-last:rounded-e-shape-lg *:not-first:pressed:rounded-s-shape-md *:not-last:pressed:rounded-e-shape-md *:not-first:selected:pressed:rounded-s-shape-md *:not-last:selected:pressed:rounded-e-shape-md`,
    },
    {
      variant: 'connected',
      size: 'xl',
      class: `*:not-first:rounded-s-shape-lg-inc *:not-last:rounded-e-shape-lg-inc *:not-first:pressed:rounded-s-shape-lg *:not-last:pressed:rounded-e-shape-lg *:not-first:selected:pressed:rounded-s-shape-lg *:not-last:selected:pressed:rounded-e-shape-lg`,
    },
    // Square, the outer ends too.
    { variant: 'connected', shape: 'square', size: ['xs', 's', 'm'], class: '*:rounded-shape-sm' },
    { variant: 'connected', shape: 'square', size: 'l', class: '*:rounded-shape-lg' },
    { variant: 'connected', shape: 'square', size: 'xl', class: '*:rounded-shape-lg-inc' },
    // Selected, fully round: a round button's corner of the size, sorting after a toggle's own
    // selected shape and before the pressed inner corners.
    { variant: 'connected', size: 'xs', class: '*:selected:rounded-space-75-variable' },
    { variant: 'connected', size: 's', class: '*:selected:rounded-space-125-variable' },
    { variant: 'connected', size: 'm', class: '*:selected:rounded-space-200-variable' },
    { variant: 'connected', size: 'l', class: '*:selected:rounded-space-400-variable' },
    { variant: 'connected', size: 'xl', class: '*:selected:rounded-space-600-variable' },
  ],
  defaultVariants: { variant: 'standard', size: 's', shape: 'round' },
})

type Variant = NonNullable<VariantProps<typeof buttonGroupStyles>['variant']>
type Size = NonNullable<VariantProps<typeof buttonGroupStyles>['size']>
type Shape = NonNullable<VariantProps<typeof buttonGroupStyles>['shape']>

// What a button group passes a function `className` or `style`: React Aria's ToggleButtonGroup's state.
export type ButtonGroupRenderProps = ToggleButtonGroupRenderProps

// The props `ButtonGroup` adds to those of React Aria's ToggleButtonGroup. Their comments quote the
// M3 button group pages, which each lists under @see. The buttons keep their own size and shape:
// `size` sets the space or the corners between them, and `shape` a connected group's outer ends.
type ButtonGroupBaseProps = {
  /**
   * Two variants: standard and connected
   *
   * - `standard`: Standard button groups add interaction between adjacent
   *   buttons so they respond to each other. When a button in a standard
   *   group is selected, the selected button changes shape and width, and
   *   adjacent buttons move and temporarily change width. Standard button
   *   group inner padding: XS 18dp, S 12dp, M 8dp, L 8dp, XL 8dp.
   * - `connected`: Connected button groups help people select options,
   *   switch views, or sort elements in a page. They behave similarly to
   *   standard groups, except they don’t affect adjacent buttons. For all
   *   connected button groups, use 2dp padding. Avoid mixing color styles in
   *   connected button groups; it can make selection and emphasis unclear.
   *
   * @default 'standard'
   * @see https://m3.material.io/components/button-groups/overview
   * @see https://m3.material.io/components/button-groups/guidelines
   * @see https://m3.material.io/components/button-groups/specs
   */
  variant?: Variant

  /**
   * Works with all button sizes: XS, S, M, L, and XL
   *
   * @default 's'
   * @see https://m3.material.io/components/button-groups/overview
   */
  size?: Size

  /**
   * Two default shapes: round and square
   *
   * @default 'round'
   * @see https://m3.material.io/components/button-groups/specs
   */
  shape?: Shape
}

// The props of React Aria's ToggleButtonGroup, which `ButtonGroup` is, with the `ref` of its <div>,
// and the M3 props.
export type ButtonGroupProps = AriaToggleButtonGroupProps &
  RefProps<HTMLDivElement> &
  ButtonGroupBaseProps

// React Aria makes it a radiogroup (single selection, its default) or a toolbar (multiple): arrow
// keys move between the buttons and Tab leaves the group, where M3 has Tab move to the next one.
// A pressed button of a standard group does not change its neighbors' widths.
/**
 * Button groups organize buttons and add interactions between them.
 *
 * Button groups have no color properties. They can use the default button or
 * toggle button color styles, like filled, tonal, and outlined. Avoid using
 * standard icon buttons or text buttons, as they have no container treatment.
 *
 * By default, all buttons in a standard group should be the same size (XS to
 * XL) and shape (round or square). Only use multiple sizes in a group for
 * hero moments.
 *
 * Label each button according to the button and icon button accessibility
 * guidance.
 *
 * @see https://m3.material.io/components/button-groups/guidelines
 * @see https://m3.material.io/components/button-groups/specs
 * @see https://m3.material.io/components/button-groups/accessibility
 */
export function ButtonGroup({ variant, size, shape, className, ...props }: ButtonGroupProps) {
  return (
    <AriaToggleButtonGroup
      {...props}
      className={composeTailwindRenderProps(className, buttonGroupStyles({ variant, size, shape }))}
    />
  )
}
