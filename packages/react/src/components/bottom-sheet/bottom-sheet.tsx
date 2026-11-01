import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  FocusScope,
  mergeProps,
  mergeRefs,
  Overlay,
  useDialog,
  useObjectRef,
  useOverlay,
} from 'react-aria'
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
  type DisclosureProps,
  type SheetOverlayProps,
  type SheetProps,
  type SheetRenderProps,
} from 'react-aria-components'
import { useOverlayTriggerState } from 'react-stately'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { BottomSheetDragHandle } from './bottom-sheet-drag-handle'

export { SheetTrigger, type SheetTriggerProps } from 'react-aria-components'

/* The container: surface-container-low at elevation 1 with 28dp top corners, up to 640dp wide,
 * its drag handle above what is in it. A modal one is React Aria's Sheet; a standard one is a
 * dialog of React Aria's hooks, in a layer of its own fixed to the window (bottom-sheet.css). */
const sheet = tv({
  base: 'group/md-bottom-sheet flex max-w-160 flex-col overflow-clip rounded-t-shape-xl bg-surface-container-low font-plain text-body-md text-on-surface shadow-elevation-1',
  variants: {
    modal: {
      true: 'bottom-sheet-modal',
      false: 'bottom-sheet',
    },
    fullScreen: { true: '' },
  },
  // Full-screen at its full height, a standard sheet only (bottom-sheet.css).
  compoundVariants: [{ modal: false, fullScreen: true, class: 'bottom-sheet-full-screen' }],
})

// What is in the sheet, below its drag handle: a column whose scrolling children shrink to fit
// it, and which scrolls itself when none does, its scrollbar clear of the sheet's round corners.
// Only at its full height, so that below it a swipe or the wheel raises the sheet.
const body = tv({
  base: 'flex min-h-0 grow flex-col overflow-hidden group-data-expanded/md-bottom-sheet:overflow-y-auto',
})

// What a sheet passes its className, style and children, given as functions: the state React
// Aria reports of its Sheet, whose `state.close()` closes it and which `isExpanded` at its full
// height. A standard one reports the same of itself.
export type BottomSheetRenderProps = SheetRenderProps

// Where a modal sheet opens: with half the window showing, the spec's cap, or all of it when it
// is shorter than that, a percentage being of the sheet's own height.
const half = 'min(50dvh, 100%)'

// The props `BottomSheet` adds to React Aria's. The comments on them quote the M3 bottom sheets
// pages, which each comment lists under @see; they add no wording of our own.
type BottomSheetBaseProps = {
  // Whether the sheet is modal: React Aria's sheet, in front of the page over a scrim, which it
  // makes inert, and keeping the focus, as a dialog. Else it is a dialog that is not modal: the
  // page stays in use, and the focus can leave it.
  /**
   * Modal bottom sheets are above a scrim while standard bottom sheets don't have a scrim.
   *
   * @default false
   * @see https://m3.material.io/components/bottom-sheets/specs
   */
  isModal?: boolean

  // Whether a standard sheet is full-screen at its full height: always as tall as that, and
  // there in surface, its fill over what is above it up to the window's top, its drag handle
  // not drawn (it still takes the focus). Its full height is set with `bottom-sheet-top-*`.
  /**
   * A bottom sheet can have preset positions from full-screen height to preview
   *
   * At full-screen height, standard bottom sheets contain a collapse icon in an app bar to
   * return to their initial position.
   *
   * @default false
   * @see https://m3.material.io/components/bottom-sheets/guidelines
   */
  isFullScreen?: boolean

  // Whether the sheet draws the drag handle, first in it, the top 48dp named "Drag handle"
  // (`dragHandleLabel`). On a standard sheet a click raises, lowers or, with `onOpenChange`,
  // hides it; on a modal one it closes it, as its scrim does. A finger swipes it, as anywhere,
  // and a mouse or pen drags it.
  /**
   * The drag handle can be dragged or selected to change the bottom sheet height.
   *
   * Sheets should be able to cycle through preset heights and close completely without
   * dragging. Selecting the drag handle should toggle through preset heights or close the
   * sheet, while selecting the scrim should always close the bottom sheet.
   *
   * The top 48dp portion of the bottom sheet is interactive when user-initiated resizing is
   * available and the drag handle is present.
   *
   * The optional drag handle can be focused in the tab order and interacted with using
   * non-touch inputs, such as keyboard or switch controls.
   *
   * Keyboard navigation:
   * - Tab: Focus lands on drag handle
   * - Space / Enter: Toggles between available heights
   *
   * Label only the drag handle. The accessibility role for the drag handle is “button.”
   *
   * @default true
   * @see https://m3.material.io/components/bottom-sheets/guidelines
   * @see https://m3.material.io/components/bottom-sheets/accessibility
   */
  hasDragHandle?: boolean

  // The drag handle's name, for another language.
  /**
   * Label only the drag handle. The accessibility role for the drag handle is “button.”
   *
   * @default 'Drag handle'
   * @see https://m3.material.io/components/bottom-sheets/accessibility
   */
  dragHandleLabel?: string
}

