import { act, cleanup, render, screen } from '@testing-library/react'
import { Text } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import type { Except } from '../../lib/aria'
import {
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  schemes,
  settle,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { Button } from '../button'
import { Icon } from '../icon'
import {
  Snackbar,
  SnackbarAction,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
  type SnackbarProps,
} from './snackbar'

/* What needs a real browser and stylesheet: the snackbar's size, parts and colors against the spec's
 * measurements and tokens, its region's place, focus rings, contrast, forced colors, and its motion
 * against the guidelines' video. Markup and behavior: snackbar.test.tsx. */

type Message = { text: string; description?: string; action?: string; hasClose?: boolean }

/* React Aria portals the region to the body, outside any wrapper, so a scheme is put on the
 * document itself here, and the page's surface painted on the body. */
function themeDocument(theme: 'light' | 'dark', contrast: 'standard' | 'medium' | 'high') {
  document.documentElement.dataset.theme = theme
  if (contrast !== 'standard') document.documentElement.dataset.contrast = contrast
}

beforeEach(() => {
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(async () => {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.contrast
  document.body.style.background = ''
  await page.viewport(1280, 896)
})

const snackbar = () => screen.getByRole('alertdialog')
const region = () => screen.getByRole('region')
const button = (name: string) => screen.getByRole('button', { name })
const rectOf = (el: Element) => el.getBoundingClientRect()
const token = (role: string) => computedColor(`var(--md-sys-color-${role})`, document.body)

/** The box of an element's text, as laid out, without the box around it. */
function textRect(el: Element) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  range.selectNodeContents(walker.nextNode()!)
  return range.getBoundingClientRect()
}

/** A queue's region, each snackbar drawn from what it says. */
function Snackbars({
  queue,
  regionClassName,
  ...props
}: Except<SnackbarProps<Message>, 'toast' | 'children'> & {
  queue: SnackbarQueue<Message>
  regionClassName?: string
}) {
  return (
    <SnackbarRegion queue={queue} className={regionClassName}>
      {({ toast }) => (
        <Snackbar {...props} toast={toast}>
          <SnackbarContent>
            <Text slot="title">{toast.content.text}</Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </SnackbarContent>
          {toast.content.action && (
            <SnackbarAction onPress={() => queue.close(toast.key)}>
              {toast.content.action}
            </SnackbarAction>
          )}
          {toast.content.hasClose && (
            <SnackbarCloseButton>
              <Icon name="close" />
            </SnackbarCloseButton>
          )}
        </Snackbar>
      )}
    </SnackbarRegion>
  )
}

/** A snackbar shown and done with its transition, 344dp wide unless the region says otherwise. */
async function open(message: Message, regionClassName = 'w-86') {
  const queue = new SnackbarQueue<Message>()
  render(
    <>
      <Button>Archive</Button>
      <Snackbars queue={queue} regionClassName={regionClassName} />
    </>,
  )
  let key = ''
  act(() => {
    key = queue.add(message)
  })
  await vi.waitFor(() => snackbar())
  await settle()
  return { el: snackbar(), queue, key }
}

const longText = 'Two-line snackbar with action, its text past one line'

describe('Snackbar', () => {
  it('is 48dp tall on one line, its body-medium text 16dp in, its line 14dp from the top and bottom', async () => {
    const { el } = await open({ text: 'Single-line snackbar' })
    const content = screen.getByRole('alert')
    expect(rectOf(el).height).toBe(48)
    expect(rectOf(content).left - rectOf(el).left).toBe(16)
    expect(
      rectOf(content).top - rectOf(el).top + parseFloat(getComputedStyle(content).paddingTop),
    ).toBe(14)
    const style = getComputedStyle(content)
    expect([style.fontSize, style.lineHeight, style.letterSpacing, style.fontWeight]).toEqual([
      '14px',
      '20px',
      '0.25px',
      '400',
    ])
  })

  it('is 68dp tall on two lines, which leave 16dp at its end', async () => {
    const { el } = await open({ text: `${longText}, and a little more` })
    const text = screen.getByText(/Two-line/)
    expect(rectOf(el).height).toBe(68)
    expect(rectOf(el).right - rectOf(text).right).toBeGreaterThanOrEqual(16)
  })

  it('puts its description on a line of its own, under its title, 68dp tall', async () => {
    const { el } = await open({ text: 'Photo archived', description: 'Find it in your archive.' })
    const title = screen.getByText('Photo archived')
    const description = screen.getByText('Find it in your archive.')
    expect(rectOf(description).top).toBe(rectOf(title).bottom)
    expect(rectOf(description).left).toBe(rectOf(title).left)
    expect(rectOf(el).height).toBe(68)
  })

  it('ends its action, a 40dp text Button in label large padded 12dp at its sides, 8dp from its end, its label 20dp in, centered', async () => {
    const { el } = await open({ text: 'Single-line snackbar with action', action: 'Action' })
    const action = button('Action')
    const style = getComputedStyle(action)
    expect(rectOf(action).height).toBe(40)
    expect([style.paddingLeft, style.paddingRight]).toEqual(['12px', '12px'])
    expect(rectOf(el).right - rectOf(action).right).toBe(8)
    expect(rectOf(el).right - textRect(action).right).toBe(20)
    expect(rectOf(action).top - rectOf(el).top).toBe(4)
    // The text 8dp before it, so 20dp before its label.
    expect(rectOf(action).left - rectOf(screen.getByRole('alert')).right).toBe(8)
    expect([style.fontSize, style.lineHeight, style.letterSpacing, style.fontWeight]).toEqual([
      '14px',
      '20px',
      '0.1px',
      '500',
    ])
  })

  it('centers its action on two lines of text, 68dp tall', async () => {
    const { el } = await open({ text: longText, action: 'Action' })
    expect(rectOf(el).height).toBe(68)
    expect(rectOf(button('Action')).top - rectOf(el).top).toBe(14)
  })

  it('sets its close button’s 24dp icon 12dp from its end, 24dp after the action’s label, as the spec measures', async () => {
    const { el } = await open({ text: 'Single-line', action: 'Action', hasClose: true })
    const icon = button('Close').querySelector('.font-icon')!
    expect(rectOf(icon).width).toBe(24)
    expect(rectOf(el).right - rectOf(icon).right).toBe(12)
    expect(rectOf(icon).left - textRect(button('Action')).right).toBe(24)
    expect(rectOf(button('Close')).top - rectOf(el).top).toBe(4)
  })

  it('puts an action longer than 128dp below the text, at its end with the close button, the text on the whole row', async () => {
    const { el } = await open({ text: longText, action: 'Longer action', hasClose: true })
    const content = screen.getByRole('alert')
    const action = button('Longer action')
    const close = button('Close')
    expect(rectOf(action).top).toBeGreaterThanOrEqual(rectOf(content).bottom)
    expect(rectOf(close).top).toBe(rectOf(action).top)
    expect(rectOf(close).left).toBe(rectOf(action).right + 4)
    expect(rectOf(el).right - rectOf(close).right).toBe(4)
    expect(rectOf(content).width).toBe(rectOf(el).width - 16 - 8 - 4)
    expect(rectOf(el).bottom - rectOf(action).bottom).toBe(4)
    // Two lines of text, 10dp under them, then the buttons: 108dp.
    expect(rectOf(el).height).toBe(108)
  })

  it('keeps an action and close button of 128dp or less beside the text, which wraps', async () => {
    await open({ text: longText, action: 'Retry', hasClose: true })
    const content = screen.getByRole('alert')
    expect(rectOf(button('Retry')).top).toBeLessThan(rectOf(content).bottom)
    expect(rectOf(button('Close')).top).toBe(rectOf(button('Retry')).top)
  })

  const longAction = 'Open the archived photo in another app to edit it'

  it('wraps an action wider than a compact window’s snackbar in its row, short of the close button beside it', async () => {
    await page.viewport(360, 800)
    const { el } = await open({ text: 'Photo archived', action: longAction, hasClose: true }, '')
    const action = button(longAction)
    const close = button('Close')
    expect(rectOf(action).left).toBe(rectOf(el).left + 16)
    expect(rectOf(close).left).toBe(rectOf(action).right + 4)
    expect(rectOf(el).right - rectOf(close).right).toBe(4)
    expect(rectOf(close).top - rectOf(action).top).toBe((rectOf(action).height - 40) / 2)
    // Its label on two lines, 12dp in from its sides.
    expect(rectOf(action).height).toBe(60)
    expect(textRect(action).left - rectOf(action).left).toBeGreaterThanOrEqual(12)
    expect(rectOf(action).right - textRect(action).right).toBeGreaterThanOrEqual(12)
  })

  it('wraps one with no close button in its row, 8dp from its end', async () => {
    await page.viewport(360, 800)
    const { el } = await open({ text: 'Photo archived', action: longAction }, '')
    const action = button(longAction)
    expect(rectOf(action).left).toBeGreaterThanOrEqual(rectOf(el).left + 16)
    expect(rectOf(el).right - rectOf(action).right).toBe(8)
    expect(rectOf(action).height).toBe(60)
  })

  it('is inverse-surface with its text inverse-on-surface, its action inverse-primary and its close icon inverse-on-surface', async () => {
    const { el } = await open({ text: 'Email archived', action: 'Undo', hasClose: true })
    expect(getComputedStyle(el).backgroundColor).toBe(token('inverse-surface'))
    expect(getComputedStyle(screen.getByRole('alert')).color).toBe(token('inverse-on-surface'))
    expect(getComputedStyle(button('Undo')).color).toBe(token('inverse-primary'))
    expect(getComputedStyle(button('Close')).color).toBe(token('inverse-on-surface'))
  })

  it('has 4dp corners on elevation 3', async () => {
    const { el } = await open({ text: 'Email archived' })
    expect(getComputedStyle(el).borderRadius).toBe(computedRadius('rounded-shape-xs'))
    expect(getComputedStyle(el).borderRadius).toBe('4px')
    expect(getComputedStyle(el).boxShadow).toBe(
      computedStyleOf('shadow-elevation-3', (style) => style.boxShadow),
    )
  })

  it('draws its buttons’ hover state layers in their own colors, inverse-primary and inverse-on-surface', async () => {
    await open({ text: 'Email archived', action: 'Undo', hasClose: true })
    for (const [name, role] of [
      ['Undo', 'inverse-primary'],
      ['Close', 'inverse-on-surface'],
    ] as const) {
      await userEvent.hover(button(name))
      await settle()
      const layer = button(name).querySelector('.state-layer')!
      expect(getComputedStyle(layer).backgroundColor, name).toBe(token(role))
      expect(getComputedStyle(layer).opacity, name).toBe('0.08')
    }
  })

  it('draws its action and close button round, 40dp tall, and no container of their own', async () => {
    await open({ text: 'Email archived', action: 'Undo', hasClose: true })
    for (const name of ['Undo', 'Close']) {
      const style = getComputedStyle(button(name))
      expect(rectOf(button(name)).height, name).toBe(40)
      expect(style.borderRadius, name).toBe(computedRadius('rounded-full'))
      expect(style.backgroundColor, name).toBe('rgba(0, 0, 0, 0)')
    }
    expect(rectOf(button('Close')).width).toBe(40)
  })

  it('draws a disabled action and close button on-surface at 38%, as Compose’s', async () => {
    const queue = new SnackbarQueue<Message>()
    render(
      <SnackbarRegion queue={queue}>
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content.text}</Text>
            </SnackbarContent>
            <SnackbarAction isDisabled>Undo</SnackbarAction>
            <SnackbarCloseButton isDisabled>
              <Icon name="close" />
            </SnackbarCloseButton>
          </Snackbar>
        )}
      </SnackbarRegion>,
    )
    act(() => void queue.add({ text: 'Email archived' }))
    await vi.waitFor(() => snackbar())
    const disabled = computedStyleOf('text-on-surface/disabled-content', (style) => style.color)
    expect(getComputedStyle(button('Undo')).color).toBe(disabled)
    expect(getComputedStyle(button('Close')).color).toBe(disabled)
  })

  it('draws the focus ring around it on keyboard focus, which Tab reaches, and Escape closes it', async () => {
    const { el } = await open({ text: 'Email archived', action: 'Undo' })
    await userEvent.click(button('Archive'))
    await userEvent.keyboard('{Tab}')
    expect(el).toHaveFocus()
    const style = getComputedStyle(el)
    expect(style.outlineStyle).toBe('solid')
    expect(style.outlineWidth).toBe('3px')
    expect(style.outlineOffset).toBe('2px')
    expect(style.outlineColor).toBe(token('secondary'))
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(button('Archive')).toHaveFocus()
  })

  it('draws its buttons’ focus rings in their own colors, inverse-primary and inverse-on-surface', async () => {
    await open({ text: 'Email archived', action: 'Undo', hasClose: true })
    await userEvent.click(button('Archive'))
    await userEvent.keyboard('{Tab}')
    for (const [name, role] of [
      ['Undo', 'inverse-primary'],
      ['Close', 'inverse-on-surface'],
    ] as const) {
      await userEvent.keyboard('{Tab}')
      expect(button(name)).toHaveFocus()
      const style = getComputedStyle(button(name))
      expect([style.outlineStyle, style.outlineWidth, style.outlineOffset], name).toEqual([
        'solid',
        '3px',
        '2px',
      ])
      expect(style.outlineColor, name).toBe(token(role))
    }
  })
})

