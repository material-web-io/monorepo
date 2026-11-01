import { createContext, useContext, useMemo, type ComponentProps, type ElementType } from 'react'
import { composeRenderProps } from 'react-aria-components'
import type { Except } from '../../lib/aria'
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from '../../lib/button'
import { tv, twMerge, type VariantProps } from '../../lib/tv'
import { PendingIndicator } from '../button/pending-indicator'
import { Icon } from '../icon'
import { Ripple } from '../ripple'

/* The trailing icon's 180° rotation uses the spec's standard motion scheme
 * (`data-motion="standard"`), not this library's expressive default. Icon
 * sizes round up to the fixed Icon scale; the spec's menu icon offset isn't applied. */
const splitButton = tv({
  base: [
    'touch-target relative focus-ring m-0 inline-flex shrink-0 touch-manipulation appearance-none items-center justify-center border-0 px-0 font-plain whitespace-nowrap no-underline button-pending outline-none select-none not-disabled:cursor-pointer pending:cursor-progress',
    'transition-shape-color-shadow',
    'disabled:bg-on-surface/disabled-container disabled:text-on-surface/disabled-content disabled:shadow-none',
    'forced-colors:container-border',
  ],
  variants: {
    // Same four container colors as Button (see its own `variant` doc); a
    // split button has no text style, per the specs page's color configurations.
    variant: {
      elevated: 'bg-surface-container-low text-primary shadow-elevation-1 hover:shadow-elevation-2',
      filled: 'bg-primary text-on-primary hover:shadow-elevation-1',
      tonal: 'bg-secondary-container text-on-secondary-container hover:shadow-elevation-1',
      outlined:
        'bg-transparent text-on-surface-variant inset-ring-1 inset-ring-outline-variant disabled:bg-transparent disabled:inset-ring-on-surface/disabled-container',
    },
    // Each segment is 32, 40, 56, 96 and 136dp tall by what it holds and the padding above
    // and below that, set per part below.
    size: {
      xs: 'text-label-lg',
      s: 'text-label-lg',
      m: 'text-title-md',
      l: 'text-headline-sm',
      xl: 'text-headline-lg',
    },
    // The outer end of each segment (the side away from the other segment) is always fully
    // round, with the corner of its padding; both it and the inner corner are set below.
    part: { leading: '', trailing: 'group/md-split-button-trailing' },
  },
  compoundVariants: [
    { variant: 'outlined', size: ['l', 'xl'], class: 'inset-ring-2' },

    // The leading button is padded as Button is: 6, 10, 16, 32 and 48dp above and below a
    // line of its text style, which its icon is as tall as (icon-*).
    {
      part: 'leading',
      size: 'xs',
      class: 'gap-space-50 py-space-75-variable ps-space-150 pe-space-125 icon-20',
    },
    {
      part: 'leading',
      size: 's',
      class: 'gap-space-100 py-space-125-variable ps-space-200 pe-space-150 icon-20',
    },
    {
      part: 'leading',
      size: 'm',
      class: 'gap-space-100 py-space-200-variable ps-space-300 pe-space-300 icon-24',
    },
    {
      part: 'leading',
      size: 'l',
      class: 'gap-space-150 py-space-400-variable ps-space-600 pe-space-600 icon-32',
    },
    {
      part: 'leading',
      size: 'xl',
      class: 'gap-space-200 py-space-600-variable ps-space-800 pe-space-800 icon-40',
    },
    // Its outer end is round with the corner of that padding.
    { part: 'leading', size: 'xs', class: 'rounded-s-space-75-variable' },
    { part: 'leading', size: 's', class: 'rounded-s-space-125-variable' },
    { part: 'leading', size: 'm', class: 'rounded-s-space-200-variable' },
    { part: 'leading', size: 'l', class: 'rounded-s-space-400-variable' },
    { part: 'leading', size: 'xl', class: 'rounded-s-space-600-variable' },
    // At xs/s the leading button can be narrower than 48dp (an icon-only
    // label, say), which would let its touch target reach into the trailing
    // button's - the same guard ButtonGroup's connected corners use.
    { part: 'leading', size: ['xs', 's'], class: 'min-w-12' },

    // Leading button inner corner (the end side): resting size per the specs
    // page's "inner corner size" token, growing on hover, focus and press to
    // its "inner corner hovered/pressed size" (the two are equal).
    {
      part: 'leading',
      size: 'xs',
      class:
        'rounded-e-shape-xs hover:rounded-e-shape-sm focus-visible:rounded-e-shape-sm pressed:rounded-e-shape-sm',
    },
    {
      part: 'leading',
      size: 's',
      class:
        'rounded-e-shape-xs hover:rounded-e-shape-md focus-visible:rounded-e-shape-md pressed:rounded-e-shape-md',
    },
    {
      part: 'leading',
      size: 'm',
      class:
        'rounded-e-shape-xs hover:rounded-e-shape-md focus-visible:rounded-e-shape-md pressed:rounded-e-shape-md',
    },
    {
      part: 'leading',
      size: 'l',
      class:
        'rounded-e-shape-sm hover:rounded-e-shape-lg-inc focus-visible:rounded-e-shape-lg-inc pressed:rounded-e-shape-lg-inc',
    },
    {
      part: 'leading',
      size: 'xl',
      class:
        'rounded-e-shape-md hover:rounded-e-shape-lg-inc focus-visible:rounded-e-shape-lg-inc pressed:rounded-e-shape-lg-inc',
    },

    // Trailing button: at xs/s its width floors at 48dp (a min-w), the minimum target, since it
    // is shorter; m/l/xl are that wide. Its line (what the round end reckons with) is its icon, 24,
    // 24 and 28dp, at l/xl 8dp more, with a spacing token above and below: the leading's height.
    { part: 'trailing', size: 'xs', class: 'min-w-12 py-space-50-variable leading-6' },
    { part: 'trailing', size: 's', class: 'min-w-12 py-space-100-variable leading-6' },
    { part: 'trailing', size: 'm', class: 'w-14 py-space-175-variable leading-7' },
    { part: 'trailing', size: 'l', class: 'w-24 py-space-300-variable leading-12' },
    { part: 'trailing', size: 'xl', class: 'w-34 py-space-500-variable leading-14' },

    {
      part: 'trailing',
      size: 'xs',
      class:
        'not-aria-expanded:rounded-s-shape-xs not-aria-expanded:hover:rounded-s-shape-sm not-aria-expanded:focus-visible:rounded-s-shape-sm not-aria-expanded:pressed:rounded-s-shape-sm',
    },
    {
      part: 'trailing',
      size: 's',
      class:
        'not-aria-expanded:rounded-s-shape-xs not-aria-expanded:hover:rounded-s-shape-md not-aria-expanded:focus-visible:rounded-s-shape-md not-aria-expanded:pressed:rounded-s-shape-md',
    },
    {
      part: 'trailing',
      size: 'm',
      class:
        'not-aria-expanded:rounded-s-shape-xs not-aria-expanded:hover:rounded-s-shape-md not-aria-expanded:focus-visible:rounded-s-shape-md not-aria-expanded:pressed:rounded-s-shape-md',
    },
    {
      part: 'trailing',
      size: 'l',
      class:
        'not-aria-expanded:rounded-s-shape-sm not-aria-expanded:hover:rounded-s-shape-lg-inc not-aria-expanded:focus-visible:rounded-s-shape-lg-inc not-aria-expanded:pressed:rounded-s-shape-lg-inc',
    },
    {
      part: 'trailing',
      size: 'xl',
      class:
        'not-aria-expanded:rounded-s-shape-md not-aria-expanded:hover:rounded-s-shape-lg-inc not-aria-expanded:focus-visible:rounded-s-shape-lg-inc not-aria-expanded:pressed:rounded-s-shape-lg-inc',
    },
    // Its outer end is round with the corner of its padding, and expanded its inner end too.
    { part: 'trailing', size: 'xs', class: 'rounded-e-space-50-variable' },
    { part: 'trailing', size: 's', class: 'rounded-e-space-100-variable' },
    { part: 'trailing', size: 'm', class: 'rounded-e-space-175-variable' },
    { part: 'trailing', size: 'l', class: 'rounded-e-space-300-variable' },
    { part: 'trailing', size: 'xl', class: 'rounded-e-space-500-variable' },
    { part: 'trailing', size: 'xs', class: 'aria-expanded:rounded-s-space-50-variable' },
    { part: 'trailing', size: 's', class: 'aria-expanded:rounded-s-space-100-variable' },
    { part: 'trailing', size: 'm', class: 'aria-expanded:rounded-s-space-175-variable' },
    { part: 'trailing', size: 'l', class: 'aria-expanded:rounded-s-space-300-variable' },
    { part: 'trailing', size: 'xl', class: 'aria-expanded:rounded-s-space-500-variable' },
  ],
  defaultVariants: { variant: 'filled', size: 's' },
})

