import { useLayoutEffect, useMemo, type RefObject } from 'react'
import { setInteractionModality, useFocusVisible } from 'react-aria'
import {
  DropIndicator,
  useDragAndDrop as useAriaDragAndDrop,
  type DragAndDropHooks,
  type DragAndDropOptions,
  type DropTarget,
} from 'react-aria-components'
import { ms } from '../../lib/motion'

/* useDragAndDrop: React Aria's, for a List (list.tsx), with a drag as the guidelines' video draws
 * it. React Aria's own hook drags and drops a List too, with a line for its drop indicator and
 * none of the motion here; the dragged look and the drag handle are the list's own (list.css). */

type Size = { width: number; height: number }

/* The item a pointer drags, the point of it the pointer holds, its size on the screen and its
 * room, its size in its list: one drag at a time, in whichever list it began. */
let lifted: ({ row: HTMLElement; x: number; y: number; room: Size } & Size) | undefined

/* An item's size in its list's own layout: its size on the screen, unless something scales the
 * list there, a transform or a zoom over it, and then the size its style resolves to, which is
 * the same to a thousandth of a pixel. */
function roomOf(row: Element): Size {
  const { width, height } = row.getBoundingClientRect()
  const style = getComputedStyle(row)
  const own = { width: parseFloat(style.width) || 0, height: parseFloat(style.height) || 0 }
  const scaled = Math.abs(own.width - width) > 0.01 || Math.abs(own.height - height) > 0.01
  return scaled ? own : { width, height }
}

// A pointer has just dropped: for the 100ms in which React Aria's own 50ms wait to focus runs out,
// or until a key is pressed, one React Aria takes for the keyboard's, which keeps its ring.
let dropping: ReturnType<typeof setTimeout> | undefined

type UseDroppableCollection = NonNullable<DragAndDropHooks['useDroppableCollection']>

/* React Aria rings the item a drop lands on, as a keyboard's drop should be, each time its list
 * renders until its wait is over. After a pointer's drop the list hands the modality back to the
 * pointer in the same commit, which it renders for by following the modality: no ring is drawn. */
const unringed = (useDroppableCollection: UseDroppableCollection): UseDroppableCollection =>
  function useUnringedDroppableCollection(props, state, ref) {
    const droppable = useDroppableCollection(props, state, ref)
    useFocusVisible()
    useLayoutEffect(() => {
      if (dropping) setInteractionModality('pointer')
    })
    return droppable
  }

/* What the pointer drags, in React Aria's drag preview: a copy of the item drawn as dragged and
 * of its size, its press ripple left out, with 24dp around it for its shadow, held by the point
 * the pointer took the item by. */
function renderLifted() {
  if (!lifted) return <div />
  const { row, x, y, width, height } = lifted
  const room = parseFloat(getComputedStyle(row).getPropertyValue('--spacing-space-300')) || 0
  const copy = row.cloneNode(true) as HTMLElement
  copy.setAttribute('data-dragging', 'true')
  copy.querySelector(':scope > .state-layer + *')?.replaceChildren()
  // The height its list gave the item, which the copy, out of the list, would not have of itself.
  copy.style.height = `${height}px`
  return {
    element: (
      // The width is the copy's, the room around it not counted, however the page sizes its boxes.
      <div
        aria-hidden
        style={{ boxSizing: 'content-box', width, padding: room }}
        ref={(preview) => preview?.replaceChildren(copy)}
      />
    ),
    x: x + room,
    y: y + room,
  }
}

/** Springs an element into its place from `dx`, `dy` off it, on top of what moves it already. */
function settle(el: HTMLElement, dx: number, dy: number) {
  const style = getComputedStyle(el)
  el.animate?.(
    { translate: [`${dx}px ${dy}px`, '0px 0px'] },
    {
      duration: ms(style.getPropertyValue('--md-sys-motion-spring-fast-spatial-duration')),
      easing:
        style.getPropertyValue('--md-sys-motion-spring-fast-spatial-easing').trim() || undefined,
      composite: 'add',
    },
  )
}