// React Aria's props: its dialog's, with its sheet's className, style and children, those of the
// overlay a modal sheet is, and a disclosure's, whether a standard one is at its full height.
// Then its own.
export type BottomSheetProps = Except<
  DialogProps,
  'children' | 'className' | 'style' | 'render' | 'slot' | 'isEntering'
> &
  Pick<SheetProps, 'children' | 'className' | 'style'> &
  RefProps<HTMLDivElement> &
  Pick<
    SheetOverlayProps,
    | 'isOpen'
    | 'defaultOpen'
    | 'onOpenChange'
    | 'snapPoints'
    | 'preventDismissal'
    | 'shouldCloseOnInteractOutside'
  > &
  Pick<DisclosureProps, 'isExpanded' | 'defaultExpanded' | 'onExpandedChange'> &
  BottomSheetBaseProps

// The container in either kind, which takes the props and `ref`, says `data-expanded` at its
// full height and, a standard one, `data-full-screen` while full-screen there, and takes its
// width and full height from its class (`max-w-none`, `bottom-sheet-top-*`). What it holds goes
// under the drag handle, and what scrolls is yours: an element in it with `overflow-y-auto`
// scrolls under the drag handle, else all it holds does, at the sheet's full height.
// A modal one is React Aria's sheet: `SheetOverlay`, the layer, holding `SheetBackdrop`, the
// scrim, and `Sheet`, the container, which holds `SheetContent`, React Aria's Dialog, in the
// `dialog` role, which takes the `role` and `aria-label`: give it one. It opens in a
// `SheetTrigger` or by `isOpen`, with half the window showing (`snapPoints`).
// A standard one is a dialog that is not modal, of React Aria's hooks: the container, in the
// `dialog` role, which takes the `role` and `aria-label` (give it one, or a `Heading` in it in
// the `title` slot), rendered at the end of the page in a layer that the page shows through,
// fixed to the window, or where React Aria's `UNSAFE_PortalProvider` puts it. It shows unless
// `isOpen` is false, with 56dp showing partially expanded (`snapPoints`). Shown, it moves the
// focus to its drag handle, and gives it back as it goes; with `onOpenChange`, Escape and a
// `Button` in it in the `close` slot hide it. It is at its full height as `isExpanded` says, or
// else as it holds that itself, from `defaultExpanded` each time it is shown, and always with no
// `snapPoints`; once a swipe, the wheel, the drag handle or the focus has raised or lowered it,
// it calls `onExpandedChange`.
/**
 * Bottom sheets show secondary content anchored to the bottom of the screen
 *
 * Standard bottom sheets co-exist with the screen’s main UI region and allow for
 * simultaneously viewing and interacting with both regions, especially when the main UI
 * region is frequently scrolled or panned.
 *
 * Like dialogs, modal bottom sheets appear in front of app content, disabling all other
 * app functionality when they appear, and remaining on screen until confirmed, dismissed,
 * or a required action has been taken.
 *
 * Use a standard bottom sheet to display content that complements the screen’s primary
 * content, such as an audio player in a music app.
 *
 * Use a modal bottom sheet as an alternative to inline menus or simple dialogs on mobile,
 * especially when offering a long list of action items, or when items require longer
 * descriptions and icons.
 *
 * Modal bottom sheets appear when triggered by a user action, such as tapping a button or
 * an overflow icon. They can be dismissed by:
 * - Tapping a menu item or action within the bottom sheet
 * - Tapping the scrim
 * - Swiping the sheet down
 * - Using a close affordance within the bottom sheet’s app bar, if available
 *
 * Display a close affordance in a full-screen modal bottom sheet.
 *
 * Bottom sheet containers hold all bottom sheet elements. Their size is determined by the
 * space those elements occupy.
 *
 * Bottom sheets span the full window width up to 640dp. When the window width exceeds
 * 640dp, bottom sheets adjust to have a top margin of 56dp and side margins of 56dp.
 *
 * For larger screens with medium and expanded breakpoints, bottom sheets have a default
 * max-width to prevent undesired layouts and awkward spacing. However, this can be
 * overridden if needed.
 *
 * Bottom sheets should be scrollable when their content exceeds the initial viewable height
 *
 * A bottom sheet can have preset positions from full-screen height to preview
 *
 * To provide access to its top actions, the initial vertical position of modal bottom
 * sheets is capped at 50% of the screen height.
 *
 * Modal bottom sheets whose contents exceed 50% of the screen height can then be pulled
 * across the full screen and scrolled internally to access their remaining items.
 *
 * Use bottom sheets in compact and medium breakpoints
 *
 * @see https://m3.material.io/components/bottom-sheets/overview
 * @see https://m3.material.io/components/bottom-sheets/guidelines
 * @see https://m3.material.io/components/bottom-sheets/specs
 */