// Stretched, so the two stay one height where a density step leaves no padding around the icon.
const container = tv({ base: 'inline-flex items-stretch gap-space-25' })

type Size = NonNullable<VariantProps<typeof splitButton>['size']>
type Variant = NonNullable<VariantProps<typeof splitButton>['variant']>

// The trailing button's icon, documented above splitButton.
const trailingIconSize: Record<Size, string> = {
  xs: 'icon-24',
  s: 'icon-24',
  m: 'icon-28',
  l: 'icon-40',
  xl: 'icon-48',
}

// A pending button's loading indicator, 1.5 times its icon, as M3 shows a 48dp one in a large
// button: the shape it draws is then about as large as the icon.
const leadingPendingIndicatorSize: Record<Size, number> = { xs: 30, s: 30, m: 36, l: 48, xl: 60 }
const trailingPendingIndicatorSize: Record<Size, number> = { xs: 36, s: 36, m: 42, l: 60, xl: 72 }

type SplitButtonBaseProps = {
  // There is no text split button, unlike Button.
  /**
   * Four color options: elevated, filled, tonal, and outlined
   *
   * Split buttons use the same color schemes as standard buttons.
   *
   * @default 'filled'
   * @see https://m3.material.io/components/buttons/guidelines
   * @see https://m3.material.io/components/split-button/specs
   */
  variant?: Variant

  /**
   * Split buttons have five recommended sizes. These sizes match the sizes
   * offered on buttons and icon buttons:
   *
   * Extra small
   *
   * Small (default)
   *
   * Medium
   *
   * Large
   *
   * Extra large
   *
   * @default 's'
   * @see https://m3.material.io/components/split-button/overview
   * @see https://m3.material.io/components/split-button/guidelines
   */
  size?: Size
}