describe('SnackbarRegion', () => {
  it('holds it at the bottom of the window, centered, 12dp up and up to 600dp wide', async () => {
    const { el } = await open({ text: 'Photo archived' }, '')
    expect(rectOf(el).width).toBe(600)
    expect(innerHeight - rectOf(el).bottom).toBe(12)
    expect(rectOf(el).left).toBe((innerWidth - 600) / 2)
  })

  it('holds it 12dp from the leading, trailing and bottom edges of a compact window', async () => {
    await page.viewport(412, 800)
    const { el } = await open({ text: 'Photo archived' }, '')
    expect(rectOf(el).left).toBe(12)
    expect(innerWidth - rectOf(el).right).toBe(12)
    expect(innerHeight - rectOf(el).bottom).toBe(12)
  })

  it('is in front of the page, and moved by its className, as above a FAB or to the start', async () => {
    const { el } = await open({ text: 'Photo archived' }, 'bottom-22 mx-0')
    expect(innerHeight - rectOf(el).bottom).toBe(88)
    expect(rectOf(el).left).toBe(12)
    expect(getComputedStyle(region()).zIndex).toBe(
      computedStyleOf('z-snackbar', (style) => style.zIndex),
    )
  })

  it('draws the focus ring around its snackbar when F6 focuses it, still in front of the page', async () => {
    await open({ text: 'Photo archived' }, '')
    await userEvent.click(button('Archive'))
    await userEvent.keyboard('{F6}')
    expect(region()).toHaveFocus()
    const style = getComputedStyle(region())
    expect([style.outlineStyle, style.outlineWidth, style.outlineOffset]).toEqual([
      'solid',
      '3px',
      '2px',
    ])
    expect(style.zIndex).toBe(computedStyleOf('z-snackbar', (style) => style.zIndex))
    expect(rectOf(region()).toJSON()).toEqual(rectOf(snackbar()).toJSON())
  })
})

