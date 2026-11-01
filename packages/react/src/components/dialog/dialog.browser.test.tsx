import { render, screen, waitFor } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { Heading, Text } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  computedColor,
  contrastRatio,
  pressAsViewTransitionStarts,
  rgba,
  schemes,
  settle,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { AppBar } from '../app-bar'
import { BottomSheet } from '../bottom-sheet'
import { Button } from '../button'
import { Divider } from '../divider'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import type { Except } from '../../lib/aria'
import { Dialog, DialogTrigger, type DialogProps } from '.'

/* What needs a real browser and stylesheet: where a dialog sits and how wide it is, its fill,
 * corners, padding and the scrim, the motion it opens and closes on, contrast and forced colors.
 * What it holds is the test's own, unstyled. Markup, roles and what closes a dialog:
 * dialog.test.tsx. */

const frame = () => new Promise(requestAnimationFrame)
const panel = () => screen.getByTestId('panel')
const layer = () => panel().parentElement!
const rect = (el: Element) => el.getBoundingClientRect()
const fill = (el: Element) => getComputedStyle(el, '::before')
const role = (name: string, el: Element) => computedColor(`var(--md-sys-color-${name})`, el)
const opacity = (el: Element) => Number(getComputedStyle(el).opacity)
const scrimAlpha = () => rgba(getComputedStyle(layer()).backgroundColor)[3]! / 255

/** Where the text of a node is drawn, inside whatever padding its element has. */
function textBox(node: Node) {
  const range = document.createRange()
  range.selectNodeContents(node)
  return range.getBoundingClientRect()
}

/** A cubic Bézier easing at progress `t`, as CSS draws `cubic-bezier(x1, y1, x2, y2)`. */
function bezier(x1: number, y1: number, x2: number, y2: number, t: number) {
  const at = (u: number, a: number, b: number) =>
    3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u * u * b + u ** 3
  let [low, high] = [0, 1]
  for (let step = 0; step < 50; step++) {
    const middle = (low + high) / 2
    if (at(middle, x1, x2) < t) low = middle
    else high = middle
  }
  return at((low + high) / 2, y1, y2)
}
const clamp = (value: number) => Math.min(1, Math.max(0, value))

// How far the guidelines' video has opened its dialog at each frame, 0 to 1, as measured from
// its container's top edge: the easing dialog.css draws it on.
const opened = [
  0, 0.0054, 0.0198, 0.0495, 0.0915, 0.1619, 0.2733, 0.4788, 0.6342, 0.7189, 0.7741, 0.8103, 0.8389,
  0.8645, 0.8837, 0.8983, 0.9113, 0.9251, 0.9344, 0.9423, 0.95, 0.9584, 0.9625, 0.9687, 0.9718,
  0.9782, 0.9799, 0.983, 0.9876, 0.9894, 0.9906, 0.9921, 0.9952, 0.9967, 0.998, 0.999, 1,
]

/** Lets a dialog come to rest: React Aria draws one as it starts (data-entering) at first. */
async function atRest() {
  await frame()
  await frame()
  await waitFor(() => expect(document.querySelector('[data-entering]')).toBeNull())
  await settle()
}

/**
 * Escape, which React Aria hears on the dialog in front: where the focus is in one, or else on
 * the last one, since React Aria moves the focus into one opened by a script's click only once
 * the page's transitions have ended.
 */
function escape() {
  const dialogs = document.querySelectorAll('[role="alertdialog"], [role="dialog"]')
  const target =
    [...dialogs].find((it) => it.contains(document.activeElement)) ?? dialogs[dialogs.length - 1]!
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
}

/**
 * Pauses every transition on the page once the container's has started, and returns a function
 * that sets them all to a time, in milliseconds, and one that lets them finish.
 */
async function caught() {
  await waitFor(() =>
    expect(
      panel()
        .getAnimations()
        .some((it) => it instanceof CSSTransition),
    ).toBe(true),
  )
  const all = document.getAnimations().filter((it) => it instanceof CSSTransition)
  all.forEach((it) => it.pause())
  return {
    at: (time: number) => all.forEach((it) => (it.currentTime = time)),
    finish: () => all.forEach((it) => it.finish()),
  }
}