const SplitButtonContext = createContext<Required<SplitButtonBaseProps>>({
  variant: 'filled',
  size: 's',
})

// The props of the `<div>` that holds the two buttons, and the M3 props, which both read from it.
export type SplitButtonProps = ComponentProps<'div'> & SplitButtonBaseProps

// Holds a `SplitButtonLeading` and a `SplitButtonTrailing`, written in that order, the second in
// React Aria's `MenuTrigger` to open a menu. Each is a button of its own, disabled by its own
// `isDisabled`.
/**
 * Split buttons open a menu to give people more options related to an action
 *
 * Keyboard navigation:
 * - Tab: Navigate between buttons.
 * - Space or enter: Activate focused button.
 *
 * Focus should land on the leading button then move to the trailing button.
 * This can depend on the operating system’s settings.
 *
 * @see https://m3.material.io/components/split-button/guidelines
 * @see https://m3.material.io/components/split-button/accessibility
 */
export function SplitButton({
  variant = 'filled',
  size = 's',
  className,
  ...props
}: SplitButtonProps) {
  const value = useMemo(() => ({ variant, size }), [variant, size])
  return (
    <SplitButtonContext.Provider value={value}>
      <div {...props} className={container({ className })} />
    </SplitButtonContext.Provider>
  )
}

// The props of React Aria's Button, from its hooks on the element given as `elementType`
// (lib/button), `className` and the `ref` of that element included. Its children are its icon,
// label, or both; an icon alone wants an `aria-label` or `aria-labelledby` to name it.
export type SplitButtonLeadingProps<T extends ElementType = 'button'> = AriaButtonProps<T>

// Exposed the same as a plain Button.
/**
 * The accessibility label for the leading button is the same as buttons.
 *
 * @see https://m3.material.io/components/split-button/accessibility
 */
export function SplitButtonLeading<T extends ElementType = 'button'>({
  className,
  children,
  ...props
}: SplitButtonLeadingProps<T>) {
  const { variant, size } = useContext(SplitButtonContext)
  return (
    <AriaButton
      {...props}
      className={composeRenderProps(className, (className) =>
        splitButton({ variant, size, part: 'leading', className }),
      )}
    >
      {composeRenderProps(children, (children, { isPending }) => (
        <>
          <Ripple />
          {children}
          {isPending && <PendingIndicator size={leadingPendingIndicatorSize[size]} />}
        </>
      ))}
    </AriaButton>
  )
}

// It has no visible text, so nothing names it unless the caller does.
type Label = { 'aria-label': string } | { 'aria-labelledby': string }

// The props of React Aria's Button, but its children, which are the menu icon. React Aria's
// `MenuTrigger` gives it `onPress`, `aria-haspopup`, `aria-expanded` and `aria-controls`; for
// anything else that it opens, they are the caller's to give.
export type SplitButtonTrailingProps = Except<AriaButtonProps, 'children'> & Label

// While `aria-expanded`, its icon is turned 180° and its inner corner rounded to match the outer
// one, detaching it into a circle.
/**
 * Selecting the menu button rotates the icon inwards and applies shape morph
 *
 * unlike toggle buttons, the split button color doesn’t change when
 * selected—only a state layer is applied.
 *
 * The trailing icon button should have an extra state or similar label
 * indicating that the menu is expanded or collapsed.
 *
 * Label the button to clearly indicate that there are more options. The
 * label of the secondary button should indicate that it provides
 * additional choices related to the action of the main button. For
 * instance, if the main button says "Watch later," the secondary button
 * should be something like "More watch options."
 *
 * Navigate to any element opened by the trailing button
 *
 * @see https://m3.material.io/components/split-button/guidelines
 * @see https://m3.material.io/components/split-button/specs
 * @see https://m3.material.io/components/split-button/accessibility
 */
export function SplitButtonTrailing({ className, ...props }: SplitButtonTrailingProps) {
  const { variant, size } = useContext(SplitButtonContext)
  return (
    <AriaButton
      data-motion="standard"
      {...props}
      className={composeRenderProps(className, (className) =>
        splitButton({ variant, size, part: 'trailing', className }),
      )}
    >
      {({ isPending }) => (
        <>
          <Ripple />
          <Icon
            name="keyboard_arrow_down"
            className={twMerge(
              trailingIconSize[size],
              'transition-transform duration-spring-fast-spatial ease-spring-fast-spatial group-aria-expanded/md-split-button-trailing:rotate-180',
            )}
          />
          {isPending && <PendingIndicator size={trailingPendingIndicatorSize[size]} />}
        </>
      )}
    </AriaButton>
  )
}
