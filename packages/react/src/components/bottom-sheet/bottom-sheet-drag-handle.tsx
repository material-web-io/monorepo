import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from 'react'
import { Button as AriaButton, type ButtonProps } from 'react-aria-components'
import { ms } from '../../lib/motion'
import { tv } from '../../lib/tv'
import { trackVelocity } from './velocity'

/* The handle: a React Aria Button with its native styling reset, the top 48dp of the sheet
 * across its whole width, above what is in it, which scrolls below it. A finger on it is the
 * browser's to scroll the sheet by, as anywhere else on the sheet; a mouse or pen drags it. */
const handle = tv({
  base: 'group/md-bottom-sheet-drag-handle m-0 flex h-12 w-full shrink-0 cursor-grab appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none select-none pressed:cursor-grabbing',
})

// What the focus ring is drawn around: 4dp to each side of the bar and 11dp above and below
// it, so the ring is the 50 by 36dp of the accessibility page's diagram, with its 4dp corner.
const ring = tv({
  base: 'flex h-6.5 w-10 items-center justify-center rounded-shape-xs group-focus-visible/md-bottom-sheet-drag-handle:bottom-sheet-drag-handle-focus',
})

// The bar: 32 by 4dp in on-surface-variant, round, 22dp from the top and bottom of its target.
// Not drawn while the sheet is full-screen unless the handle has the focus: it fades out on
// the default effects spring and back on the fast effects one, as guideline video 1 has it.
const bar = tv({
  base: 'h-1 w-8 rounded-shape-full bg-on-surface-variant transition-opacity duration-spring-fast-effects ease-spring-fast-effects group-data-full-screen/md-bottom-sheet:duration-spring-default-effects group-data-full-screen/md-bottom-sheet:ease-spring-default-effects group-data-full-screen/md-bottom-sheet:group-not-focus-visible/md-bottom-sheet-drag-handle:opacity-0 forced-colors:bg-canvas-text',
})

// How far a mouse or pen moves on the drag handle before it drags the sheet: less is a click.
const slop = 3

// How fast a sheet let go of has to be moving, a second, to go on to the next place it rests
// that way rather than the nearest: Compose's velocity threshold, 125dp, 1dp a pixel.
const velocityThreshold = 125

// How stiff a sheet pulled past its full height or its lowest place is: iOS's rubber band's
// constant.
const stiffness = 0.55

// How far above its full height a sheet can be pulled, at most: 24dp, 1dp a pixel.
const above = 24

// How far past its full height or its lowest place a sheet goes for a pointer that has pulled
// it `by` past there, as iOS's rubber band: less and less of the way, and never as far as
// `room`. With no room, not at all.
function rubberBand(by: number, room: number) {
  return room > 0 ? (1 - 1 / ((by * stiffness) / room + 1)) * room : 0
}

// The pull that has a sheet `beyond` past there: rubberBand's inverse, so a sheet caught as it
// springs back stays where it is.
function pullPast(beyond: number, room: number) {
  const part = beyond / room
  return part < 1 ? (room / stiffness) * (part / (1 - part)) : room
}

// What scrolls the sheet `element` is in: the nearest element around it that scrolls up and
// down, a standard sheet's layer or React Aria's sheet's scroll container.
function scrollerOf(element: Element) {
  for (let node = element.parentElement; node; node = node.parentElement)
    if (/auto|scroll/.test(getComputedStyle(node).overflowY)) return node
  return null
}

// React Aria's Button's name and `onPress`, what it does selected: with none it is only drawn,
// for a sheet no press dismisses.
export type BottomSheetDragHandleProps = Pick<ButtonProps, 'aria-label' | 'onPress'>

