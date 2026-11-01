import { render, screen, waitFor } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { MenuTrigger } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import {
  computedColor,
  computedStyleOf,
  contrastRatio,
  press,
  pressEscape,
  Scheme,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { Button } from '../button'
import { Menu, MenuItem, MenuPopover } from '../menu'
import { BottomSheet, SheetTrigger, type BottomSheetProps } from '.'

/* What needs a real browser and stylesheet: where a sheet sits and how much of it shows, its
 * fill, the scrim, the drag handle, how it moves, the wheel, the focus, contrast and forced
 * colors. Markup, roles and what closes a sheet: bottom-sheet.test.tsx. */

// The window the modal sheets are shown in: a phone's, and the test page's own after.
const [compact, wide] = [
  [412, 800],
  [1280, 896],
] as const

const frame = () => new Promise(requestAnimationFrame)
const panel = () => screen.getByTestId('panel')
const dialog = () => screen.getByRole('dialog')
// A modal sheet's layer, React Aria's SheetOverlay at the end of the page, and the scrim in it.
const layer = () => panel().closest('body > *')!
const scrim = () => layer().firstElementChild!
// A standard sheet's layer, which scrolls it, around it.
const standardLayer = () => panel().parentElement!
const handle = () => screen.getByRole('button', { name: 'Drag handle' })
const rect = (el: Element) => el.getBoundingClientRect()
const role = (name: string, el: Element) => computedColor(`var(--md-sys-color-${name})`, el)
/** How much of a sheet shows: from its top to the bottom of what it is positioned in. */
const shown = (el: HTMLElement, within = innerHeight) => within - rect(el).top

/** Lets a modal sheet come in: React Aria says it is entering until its scroll has ended. */
async function opened() {
  await waitFor(() => expect(layer()).not.toHaveAttribute('data-entering'))
  await frame()
  await frame()
}

/** Lets a modal sheet come to rest where a scroll takes it: still for ten frames, or gone. */
async function still() {
  let [last, same] = [NaN, 0]
  while (same < 10) {
    await frame()
    const sheet = screen.queryByTestId('panel')
    if (!sheet) return
    same = rect(sheet).top === last ? same + 1 : 0
    last = rect(sheet).top
  }
}

/** Turns a wheel over `target` by `dy`, and lets the sheet scroll to where it then rests. */
async function wheel(target: Element, dy: number) {
  await userEvent.wheel(target, { delta: { y: dy } })
  await still()
}

// iOS's rubber band: how far a sheet goes for a pull past where it can go, with `room` to go.
const rubberBand = (pull: number, room: number) => (1 - 1 / ((pull * 0.55) / room + 1)) * room

/**
 * Holds a mouse down at `x`, `y` in the window and moves it by each of `dys` from there, a
 * frame apart, reading `read` after each move; it is let go unless `held`.
 */
async function pullBy<T>(x: number, y: number, dys: number[], read: () => T, held = false) {
  await commands.pointer('html', x, y, 'down')
  const reads: T[] = []
  for (const dy of dys) {
    await commands.pointer('html', x, y + dy)
    await frame()
    reads.push(read())
  }
  if (!held) await commands.pointer('html', x, y + dys.at(-1)!, 'up')
  return reads
}

/**
 * Drags the handle by `dy` with the mouse in six moves, let go moving fast however slow the
 * runner is: the clock the handle times the pointer by goes on 8ms with each move and the
 * release, as a pointer moving steadily does, and stands still between them.
 */
async function fling(dy: number) {
  const start = performance.now()
  let moves = 0
  const moved = () => void moves++
  const types = ['pointermove', 'pointerup'] as const
  types.forEach((type) => window.addEventListener(type, moved, true))
  const clock = vi.spyOn(performance, 'now').mockImplementation(() => start + moves * 8)
  try {
    await commands.drag('Drag handle', dy, 6)
  } finally {
    clock.mockRestore()
    types.forEach((type) => window.removeEventListener(type, moved, true))
  }
}

/** The spring a sheet springs back on, as it does: its duration in ms. */
/** Lets a standard sheet come to rest: in, and still where its layer has scrolled it. */
async function atRest() {
  await waitFor(() =>
    expect(document.querySelector('[data-testid="panel"][data-entering]')).toBeNull(),
  )
  await still()
  await settle()
}

/** `count` rows 56dp tall: more than half a window of them make a sheet with two heights. */
const Rows = ({ count }: { count: number }) =>
  Array.from({ length: count }, (_, index) => (
    <button key={index} type="button" className="block h-14 w-full shrink-0">
      Row {index + 1}
    </button>
  ))

/** `count` rows in an element of their own that scrolls them, as a sheet's content does. */
const Scroller = ({ count }: { count: number }) => (
  <div data-testid="content" className="overflow-y-auto">
    <Rows count={count} />
  </div>
)
const content = () => screen.getByTestId('content')
/** What is in a sheet, below its drag handle, which scrolls when nothing in it does. */
const body = () =>
  panel()
    .querySelector('[role="dialog"], .bottom-sheet-content')!
    .querySelector<HTMLElement>(':scope > div:not([aria-hidden])')!

/** A modal sheet and the button that opens it, in React Aria's SheetTrigger. */
function Modal({
  rows = 3,
  defaultOpen = true,
  children,
  ...props
}: BottomSheetProps & { rows?: number; children?: ReactNode }) {
  return (
    <SheetTrigger defaultOpen={defaultOpen}>
      <Button>Open</Button>
      <BottomSheet isModal aria-label="Actions" data-testid="panel" {...props}>
        {children ?? <Rows count={rows} />}
      </BottomSheet>
    </SheetTrigger>
  )
}

/**
 * A standard sheet in a screen of its own, 360 by 640, in place of the window: React Aria's
 * portal provider renders the sheet at the end of it, which holds what is fixed in it
 * (contain-layout).
 */
function Standard({
  rows = 12,
  handled = true,
  children,
  ...props
}: BottomSheetProps & { rows?: number; handled?: boolean }) {
  const [frame, setFrame] = useState<HTMLElement | null>(null)
  return (
    <div
      ref={setFrame}
      data-testid="screen"
      className="[container-type:size] relative h-160 w-90 overflow-clip contain-layout"
    >
      <button type="button" className="h-14 w-full">
        Behind
      </button>
      {frame && (
        <UNSAFE_PortalProvider getContainer={() => frame}>
          <BottomSheet aria-label="Player" data-testid="panel" {...props} hasDragHandle={handled}>
            {children ?? <Rows count={rows} />}
          </BottomSheet>
        </UNSAFE_PortalProvider>
      )}
    </div>
  )
}

const screenBottom = () => rect(screen.getByTestId('screen')).bottom
const screenTop = () => rect(screen.getByTestId('screen')).top

/**
 * The spring a sheet springs back on once the pointer is let go, paused as it starts, in the page:
 * the pointer's answer can come after it has run its course. Called before the release.
 */
function springOnRelease() {
  const sheet = panel()
  const animate = sheet.animate.bind(sheet)
  return new Promise<{ animation: Animation; duration: number }>((resolve) => {
    vi.spyOn(sheet, 'animate').mockImplementationOnce((...args) => {
      const animation = animate(...args)
      animation.pause()
      resolve({ animation, duration: Number(animation.effect!.getTiming().duration) })
      return animation
    })
  })
}

/** Reads a sheet a frame at a time, from now until `done` says it is where it goes. */
async function track<T>(read: () => T, done: () => boolean) {
  const read_: T[] = []
  for (let count = 0; count < 300 && (read_.length === 0 || !done()); count++) {
    read_.push(read())
    await frame()
  }
  read_.push(read())
  return read_
}

/** Lets the pointer go at `x`, `y` and tracks the sheet from as the page hears it, however late. */
async function trackRelease<T>(x: number, y: number, read: () => T, done: () => boolean) {
  const released = new Promise((resolve) =>
    window.addEventListener('pointerup', resolve, { once: true }),
  )
  const release = commands.pointer('html', x, y, 'up')
  await released
  const reads = await track(read, done)
  await release
  return reads
}

describe('a modal sheet (browser)', () => {
  beforeEach(async () => {
    await page.viewport(...compact)
  })
  afterEach(async () => {
    await page.viewport(...wide)
  })

  describe('modal', () => {
    it('makes the page inert behind it, and gives it back with the focus once it is gone', async () => {
      const { container } = render(<Modal defaultOpen={false} />)
      const opener = screen.getByRole('button', { name: 'Open' })
      await userEvent.click(opener)
      await opened()
      expect(container.inert).toBe(true)
      expect(document.documentElement.style.overflow).toBe('hidden')
      opener.focus()
      expect(opener).not.toHaveFocus()
      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
      expect(container.inert).toBe(false)
      expect(document.documentElement.style.overflow).toBe('')
      await waitFor(() => expect(opener).toHaveFocus())
    })

    it('leaves a Menu in it in use, in front of it, and its Escape to the Menu', async () => {
      const onPick = vi.fn()
      render(
        <Modal>
          <MenuTrigger>
            <Button variant="text">Options</Button>
            <MenuPopover>
              <Menu>
                <MenuItem textValue="Pick" onAction={onPick}>
                  Pick
                </MenuItem>
              </Menu>
            </MenuPopover>
          </MenuTrigger>
        </Modal>,
      )
      await opened()
      const options = screen.getByRole('button', { name: 'Options' })
      await userEvent.click(options)
      let item = await screen.findByRole('menuitem', { name: 'Pick' })
      // Rendered after the sheet's layer, in front of it, where the pointer and focus can go.
      expect(layer().compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      const box = rect(item)
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      expect(hit?.closest('[role="menuitem"]')).toBe(item)
      await waitFor(() =>
        expect(item.closest('[role="menu"]')).toContainElement(
          document.activeElement as HTMLElement,
        ),
      )
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
      expect(screen.getByRole('dialog', { name: 'Actions' })).toBeInTheDocument()
      await userEvent.click(options)
      item = await screen.findByRole('menuitem', { name: 'Pick' })
      await userEvent.click(item)
      expect(onPick).toHaveBeenCalledOnce()
      // The menu's panel is a dialog too, until it has left.
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
      expect(screen.getByRole('dialog', { name: 'Actions' })).toBeInTheDocument()
    })
  })

  describe('the container', () => {
    it('spans the window at its bottom, as tall as what it holds, all of it showing', async () => {
      render(<Modal />)
      await opened()
      expect(rect(panel()).left).toBe(0)
      expect(rect(panel()).width).toBe(412)
      // The drag handle's 48dp and three rows of 56.
      expect(rect(dialog()).height).toBe(48 + 3 * 56)
      expect(rect(dialog()).bottom).toBe(800)
      expect(shown(panel())).toBe(48 + 3 * 56)
      await waitFor(() => expect(panel()).toHaveAttribute('data-expanded'))
    })

    it('is surface-container-low at elevation 1, with 28dp top corners and square bottom ones', async () => {
      render(<Modal />)
      await opened()
      const style = getComputedStyle(panel())
      expect(style.backgroundColor).toBe(role('surface-container-low', panel()))
      expect(style.color).toBe(role('on-surface', panel()))
      expect(style.borderTopLeftRadius).toBe('28px')
      expect(style.borderTopRightRadius).toBe('28px')
      expect(style.borderBottomLeftRadius).toBe('0px')
      expect(style.borderBottomRightRadius).toBe('0px')
      expect(style.getPropertyValue('--tw-shadow')).toBe(
        computedStyleOf('shadow-elevation-1', (probe) => probe.getPropertyValue('--tw-shadow')),
      )
      // What is in it cut by its corners.
      expect(style.overflow).toBe('clip')
    })

    it('is in front of the page, as a dialog is stacked, in a layer that covers the window', async () => {
      render(<Modal />)
      await opened()
      expect(getComputedStyle(layer()).zIndex).toBe('60')
      expect(rect(layer())).toMatchObject({ left: 0, top: 0, width: 412, height: 800 })
      expect(document.elementFromPoint(206, 700)?.closest('[data-testid="panel"]')).toBe(panel())
    })

    it('goes on below the window by as much again, which its fill runs under', async () => {
      render(<Modal />)
      await opened()
      // What the browser's bounce shows of it, pulled past its full height, is the sheet.
      expect(rect(panel()).bottom).toBe(800 + 800)
      expect(getComputedStyle(panel()).backgroundClip).toBe('border-box')
      // None of what is in it is down there.
      expect(rect(dialog()).bottom).toBe(800)
    })
  })

  describe('a sheet taller than half the window', () => {
    it('opens with half the window showing, and is 72dp short of its top at its full height', async () => {
      render(<Modal rows={20} />)
      await opened()
      expect(shown(panel())).toBe(400)
      expect(rect(dialog()).height).toBe(800 - 72)
      expect(panel()).not.toHaveAttribute('data-expanded')
      // A wheel turned three notches down raises it, as a swipe up does.
      await wheel(screen.getByRole('button', { name: 'Row 3' }), 300)
      expect(rect(panel()).top).toBe(72)
      await waitFor(() => expect(panel()).toHaveAttribute('data-expanded'))
    })

    it('is lowered to where it opened by a wheel turned up, and closed by one turned further', async () => {
      render(<Modal rows={20} />)
      await opened()
      await wheel(screen.getByRole('button', { name: 'Row 3' }), 300)
      expect(rect(panel()).top).toBe(72)
      await wheel(screen.getByRole('button', { name: 'Row 3' }), -300)
      expect(shown(panel())).toBe(400)
      await wheel(screen.getByRole('button', { name: 'Row 3' }), -400)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('stays where it is for a wheel turned a notch, the nearer of its heights', async () => {
      render(<Modal rows={20} />)
      await opened()
      await wheel(screen.getByRole('button', { name: 'Row 3' }), 100)
      expect(shown(panel())).toBe(400)
    })

    it('scrolls what is in it below the drag handle at its full height, and only there', async () => {
      render(<Modal rows={20} />)
      await opened()
      expect(getComputedStyle(body()).overflowY).toBe('hidden')
      await wheel(screen.getByRole('button', { name: 'Row 3' }), 300)
      await waitFor(() => expect(getComputedStyle(body()).overflowY).toBe('auto'))
      expect(body().scrollHeight).toBeGreaterThan(body().clientHeight)
      body().scrollTop = 300
      expect(body().scrollTop).toBe(300)
      expect(rect(handle()).top).toBe(72)
      expect(rect(body()).top).toBe(rect(handle()).bottom)
      expect(rect(body()).bottom).toBe(innerHeight)
      // Its scrollbar starts below the round corners, which would cut it off.
      const corner = parseFloat(getComputedStyle(panel()).borderTopRightRadius)
      expect(rect(body()).top - rect(panel()).top).toBeGreaterThan(corner)
    })

    it('shrinks what scrolls in it to fit it at its full height, under the drag handle', async () => {
      render(
        <Modal snapPoints={[]}>
          <Scroller count={20} />
        </Modal>,
      )
      await opened()
      expect(rect(content()).top).toBe(rect(handle()).bottom)
      expect(rect(content()).bottom).toBe(innerHeight)
      expect(content().scrollHeight).toBeGreaterThan(content().clientHeight)
      content().scrollTop = 300
      expect(content().scrollTop).toBe(300)
      expect(rect(handle()).top).toBe(72)
    })

    it('raises itself for the focus on what is below what shows of it', async () => {
      render(<Modal rows={20} />)
      await opened()
      await userEvent.tab()
      expect(handle()).toHaveFocus()
      for (let row = 1; row <= 6; row++) await userEvent.tab()
      expect(screen.getByRole('button', { name: 'Row 6' })).toHaveFocus()
      await waitFor(() => expect(rect(panel()).top).toBe(72))
    })

    it('opens at its full height with no snap points, and with those it is given', async () => {
      const { unmount } = render(<Modal rows={20} snapPoints={[]} />)
      await opened()
      expect(rect(panel()).top).toBe(72)
      unmount()
      render(<Modal rows={20} snapPoints={[160]} />)
      await opened()
      expect(shown(panel())).toBe(160)
    })
  })

  describe('the scrim', () => {
    it('covers the window behind the sheet in the scrim color at 32%', async () => {
      render(<Modal />)
      await opened()
      expect(rect(scrim())).toMatchObject({ left: 0, top: 0, width: 412, height: 800 })
      expect(getComputedStyle(scrim()).backgroundColor).toBe(
        computedColor('color-mix(in oklab, var(--md-sys-color-scrim) 32%, transparent)', scrim()),
      )
      expect(getComputedStyle(scrim()).opacity).toBe('1')
      expect(document.elementFromPoint(206, 100)?.closest('[data-testid="panel"]')).toBeNull()
    })

    it('stays as it is, all of it, as the sheet rises past where it opened', async () => {
      render(<Modal rows={20} />)
      await opened()
      await wheel(screen.getByRole('button', { name: 'Row 3' }), 300)
      expect(getComputedStyle(scrim()).opacity).toBe('1')
    })

    // Where it shows, above the sheet, the click lands on React Aria's scroller over it.
    it('closes the sheet when it is clicked', async () => {
      render(<Modal />)
      await opened()
      await userEvent.click(layer(), { position: { x: 200, y: 100 } })
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })
  })

  describe('in a window wider than 640dp', () => {
    it('is 640dp wide in the middle, and 56dp short of the top at its full height', async () => {
      await page.viewport(1000, 800)
      render(<Modal rows={20} snapPoints={[]} />)
      await opened()
      expect(rect(panel()).width).toBe(640)
      expect(rect(panel()).left).toBe(180)
      expect(rect(panel()).top).toBe(56)
    })

    it('keeps 56dp from each side where that leaves it less than 640dp', async () => {
      await page.viewport(700, 800)
      render(<Modal rows={20} snapPoints={[]} />)
      await opened()
      expect(rect(panel()).left).toBe(56)
      expect(rect(panel()).width).toBe(700 - 2 * 56)
      expect(rect(panel()).top).toBe(56)
    })

    it('spans a window of 640dp, 72dp short of its top', async () => {
      await page.viewport(640, 800)
      render(<Modal rows={20} snapPoints={[]} />)
      await opened()
      expect(rect(panel()).left).toBe(0)
      expect(rect(panel()).width).toBe(640)
      expect(rect(panel()).top).toBe(72)
    })

    it('is as wide and as tall as it is told to be', async () => {
      await page.viewport(1000, 800)
      render(<Modal rows={20} snapPoints={[]} className="max-w-none bottom-sheet-top-29" />)
      await opened()
      expect(rect(panel()).left).toBe(56)
      expect(rect(panel()).width).toBe(1000 - 2 * 56)
      expect(rect(panel()).top).toBe(116)
    })
  })

  describe('the drag handle', () => {
    it('is the top 48dp of the sheet across its width, with a 32 by 4dp bar in its middle', async () => {
      render(<Modal />)
      await opened()
      const bar = handle().querySelector('span span')!
      expect(rect(handle())).toMatchObject({ left: 0, width: 412, height: 48 })
      expect(rect(handle()).top).toBe(rect(panel()).top)
      expect(rect(bar)).toMatchObject({ width: 32, height: 4 })
      // 22dp above it and below.
      expect(rect(bar).top - rect(handle()).top).toBe(22)
      expect(rect(bar).left).toBe((412 - 32) / 2)
      expect(getComputedStyle(bar).backgroundColor).toBe(role('on-surface-variant', bar))
      expect(parseFloat(getComputedStyle(bar).borderRadius)).toBeGreaterThanOrEqual(2)
    })

    it('takes a press anywhere in its 48dp, and nothing of a button’s own look', async () => {
      render(<Modal />)
      await opened()
      const box = rect(handle())
      // Its top corners are cut by the sheet's round ones, 28dp in.
      for (const [x, y] of [
        [box.left + 28, box.top + 1],
        [box.right - 28, box.top + 1],
        [box.left + 1, box.bottom - 1],
        [box.right - 1, box.bottom - 1],
      ] as const)
        expect(document.elementFromPoint(x, y)?.closest('button')).toBe(handle())
      const style = getComputedStyle(handle())
      expect(style.appearance).toBe('none')
      expect(style.borderTopWidth).toBe('0px')
      expect(style.paddingTop).toBe('0px')
      expect(style.marginTop).toBe('0px')
      expect(style.userSelect).toBe('none')
      // A finger on it swipes the sheet, as anywhere else on it.
      expect(style.touchAction).toBe('auto')
    })

    it('draws its focus ring around the bar, 3dp in secondary 2dp out, for the keyboard only', async () => {
      render(<Modal />)
      await opened()
      const ring = handle().querySelector('span')!
      expect(getComputedStyle(ring).outlineStyle).toBe('none')
      await userEvent.tab()
      expect(handle()).toHaveFocus()
      const style = getComputedStyle(ring)
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('3px')
      expect(style.outlineOffset).toBe('2px')
      expect(style.outlineColor).toBe(role('secondary', ring))
      expect(style.borderRadius).toBe('4px')
      // 50 by 36dp across the outside of the ring, the bar in its middle.
      expect(rect(ring)).toMatchObject({ width: 40, height: 26 })
      expect(rect(ring).top - rect(handle()).top).toBe(11)
      expect(getComputedStyle(handle()).outlineStyle).toBe('none')
    })

    it('closes the sheet when it is selected', async () => {
      render(<Modal rows={20} />)
      await opened()
      await userEvent.click(handle())
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })
  })

  describe('dragged by its handle with a mouse', () => {
    it('follows the pointer, and is let go to the nearer of its heights, not closed', async () => {
      render(<Modal rows={20} />)
      await opened()
      expect(getComputedStyle(handle()).cursor).toBe('grab')
      const box = rect(handle())
      const [x, y] = [box.left + box.width / 2, box.top + 24]
      await commands.pointer('html', x, y, 'down')
      await commands.pointer('html', x, y - 100)
      await frame()
      expect(shown(panel())).toBe(500)
      expect(getComputedStyle(handle()).cursor).toBe('grabbing')
      await commands.pointer('html', x, y - 250)
      await frame()
      expect(shown(panel())).toBe(650)
      // Still before it is let go: the nearer is its full height, and the click is no press.
      await new Promise((resolve) => setTimeout(resolve, 120))
      // From where it is let go, up all the way, by way of where it has not been.
      const tops = await trackRelease(
        x,
        y - 250,
        () => rect(panel()).top,
        () => rect(panel()).top === 72,
      )
      for (const [index, each] of tops.entries()) {
        expect(each).toBeLessThanOrEqual(800 - 650)
        if (index > 0) expect(each).toBeLessThanOrEqual(tops[index - 1]!)
      }
      expect(tops.some((each) => each > 80 && each < 140)).toBe(true)
      await still()
      expect(rect(panel()).top).toBe(72)
      expect(dialog()).toBeInTheDocument()
      // It snaps again: a notch of the wheel takes it back.
      await wheel(handle(), -100)
      expect(rect(panel()).top).toBe(72)
    })

    it('goes back to where it was let go slowly near it', async () => {
      render(<Modal rows={20} />)
      await opened()
      await commands.drag('Drag handle', -100, 6, 120)
      await still()
      expect(shown(panel())).toBe(400)
      await commands.drag('Drag handle', 100, 6, 120)
      await still()
      expect(shown(panel())).toBe(400)
      expect(dialog()).toBeInTheDocument()
    })

    it('goes on to its next height let go moving fast, up to its full height or down and closed', async () => {
      render(<Modal rows={20} />)
      await opened()
      await fling(-60)
      await still()
      expect(rect(panel()).top).toBe(72)
      await fling(60)
      await still()
      expect(shown(panel())).toBe(400)
      await fling(60)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('moves the sheet when it cannot be closed, which it only draws', async () => {
      render(<Modal rows={20} preventDismissal />)
      await opened()
      expect(screen.queryByRole('button', { name: 'Drag handle' })).toBeNull()
      const box = rect(panel())
      const [x, y] = [box.left + box.width / 2, box.top + 24]
      await commands.pointer('html', x, y, 'down')
      await commands.pointer('html', x, y - 400)
      await new Promise((resolve) => setTimeout(resolve, 120))
      await commands.pointer('html', x, y - 400, 'up')
      await still()
      expect(rect(panel()).top).toBe(72)
    })

    it('is pulled above its full height less and less far, what is in it running on, and springs back', async () => {
      render(<Modal rows={20} snapPoints={[]} />)
      await opened()
      const box = rect(handle())
      const pulls = [14, 28, 56, 112, 250]
      const spring = springOnRelease()
      const read = await pullBy(
        box.left + box.width / 2,
        box.top + 24,
        pulls.map((pull) => -pull),
        () => ({ above: 72 - rect(panel()).top, bottom: rect(body()).bottom }),
      )
      // Over 24dp, the most it can be pulled up.
      pulls.forEach((pull, index) => {
        expect(read[index]!.above).toBeCloseTo(rubberBand(pull, 24), 1)
        expect(read[index]!.bottom).toBeCloseTo(innerHeight, 1)
      })
      const { animation, duration } = await spring
      expect(duration).toBe(parseFloat(springDuration('default-spatial')) * 1000)
      const tops = Array.from({ length: 101 }, (_, step) => {
        animation.currentTime = (duration * step) / 100
        return 72 - rect(panel()).top
      })
      // From where it was let go, down a little past its full height and back.
      expect(tops[0]).toBeCloseTo(read.at(-1)!.above, 0)
      expect(Math.min(...tops)).toBeLessThan(0)
      animation.finish()
      await still()
      expect(rect(panel()).top).toBe(72)
      expect(dialog()).toBeInTheDocument()
    })

    it('is pulled below its lowest height when it cannot be closed, never out of sight', async () => {
      render(<Modal rows={20} preventDismissal />)
      await opened()
      const box = rect(panel())
      const pulls = [14, 56, 250]
      const below = await pullBy(box.left + box.width / 2, box.top + 24, pulls, () =>
        Math.round(400 - shown(panel())),
      )
      // Over the 400 that shows there.
      pulls.forEach((pull, index) =>
        expect(below[index]).toBeCloseTo(Math.round(rubberBand(pull, 400)), -1),
      )
      await still()
      expect(shown(panel())).toBe(400)
    })

    it('stays where it is caught as it springs back', async () => {
      render(<Modal rows={20} snapPoints={[]} preventDismissal />)
      await opened()
      const box = rect(panel())
      const [x, y] = [box.left + box.width / 2, box.top + 24]
      // Its spring back slowed (the sheet reads the token in ms) and held a quarter of the way,
      // back where the handle is, near its full height, for the pointer to catch it however late.
      const root = document.documentElement
      root.style.setProperty('--md-sys-motion-spring-default-spatial-duration', '10000ms')
      await pullBy(x, y, [-250], () => null)
      root.style.removeProperty('--md-sys-motion-spring-default-spatial-duration')
      const spring = panel().getAnimations()[0]!
      spring.pause()
      spring.currentTime = 2500
      await commands.pointer('html', x, y, 'down')
      const caught = 72 - rect(panel()).top
      expect(caught).toBeGreaterThan(1)
      for (let count = 0; count < 5; count++) await frame()
      expect(72 - rect(panel()).top).toBeCloseTo(caught, 0)
      await commands.pointer('html', x, y, 'up')
      await still()
      expect(rect(panel()).top).toBe(72)
    })
  })

  describe('motion', () => {
    it('slides in from below the window as React Aria scrolls it, the scrim fading in with it', async () => {
      render(<Modal rows={20} defaultOpen={false} />)
      press(screen.getByRole('button', { name: 'Open' }))
      const read = await track(
        () => ({ shows: shown(panel()), scrim: Number(getComputedStyle(scrim()).opacity) }),
        () => !layer().hasAttribute('data-entering'),
      )
      // From out of sight up to half the window, never back down on the way.
      expect(read[0]!.shows).toBeLessThanOrEqual(0)
      expect(read.at(-1)!.shows).toBe(400)
      for (const [index, each] of read.entries())
        if (index > 0) expect(each.shows).toBeGreaterThanOrEqual(read[index - 1]!.shows)
      // The scrim as far in as the sheet is on its way there.
      expect(read.some(({ shows }) => shows > 40 && shows < 360)).toBe(true)
      // From a frame on: React Aria plays the scrim along the sheet's scroll once that has begun.
      for (const { shows, scrim } of read.slice(1))
        expect(scrim).toBeCloseTo(Math.min(1, Math.max(0, shows / 400)), 1)
    })

    it('slides out the same way, and is gone', async () => {
      render(<Modal rows={20} />)
      await opened()
      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      const read = await track(
        () => (screen.queryByTestId('panel') ? shown(panel()) : null),
        () => !screen.queryByTestId('panel'),
      )
      const tops = read.filter((each) => each !== null)
      expect(tops[0]).toBe(400)
      for (const [index, each] of tops.entries())
        if (index > 0) expect(each).toBeLessThanOrEqual(tops[index - 1]!)
      expect(tops.some((each) => each > 40 && each < 360)).toBe(true)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('is where it is going at once', async () => {
        render(<Modal rows={20} defaultOpen={false} />)
        await userEvent.click(screen.getByRole('button', { name: 'Open' }))
        await frame()
        await frame()
        expect(shown(panel())).toBe(400)
        expect(getComputedStyle(scrim()).opacity).toBe('1')
      })
    })
  })

  describe('contrast', () => {
    it.each(schemes)(
      'draws the bar, the ring and its text clearly on the sheet in %s, %s',
      async (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Modal />
          </Scheme>,
        )
        await opened()
        const fill = getComputedStyle(panel()).backgroundColor
        const bar = handle().querySelector('span span')!
        expect(contrastRatio(getComputedStyle(bar).backgroundColor, fill)).toBeGreaterThanOrEqual(3)
        expect(contrastRatio(role('secondary', panel()), fill)).toBeGreaterThanOrEqual(3)
        expect(contrastRatio(getComputedStyle(panel()).color, fill)).toBeGreaterThanOrEqual(4.5)
      },
    )
  })

  describe('forced colors', () => {
    useForcedColors()

    it('gives the sheet a system-color edge inside it, and the bar a system color', async () => {
      render(<Modal />)
      await opened()
      const style = getComputedStyle(panel())
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('1px')
      expect(style.outlineOffset).toBe('-1px')
      expect(style.outlineColor).toBe(computedColor('CanvasText', panel()))
      const bar = handle().querySelector('span span')!
      expect(getComputedStyle(bar).backgroundColor).toBe(computedColor('CanvasText', bar))
    })
  })
})

describe('a standard sheet (browser)', () => {
  // How near its full height a sheet is full-screen again, moving up: guideline video 1's 17.5dp.
  const fullScreenReach = 17.5
  /** Where the sheet's top is in its screen. */
  const top = () => rect(panel()).top - screenTop()
  /** Whether each read goes the one way, never back. */
  const oneWay = (read: number[], down: boolean) =>
    read.every(
      (each, index) => index === 0 || (down ? each >= read[index - 1]! : each <= read[index - 1]!),
    )

  describe('the container', () => {
    it('is in a layer over the window, at its bottom, which the page shows through', async () => {
      render(
        <BottomSheet aria-label="Player" data-testid="panel" defaultExpanded>
          <Rows count={3} />
        </BottomSheet>,
      )
      await atRest()
      expect(getComputedStyle(standardLayer()).position).toBe('fixed')
      expect(getComputedStyle(standardLayer()).zIndex).toBe('50')
      expect(rect(standardLayer())).toMatchObject({
        left: 0,
        top: 0,
        width: innerWidth,
        height: innerHeight,
      })
      expect(rect(panel()).bottom).toBe(innerHeight)
      expect(rect(panel()).height).toBe(48 + 3 * 56)
      // The test page is 1280dp wide: 640 in its middle.
      expect(rect(panel()).width).toBe(640)
      expect(rect(panel()).left).toBe((innerWidth - 640) / 2)
      // Above it and beside it, the page.
      for (const [x, y] of [
        [innerWidth / 2, 10],
        [10, innerHeight - 10],
      ] as const)
        expect(standardLayer().contains(document.elementFromPoint(x, y))).toBe(false)
    })

    it('shows 56dp partially expanded, across the screen it is in', async () => {
      render(<Standard />)
      await atRest()
      const box = rect(screen.getByTestId('screen'))
      expect(rect(standardLayer())).toMatchObject({
        left: box.left,
        top: box.top,
        width: 360,
        height: 640,
      })
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(rect(panel()).width).toBe(360)
      expect(rect(panel()).left).toBe(box.left)
    })

    it('shows the height it is given for a peek, in pixels or as a share of its own', async () => {
      const { unmount } = render(<Standard snapPoints={[112]} />)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(112)
      unmount()
      // Twelve rows under the drag handle are more than its full height, 72dp short of the top.
      render(<Standard snapPoints={['50%']} />)
      await atRest()
      expect(rect(panel()).height).toBe(640 - 72)
      expect(shown(panel(), screenBottom())).toBe((640 - 72) / 2)
    })

    it('is the same container as a modal sheet’s', async () => {
      render(<Standard />)
      await atRest()
      const style = getComputedStyle(panel())
      expect(style.backgroundColor).toBe(role('surface-container-low', panel()))
      expect(style.borderTopLeftRadius).toBe('28px')
      expect(style.borderBottomLeftRadius).toBe('0px')
      expect(style.getPropertyValue('--tw-shadow')).toBe(
        computedStyleOf('shadow-elevation-1', (probe) => probe.getPropertyValue('--tw-shadow')),
      )
      // What is in it cut by its corners, as in a modal one.
      expect(style.overflow).toBe('clip')
    })

    it('is as tall as what it holds when that is less than its peek, with one height', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard rows={0} onExpandedChange={onExpandedChange} />)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(48)
      await userEvent.click(handle())
      expect(onExpandedChange).not.toHaveBeenCalled()
    })

    it('leaves the page behind it in use, to click and to scroll', async () => {
      render(
        <>
          <button type="button" className="block h-[150vh] w-full">
            Behind
          </button>
          <BottomSheet aria-label="Player" data-testid="panel">
            <Rows count={3} />
          </BottomSheet>
        </>,
      )
      await atRest()
      const behind = screen.getByRole('button', { name: 'Behind' })
      expect(document.elementFromPoint(100, 100)).toBe(behind)
      await userEvent.click(behind, { position: { x: 100, y: 100 } })
      expect(behind).toHaveFocus()
      const sheet = rect(panel()).top
      await userEvent.wheel(behind, { delta: { y: 200 } })
      await waitFor(() => expect(scrollY).toBe(200))
      expect(rect(panel()).top).toBe(sheet)
      scrollTo(0, 0)
    })

    it('goes on below its layer, filled, adding nothing to what the layer scrolls', async () => {
      render(<Standard defaultExpanded />)
      await atRest()
      const layer = standardLayer()
      // At its full height its bottom is the layer's, which scrolls no further.
      expect(rect(panel()).bottom).toBe(screenBottom())
      expect(layer.scrollTop).toBe(layer.scrollHeight - layer.clientHeight)
      // What the browser's bounce shows of it, pulled past its full height, is its fill.
      const style = getComputedStyle(panel())
      expect(style.borderImageOutset).toBe(`0 0 ${innerHeight}px`)
      expect(style.borderImageSource).toContain(role('surface-container-low', panel()))
    })

    it('draws no ring around itself when it takes the focus, having nothing else to give it', async () => {
      // As the keyboard does, for its focus to be one that draws a ring.
      await userEvent.keyboard('{Shift}')
      const text = <p className="m-0 p-space-200">Nothing to press</p>
      const { rerender } = render(<Standard handled={false}>{text}</Standard>)
      await atRest()
      expect(panel()).toHaveFocus()
      expect(panel().matches(':focus-visible')).toBe(true)
      expect(getComputedStyle(panel()).outlineStyle).toBe('none')
      // Full-screen, its fill over what is above it is still drawn.
      rerender(
        <Standard handled={false} isFullScreen isExpanded>
          {text}
        </Standard>,
      )
      await atRest()
      expect(panel()).toHaveFocus()
      expect(panel().hasAttribute('data-full-screen')).toBe(true)
      expect(getComputedStyle(panel()).outlineStyle).toBe('solid')
      expect(getComputedStyle(panel()).outlineColor).toBe(role('surface', panel()))
    })
  })

  describe('raised and lowered', () => {
    it('rises to 72dp short of the top as its layer scrolls it, its drag handle selected', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard onExpandedChange={onExpandedChange} />)
      await atRest()
      handle().click()
      expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true)
      const tops = await track(top, () => top() === 72)
      // From its peek, never back down on the way, by way of where it has not been.
      expect(tops[0]).toBe(640 - 56)
      expect(tops.at(-1)).toBe(72)
      expect(oneWay(tops, false)).toBe(true)
      expect(tops.some((each) => each > 150 && each < 500)).toBe(true)
      await atRest()
      expect(rect(panel()).height).toBe(640 - 72)
      expect(panel()).toHaveAttribute('data-expanded')
    })

    it('is lowered back to its peek the same way, and no further', async () => {
      render(<Standard defaultExpanded />)
      await atRest()
      handle().click()
      const tops = await track(top, () => top() === 640 - 56)
      expect(tops[0]).toBe(72)
      expect(oneWay(tops, true)).toBe(true)
      expect(Math.max(...tops)).toBe(640 - 56)
      await atRest()
      expect(panel()).not.toHaveAttribute('data-expanded')
    })

    it('is dragged by its handle with a mouse to the nearer of its heights, not selecting it', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard onExpandedChange={onExpandedChange} />)
      await atRest()
      await commands.drag('Drag handle', -100, 6, 120)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(onExpandedChange).not.toHaveBeenCalled()
      await commands.drag('Drag handle', -300, 6, 120)
      await atRest()
      expect(top()).toBe(72)
      // Once, by the drag: the click that ends it would have lowered it again.
      expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(standardLayer().style.scrollSnapType).toBe('')
      expect(getComputedStyle(standardLayer()).scrollSnapType).toBe('y mandatory')
    })

    it('goes on to its next height let go moving fast, and hidden below its peek', async () => {
      const [onOpenChange, onExpandedChange] = [vi.fn(), vi.fn()]
      render(<Standard onOpenChange={onOpenChange} onExpandedChange={onExpandedChange} />)
      await atRest()
      await fling(-40)
      await atRest()
      expect(top()).toBe(72)
      await fling(40)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(onExpandedChange.mock.calls).toEqual([[true], [false]])
      await fling(20)
      await atRest()
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    })

    it('is pulled below its peek by its handle less and less far, never out of sight', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard onExpandedChange={onExpandedChange} />)
      await atRest()
      const box = rect(handle())
      const pulls = [14, 28, 56, 112, 250]
      const spring = springOnRelease()
      const below = await pullBy(
        box.left + box.width / 2,
        box.top + 24,
        pulls,
        () => 56 - shown(panel(), screenBottom()),
      )
      // Over the 56 that shows.
      pulls.forEach((pull, index) => expect(below[index]).toBeCloseTo(rubberBand(pull, 56), 1))
      const { animation, duration } = await spring
      expect(duration).toBe(parseFloat(springDuration('default-spatial')) * 1000)
      animation.play()
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(onExpandedChange).not.toHaveBeenCalled()
    })

    it('is pulled above its full height by its handle, what is in it running on, and springs back', async () => {
      for (const rows of [3, 12]) {
        const onExpandedChange = vi.fn()
        const { unmount } = render(
          <Standard rows={rows} defaultExpanded onExpandedChange={onExpandedChange} />,
        )
        await atRest()
        const full = top()
        const box = rect(handle())
        const pulls = [14, 56, 250]
        const read = await pullBy(
          box.left + box.width / 2,
          box.top + 24,
          pulls.map((pull) => -pull),
          () => ({ above: full - top(), bottom: rect(body()).bottom }),
        )
        // Scrolled to whole pixels.
        pulls.forEach((pull, index) => {
          expect(read[index]!.above).toBeCloseTo(rubberBand(pull, 24), 0)
          expect(read[index]!.bottom).toBeCloseTo(screenBottom(), 0)
        })
        await atRest()
        expect(top()).toBe(full)
        expect(rect(body()).bottom).toBe(screenBottom())
        expect(onExpandedChange).not.toHaveBeenCalled()
        unmount()
      }
    })

    it('is not pulled below where it is hidden', async () => {
      const onOpenChange = vi.fn()
      render(<Standard onOpenChange={onOpenChange} />)
      await atRest()
      const box = rect(handle())
      await pullBy(box.left + box.width / 2, box.top + 24, [100], () => null, true)
      expect(panel().style.translate).toBe('')
      await commands.pointer('html', box.left + box.width / 2, box.top + 124, 'up')
      await atRest()
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    })

    it('follows the height its caller holds', async () => {
      const { rerender } = render(<Standard isExpanded={false} />)
      await atRest()
      rerender(<Standard isExpanded />)
      await atRest()
      expect(top()).toBe(72)
      rerender(<Standard isExpanded={false} />)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
    })

    it('goes back to the height its caller holds after a scroll, which it asks about', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard isExpanded={false} onExpandedChange={onExpandedChange} />)
      await atRest()
      await wheel(handle(), 300)
      await atRest()
      expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(panel()).not.toHaveAttribute('data-expanded')
    })

    it('rests at the full height bottom-sheet-top-* gives it', async () => {
      render(<Standard defaultExpanded className="bottom-sheet-top-29" />)
      await atRest()
      expect(top()).toBe(116)
      expect(rect(panel()).height).toBe(640 - 116)
    })

    it('is raised by the wheel turned down over it, and lowered by one turned up', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard onExpandedChange={onExpandedChange} />)
      await atRest()
      await wheel(handle(), 300)
      expect(top()).toBe(72)
      await wheel(screen.getByRole('button', { name: 'Row 2' }), -300)
      expect(shown(panel(), screenBottom())).toBe(56)
      await atRest()
      expect(onExpandedChange.mock.calls).toEqual([[true], [false]])
    })

    it('stays where it is for a wheel turned a notch, the nearer of its heights', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard onExpandedChange={onExpandedChange} />)
      await atRest()
      await wheel(handle(), 100)
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(onExpandedChange).not.toHaveBeenCalled()
    })

    it('opens at the first of its snapPoints, and its drag handle raises it to the next one up', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard snapPoints={[300, 112]} onExpandedChange={onExpandedChange} />)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(300)
      handle().click()
      await atRest()
      expect(top()).toBe(72)
      // Lowered to the lowest of them, and raised from there to the next.
      handle().click()
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(112)
      handle().click()
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(300)
      expect(onExpandedChange.mock.calls).toEqual([[true], [false]])
    })

    it('rests at the nearest of its snapPoints after a scroll, and goes on from there', async () => {
      const onExpandedChange = vi.fn()
      render(
        <Standard snapPoints={[112, 300]} defaultExpanded onExpandedChange={onExpandedChange} />,
      )
      await atRest()
      await wheel(handle(), -200)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(300)
      expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(false)
      handle().click()
      await atRest()
      expect(top()).toBe(72)
      expect(onExpandedChange).toHaveBeenLastCalledWith(true)
    })

    it('rests no lower than the lowest of its snapPoints with no onOpenChange', async () => {
      render(<Standard snapPoints={[300, 112]} />)
      await atRest()
      await wheel(handle(), -400)
      expect(shown(panel(), screenBottom())).toBe(112)
    })

    it('rests only at its full height with no snapPoints, scrolling what is in it there', async () => {
      render(<Standard rows={20} snapPoints={[]} />)
      await atRest()
      expect(top()).toBe(72)
      expect(panel()).toHaveAttribute('data-expanded')
      expect(getComputedStyle(body()).overflowY).toBe('auto')
      await wheel(handle(), -300)
      expect(top()).toBe(72)
    })

    it('rests no lower than its peek with no onOpenChange, however far it is scrolled', async () => {
      render(<Standard />)
      await atRest()
      await wheel(handle(), -300)
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(standardLayer().scrollTop).toBe(0)
    })

    it('scrolls what is in it below the drag handle at its full height, and only there', async () => {
      render(<Standard rows={20} />)
      await atRest()
      expect(getComputedStyle(body()).overflowY).toBe('hidden')
      await wheel(handle(), 300)
      await waitFor(() => expect(getComputedStyle(body()).overflowY).toBe('auto'))
      expect(body().scrollHeight).toBeGreaterThan(body().clientHeight)
      body().scrollTop = 300
      expect(body().scrollTop).toBe(300)
      expect(rect(handle()).top - screenTop()).toBe(72)
      expect(rect(body()).top).toBe(rect(handle()).bottom)
      expect(rect(body()).bottom).toBe(screenBottom())
    })

    it('is lowered by the wheel turned up at its full height only once what is in it is at its top', async () => {
      render(<Standard rows={20} defaultExpanded />)
      await atRest()
      body().scrollTop = 300
      await wheel(screen.getByRole('button', { name: 'Row 9' }), -200)
      expect(body().scrollTop).toBe(100)
      expect(top()).toBe(72)
    })

    it('raises itself for the focus on what is below what shows of it', async () => {
      const onExpandedChange = vi.fn()
      render(<Standard onExpandedChange={onExpandedChange} />)
      await atRest()
      // Where the focus is as it is shown, which leaves it where it is.
      expect(handle()).toHaveFocus()
      expect(shown(panel(), screenBottom())).toBe(56)
      for (let row = 1; row <= 3; row++) await userEvent.tab()
      expect(screen.getByRole('button', { name: 'Row 3' })).toHaveFocus()
      await waitFor(() => expect(top()).toBe(72))
      await atRest()
      expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true)
    })
  })

  describe('shown and hidden', () => {
    it('slides out as it is hidden, and is removed, and slides back in as it is shown', async () => {
      const { rerender } = render(<Standard />)
      await atRest()
      rerender(<Standard isOpen={false} />)
      const out = await track(
        () => (screen.queryByTestId('panel') ? shown(panel(), screenBottom()) : null),
        () => !screen.queryByTestId('panel'),
      )
      const shows = out.filter((each) => each !== null)
      expect(shows[0]).toBe(56)
      expect(oneWay(shows, false)).toBe(true)
      expect(shows.some((each) => each > 5 && each < 50)).toBe(true)
      rerender(<Standard isOpen />)
      const back = await track(
        () => shown(panel(), screenBottom()),
        () => !panel().hasAttribute('data-entering'),
      )
      expect(back[0]).toBeLessThanOrEqual(0)
      expect(oneWay(back, true)).toBe(true)
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
    })

    it('asks to be hidden scrolled out of sight, or by its handle at its full height', async () => {
      const onOpenChange = vi.fn()
      render(<Standard onOpenChange={onOpenChange} />)
      await atRest()
      await wheel(handle(), -300)
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
      // Its caller keeps it open: it comes back to its peek.
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
      await userEvent.click(handle())
      await atRest()
      expect(top()).toBe(72)
      await userEvent.click(handle())
      expect(onOpenChange).toHaveBeenCalledTimes(2)
    })

    it('is gone at once when its caller hides it, scrolled out of sight', async () => {
      function Hidden() {
        const [isOpen, setOpen] = useState(true)
        return <Standard isOpen={isOpen} onOpenChange={setOpen} />
      }
      render(<Hidden />)
      await atRest()
      await userEvent.wheel(handle(), { delta: { y: -300 } })
      await waitFor(() => expect(screen.queryByTestId('panel')).toBeNull())
    })

    it('takes the focus as it slides in, and gives it back once it has slid out for Escape', async () => {
      function Shown() {
        const [isOpen, setOpen] = useState(false)
        return (
          <>
            <Button onPress={() => setOpen(true)}>Play</Button>
            <Standard isOpen={isOpen} onOpenChange={setOpen} />
          </>
        )
      }
      render(<Shown />)
      const play = screen.getByRole('button', { name: 'Play' })
      await userEvent.click(play)
      await waitFor(() => expect(handle()).toHaveFocus())
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
      pressEscape()
      const out = await track(
        () => (screen.queryByTestId('panel') ? shown(panel(), screenBottom()) : null),
        () => !screen.queryByTestId('panel'),
      )
      expect(out.some((each) => each !== null && each > 5 && each < 50)).toBe(true)
      await waitFor(() => expect(play).toHaveFocus())
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('is where it is going at once', async () => {
        render(<Standard />)
        await frame()
        await frame()
        expect(shown(panel(), screenBottom())).toBe(56)
        handle().click()
        await frame()
        await frame()
        expect(top()).toBe(72)
      })
    })

    // WebKit (Safari 26.0) has no scrollend: the browser's own are stopped here, and the
    // window says it has none.
    describe('where the browser says nothing of a scroll’s end', () => {
      const stop = (event: Event) => {
        if (event.isTrusted) event.stopImmediatePropagation()
      }
      let handler: PropertyDescriptor | undefined
      beforeEach(() => {
        handler = Object.getOwnPropertyDescriptor(window, 'onscrollend')
        Reflect.deleteProperty(window, 'onscrollend')
        window.addEventListener('scrollend', stop, true)
      })
      afterEach(() => {
        window.removeEventListener('scrollend', stop, true)
        if (handler) Object.defineProperty(window, 'onscrollend', handler)
      })

      it('comes in, is raised and lowered, rests where it is scrolled to, and is hidden', async () => {
        expect('onscrollend' in window).toBe(false)
        const [onOpenChange, onExpandedChange] = [vi.fn(), vi.fn()]
        render(<Standard onOpenChange={onOpenChange} onExpandedChange={onExpandedChange} />)
        await atRest()
        expect(shown(panel(), screenBottom())).toBe(56)
        expect(getComputedStyle(standardLayer()).scrollSnapType).toBe('y mandatory')
        handle().click()
        await atRest()
        expect(top()).toBe(72)
        await wheel(screen.getByRole('button', { name: 'Row 2' }), -300)
        await atRest()
        expect(shown(panel(), screenBottom())).toBe(56)
        expect(onExpandedChange.mock.calls).toEqual([[true], [false]])
        await commands.drag('Drag handle', -300, 6, 120)
        await atRest()
        expect(top()).toBe(72)
        expect(standardLayer().style.scrollSnapType).toBe('')
        await wheel(handle(), -900)
        await waitFor(() => expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false))
      })
    })
  })

  describe('full-screen', () => {
    const bar = () => handle().querySelector('span span')!
    /** A transition list's first two entries: its color's and its fill's. */
    const fades = (list: string) => list.split(', ').slice(0, 2)

    it('is as tall as its full height, and there surface, its fill over all above it, no bar drawn', async () => {
      render(<Standard rows={3} isFullScreen defaultExpanded />)
      await atRest()
      // Its drag handle given the focus as it was shown, which a click on the page takes back.
      await userEvent.click(screen.getByRole('button', { name: 'Behind' }))
      await settle()
      expect(panel().hasAttribute('data-full-screen')).toBe(true)
      expect(top()).toBe(72)
      expect(rect(panel()).height).toBe(640 - 72)
      const style = getComputedStyle(panel())
      expect(style.backgroundColor).toBe(role('surface', panel()))
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineColor).toBe(role('surface', panel()))
      expect(style.outlineOffset).toBe('0px')
      // Up to the window's top and across it, whatever the window.
      const reach = Math.max(innerWidth, innerHeight)
      expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(reach)
      expect(getComputedStyle(bar()).opacity).toBe('0')
      // Its color fast, its fill on slow effects, and its bar out on default effects.
      expect(fades(style.transitionDuration)).toEqual([
        springDuration('fast-effects'),
        springDuration('slow-effects'),
      ])
      expect(getComputedStyle(bar()).transitionDuration).toBe(springDuration('default-effects'))
    })

    it('is not full-screen partially expanded: its own fill, nothing over its top, its bar', async () => {
      render(<Standard isFullScreen />)
      await atRest()
      expect(panel().hasAttribute('data-full-screen')).toBe(false)
      expect(shown(panel(), screenBottom())).toBe(56)
      const style = getComputedStyle(panel())
      expect(style.backgroundColor).toBe(role('surface-container-low', panel()))
      expect(style.outlineColor).toBe('rgba(0, 0, 0, 0)')
      expect(getComputedStyle(bar()).opacity).toBe('1')
      // Its color fast, its fill on default effects, and its bar in on fast effects.
      expect(fades(style.transitionDuration)).toEqual([
        springDuration('fast-effects'),
        springDuration('default-effects'),
      ])
      expect(style.transitionTimingFunction).toBe(
        `${springEasing('fast-effects')}, ${springEasing('default-effects')}`,
      )
      expect(getComputedStyle(bar()).transitionDuration).toBe(springDuration('fast-effects'))
    })

    it('gives the page nothing to scroll, fixed to the window', async () => {
      render(
        <BottomSheet isFullScreen defaultExpanded data-testid="panel">
          <Rows count={3} />
        </BottomSheet>,
      )
      await atRest()
      expect(panel().hasAttribute('data-full-screen')).toBe(true)
      const page = document.documentElement
      expect(page.scrollHeight).toBe(page.clientHeight)
      expect(page.scrollWidth).toBe(page.clientWidth)
    })

    it('rests at the full height bottom-sheet-top-* gives it', async () => {
      render(<Standard isFullScreen defaultExpanded className="bottom-sheet-top-29" />)
      await atRest()
      expect(top()).toBe(116)
      expect(rect(panel()).height).toBe(640 - 116)
    })

    it('stops being full-screen as it is scrolled down, and is again within 17.5dp of its full height', async () => {
      render(<Standard isFullScreen defaultExpanded />)
      await atRest()
      // Each scroll of its layer: how far below its full height it is, and whether it is full-screen.
      const seen: [number, boolean][] = []
      standardLayer().addEventListener('scroll', () =>
        seen.push([top() - 72, panel().hasAttribute('data-full-screen')]),
      )
      await wheel(screen.getByRole('button', { name: 'Row 2' }), -300)
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(seen.length).toBeGreaterThan(2)
      for (const [below, full] of seen) if (below > 0) expect(full).toBe(false)
      seen.length = 0
      await wheel(handle(), 300)
      expect(top()).toBe(72)
      expect(seen.some(([below]) => below > fullScreenReach)).toBe(true)
      for (const [below, full] of seen) expect(full).toBe(below <= fullScreenReach)
      await atRest()
      expect(panel().hasAttribute('data-full-screen')).toBe(true)
    })

    it('is not full-screen once lowered, or once hidden', async () => {
      const { rerender } = render(<Standard isFullScreen defaultExpanded />)
      await atRest()
      await userEvent.click(handle())
      await atRest()
      expect(shown(panel(), screenBottom())).toBe(56)
      expect(panel().hasAttribute('data-full-screen')).toBe(false)
      await userEvent.click(handle())
      await atRest()
      expect(panel().hasAttribute('data-full-screen')).toBe(true)
      rerender(<Standard isFullScreen defaultExpanded isOpen={false} />)
      await waitFor(() => expect(panel().hasAttribute('data-exiting')).toBe(true))
      expect(panel().hasAttribute('data-full-screen')).toBe(false)
    })

    it('keeps its drag handle in the tab order, its bar drawn while it has the keyboard focus', async () => {
      render(<Standard isFullScreen defaultExpanded />)
      await atRest()
      await userEvent.click(screen.getByRole('button', { name: 'Behind' }))
      await settle()
      expect(getComputedStyle(handle().querySelector('span span')!).opacity).toBe('0')
      await userEvent.tab()
      expect(handle()).toHaveFocus()
      await settle()
      expect(getComputedStyle(bar()).opacity).toBe('1')
      await userEvent.keyboard('{Enter}')
      await atRest()
      expect(panel().hasAttribute('data-full-screen')).toBe(false)
      expect(shown(panel(), screenBottom())).toBe(56)
    })
  })

  describe('contrast', () => {
    it.each(schemes)(
      'draws the bar, the ring and its text clearly on the sheet in %s, %s',
      async (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Standard />
          </Scheme>,
        )
        await atRest()
        const fill = getComputedStyle(panel()).backgroundColor
        const bar = handle().querySelector('span span')!
        expect(contrastRatio(getComputedStyle(bar).backgroundColor, fill)).toBeGreaterThanOrEqual(3)
        expect(contrastRatio(role('secondary', panel()), fill)).toBeGreaterThanOrEqual(3)
        expect(contrastRatio(getComputedStyle(panel()).color, fill)).toBeGreaterThanOrEqual(4.5)
      },
    )
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the check below runs in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('gives the sheet a system-color edge inside it, the bar a system color, the canvas below', async () => {
      render(<Standard />)
      await atRest()
      const style = getComputedStyle(panel())
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('1px')
      expect(style.outlineOffset).toBe('-1px')
      expect(style.outlineColor).toBe(computedColor('CanvasText', panel()))
      expect(style.borderImageSource).toContain(computedColor('Canvas', panel()))
      const bar = handle().querySelector('span span')!
      expect(getComputedStyle(bar).backgroundColor).toBe(computedColor('CanvasText', bar))
    })

    it('keeps its edge while it has the focus itself', async () => {
      await userEvent.keyboard('{Shift}')
      render(
        <Standard handled={false}>
          <p className="m-0 p-space-200">Nothing to press</p>
        </Standard>,
      )
      await atRest()
      expect(panel()).toHaveFocus()
      expect(panel().matches(':focus-visible')).toBe(true)
      const style = getComputedStyle(panel())
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('1px')
      expect(style.outlineColor).toBe(computedColor('CanvasText', panel()))
    })

    it('fills over a full-screen sheet’s top with the canvas, and draws its edge otherwise', async () => {
      render(<Standard isFullScreen />)
      await atRest()
      expect(getComputedStyle(panel()).outlineWidth).toBe('1px')
      expect(getComputedStyle(panel()).outlineColor).toBe(computedColor('CanvasText', panel()))
      await userEvent.click(handle())
      await atRest()
      expect(panel().hasAttribute('data-full-screen')).toBe(true)
      const style = getComputedStyle(panel())
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineColor).toBe(computedColor('Canvas', panel()))
      expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(
        Math.max(innerWidth, innerHeight),
      )
    })
  })
})
