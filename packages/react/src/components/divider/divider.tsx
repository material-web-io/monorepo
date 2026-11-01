import {
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps,
} from 'react-aria-components'
import type { RefProps } from '../../lib/aria'
import { tv, type VariantProps } from '../../lib/tv'

const divider = tv({
  base: 'divider',
  variants: {
    // Horizontal fills its container's width on its own (a block, or a stretched flex/grid
    // item); vertical, a <div>, takes its height from a flex or grid row the same way.
    orientation: {
      horizontal: 'border-t',
      vertical: 'w-0 border-s',
    },
    variant: {
      'full-width': '',
      inset: '',
      'middle-inset': '',
    },
  },
  // The spec's insets are the horizontal divider's; a vertical one gets the
  // same 16dp along its own axis. Logical sides, so inset follows the leading edge in rtl.
  compoundVariants: [
    { orientation: 'horizontal', variant: 'inset', class: 'ms-space-200' },
    { orientation: 'horizontal', variant: 'middle-inset', class: 'mx-space-200' },
    { orientation: 'vertical', variant: 'inset', class: 'mt-space-200' },
    { orientation: 'vertical', variant: 'middle-inset', class: 'my-space-200' },
  ],
  defaultVariants: { orientation: 'horizontal', variant: 'full-width' },
})

type Variant = NonNullable<VariantProps<typeof divider>['variant']>

// The prop `Divider` adds to React Aria's `Separator`. The comment on it quotes the M3
// divider pages, which it lists under @see; it adds no wording of our own.
type DividerVariantProps = {
  /**
   * The divider can be used in two ways:
   *
   * 1. Full width
   * 2. Inset
   *
   * - `full-width`: Use full-width dividers to separate larger sections of
   *   unrelated content. They can be used directly on a surface or inside
   *   other components like cards or lists.
   *   Full-width dividers can also separate interactive areas from
   *   non-interactive areas.
   * - `inset`: Use inset dividers to separate related content within a
   *   section.
   *   Inset dividers separate related content, such as emails in a list. They
   *   should be used with anchoring elements such as icons or avatars, and
   *   align with the leading edge of the screen.
   * - `middle-inset`: Inset dividers can be placed in the middle of a layout
   *   to separate elements such as body text from selection chips
   *
   * If dividers are used both ways in a UI, they must reinforce the hierarchy
   * of information within different sections.
   *
   * To separate a different kind of content, use a full-width divider
   *
   * To separate nested content items, use inset dividers
   *
   * @default 'full-width'
   * @see https://m3.material.io/components/divider/guidelines
   * @see https://m3.material.io/components/divider/specs
   */
  variant?: Variant
}

export type DividerProps = AriaSeparatorProps & RefProps<HTMLElement> & DividerVariantProps

/**
 * Dividers are thin lines that group content in lists or other containers
 *
 * Dividers are one way to visually group components and create hierarchy.
 * They can also be used to imply nested parent/child relationships.
 *
 * Dividers are decorative elements, which have no contrast minimums.
 *
 * @see https://m3.material.io/components/divider/overview
 * @see https://m3.material.io/components/divider/guidelines
 * @see https://m3.material.io/components/divider/accessibility
 */
export function Divider({
  orientation = 'horizontal',
  variant = 'full-width',
  className,
  ...props
}: DividerProps) {
  return (
    <AriaSeparator
      {...props}
      orientation={orientation}
      className={divider({ orientation, variant, className })}
    />
  )
}
