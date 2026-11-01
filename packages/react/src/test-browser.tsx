import { act, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, onTestFinished } from 'vitest'
import { commands } from 'vitest/browser'

/*
 * Helpers for the *.browser.test.tsx files, which check accessibility in a real
 * browser with the real stylesheet: contrast, hit areas, forced colors and motion.
 */

/** Themes the tokens ship: a scheme, and a contrast level on top of it. */
export const schemes = [
  ['light', 'standard'],
  ['light', 'medium'],
  ['light', 'high'],
  ['dark', 'standard'],
  ['dark', 'medium'],
  ['dark', 'high'],
] as const

/** Pads what it holds so nothing else is near, and paints the surface it sits on. */
export function Scheme({
  theme = 'light',
  contrast,
  density,
  children,
}: {
  theme?: 'light' | 'dark'
  contrast?: 'standard' | 'medium' | 'high'
  density?: '0' | '-1' | '-2' | '-3'
  children: ReactNode
}) {
  const densityClass =
    density && density !== '0' ? `density-${Math.abs(Number(density))}` : undefined
  return (
    <div
      data-theme={theme}
      data-contrast={contrast === 'standard' ? undefined : contrast}
      className={densityClass}
      // Inline, because the stylesheet only scans src/components for utility classes.
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 96,
        padding: 64,
        background: 'var(--md-sys-color-surface)',
      }}
    >
      {children}
    </div>
  )
}

/** The rendered button with this accessible name. */
export const button = (name: string) => screen.getByRole('button', { name })

/** The scheme element an element is in, which carries the theme tokens. */
export const schemeOf = (el: Element) => el.closest<HTMLElement>('[data-theme]')!

