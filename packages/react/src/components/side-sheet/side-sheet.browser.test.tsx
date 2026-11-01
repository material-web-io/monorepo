import { render, screen, waitFor } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { Heading, I18nProvider } from 'react-aria-components'
import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  computedColor,
  computedStyleOf,
  contrastRatio,
  press,
  Scheme,
  schemes,
  settle,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { SheetTrigger, SideSheet, SideSheetHeader, type SideSheetProps } from '.'

/* What needs a real browser and stylesheet: where a sheet sits and how wide it is, its fill,
 * corners and the scrim, its parts' spacing, how it moves, the scrolling that swipes a modal
 * sheet, the focus, contrast and forced colors. Markup, roles and what closes a sheet:
 * side-sheet.test.tsx. */

const frame = () => new Promise(requestAnimationFrame)
const panel = () => screen.getByTestId('panel')
const dialog = () => screen.getByRole('dialog')
// A modal sheet's layer, React Aria's SheetOverlay at the end of the page, the scrim in it, and
// the scroller a swipe moves the sheet in.
const layer = () => panel().closest('body > *')!
const scrim = () => layer().firstElementChild!
const scroller = () => layer().querySelector<HTMLElement>('[data-sheet-scroll]')!
// Either sheet's column: a modal one's dialog, React Aria's SheetContent, or a standard one's div.
const column = () => panel().querySelector<HTMLElement>('.side-sheet-column')!
const rect = (el: Element) => el.getBoundingClientRect()
const role = (name: string, el: Element) => computedColor(`var(--md-sys-color-${name})`, el)
const radii = (el: Element) => {
  const style = getComputedStyle(el)
  return [
    style.borderStartStartRadius,
    style.borderStartEndRadius,
    style.borderEndEndRadius,
    style.borderEndStartRadius,
  ]
}
/** How much of a modal sheet shows, from the window's end. */
const shows = () => innerWidth - rect(column()).left

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
    same = rect(sheet).left === last ? same + 1 : 0
    last = rect(sheet).left
  }
}

/** Reads `read` a frame at a time until `done`, and once more: what each frame showed. */
async function track<T>(read: () => T, done: () => boolean) {
  const read_: T[] = []
  for (let count = 0; count < 300 && (read_.length === 0 || !done()); count++) {
    read_.push(read())
    await frame()
  }
  read_.push(read())
  return read_
}

/** Lets a standard sheet come to rest: in, and its transitions over. */
async function atRest() {
  await waitFor(() => expect(panel()).not.toHaveAttribute('data-entering'))
  await settle()
}

