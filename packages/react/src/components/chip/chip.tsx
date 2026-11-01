import type { ReactNode } from 'react'
import {
  ButtonContext,
  composeRenderProps,
  DEFAULT_SLOT,
  Provider,
  Tag as AriaTag,
  type TagProps as AriaTagProps,
  type TagRenderProps as AriaTagRenderProps,
  TextContext,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { IconContext } from '../icon'
import { Ripple } from '../ripple'

/* The row (chip.css) in the variant's colors, and those of the icons in its slots (chip-*-icons):
 * the label takes the row's color, an icon its slot's, and the label's again when disabled. A
 * selected chip is selected: (data-selected), colored only on a filter or input chip. */
const chipStyles = tv({
  base: 'group/md-chip chip disabled:chip-disabled',
  variants: {
    variant: {
      assist: 'px-space-200 text-on-surface chip-assist-icons',
      filter: 'px-space-200 text-on-surface-variant chip-filter-icons',
      // 12dp to its label, where the others are 16dp.
      input: 'px-space-150 text-on-surface-variant chip-input-icons',
      suggestion: 'px-space-200 text-on-surface-variant chip-suggestion-icons',
    },
    elevated: {
      false: 'inset-ring-1 inset-ring-outline-variant',
      true: 'bg-surface-container-low shadow-elevation-1 hover:shadow-elevation-2 disabled:bg-on-surface/disabled-container pressed:shadow-elevation-1',
    },
  },
  compoundVariants: [
    // The outline darkens on focus: to on-surface on an assist chip, on-surface-variant on the rest.
    { variant: 'assist', elevated: false, class: 'focus-visible:inset-ring-on-surface' },
    {
      variant: ['filter', 'input', 'suggestion'],
      elevated: false,
      class: 'focus-visible:inset-ring-on-surface-variant',
    },
    // Selected, a filter or input chip is filled and has no outline. It would look unselected in
    // forced-colors mode, so it gets the system highlight fill instead.
    {
      variant: ['filter', 'input'],
      class:
        'selected:bg-secondary-container selected:text-on-secondary-container selected:inset-ring-0 selected:disabled:bg-on-surface/disabled-container selected:disabled:chip-disabled selected:forced-colors:selected-fill',
    },
    // A flat filter chip, selected, rises on hover.
    { variant: 'filter', elevated: false, class: 'selected:hover:shadow-elevation-1' },
  ],
  defaultVariants: {
    elevated: false,
  },
})

type Variant = 'assist' | 'filter' | 'input' | 'suggestion'

// The M3 props, by the variant given. The spec gives the input chip no elevated style, so given
// `variant="input"` the types take no `isElevated`; given a union of variants, not yet known, they
// take it, and the component keeps an input chip flat.
type VariantProps<V extends Variant> = {
  /**
   * Four variants: assist, filter, input, and suggestion
   *
   * - `assist`: Assist chips represent smart or automated actions that can span
   *   multiple apps
   * - `filter`: Filter chips represent filters for a collection
   * - `input`: Input chips represent discrete pieces of information entered by
   *   a person
   * - `suggestion`: Suggestion chips help narrow a person’s intent by presenting
   *   dynamically-generated suggestions
   *
   * @see https://m3.material.io/components/chips/overview
   * @see https://m3.material.io/components/chips/guidelines
   */
  variant: V

  /**
   * Chip elevation defaults to 0 but can be elevated if they need more visual
   * separation
   *
   * Chip containers can be elevated if placed on top of an image or dynamic
   * background.
   *
   * @default false
   * @see https://m3.material.io/components/chips/overview
   * @see https://m3.material.io/components/chips/guidelines
   */
  isElevated?: V extends 'input' ? false : boolean
}

// The props of React Aria's Tag, which `Chip` is, with the `ref` of its row and the M3 props. React
// Aria names a Tag by its children when they are a plain string and asks for a textValue otherwise:
// the types ask the same, of a string alone as the children, or of a textValue with any children.
export type ChipProps<V extends Variant = Variant> = AriaTagProps &
  RefProps<HTMLDivElement> &
  VariantProps<V> &
  ({ children: string; textValue?: string } | { textValue: string })

/** The state a chip reports, React Aria's Tag's: its render props, and its `data-*` attributes. */
export type ChipRenderProps = AriaTagRenderProps

// The slots of each variant, by React Aria's contexts. An input chip has `leading`, an Icon's, and
// `remove`, the Tag's own, which gives the Button there its remove button's props: its name, and
// removing the chip. A filter chip has `leading` and `trailing`, an Icon's or a Button's, disabled
// with the chip. An assist or suggestion chip has `leading` alone, and no Button at all. Every chip
// gives a Text `label`, in place of the TagGroup's slots, which would throw on it. Any other slot
// throws, as in React Aria; an Icon or a Text with none, the remove button's icon, passes.
function ChipSlots({
  variant,
  isDisabled,
  children,
}: {
  variant: Variant
  isDisabled: boolean
  children: ReactNode
}) {
  const text = { slots: { [DEFAULT_SLOT]: {}, label: {} } }
  const leading = { slots: { [DEFAULT_SLOT]: {}, leading: {} } }
  if (variant === 'input') {
    return (
      <Provider
        values={[
          [TextContext, text],
          [IconContext, leading],
        ]}
      >
        {children}
      </Provider>
    )
  }
  if (variant === 'filter') {
    return (
      <Provider
        values={[
          [TextContext, text],
          [ButtonContext, { slots: { trailing: { isDisabled } } }],
          [IconContext, { slots: { ...leading.slots, trailing: {} } }],
        ]}
      >
        {children}
      </Provider>
    )
  }
  return (
    <Provider
      values={[
        [TextContext, text],
        [ButtonContext, { slots: {} }],
        [IconContext, leading],
      ]}
    >
      {children}
    </Provider>
  )
}

// A chip is a row of its ChipGroup's grid, its content in the row's gridcell: the ripple, which
// takes the row's states as props, then its children as written. Its slots are named by React
// Aria's slot prop (ChipSlots): chip.css places, sizes and colors what is given slot="leading" or
// "trailing", or "remove", the Tag's remove button, and lays out a Text given slot="label".
/**
 * Chips help people enter information, make selections, filter content, or
 * trigger actions
 *
 * Anatomy:
 * - Container
 * - Label text
 * - Leading icon or image (optional)
 * - Trailing icon (required for input chips, optional for filter chips)
 *
 * Keyboard navigation:
 * - Tab: Moves focus to enabled chip or chip group
 * - Space or Enter: Activates, selects, or deselects the focused chip
 * - Backspace or Delete: Removes currently focused input chip
 * - Arrows: Moves focus between chips
 *
 * The accessibility label for a chip is the chip's label text. Additional
 * actions, like remove, are labeled separately.
 *
 * @see https://m3.material.io/components/chips/overview
 * @see https://m3.material.io/components/chips/guidelines
 * @see https://m3.material.io/components/chips/accessibility
 */
export function Chip<V extends Variant>({
  variant,
  isElevated = false,
  textValue,
  className,
  children,
  ...props
}: ChipProps<V>) {
  // The types keep an input chip flat; this covers untyped callers and a variant given as a union.
  const styles = chipStyles({ variant, elevated: variant !== 'input' && isElevated })
  return (
    <AriaTag
      {...props}
      // React Aria names a Tag by plain-text children; it sees ours as a function, so they go here.
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      className={composeTailwindRenderProps(className, styles)}
    >
      {composeRenderProps(children, (children, { isHovered, isFocusVisible, isDisabled }) => (
        <>
          <Ripple isHovered={isHovered} isFocusVisible={isFocusVisible} isDisabled={isDisabled} />
          <ChipSlots variant={variant} isDisabled={isDisabled}>
            {children}
          </ChipSlots>
        </>
      ))}
    </AriaTag>
  )
}