/** A CSS color, such as `var(--md-sys-color-secondary)` or `Highlight`, as the browser computes it. */
export function computedColor(color: string, within: Element) {
  const probe = document.createElement('span')
  // Keep forced colors from replacing the very color being resolved.
  probe.style.cssText = `color: ${color}; forced-color-adjust: none`
  within.append(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return resolved
}

/** [r, g, b, a] of a computed CSS color, read back from a canvas pixel. */
export function rgba(color: string) {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  return [...ctx.getImageData(0, 0, 1, 1).data] as [number, number, number, number]
}

/** WCAG contrast ratio of two computed CSS colors, from 1 to 21. */
export function contrastRatio(a: string, b: string) {
  const luminance = ([r, g, b]: number[]) => {
    const linear = (v: number) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * linear(r!) + 0.7152 * linear(g!) + 0.0722 * linear(b!)
  }
  const [lighter, darker] = [luminance(rgba(a)), luminance(rgba(b))].sort((x, y) => y - x)
  return (lighter! + 0.05) / (darker! + 0.05)
}

/**
 * Contrast of an element's text color against what is behind it: its own
 * background, or the surface it sits on when that is fully transparent.
 */
export function contrastOf(el: Element) {
  const { color, backgroundColor } = getComputedStyle(el)
  const surface = getComputedStyle(schemeOf(el)).backgroundColor
  // A transparent surface would be measured as black and could pass by accident.
  expect(rgba(surface)[3], 'the surface behind the button is opaque').toBe(255)
  return contrastRatio(color, rgba(backgroundColor)[3] === 0 ? surface : backgroundColor)
}

/**
 * Checks that a click up to 48dp across still lands on the element: just inside
 * a hit area of at least 48dp on each side does, and just outside it does not.
 * The hit area is the visual box, or 48dp when that is smaller. It is measured
 * by hit-testing, so a declared style that does nothing does not pass.
 * The element must be on screen: a point outside the viewport hits nothing.
 */
export function expectHitArea(el: Element) {
  const hits = (x: number, y: number) => {
    const hit = document.elementFromPoint(x, y)
    return hit === el || el.contains(hit)
  }
  const rect = el.getBoundingClientRect()
  const gapX = (Math.max(rect.width, 48) - rect.width) / 2
  const gapY = (Math.max(rect.height, 48) - rect.height) / 2
  const [midX, midY] = [rect.left + rect.width / 2, rect.top + rect.height / 2]
  const onScreen =
    rect.left - gapX - 2 >= 0 &&
    rect.top - gapY - 2 >= 0 &&
    rect.right + gapX + 2 <= innerWidth &&
    rect.bottom + gapY + 2 <= innerHeight
  expect(onScreen, 'the hit area and the 2px around it are in the viewport').toBe(true)

  expect(hits(rect.left - gapX + 1, midY), 'inside, left').toBe(true)
  expect(hits(rect.right + gapX - 1, midY), 'inside, right').toBe(true)
  expect(hits(midX, rect.top - gapY + 1), 'inside, top').toBe(true)
  expect(hits(midX, rect.bottom + gapY - 1), 'inside, bottom').toBe(true)
  expect(hits(rect.left - gapX - 2, midY), 'outside, left').toBe(false)
  expect(hits(rect.right + gapX + 2, midY), 'outside, right').toBe(false)
  expect(hits(midX, rect.top - gapY - 2), 'outside, top').toBe(false)
  expect(hits(midX, rect.bottom + gapY + 2), 'outside, bottom').toBe(false)
}

/**
 * Checks that a pending button shows its loading indicator alone: `size` dp across, at its center
 * and in its label's color, after its children, which keep the room they take in `enabled` (the
 * same button, not pending) unseen, its text unpainted and the rest faded out. Read from the
 * computed style and the layout, so a class that does nothing does not pass.
 */
export function expectOnlyPendingIndicator(pending: Element, enabled: Element, size: number) {
  const box = pending.getBoundingClientRect()
  const room = enabled.getBoundingClientRect()
  expect([box.width, box.height], 'the room its children take').toEqual([room.width, room.height])
  expect(getComputedStyle(pending).webkitTextFillColor, 'its text').toBe('rgba(0, 0, 0, 0)')
  const children = [...pending.children]
  expect(children.length, 'one child more, the indicator').toBe(enabled.children.length + 1)
  for (const child of children.slice(0, -1)) {
    expect(getComputedStyle(child).opacity, 'a child faded out').toBe('0')
  }
  const indicator = children.at(-1)!
  expect(getComputedStyle(indicator).opacity, 'the indicator').toBe('1')
  const shape = indicator.firstElementChild!
  const drawn = shape.getBoundingClientRect()
  expect(drawn.width, 'its width').toBeCloseTo(size, 1)
  expect(drawn.height, 'its height').toBeCloseTo(size, 1)
  expect(drawn.left + drawn.width / 2, 'its center, across').toBeCloseTo(
    box.left + box.width / 2,
    1,
  )
  expect(drawn.top + drawn.height / 2, 'its center, down').toBeCloseTo(box.top + box.height / 2, 1)
  expect(getComputedStyle(shape.firstElementChild!).backgroundColor, 'its color').toBe(
    getComputedStyle(pending).color,
  )
}

/**
 * Checks that nothing the browser gives a `<button>` on its own is left: no
 * native look, no tap highlight overlay on touch, no double-tap zoom, no
 * border, padding or margin, and no text selection. Read from the computed
 * style, so a class that does nothing does not pass. `paddingTop` is that of a
 * button whose height is its content's and its own padding above and below it.
 */
export function expectNoNativeStyling(el: Element, paddingTop = 0) {
  const style = getComputedStyle(el)
  expect(style.appearance, 'appearance').toBe('none')
  expect(style.getPropertyValue('-webkit-tap-highlight-color'), 'tap highlight').toBe(
    'rgba(0, 0, 0, 0)',
  )
  expect(style.touchAction, 'touch action').toBe('manipulation')
  expect(style.borderTopWidth, 'border').toBe('0px')
  expect(style.paddingTop, 'padding').toBe(`${paddingTop}px`)
  expect(style.marginTop, 'margin').toBe('0px')
  expect(style.userSelect, 'user select').toBe('none')
}

/** Turns forced colors on for the tests in the enclosing `describe`, and off after each. */
export function useForcedColors() {
  beforeEach(async () => {
    await commands.emulateForcedColors('active')
  })
  afterEach(async () => {
    await commands.emulateForcedColors('none')
  })
}

/** Turns prefers-reduced-motion on for the tests in the enclosing `describe`, and off after each. */
export function useReducedMotion() {
  beforeEach(async () => {
    await commands.emulateReducedMotion('reduce')
  })
  afterEach(async () => {
    await commands.emulateReducedMotion('no-preference')
  })
}

/** Reads one property from the computed style of a probe carrying a real utility class. */
export function computedStyleOf<T>(className: string, read: (style: CSSStyleDeclaration) => T): T {
  const probe = document.createElement('div')
  probe.className = className
  document.body.append(probe)
  const result = read(getComputedStyle(probe))
  probe.remove()
  return result
}

/** The `border-radius` a real rounded-* class computes to, e.g. `computedRadius('rounded-shape-md')`. */
export const computedRadius = (className: string) =>
  computedStyleOf(className, (style) => style.borderRadius)

/**
 * The width Tailwind's `inset-ring-*` sets, in px, or 0 with none. Reads the
 * `--tw-inset-ring-shadow` custom property rather than `box-shadow`, which also
 * carries any elevation shadow layered on the same element.
 */
export function ringWidth(el: Element) {
  const ring = getComputedStyle(el).getPropertyValue('--tw-inset-ring-shadow')
  return Number(/(\d+)px/.exec(ring)?.[1] ?? 0)
}

/** Every style rule of the page's stylesheets, with the conditions of the `@supports` blocks around it. */
function styleRules() {
  const found: { rule: CSSStyleRule; supports: string[] }[] = []
  const read = (rules: CSSRuleList, supports: string[]) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) found.push({ rule, supports })
      if (rule instanceof CSSMediaRule && !matchMedia(rule.conditionText).matches) continue
      const within = rule instanceof CSSSupportsRule ? [...supports, rule.conditionText] : supports
      if ('cssRules' in rule) read(rule.cssRules as CSSRuleList, within)
    }
  }
  for (const sheet of document.styleSheets) read(sheet.cssRules, [])
  return found
}