/** The M3 emphasized easing as Android draws it: two cubic Béziers, at progress `t`. */
function emphasized(t: number) {
  const segments = [
    [0, 0, 0.05, 0, 0.133333, 0.06, 0.166666, 0.4],
    [0.166666, 0.4, 0.208333, 0.82, 0.25, 1, 1, 1],
  ]
  const [x0, y0, x1, y1, x2, y2, x3, y3] = t <= 0.166666 ? segments[0]! : segments[1]!
  const at = (u: number, a: number, b: number, c: number, d: number) =>
    (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d
  let [low, high] = [0, 1]
  for (let step = 0; step < 50; step++) {
    const middle = (low + high) / 2
    if (at(middle, x0!, x1!, x2!, x3!) < t) low = middle
    else high = middle
  }
  return at((low + high) / 2, y0!, y1!, y2!, y3!)
}

/** The CSS transition of `property` running on `el`. */
const transitionOf = (el: Element, property: string) =>
  el
    .getAnimations()
    .find(
      (it): it is CSSTransition =>
        it instanceof CSSTransition && it.transitionProperty === property,
    )

/**
 * Steps the transition of `property` on `el` a frame at a time, and every other one of `el`'s
 * with it, reading it at each and at its end, which it is then left at: `[time, value]` pairs.
 */
function frames(el: Element, property: string, read: () => number) {
  const all = el.getAnimations().filter((it) => it instanceof CSSTransition)
  all.forEach((it) => it.pause())
  const end = Number(transitionOf(el, property)!.effect!.getComputedTiming().endTime)
  const read_: [number, number][] = []
  for (const time of [
    ...Array.from({ length: Math.ceil((end * 60) / 1000) }, (_, k) => (k * 1000) / 60),
    end,
  ]) {
    all.forEach((it) => (it.currentTime = time))
    read_.push([time, read()])
  }
  all.forEach((it) => it.finish())
  return read_
}

/** A modal sheet and the button that opens it, in React Aria's SheetTrigger. */
function Modal({
  defaultOpen = true,
  children,
  ...props
}: SideSheetProps & { children?: ReactNode }) {
  return (
    <SheetTrigger defaultOpen={defaultOpen}>
      <Button>Open</Button>
      <SideSheet isModal aria-label="Filters" data-testid="panel" {...props}>
        {children ?? (
          <button type="button" className="h-14 w-full">
            Events
          </button>
        )}
      </SideSheet>
    </SheetTrigger>
  )
}

/** A standard sheet at the end of a row 960 by 600, after the body. */
function Row({ children, ...props }: SideSheetProps & { children?: ReactNode }) {
  return (
    <div data-testid="row" className="flex h-150 w-240">
      <main data-testid="body" className="min-w-0 grow">
        Albums
      </main>
      <SideSheet aria-label="Info" data-testid="panel" {...props}>
        {children}
      </SideSheet>
    </div>
  )
}
const body = () => screen.getByTestId('body')
const row = () => screen.getByTestId('row')

/** A sheet with a header of every part: a back and a close icon button around the headline. */
function Parts(props: SideSheetProps) {
  return (
    <Row {...props}>
      <SideSheetHeader>
        <IconButton aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="title">Labels</Heading>
        <IconButton aria-label="Close" slot="close">
          <Icon name="close" />
        </IconButton>
      </SideSheetHeader>
      <div className="min-h-0 grow overflow-y-auto px-space-300 py-space-200">
        <div className="h-250">Events</div>
      </div>
    </Row>
  )
}

afterEach(() => {
  document.documentElement.dir = 'ltr'
})

describe('a modal sheet (browser)', () => {
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
  })

  describe('the container', () => {
    it('is at the window’s end, as tall as it, 256dp wide, with its 16dp corners at its start', async () => {
      render(<Modal />)
      await opened()
      const [sheet, content] = [rect(panel()), rect(column())]
      expect(content.right).toBeCloseTo(innerWidth, 0)
      expect(content.width).toBeCloseTo(256, 1)
      expect(content.top).toBe(0)
      expect(content.height).toBeCloseTo(innerHeight, 0)
      expect(sheet.left).toBeCloseTo(content.left, 1)
      expect(sheet.top).toBe(0)
      expect(sheet.height).toBeCloseTo(innerHeight, 0)
      expect(radii(panel())).toEqual(['16px', '0px', '0px', '16px'])
      await waitFor(() => expect(panel()).toHaveAttribute('data-expanded'))
    })

    it('goes on past the window’s end by as much again, which its fill runs under', async () => {
      render(<Modal />)
      await opened()
      // What the browser's bounce shows of it, pulled into the page, is the sheet.
      expect(rect(panel()).right).toBeCloseTo(innerWidth * 2, 0)
      expect(getComputedStyle(panel()).backgroundClip).toBe('border-box')
      // None of what is in it is out there.
      expect(rect(column()).right).toBeCloseTo(innerWidth, 0)
    })

    it('is surface-container-low at elevation 1, in on-surface, cut to its shape', async () => {
      render(<Modal />)
      await opened()
      const style = getComputedStyle(panel())
      expect(style.backgroundColor).toBe(role('surface-container-low', panel()))
      expect(style.color).toBe(role('on-surface', panel()))
      expect(style.getPropertyValue('--tw-shadow')).toBe(
        computedStyleOf('shadow-elevation-1', (probe) => probe.getPropertyValue('--tw-shadow')),
      )
      expect(style.overflow).toBe('clip')
    })

    it('is in front of the page, as a dialog is stacked, in a layer that covers the window', async () => {
      render(<Modal />)
      await opened()
      expect(getComputedStyle(layer()).zIndex).toBe('60')
      expect(rect(layer())).toMatchObject({
        left: 0,
        top: 0,
        width: innerWidth,
        height: innerHeight,
      })
      expect(
        document.elementFromPoint(innerWidth - 128, 400)?.closest('[data-testid="panel"]'),
      ).toBe(panel())
    })

    it('is 16dp in from the window’s edges detached, round at every corner', async () => {
      render(<Modal isDetached />)
      await opened()
      expect(innerWidth - rect(column()).right).toBeCloseTo(16, 1)
      expect(rect(panel()).top).toBeCloseTo(16, 1)
      expect(innerHeight - rect(panel()).bottom).toBeCloseTo(16, 1)
      expect(radii(panel())).toEqual(['16px', '16px', '16px', '16px'])
    })

    it('is at the window’s left edge in a right-to-left locale, its corners at its start', async () => {
      render(
        <I18nProvider locale="he-IL">
          <Modal />
        </I18nProvider>,
      )
      await opened()
      await still()
      expect(layer()).toHaveAttribute('data-position', 'left')
      expect(rect(column()).left).toBeCloseTo(0, 0)
      expect(rect(column()).width).toBeCloseTo(256, 1)
      expect(getComputedStyle(panel()).borderTopRightRadius).toBe('16px')
      expect(getComputedStyle(panel()).borderTopLeftRadius).toBe('0px')
    })

    it('is as wide as side-sheet-width-* sets, up to 400dp', async () => {
      const { unmount } = render(<Modal className="side-sheet-width-90" />)
      await opened()
      expect(rect(column()).width).toBeCloseTo(360, 1)
      expect(rect(column()).right).toBeCloseTo(innerWidth, 0)
      unmount()
      render(<Modal className="side-sheet-width-120" />)
      await opened()
      expect(rect(column()).width).toBeCloseTo(400, 1)
    })
  })

  describe('the scrim', () => {
    it('covers the window behind the sheet in the scrim color at 32%', async () => {
      render(<Modal />)
      await opened()
      expect(rect(scrim())).toMatchObject({
        left: 0,
        top: 0,
        width: innerWidth,
        height: innerHeight,
      })
      expect(getComputedStyle(scrim()).backgroundColor).toBe(
        computedColor('color-mix(in oklab, var(--md-sys-color-scrim) 32%, transparent)', scrim()),
      )
      expect(getComputedStyle(scrim()).opacity).toBe('1')
      expect(document.elementFromPoint(200, 400)?.closest('[data-testid="panel"]')).toBeNull()
    })

    // Where it shows, beside the sheet, the click lands on React Aria's scroller over it.
    it('closes the sheet when it is clicked', async () => {
      render(<Modal />)
      await opened()
      await userEvent.click(layer(), { position: { x: 200, y: 100 } })
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })
  })

  describe('swiped', () => {
    it('is scrolled toward the window’s end in React Aria’s scroller, and closed once none of it shows', async () => {
      render(<Modal />)
      await opened()
      expect(getComputedStyle(scroller()).scrollSnapType).toBe('x mandatory')
      scroller().scrollLeft = 0
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    // Let go, the browser snaps it to the nearer of where it rests and out of the window.
    it('comes back let go short of halfway out, and is closed let go past it', async () => {
      render(<Modal />)
      await opened()
      scroller().scrollLeft -= 100
      await still()
      expect(rect(column()).right).toBeCloseTo(innerWidth, 0)
      expect(dialog()).toBeInTheDocument()
      scroller().scrollLeft -= 700
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('moves no more than a pixel with preventDismissal', async () => {
      render(<Modal preventDismissal />)
      await opened()
      scroller().scrollBy({ left: -300, behavior: 'instant' })
      await still()
      expect(rect(column()).right).toBeGreaterThanOrEqual(innerWidth - 1)
      expect(dialog()).toBeInTheDocument()
    })
  })

  describe('motion', () => {
    it('slides in from the window’s end as React Aria scrolls it, the scrim fading in with it', async () => {
      render(<Modal defaultOpen={false} />)
      press(screen.getByRole('button', { name: 'Open' }))
      const read = await track(
        () => ({ shows: shows(), scrim: Number(getComputedStyle(scrim()).opacity) }),
        () => !layer().hasAttribute('data-entering'),
      )
      // From out of sight in to all of it, never back out on the way.
      expect(read[0]!.shows).toBeLessThanOrEqual(0)
      expect(read.at(-1)!.shows).toBeCloseTo(256, 0)
      for (const [index, each] of read.entries())
        if (index > 0) expect(each.shows).toBeGreaterThanOrEqual(read[index - 1]!.shows - 0.5)
      // The scrim as far in as the sheet is on its way there.
      expect(read.some(({ shows }) => shows > 30 && shows < 226)).toBe(true)
      // From a frame on: React Aria plays the scrim along the sheet's scroll once that has begun.
      for (const { shows, scrim } of read.slice(1))
        expect(scrim).toBeCloseTo(Math.min(1, Math.max(0, shows / 256)), 1)
    })

    it('slides out the same way, and is gone', async () => {
      render(<Modal />)
      await opened()
      dialog().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      const read = await track(
        () => (screen.queryByTestId('panel') ? shows() : null),
        () => !screen.queryByTestId('panel'),
      )
      const showing = read.filter((each) => each !== null)
      expect(showing[0]).toBeCloseTo(256, 0)
      for (const [index, each] of showing.entries())
        if (index > 0) expect(each).toBeLessThanOrEqual(showing[index - 1]! + 0.5)
      expect(showing.some((each) => each > 30 && each < 226)).toBe(true)
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('is where it is going at once', async () => {
        render(<Modal defaultOpen={false} />)
        await userEvent.click(screen.getByRole('button', { name: 'Open' }))
        await frame()
        await frame()
        expect(shows()).toBeCloseTo(256, 0)
        expect(getComputedStyle(scrim()).opacity).toBe('1')
      })
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('draws the sheet’s edge in a system color', async () => {
      render(<Modal />)
      await opened()
      const style = getComputedStyle(panel())
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderTopWidth).toBe('1px')
      expect(style.borderTopColor).toBe(computedColor('CanvasText', panel()))
    })
  })
})

describe('a standard sheet (browser)', () => {
  it('is at the end of its row, as tall as it, surface and square, the body taking the rest', async () => {
    render(<Row />)
    await atRest()
    expect(rect(panel()).right).toBe(rect(row()).right)
    expect(rect(panel()).width).toBeCloseTo(256, 1)
    expect(rect(panel()).height).toBe(rect(row()).height)
    expect(rect(body()).width).toBeCloseTo(960 - 256, 1)
    const style = getComputedStyle(panel())
    expect(style.backgroundColor).toBe(role('surface', panel()))
    expect(style.boxShadow).toBe('none')
    expect(radii(panel())).toEqual(['0px', '0px', '0px', '0px'])
    // The column it holds is as wide and as tall as it.
    expect(rect(column())).toEqual(rect(panel()))
  })

  it('keeps 16dp from the row’s edges and the body detached, round at every corner', async () => {
    render(<Row isDetached />)
    await atRest()
    expect(rect(row()).right - rect(panel()).right).toBeCloseTo(16, 1)
    expect(rect(panel()).left - rect(body()).right).toBeCloseTo(16, 1)
    expect(rect(panel()).top - rect(row()).top).toBeCloseTo(16, 1)
    expect(radii(panel())).toEqual(['16px', '16px', '16px', '16px'])
  })

  it('takes its width from the body on the emphasized easing over 1000ms, and gives it back', async () => {
    const { rerender } = render(<Row isOpen={false} />)
    rerender(<Row isOpen />)
    await waitFor(() => expect(transitionOf(panel(), 'width')).toBeTruthy())
    const shown = frames(panel(), 'width', () => 960 - rect(body()).width)
    expect(shown.at(-1)![0]).toBeCloseTo(1000, 0)
    for (const [time, width] of shown) expect(width).toBeCloseTo(256 * emphasized(time / 1000), 0)
    await settle()
    rerender(<Row isOpen={false} />)
    await waitFor(() => expect(transitionOf(panel(), 'width')).toBeTruthy())
    const hidden = frames(panel(), 'width', () => 960 - rect(body()).width)
    for (const [time, width] of hidden)
      expect(width).toBeCloseTo(256 * (1 - emphasized(time / 1000)), 0)
  })

  it('gives back its margins with its width detached', async () => {
    const { rerender } = render(<Row isDetached />)
    await atRest()
    rerender(<Row isDetached isOpen={false} />)
    await waitFor(() => expect(transitionOf(panel(), 'width')).toBeTruthy())
    const hidden = frames(panel(), 'width', () => 960 - rect(body()).width)
    expect(hidden[0]![1]).toBeCloseTo(256 + 32, 0)
    expect(hidden.at(-1)![1]).toBeCloseTo(0, 0)
  })

  it('holds a column as wide as it once shown, centered in it as it is revealed', async () => {
    const { rerender } = render(<Row isOpen={false} />)
    rerender(<Row isOpen />)
    await waitFor(() => expect(transitionOf(panel(), 'width')).toBeTruthy())
    const transition = transitionOf(panel(), 'width')!
    transition.pause()
    transition.currentTime = 200
    const [outer, inner] = [rect(panel()), rect(column())]
    expect(outer.width).toBeGreaterThan(10)
    expect(outer.width).toBeLessThan(250)
    expect(inner.width).toBeCloseTo(256, 1)
    expect(inner.left + inner.width / 2).toBeCloseTo(outer.left + outer.width / 2, 1)
    transition.finish()
  })

  it('fades what it holds in 300ms on, over 250ms, and out at once, over 150ms 100ms on', async () => {
    const { rerender } = render(<Row isOpen={false} />)
    rerender(<Row isOpen />)
    await waitFor(() => expect(transitionOf(column(), 'opacity')).toBeTruthy())
    const fadeIn = transitionOf(column(), 'opacity')!.effect!.getTiming()
    expect(fadeIn).toMatchObject({ delay: 300, duration: 250, easing: 'linear' })
    await settle()
    rerender(<Row isOpen={false} />)
    await waitFor(() => expect(transitionOf(column(), 'opacity')).toBeTruthy())
    const fadeOut = transitionOf(column(), 'opacity')!.effect!.getTiming()
    expect(fadeOut).toMatchObject({ delay: 100, duration: 150, easing: 'linear' })
  })

  it('is at the start of a right-to-left row, revealed from there', async () => {
    render(
      <div dir="rtl">
        <Row />
      </div>,
    )
    await atRest()
    expect(rect(panel()).left).toBe(rect(row()).left)
    expect(rect(body()).left).toBeCloseTo(rect(panel()).right, 1)
  })

  it('takes the focus to its close button as it is shown, and gives it back once it has left for Escape', async () => {
    function Shown() {
      const [isOpen, setOpen] = useState(false)
      return (
        <div className="flex h-150 w-240">
          <main className="min-w-0 grow">
            <Button onPress={() => setOpen(true)}>Info</Button>
          </main>
          <SideSheet aria-label="Info" data-testid="panel" isOpen={isOpen} onOpenChange={setOpen}>
            <SideSheetHeader>
              <Heading slot="title">Info</Heading>
              <IconButton aria-label="Close" slot="close">
                <Icon name="close" />
              </IconButton>
            </SideSheetHeader>
          </SideSheet>
        </div>
      )
    }
    render(<Shown />)
    const info = screen.getByRole('button', { name: 'Info' })
    await userEvent.click(info)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus())
    await atRest()
    await userEvent.keyboard('{Escape}')
    expect(panel()).toHaveAttribute('data-exiting')
    // Gone once it has given its width back, over its 1000ms, and the focus with it.
    await waitFor(() => expect(screen.queryByTestId('panel')).toBeNull(), { timeout: 3000 })
    await waitFor(() => expect(info).toHaveFocus())
  })
})

describe('the header (browser)', () => {
  it('lays the header out as measured: 24dp from the top, 16dp to a back icon, 24dp to a close icon, 12dp between', async () => {
    render(<Parts />)
    await atRest()
    const sheet = rect(panel())
    const heading = rect(screen.getByRole('heading', { name: 'Labels' }))
    const [back, close] = [
      rect(screen.getByRole('button', { name: 'Back' })),
      rect(screen.getByRole('button', { name: 'Close' })),
    ]
    // The icons are 24dp in the middle of their 40dp boxes.
    const [backIcon, closeIcon] = [back.left + 8, close.right - 8]
    expect(heading.top - sheet.top).toBeCloseTo(24, 1)
    expect(heading.height).toBeCloseTo(28, 1)
    expect(backIcon - sheet.left).toBeCloseTo(16, 1)
    expect(heading.left - (backIcon + 24)).toBeCloseTo(12, 1)
    expect(close.left + 8 - heading.right).toBeCloseTo(12, 1)
    expect(sheet.right - closeIcon).toBeCloseTo(24, 1)
    // Each icon button is centered on the headline's line.
    for (const button of [back, close])
      expect(button.top + button.height / 2).toBeCloseTo(heading.top + heading.height / 2, 1)
  })

  it('puts the headline 24dp from either side with nothing beside it', async () => {
    render(
      <Row>
        <SideSheetHeader>
          <Heading slot="title">Labels</Heading>
        </SideSheetHeader>
      </Row>,
    )
    await atRest()
    const [sheet, heading] = [rect(panel()), rect(screen.getByRole('heading'))]
    expect(heading.left - sheet.left).toBeCloseTo(24, 1)
    expect(sheet.right - heading.right).toBeCloseTo(24, 1)
  })

  it('keeps a close icon 24dp from the end without a headline', async () => {
    render(
      <Row>
        <SideSheetHeader>
          <IconButton aria-label="Close">
            <Icon name="close" />
          </IconButton>
        </SideSheetHeader>
      </Row>,
    )
    await atRest()
    expect(
      rect(panel()).right - (rect(screen.getByRole('button', { name: 'Close' })).right - 8),
    ).toBeCloseTo(24, 1)
  })

  it('colors the headline and icon buttons on-surface-variant, in title large', async () => {
    render(<Parts />)
    await atRest()
    const heading = screen.getByRole('heading', { name: 'Labels' })
    expect(getComputedStyle(heading).color).toBe(role('on-surface-variant', heading))
    expect(getComputedStyle(heading).fontSize).toBe('22px')
    expect(getComputedStyle(heading).lineHeight).toBe('28px')
    expect(getComputedStyle(screen.getByRole('button', { name: 'Close' })).color).toBe(
      role('on-surface-variant', heading),
    )
  })
})

describe('reduced motion', () => {
  useReducedMotion()

  it('shows and hides a standard sheet at once', async () => {
    const { rerender } = render(<Row isOpen={false} />)
    rerender(<Row isOpen />)
    await frame()
    await frame()
    expect(parseFloat(getComputedStyle(panel()).transitionDuration)).toBeLessThan(0.001)
    expect(rect(panel()).width).toBeCloseTo(256, 1)
  })
})

describe('forced colors', () => {
  useForcedColors()

  it('draws a standard sheet’s edge in a system color', async () => {
    render(<Row />)
    await atRest()
    const style = getComputedStyle(panel())
    expect(style.borderTopStyle).toBe('solid')
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopColor).toBe(computedColor('CanvasText', panel()))
  })
})

describe('contrast', () => {
  it.each(schemes)(
    'reads the headline and icons on either fill (%s, %s contrast)',
    async (theme, contrast) => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <Parts />
        </Scheme>,
      )
      await atRest()
      const heading = screen.getByRole('heading', { name: 'Labels' })
      for (const fill of ['surface', 'surface-container-low']) {
        const background = role(fill, heading)
        expect(contrastRatio(getComputedStyle(heading).color, background)).toBeGreaterThanOrEqual(
          4.5,
        )
      }
    },
  )
})