// Drawn first in a sheet's container (`dragHandle`), named by its `aria-label`. Selected, it
// raises, lowers or hides a standard sheet and closes a modal one (`onPress`). A mouse or pen
// drags the sheet by it, scrolling what scrolls the sheet as a finger does, rubber-banded past
// its full height and its lowest place, and lets it go to where the browser snaps it, as it
// does a swipe.
export function BottomSheetDragHandle({ onPress, ...props }: BottomSheetDragHandleProps) {
  // Whether the pointer last down on it has dragged the sheet: then the press it ends is not it
  // selected. React Aria starts a press again as the pointer comes back over it.
  const dragged = useRef(false)
  // What it keeps from snapping while it drags the sheet and lets it go, with the snapping it had.
  const held = useRef<{ scroller: HTMLElement; snap: string } | null>(null)
  // How it stops listening for a drag's moves, or for the sheet to get where it is let go to.
  const listening = useRef<(() => void) | null>(null)
  // A sheet pulled past its full height or its lowest place, and while it springs back: its
  // container, its height, how far its scroller scrolls, and the room it has to be pulled up
  // and down (rubberBand).
  const band = useRef<{
    sheet: HTMLElement
    height: number
    end: number
    up: number
    down: number
    spring?: Animation
  } | null>(null)
  const [velocity] = useState(trackVelocity)

  function listen(stop: () => void) {
    listening.current?.()
    listening.current = stop
  }
  function unlisten() {
    listening.current?.()
    listening.current = null
  }

  // Keeps `scroller` from snapping, for the pointer to scroll it anywhere.
  function hold(scroller: HTMLElement) {
    held.current ??= { scroller, snap: scroller.style.scrollSnapType }
    scroller.style.scrollSnapType = 'none'
  }

  // Lets it snap again, as it did.
  function unhold() {
    const now = held.current
    held.current = null
    if (now) now.scroller.style.scrollSnapType = now.snap
  }

  // Pulls the sheet `by` past its full height, up, or its lowest place, down
  // (--bottom-sheet-pull, bottom-sheet.css): above, it is as much taller, for what is in it to
  // run on to the bottom of what shows it, and below, as much lower.
  function pull(by: number) {
    const now = band.current
    if (!now || (!by && !now.sheet.style.getPropertyValue('--bottom-sheet-pull'))) return
    now.sheet.style.setProperty('--bottom-sheet-pull', `${by}px`)
    now.sheet.style.minHeight = `calc(${now.height}px + max(0px, var(--bottom-sheet-pull)))`
    now.sheet.style.translate = '0 max(0px, -1 * var(--bottom-sheet-pull))'
  }

  // Lets the sheet be where it rests, pulled nowhere.
  function unpull() {
    const now = band.current
    band.current = null
    if (!now) return
    now.spring?.cancel()
    for (const property of ['--bottom-sheet-pull', 'min-height', 'translate'])
      now.sheet.style.removeProperty(property)
  }

  // Lets a sheet pulled `by` past its full height or its lowest place spring back there, as
  // Compose's settles on the default spatial spring, and with reduced motion be there at once.
  function springBack(by: number) {
    const now = band.current
    if (!now || !by || matchMedia('(prefers-reduced-motion: reduce)').matches) return unpull()
    const style = getComputedStyle(now.sheet)
    const token = (name: string) =>
      style.getPropertyValue(`--md-sys-motion-spring-default-spatial-${name}`).trim()
    now.sheet.style.setProperty('--bottom-sheet-pull', '0px')
    now.spring = now.sheet.animate(
      { '--bottom-sheet-pull': [`${by}px`, '0px'] },
      { duration: ms(token('duration')), easing: token('easing') },
    )
    now.spring.onfinish = unpull
  }

  // Lets the sheet go, `speed` pixels a second down: to the nearest place it rests, or moving
  // fast enough, to the next one that way, which the browser snaps a scroll to where it is to.
  // It scrolls there from where it was let go, smoothly unless motion is reduced, and snaps
  // again once there.
  function letGo(scroller: HTMLElement, speed: number) {
    const at = scroller.scrollTop
    unhold()
    scroller.scrollTo({ top: at, behavior: 'instant' })
    const nearest = scroller.scrollTop
    if (
      (speed > velocityThreshold && nearest >= at) ||
      (speed < -velocityThreshold && nearest <= at)
    )
      scroller.scrollBy({ top: -Math.sign(speed), behavior: 'instant' })
    const target = scroller.scrollTop
    // Let go where it rests, it has come to rest there, which it tells as a scroll's end does.
    if (Math.abs(target - at) < 1) return void scroller.dispatchEvent(new Event('scrollend'))
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    hold(scroller)
    scroller.scrollTop = at
    scroller.scrollTo({ top: target, behavior: 'smooth' })
    // Once there, it snaps, before the scroll's end, where a standard sheet reads where it
    // rests; the wheel or a finger taking it on the way, it snaps from there.
    const arrive = () => {
      if (Math.abs(scroller.scrollTop - target) >= 1) return
      unlisten()
      unhold()
    }
    const taken = () => {
      unlisten()
      unhold()
    }
    scroller.addEventListener('scroll', arrive, { passive: true })
    scroller.addEventListener('wheel', taken, { passive: true })
    scroller.addEventListener('touchstart', taken, { passive: true })
    listen(() => {
      scroller.removeEventListener('scroll', arrive)
      scroller.removeEventListener('wheel', taken)
      scroller.removeEventListener('touchstart', taken)
    })
  }

  // A mouse or pen down on it: its moves, wherever they go, scroll what scrolls the sheet from
  // where that was, once they are more than a click's, until it is let go, and past its full
  // height or its lowest place pull it there less and less far. Caught as it springs back
  // there, it is held where it is. A finger's moves are the browser's.
  function grab(event: PointerEvent<HTMLElement>) {
    dragged.current = false
    const scroller = scrollerOf(event.currentTarget)
    const sheet = event.currentTarget.closest<HTMLElement>('.group\\/md-bottom-sheet')
    if (
      event.pointerType === 'touch' ||
      event.button !== 0 ||
      !(scroller instanceof HTMLElement) ||
      !sheet
    )
      return
    const { pointerId, clientY } = event
    // How far it is pulled as it is caught springing back, which it stays.
    const caught = parseFloat(getComputedStyle(sheet).getPropertyValue('--bottom-sheet-pull')) || 0
    if (band.current?.spring && caught) {
      band.current.spring.cancel()
      band.current.spring = undefined
    } else {
      unpull()
      // Where its scroller has it at its full height and at its lowest place, from where it is.
      const end = scroller.scrollHeight - scroller.clientHeight
      const box = scroller.getBoundingClientRect()
      const top = sheet.getBoundingClientRect().top
      band.current = {
        sheet,
        height: parseFloat(getComputedStyle(sheet).height),
        end,
        up: Math.min(above, top - (end - scroller.scrollTop) - Math.max(box.top, 0)),
        down: Math.min(box.bottom, innerHeight) - (top + scroller.scrollTop),
      }
    }
    const { end, up, down } = band.current!
    // Where the pointer would have its scroller from there, past either end of it too.
    const from = !caught
      ? scroller.scrollTop
      : caught > 0
        ? end + pullPast(caught, up)
        : -pullPast(-caught, down)
    pull(caught)
    const onMove = (moved: globalThis.PointerEvent) => {
      if (moved.pointerId !== pointerId) return
      const travel = moved.clientY - clientY
      if (!dragged.current && Math.abs(travel) < slop) return
      if (!dragged.current) {
        dragged.current = true
        hold(scroller)
        velocity.reset()
      }
      const to = from - travel
      pull(to > end ? rubberBand(to - end, up) : to < 0 ? -rubberBand(-to, down) : 0)
      scroller.scrollTop = to
      velocity.add(0, travel)
    }
    const onEnd = (ended: globalThis.PointerEvent) => {
      if (ended.pointerId !== pointerId) return
      unlisten()
      // Where it is let go counts too, as Compose's drag has it: let go 40ms after its last
      // move, it had stopped.
      if (dragged.current) velocity.add(0, ended.clientY - clientY)
      // Pulled below its lowest place, it is let go from there, where the browser finds the
      // places it rests, which move with it; and springs back from where it was.
      const by = parseFloat(sheet.style.getPropertyValue('--bottom-sheet-pull')) || 0
      if (by < 0) pull(0)
      if (dragged.current) letGo(scroller, velocity.velocity().y)
      else unhold()
      springBack(by)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    listen(() => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    })
  }

  // Gone, it stops listening, and lets the sheet snap again, pulled nowhere.
  const release = useEffectEvent(() => {
    unlisten()
    unhold()
    unpull()
  })
  useEffect(() => () => release(), [])

  const drawn = (
    <span className={ring()}>
      <span className={bar()} />
    </span>
  )
  if (!onPress)
    return (
      <div aria-hidden className={handle()} onPointerDown={grab}>
        {drawn}
      </div>
    )
  return (
    <AriaButton
      {...props}
      className={handle()}
      onPointerDown={grab}
      onPress={(event) => {
        if (!dragged.current || event.pointerType === 'keyboard') onPress(event)
      }}
    >
      {drawn}
    </AriaButton>
  )
}