/**
 * What the stylesheet declares for `property` on an element, its `var()` still in
 * it, where a computed style has them resolved: the last rule's that matches.
 */
export function declaredValue(el: Element, property: string) {
  return styleRules()
    .filter(({ supports }) => supports.every((condition) => CSS.supports(condition)))
    .filter(({ rule }) => el.matches(rule.selectorText))
    .map(({ rule }) => rule.style.getPropertyValue(property))
    .filter(Boolean)
    .at(-1)
}

/**
 * What Tailwind sets a registered property to on every element where `@property`
 * is not supported: it is in a `@supports` block that only such a browser reads.
 */
export function unregisteredValue(property: string) {
  return styleRules()
    .filter(({ supports }) => supports.some((condition) => !CSS.supports(condition)))
    .filter(({ rule }) => rule.selectorText.split(', ').includes('*'))
    .map(({ rule }) => rule.style.getPropertyValue(property))
    .filter(Boolean)
}

const frame = () => new Promise(requestAnimationFrame)

/**
 * Lets what is animating finish, so what is read next is where it rests. It
 * waits on the animations themselves, not for a length of time, so a page that
 * has fallen behind the clock is waited for too.
 */
export async function settle() {
  // Two frames, so that a style that has just changed has started its transition.
  await frame()
  await frame()
  for (;;) {
    // One that repeats without end, as a loading indicator's do, never finishes.
    const running = document
      .getAnimations()
      .filter(
        ({ playState, effect }) =>
          playState === 'running' && effect?.getComputedTiming().endTime !== Infinity,
      )
    if (running.length === 0) return
    // One that is cancelled rejects, and is over all the same.
    await Promise.allSettled(running.map(({ finished }) => finished))
    // What started meanwhile, such as a ripple's fade, is waited for in turn.
    await frame()
  }
}

/**
 * Holds a real pointer down on the named button (or checkbox, radio, switch, option, link, menu item, tab)
 * while `read` runs, then releases it. `exact` is for a name that is also a part of another's.
 */
export async function whilePressed<T>(
  name: string,
  read: () => T | Promise<T>,
  role:
    'button' | 'checkbox' | 'radio' | 'switch' | 'option' | 'link' | 'menuitem' | 'tab' = 'button',
  exact = false,
) {
  await commands.holdPress(name, role, exact)
  try {
    return await read()
  } finally {
    await commands.releasePress()
  }
}

/**
 * Presses a control from inside the page, focusing it as a press does, for a test that reads what
 * the press starts. `userEvent` goes by way of the test runner, whose answer can come so late on a
 * busy machine that a short transition is far along or over; here it has just begun.
 */