describe('Snackbar motion', () => {
  /* The guidelines' video at each frame of a 60fps screen: the M3 emphasized easing, its path of two
   * cubics, which a snackbar grows on, and the ease in and out its fades are on. */
  const frames = Array.from({ length: 28 }, (_, frame) => (frame * 1000) / 60)

  type Curve = [number, number, number, number, number, number, number, number]

  /** A path of cubic Béziers from (0, 0) to (1, 1), each given as its four points, as a function of x. */
  function easing(...curves: Curve[]) {
    const at = (s: number, a: number, b: number, c: number, d: number) =>
      (1 - s) ** 3 * a + 3 * (1 - s) ** 2 * s * b + 3 * (1 - s) * s ** 2 * c + s ** 3 * d
    return (x: number) => {
      if (x <= 0) return 0
      if (x >= 1) return 1
      const [ax, ay, bx, by, cx, cy, dx, dy] = curves.find((curve) => x <= curve[6])!
      let [low, high] = [0, 1]
      for (let step = 0; step < 50; step++) {
        const mid = (low + high) / 2
        if (at(mid, ax, bx, cx, dx) < x) low = mid
        else high = mid
      }
      return at((low + high) / 2, ay, by, cy, dy)
    }
  }
  const emphasized = easing(
    [0, 0, 0.05, 0, 0.133333, 0.06, 0.166666, 0.4],
    [0.166666, 0.4, 0.208333, 0.82, 0.25, 1, 1, 1],
  )
  const easeInOut = easing([0, 0, 0.33, 0, 0.67, 1, 1, 1])

  /** The transitions the next update runs, as they start. */
  function nextTransition() {
    const start = document.startViewTransition.bind(document)
    return new Promise<ViewTransition>((resolve) => {
      vi.spyOn(document, 'startViewTransition').mockImplementationOnce((options) => {
        const transition = start(options as StartViewTransitionOptions)
        resolve(transition)
        return transition
      })
    })
  }

  /** The view transition's animations of the snackbar with this key, paused once it is ready. */
  async function pausedAnimations(transition: ViewTransition, key: string) {
    await transition.ready
    const animations = document
      .getAnimations()
      .filter(({ effect }) => (effect as KeyframeEffect).pseudoElement?.includes(`(${key})`))
    animations.forEach((animation) => animation.pause())
    return animations
  }

  const namesOf = (animations: Animation[]) =>
    animations.map((animation) => (animation as CSSAnimation).animationName).sort()

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('grows a snackbar from a line 2.7dp below its bottom edge on the M3 emphasized easing over 450ms, in its place, what it holds cut to it, 10dp up, and fading in from 2 frames in over 11', async () => {
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    const started = nextTransition()
    let key = ''
    act(() => {
      key = queue.add({ text: 'Photo archived', action: 'Undo' })
    })
    const transition = await started
    expect([...transition.types]).toEqual(['snackbar'])
    // It draws itself: the view transition has nothing of it to animate.
    expect(await pausedAnimations(transition, key)).toEqual([])
    // Named by its key in a view transition of its own, and only there.
    expect(getComputedStyle(snackbar()).viewTransitionName).toBe(key)
    expect(getComputedStyle(snackbar()).viewTransitionClass).toBe('snackbar')
    const animations = snackbar().getAnimations({ subtree: true })
    animations.forEach((animation) => animation.pause())
    expect(namesOf(animations)).toEqual([
      'snackbar-enter',
      'snackbar-part-enter',
      'snackbar-part-enter',
      'snackbar-part-fade-in',
      'snackbar-part-fade-in',
    ])
    const seek = (ms: number) => animations.forEach((animation) => (animation.currentTime = ms))
    const [text, label, content] = [
      screen.getByText('Photo archived'),
      button('Undo'),
      screen.getByRole('alert'),
    ]
    seek(1000)
    const [rest, restText, restLabel, room] = [
      rectOf(snackbar()),
      textRect(text),
      textRect(label),
      rectOf(region()),
    ]
    for (const ms of frames) {
      seek(ms)
      const left = 1 - emphasized(ms / 450)
      const box = rectOf(snackbar())
      expect(
        Math.abs(box.top - rest.top - (rest.height + 2.7) * left),
        `top at ${ms}ms`,
      ).toBeLessThan(0.1)
      expect(Math.abs(box.bottom - rest.bottom - 2.7 * left), `bottom at ${ms}ms`).toBeLessThan(0.1)
      expect(Math.abs(box.left - rest.left) + Math.abs(box.width - rest.width)).toBeLessThan(0.01)
      // Its margin and height are rounded apart, to a 64th of a pixel each.
      expect(Math.abs(rectOf(region()).top - room.top), `region at ${ms}ms`).toBeLessThan(0.04)
      // Its first line at its top edge, then with it, 10dp lower in it.
      const fall = (rest.height + 2.7 - 14) * left
      expect(Math.abs(textRect(text).top - restText.top - fall), `text at ${ms}ms`).toBeLessThan(
        0.1,
      )
      expect(Math.abs(textRect(label).top - restLabel.top - fall), `label at ${ms}ms`).toBeLessThan(
        0.1,
      )
      const fade = easeInOut((ms - 100 / 3) / (550 / 3))
      for (const part of [content, label]) {
        expect(Math.abs(parseFloat(getComputedStyle(part).opacity) - fade), `${ms}ms`).toBeLessThan(
          0.005,
        )
      }
      expect(getComputedStyle(snackbar()).overflow, `${ms}ms`).toBe(ms < 450 ? 'clip' : 'visible')
    }
    animations.forEach((animation) => animation.finish())
    await transition.finished
    expect(getComputedStyle(snackbar()).viewTransitionName).toBe('none')
  })

  it('grows one of two lines and a long action below them the same way, its height its own', async () => {
    const queue = new SnackbarQueue<Message>({ wrapUpdate: undefined })
    render(<Snackbars queue={queue} regionClassName="w-86" />)
    act(() => {
      queue.add({ text: longText, action: 'Longer action, past 128dp', hasClose: true })
    })
    const animations = snackbar().getAnimations({ subtree: true })
    animations.forEach((animation) => animation.pause())
    const seek = (ms: number) => animations.forEach((animation) => (animation.currentTime = ms))
    seek(1000)
    const rest = rectOf(snackbar())
    expect(rest.height).toBeGreaterThan(100)
    for (const ms of frames) {
      seek(ms)
      const left = 1 - emphasized(ms / 450)
      const box = rectOf(snackbar())
      expect(Math.abs(box.height - rest.height * (1 - left)), `height at ${ms}ms`).toBeLessThan(0.1)
      expect(Math.abs(box.bottom - rest.bottom - 2.7 * left), `bottom at ${ms}ms`).toBeLessThan(0.1)
    }
  })

  it('fades one out over 150ms, easing in and out, in a view transition of its own type that leaves the page out, then takes it away', async () => {
    const { queue, key } = await open({ text: 'Photo archived' })
    const started = nextTransition()
    act(() => queue.close(key))
    const transition = await started
    expect([...transition.types]).toEqual(['snackbar'])
    const animations = await pausedAnimations(transition, key)
    expect(namesOf(animations)).toEqual(['snackbar-exit'])
    expect(getComputedStyle(document.documentElement).viewTransitionName).toBe('none')
    expect(screen.queryByRole('alertdialog')).toBeNull()
    const pseudo = `::view-transition-old(${key})`
    for (const ms of frames) {
      animations.forEach((animation) => (animation.currentTime = ms))
      const style = getComputedStyle(document.documentElement, pseudo)
      const opacity = 1 - easeInOut(ms / 150)
      expect(Math.abs(parseFloat(style.opacity) - opacity), `${ms}ms`).toBeLessThan(0.005)
      expect(style.scale, `${ms}ms`).toBe('none')
    }
    animations.forEach((animation) => animation.finish())
    await transition.finished
  })

  it('fades one out as the next grows in, in its place, when it is added meanwhile', async () => {
    const { queue, key } = await open({ text: 'Photo archived' })
    const place = rectOf(snackbar())
    const started = nextTransition()
    let next = ''
    act(() => {
      next = queue.add({ text: 'Email archived' })
    })
    const transition = await started
    const old = await pausedAnimations(transition, key)
    expect(namesOf(old)).toEqual(['snackbar-exit'])
    expect(await pausedAnimations(transition, next)).toEqual([])
    const added = snackbar().getAnimations()
    expect(namesOf(added)).toEqual(['snackbar-enter'])
    added.forEach((animation) => animation.finish())
    expect(rectOf(snackbar()).toJSON()).toEqual(place.toJSON())
    old.forEach((animation) => animation.finish())
    await transition.finished
  })

  it('lets a press through to the page while it runs, in a part of it named for transitions of its own too', async () => {
    const queue = new SnackbarQueue<Message>()
    const onPress = vi.fn()
    render(
      <>
        <Button onPress={() => onPress('Archive')}>Archive</Button>
        <div style={{ viewTransitionName: 'page' }}>
          <Button onPress={() => onPress('Edit')}>Edit</Button>
        </div>
        <Snackbars queue={queue} />
      </>,
    )
    let key = ''
    act(() => {
      key = queue.add({ text: 'Photo archived' })
    })
    await vi.waitFor(() => snackbar())
    await settle()
    const started = nextTransition()
    act(() => queue.close(key))
    const transition = await started
    const animations = await pausedAnimations(transition, key)
    for (const name of ['Archive', 'Edit']) {
      const { left, top, width, height } = rectOf(button(name))
      await commands.pointer('html', left + width / 2, top + height / 2, 'down')
      await commands.pointer('html', left + width / 2, top + height / 2, 'up')
    }
    expect(onPress.mock.calls).toEqual([['Archive'], ['Edit']])
    expect(await pausedAnimations(transition, 'page')).toEqual([])
    animations.forEach((animation) => animation.finish())
    await transition.finished
  })

  it('takes no part in another view transition, such as a calendar’s page turning, so that a press meanwhile reaches it', async () => {
    // One that leaves the rest of the page out and lets the pointer through, as a calendar's does.
    const style = document.createElement('style')
    style.textContent = `
      :root:active-view-transition-type(other) { view-transition-name: none; }
      :root:active-view-transition-type(other)::view-transition { pointer-events: none; }
    `
    document.head.append(style)
    const onPress = vi.fn()
    const queue = new SnackbarQueue<Message>()
    render(
      <>
        <div style={{ viewTransitionName: 'page' }}>Page</div>
        <SnackbarRegion queue={queue}>
          {({ toast }) => (
            <Snackbar toast={toast}>
              <SnackbarContent>
                <Text slot="title">{toast.content.text}</Text>
              </SnackbarContent>
              <SnackbarAction onPress={onPress}>Undo</SnackbarAction>
            </Snackbar>
          )}
        </SnackbarRegion>
      </>,
    )
    let key = ''
    act(() => {
      key = queue.add({ text: 'Photo archived' })
    })
    await vi.waitFor(() => snackbar())
    await settle()
    try {
      const transition = document.startViewTransition({ update: () => {}, types: ['other'] })
      const page = await pausedAnimations(transition, 'page')
      expect(page).not.toHaveLength(0)
      expect(getComputedStyle(snackbar()).viewTransitionName).toBe('none')
      expect(await pausedAnimations(transition, key)).toEqual([])
      const { left, top, width, height } = rectOf(button('Undo'))
      await commands.pointer('html', left + width / 2, top + height / 2, 'down')
      await commands.pointer('html', left + width / 2, top + height / 2, 'up')
      expect(onPress).toHaveBeenCalledOnce()
      page.forEach((animation) => animation.finish())
      await transition.finished
    } finally {
      style.remove()
    }
  })

  describe('with reduced motion', () => {
    useReducedMotion()

    it('shows and hides it at once, with no view transition', async () => {
      const queue = new SnackbarQueue<Message>()
      render(<Snackbars queue={queue} />)
      const start = vi.spyOn(document, 'startViewTransition')
      let key = ''
      act(() => {
        key = queue.add({ text: 'Photo archived' })
      })
      expect(snackbar()).toBeVisible()
      const animations = snackbar().getAnimations({ subtree: true })
      expect(animations).not.toHaveLength(0)
      for (const animation of animations) {
        expect(animation.effect!.getComputedTiming().endTime).toBeLessThan(1)
      }
      act(() => queue.close(key))
      expect(screen.queryByRole('alertdialog')).toBeNull()
      expect(start).not.toHaveBeenCalled()
    })
  })
})