export function BottomSheet({
  isModal = false,
  isOpen,
  defaultOpen,
  onOpenChange,
  snapPoints,
  preventDismissal,
  shouldCloseOnInteractOutside,
  isExpanded,
  defaultExpanded,
  onExpandedChange,
  isFullScreen,
  ...props
}: BottomSheetProps) {
  return isModal ? (
    <ModalBottomSheet
      {...props}
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      preventDismissal={preventDismissal}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
    />
  ) : (
    <StandardBottomSheet
      {...props}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      isExpanded={isExpanded}
      defaultExpanded={defaultExpanded}
      onExpandedChange={onExpandedChange}
      isFullScreen={isFullScreen}
    />
  )
}

// A modal sheet, React Aria's, from its overlay down to its content.
function ModalBottomSheet({
  isOpen,
  defaultOpen,
  onOpenChange,
  snapPoints = [half],
  preventDismissal,
  shouldCloseOnInteractOutside,
  hasDragHandle = true,
  dragHandleLabel = 'Drag handle',
  role,
  'aria-label': ariaLabel,
  className,
  children,
  ...props
}: Except<
  BottomSheetProps,
  'isModal' | 'isExpanded' | 'defaultExpanded' | 'onExpandedChange' | 'isFullScreen'
>) {
  return (
    <SheetOverlay
      isOpen={isOpen}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      preventDismissal={preventDismissal}
      shouldCloseOnInteractOutside={shouldCloseOnInteractOutside}
      className="z-dialog"
    >
      {/* The scrim, which comes and goes with the sheet up to where it opens. */}
      <SheetBackdrop
        className="bg-scrim/32"
        swipeAnimation="bottom-sheet-scrim"
        swipeAnimationRange={{ end: 0 }}
      />
      {/* Its fill goes on below the window, for the browser's bounce to show none of the page. */}
      <Sheet
        {...props}
        overscrollPadding
        className={composeTailwindRenderProps(className, sheet({ modal: true }))}
      >
        {composeRenderProps(children, (children, { state }) => (
          <SheetContent
            role={role}
            aria-label={ariaLabel}
            // Inert as it leaves, so nothing in it is pressed again.
            inert={!state.isOpen || undefined}
            className="flex min-h-0 grow flex-col outline-none"
          >
            {hasDragHandle && (
              <BottomSheetDragHandle
                aria-label={dragHandleLabel}
                onPress={preventDismissal ? undefined : () => state.close()}
              />
            )}
            <div className={body()}>{children}</div>
          </SheetContent>
        ))}
      </Sheet>
    </SheetOverlay>
  )
}

// How near its full height a sheet scrolled up is when it turns full-screen, as guideline
// video 1 has it: 17.5dp, while the finger still has it.
const fullScreenReach = 17.5