/* A drag as the guidelines' video has it. The placeholder is given the dragged item's room, and
 * the items it moves among slide to their new places on the fast spatial spring; so does the item
 * a pointer drops, from where the pointer left it, where the video lands it in three frames. */
function animateDrags(grid: HTMLElement | null) {
  if (!grid) return
  // Where each item and the placeholder lay when last looked at, what a move is measured from.
  const places = new Map<Element, { x: number; y: number }>()
  let spot: { x: number; y: number } | undefined
  let fresh = false
  let on = false
  // Until when the items are still followed once a drag is over, for as long as their slide takes:
  // what it dropped may come a moment after its placeholder has gone, as another list's item does.
  let settling = 0
  let landed: { x: number; y: number } | undefined

  const placeholder = () =>
    grid.querySelector<HTMLElement>(':scope > .list-placeholder[data-drop-target]')
  const note = () => {
    places.clear()
    for (const child of grid.children)
      if (child instanceof HTMLElement && child.offsetWidth && child.offsetHeight)
        places.set(child, { x: child.offsetLeft, y: child.offsetTop })
    const target = placeholder()
    spot = target ? places.get(target) : undefined
    fresh = true
  }
  // The placeholder's room, and the list's gap, which the dragged item beside it is not to add.
  const makeRoom = ({ width, height }: Size) => {
    const { rowGap, columnGap } = getComputedStyle(grid)
    const gap = grid.getAttribute('data-orientation') === 'horizontal' ? columnGap : rowGap
    grid.style.setProperty('--list-placeholder-width', `${width}px`)
    grid.style.setProperty('--list-placeholder-height', `${height}px`)
    grid.style.setProperty('--list-placeholder-gap', gap === 'normal' ? '0px' : gap)
  }

  // React Aria has changed the list: a drag began, its drop position moved, or it ended.
  const follow = () => {
    const dragged = grid.querySelector<HTMLElement>(':scope > [data-dragging]')
    const now = !!dragged || !!grid.querySelector(':scope > .list-placeholder')
    if (!now && !on && performance.now() > settling) {
      fresh = false
      places.clear()
      return
    }
    /* The placeholder's room, once a drag: that of the item the pointer took, as it took it, here
     * when React Aria marks it dragged (till then the placeholder would stand beside it) and in a
     * list it is dragged to; or of the first item a keyboard drags, or else of this list's own. */
    if (!grid.style.getPropertyValue('--list-placeholder-height')) {
      const here = lifted?.row.parentElement === grid
      const from =
        dragged ??
        (!here &&
          placeholder() &&
          (grid.ownerDocument.querySelector('.list-item-container[data-dragging]') ??
            grid.querySelector(':scope > .list-item-container')))
      const taken = lifted?.row.hasAttribute('data-dragging') ? lifted : undefined
      if (from) makeRoom(taken?.room ?? roomOf(from))
    }
    if (on || fresh) {
      for (const item of grid.querySelectorAll<HTMLElement>(':scope > .list-item-container')) {
        const was = places.get(item)
        if (landed && lifted && item.hasAttribute('data-dragging')) {
          // From where the pointer left it, a distance on the screen, in the list's own measure.
          const { left, top } = item.getBoundingClientRect()
          settle(
            item,
            ((landed.x - lifted.x - left) * lifted.room.width) / lifted.width || 0,
            ((landed.y - lifted.y - top) * lifted.room.height) / lifted.height || 0,
          )
        } else if (was && (was.x !== item.offsetLeft || was.y !== item.offsetTop)) {
          settle(item, was.x - item.offsetLeft, was.y - item.offsetTop)
        }
      }
      /* One drop position is two to React Aria, before the dragged item and after it: a
       * placeholder that comes where the last one was is there at once, with no fade of its own. */
      const next = placeholder()
      if (next && !places.has(next) && spot?.x === next.offsetLeft && spot.y === next.offsetTop)
        next.getAnimations?.().forEach((animation) => animation.finish())
    }
    landed = undefined
    note()
    if (on && !now)
      settling =
        performance.now() +
        ms(getComputedStyle(grid).getPropertyValue('--md-sys-motion-spring-fast-spatial-duration'))
    on = now
    if (now) return
    grid.style.removeProperty('--list-placeholder-width')
    grid.style.removeProperty('--list-placeholder-height')
    grid.style.removeProperty('--list-placeholder-gap')
  }

  const onDragStart = (event: DragEvent) => {
    const row = [...grid.children].find((child) => child.contains(event.target as Node))
    if (!(row instanceof HTMLElement)) return
    const { left, top, width, height } = row.getBoundingClientRect()
    const room = roomOf(row)
    lifted = { row, x: event.clientX - left, y: event.clientY - top, width, height, room }
    note()
  }
  // A drag coming in from elsewhere: where the items lie before its placeholder moves them. Its
  // room is not made here, since the list may refuse the drag.
  const onDragEnter = () => {
    if (!on) note()
  }
  const onDrop = (event: DragEvent) => {
    landed = { x: event.clientX, y: event.clientY }
    clearTimeout(dropping)
    dropping = setTimeout(() => (dropping = undefined), 100)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || event.key === 'Shift') return
    clearTimeout(dropping)
    dropping = undefined
  }

  // The rows and drop indicators that come and go, and React Aria's marks on them.
  const rows = new MutationObserver(follow)
  rows.observe(grid, { childList: true })
  const marks = new MutationObserver(follow)
  marks.observe(grid, { subtree: true, attributeFilter: ['data-dragging', 'data-drop-target'] })
  grid.addEventListener('dragstart', onDragStart)
  grid.addEventListener('dragenter', onDragEnter)
  grid.addEventListener('drop', onDrop)
  grid.ownerDocument.addEventListener('keydown', onKeyDown, true)
  return () => {
    rows.disconnect()
    marks.disconnect()
    grid.ownerDocument.removeEventListener('keydown', onKeyDown, true)
    grid.removeEventListener('dragstart', onDragStart)
    grid.removeEventListener('dragenter', onDragEnter)
    grid.removeEventListener('drop', onDrop)
  }
}

