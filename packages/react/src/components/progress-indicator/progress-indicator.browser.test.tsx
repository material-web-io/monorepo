import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  computedColor,
  contrastRatio,
  rgba,
  Scheme,
  schemeOf,
  schemes,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import {
  accelerateDecelerate,
  circularCycle,
  circularLeave,
  handover,
  linearCycle,
  linearCyclePhaseAt,
  linearIndeterminate,
  linearInkGone,
  emphasizedAccelerate,
  standard,
  sweepAt,
  wavePeriod,
} from './motion'
import { CircularProgressIndicator } from './circular-progress-indicator'
import { LinearProgressIndicator } from './linear-progress-indicator'

/* What needs a real browser and stylesheet: the sizes, the colors and their contrast, the
 * outlines the parts are clipped to, read from the computed style a frame at a time, the
 * motion of the progress, the wave and the cycles, reduced motion and forced colors.
 * Markup: progress-indicator.test.tsx. */

const bar = (name = 'Loading') => screen.getByRole('progressbar', { name })

/** The parts of an indicator: its track, active indicator, stop indicator and, when circular, the turned drawing. */
function partsOf(root: HTMLElement) {
  // A circular indicator's parts are inside the element that turns, a linear one's in the root.
  const turn = root.children.length === 1 ? (root.firstElementChild as HTMLElement) : null
  const [track, active, stop] = Array.from((turn ?? root).children) as HTMLElement[]
  return { track: track!, active: active!, stop, turn }
}

// A paused animation forgets when it started, so that is kept from before its first pause.
const starts = new WeakMap<Animation, number>()

/** Stops every animation of an indicator at a moment of the page's clock, in ms. */
function seek(root: HTMLElement, at: number) {
  for (const animation of root.getAnimations({ subtree: true })) {
    if (!starts.has(animation)) starts.set(animation, animation.startTime as number)
    animation.pause()
    animation.currentTime = at - starts.get(animation)!
  }
}

// Material's value-change spring, critically damped at stiffness 50, as a rate per ms.
const sqrt50 = Math.sqrt(50) / 1000

/** The ms into a change of value, begun at rest, at which the progress crosses a level. */
function crossingOf(from: number, to: number, level: number) {
  for (let ms = 0; ; ms++) {
    const progress = to + (from - to) * (1 + sqrt50 * ms) * Math.exp(-sqrt50 * ms)
    if (from < to ? progress >= level : progress <= level) return ms
  }
}

/** When an indicator's latest plan began: the start of its animations that are not the steady loop. */
const began = (root: HTMLElement) =>
  Math.max(...root.getAnimations({ subtree: true }).map((a) => a.startTime as number))

// Chromium prints a tiny coordinate in exponent form, such as 1e-05.
const numbers = (d: string) => (d.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []).map(Number)

/** The path an element is clipped to, as the browser computes it: absolute M, C, Z. */
const clipOf = (el: Element) => /path\("(.+)"\)/.exec(getComputedStyle(el).clipPath)?.[1] ?? ''

/** Points along every curve of a path, a number to a curve, and the subpath each is in. */
function pointsOf(d: string, per = 8) {
  const points: { x: number; y: number; sub: number }[] = []
  let at: [number, number] = [0, 0]
  let sub = -1
  for (const [, command, rest] of d.matchAll(/([MCZ])([^MCZ]*)/g)) {
    const v = numbers(rest!)
    if (command === 'M') {
      at = [v[0]!, v[1]!]
      sub++
    }
    if (command !== 'C') continue
    for (let i = 0; i <= per; i++) {
      const [t, u] = [i / per, 1 - i / per]
      const along = (a: number, b: number, c: number, e: number) =>
        u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * e
      points.push({
        x: along(at[0], v[0]!, v[2]!, v[4]!),
        y: along(at[1], v[1]!, v[3]!, v[5]!),
        sub,
      })
    }
    at = [v[4]!, v[5]!]
  }
  return points
}

/** The box a clipped part's ink fills, in the part's own px. */
function inkOf(el: Element, sub?: number) {
  const points = pointsOf(clipOf(el)).filter((p) => sub === undefined || p.sub === sub)
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  }
}

/** The area inside an outline's subpaths, or one of them, in square px: none for a part that is not drawn. */
function areaOf(el: Element, sub?: number) {
  const points = pointsOf(clipOf(el))
  let area = 0
  for (let s = 0; s <= Math.max(...points.map((p) => p.sub)); s++) {
    if (sub !== undefined && s !== sub) continue
    const ring = points.filter((p) => p.sub === s)
    for (let i = 0; i < ring.length; i++) {
      const [a, b] = [ring[i]!, ring[(i + 1) % ring.length]!]
      area += a.x * b.y - b.x * a.y
    }
  }
  return Math.abs(area) / 2
}

/** The stop indicator's circle: its radius and center. */
function stopOf(el: Element) {
  const [r, x, y] = numbers(getComputedStyle(el).clipPath)
  return { r: r!, x: x!, y: y! }
}

