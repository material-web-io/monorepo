import type { ComponentProps } from 'react'
import { tv, type VariantProps } from '../../lib/tv'

// The container (card.css), filled and lifted per variant.
const card = tv({
  base: 'card',
  variants: {
    variant: {
      elevated: 'bg-surface-container-low shadow-elevation-1',
      filled: 'bg-surface-container-highest',
      outlined: 'bg-surface inset-ring-1 inset-ring-outline-variant',
    },
  },
  defaultVariants: { variant: 'elevated' },
})

type Variant = NonNullable<VariantProps<typeof card>['variant']>

// The prop `Card` adds to the native `<div>` ones. The comment on it quotes the M3 cards
// pages, which it lists under @see; it adds no wording of our own.
type CardVariantProps = {
  /**
   * Three variants: elevated, filled, outlined
   *
   * - `elevated`: Elevated cards have a drop shadow, providing more separation
   *   from the background than filled cards, but less than outlined cards
   * - `filled`: Filled cards provide subtle separation from the background.
   *   This has less emphasis than elevated or outlined cards.
   * - `outlined`: Outlined cards have a visual boundary around the container.
   *   This can provide greater emphasis than the other variants.
   *
   * Each provides the same legibility and functionality, so the variant you
   * use depends on style alone.
   *
   * @default 'elevated'
   * @see https://m3.material.io/components/cards/overview
   * @see https://m3.material.io/components/cards/guidelines
   */
  variant?: Variant
}

export type CardProps = ComponentProps<'div'> & CardVariantProps

// `className`, `style`, the ref, the children and the rest go on the `<div>`, which has no
// role and is no tab stop: the buttons and links written in it are theirs.
/**
 * Cards display content and actions about a single subject
 *
 * Use cards to contain related elements
 *
 * Contents can include anything from images to headlines, supporting text,
 * buttons, and lists
 *
 * Can also contain other components
 *
 * Cards have flexible layouts and dimensions based on their contents
 *
 * The card container is the only required element in a card. Card layouts
 * can vary to support the kinds of content they contain.
 *
 * Card containers hold all card elements. Their size is determined by the
 * space those elements occupy. Card elevation is expressed by the container.
 *
 * Card padding and size measurements:
 *
 * - Shape: 12dp corner radius
 * - Left/right padding: 16dp
 * - Padding between cards: 8dp max
 * - Label text alignment: Start-aligned
 *
 * Non-actionable cards are purely containers, so they don’t need a role.
 *
 * For non-actionable cards, the card itself is not a tab stop. However, every
 * actionable element in the card is a tab stop so they’re all visited before
 * focus navigates to the next card.
 *
 * @see https://m3.material.io/components/cards/overview
 * @see https://m3.material.io/components/cards/guidelines
 * @see https://m3.material.io/components/cards/accessibility
 * @see https://m3.material.io/components/cards/specs
 */
export function Card({ variant = 'elevated', className, ...props }: CardProps) {
  return <div {...props} className={card({ variant, className })} />
}