// How long a scroll has been still for once it has ended, where the browser does not say so:
// 100ms, after which WebKit's latching of a wheel's scroll lapses.
const stillness = 100

// Where a standard sheet rests partially expanded unless set: 56dp of it showing, Compose's
// SheetPeekHeight.
const peekHeight = 'var(--spacing-space-700)'

// Where a standard sheet is in coming and going, as React Aria says of its overlays.
type BottomSheetPhase = 'entering' | 'open' | 'exiting' | 'closed'

// Where a sheet rests in its layer, as how far the layer is scrolled: partially expanded at each
// of its detents, its peek showing, and at its full height, all of it; and the least of it that
// shows at rest, all of it with no detents. Lengths the stylesheet computes (bottom-sheet.css).
function stopsOf(layer: HTMLElement, panel: HTMLElement, detents: HTMLElement) {
  const height = panel.offsetHeight
  const peeks = Array.from(
    detents.children as HTMLCollectionOf<HTMLElement>,
    (detent) => detent.offsetHeight,
  )
  // Scrolled this far, none of it shows: its top is at the layer's bottom.
  const none = panel.offsetTop - layer.clientHeight
  return {
    partials: peeks.map((peek) => none + peek),
    full: none + height,
    least: Math.min(height, ...peeks),
  }
}

// Whether resting at `low` is below resting at `high`, and so a place apart from it.
const apart = (low: number, high: number) => high - low >= 1

// How far toward `top` the layer can be scrolled: all the way, unless it holds too little.
const reach = (layer: HTMLElement, top: number) =>
  Math.min(top, layer.scrollHeight - layer.clientHeight)

// Scrolls the layer to `top`, smoothly unless motion is reduced, as React Aria's sheet does.
function scroll(layer: HTMLElement, top: number) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  layer.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' })
}

type StandardBottomSheetProps = Except<
  BottomSheetProps,
  'isModal' | 'defaultOpen' | 'preventDismissal' | 'shouldCloseOnInteractOutside'
>

// A standard sheet, a dialog that is not modal: drawn from when it starts coming in until it has
// left, and then nothing. What is drawn mounts with each showing, as React Aria's overlays do
// theirs, for the hooks in it to start from there.
function StandardBottomSheet({ isOpen = true, ...props }: StandardBottomSheetProps) {
  const [phase, setPhase] = useState<BottomSheetPhase>(isOpen ? 'entering' : 'closed')
  if (isOpen && (phase === 'closed' || phase === 'exiting')) setPhase('entering')
  if (!isOpen && (phase === 'entering' || phase === 'open')) setPhase('exiting')
  if (phase === 'closed') return null
  return <StandardBottomSheetInner {...props} phase={phase} setPhase={setPhase} />
}