// One of React Aria's hooks for the list itself, which is given the list's element: the motion
// begins there as the list is drawn, and ends with it.
const moving = <Props, State, Result>(
  useCollection: (props: Props, state: State, ref: RefObject<HTMLElement | null>) => Result,
) =>
  function useMovingCollection(props: Props, state: State, ref: RefObject<HTMLElement | null>) {
    const collection = useCollection(props, state, ref)
    useLayoutEffect(() => animateDrags(ref.current), [ref])
    return collection
  }

// The dragged item's placeholder: React Aria's drop indicator, drawn as one (list.css).
const renderPlaceholder = (target: DropTarget) => (
  <DropIndicator target={target} className="list-placeholder" />
)

/**
 * React Aria's `useDragAndDrop` for a `List`: the same options in and `dragAndDropHooks` out, with
 * the drag drawn as the lists guidelines' video has it. A `renderDragPreview` or a
 * `renderDropIndicator` given to it replaces the lifted item or its placeholder.
 */
export function useDragAndDrop<T = object>(
  options: DragAndDropOptions<T>,
): { dragAndDropHooks: DragAndDropHooks<T> } {
  const { dragAndDropHooks } = useAriaDragAndDrop(
    useMemo(
      () => ({
        ...options,
        renderDragPreview: options.renderDragPreview ?? renderLifted,
        renderDropIndicator: options.renderDropIndicator ?? renderPlaceholder,
        // React Aria ends every drag here, that of an item its drop took off the page too.
        onDragEnd(e) {
          lifted = undefined
          options.onDragEnd?.(e)
        },
      }),
      [options],
    ),
  )
  return useMemo(() => {
    const { useDraggableCollection, useDroppableCollection } = dragAndDropHooks
    return {
      dragAndDropHooks: {
        ...dragAndDropHooks,
        // The motion is begun once in a list: with its drops, or with its drags when it takes none.
        useDraggableCollection:
          useDraggableCollection &&
          (useDroppableCollection ? useDraggableCollection : moving(useDraggableCollection)),
        useDroppableCollection: useDroppableCollection && moving(unringed(useDroppableCollection)),
      },
    }
  }, [dragAndDropHooks])
}
