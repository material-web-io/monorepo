import { useMemo, type RefObject } from 'react'
import { setInteractionModality } from 'react-aria'
import {
  composeRenderProps,
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  PopoverContext,
  useSlottedContext,
  type DialogProps as AriaDialogProps,
  type ModalOverlayProps as AriaModalOverlayProps,
  type ModalRenderProps,
} from 'react-aria-components'
import { composeShouldCloseOnInteractOutside } from '../../lib/aria'
import { tv } from '../../lib/tv'

/* Focused search: React Aria's ModalOverlay, the layer; its Modal, the container; in that its
 * Dialog, the column of the bar and what is below it, drawn from what opened it (measureTrigger).
 * The fixed classes and the motion are in search.css; a layout's and a style's are picked here. */

const overlay = tv({
  base: 'search-view-overlay',
  variants: {
    layout: { docked: 'search-view-overlay-docked', 'full-screen': '' },
  },
})

const modal = tv({
  base: 'search-view',
  variants: {
    layout: { docked: 'search-view-docked', 'full-screen': 'search-view-full-screen' },
    variant: { contained: 'search-view-contained', divided: 'search-view-divided' },
  },
})

// What a SearchView passes its children, given as a function: the state React Aria reports of its
// Modal, whose `state.close()` closes it.
export type SearchViewRenderProps = ModalRenderProps

// The props `SearchView` has of its own. Their comments quote the M3 search pages, which they
// list under @see; they add no wording of our own.
type SearchViewBaseProps = {
  // Docked: a container below the search bar that opened it, as wide, over the page. Full-screen:
  // the window, the bar at its top.
  /**
   * When focused, search suggestions and results appear in a list below the search bar.
   *
   * There are two layout options:
   *
   * - Docked opens a list below the search bar, with a scrim covering main content
   * - Full-screen expands to fill the screen
   *
   * When focused, search can switch between showing suggestions or results in a:
   *
   * - Docked layout: Best for medium and expanded windows
   * - Full-screen layout: Default for compact breakpoints
   *
   * Search suggestions or results should swap from full-screen in compact windows to docked in
   * larger breakpoints.
   *
   * Docked container
   *
   * - Width: Min: 360dp, max: 720dp
   * - Height: Min: 240dp, max: 2/3 of screen height
   *
   * Full-screen container
   *
   * - Width: Full width
   * - Height: Full height
   *
   * @default 'docked'
   * @see https://m3.material.io/components/search/guidelines
   * @see https://m3.material.io/components/search/specs
   */
  layout?: 'docked' | 'full-screen'
  // Contained: the search bar keeps its own container, the list below it on one of its own.
  // Divided: one container, the bar a 56dp (docked) or 72dp (full-screen) header with a divider.
  /**
   * Search comes in two styles:
   *
   * - Contained: Has an expressive look and feel. It uses a filled container to separate a
   *   search bar from a list of suggestions or results
   * - Divided ( baseline): Doesn’t have the latest visual style, motion, or flexibility
   *
   * The contained style has a persistent, filled container, expressive motion, and rounded shape
   *
   * The divided (baseline) style uses a divider to separate the search bar from suggestions and
   * results
   *
   * In the contained style, the search bar container remains the same shape in both the
   * unfocused and focused states. Avoid changing the container behavior.
   *
   * The container’s margins should be:
   *
   * - Unfocused: 24dp
   * - Focused: 12dp
   *
   * @default 'contained'
   * @see https://m3.material.io/components/search/specs
   * @see https://m3.material.io/components/search/guidelines
   */
  variant?: 'contained' | 'divided'
  // The element focused search opens from, the search bar in the page: docked, it is drawn over
  // it, and full-screen, its bar grows out of it. Given none, the trigger of the DialogTrigger it
  // is in; and else it fades in, docked at the window's top.
  triggerRef?: RefObject<Element | null>
}

// Only what opens it, unless a DialogTrigger does, what it holds and the `aria-label` of its
// Dialog, which names it: focused search is drawn from its trigger, with nothing to customize.
export type SearchViewProps = Pick<
  AriaModalOverlayProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'children'
> &
  Pick<AriaDialogProps, 'aria-label'> &
  SearchViewBaseProps

// The trigger's box, on the layer (search.css), where it is drawn from, and its color, which the
// bar starts in: read as the layer mounts, before the scroll lock moves the layer's edges but not
// the trigger, again as the window resizes, and cleared with the trigger.
function measureTrigger(layer: HTMLDivElement, trigger: RefObject<Element | null> | undefined) {
  if (!trigger?.current) return
  const window = layer.ownerDocument.defaultView
  const measure = () => {
    const element = trigger.current
    if (!element) return
    const box = element.getBoundingClientRect()
    layer.style.setProperty('--search-view-trigger-top', `${box.top}px`)
    layer.style.setProperty('--search-view-trigger-left', `${box.left}px`)
    layer.style.setProperty('--search-view-trigger-width', `${box.width}px`)
    layer.style.setProperty('--search-view-trigger-height', `${box.height}px`)
    const color = window?.getComputedStyle(element).backgroundColor
    if (color) layer.style.setProperty('--search-view-trigger-color', color)
  }
  // It grows out of the trigger, so it need not fade in as it does with none.
  layer.style.setProperty('--search-view-trigger-opacity', '1')
  measure()
  window?.addEventListener('resize', measure)
  return () => {
    window?.removeEventListener('resize', measure)
    for (const name of ['top', 'left', 'width', 'height', 'color', 'opacity'])
      layer.style.removeProperty(`--search-view-trigger-${name}`)
  }
}