describe('Snackbar accessibility in a browser', () => {
  // WCAG 1.4.3: its 14px text and its action's label need 4.5:1, and 1.4.11 its close icon and
  // its buttons' focus rings 3:1.
  it.each(schemes)(
    'keeps its text and action at 4.5:1 and its close icon and focus rings at 3:1 or more, %s scheme, %s contrast',
    async (theme, contrast) => {
      themeDocument(theme, contrast)
      const { el } = await open({ text: 'Email archived', action: 'Undo', hasClose: true })
      const fill = getComputedStyle(el).backgroundColor
      expect(
        contrastRatio(getComputedStyle(screen.getByRole('alert')).color, fill),
        'its text',
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(getComputedStyle(button('Undo')).color, fill),
        'its action',
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(getComputedStyle(button('Close')).color, fill),
        'its close icon',
      ).toBeGreaterThanOrEqual(3)
      await userEvent.click(button('Archive'))
      await userEvent.keyboard('{Tab}')
      for (const name of ['Undo', 'Close']) {
        await userEvent.keyboard('{Tab}')
        expect(button(name)).toHaveFocus()
        expect(
          contrastRatio(getComputedStyle(button(name)).outlineColor, fill),
          `its ${name} button's focus ring`,
        ).toBeGreaterThanOrEqual(3)
      }
    },
  )

  describe('in forced colors', () => {
    useForcedColors()

    it('outlines it, as it loses its fill, but not its buttons, which have no container', async () => {
      const { el } = await open({ text: 'Email archived', action: 'Undo', hasClose: true })
      expect(getComputedStyle(el).borderTopStyle).toBe('solid')
      expect(parseFloat(getComputedStyle(el).borderTopWidth)).toBeGreaterThanOrEqual(1)
      for (const name of ['Undo', 'Close'])
        expect(getComputedStyle(button(name)).borderTopWidth, name).toBe('0px')
      cleanup()
    })
  })
})
