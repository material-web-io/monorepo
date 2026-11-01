import { cleanup, render, screen } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { Dialog, DialogTrigger, Heading, Link, Text } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  catchTransitions,
  computedColor,
  computedStyleOf,
  contrastRatio,
  pressEscape,
  schemes,
  settle,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { AppBar } from '../app-bar'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  PreviewTrigger,
  Tooltip,
  TooltipPopover,
  TooltipTrigger,
  type TooltipPopoverProps,
  type TooltipProps,
} from './tooltip'

/* What needs a real browser and stylesheet: each variant's size, colors, type and shape, where a
 * tooltip is placed, a rich one's parts against the kit's, its fade against Compose's,
 * contrast, forced colors and reduced motion, and the real pointer and keys. Markup and timing in
 * React Aria's delays: tooltip.test.tsx. */

/*
 * React Aria portals a tooltip to the body, outside any wrapper, so a scheme is put on the
 * document itself here, and the page's surface painted on the body.
 */
function themeDocument(theme: 'light' | 'dark', contrast: 'standard' | 'medium' | 'high') {
  document.documentElement.dataset.theme = theme
  if (contrast !== 'standard') document.documentElement.dataset.contrast = contrast
}

beforeEach(() => {
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(() => {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.contrast
  document.body.style.background = ''
})

const tooltip = () => screen.getByRole('tooltip')
const button = (name: string) => screen.getByRole('button', { name })
const rectOf = (el: Element) => el.getBoundingClientRect()
const centerX = (el: Element) => rectOf(el).left + rectOf(el).width / 2
const token = (role: string) => computedColor(`var(--md-sys-color-${role})`, document.body)

/** A padded page, far enough from the window's edges that a rich tooltip centered on its first
 * trigger has room, for a trigger to open from. */
function Page({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ padding: '96px 200px', display: 'flex', gap: 96, ...style }}>{children}</div>
}

/** An icon button with a tooltip open from the start, done with its opening. */
async function openOn(props: Partial<TooltipProps> = {}, label = 'Add to favorites') {
  render(
    <Page>
      <TooltipTrigger defaultOpen>
        <IconButton aria-label="Favorite">
          <Icon name="star" />
        </IconButton>
        <Tooltip {...props}>{props.children ?? label}</Tooltip>
      </TooltipTrigger>
    </Page>,
  )
  await settle()
  return tooltip()
}

const supporting =
  'Rich tooltips bring attention to a particular element of feature that warrants a person’s focus.'

/** A rich tooltip of the kit's, a TooltipPopover open from the start, done with its opening. */
async function richOn({
  subhead = true,
  buttons = 2,
  ...props
}: Partial<TooltipPopoverProps> & { subhead?: boolean; buttons?: number } = {}) {
  render(
    <Page>
      <PreviewTrigger defaultOpen>
        <IconButton aria-label="Info">
          <Icon name="info" />
        </IconButton>
        <TooltipPopover {...props}>
          {subhead && <Heading>Rich tooltip</Heading>}
          <Text>{supporting}</Text>
          {Array.from({ length: buttons }, (_, index) => (
            <Button key={index} variant="text">
              {`Action ${index + 1}`}
            </Button>
          ))}
        </TooltipPopover>
      </PreviewTrigger>
    </Page>,
  )
  await settle()
  return screen.getByRole('dialog')
}

describe('Plain tooltip', () => {
  it('is 24dp tall, its body-small text 8dp from its sides and 4dp from its top and bottom', async () => {
    const el = await openOn()
    const style = getComputedStyle(el)
    expect(rectOf(el).height).toBe(24)
    expect([style.paddingLeft, style.paddingRight]).toEqual(['8px', '8px'])
    expect([style.paddingTop, style.paddingBottom]).toEqual(['4px', '4px'])
    expect([style.fontSize, style.lineHeight, style.letterSpacing, style.fontWeight]).toEqual([
      '12px',
      '16px',
      '0.4px',
      '400',
    ])
  })

  it('is inverse-on-surface on inverse-surface, its corners 4dp, with no shadow', async () => {
    const el = await openOn()
    const style = getComputedStyle(el)
    expect(style.backgroundColor).toBe(token('inverse-surface'))
    expect(style.color).toBe(token('inverse-on-surface'))
    expect(style.borderRadius).toBe('4px')
    expect(style.boxShadow).toBe('none')
  })

  it('stands 4dp above its icon button, centered on it', async () => {
    const el = await openOn()
    expect(el).toHaveAttribute('data-placement', 'top')
    expect(rectOf(button('Favorite')).top - rectOf(el).bottom).toBeCloseTo(4, 1)
    expect(centerX(el)).toBeCloseTo(centerX(button('Favorite')), 0)
  })

  it('stands 8dp away given offset={8}, for an element with no visual boundary', async () => {
    const el = await openOn({ offset: 8 })
    expect(rectOf(button('Favorite')).top - rectOf(el).bottom).toBeCloseTo(8, 1)
  })

  it('is below its button, at the same 4dp, given placement="bottom", as in an app bar', async () => {
    render(
      <AppBar style={{ width: 640, margin: 96 }}>
        <Heading slot="headline">Photos</Heading>
        <TooltipTrigger defaultOpen>
          <IconButton slot="trailing" aria-label="Share">
            <Icon name="share" />
          </IconButton>
          <Tooltip placement="bottom">Share</Tooltip>
        </TooltipTrigger>
      </AppBar>,
    )
    await settle()
    expect(tooltip()).toHaveAttribute('data-placement', 'bottom')
    expect(rectOf(tooltip()).top - rectOf(button('Share')).bottom).toBeCloseTo(4, 1)
    expect(centerX(tooltip())).toBeCloseTo(centerX(button('Share')), 0)
  })

  it('flips below its button where the window has no room above, and keeps 8dp from its side', async () => {
    render(
      <TooltipTrigger defaultOpen>
        <IconButton aria-label="Favorite" style={{ position: 'fixed', top: 0, left: 0 }}>
          <Icon name="star" />
        </IconButton>
        <Tooltip>Add to favorites</Tooltip>
      </TooltipTrigger>,
    )
    await settle()
    expect(tooltip()).toHaveAttribute('data-placement', 'bottom')
    expect(rectOf(tooltip()).top - rectOf(button('Favorite')).bottom).toBeCloseTo(4, 1)
    expect(rectOf(tooltip()).left).toBeCloseTo(8, 1)
  })

  it('wraps its text past 200dp, line by line', async () => {
    const el = await openOn(
      {},
      'Grant value is calculated using the closing stock price from the day before the grant date.',
    )
    expect(rectOf(el).width).toBe(200)
    expect(rectOf(el).height).toBe(4 + 16 * 3 + 4)
  })
})

describe('Rich tooltip', () => {
  it('is on-surface-variant on surface-container, body-medium, its corners 12dp, on elevation 2', async () => {
    const el = await openOn({
      variant: 'rich',
      children: (
        <>
          <Heading>Favorite</Heading>
          Find this later in your favorites.
        </>
      ),
    })
    const style = getComputedStyle(el)
    expect(style.backgroundColor).toBe(token('surface-container'))
    expect(style.color).toBe(token('on-surface-variant'))
    expect([style.fontSize, style.lineHeight, style.letterSpacing, style.fontWeight]).toEqual([
      '14px',
      '20px',
      '0.25px',
      '400',
    ])
    expect(style.borderRadius).toBe('12px')
    expect(style.boxShadow).toBe(computedStyleOf('shadow-elevation-2', (s) => s.boxShadow))
  })

  it('is centered below its trigger, 4dp away, as on desktop, its subhead in title-small', async () => {
    const el = await openOn({
      variant: 'rich',
      children: (
        <>
          <Heading>Favorite</Heading>
          Find this later in your favorites.
        </>
      ),
    })
    expect(el).toHaveAttribute('data-placement', 'bottom')
    expect(rectOf(el).top - rectOf(button('Favorite')).bottom).toBeCloseTo(4, 1)
    expect(centerX(el)).toBeCloseTo(centerX(button('Favorite')), 0)
    const subhead = getComputedStyle(screen.getByRole('heading'))
    expect([subhead.fontSize, subhead.lineHeight, subhead.fontWeight]).toEqual([
      '14px',
      '20px',
      '500',
    ])
  })

  it('holds its subhead 12dp from the top, its text 4dp below it and 12dp from the bottom, both 16dp in', async () => {
    const el = await richOn({ buttons: 0 })
    const [box, subhead, text] = [
      el,
      screen.getByRole('heading'),
      screen.getByText(supporting),
    ].map(rectOf)
    expect(subhead!.top - box!.top).toBe(12)
    expect(subhead!.height).toBe(20)
    expect(text!.top - subhead!.bottom).toBe(4)
    expect(box!.bottom - text!.bottom).toBe(12)
    expect([subhead!.left - box!.left, text!.left - box!.left]).toEqual([16, 16])
    expect([box!.right - subhead!.right, box!.right - text!.right]).toEqual([16, 16])
  })

  it('wraps past 320dp, as Compose’s does: the kit’s text on three lines', async () => {
    const el = await richOn({ buttons: 0 })
    expect(rectOf(el).width).toBe(320)
    expect(rectOf(screen.getByText(supporting)).height).toBe(60)
  })

  it('sets its buttons side by side 12dp below its text and 8dp above its bottom, the first label 16dp in', async () => {
    const el = await richOn({ buttons: 2 })
    const [first, second] = [button('Action 1'), button('Action 2')]
    const text = rectOf(screen.getByText(supporting))
    expect(rectOf(first).height).toBe(40)
    expect(rectOf(first).top - text.bottom).toBe(12)
    expect(rectOf(el).bottom - rectOf(first).bottom).toBe(8)
    expect(rectOf(second).top).toBe(rectOf(first).top)
    // A text button's label is 16dp in from its own edge.
    expect(rectOf(first).left + parseFloat(getComputedStyle(first).paddingLeft)).toBe(
      rectOf(el).left + 16,
    )
    expect(rectOf(second).left).toBe(rectOf(first).right)
  })

  it('is as tall as the kit’s five configurations: 156, 156, 108, 132 and 132dp', async () => {
    const heights = []
    for (const [subhead, buttons] of [
      [true, 2],
      [true, 1],
      [true, 0],
      [false, 1],
      [false, 2],
    ] as const) {
      heights.push(rectOf(await richOn({ subhead, buttons })).height)
      cleanup()
    }
    expect(heights).toEqual([156, 156, 108, 132, 132])
  })

  it('lays out a persistent one’s Dialog as its own parts, the popover around it unpadded', async () => {
    render(
      <Page>
        <DialogTrigger defaultOpen>
          <Button>Image quality</Button>
          <TooltipPopover isNonModal>
            <Dialog>
              <Heading slot="title">New settings available</Heading>
              <Text>Now you can adjust the uploaded image quality.</Text>
              <Button variant="text">Got it</Button>
              <Button variant="text">Learn more</Button>
            </Dialog>
          </TooltipPopover>
        </DialogTrigger>
      </Page>,
    )
    await settle()
    const dialog = screen.getByRole('dialog')
    const box = rectOf(dialog.parentElement!)
    expect(getComputedStyle(dialog.parentElement!).padding).toBe('0px')
    expect(rectOf(screen.getByRole('heading')).top - box.top).toBe(12)
    expect(rectOf(screen.getByRole('heading')).left - box.left).toBe(16)
    expect(rectOf(button('Got it')).left).toBe(box.left)
    expect(rectOf(button('Learn more')).left).toBe(rectOf(button('Got it')).right)
    expect(box.bottom - rectOf(button('Got it')).bottom).toBe(8)
    expect(getComputedStyle(dialog).outlineStyle).toBe('none')
  })
})

/** Compose's fast effects spring, critically damped at a stiffness of 3800: how far along it is
 * `ms` in, from 0 to 1. */
function fastEffects(ms: number) {
  const angle = (Math.sqrt(3800) * ms) / 1000
  return 1 - (1 + angle) * Math.exp(-angle)
}

/** The properties an animation's keyframes change. */
function animated(animation: Animation) {
  const keyframes = (animation.effect as KeyframeEffect).getKeyframes()
  const meta = ['offset', 'computedOffset', 'easing', 'composite']
  return [...new Set(keyframes.flatMap(Object.keys))].filter((it) => !meta.includes(it))
}

/** The one thing moving on a tooltip, its opacity's transition, paused. */
function fadeOf(el: Element) {
  const animations = el.getAnimations()
  expect(animations).toHaveLength(1)
  const [fade] = animations as CSSTransition[]
  expect(fade).toBeInstanceOf(CSSTransition)
  expect(animated(fade!)).toEqual(['opacity'])
  expect(fade!.effect!.getComputedTiming().duration).toBe(150)
  fade!.pause()
  return fade!
}

/** What else could move a tooltip as it fades: its place, its size and any clip. */
function still(el: Element, rect: DOMRect) {
  const { clipPath, transform, scale, translate } = getComputedStyle(el)
  expect({ clipPath, transform, scale, translate }).toEqual({
    clipPath: 'none',
    transform: 'none',
    scale: 'none',
    translate: 'none',
  })
  expect(rectOf(el).toJSON()).toEqual(rect.toJSON())
}

/** Each frame's opacity of an element, from now until the returned function is called. */
function opacities(el: Element) {
  const seen: number[] = []
  let frame = requestAnimationFrame(function tick() {
    seen.push(parseFloat(getComputedStyle(el).opacity))
    frame = requestAnimationFrame(tick)
  })
  return () => {
    cancelAnimationFrame(frame)
    return seen
  }
}

describe('Tooltip motion', () => {
  /* Compose's tooltip alpha, at each frame of a 60fps screen over its 150ms. */
  const frames = Array.from({ length: 10 }, (_, frame) => (frame * 1000) / 60)

  it('fades in, its opacity alone, on Compose’s fast effects spring over 150ms', async () => {
    render(
      <Page>
        <TooltipTrigger defaultOpen>
          <IconButton aria-label="Favorite">
            <Icon name="star" />
          </IconButton>
          <Tooltip>Add to favorites</Tooltip>
        </TooltipTrigger>
      </Page>,
    )
    const el = tooltip()
    const fade = fadeOf(el)
    fade.currentTime = 150
    const rect = rectOf(el)
    for (const ms of frames) {
      fade.currentTime = ms
      const opacity = parseFloat(getComputedStyle(el).opacity)
      expect(Math.abs(opacity - fastEffects(ms)), `${ms}ms`).toBeLessThan(0.01)
      still(el, rect)
    }
  })

  it('fades out, its opacity alone, on the same spring, then React Aria takes it away', async () => {
    const el = await openOn()
    const rect = rectOf(el)
    // In the page: a real key's answer can come after the fade, on a busy machine.
    pressEscape()
    const fade = fadeOf(el)
    for (const ms of frames) {
      fade.currentTime = ms
      const opacity = parseFloat(getComputedStyle(el).opacity)
      expect(Math.abs(opacity - (1 - fastEffects(ms))), `${ms}ms`).toBeLessThan(0.01)
      still(el, rect)
    }
    fade.finish()
    await settle()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('fades a TooltipPopover the same way', async () => {
    const el = await richOn()
    el.setAttribute('data-exiting', '')
    const fade = fadeOf(el)
    el.removeAttribute('data-exiting')
    fade.cancel()
  })

  it('appears at once, with no motion, as React Aria swaps one tooltip for the next', async () => {
    render(
      <Page>
        {['Favorite', 'Share'].map((name) => (
          <TooltipTrigger key={name} delay={0}>
            <IconButton aria-label={name}>
              <Icon name="star" />
            </IconButton>
            <Tooltip>{name}</Tooltip>
          </TooltipTrigger>
        ))}
      </Page>,
    )
    // React Aria takes a hover for the pointer's once the pointer has moved.
    await userEvent.hover(document.body)
    // Caught as it starts, in the page: the hover's answer can come after the fade is over.
    const fades = catchTransitions(document, (el) => el.getAttribute('role') === 'tooltip')
    await userEvent.hover(button('Favorite'))
    // The first fades in.
    expect(tooltip().getAnimations()).toHaveLength(1)
    fades.release()
    await settle()
    await userEvent.hover(button('Share'))
    expect(tooltip()).toHaveTextContent('Share')
    expect(tooltip().getAnimations()).toHaveLength(0)
  })

  describe('with reduced motion', () => {
    useReducedMotion()

    it('opens and closes at once', async () => {
      const el = await openOn()
      expect(parseFloat(getComputedStyle(el).transitionDuration)).toBeLessThan(0.001)
    })
  })

  describe('opened again as it fades in', () => {
    it('fades in once: the pointer crossing onto it, or off its trigger and back, opens it again without one', async () => {
      render(
        <Page>
          <TooltipTrigger delay={0}>
            <IconButton aria-label="Favorite">
              <Icon name="star" />
            </IconButton>
            <Tooltip>Add to favorites</Tooltip>
          </TooltipTrigger>
          <Button>Next</Button>
        </Page>,
      )
      await userEvent.hover(document.body)
      // Cold first: React Aria fades in only the first tooltip of a sequence, and a test before
      // this one can leave its sequence warm. Opened and left to close, its warmup over with it.
      await userEvent.hover(button('Favorite'))
      await userEvent.hover(document.body)
      await expect.poll(() => screen.queryByRole('tooltip'), { timeout: 4000 }).toBeNull()
      // Its fade caught as it starts, in the page, and held while the pointer moves: however late
      // each move is answered, it is still fading in.
      const fades = catchTransitions(document, (el) => el.getAttribute('role') === 'tooltip')
      await userEvent.hover(button('Favorite'))
      const [fade] = tooltip().getAnimations()
      expect(fade).toBeDefined()
      // React Aria opens it again at once for each, while it fades in.
      await userEvent.hover(tooltip())
      await userEvent.hover(button('Favorite'))
      await userEvent.hover(button('Next'))
      await userEvent.hover(button('Favorite'))
      // Still that one fade, with no other started.
      expect(tooltip().getAnimations()).toHaveLength(1)
      expect(tooltip().getAnimations()[0]).toBe(fade)
      fades.release()
      await settle()
      const seen = opacities(tooltip())
      // Off its trigger: its close delay runs, and nothing fades it in again meanwhile.
      await userEvent.hover(button('Next'))
      await new Promise((resolve) => setTimeout(resolve, 500))
      expect(Math.min(...seen())).toBe(1)
      // Closed, and React Aria's warmup over with it, for the tests after this one.
      await expect.poll(() => screen.queryByRole('tooltip'), { timeout: 4000 }).toBeNull()
    })
  })
})

describe('Tooltip accessibility in a browser', () => {
  // WCAG 1.4.3: a plain tooltip's 12px text and a rich one's 14px text need 4.5:1, as do the
  // labels of its buttons.
  it.each(schemes)(
    'keeps every text of a plain and a rich tooltip at 4.5:1 or more, %s scheme, %s contrast',
    async (theme, contrast) => {
      themeDocument(theme, contrast)
      const plain = await openOn()
      expect(
        contrastRatio(getComputedStyle(plain).color, getComputedStyle(plain).backgroundColor),
        'plain',
      ).toBeGreaterThanOrEqual(4.5)
      cleanup()
      const rich = await richOn({ buttons: 1 })
      const fill = getComputedStyle(rich).backgroundColor
      for (const el of [screen.getByRole('heading'), screen.getByText(supporting)])
        expect(contrastRatio(getComputedStyle(el).color, fill)).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(getComputedStyle(button('Action 1')).color, fill),
        'its button',
      ).toBeGreaterThanOrEqual(4.5)
    },
  )

  describe('in forced colors', () => {
    useForcedColors()

    it('outlines a plain and a rich tooltip, which lose their fill', async () => {
      const plain = await openOn()
      expect(getComputedStyle(plain).borderTopStyle).toBe('solid')
      expect(parseFloat(getComputedStyle(plain).borderTopWidth)).toBeGreaterThanOrEqual(1)
      expect(getComputedStyle(plain).borderTopColor).toBe(
        computedColor('CanvasText', document.body),
      )
      cleanup()
      const rich = await richOn()
      expect(getComputedStyle(rich).borderTopStyle).toBe('solid')
    })
  })
})

describe('Tooltip triggers in a browser', () => {
  it('opens on a real hover of an icon button, and stays 1.5s after the pointer leaves', async () => {
    render(
      <Page>
        <TooltipTrigger delay={0}>
          <IconButton aria-label="Favorite">
            <Icon name="star" />
          </IconButton>
          <Tooltip>Add to favorites</Tooltip>
        </TooltipTrigger>
      </Page>,
    )
    await userEvent.hover(document.body)
    await userEvent.hover(button('Favorite'))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await userEvent.unhover(button('Favorite'))
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await expect.poll(() => screen.queryByRole('tooltip'), { timeout: 2000 }).toBeNull()
  })

  it('a PreviewTrigger’s takes Tab into its rich tooltip, link and button, then on past the trigger', async () => {
    render(
      <Page>
        <PreviewTrigger delay={0}>
          <IconButton aria-label="Permissions">
            <Icon name="lock" />
          </IconButton>
          <TooltipPopover>
            <Heading>Permissions</Heading>
            <Text>
              Visit <Link href="#settings">permission settings</Link> for details.
            </Text>
            <Button variant="text">Request access</Button>
          </TooltipPopover>
        </PreviewTrigger>
        <Button>Next</Button>
      </Page>,
    )
    await userEvent.keyboard('{Tab}')
    expect(button('Permissions')).toHaveFocus()
    await expect.poll(() => screen.queryByRole('dialog')).not.toBeNull()
    await userEvent.keyboard('{Tab}')
    expect(screen.getByRole('link', { name: 'permission settings' })).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    expect(button('Request access')).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    expect(button('Next')).toHaveFocus()
  })

  it('a PreviewTrigger’s closes at once on Escape from its trigger, and from inside it after its close delay, as React Aria’s does', async () => {
    render(
      <Page>
        <PreviewTrigger delay={0}>
          <IconButton aria-label="Permissions">
            <Icon name="lock" />
          </IconButton>
          <TooltipPopover>
            <Text>Configure permissions.</Text>
            <Button variant="text">Request access</Button>
          </TooltipPopover>
        </PreviewTrigger>
      </Page>,
    )
    await userEvent.keyboard('{Tab}')
    await expect.poll(() => screen.queryByRole('dialog')).not.toBeNull()
    const pressed = performance.now()
    await userEvent.keyboard('{Escape}')
    // Gone once its 150ms fade is over.
    await expect.poll(() => screen.queryByRole('dialog'), { timeout: 3000 }).toBeNull()
    expect(performance.now() - pressed).toBeLessThan(400)
    expect(button('Permissions')).toHaveFocus()
    await userEvent.hover(document.body)
    await userEvent.hover(button('Permissions'))
    await expect.poll(() => screen.queryByRole('dialog')).not.toBeNull()
    // React Aria closes it from inside without the haste it closes it with from the trigger.
    button('Request access').focus()
    await userEvent.keyboard('{Escape}')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(screen.queryByRole('dialog')).not.toBeNull()
    await expect.poll(() => screen.queryByRole('dialog'), { timeout: 2000 }).toBeNull()
  })

  it('a persistent one closes as another element is pressed, which takes the press; Tab stays in its Dialog, as in any React Aria dialog', async () => {
    let pressed = 0
    render(
      <Page>
        <DialogTrigger>
          <Button>Image quality</Button>
          <TooltipPopover isNonModal>
            <Dialog>
              <Heading slot="title">New settings available</Heading>
              <Button variant="text">Got it</Button>
              <Button variant="text">Learn more</Button>
            </Dialog>
          </TooltipPopover>
        </DialogTrigger>
        <Button onPress={() => pressed++}>Storage</Button>
      </Page>,
    )
    await userEvent.click(button('Image quality'))
    expect(screen.getByRole('dialog')).toHaveFocus()
    await userEvent.keyboard('{Tab}{Tab}{Tab}')
    expect(button('Got it')).toHaveFocus()
    await userEvent.click(button('Storage'))
    await expect.poll(() => screen.queryByRole('dialog')).toBeNull()
    expect(pressed).toBe(1)
  })
})
