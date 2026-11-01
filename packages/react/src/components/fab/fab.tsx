import type { CSSProperties, ElementType, ReactNode } from 'react'
import { composeRenderProps, TextContext } from 'react-aria-components'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
  type ButtonRenderProps as AriaButtonRenderProps,
} from '../../lib/button'
import { tv, type VariantProps } from '../../lib/tv'
import { useMeasuredWidth } from '../../lib/use-measured-width'
import { PendingIndicator } from '../button/pending-indicator'
import { Ripple } from '../ripple'

/* Unlike Button's, the corner is not half its height: it is a fixed token per size, not
 * derived from height. It rests at elevation 3, lifts to 4 on hover, and (like
 * Button) gets a system-color border in forced-colors mode. */
const fab = tv({
  base: [
    'relative focus-ring m-0 inline-flex min-w-0 shrink-0 touch-manipulation appearance-none items-center justify-center overflow-hidden border-0 p-0 font-plain whitespace-nowrap no-underline button-pending shadow-elevation-3 outline-none select-none not-disabled:cursor-pointer hover:shadow-elevation-4 pending:cursor-progress',
    'transition-space-color-shadow',
    'disabled:bg-on-surface/disabled-container disabled:text-on-surface/disabled-content disabled:shadow-none',
    'forced-colors:container-border',
    // In a navigation rail's header it rests at level 0, and lifts one level from there; it spans
    // the header's columns from its start edge, so that an extended FAB widens the expanded rail.
    'group-data-navigation-rail-header/md-navigation-rail-header:col-span-full group-data-navigation-rail-header/md-navigation-rail-header:justify-self-start group-data-navigation-rail-header/md-navigation-rail-header:shadow-none group-data-navigation-rail-header/md-navigation-rail-header:hover:shadow-elevation-1',
  ],
  variants: {
    color: {
      'primary-container': 'bg-primary-container text-on-primary-container',
      'secondary-container': 'bg-secondary-container text-on-secondary-container',
      'tertiary-container': 'bg-tertiary-container text-on-tertiary-container',
      primary: 'bg-primary text-on-primary',
      secondary: 'bg-secondary text-on-secondary',
      tertiary: 'bg-tertiary text-on-tertiary',
    },
    // The extended FAB's padding, kept while collapsed so the icon holds its
    // inset from the leading edge as the label slides out beside it. Only the
    // large size moves: its icon-only inset is 30dp to the extended FAB's 28dp
    // (fab-icon-only, while no label shows). Its icon is 24, 28 or 36dp, 8, 12 or
    // 16dp from its label, and any text in it is set as its label is, on one line.
    size: {
      baseline: 'h-14 gap-space-100 rounded-shape-lg px-space-200 text-title-md icon-24',
      medium: 'h-20 gap-space-150 rounded-shape-lg-inc px-6.5 text-title-lg icon-28',
      large:
        'h-24 gap-space-200 rounded-shape-xl px-7 text-headline-md icon-36 fab-icon-only:px-7.5',
    },
  },
  defaultVariants: {
    color: 'primary-container',
    size: 'baseline',
  },
})

// The slot holds the label at its measured width and, collapsed, pulls it back
// under the trailing edge with a negative end margin instead of closing to 0px:
// a margin can spring past -width, so the container bounces below 56dp too. It
// takes in the gap before it as the label's padding, so the gap moves with the
// label; with no icon before it there is no gap, and the two cancel out.
const fabSlot = tv({
  base: 'w-(--fab-label-width) shrink-0',
  variants: {
    size: { baseline: '-ms-space-100', medium: '-ms-space-150', large: '-ms-space-200' },
    extended: { true: '', false: '-me-(--fab-label-width)' },
    // Off while a measurement lands unanimated (useMeasuredWidth's `animate`).
    animate: { true: 'transition-reveal', false: '' },
  },
})

// The type is the button's, by its size, not `isExtended`'s, so nothing about the
// text snaps as it starts to fade.
const fabLabel = tv({
  base: 'block w-max',
  variants: {
    size: { baseline: 'ps-space-100', medium: 'ps-space-150', large: 'ps-space-200' },
    // It fades in and out as the shape starts to change, as Compose's does. Only a
    // collapse waits out its visibility: extended, it is shown at once, and hidden at
    // once with an ancestor hidden.
    extended: {
      true: 'opacity-100 transition-fade',
      false: 'invisible opacity-0 transition-fade-visibility',
    },
  },
})

type Size = NonNullable<VariantProps<typeof fab>['size']>

// A pending FAB's loading indicator, 1.5 times its icon, as M3 shows a 48dp one in a large
// button: the shape it draws is then about as large as the icon.
const pendingIndicatorSize: Record<Size, number> = { baseline: 36, medium: 42, large: 54 }