/** The x of each trough of a wavy outline's lower edge: where its ink reaches lowest, a wavelength apart. */
function troughsOf(el: Element, sub = 0) {
  const points = pointsOf(clipOf(el), 32).filter((p) => p.sub === sub)
  const lowest = Math.max(...points.map((p) => p.y))
  // The lowest sample of each dip: the bottom of a parabola is flat, so the first near it will not do.
  const found: { x: number; y: number }[] = []
  for (const p of points) {
    if (p.y < lowest - 0.5) continue
    const near = found.find((f) => Math.abs(f.x - p.x) < 10)
    if (!near) found.push({ x: p.x, y: p.y })
    else if (p.y > near.y) Object.assign(near, p)
  }
  return found.map((f) => f.x).sort((a, b) => a - b)
}

const Box = ({ width = 240, children }: { width?: number; children: React.ReactNode }) => (
  <Scheme>
    <div style={{ width }}>{children}</div>
  </Scheme>
)

describe('the progress indicators in a browser', () => {
  describe('size', () => {
    it('spans its parent and is as tall as its track, or its wave', () => {
      render(
        <Box width={300}>
          <LinearProgressIndicator aria-label="Flat" value={40} />
          <LinearProgressIndicator aria-label="Wavy" shape="wavy" value={40} />
          <LinearProgressIndicator aria-label="Thick" thickness={8} value={40} />
          <LinearProgressIndicator aria-label="Thick wavy" thickness={8} shape="wavy" value={40} />
        </Box>,
      )
      const rect = (name: string) => bar(name).getBoundingClientRect()
      expect([rect('Flat').width, rect('Flat').height]).toEqual([300, 4])
      expect(rect('Wavy').height).toBe(10)
      expect(rect('Thick').height).toBe(8)
      expect(rect('Thick wavy').height).toBe(14)
    })

    it('is 48dp across with either shape, 4dp more at 8dp thick, and the size asked for', () => {
      render(
        <Scheme>
          <CircularProgressIndicator aria-label="Flat" value={40} />
          <CircularProgressIndicator aria-label="Wavy" shape="wavy" value={40} />
          <CircularProgressIndicator aria-label="Thick" thickness={8} value={40} />
          <CircularProgressIndicator
            aria-label="Thick wavy"
            shape="wavy"
            thickness={8}
            value={40}
          />
          <CircularProgressIndicator aria-label="Large" shape="wavy" size={96} value={40} />
          <CircularProgressIndicator aria-label="Too small" size={10} value={40} />
          <CircularProgressIndicator aria-label="Too large" size={400} value={40} />
        </Scheme>,
      )
      const across = (name: string) => bar(name).getBoundingClientRect().width
      expect([across('Flat'), across('Wavy'), across('Thick'), across('Thick wavy')]).toEqual([
        48, 48, 52, 52,
      ])
      expect(across('Large')).toBe(96)
      expect([across('Too small'), across('Too large')]).toEqual([24, 240])
      // The drawing is made at the size, not scaled to it, with everything in proportion:
      // at 96dp the ring is twice the 48dp one, the stroke 8dp, with the same nine points, and
      // the turning element reaches 3.2dp past the box on each side for the wave's crests.
      const large = partsOf(bar('Large'))
      expect(getComputedStyle(large.turn!).scale).toBe('none')
      expect(large.turn!.getBoundingClientRect().width).toBeCloseTo(96 + 2 * 3.2, 1)
      seek(bar('Large'), began(bar('Large')) + 1)
      const ink = inkOf(large.track)
      expect(ink.left).toBeCloseTo(3.2, 0)
      expect(ink.bottom).toBeCloseTo(96 + 3.2, 0)
      const radii = (el: Element) =>
        pointsOf(clipOf(el)).map((p) => Math.hypot(p.x - 51.2, p.y - 51.2))
      expect(Math.max(...radii(large.track))).toBeCloseTo(48, 0)
      expect(Math.min(...radii(large.track))).toBeCloseTo(48 - 8, 0)
      // The star rides the 44dp ring: its crests reach 46.7dp and its troughs 41.3dp, so its
      // ink spans 37.3 to 50.7dp, within the turning element's 51.2.
      expect(Math.max(...radii(large.active))).toBeGreaterThan(50)
      expect(Math.max(...radii(large.active))).toBeLessThan(51.2)
      expect(Math.min(...radii(large.active))).toBeGreaterThan(36.5)
      expect(Math.min(...radii(large.active))).toBeLessThan(38)
    })
  })

  describe('color', () => {
    it('has an active indicator and stop indicator in primary on a secondary-container track', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={40} />
        </Box>,
      )
      const { track, active, stop } = partsOf(bar())
      expect(getComputedStyle(active).backgroundColor).toBe(
        computedColor('var(--md-sys-color-primary)', active),
      )
      expect(getComputedStyle(stop!).backgroundColor).toBe(
        computedColor('var(--md-sys-color-primary)', active),
      )
      expect(getComputedStyle(track).backgroundColor).toBe(
        computedColor('var(--md-sys-color-secondary-container)', track),
      )
      expect(rgba(getComputedStyle(bar()).backgroundColor)[3]).toBe(0)
    })

    it.each(schemes)(
      'has 3:1 contrast with the surface, active and stop indicator, in the %s scheme at %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <div style={{ width: 240 }}>
              <LinearProgressIndicator aria-label="Loading" value={40} />
            </div>
          </Scheme>,
        )
        const { active, stop } = partsOf(bar())
        const surface = getComputedStyle(schemeOf(active)).backgroundColor
        expect(
          contrastRatio(getComputedStyle(active).backgroundColor, surface),
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrastRatio(getComputedStyle(stop!).backgroundColor, surface),
        ).toBeGreaterThanOrEqual(3)
      },
    )

    it('takes the text color of what it is in when given text-current', () => {
      render(
        <Scheme>
          <div style={{ color: 'rgb(1, 2, 3)', width: 240 }}>
            <LinearProgressIndicator aria-label="Loading" value={40} className="text-current" />
          </div>
        </Scheme>,
      )
      const { active, stop } = partsOf(bar())
      expect(getComputedStyle(active).backgroundColor).toBe('rgb(1, 2, 3)')
      expect(getComputedStyle(stop!).backgroundColor).toBe('rgb(1, 2, 3)')
    })
  })

  describe('a determinate linear indicator', () => {
    it('fills to its value, with a 4dp gap before the track and the stop indicator at the end', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={50} />
        </Box>,
      )
      const root = bar()
      const { track, active, stop } = partsOf(root)
      seek(root, began(root) + 1)
      expect(inkOf(active)).toEqual({ left: 0, right: 122, top: 0, bottom: 4 })
      expect(inkOf(track)).toEqual({ left: 126, right: 240, top: 0, bottom: 4 })
      expect(stopOf(stop!)).toEqual({ r: 2, x: 238, y: 2 })
    })

    it('is drawn at its laid-out width when mounted in a scaled element, as a dialog scaling in', () => {
      render(
        <Box>
          <div style={{ scale: 0.5 }}>
            <LinearProgressIndicator aria-label="Loading" value={50} />
          </div>
        </Box>,
      )
      const root = bar()
      const { track, active, stop } = partsOf(root)
      seek(root, began(root) + 1)
      expect(root.getBoundingClientRect().width).toBe(120)
      expect(inkOf(active)).toEqual({ left: 0, right: 122, top: 0, bottom: 4 })
      expect(inkOf(track)).toEqual({ left: 126, right: 240, top: 0, bottom: 4 })
      expect(stopOf(stop!)).toEqual({ r: 2, x: 238, y: 2 })
    })

    it('fills to the share of its range its value is, as React Aria reports it', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Episodes" value={3} minValue={1} maxValue={5} />
        </Box>,
      )
      const root = bar('Episodes')
      seek(root, began(root) + 1)
      expect(inkOf(partsOf(root).active)).toEqual({ left: 0, right: 122, top: 0, bottom: 4 })
    })

    it('is a dot as the progress begins, nothing at none, and whole at the end', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Begun" value={0.1} />
          <LinearProgressIndicator aria-label="None" value={0} />
          <LinearProgressIndicator aria-label="Whole" value={100} />
        </Box>,
      )
      for (const name of ['Begun', 'None', 'Whole']) seek(bar(name), began(bar(name)) + 1)
      expect(inkOf(partsOf(bar('Begun')).active)).toEqual({ left: 0, right: 4, top: 0, bottom: 4 })
      expect(areaOf(partsOf(bar('None')).active)).toBe(0)
      expect(inkOf(partsOf(bar('None')).track)).toEqual({ left: 0, right: 240, top: 0, bottom: 4 })
      expect(inkOf(partsOf(bar('Whole')).active)).toEqual({
        left: 0,
        right: 240,
        top: 0,
        bottom: 4,
      })
      expect(areaOf(partsOf(bar('Whole')).track)).toBe(0)
      // Whole, the stop indicator is still there, under the head.
      expect(stopOf(partsOf(bar('Whole')).stop!)).toEqual({ r: 2, x: 238, y: 2 })
    })

    it('keeps the stop indicator as it is under the head, as Android draws the flat one', () => {
      const { rerender } = render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" thickness={8} value={90} />
        </Box>,
      )
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" thickness={8} value={100} />
        </Box>,
      )
      const root = bar()
      const { active, track, stop } = partsOf(root)
      const start = began(root)
      // The dot is 4dp, 2dp in, whatever the head does; the track starts a gap and a thickness
      // past the head, 12dp, and goes once that is past the end.
      seek(root, start + crossingOf(0.9, 1, 222 / 240))
      expect(stopOf(stop!)).toEqual({ r: 2, x: 236, y: 4 })
      expect(inkOf(track).left).toBeCloseTo(230, 1)
      expect(inkOf(track).right).toBe(240)
      seek(root, start + crossingOf(0.9, 1, 229 / 240))
      expect(inkOf(active).right).toBeCloseTo(233, 0)
      expect(stopOf(stop!)).toEqual({ r: 2, x: 236, y: 4 })
      expect(areaOf(track)).toBe(0)
      seek(root, start + 5000)
      expect(inkOf(active).right).toBe(240)
      expect(stopOf(stop!)).toEqual({ r: 2, x: 236, y: 4 })
    })

    it('shrinks the stop indicator away as the head reaches it, as Android draws the wavy one', () => {
      const { rerender } = render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" value={90} />
        </Box>,
      )
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" value={100} />
        </Box>,
      )
      const root = bar()
      const { active, stop } = partsOf(root)
      const start = began(root)
      // The dot is whole until the head's ink reaches it at 236, then shrinks from its start.
      seek(root, start + crossingOf(0.9, 1, 232 / 240))
      expect(stopOf(stop!)).toEqual({ r: 2, x: 238, y: 5 })
      seek(root, start + crossingOf(0.9, 1, 236 / 240))
      expect(inkOf(active).right).toBeCloseTo(238, 0)
      expect(stopOf(stop!).r).toBeCloseTo(1, 1)
      expect(stopOf(stop!).x).toBeCloseTo(239, 1)
      seek(root, start + 5000)
      expect(inkOf(active).right).toBe(240)
      expect(stopOf(stop!).r).toBe(0)
    })

    it('keeps a 4dp stop indicator 2dp in from the end of an 8dp track', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" thickness={8} value={50} />
        </Box>,
      )
      const root = bar()
      seek(root, began(root) + 1)
      expect(stopOf(partsOf(root).stop!)).toEqual({ r: 2, x: 236, y: 4 })
    })

    it('has no track when told, and no stop indicator', () => {
      render(
        <Box>
          <LinearProgressIndicator
            aria-label="Loading"
            value={50}
            showTrack={false}
            showStopIndicator={false}
          />
        </Box>,
      )
      const root = bar()
      seek(root, began(root) + 1)
      expect(areaOf(partsOf(root).track)).toBe(0)
      expect(partsOf(root).stop).toBeUndefined()
    })

    it('settles into a new value on a critically damped spring, slowing as it nears it', () => {
      const { rerender } = render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={20} />
        </Box>,
      )
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={60} />
        </Box>,
      )
      const root = bar()
      const start = began(root)
      const headAt = () => inkOf(partsOf(root).active).right
      seek(root, start)
      expect(headAt()).toBeCloseTo(0.2 * 240 + 2, 0)
      // Material's spring at stiffness 50: the share settled by a time, from rest.
      const settled = (ms: number) => 1 - (1 + sqrt50 * ms) * Math.exp(-sqrt50 * ms)
      seek(root, start + 250)
      expect(headAt()).toBeCloseTo((0.2 + 0.4 * settled(250)) * 240 + 2, 0)
      expect(headAt()).toBeCloseTo(0.411 * 240 + 2, 0)
      seek(root, start + 500)
      expect(headAt()).toBeCloseTo((0.2 + 0.4 * settled(500)) * 240 + 2, 0)
      expect(headAt()).toBeCloseTo(0.547 * 240 + 2, 0)
      seek(root, start + 1000)
      const late = headAt()
      expect(late).toBeCloseTo((0.2 + 0.4 * settled(1000)) * 240 + 2, 0)
      // The last 2dp take as long as the first 50: no stop at the end.
      seek(root, start + 1500)
      expect(headAt() - late).toBeGreaterThan(0)
      expect(headAt() - late).toBeLessThan(1)
      seek(root, start + 5000)
      expect(headAt()).toBeCloseTo(0.6 * 240 + 2, 0)
    })
  })

  describe('the wave', () => {
    it('rises 3dp above and below the track line, a wavelength of 40dp, and travels toward the start a wavelength a second', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" value={50} />
        </Box>,
      )
      const root = bar()
      const { active, track } = partsOf(root)
      const rest = began(root) + 2000
      seek(root, rest)
      const ink = inkOf(active)
      expect(ink.left).toBeCloseTo(0, 0)
      expect(ink.right).toBeCloseTo(122, 0)
      expect(ink.top).toBeCloseTo(0, 0)
      expect(ink.bottom).toBeCloseTo(10, 0)
      expect(inkOf(track)).toEqual({ left: 126, right: 240, top: 3, bottom: 7 })
      // Away from the ends, whose rounding reaches as low as a trough at some of the wave's places,
      // and wider than two waves, about those found a quarter of a wave later.
      const before = troughsOf(active).filter((x) => x > 10 && x < 112)
      expect(before.length).toBeGreaterThanOrEqual(2)
      for (let i = 1; i < before.length; i++) expect(before[i]! - before[i - 1]!).toBeCloseTo(40, 0)
      seek(root, rest + wavePeriod / 4)
      const after = troughsOf(active).filter((x) => x > 20 && x < 100)
      expect(after.length).toBeGreaterThanOrEqual(1)
      const nearest = (x: number) =>
        before.reduce((best, b) => (Math.abs(x - b) < Math.abs(best) ? x - b : best), Infinity)
      for (const x of after) expect(nearest(x)).toBeCloseTo(-10, 0)
    })

    it('is flat up to 10% and from 95%, drawn in over a long-2 on the standard easing, as on Android', () => {
      // Wide, so that the few percent the wave is drawn in over hold whole waves to measure.
      const { rerender } = render(
        <Box width={1200}>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" value={3} />
        </Box>,
      )
      const root = bar()
      const { active } = partsOf(root)
      const height = () => {
        const ink = inkOf(active)
        return ink.bottom - ink.top
      }
      seek(root, began(root) + 1)
      expect(height()).toBeCloseTo(4, 1)
      // To 20%: the wave is drawn in from when the progress passes 10%, into the spring.
      rerender(
        <Box width={1200}>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" value={20} />
        </Box>,
      )
      const start = began(root)
      const crossing = start + crossingOf(0.03, 0.2, 0.1)
      seek(root, crossing - 20)
      expect(height()).toBeCloseTo(4, 0)
      seek(root, crossing + 500 * 0.5)
      expect(height()).toBeCloseTo(4 + 6 * standard(0.5), 0)
      seek(root, crossing + 500 + 20)
      expect(height()).toBeCloseTo(10, 0)
    })

    it('is flattened from 95%, over a long-2 on the emphasized accelerate easing', () => {
      const { rerender } = render(
        <Box width={1200}>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" value={90} />
        </Box>,
      )
      rerender(
        <Box width={1200}>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" value={100} />
        </Box>,
      )
      const root = bar()
      const { active } = partsOf(root)
      const height = () => {
        const ink = inkOf(active)
        return ink.bottom - ink.top
      }
      const flattening = began(root) + crossingOf(0.9, 1, 0.95)
      seek(root, flattening - 20)
      expect(height()).toBeCloseTo(10, 0)
      seek(root, flattening + 250)
      expect(height()).toBeCloseTo(10 - 6 * emphasizedAccelerate(0.5), 0)
      seek(root, flattening + 500 + 20)
      expect(height()).toBeCloseTo(4, 1)
    })
  })

  describe('an indeterminate linear indicator', () => {
    // A moment of the cycle, in ms: a touch past it, clear of the loop's seam.
    const moment = (ms: number) => 100 * linearCycle + ms + 0.01
    const ease = emphasizedAccelerate

    it('moves two lines along the track as Android does, over a 1.75s cycle', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" isIndeterminate />
        </Box>,
      )
      const root = bar()
      const { active, track } = partsOf(root)
      // Every indicator cycles from the page's own clock. At 500ms the first line alone is
      // drawn, its tail a quarter of the way into its crossing and its head half, with the
      // track 4dp after it; the track behind it, drawn once the tail is a gap and a
      // thickness in, is a dot at the start that has just popped in, not there at 400ms.
      seek(root, moment(500))
      const first = inkOf(active, 0)
      expect(first.left).toBeCloseTo(ease(0.25) * 240 - 2, 1)
      expect(first.right).toBeCloseTo(ease(0.5) * 240 + 2, 1)
      expect(inkOf(track, 0).left).toBeCloseTo(first.right + 4, 1)
      expect(inkOf(track, 0).right).toBe(240)
      expect(inkOf(track, 1)).toEqual({ left: 0, right: 4, top: 0, bottom: 4 })
      seek(root, moment(400))
      expect(areaOf(track, 1)).toBe(0)
      // At a second the first head has reached the end, and the second line has set off.
      seek(root, moment(1000))
      expect(inkOf(active, 0).left).toBeCloseTo(ease(0.75) * 240 - 2, 1)
      expect(inkOf(active, 0).right).toBe(240)
      const second = inkOf(active, 1)
      // Its tail is still within its cap, so its ink starts at the track's start.
      expect(second.left).toBeCloseTo(0, 1)
      expect(second.right).toBeCloseTo(ease(350 / 850) * 240 + 2, 1)
      const between = inkOf(track, 1)
      expect(between.left).toBeCloseTo(second.right + 4, 1)
      expect(between.right).toBeCloseTo(ease(0.75) * 240 - 6, 1)
      // At 1250ms the first line has left, and the track has closed behind the second.
      seek(root, moment(1250))
      expect(inkOf(active, 0).right - inkOf(active, 0).left).toBe(0)
      expect(inkOf(track, 2).left).toBe(0)
      expect(inkOf(track, 2).right).toBeCloseTo(inkOf(active, 1).left - 4, 1)
      // The cycle begins and ends with the track alone.
      seek(root, 100 * linearCycle)
      expect(areaOf(active)).toBe(0)
      expect(inkOf(track)).toEqual({ left: 0, right: 240, top: 0, bottom: 4 })
    })

    it('is a dot as a line enters, the gap opening with it, as Android draws the flat one', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" isIndeterminate />
        </Box>,
      )
      const root = bar()
      const { active, track } = partsOf(root)
      // At 60ms the first head is a px in, short of its cap: a dot at the start, the track a
      // gap and a thickness from the head, less its own cap.
      seek(root, moment(60))
      const dot = inkOf(active, 0)
      expect(dot.left).toBeCloseTo(0, 1)
      expect(dot.right).toBeCloseTo(4, 1)
      expect(dot.bottom - dot.top).toBeCloseTo(4, 1)
      expect(inkOf(track, 0).left).toBeCloseTo(ease(0.06) * 240 + 6, 1)
      seek(root, moment(100))
      expect(inkOf(track, 0).left).toBeCloseTo(ease(0.1) * 240 + 6, 1)
    })

    it('waves at 20dp, travelling toward the start a wavelength a second, from where the recording has it', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" shape="wavy" isIndeterminate />
        </Box>,
      )
      const root = bar()
      const loop = root.getAnimations({ subtree: true })[0]!.effect!.getComputedTiming()
      expect(Number(loop.duration)).toBe(linearCycle)
      seek(root, 100 * linearCycle)
      expect(areaOf(partsOf(root).active)).toBe(0)
      // The lowest points of a line's ink, a wavelength apart, are where the wave's phase
      // puts them: a quarter wavelength past its start, moved on by its travel.
      for (const [ms, line] of [
        [800, 0],
        [1400, 1],
      ] as const) {
        seek(root, moment(ms))
        const ink = inkOf(partsOf(root).active, line)
        // A cap's bottom is not a trough: only those clear of the ends count.
        const troughs = troughsOf(partsOf(root).active, line).filter(
          (x) => x > ink.left + 4 && x < ink.right - 4,
        )
        expect(troughs.length).toBeGreaterThan(2)
        const expected = (((0.25 + linearCyclePhaseAt(ms)) % 1) + 1) % 1
        for (const x of troughs) {
          const off = (((x / 20 - expected) % 1) + 1) % 1
          expect(Math.min(off, 1 - off) * 20).toBeCloseTo(0, 0)
        }
      }
    })
  })

  describe('the change from indeterminate to determinate', () => {
    // When the cycle's lines have left, from the moment of a switch: the page's clock runs on.
    const leaveOf = (start: number) => {
      const at = ((start % linearCycle) + linearCycle) % linearCycle
      return at < linearInkGone ? start + linearInkGone - at : start
    }
    const settled = (ms: number) => 1 - (1 + sqrt50 * ms) * Math.exp(-sqrt50 * ms)

    it('lets the lines run off the end, pops the stop indicator in, then fills from 0, as in the video', () => {
      const { rerender } = render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" isIndeterminate />
        </Box>,
      )
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={60} />
        </Box>,
      )
      const root = bar()
      const { active, track, stop } = partsOf(root)
      const start = began(root)
      const leave = leaveOf(start)
      // The cycle plays on as it was: a line is drawn where the loop would draw one, read
      // at a moment clear of the cycle's seam, where a keyframe blends into nothing.
      const seam = ((start + 10) % linearCycle) + (start + 10 < 0 ? linearCycle : 0)
      const moment = start + 10 + (seam < 40 || seam > linearCycle - 40 ? 80 : 0)
      seek(root, moment)
      const lines = linearIndeterminate(moment)
      expect(areaOf(active) > 0).toBe(lines.some((line) => line.to > line.from))
      expect(stopOf(stop!).r).toBe(0)
      // Once the lines have left, the track is whole and the stop indicator pops in 4 frames
      // on, over 13 on the standard easing, 2dp in radius.
      seek(root, leave + 1)
      expect(areaOf(active)).toBe(0)
      expect(inkOf(track)).toEqual({ left: 0, right: 240, top: 0, bottom: 4 })
      expect(stopOf(stop!).r).toBe(0)
      seek(root, leave + handover.dotDelay + handover.dotDuration / 2)
      expect(stopOf(stop!).r).toBeCloseTo(2 * standard(0.5), 1)
      expect(stopOf(stop!)).toMatchObject({ x: 238, y: 2 })
      expect(areaOf(active)).toBe(0)
      seek(root, leave + handover.dotDelay + handover.dotDuration)
      expect(stopOf(stop!)).toEqual({ r: 2, x: 238, y: 2 })
      // The value fills from 0 on the spring, 29 frames after the lines left.
      seek(root, leave + handover.fillDelay)
      expect(areaOf(active)).toBe(0)
      seek(root, leave + handover.fillDelay + 250)
      expect(inkOf(active).right).toBeCloseTo(0.6 * settled(250) * 240 + 2, 0)
      seek(root, leave + handover.fillDelay + 5000)
      expect(inkOf(active).right).toBeCloseTo(0.6 * 240 + 2, 0)
    })

    it('can be given a value at any moment of the cycle', async () => {
      // Twenty switches 137ms apart, spread over the 2.67s cycle: each must plan without throwing.
      for (let i = 0; i < 20; i++) {
        const { rerender, unmount } = render(
          <Box>
            <LinearProgressIndicator aria-label="Loading" isIndeterminate />
            <CircularProgressIndicator aria-label="Working" isIndeterminate />
          </Box>,
        )
        rerender(
          <Box>
            <LinearProgressIndicator aria-label="Loading" value={50} />
            <CircularProgressIndicator aria-label="Working" value={50} />
          </Box>,
        )
        expect(bar().getAnimations({ subtree: true }).length).toBeGreaterThan(0)
        expect(bar('Working').getAnimations({ subtree: true }).length).toBeGreaterThan(0)
        unmount()
        await new Promise((resolve) => setTimeout(resolve, 137))
      }
    })

    it('keeps its moment when the value changes again while it waits', () => {
      const { rerender } = render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" isIndeterminate />
        </Box>,
      )
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={60} />
        </Box>,
      )
      const root = bar()
      const leave = leaveOf(began(root))
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={80} />
        </Box>,
      )
      const { active, stop } = partsOf(root)
      seek(root, leave + handover.dotDelay + handover.dotDuration / 2)
      expect(stopOf(stop!).r).toBeCloseTo(2 * standard(0.5), 1)
      seek(root, leave + handover.fillDelay)
      expect(areaOf(active)).toBe(0)
      seek(root, leave + handover.fillDelay + 250)
      expect(inkOf(active).right).toBeCloseTo(0.8 * settled(250) * 240 + 2, 0)
    })

    it('shrinks a circular arc into its tail over 500ms, then fills from the top', () => {
      const { rerender } = render(
        <Scheme>
          <CircularProgressIndicator aria-label="Loading" isIndeterminate />
        </Scheme>,
      )
      rerender(
        <Scheme>
          <CircularProgressIndicator aria-label="Loading" value={50} />
        </Scheme>,
      )
      const root = bar()
      const { active, track, turn } = partsOf(root)
      const start = began(root)
      const leave = start + circularLeave
      // The arc's ink shortens on a half cosine while the drawing turns on as it was: at
      // 250ms it is half of what the cycle would draw, on the 22dp ring, 4dp thick.
      seek(root, start + 1)
      expect(areaOf(active)).toBeGreaterThan(0)
      seek(root, start + 250)
      const half = areaOf(active)
      const drawn = sweepAt(start + 250) * (1 - accelerateDecelerate(0.5)) * 2 * Math.PI * 22 * 4
      expect(half).toBeLessThan(drawn + 30)
      expect(half).toBeGreaterThan(drawn - 30)
      expect(parseFloat(getComputedStyle(turn!).rotate)).toBeGreaterThan(0)
      seek(root, leave + 1)
      expect(areaOf(active)).toBe(0)
      expect(parseFloat(getComputedStyle(turn!).rotate)).toBe(0)
      // The track is the whole ring, 22dp round and 4dp thick, closed by its two caps lying
      // on each other at the top, which the outline traces as a disc of their own.
      expect(areaOf(track)).toBeCloseTo(2 * Math.PI * 22 * 4 + Math.PI * 2 * 2, -1)
      seek(root, leave + handover.fillDelay + 250)
      expect(inkOf(active).top).toBeCloseTo(0, 0)
      expect(areaOf(active)).toBeCloseTo(0.5 * settled(250) * 2 * Math.PI * 22 * 4 + 4 * 4, -1)
    })
  })

  describe('a circular indicator', () => {
    const angles = (el: Element, box: number) =>
      pointsOf(clipOf(el))
        .filter((p) => p.sub === 0)
        .map((p) => ((Math.atan2(p.x - box / 2, box / 2 - p.y) * 180) / Math.PI + 360) % 360)

    it('fills from the top clockwise, its track the rest less the gaps', () => {
      render(
        <Scheme>
          <CircularProgressIndicator aria-label="Loading" value={25} />
        </Scheme>,
      )
      const root = bar()
      seek(root, began(root) + 1)
      const { active, track } = partsOf(root)
      const ink = inkOf(active)
      expect(ink.top).toBeCloseTo(0, 0)
      expect(ink.right).toBeCloseTo(48, 0)
      expect(ink.left).toBeCloseTo(22, 0)
      // On the 22dp ring the arc's center line runs the quarter turn and its caps 5.2 degrees
      // past each end; the track's gaps are, as on Android, the gap and a thickness taken over
      // the whole size's circumference, 19.1 degrees, less its own caps.
      const capDegrees = (2 * 180) / (Math.PI * 22)
      const gapDegrees = (8 * 360) / (Math.PI * 48)
      const head = angles(active, 48).filter((angle) => angle < 180)
      expect(Math.max(...head)).toBeCloseTo(90 + capDegrees, 0)
      const trackAngles = angles(track, 48)
      expect(Math.min(...trackAngles)).toBeCloseTo(90 + gapDegrees - capDegrees, 0)
      expect(Math.max(...trackAngles)).toBeCloseTo(360 - gapDegrees + capDegrees, 0)
    })

    it('turns and draws its arc out and back as Android does, when indeterminate', () => {
      render(
        <Scheme>
          <CircularProgressIndicator aria-label="Loading" isIndeterminate />
        </Scheme>,
      )
      const root = bar()
      const { active, track, turn } = partsOf(root)
      const moment = (ms: number) => 100 * circularCycle + ms + 0.01
      // The drawing starts a quarter turned, so the arc sets off from the right, and turns
      // 180 degrees a second with a further 90 over the first 300ms.
      seek(root, moment(0))
      expect(parseFloat(getComputedStyle(turn!).rotate)).toBeCloseTo(90, 0)
      seek(root, moment(300))
      expect(parseFloat(getComputedStyle(turn!).rotate)).toBeCloseTo(234, 0)
      seek(root, moment(1000))
      expect(parseFloat(getComputedStyle(turn!).rotate)).toBeCloseTo(360, 0)
      // In the turning drawing the ink starts at the top and spans the sweep, a tenth of a
      // turn at first and 0.87 at 3s; the track keeps the gap and a thickness over the whole
      // size from each end, less the caps, on the 22dp ring.
      const capDegrees = (2 * 180) / (Math.PI * 22)
      const gapDegrees = (8 * 360) / (Math.PI * 48)
      const head = (el: Element) => Math.max(...angles(el, 48).filter((a) => a < 340))
      seek(root, moment(0))
      expect(head(active)).toBeCloseTo(36 + capDegrees, 0)
      expect(Math.min(...angles(track, 48))).toBeCloseTo(36 + gapDegrees - capDegrees, 0)
      expect(Math.max(...angles(track, 48))).toBeCloseTo(360 - gapDegrees + capDegrees, 0)
      seek(root, moment(3000))
      expect(head(active)).toBeCloseTo(0.87 * 360 + capDegrees, 0)
      seek(root, moment(4500))
      expect(head(active)).toBeCloseTo(sweepAt(4500) * 360 + capDegrees, 0)
    })

    it('peaks its wave past the track and carries it round toward the tail, a point a second, when indeterminate', () => {
      render(
        <Scheme>
          <CircularProgressIndicator aria-label="Loading" shape="wavy" isIndeterminate />
        </Scheme>,
      )
      const root = bar()
      const { active, track } = partsOf(root)
      // The drawing's box reaches 1.6dp past the 48dp one on each side, so its center is 25.6.
      const c = 24 + 1.6
      const outer = (el: Element) =>
        Math.max(...pointsOf(clipOf(el)).map((p) => Math.hypot(p.x - c, p.y - c)))
      const moment = (ms: number) => 100 * circularCycle + ms + 0.01
      seek(root, moment(1500))
      // The track's outer edge is 24dp out, the star's crests 1.4dp more, past the box.
      expect(outer(track)).toBeCloseTo(24, 0)
      expect(outer(active)).toBeCloseTo(25.4, 0)
      // Nine crests, 40 degrees apart, that move toward the tail 40 degrees a second: the
      // angles of the ink's points past the track's edge, clustered, any the arc's ends cut
      // left out.
      const crests = (ms: number) => {
        seek(root, moment(ms))
        const found = pointsOf(clipOf(active), 16)
          .filter((p) => Math.hypot(p.x - c, p.y - c) > 23.6)
          .map((p) => ((Math.atan2(p.x - c, c - p.y) * 180) / Math.PI + 360) % 360)
          .sort((a, b) => a - b)
        const groups: number[][] = []
        for (const a of found) {
          const last = groups[groups.length - 1]
          if (last && a - last[last.length - 1]! < 10) last.push(a)
          else groups.push([a])
        }
        const head = sweepAt(ms) * 360
        return groups
          .map((g) => g.reduce((s, a) => s + a, 0) / g.length)
          .filter((a) => a > 12 && a < head - 12)
      }
      const at1500 = crests(1500)
      expect(at1500.length).toBeGreaterThan(2)
      for (let i = 1; i < at1500.length; i++) expect(at1500[i]! - at1500[i - 1]!).toBeCloseTo(40, 0)
      const at2000 = crests(2000)
      const moved = (((at2000[1]! - at1500[1]!) % 40) + 40) % 40
      expect(moved).toBeCloseTo(20, 0)
    })
  })

  describe('reduced motion', () => {
    useReducedMotion()

    it('is really emulated, so the checks below run with reduced motion', () => {
      expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
    })

    it('jumps to a new value, while an indeterminate indicator keeps moving', () => {
      const { rerender } = render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={20} />
          <LinearProgressIndicator aria-label="Working" isIndeterminate />
        </Box>,
      )
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={60} />
          <LinearProgressIndicator aria-label="Working" isIndeterminate />
        </Box>,
      )
      const root = bar()
      seek(root, began(root) + 1)
      expect(inkOf(partsOf(root).active).right).toBeCloseTo(0.6 * 240 + 2, 0)
      const working = bar('Working')
      expect(working.getAnimations({ subtree: true }).map((a) => a.playState)).toEqual([
        'running',
        'running',
      ])
      // Given a value, an indeterminate one changes at once, its stop indicator with it.
      rerender(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={60} />
          <LinearProgressIndicator aria-label="Working" value={30} />
        </Box>,
      )
      seek(working, began(working) + 1)
      expect(inkOf(partsOf(working).active).right).toBeCloseTo(0.3 * 240 + 2, 0)
      expect(stopOf(partsOf(working).stop!)).toEqual({ r: 2, x: 238, y: 2 })
    })
  })

  describe('right to left', () => {
    it('mirrors the parts of a linear indicator, not its root or a circular one', () => {
      render(
        <Scheme>
          <div dir="rtl" style={{ width: 240 }}>
            <LinearProgressIndicator aria-label="Linear" value={50} />
            <CircularProgressIndicator aria-label="Circular" value={50} />
          </div>
        </Scheme>,
      )
      const scale = (el: Element) => getComputedStyle(el).scale
      const linear = partsOf(bar('Linear'))
      expect(scale(bar('Linear'))).toBe('none')
      expect([linear.track, linear.active, linear.stop!].map(scale)).toEqual([
        '-1 1',
        '-1 1',
        '-1 1',
      ])
      const circular = partsOf(bar('Circular'))
      expect([bar('Circular'), circular.turn!, circular.track, circular.active].map(scale)).toEqual(
        ['none', 'none', 'none', 'none'],
      )
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the check below runs in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('keeps the active indicator in the system text color and the track in its gray', () => {
      render(
        <Box>
          <LinearProgressIndicator aria-label="Loading" value={40} />
        </Box>,
      )
      const { track, active, stop } = partsOf(bar())
      expect(getComputedStyle(active).backgroundColor).toBe(computedColor('CanvasText', active))
      expect(getComputedStyle(stop!).backgroundColor).toBe(computedColor('CanvasText', active))
      expect(getComputedStyle(track).backgroundColor).toBe(computedColor('GrayText', track))
    })
  })
})