// Whether a key moves the focus, from the `active` element. Out of a text input the arrows, Home
// and the like and a letter do. In one they move its caret, unless it is an Autocomplete's whose
// listbox takes them, React Aria's virtual focus: with no option on, all but ←, → and Shift with
// Home or End. A grid an Autocomplete controls, a List, takes none from the bar: Tab reaches it.
function movesFocus({ key, shiftKey }: KeyboardEvent, active: Element | null) {
  if (key === 'Tab') return true
  const isListKey = key.startsWith('Arrow') || ['Home', 'End', 'PageUp', 'PageDown'].includes(key)
  if (!active?.matches(':read-write')) return isListKey || (key.length === 1 && key !== ' ')
  const isCaretKey =
    ['ArrowLeft', 'ArrowRight'].includes(key) || (shiftKey && ['Home', 'End'].includes(key))
  const controls = active.getAttribute('aria-controls')
  const listbox = controls ? active.ownerDocument.getElementById(controls) : null
  return (
    isListKey &&
    active.hasAttribute('aria-autocomplete') &&
    listbox?.getAttribute('role') === 'listbox' &&
    (active.hasAttribute('aria-activedescendant') || !isCaretKey)
  )
}

// The focus is ringed only where the keyboard took it, by a key that moves it, before or in it:
// else a key that types, Enter or Escape, down or up, leaves React Aria's modality the pointer's,
// which React Aria makes the keyboard's after any key (on the document, after its listener).
function keepKeyboardFocus(layer: HTMLDivElement) {
  const document = layer.ownerDocument
  let isKeyboardFocus = !!document.activeElement?.matches(
    '[data-focus-visible], :not([data-focused]):focus-visible',
  )
  if (!isKeyboardFocus) setInteractionModality('pointer')
  const onKey = (event: KeyboardEvent) => {
    if (movesFocus(event, document.activeElement)) isKeyboardFocus = true
    else if (!isKeyboardFocus) setInteractionModality('pointer')
  }
  const onPointerDown = () => {
    isKeyboardFocus = false
  }
  document.addEventListener('keydown', onKey, true)
  document.addEventListener('keyup', onKey, true)
  document.addEventListener('pointerdown', onPointerDown, true)
  return () => {
    document.removeEventListener('keydown', onKey, true)
    document.removeEventListener('keyup', onKey, true)
    document.removeEventListener('pointerdown', onPointerDown, true)
  }
}

// React Aria's Modal in its own ModalOverlay, around its Dialog, as `Dialog` is, inert as it
// leaves. It holds yours as given: a `SearchField` with `autoFocus`, then typically a `List`, in
// React Aria's `Autocomplete`; the page's bar's icon, before the back button, fades through it.
/**
 * Search can display suggested keywords or phrases as a person types
 *
 * A search bar displays search suggestions or results in a list
 *
 * When a search entry point is selected, it opens focused search.
 *
 * - Search suggestions can appear before text is entered
 * - Search results can show as someone is typing or after a search is executed
 * - Individual elements maintain their own interaction states when search is focused
 *
 * Search includes a search bar and a container for suggestions and results. The container is
 * empty by default. Use the list component to add content. In the divided (baseline) style, a
 * divider separates the search bar and results.
 *
 * Search suggestions and results both appear in a list component by default.
 *
 * The back icon releases focus, dismisses any suggestions or results, and returns the search bar
 * to its original state.
 *
 * To execute a search, a person can:
 *
 * - Type a query and press Enter
 * - Select a suggestion or result without querying a search
 *
 * Search results appear in a list below the bar, and scroll beneath the bar.
 *
 * For accessibility, focused search needs a clear status indicator that it’s searching content,
 * like a search icon or Results label.
 *
 * When search suggestions and results appear, the screen reader must announce the change. This
 * lets people know list items are available for selection.
 *
 * Keyboard navigation:
 *
 * - Tab or Shift + Tab: Navigate between interactive elements
 * - Arrows: Navigate between search result items
 *
 * @see https://m3.material.io/components/search/overview
 * @see https://m3.material.io/components/search/specs
 * @see https://m3.material.io/components/search/guidelines
 * @see https://m3.material.io/components/search/accessibility
 */
export function SearchView({
  layout = 'docked',
  variant = 'contained',
  triggerRef,
  'aria-label': ariaLabel,
  children,
  ...props
}: SearchViewProps) {
  const dialogTrigger = useSlottedContext(PopoverContext)?.triggerRef
  const trigger = triggerRef ?? dialogTrigger
  const layerRef = useMemo(
    () => (layer: HTMLDivElement | null) => {
      if (!layer) return
      const stopMeasuring = measureTrigger(layer, trigger)
      const stopKeeping = keepKeyboardFocus(layer)
      return () => {
        stopMeasuring?.()
        stopKeeping()
      }
    },
    [trigger],
  )
  return (
    <AriaModalOverlay
      {...props}
      ref={layerRef}
      isDismissable
      shouldCloseOnInteractOutside={composeShouldCloseOnInteractOutside()}
      className={overlay({ layout })}
    >
      {({ state }) => (
        <AriaModal
          // Inert as it leaves, so nothing in it is pressed again.
          inert={!state.isOpen}
          className={modal({ layout, variant })}
        >
          {composeRenderProps(children, (children) => (
            <AriaDialog aria-label={ariaLabel} className="search-view-dialog">
              {children}
            </AriaDialog>
          ))}
        </AriaModal>
      )}
    </AriaModalOverlay>
  )
}
