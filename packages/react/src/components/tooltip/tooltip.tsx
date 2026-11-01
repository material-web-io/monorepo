import {
  Popover as AriaPopover,
  PreviewTrigger as AriaPreviewTrigger,
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
  type PopoverProps as AriaPopoverProps,
  type PreviewTriggerProps as AriaPreviewTriggerProps,
  type TooltipProps as AriaTooltipProps,
  type TooltipTriggerComponentProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv, type VariantProps } from '../../lib/tv'

export type { PopoverRenderProps, TooltipRenderProps } from 'react-aria-components'

/* React Aria's Tooltip, the `tooltip` role, a plain or a rich tooltip by its variant, and its
 * Popover drawn as a rich tooltip, for one that holds buttons or links; their fixed classes are in
 * tooltip.css. Both triggers are React Aria's, but that they wait 1.5s before closing, and a
 * TooltipTrigger 0.5s before opening. */
const tooltipStyles = tv({
  base: 'tooltip',
  variants: { variant: { plain: 'tooltip-plain', rich: 'tooltip-rich' } },
  defaultVariants: { variant: 'plain' },
})

type Variant = NonNullable<VariantProps<typeof tooltipStyles>['variant']>

// The M3 behavior: closed 1.5s after the pointer leaves, where React Aria's close after 0.5s; a
// second trigger hovered meanwhile closes it at once, as React Aria shows one tooltip at a time.
const closeDelay = 1500

// Opened 0.5s into a hover, where React Aria's TooltipTrigger waits 1.5s.
const delay = 500

// The props of React Aria's TooltipTrigger: `delay` before it opens on hover, 0.5s unless given,
// `closeDelay`, `isDisabled`, `trigger="focus"` for focus alone, `shouldCloseOnPress`, `isOpen`,
// `defaultOpen` and `onOpenChange`.
export type TooltipTriggerProps = TooltipTriggerComponentProps

// React Aria's TooltipTrigger, around a focusable element of React Aria's, such as a Button or an
// IconButton, and a Tooltip. Keyboard focus opens it at once and taking the focus away closes it at
// once; a press, or Escape, closes it. A disabled element, or a touch, shows none, as React Aria's.
/**
 * Tooltips can appear when an actionable element, like a button or navigation rail, is hovered or
 * focused. However, this tooltip shouldn’t hide crucial information.
 *
 * Both plain and rich tooltips disappear 1.5 seconds after navigating away from the target region.
 *
 * Triggering a new tooltip immediately closes any other open tooltip.
 *
 * @see https://m3.material.io/components/tooltips/guidelines
 * @see https://m3.material.io/components/tooltips/accessibility
 */
export function TooltipTrigger(props: TooltipTriggerProps) {
  return <AriaTooltipTrigger delay={delay} closeDelay={closeDelay} {...props} />
}

// The props `Tooltip` adds to those of React Aria's Tooltip. Its comment quotes the M3 tooltips
// pages, which it lists under @see; it adds no wording of our own.
type TooltipBaseProps = {
  // Plain is its text alone, as written. Rich holds a React Aria `Heading`, its subhead, and its
  // supporting text, as written or in a `Text`; a rich tooltip with buttons or links in it is a
  // `TooltipPopover`, which the keyboard can reach, where a tooltip's are out of its reach.
  /**
   * Two variants: plain and rich
   *
   * Plain tooltips briefly describe a UI element. They're best used for labelling UI elements with
   * no text, like icon-only buttons and fields.
   *
   * Rich tooltips provide additional context about a UI element.
   *
   * Rich tooltips are best used for longer text like definitions or explanations.
   *
   * @default 'plain'
   * @see https://m3.material.io/components/tooltips/overview
   * @see https://m3.material.io/components/tooltips/guidelines
   */
  variant?: Variant
}

// The props of React Aria's Tooltip, with the `ref` of its <div>, and the M3 variant: its
// `placement` (`'top'`, plain, or `'bottom'`, rich, unless given), `offset` from the trigger (4dp
// unless given), `containerPadding` from the window's edge (8dp unless given) and the rest.
export type TooltipProps = AriaTooltipProps & RefProps<HTMLDivElement> & TooltipBaseProps

