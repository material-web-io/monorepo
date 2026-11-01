import { useLayoutEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { FocusScope, mergeProps, useDialog, useLocale, useObjectRef, useOverlay } from 'react-aria'
import {
  ButtonContext,
  composeRenderProps,
  DEFAULT_SLOT,
  HeadingContext,
  Provider,
  Sheet,
  SheetBackdrop,
  SheetContent,
  SheetOverlay,
  useRenderProps,
  type DialogProps,
  type SheetOverlayProps,
  type SheetProps,
  type SheetRenderProps,
} from 'react-aria-components'
import { useOverlayTriggerState } from 'react-stately'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'

export { SheetTrigger, type SheetTriggerProps } from 'react-aria-components'

/* The container (side-sheet.css), clipping what it holds to its shape. A modal one is React
 * Aria's Sheet at the window's end, surface-container-low at elevation 1 with 16dp start corners;
 * a standard one is a flex item at the end of its row, surface, square. Detached, each is round
 * all around. */
const sheet = tv({
  base: 'side-sheet overflow-clip font-plain text-body-md text-on-surface forced-colors:container-border',
  variants: {
    modal: {
      true: 'side-sheet-modal flex flex-col self-stretch bg-surface-container-low shadow-elevation-1',
      false: 'side-sheet-standard relative self-stretch bg-surface',
    },
    detached: { true: 'side-sheet-detached rounded-shape-lg', false: '' },
  },
  compoundVariants: [{ modal: true, detached: false, class: 'rounded-s-shape-lg' }],
})

// What a sheet passes its className, style and children, given as functions: the state React
// Aria reports of its Sheet, whose `state.close()` closes it. A standard one reports the same
// of itself.
export type SideSheetRenderProps = SheetRenderProps

// The props `SideSheet` adds to React Aria's. The comments on them quote the M3 side sheets
// pages, which each comment lists under @see; they add no wording of our own.
type SideSheetBaseProps = {
  // Whether the sheet is modal: React Aria's sheet, in front of the page over a scrim, which it
  // makes inert, and keeping the focus, as a dialog. Else it is a dialog that is not modal,
  // beside the page's body, which stays in use.
  /**
   * Two variants: standard and modal
   *
   * Standard side sheets display content that complements the screen’s primary content. They
   * remain visible while people interact with primary content.
   *
   * Modal side sheets are preferred in compact breakpoints, like mobile, due to limited screen
   * size.
   *
   * They can display the same kinds of content as standard side sheets, but must be dismissed
   * in order to interact with the underlying content.
   *
   * Modal side sheets on smaller screens can transition to standard side sheets at larger
   * screen sizes
   *
   * @default false
   * @see https://m3.material.io/components/side-sheets/overview
   * @see https://m3.material.io/components/side-sheets/guidelines
   */
  isModal?: boolean

  // Whether the sheet is 16dp in from the window's edges, or its row's, round at every corner.
  /**
   * Place side sheets along the edge of the screen, usually on the right side to avoid
   * interference with any navigational components on the left edge. They can be slightly inset
   * by 16dp.
   *
   * Don’t inset a side sheet from the screen edges far beyond the recommended margin. This makes
   * the sheet’s position and scroll behavior unclear, while obscuring primary content.
   *
   * - Margins (when detached): 16dp
   *
   * @default false
   * @see https://m3.material.io/components/side-sheets/guidelines
   * @see https://m3.material.io/components/side-sheets/specs
   */
  isDetached?: boolean
}

// React Aria's props: its dialog's, with its sheet's className, style and children, and those of
// the overlay a modal sheet is. Then its own.
export type SideSheetProps = Except<
  DialogProps,
  'children' | 'className' | 'style' | 'render' | 'slot' | 'isEntering'
> &
  Pick<SheetProps, 'children' | 'className' | 'style'> &
  RefProps<HTMLDivElement> &
  Pick<
    SheetOverlayProps,
    'isOpen' | 'defaultOpen' | 'onOpenChange' | 'preventDismissal' | 'shouldCloseOnInteractOutside'
  > &
  SideSheetBaseProps

// The container in either kind, which takes the props and `ref`, and its width from
// `side-sheet-width-*`. What it holds goes in a column as wide as it: a `SideSheetHeader`, whose
// heading names the sheet, and the rest as it is given, which scrolls as one unless something
// in it scrolls itself. A button in it in React Aria's `close` slot closes it.
// A modal one is React Aria's sheet: `SheetOverlay`, the layer, holding `SheetBackdrop`, the
// scrim, and `Sheet`, the container, at the window's end, which holds `SheetContent`, React
// Aria's Dialog, the column, in the `dialog` role, which takes the `role` and the `aria-*`
// names. It opens in a `SheetTrigger` or by `isOpen`.
// A standard one is a dialog that is not modal, of React Aria's hooks: the container, in the
// `dialog` role, which takes the `role` and the `aria-*` names, at the end of a flex row as tall
// as it should be (`flex h-dvh`), after the body. It shows unless `isOpen` is false, taking its
// width from the row and giving it back as it is hidden. Shown, it moves the focus into it, and
// gives it back as it goes; with `onOpenChange`, Escape hides it.
/**
 * Side sheets show secondary content anchored to the side of the screen
 *
 * Use side sheets to provide optional content and actions without interrupting the main content
 *
 * Standard side sheets are supplementary surfaces used mostly in medium to expanded
 * breakpoints, like tablet and desktop. They provide a consistent and predictable surface for
 * contextual actions and information.
 *
 * Side sheets have a fixed width and typically span the height of the screen.
 *
 * Side sheets have a default width, but can be resized depending on the needs of the layout.
 *
 * When a standard side sheet opens, the body area shrinks to accommodate the sheet’s width
 * while maintaining a margin on the body’s trailing edge.
 *
 * Entrance of standard side sheets will cause the body area to adjust and accommodate the
 * new content
 *
 * Side sheet containers hold all side sheet elements. Their size is determined by the space
 * those elements occupy.
 *
 * A close affordance provides a consistent method for dismissing a side sheet.
 *
 * Side sheets can display a wide variety of content and layouts, ranging from a list of
 * actions to supplemental content in a tabular layout.
 *
 * Side sheets can vertically scroll independent of the rest of the UI.
 *
 * This allows their scroll position and content to persist while the page is scrolled, and
 * vice versa.
 *
 * Side sheets cannot scroll horizontally.
 *
 * In right-to-left (RTL) languages, side sheets should appear on the left edge of the window
 * with all elements reversed.
 *
 * Shape: Modal side sheets have a 16dp corner radius
 *
 * Side sheet padding and size measurements:
 *
 * - Max-width: 400dp
 *
 * People should be able to dismiss the side sheet using assistive technology.
 *
 * Material requires that a close affordance, such as a close icon button, is always present
 * within a side sheet.
 *
 * The accessibility role for a side sheet is Dialog.
 *
 * @see https://m3.material.io/components/side-sheets/overview
 * @see https://m3.material.io/components/side-sheets/guidelines
 * @see https://m3.material.io/components/side-sheets/specs
 * @see https://m3.material.io/components/side-sheets/accessibility
 */
export function SideSheet({
  isModal = false,
  isOpen,
  defaultOpen,
  onOpenChange,
  preventDismissal,
  shouldCloseOnInteractOutside,
  ...props
}: SideSheetProps) {
  return isModal ? (
    <ModalSideSheet
      {...props}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      preventDismissal={preventDismissal}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
    />
  ) : (
    <StandardSideSheet {...props} isOpen={isOpen} onOpenChange={onOpenChange} />
  )
}

// A modal sheet, React Aria's, from its overlay down to its content.
function ModalSideSheet({
  isOpen,
  defaultOpen,
  onOpenChange,
  preventDismissal,
  shouldCloseOnInteractOutside,
  isDetached = false,
  role,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  'aria-details': ariaDetails,
  className,
  children,
  ...props
}: Except<SideSheetProps, 'isModal'>) {
  return (
    <SheetOverlay
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      position="end"
      preventDismissal={preventDismissal}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
      className="z-dialog"
    >
      {/* The scrim, which comes and goes with the sheet. */}
      <SheetBackdrop className="bg-scrim/32" swipeAnimation="side-sheet-scrim" />
      {/* Its fill goes on past the window's end, for the browser's bounce to show none of the page. */}
      <Sheet
        {...props}
        overscrollPadding
        className={composeTailwindRenderProps(
          className,
          sheet({ modal: true, detached: isDetached }),
        )}
      >
        {composeRenderProps(children, (children, { state }) => (
          <SheetContent
            role={role}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
            aria-describedby={ariaDescribedby}
            aria-details={ariaDetails}
            // Inert as it leaves, so nothing in it is pressed again.
            inert={!state.isOpen || undefined}
            className="side-sheet-column"
          >
            {children}
          </SheetContent>
        ))}
      </Sheet>
    </SheetOverlay>
  )
}

// Where a standard sheet is in coming and going, as React Aria says of its overlays.
type SideSheetPhase = 'entering' | 'open' | 'exiting' | 'closed'

// Whether an animation is one of the element's own still running: what React Aria waits for
// before it removes an overlay, and what a standard sheet waits for alike.
const running = (element: HTMLElement) =>
  element.getAnimations().filter((animation) => animation.playState === 'running')

type StandardSideSheetProps = Except<
  SideSheetProps,
  'isModal' | 'defaultOpen' | 'preventDismissal' | 'shouldCloseOnInteractOutside'
>

// A standard sheet, a dialog that is not modal: drawn from when it starts coming in until it has
// left, and then nothing. What is drawn mounts with each showing, as React Aria's overlays do
// theirs, for the hooks in it to start from there.
function StandardSideSheet({ isOpen = true, ...props }: StandardSideSheetProps) {
  const [phase, setPhase] = useState<SideSheetPhase>(isOpen ? 'entering' : 'closed')
  if (isOpen && (phase === 'closed' || phase === 'exiting')) setPhase('entering')
  if (!isOpen && (phase === 'entering' || phase === 'open')) setPhase('exiting')
  if (phase === 'closed') return null
  return <StandardSideSheetInner {...props} phase={phase} setPhase={setPhase} />
}

// A standard sheet as it is shown, made with React Aria's hooks, which take what they need as it
// mounts (useDialog, its title). Its own transitions move it (side-sheet.css): it takes its
// width from its row as it comes in and gives it back as it leaves, and is gone once they end.
function StandardSideSheetInner({
  phase,
  setPhase,
  onOpenChange,
  isDetached = false,
  className,
  style,
  children,
  ref,
  ...props
}: Except<StandardSideSheetProps, 'isOpen'> & {
  // Where it is in coming and going, which it moves on as its transitions start and end.
  phase: SideSheetPhase
  setPhase: Dispatch<SetStateAction<SideSheetPhase>>
}) {
  // Open until it starts to leave.
  const isOpen = phase !== 'exiting'
  const dismissible = onOpenChange !== undefined
  // Its container, which React Aria's hooks are given, and its caller's ref.
  const dialogRef = useObjectRef(ref)

  // Shown, its style is computed with the entering state on (getAnimations), which its
  // transitions then start from, and it is open before the paint, as React Aria's overlays are.
  // Hidden, it leaves, and is gone once its own transitions have ended.
  useLayoutEffect(() => {
    const element = dialogRef.current
    if (!element || phase === 'open') return
    if (phase === 'entering') {
      // One already under way, from before, would run on from where it is.
      for (const animation of running(element))
        if (animation instanceof CSSTransition) animation.cancel()
      setPhase((at) => (at === 'entering' ? 'open' : at))
      return
    }
    let over = false
    Promise.all(running(element).map((animation) => animation.finished))
      .then(() => {
        if (!over) setPhase((at) => (at === 'exiting' ? 'closed' : at))
      })
      .catch(() => {})
    return () => {
      over = true
    }
  }, [phase, setPhase, dialogRef])

  // Escape in it hides it, when it can be hidden; a click outside it does not, the page beside
  // it being in use.
  const { overlayProps } = useOverlay(
    {
      isOpen,
      onClose: () => onOpenChange?.(false),
      isDismissable: false,
      isKeyboardDismissDisabled: !dismissible,
    },
    dialogRef,
  )
  // In the dialog role, or the one it is given, named by its aria-label or by a Heading in it in
  // the title slot, its header's headline.
  const { dialogProps, titleProps } = useDialog(props, dialogRef)
  // As it comes in and goes, as React Aria's overlay and modal say.
  const entering = phase === 'entering' || undefined
  const exiting = phase === 'exiting' || undefined
  // What it passes its className, style and children, given as functions, as React Aria's sheet
  // does, with React Aria's state of an overlay its caller opens and closes (`onOpenChange`): at
  // the end of its row, the left in a right-to-left locale, and all of it showing once it is in.
  const { direction } = useLocale()
  const position = direction === 'rtl' ? 'left' : 'right'
  const overlayState = useOverlayTriggerState({ isOpen, onOpenChange })
  const renderProps: SideSheetRenderProps = {
    isEntering: phase === 'entering',
    isExiting: phase === 'exiting',
    state: overlayState,
    position,
    swipeDirection: position,
    stackIndex: 0,
    hasDescendants: false,
    isExpanded: phase === 'open',
  }
  // Its className, style and children, resolved against that as React Aria resolves its own.
  const resolved = useRenderProps({ className, style, children, values: renderProps })
  // Its focus scope moves the focus into it as it is shown, to the first button in it, and back
  // as it goes, and keeps none of it there: the page beside it stays in use. What it holds is
  // named by a Heading in the title slot and closed by a Button in the close slot, as in React
  // Aria's Dialog.
  return (
    <FocusScope autoFocus restoreFocus>
      <div
        {...mergeProps(props, dialogProps, overlayProps)}
        data-entering={entering}
        data-exiting={exiting}
        className={sheet({ modal: false, detached: isDetached, className: resolved.className })}
        style={resolved.style}
        // Inert as it leaves, so nothing in it is pressed again, and else as it is told.
        inert={!isOpen || props.inert}
        ref={dialogRef}
      >
        <div className="side-sheet-column">
          <Provider
            values={[
              [
                HeadingContext,
                { slots: { [DEFAULT_SLOT]: {}, title: { ...titleProps, level: 2 } } },
              ],
              [
                ButtonContext,
                { slots: { [DEFAULT_SLOT]: {}, close: { onPress: () => overlayState.close() } } },
              ],
            ]}
          >
            {resolved.children}
          </Provider>
        </div>
      </div>
    </FocusScope>
  )
}