/** A dialog, which `props` go on, its parts given or a basic one's, and its trigger, Open, in the page. */
function Opener({
  defaultOpen = false,
  children,
  ...props
}: Except<DialogProps, 'children' | 'defaultOpen'> & {
  defaultOpen?: boolean
  children?: ReactNode
}) {
  return (
    <main data-testid="page">
      <DialogTrigger defaultOpen={defaultOpen}>
        <Button>Open</Button>
        <Dialog data-testid="panel" {...props}>
          {children ?? <Basic />}
        </Dialog>
      </DialogTrigger>
    </main>
  )
}

/** What a basic dialog holds: a headline, two lines of text and two actions that close it. */
function Basic() {
  return (
    <>
      <Heading slot="title" className="m-0">
        Use location service?
      </Heading>
      <Text slot="description" elementType="p" data-testid="content" className="m-0">
        Let this service help other apps determine your location. This means sharing anonymous
        location data, even when no apps are running.
      </Text>
      <div data-testid="actions">
        <Button variant="text" slot="close">
          Disagree
        </Button>
        <Button variant="text" slot="close">
          Agree
        </Button>
      </div>
    </>
  )
}

/** Opens the dialog from its button, inside the page, as a click does. */
const open = () => screen.getByRole('button', { name: 'Open' }).click()