// Placed by React Aria, flipped to the other side where there is no room, in a portal: above its
// trigger 4dp away when plain, or centered below it when rich, as on desktop. In an app bar, or for
// text, give it `placement="bottom"` or `offset={8}` yourself. It fades in and out, in its place and
// at its size, as Compose's does.
/**
 * Tooltips display brief labels or messages
 *
 * Use tooltips to add additional context to a button or other UI element
 *
 * By default, plain tooltips are positioned directly above the parent element.
 *
 * - If there's a visual boundary, like a button, the distance is 4dp
 * - If there's no visual boundary, like with text baselines, the distance is 8dp
 *
 * If the element is in an app bar, the plain tooltip appears below the element at the same
 * distance.
 *
 * On desktop, tooltips may appear centered below the parent element and remain visible while
 * moving within the target region.
 *
 * They adjust position to avoid going off screen. Tooltips shouldn't cover the parent element.
 *
 * Plain and rich tooltips without required actions should remain on screen long enough for people
 * to receive the information without disrupting their existing flow or task.
 *
 * Tooltips should have the Tooltip role, or similar.
 *
 * Label all elements in the tooltip according to their own accessibility guidance.
 *
 * @see https://m3.material.io/components/tooltips/overview
 * @see https://m3.material.io/components/tooltips/guidelines
 * @see https://m3.material.io/components/tooltips/specs
 * @see https://m3.material.io/components/tooltips/accessibility
 */
export function Tooltip({ variant, placement, className, ...props }: TooltipProps) {
  return (
    <AriaTooltip
      offset={4}
      containerPadding={8}
      {...props}
      placement={placement ?? (variant === 'rich' ? 'bottom' : 'top')}
      className={composeTailwindRenderProps(className, tooltipStyles({ variant }))}
    />
  )
}

// The props of React Aria's PreviewTrigger: `delay` before it opens, 0.6s unless given,
// `closeDelay`, `isDisabled`, `isOpen`, `defaultOpen` and `onOpenChange`.
export type PreviewTriggerProps = AriaPreviewTriggerProps

// React Aria's PreviewTrigger, around a focusable element of React Aria's and a TooltipPopover: the
// pointer can cross to the popover and stay over it, and Tab from the trigger moves the focus into
// it, to its buttons and links, then on past the trigger. A long press opens it on a touch screen.
// Escape closes it at once from the trigger, but from inside it only after the close delay.
/**
 * To show a tooltip, hover on the parent element on desktop, or tap and hold the element on mobile.
 *
 * Both plain and rich tooltips disappear 1.5 seconds after navigating away from the target region.
 *
 * Triggering a new tooltip immediately closes any other open tooltip.
 *
 * @see https://m3.material.io/components/tooltips/guidelines
 */
export function PreviewTrigger(props: PreviewTriggerProps) {
  return <AriaPreviewTrigger closeDelay={closeDelay} {...props} />
}

// The props of React Aria's Popover, with the `ref` of its <div>: its `placement` (`'bottom'`
// unless given), `offset` from the trigger (4dp unless given), `containerPadding` from the window's
// edge (8dp unless given), `isNonModal` and the rest.
export type TooltipPopoverProps = AriaPopoverProps & RefProps<HTMLElement>

// A rich tooltip that holds buttons or links: React Aria's Popover, centered below its trigger. In
// a PreviewTrigger it opens as a tooltip does, a `dialog` that keeps no focus in. In React Aria's
// DialogTrigger a press opens it: `isNonModal`, around a React Aria `Dialog` to take the focus, it
// lets a press on another element through and closes, as on Escape, though Tab stays in it, as in
// any React Aria dialog; modal, as React Aria's popovers are, it hides the page, and a press out
// only closes it. Its Heading is its subhead, its text its supporting text, its buttons below.
/**
 * Rich tooltips provide additional context about a UI element. They can optionally contain a
 * subhead, buttons, and hyperlinks.
 *
 * Keep subheads brief, ideally to one line. They should summarize or describe the message of the
 * rich tooltip.
 *
 * Subheads are important to include when the rich tooltip appears automatically, like when the
 * page loads.
 *
 * Rich tooltips can have up to two text buttons. These should be brief and relevant to the message
 * in the supporting text.
 *
 * Keep buttons short so they can be side by side. Avoid stacking them when possible.
 *
 * Persistent rich tooltips appear when either:
 *
 * - The parent element is clicked
 * - The page loads and a new feature is being explained
 *
 * Persistent rich tooltips remain active even when leaving the target region. They only disappear
 * once a person interacts with another UI element. Hovering doesn't trigger the tooltip.
 *
 * Avoid using persistent rich tooltips on icon buttons.
 *
 * Focus order within the rich tooltip moves top to bottom between interactive elements.
 *
 * Avoid trapping screen reader and keyboard focus on rich tooltips.
 *
 * People should be able to move linearly through the rest of the page.
 *
 * Keyboard navigation:
 * - Tab: Focus lands on button, if available
 * - Space or Enter: Activates the focused element
 *
 * @see https://m3.material.io/components/tooltips/guidelines
 * @see https://m3.material.io/components/tooltips/specs
 * @see https://m3.material.io/components/tooltips/accessibility
 */
export function TooltipPopover({ className, ...props }: TooltipPopoverProps) {
  return (
    <AriaPopover
      placement="bottom"
      offset={4}
      containerPadding={8}
      {...props}
      className={composeTailwindRenderProps(className, tooltipStyles({ variant: 'rich' }))}
    />
  )
}