export function press(control: HTMLElement) {
  act(() => {
    control.focus()
    control.click()
  })
}

/**
 * Presses a key from inside the page, down and up, on what has the focus, as `press` does a
 * control: for a test that reads what the key starts.
 */
export function pressKey(key: string, init: KeyboardEventInit = {}) {
  act(() => {
    const target = document.activeElement ?? document.body
    for (const type of ['keydown', 'keyup'])
      target.dispatchEvent(
        new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...init }),
      )
  })
}

/** Presses Escape from inside the page. */
export const pressEscape = () => pressKey('Escape')

/**
 * A press at a point of the window from inside the page, the pointer down and up and then the
 * click a browser sends, on which React Aria hears a press outside an overlay: for a test that
 * reads what closing it starts.
 */
export function pressAt(x: number, y: number) {
  act(() => {
    const target = document.elementFromPoint(x, y) ?? document.body
    for (const type of ['pointerdown', 'pointerup'] as const)
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
          buttons: type === 'pointerdown' ? 1 : 0,
          clientX: x,
          clientY: y,
        }),
      )
    target.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        detail: 1,
        clientX: x,
        clientY: y,
      }),
    )
  })
}

/**
 * Pauses the transitions of `scope`, or of what in it `matches`, as each starts, from inside the
 * page: a test that must hover with a real pointer, whose answer can come after a short
 * transition is over, finds them held at their start instead. `release` lets them play; a test
 * that ends before it, failing, has it run as it ends, so that nothing holds the next test's.
 */
export function catchTransitions(
  scope: Element | Document,
  matches: (el: Element) => boolean = (el) => el === scope,
) {
  const caught: Animation[] = []
  const onRun = (event: Event) => {
    const target = event.target as Element
    if (!matches(target)) return
    for (const animation of target.getAnimations())
      if (animation.playState === 'running' && !caught.includes(animation)) {
        animation.pause()
        caught.push(animation)
      }
  }
  scope.addEventListener('transitionrun', onRun, true)
  const release = () => {
    scope.removeEventListener('transitionrun', onRun, true)
    // One whose value changed again while held is cancelled: played, it would run its old keyframes.
    for (const animation of caught) if (animation.playState === 'paused') animation.play()
  }
  onTestFinished(release)
  return { caught, release }
}

/**
 * A real press at a point of the window while a view transition starts, its update held until
 * the press is over, as one made while a calendar pages is. The browser gives a press then to
 * the document itself, wherever the pointer is: what it went to is returned.
 */
export async function pressAsViewTransitionStarts(x: number, y: number) {
  let release = () => {}
  let updating = () => {}
  const updated = new Promise<void>((resolve) => (updating = resolve))
  const transition = document.startViewTransition(() => {
    updating()
    return new Promise<void>((resolve) => (release = resolve))
  })
  const targets: EventTarget[] = []
  const note = (event: Event) => targets.push(event.target!)
  document.addEventListener('pointerdown', note, true)
  try {
    await updated
    await commands.pointer('html', x, y, 'down')
    await commands.pointer('html', x, y, 'up')
  } finally {
    document.removeEventListener('pointerdown', note, true)
    release()
  }
  await transition.finished
  return targets
}

/** The computed value of a spring token from theme-default.css, read the way the browser resolves it. */
function springValue(style: 'transitionDuration' | 'transitionTimingFunction', variable: string) {
  const probe = document.createElement('div')
  probe.style[style] = `var(${variable})`
  document.body.append(probe)
  const value = getComputedStyle(probe)[style]
  probe.remove()
  return value
}

// The --md tokens, not the theme variables over them: Tailwind only emits
// the theme variables of the springs that some stylesheet reads by name.
/** The computed `transition-duration` of a spring, e.g. `springDuration('fast-spatial')`. */
export const springDuration = (spring: string) =>
  springValue('transitionDuration', `--md-sys-motion-spring-${spring}-duration`)

/** The computed `transition-timing-function` of a spring, e.g. `springEasing('fast-effects')`. */
export const springEasing = (spring: string) =>
  springValue('transitionTimingFunction', `--md-sys-motion-spring-${spring}-easing`)