type Color = NonNullable<VariantProps<typeof fab>['color']>

type FabBaseProps = {
  /**
   * Six color options: the primary, secondary and tertiary containers, and the
   * primary, secondary and tertiary roles themselves
   *
   * FABs can use several combinations of color and on-color styles, such as
   * primary and on-primary. The following color mappings provide the same
   * legibility and functionality, so the color mapping you use depends on
   * style alone.
   *
   * @default 'primary-container'
   * @see https://m3.material.io/components/floating-action-button/specs
   */
  color?: Color

  // `baseline`, `medium` and `large` here: a 56/80/96dp container with a
  // 24/28/36dp icon and a 16/20/28dp corner respectively; they also set an
  // extended FAB's height, where `baseline` is the small extended FAB.
  /**
   * There are three FAB sizes:
   *
   * FAB
   *
   * Medium FAB (most recommended)
   *
   * Large FAB
   *
   * @default 'baseline'
   * @see https://m3.material.io/components/floating-action-button/guidelines
   * @see https://m3.material.io/components/floating-action-button/specs
   */
  size?: Size

  // Shows or hides its label, which stays mounted to fade out and in, so the same
  // `children` toggle which form shows, e.g. on scroll. On unless set.
  isExtended?: boolean
}

// What a FAB passes its class, style and children, given as functions: the state React Aria
// reports of its button.
export type FabRenderProps = AriaButtonRenderProps

// The props of React Aria's Button, which `Fab` is, from React Aria's hooks on the element given
// as `elementType` (lib/button), with the `ref` of that element, and the M3 props. Its children
// are drawn as they are given, its label among them React Aria's `Text` given `slot="label"`,
// which makes it an extended FAB named by that label. An icon alone wants an `aria-label` or
// `aria-labelledby` to name it.
export type FabProps<T extends ElementType = 'button'> = AriaButtonProps<T> & FabBaseProps

// What a FAB draws in its button: the ripple, then its children, the label in its slot. The label
// slot is React Aria's Text given `slot="label"`, drawn in a slot of the label's width.
function FabContent({
  size,
  isExtended,
  children,
}: {
  size: Size
  isExtended: boolean
  children: ReactNode
}) {
  // The slot's width is the label's own, measured: `width: auto` can't animate.
  // Until it is, an extended FAB shows the label at max-content (a keyword
  // doesn't transition to the number) and a collapsed one holds the slot at 0.
  const { ref, width, animate } = useMeasuredWidth<HTMLElement>(children)
  const slotWidth = width === undefined ? (isExtended ? 'max-content' : '0px') : `${width}px`

  // Collapsed, the label stays mounted and fades out, hidden from assistive
  // technology at once.
  return (
    <TextContext.Provider
      value={{
        slots: {
          label: {
            ref,
            'aria-hidden': !isExtended || undefined,
            className: fabLabel({ size, extended: isExtended }),
            render: (props) => (
              <span
                style={{ '--fab-label-width': slotWidth } as CSSProperties}
                className={fabSlot({ size, extended: isExtended, animate })}
              >
                <span {...props} />
              </span>
            ),
          },
        },
      }}
    >
      <Ripple />
      {children}
    </TextContext.Provider>
  )
}

// The Text in its `label` slot makes it an extended FAB, named by that label
// instead of `aria-label`/`aria-labelledby`. It doesn't position itself -
// place it with your layout, e.g. `fixed right-space-200 bottom-space-200 z-fab`.
/**
 * Use a FAB for the most important action on a screen; it appears in front of
 * all other content.
 *
 * Keyboard navigation:
 * - Tab: Focus lands on the FAB.
 * - Space or Enter: Perform the default action on an item.
 *
 * The accessibility label should describe the action that the button is
 * performing, such as Compose a new message.
 *
 * @see https://m3.material.io/components/floating-action-button/guidelines
 * @see https://m3.material.io/components/floating-action-button/accessibility
 * @see https://m3.material.io/components/extended-fab/guidelines
 */
export function Fab<T extends ElementType = 'button'>({
  color = 'primary-container',
  size = 'baseline',
  isExtended = true,
  className,
  children,
  ...props
}: FabProps<T>) {
  return (
    <AriaButton
      {...props}
      className={composeRenderProps(className, (className) => fab({ color, size, className }))}
    >
      {composeRenderProps(children, (children, { isPending }) => (
        <>
          <FabContent size={size} isExtended={isExtended}>
            {children}
          </FabContent>
          {isPending && <PendingIndicator size={pendingIndicatorSize[size]} />}
        </>
      ))}
    </AriaButton>
  )
}