// A standard sheet as it is shown, made with React Aria's hooks, which take what they need as it
// mounts (useDialog, its title). The browser snaps it where it rests (bottom-sheet.css): its
// layer, which the page shows through, scrolls it as React Aria's does a modal one, from below
// what is above it there to its full height, and it marks where it rests partially expanded.
function StandardBottomSheetInner({
  phase,
  setPhase,
  onOpenChange,
  snapPoints = [peekHeight],
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
  isFullScreen = false,
  hasDragHandle = true,
  dragHandleLabel = 'Drag handle',
  className,
  style,
  children,
  ref,
  ...props
}: Except<StandardBottomSheetProps, 'isOpen'> & {
  // Where it is in coming and going, which it moves on once a scroll has taken it there.
  phase: BottomSheetPhase
  setPhase: Dispatch<SetStateAction<BottomSheetPhase>>
}) {
  // Open until it starts to leave.
  const isOpen = phase !== 'exiting'
  // Where its elements are kept: the layer it scrolls in, what is above it there, itself, and
  // what holds its detents.
  const [layer, setLayer] = useState<HTMLElement | null>(null)
  const [above, setAbove] = useState<HTMLElement | null>(null)
  const [panel, setPanel] = useState<HTMLElement | null>(null)
  const [detents, setDetents] = useState<HTMLElement | null>(null)
  const [own, setOwn] = useState(defaultExpanded)
  // Which of its snapPoints it rests at partially expanded: the first, where React Aria's opens.
  const [snapPoint, setSnapPoint] = useState(0)
  // Shown again as it leaves, it starts where it is set to start, coming in from where it is.
  const [shown, setShown] = useState(isOpen)
  if (shown !== isOpen) {
    setShown(isOpen)
    if (isOpen) {
      setOwn(defaultExpanded)
      setSnapPoint(0)
    }
  }
  if (snapPoint > 0 && snapPoint >= snapPoints.length) setSnapPoint(0)
  // Its snapPoints as one key, for what is measured from them to be measured again as they change.
  const points = snapPoints.join(' ')
  // Counts the scrolls it came to rest after, so one its caller holds elsewhere goes back.
  const [rests, setRests] = useState(0)
  const dismissible = onOpenChange !== undefined

  // Where it is, which the listeners below read when an event comes, set after every render: at
  // its full height as `isExpanded` says, or else as it holds that itself, and always with no
  // snapPoints.
  const state = {
    isOpen,
    isExpanded: snapPoints.length === 0 || (isExpanded ?? own),
    snapPoint,
    phase,
    onOpenChange,
    isFullScreen,
    setExpanded(next: boolean) {
      if (next === state.isExpanded) return
      setOwn(next)
      onExpandedChange?.(next)
    },
  }
  const latest = useRef(state)
  useLayoutEffect(() => {
    latest.current = state
  })

  // Where a scroll of its own is taking it, until that ends or a wheel or a finger takes it.
  const heading = useRef<number | undefined>(undefined)

  // Hidden only by its caller, it rests no lower than its lowest peek, as React Aria's sheet does
  // with preventDismissal: what is above it is shorter by that. Not while it comes and goes, which
  // needs the room. It stays where it is as that changes, and as its height does.
  useLayoutEffect(() => {
    if (!layer || !above || !panel || !detents) return
    const clamped = phase === 'open' && !dismissible
    const fit = () => {
      const before = panel.getBoundingClientRect().top
      if (clamped)
        above.style.setProperty('height', `calc(100% - ${stopsOf(layer, panel, detents).least}px)`)
      else above.style.removeProperty('height')
      const moved = panel.getBoundingClientRect().top - before
      if (moved) layer.scrollBy({ top: moved, behavior: 'instant' })
    }
    fit()
    if (!clamped) return
    const observer = new ResizeObserver(fit)
    observer.observe(panel)
    observer.observe(layer)
    return () => observer.disconnect()
  }, [phase, dismissible, points, layer, above, panel, detents])

  // Shown, it scrolls in from below to where it starts; hidden, it scrolls out, and is gone:
  // once it is there, not at the end of a scroll that kept it in place above.
  useLayoutEffect(() => {
    if (!layer || !panel || !detents || (phase !== 'entering' && phase !== 'exiting')) return
    const { partials, full } = stopsOf(layer, panel, detents)
    const { isExpanded, snapPoint } = latest.current
    const target = reach(layer, phase === 'exiting' ? 0 : isExpanded ? full : partials[snapPoint]!)
    let over = false
    const done = () => {
      if (over || Math.abs(layer.scrollTop - target) >= 1) return
      setPhase((at) => (at !== phase ? at : at === 'entering' ? 'open' : 'closed'))
    }
    layer.addEventListener('scrollend', done)
    if (Math.abs(layer.scrollTop - target) < 1) queueMicrotask(done)
    else scroll(layer, target)
    return () => {
      over = true
      layer.removeEventListener('scrollend', done)
    }
  }, [phase, setPhase, layer, panel, detents])

  // Open, it goes where it is set to be: raised, lowered, or back where it was held.
  useLayoutEffect(() => {
    if (phase !== 'open' || !layer || !panel || !detents) return
    const { partials, full } = stopsOf(layer, panel, detents)
    const target = reach(layer, state.isExpanded ? full : partials[snapPoint]!)
    if (Math.abs(layer.scrollTop - target) < 1) return
    heading.current = target
    scroll(layer, target)
  }, [phase, state.isExpanded, snapPoint, rests, layer, panel, detents])

  // A `fullScreen` sheet is full-screen at its full height, and there again once it rests
  // there; a scroll takes it out and back in on its own (below).
  useLayoutEffect(() => {
    panel?.toggleAttribute('data-full-screen', isFullScreen && isOpen && state.isExpanded)
  }, [isFullScreen, isOpen, state.isExpanded, rests, panel])

  // Where the browser does not say when a scroll ends (WebKit, Safari 26.0), its layer says it
  // itself, for it to come and go and rest: once it has scrolled and been still since for a
  // while (stillness), with no finger on it.
  useEffect(() => {
    if (!layer || 'onscrollend' in window) return
    let [timer, scrolled, touched] = [0, false, false]
    const settle = () => {
      clearTimeout(timer)
      if (!scrolled || touched) return
      timer = window.setTimeout(() => {
        scrolled = false
        layer.dispatchEvent(new Event('scrollend'))
      }, stillness)
    }
    const onScroll = () => {
      scrolled = true
      settle()
    }
    const onTouch = (event: TouchEvent) => {
      touched = event.touches.length > 0
      settle()
    }
    layer.addEventListener('scroll', onScroll, { passive: true })
    for (const type of ['touchstart', 'touchend', 'touchcancel'] as const)
      layer.addEventListener(type, onTouch, { passive: true })
    return () => {
      clearTimeout(timer)
      layer.removeEventListener('scroll', onScroll)
      for (const type of ['touchstart', 'touchend', 'touchcancel'] as const)
        layer.removeEventListener(type, onTouch)
    }
  }, [layer])

  useEffect(() => {
    if (!layer || !panel || !detents) return
    let last = layer.scrollTop

    // A full-screen one stops being that as it first moves down from its full height, and is
    // again once raised near it.
    function onScroll() {
      const top = layer!.scrollTop
      const { isOpen, isFullScreen } = latest.current
      if (isFullScreen) {
        const { full } = stopsOf(layer!, panel!, detents!)
        if (top < last && top < full - 0.5) panel!.removeAttribute('data-full-screen')
        else if (isOpen && top > last && top >= full - fullScreenReach)
          panel!.setAttribute('data-full-screen', '')
      }
      last = top
    }

    // Come to rest after a swipe, the wheel, the focus or a drag of its handle, it is where it
    // rests: hidden below its peeks, which is its caller's to do, at one of them, or at its full
    // height. Its own scrolls set nothing, and nor does one while its handle keeps it unsnapped.
    function onScrollEnd() {
      const { phase, onOpenChange, setExpanded } = latest.current
      if (phase !== 'open') return
      if (heading.current !== undefined) {
        heading.current = undefined
        return
      }
      if (layer!.style.scrollSnapType === 'none') return
      const top = layer!.scrollTop
      const { partials, full } = stopsOf(layer!, panel!, detents!)
      const lower = partials.filter((partial) => apart(partial, full))
      const stops = onOpenChange ? [0, ...lower, full] : [...lower, full]
      const rest = stops.reduce((a, b) => (Math.abs(b - top) < Math.abs(a - top) ? b : a))
      if (onOpenChange && rest === 0) onOpenChange(false)
      else if (lower.length) {
        if (rest !== full) setSnapPoint(partials.indexOf(rest))
        setExpanded(rest === full)
      }
      setRests((count) => count + 1)
    }

    const takeOver = () => {
      heading.current = undefined
    }

    layer.addEventListener('scroll', onScroll, { passive: true })
    layer.addEventListener('scrollend', onScrollEnd)
    layer.addEventListener('wheel', takeOver, { passive: true })
    layer.addEventListener('touchstart', takeOver, { passive: true })
    return () => {
      layer.removeEventListener('scroll', onScroll)
      layer.removeEventListener('scrollend', onScrollEnd)
      layer.removeEventListener('wheel', takeOver)
      layer.removeEventListener('touchstart', takeOver)
    }
  }, [layer, panel, detents])

  // The drag handle, selected, as Compose's: a sheet short of its full height is raised, to the
  // next of its peeks up or else its full height; at it, hidden if it can be and else lowered to
  // its lowest peek.
  const toggle = useCallback(() => {
    const { isOpen, isExpanded, snapPoint, onOpenChange, setExpanded } = latest.current
    if (!isOpen || !layer || !panel || !detents) return
    const { partials, full } = stopsOf(layer, panel, detents)
    // Its snapPoints short of its full height, the lowest first.
    const lower = [...partials.keys()]
      .filter((index) => apart(partials[index]!, full))
      .sort((a, b) => partials[a]! - partials[b]!)
    const next = isExpanded
      ? undefined
      : lower.find((index) => apart(partials[snapPoint]!, partials[index]!))
    if (next !== undefined) setSnapPoint(next)
    else if (lower.length && !isExpanded) setExpanded(true)
    else if (onOpenChange) onOpenChange(false)
    else if (lower.length) {
      setSnapPoint(lower[0]!)
      setExpanded(false)
    }
  }, [layer, panel, detents])

  // Its container, which React Aria's hooks are given, and its caller's ref.
  const dialogRef = useObjectRef(ref)
  const mergedRef = useMemo(
    () => mergeRefs<HTMLDivElement | null>(setPanel, dialogRef),
    [dialogRef],
  )
  // Escape in it hides it, when it can be hidden; a click outside it does not, the page around
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
  // the title slot.
  const { dialogProps, titleProps } = useDialog(props, dialogRef)
  // As it comes in and goes, as React Aria's overlay and modal say.
  const entering = phase === 'entering' || undefined
  const exiting = phase === 'exiting' || undefined
  // What it passes its className, style and children, given as functions, as React Aria's sheet
  // does, with React Aria's state of an overlay its caller opens and closes (`onOpenChange`).
  const overlayState = useOverlayTriggerState({ isOpen, onOpenChange })
  const renderProps: BottomSheetRenderProps = {
    isEntering: phase === 'entering',
    isExiting: phase === 'exiting',
    state: overlayState,
    position: 'bottom',
    swipeDirection: 'bottom',
    stackIndex: 0,
    hasDescendants: false,
    isExpanded: state.isExpanded,
  }
  // Its className, style and children, resolved against that as React Aria resolves its own.
  const resolved = useRenderProps({ className, style, children, values: renderProps })
  // At the end of the page, as React Aria's overlays are. Its focus scope moves the focus into it
  // as it is shown, to its drag handle first, and back as it goes, and keeps none of it there:
  // the focus comes and goes, as the page stays in use. It is the only one: with the overlay's
  // own around it, neither gives the focus back once inert has taken it from the sheet.
  return (
    <Overlay disableFocusManagement>
      <FocusScope autoFocus restoreFocus>
        <div
          ref={setLayer}
          data-entering={entering}
          data-exiting={exiting}
          className="bottom-sheet-layer"
        >
          <div ref={setAbove} aria-hidden className="bottom-sheet-above" />
          <div
            {...mergeProps(props, dialogProps, overlayProps)}
            data-entering={entering}
            data-exiting={exiting}
            data-expanded={state.isExpanded || undefined}
            className={sheet({
              modal: false,
              fullScreen: isFullScreen,
              className: resolved.className,
            })}
            style={resolved.style}
            // Inert as it leaves, so nothing in it is pressed again, and else as it is told.
            inert={!isOpen || props.inert}
            ref={mergedRef}
          >
            {/* What it holds, as a modal one's SheetContent does, apart from its detents: named by
             * a Heading in the title slot and hidden by a Button in the close slot, as there. */}
            <div className="bottom-sheet-content">
              {hasDragHandle && (
                <BottomSheetDragHandle aria-label={dragHandleLabel} onPress={toggle} />
              )}
              <div className={body()}>
                <Provider
                  values={[
                    [
                      HeadingContext,
                      { slots: { [DEFAULT_SLOT]: {}, title: { ...titleProps, level: 2 } } },
                    ],
                    [
                      ButtonContext,
                      {
                        slots: {
                          [DEFAULT_SLOT]: {},
                          close: { onPress: () => overlayState.close() },
                        },
                      },
                    ],
                  ]}
                >
                  {resolved.children}
                </Provider>
              </div>
            </div>
            <div ref={setDetents} aria-hidden className="bottom-sheet-detents">
              {snapPoints.map((point, index) => (
                <div
                  key={index}
                  className="bottom-sheet-detent"
                  style={
                    {
                      '--bottom-sheet-peek': typeof point === 'number' ? `${point}px` : point,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </FocusScope>
    </Overlay>
  )
}