beforeEach(() => {
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(async () => {
  document.documentElement.dir = 'ltr'
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.contrast
  document.body.style.background = ''
  await page.viewport(1280, 896)
})

describe('a basic dialog (browser)', () => {
  it('is in the middle of the window, as wide as its text up to 560dp, with 28dp corners', async () => {
    render(<Opener defaultOpen />)
    await atRest()
    const box = rect(panel())
    expect(box.width).toBeCloseTo(560, 1)
    expect(box.left + box.width / 2).toBeCloseTo(innerWidth / 2, 0)
    expect(box.top + box.height / 2).toBeCloseTo(innerHeight / 2, 0)
    expect(getComputedStyle(panel()).borderRadius).toBe('28px')
  })

  it('is no narrower than 280dp', async () => {
    render(
      <Opener defaultOpen>
        <Button variant="text">OK</Button>
      </Opener>,
    )
    await atRest()
    expect(rect(panel()).width).toBeCloseTo(280, 1)
  })

  it('is filled surface-container-high with no shadow over the scrim color at 32%', async () => {
    render(<Opener defaultOpen />)
    await atRest()
    const before = fill(panel())
    expect(before.backgroundColor).toBe(role('surface-container-high', panel()))
    expect(before.boxShadow).toBe('none')
    expect(getComputedStyle(panel()).boxShadow).toBe('none')
    expect(before.borderRadius).toBe('28px')
    expect(parseFloat(before.height)).toBeCloseTo(rect(panel()).height, 1)
    expect(parseFloat(before.width)).toBeCloseTo(rect(panel()).width, 1)
    const [r, g, b] = rgba(getComputedStyle(layer()).backgroundColor)
    expect([r, g, b]).toEqual(rgba(role('scrim', panel())).slice(0, 3))
    expect(scrimAlpha()).toBeCloseTo(0.32, 2)
    expect(rect(layer())).toMatchObject({ left: 0, top: 0, width: innerWidth, height: innerHeight })
  })

  it('has 24dp above and below what it holds, and none at its sides', async () => {
    render(<Opener defaultOpen />)
    await atRest()
    const box = rect(panel())
    expect(rect(screen.getByRole('heading')).top - box.top).toBeCloseTo(24, 1)
    expect(rect(screen.getByRole('heading')).left).toBeCloseTo(box.left, 1)
    expect(box.bottom - rect(screen.getByTestId('actions')).bottom).toBeCloseTo(24, 1)
  })

  it('sets what it holds in body medium on-surface-variant', async () => {
    render(<Opener defaultOpen />)
    await atRest()
    const text = getComputedStyle(screen.getByText(/Let this service/))
    expect([text.fontSize, text.lineHeight, text.letterSpacing]).toEqual(['14px', '20px', '0.25px'])
    expect(text.color).toBe(role('on-surface-variant', panel()))
  })

  it('breaks a word too long for it', async () => {
    await page.viewport(412, 915)
    render(
      <Opener defaultOpen>
        <p className="m-0">https://example.com/settings/notifications/reset/all/of/them</p>
      </Opener>,
    )
    await atRest()
    expect(textBox(screen.getByText(/example/)).right).toBeLessThanOrEqual(
      rect(panel()).right + 0.5,
    )
  })

  it('keeps 56dp from the window’s edges, and 48dp from a compact window’s', async () => {
    const tall = <div className="h-250 w-200" />
    const { unmount } = render(<Opener defaultOpen>{tall}</Opener>)
    await atRest()
    expect(rect(panel()).top).toBeCloseTo(56, 1)
    expect(innerHeight - rect(panel()).bottom).toBeCloseTo(56, 1)
    expect(rect(panel()).width).toBeCloseTo(560, 1)
    unmount()
    await page.viewport(412, 915)
    render(<Opener defaultOpen>{tall}</Opener>)
    await atRest()
    expect(rect(panel()).top).toBeCloseTo(48, 1)
    expect(rect(panel()).left).toBeCloseTo(48, 1)
    expect(innerWidth - rect(panel()).right).toBeCloseTo(48, 1)
  })

  it('holds what it is given in a column the container bounds, where a part of yours can scroll', async () => {
    render(
      <Opener defaultOpen>
        <>
          <Heading slot="title" className="m-0">
            Phone ringtone
          </Heading>
          <Divider />
          <div data-testid="content" className="min-h-0 overflow-y-auto">
            <div className="h-250" />
          </div>
          <Divider />
          <Button variant="text">OK</Button>
        </>
      </Opener>,
    )
    await atRest()
    const content = screen.getByTestId('content')
    const ok = screen.getByRole('button', { name: 'OK' })
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
    expect(rect(panel()).bottom - rect(ok).bottom).toBeCloseTo(24, 1)
    // The dividers span the container, which has no padding at its sides.
    for (const divider of panel().querySelectorAll('hr'))
      expect(rect(divider).width).toBeCloseTo(rect(panel()).width, 1)
  })

  it('opens as the guidelines’ video draws it: down 49dp as its fill grows, what it holds after', async () => {
    render(<Opener />)
    open()
    const { at, finish } = await caught()
    at(1000)
    const [rest, height] = [rect(panel()).top, rect(panel()).height]
    for (const [k, progress] of opened.entries()) {
      const time = (k * 1000) / 60
      at(time)
      expect(rect(panel()).top - rest, `frame ${k}`).toBeCloseTo(-49 * (1 - progress), 1)
      expect(parseFloat(fill(panel()).height), `frame ${k}`).toBeCloseTo(
        height * (0.29 + 0.71 * progress),
        1,
      )
      // The container shows at once; what it holds fades in 62.5ms on, over 112.5ms, and the
      // scrim 75ms on, over 125ms.
      expect(opacity(panel())).toBe(1)
      for (const it of [
        screen.getByRole('heading'),
        ...['content', 'actions'].map((id) => screen.getByTestId(id)),
      ])
        expect(opacity(it)).toBeCloseTo(clamp((time - 62.5) / 112.5), 2)
      expect(scrimAlpha()).toBeCloseTo(0.32 * clamp((time - 75) / 125), 2)
    }
    finish()
  })

  // Cut away, a part of the Dialog takes no pointer either: what the point hits tells.
  it('draws none of what it holds past its fill as the fill grows', async () => {
    render(<Opener />)
    open()
    const { at, finish } = await caught()
    const dialog = screen.getByRole('alertdialog')
    const agree = screen.getByRole('button', { name: 'Agree' })
    let below = 0
    for (const time of [0, 50, 100, 150, 200, 250]) {
      at(time)
      const edge = rect(panel()).top + parseFloat(fill(panel()).height)
      const button = rect(agree)
      if (button.bottom <= edge + 1) continue
      below++
      const point = document.elementFromPoint(
        button.left + button.width / 2,
        Math.max(edge + 1, button.top + button.height / 2),
      )
      expect(dialog.contains(point), `${time}ms`).toBe(false)
    }
    expect(below).toBeGreaterThan(0)
    finish()
    await atRest()
    const button = rect(agree)
    const point = document.elementFromPoint(
      button.left + button.width / 2,
      button.top + button.height / 2,
    )
    expect(agree.contains(point)).toBe(true)
  })

  it('closes as the video does: up and shrinking over 66.7ms as it fades, the scrim after', async () => {
    render(<Opener defaultOpen />)
    await atRest()
    const [rest, height] = [rect(panel()).top, rect(panel()).height]
    escape()
    const { at, finish } = await caught()
    for (let k = 0; k <= 9; k++) {
      const time = (k * 1000) / 60
      at(time)
      const progress = bezier(0.3, 0, 0.8, 0.15, clamp(time / (200 / 3)))
      expect(rect(panel()).top - rest, `frame ${k}`).toBeCloseTo(-49 * progress, 1)
      expect(parseFloat(fill(panel()).height)).toBeCloseTo(height * (1 - 0.71 * progress), 1)
      expect(opacity(panel())).toBeCloseTo(1 - clamp((time - 50 / 3) / (200 / 3)), 2)
      expect(opacity(screen.getByRole('heading'))).toBeCloseTo(1 - clamp(time / 50), 2)
      expect(opacity(screen.getByTestId('actions'))).toBeCloseTo(1 - clamp(time / 50), 2)
      expect(scrimAlpha()).toBeCloseTo(0.32 * (1 - clamp((time - 62.5) / 75)), 2)
    }
    finish()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('fades dividers with the rest, which keeps them off the page beside a fill yet to grow', async () => {
    render(
      <Opener>
        <>
          <Heading slot="title" className="m-0">
            Phone ringtone
          </Heading>
          <Divider />
          <div className="h-75" />
          <Divider />
          <Button variant="text">OK</Button>
        </>
      </Opener>,
    )
    open()
    let { at, finish } = await caught()
    const dividers = [...panel().querySelectorAll('hr')]
    for (const time of [0, 50, 100, 150, 200]) {
      at(time)
      for (const divider of dividers)
        expect(opacity(divider), `${time}ms`).toBeCloseTo(clamp((time - 62.5) / 112.5), 2)
    }
    finish()
    await atRest()
    escape()
    ;({ at, finish } = await caught())
    for (const time of [0, 25, 50]) {
      at(time)
      for (const divider of dividers)
        expect(opacity(divider), `${time}ms`).toBeCloseTo(1 - clamp(time / 50), 2)
    }
    finish()
  })

  it('lays out and fades what a form in it holds as its own, a part of yours scrolling', async () => {
    render(
      <Opener>
        <form>
          <Heading slot="title" className="m-0">
            Rename file
          </Heading>
          <div data-testid="content" className="min-h-0 overflow-y-auto">
            <div className="h-250" />
          </div>
          <div data-testid="actions">
            <Button variant="text" type="submit">
              Rename
            </Button>
          </div>
        </form>
      </Opener>,
    )
    open()
    const { at, finish } = await caught()
    for (const time of [0, 100, 200]) {
      at(time)
      for (const it of [
        screen.getByRole('heading'),
        ...['content', 'actions'].map((id) => screen.getByTestId(id)),
      ])
        expect(opacity(it)).toBeCloseTo(clamp((time - 62.5) / 112.5), 2)
    }
    finish()
    await atRest()
    const box = rect(panel())
    const content = screen.getByTestId('content')
    expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
    expect(rect(screen.getByRole('heading')).top - box.top).toBeCloseTo(24, 1)
    expect(box.bottom - rect(screen.getByRole('button', { name: 'Rename' })).bottom).toBeCloseTo(
      24,
      1,
    )
    expect(innerHeight - box.bottom).toBeCloseTo(56, 1)
  })

  describe('with reduced motion', () => {
    useReducedMotion()

    it('opens and closes at once', async () => {
      render(<Opener />)
      open()
      await atRest()
      const parts = [layer(), panel(), ...screen.getByRole('alertdialog').children]
      const times = (style: CSSStyleDeclaration) =>
        [style.transitionDuration, style.transitionDelay].flatMap((it) => it.split(', '))
      const instant = () => {
        for (const style of [...parts.map((it) => getComputedStyle(it)), fill(panel())])
          for (const time of times(style)) expect(parseFloat(time)).toBeLessThan(0.001)
      }
      instant()
      expect(opacity(screen.getByTestId('actions'))).toBe(1)
      expect(scrimAlpha()).toBeCloseTo(0.32, 2)
      // And closing: the timings the layer and the container take while they say so.
      for (const it of [layer(), panel()]) it.setAttribute('data-exiting', '')
      instant()
      for (const it of [layer(), panel()]) it.removeAttribute('data-exiting')
    })
  })

  it('focuses itself and keeps Tab in it; the page is inert until it closes', async () => {
    render(<Opener />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const [disagree, agree] = ['Disagree', 'Agree'].map((name) =>
      screen.getByRole('button', { name }),
    )
    await waitFor(() => expect(screen.getByRole('alertdialog')).toHaveFocus())
    await userEvent.tab()
    expect(disagree).toHaveFocus()
    expect(screen.getByTestId('page').closest<HTMLElement>('body > *')!.inert).toBe(true)
    expect(getComputedStyle(document.documentElement).overflow).toBe('hidden')
    await userEvent.tab()
    expect(agree).toHaveFocus()
    await userEvent.tab()
    expect(disagree).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByTestId('page').closest<HTMLElement>('body > *')!.inert).toBe(false)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus())
  })

  it('leaves what is next to the page as the app made it while the dialog was open', async () => {
    const widget = document.body.appendChild(document.createElement('div'))
    widget.setAttribute('aria-hidden', 'true')
    try {
      render(<Opener />)
      open()
      await atRest()
      widget.removeAttribute('aria-hidden')
      escape()
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      await frame()
      expect(widget).not.toHaveAttribute('aria-hidden')
    } finally {
      widget.remove()
    }
  })

  // React Aria's DialogTrigger reports its button pressed while the dialog is open.
  it('keeps its trigger pressed while it is open, a shape-morphing Button in its pressed shape', async () => {
    render(
      <DialogTrigger>
        <Button hasShapeMorph>Open</Button>
        <Dialog data-testid="panel">
          <Basic />
        </Dialog>
      </DialogTrigger>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    const resting = getComputedStyle(trigger).borderRadius
    await userEvent.click(trigger)
    await atRest()
    expect(trigger).toHaveAttribute('data-pressed')
    expect(getComputedStyle(trigger).borderRadius).not.toBe(resting)
    escape()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(trigger).not.toHaveAttribute('data-pressed')
  })

  it('takes no second press of an action as it leaves, and still gives the focus back', async () => {
    render(<Opener />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await atRest()
    const agree = screen.getByRole('button', { name: 'Agree' })
    let presses = 0
    agree.addEventListener('click', () => presses++)
    await userEvent.dblClick(agree)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(presses).toBe(1)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus())
  })

  it('is closed by a click on the scrim, and not by one on its container', async () => {
    render(<Opener defaultOpen />)
    await atRest()
    await userEvent.click(panel(), { position: { x: 4, y: 40 } })
    // A dialog closing is there a while yet: not closing is what tells.
    await frame()
    await frame()
    expect(layer()).not.toHaveAttribute('data-exiting')
    await userEvent.click(layer(), { position: { x: 8, y: 8 } })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  // What a press on the scrim lands on is the scrim: one on the document itself is the browser's.
  it('is not closed by a press the browser gives the document, as it does as a view transition starts', async () => {
    render(<Opener defaultOpen />)
    await atRest()
    const box = rect(panel())
    expect(await pressAsViewTransitionStarts(box.left + 4, box.top + 40)).toEqual([
      document.documentElement,
    ])
    await frame()
    await frame()
    expect(layer()).not.toHaveAttribute('data-exiting')
  })

  describe('in forced colors', () => {
    useForcedColors()

    it('draws its container’s edge', async () => {
      render(<Opener defaultOpen />)
      await atRest()
      const style = getComputedStyle(panel())
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderTopWidth).toBe('1px')
    })
  })

  // WCAG 1.4.3: text needs 4.5:1.
  it.each(schemes)('reads its text on its fill (%s, %s contrast)', async (theme, contrast) => {
    document.documentElement.dataset.theme = theme
    if (contrast !== 'standard') document.documentElement.dataset.contrast = contrast
    render(<Opener defaultOpen />)
    await atRest()
    const text = getComputedStyle(screen.getByText(/Let this service/)).color
    expect(contrastRatio(text, fill(panel()).backgroundColor)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('a full-screen dialog (browser)', () => {
  /** A full-screen dialog's parts: its app bar, and fields taller than the window. */
  function FullScreen() {
    return (
      <>
        <AppBar>
          <IconButton slot="leading" aria-label="Close">
            <Icon name="close" />
          </IconButton>
          <Heading slot="headline">New event</Heading>
          <Button slot="trailing" variant="text">
            Save
          </Button>
        </AppBar>
        <div data-testid="content" className="h-250 shrink-0" />
      </>
    )
  }

  it('fills the window up to 560dp wide, surface and square, its header a 64dp app bar', async () => {
    render(
      <Opener isFullScreen defaultOpen>
        <FullScreen />
      </Opener>,
    )
    await atRest()
    const box = rect(panel())
    expect(box).toMatchObject({ top: 0, height: innerHeight, width: 560 })
    expect(box.left).toBeCloseTo((innerWidth - 560) / 2, 1)
    const style = getComputedStyle(panel())
    expect(style.backgroundColor).toBe(role('surface', panel()))
    expect(style.boxShadow).toBe('none')
    expect(style.borderRadius).toBe('0px')
    const header = rect(screen.getByRole('banner'))
    expect(header).toMatchObject({ top: 0, height: 64, width: 560 })
    // The close icon 16dp in, the headline 56dp in, in title large on-surface.
    const close = rect(screen.getByRole('button', { name: 'Close' }))
    expect(close.left + close.width / 2 - box.left).toBeCloseTo(28, 1)
    const headline = screen.getByText('New event')
    const font = getComputedStyle(headline)
    // The heading spans the room after the target; its text starts 4dp into it, its own padding.
    expect(rect(headline).left + Number.parseFloat(font.paddingLeft) - box.left).toBeCloseTo(56, 1)
    expect([font.fontSize, font.lineHeight]).toEqual(['22px', '28px'])
    expect(font.color).toBe(role('on-surface', panel()))
  })

  it('fills the window of a compact one', async () => {
    await page.viewport(412, 915)
    render(
      <Opener isFullScreen defaultOpen>
        <FullScreen />
      </Opener>,
    )
    await atRest()
    expect(rect(panel())).toMatchObject({ left: 0, top: 0, width: 412, height: 915 })
  })

  it('keeps what the keyboard focuses below its header as it scrolls', async () => {
    await page.viewport(412, 700)
    const names = Array.from({ length: 12 }, (_, i) => `Field ${i + 1}`)
    render(
      <Opener isFullScreen defaultOpen>
        <>
          <AppBar>
            <Heading slot="headline">New event</Heading>
          </AppBar>
          <div className="flex flex-col gap-space-200">
            {names.map((name) => (
              <input key={name} aria-label={name} className="h-14 shrink-0" />
            ))}
          </div>
        </>
      </Opener>,
    )
    await atRest()
    screen.getByRole('textbox', { name: 'Field 12' }).focus()
    const header = rect(screen.getByRole('banner'))
    for (let i = 0; i < names.length - 1; i++) {
      await userEvent.tab({ shift: true })
      expect(rect(document.activeElement!).top).toBeGreaterThanOrEqual(header.bottom - 0.5)
    }
  })

  it('scrolls under its header, which stays and fills with surface-container', async () => {
    render(
      <Opener isFullScreen defaultOpen>
        <FullScreen />
      </Opener>,
    )
    await atRest()
    const header = screen.getByRole('banner')
    expect(getComputedStyle(header).backgroundColor).toBe(role('surface', panel()))
    // Read before waiting: reading a role adds a probe to the page, which waitFor would see.
    const filled = role('surface-container', panel())
    panel().scrollTop = 300
    await waitFor(() => expect(getComputedStyle(header).backgroundColor).toBe(filled))
    expect(rect(header).top).toBe(0)
  })

  it('slides up from below the window over 400ms, and back down over 150ms', async () => {
    render(
      <Opener isFullScreen>
        <FullScreen />
      </Opener>,
    )
    open()
    let { at, finish } = await caught()
    for (let k = 0; k <= 24; k++) {
      const time = (k * 1000) / 60
      at(time)
      const progress = bezier(0.05, 0.7, 0.1, 1, clamp(time / 400))
      expect(rect(panel()).top, `frame ${k}`).toBeCloseTo(innerHeight * (1 - progress), 0)
      // What it holds goes with it and does not fade.
      expect(opacity(screen.getByTestId('content'))).toBe(1)
    }
    finish()
    await atRest()
    escape()
    ;({ at, finish } = await caught())
    for (let k = 0; k <= 9; k++) {
      const time = (k * 1000) / 60
      at(time)
      const progress = bezier(0.3, 0, 0.8, 0.15, clamp(time / 150))
      expect(rect(panel()).top, `frame ${k}`).toBeCloseTo(innerHeight * progress, 0)
    }
    finish()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('has a basic dialog over it, which Escape closes first', async () => {
    // Closing it asks first, in a basic dialog opened over it, as the guidelines' video does:
    // that one beside the DialogTrigger, whose id a Dialog in it would take.
    function Discard() {
      const [confirming, setConfirming] = useState(false)
      return (
        <>
          <Opener isFullScreen aria-label="New event">
            <>
              <AppBar>
                <IconButton slot="leading" aria-label="Close" onPress={() => setConfirming(true)}>
                  <Icon name="close" />
                </IconButton>
                <Heading slot="headline">New event</Heading>
              </AppBar>
            </>
          </Opener>
          <Dialog isOpen={confirming} onOpenChange={setConfirming} aria-label="Discard draft">
            <Text slot="description">Discard draft?</Text>
          </Dialog>
        </>
      )
    }
    render(<Discard />)
    open()
    await atRest()
    screen.getByRole('button', { name: 'Close' }).click()
    await atRest()
    const basic = screen.getByRole('alertdialog')
    expect(basic).toHaveAccessibleDescription('Discard draft?')
    const fullScreen = screen.getByRole('dialog', { hidden: true })
    expect(
      fullScreen.compareDocumentPosition(basic) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    await waitFor(() => expect(basic).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByRole('dialog')).toHaveAccessibleName('New event')
  })

  it.each(schemes)('reads its headline on its fill (%s, %s contrast)', async (theme, contrast) => {
    document.documentElement.dataset.theme = theme
    if (contrast !== 'standard') document.documentElement.dataset.contrast = contrast
    render(
      <Opener isFullScreen defaultOpen>
        <FullScreen />
      </Opener>,
    )
    await atRest()
    const headline = screen.getByText('New event')
    expect(
      contrastRatio(getComputedStyle(headline).color, getComputedStyle(panel()).backgroundColor),
    ).toBeGreaterThanOrEqual(4.5)
  })
})

describe('a dialog with a modal sheet (browser)', () => {
  // A modal sheet is a React Aria Modal as well: together, the page is inert and locked while
  // either is open, and given back once both are gone.
  const marks = () => {
    const root = screen.getByTestId('page').closest<HTMLElement>('body > *')!
    return [root.inert, document.documentElement.style.overflow]
  }
  const held = [true, 'hidden']
  const free = [false, '']
  const settled = async () => {
    await waitFor(() =>
      expect(document.querySelector('[role="alertdialog"], [role="dialog"]')).toBeNull(),
    )
    for (let i = 0; i < 3; i++) await frame()
  }

  /** A modal bottom sheet, and a dialog written next to it that asks before it is discarded. */
  function Discard() {
    const [sheet, setSheet] = useState(true)
    const [asking, setAsking] = useState(false)
    return (
      <>
        <main data-testid="page">Page</main>
        <BottomSheet isModal isOpen={sheet} onOpenChange={setSheet} aria-label="Filters">
          <button type="button" onClick={() => setAsking(true)}>
            Close
          </button>
        </BottomSheet>
        <Dialog isOpen={asking} onOpenChange={setAsking} aria-label="Discard">
          <div>
            <Button variant="text" onPress={() => setSheet(false)}>
              Keep editing
            </Button>
            <Button
              variant="text"
              onPress={() => {
                setAsking(false)
                setSheet(false)
              }}
            >
              Discard
            </Button>
          </div>
        </Dialog>
      </>
    )
  }

  it('gives the page back once both close together', async () => {
    render(<Discard />)
    await settle()
    screen.getByRole('button', { name: 'Close' }).click()
    await atRest()
    expect(marks()).toEqual(held)
    screen.getByRole('button', { name: 'Discard' }).click()
    await settled()
    expect(marks()).toEqual(free)
  })

  it('keeps the page inert behind the dialog once the sheet closes, and gives it back after', async () => {
    render(<Discard />)
    await settle()
    screen.getByRole('button', { name: 'Close' }).click()
    await atRest()
    // This one closes the sheet behind the dialog, and leaves the dialog open.
    screen.getByRole('button', { name: 'Keep editing' }).click()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await frame()
    expect(marks()).toEqual(held)
    escape()
    await settled()
    expect(marks()).toEqual(free)
  })

  // React Aria gives the page back as a dialog starts to leave, before it is removed.
  it('gives the page back as it starts to leave', async () => {
    render(<Discard />)
    await settle()
    screen.getByRole('button', { name: 'Close' }).click()
    await atRest()
    screen.getByRole('button', { name: 'Keep editing' }).click()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await frame()
    escape()
    await frame()
    expect(screen.getByRole('alertdialog').parentElement).toHaveAttribute('data-exiting')
    expect(marks()).toEqual(free)
    await settled()
    expect(marks()).toEqual(free)
  })

  it('leaves Escape to a sheet opened in front of it, and gives the page back after both', async () => {
    // The sheet beside the DialogTrigger, whose id a React Aria Dialog in it would take.
    function Picker() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <Opener defaultOpen>
            <Button onPress={() => setOpen(true)}>Pick</Button>
          </Opener>
          <BottomSheet isModal isOpen={open} onOpenChange={setOpen} aria-label="Ringtones">
            <button type="button">Callisto</button>
          </BottomSheet>
        </>
      )
    }
    render(<Picker />)
    await atRest()
    await userEvent.click(screen.getByRole('button', { name: 'Pick' }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
    await settle()
    // React Aria hears Escape on the overlay in front alone, once the focus has moved into it.
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    const sheet = () => screen.queryByRole('dialog', { hidden: true })
    await waitFor(() => expect(sheet()).not.toBeInTheDocument())
    expect(marks()).toEqual(held)
    // The focus goes back to Pick once the sheet has left.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pick' })).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await settled()
    expect(marks()).toEqual(free)
  })
})
