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
import { LoadingIndicator } from './loading-indicator'

/* What needs a real browser and stylesheet: the 48dp box at every size, the colors of
 * both configurations and their contrast, the motion a frame at a time, reduced motion
 * and forced colors. Markup: loading-indicator.test.tsx. */

const indicator = (name = 'Loading') => screen.getByRole('progressbar', { name })
const active = (name?: string) => indicator(name).firstElementChild as HTMLElement

// The motion is the video's, in frames of a 60th of a second: a round is its 279 frames
// that differ, the 280th being the first again, turned 72 degrees. Five rounds close the loop.
const frame = 1000 / 60
const frames = 279
const rounds = 5
const turn = 72

/** Takes the motion away, for what the active indicator is before any of it. */
function still(el: Element) {
  for (const animation of el.getAnimations()) animation.cancel()
}

/** Stops the active indicator's animations at a time given in frames. */
function seek(el: Element, at: number) {
  for (const animation of el.getAnimations()) {
    animation.pause()
    animation.currentTime = at * frame
  }
}

/** The path the active indicator is clipped to, as the browser computes it. */
const clip = (el: Element) => /path\("(.+)"\)/.exec(getComputedStyle(el).clipPath)![1]!

/** The path at a frame. */
const clipAt = (el: Element, at: number) => {
  seek(el, at)
  return clip(el)
}

/** The paths the stylesheet gives the animation, one to a keyframe. */
const keyframes = (el: Element) =>
  (el.getAnimations()[0]!.effect as KeyframeEffect).getKeyframes().map((keyframe) => ({
    offset: keyframe.computedOffset,
    path: /path\("(.+)"\)/.exec(String(keyframe.clipPath))![1]!,
  }))

/** The numbers of a path, which the browser computes as absolute coordinates. */
const numbers = (d: string) => (d.match(/-?[\d.]+/g) ?? []).map(Number)

type Point = readonly [number, number]

/** Points along a path's outline, from the 48dp box's center, a number of them to a curve. */
function pointsOf(d: string, per = 16) {
  const points: Point[] = []
  let [at, handle]: [Point, Point] = [
    [0, 0],
    [0, 0],
  ]
  for (const [, command, rest] of d.matchAll(/([MCSZ])([^MCSZ]*)/g)) {
    const values = numbers(rest!)
    if (command === 'M') at = [values[0]!, values[1]!]
    if (command !== 'C' && command !== 'S') continue
    // A smooth curve leaves a point the way the curve before it came in.
    const [x1, y1, x2, y2, x, y] =
      command === 'C' ? values : [2 * at[0] - handle[0], 2 * at[1] - handle[1], ...values]
    for (let i = 0; i < per; i++) {
      const [t, u] = [i / per, 1 - i / per]
      const along = (from: number, a: number, b: number, to: number) =>
        u * u * u * from + 3 * u * u * t * a + 3 * u * t * t * b + t * t * t * to
      points.push([along(at[0], x1!, x2!, x!) - 24, along(at[1], y1!, y2!, y!) - 24])
    }
    ;[at, handle] = [
      [x!, y!],
      [x2!, y2!],
    ]
  }
  return points
}

/** How far each point of an outline is from the box's center. */
const radii = (d: string) => pointsOf(d).map(([x, y]) => Math.hypot(x, y))

/** How far out each point of a shape reaches: where its outline goes out from the center and back in, by a dp or more. */
function reaches(d: string) {
  const all = radii(d)
  const start = all.indexOf(Math.min(...all))
  const found: number[] = []
  let [rising, low, high] = [false, all[start]!, 0]
  for (let i = 1; i <= all.length; i++) {
    const radius = all[(start + i) % all.length]!
    if (rising) {
      high = Math.max(high, radius)
      if (radius < high - 1) {
        found.push(high)
        ;[rising, low] = [false, radius]
      }
    } else {
      low = Math.min(low, radius)
      if (radius > low + 1) [rising, high] = [true, radius]
    }
  }
  return found
}

/** How far an outline's center of area is from the box's center. */
function offCenter(outline: Point[]) {
  let [area, x, y] = [0, 0, 0]
  outline.forEach(([fromX, fromY], i) => {
    const [toX, toY] = outline[(i + 1) % outline.length]!
    const cross = fromX * toY - toX * fromY
    area += cross
    x += (fromX + toX) * cross
    y += (fromY + toY) * cross
  })
  return Math.hypot(x, y) / Math.abs(3 * area)
}

/** The area inside an outline, in square dp. */
const areaOf = (outline: Point[]) =>
  Math.abs(
    outline.reduce((sum, [fromX, fromY], i) => {
      const [toX, toY] = outline[(i + 1) % outline.length]!
      return sum + fromX * toY - toX * fromY
    }, 0),
  ) / 2

/** An outline's width across, measured in every direction: the widest and the narrowest. */
function across(outline: Point[]) {
  let [widest, narrowest] = [0, Infinity]
  for (let degrees = 0; degrees < 180; degrees += 0.25) {
    const along = turned(outline, degrees).map(([x]) => x)
    const width = Math.max(...along) - Math.min(...along)
    ;[widest, narrowest] = [Math.max(widest, width), Math.min(narrowest, width)]
  }
  return [widest, narrowest] as const
}

/** The farthest any point of one outline is from another outline. */
const apart = (one: Point[], other: Point[]) =>
  Math.max(
    ...one.map(([x, y]) =>
      Math.min(
        ...other.map(([u, v], i) => {
          const [toU, toV] = other[(i + 1) % other.length]!
          const [du, dv] = [toU - u, toV - v]
          const t = Math.max(0, Math.min(1, ((x - u) * du + (y - v) * dv) / (du * du + dv * dv)))
          return Math.hypot(x - u - t * du, y - v - t * dv)
        }),
      ),
    ),
  )

const scaled = (el: Element) => parseFloat(getComputedStyle(el).scale)

/** How far round the active indicator's box is turned, in degrees. */
const turnOf = (el: Element) => parseFloat(getComputedStyle(el).rotate) || 0

/** An outline turned about the box's center. */
const turned = (outline: Point[], degrees: number) => {
  const [cos, sin] = [Math.cos((degrees * Math.PI) / 180), Math.sin((degrees * Math.PI) / 180)]
  return outline.map(([x, y]): Point => [x * cos - y * sin, x * sin + y * cos])
}

/** The outline on screen at a frame: the path of that frame, in the box as it is turned then. */
const drawnAt = (el: Element, at: number, per?: number) =>
  turned(pointsOf(clipAt(el, at), per), turnOf(el))

describe('LoadingIndicator in a browser', () => {
  describe('size', () => {
    it('is 48dp, and the box the active indicator is drawn in fills it', () => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Loading" />
        </Scheme>,
      )
      const el = active()
      still(el)
      const box = indicator().getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      expect([box.width, box.height]).toEqual([48, 48])
      expect([rect.width, rect.height]).toEqual([48, 48])
      expect([rect.left - box.left, rect.top - box.top]).toEqual([0, 0])
    })

    it('is a 38dp circle at the center of the box should nothing animate it', () => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Loading" />
        </Scheme>,
      )
      const el = active()
      still(el)
      expect(getComputedStyle(el).clipPath).toMatch(/^circle\(19px( at 50% 50%)?\)$/)
    })

    it.each([24, 96, 240])('is %idp when asked, what is drawn in it in proportion', (size) => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Loading" size={size} />
        </Scheme>,
      )
      const el = active()
      still(el)
      const box = indicator().getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      expect([box.width, box.height]).toEqual([size, size])
      expect(rect.width).toBeCloseTo(size, 3)
      expect(rect.left - box.left).toBeCloseTo(0, 3)
      expect(rect.top - box.top).toBeCloseTo(0, 3)
      expect(scaled(el)).toBe(size / 48)
    })

    it('is brought back to the 24dp least and the 240dp most', () => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Too small" size={12} />
          <LoadingIndicator aria-label="Too large" size={400} />
        </Scheme>,
      )
      expect(indicator('Too small').getBoundingClientRect().width).toBe(24)
      expect(indicator('Too large').getBoundingClientRect().width).toBe(240)
      still(active('Too small'))
      still(active('Too large'))
      expect(scaled(active('Too small'))).toBe(0.5)
      expect(scaled(active('Too large'))).toBe(5)
    })

    it('takes a size that a parent sets as the custom property', () => {
      render(
        <Scheme>
          <div style={{ '--loading-indicator-size': 72 } as React.CSSProperties}>
            <LoadingIndicator aria-label="Loading" />
          </div>
        </Scheme>,
      )
      expect(indicator().getBoundingClientRect().width).toBe(72)
      still(active())
      expect(scaled(active())).toBe(1.5)
    })

    it('does not grow or shrink with the text size around it', () => {
      render(
        <Scheme>
          <div style={{ fontSize: 40 }}>
            <LoadingIndicator aria-label="Loading" />
          </div>
        </Scheme>,
      )
      expect(indicator().getBoundingClientRect().width).toBe(48)
    })
  })

  describe('color', () => {
    it('is an active indicator in primary, with no container', () => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Loading" />
        </Scheme>,
      )
      const el = active()
      expect(getComputedStyle(el).backgroundColor).toBe(
        computedColor('var(--md-sys-color-primary)', el),
      )
      expect(rgba(getComputedStyle(indicator()).backgroundColor)[3]).toBe(0)
    })

    it('is in on-primary-container on a round primary-container when contained', () => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Loading" isContained />
        </Scheme>,
      )
      const el = active()
      const container = getComputedStyle(indicator())
      expect(getComputedStyle(el).backgroundColor).toBe(
        computedColor('var(--md-sys-color-on-primary-container)', el),
      )
      expect(container.backgroundColor).toBe(
        computedColor('var(--md-sys-color-primary-container)', el),
      )
      expect(parseFloat(container.borderTopLeftRadius)).toBeGreaterThanOrEqual(24)
    })

    it.each(schemes)(
      'has 3:1 contrast with the surface in the %s scheme at %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <LoadingIndicator aria-label="Loading" />
          </Scheme>,
        )
        const el = active()
        const surface = getComputedStyle(schemeOf(el)).backgroundColor
        expect(contrastRatio(getComputedStyle(el).backgroundColor, surface)).toBeGreaterThanOrEqual(
          3,
        )
      },
    )

    it.each(schemes)(
      'has 3:1 contrast with its container in the %s scheme at %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <LoadingIndicator aria-label="Loading" isContained />
          </Scheme>,
        )
        const el = active()
        const container = getComputedStyle(indicator()).backgroundColor
        expect(
          contrastRatio(getComputedStyle(el).backgroundColor, container),
        ).toBeGreaterThanOrEqual(3)
      },
    )

    it('takes the text color of what it is in when given text-current', () => {
      render(
        <Scheme>
          <div style={{ color: 'rgb(1, 2, 3)' }}>
            <LoadingIndicator aria-label="Loading" className="text-current" />
          </div>
        </Scheme>,
      )
      expect(getComputedStyle(active()).backgroundColor).toBe('rgb(1, 2, 3)')
    })
  })

  describe('motion', () => {
    const renderOne = (size?: number) => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Loading" size={size} />
        </Scheme>,
      )
      return active()
    }

    it('plays a round of 279 frames, 60 to the second, and turns a step with each, without end', () => {
      const el = renderOne()
      const animations = el.getAnimations()
      expect(animations.map((animation) => (animation as CSSAnimation).animationName)).toEqual([
        'loading-indicator-morph',
        'loading-indicator-turn',
      ])
      const [morph, turning] = animations.map((animation) => animation.effect!.getComputedTiming())
      expect(Number(morph!.duration) / frame).toBeCloseTo(frames, 6)
      // Exactly a round to a step, or the two would drift apart.
      expect(turning!.duration).toBe(rounds * Number(morph!.duration))
      expect([morph!.iterations, turning!.iterations]).toEqual([Infinity, Infinity])
      // The pace is each keyframe's own: even between frames, and a turn in five steps.
      const [paced, stepped] = animations.map(
        (animation) => (animation.effect as KeyframeEffect).getKeyframes()[0]!.easing,
      )
      expect(paced).toBe('linear')
      expect(stepped).toMatch(/^steps\(5(, end)?\)$/)
    })

    it('has a keyframe for every frame of a round, in order, and one more that ends the last', () => {
      const all = keyframes(renderOne())
      expect(all).toHaveLength(frames + 1)
      all.forEach(({ offset }, i) => expect(offset).toBeCloseTo(i / frames, 5))
    })

    it('draws every frame in the same 40 curves, so that the browser can go from one to the next', () => {
      // As the browser reads them: one curve, and 39 smooth ones that carry it on.
      const commands = keyframes(renderOne()).map(({ path }) => path.replace(/[\d.\s-]+/g, ''))
      expect(new Set(commands)).toEqual(new Set(['MC' + 'S'.repeat(39) + 'Z']))
    })

    it('is on the outline of a frame at that frame, and between two frames between theirs', () => {
      const el = renderOne()
      const all = keyframes(el)
      for (let at = 0; at < frames; at += 7) {
        const here = clipAt(el, at)
        expect(apart(pointsOf(here), pointsOf(all[at]!.path))).toBeLessThan(0.01)
        const [from, half, to] = [here, clipAt(el, at + 0.5), clipAt(el, at + 1)].map(numbers)
        expect(half).toHaveLength(from!.length)
        const off = half!.map((value, n) => Math.abs(value - (from![n]! + to![n]!) / 2))
        expect(Math.max(...off)).toBeLessThan(0.01)
      }
    })

    it('draws a different outline in every frame', () => {
      const el = renderOne()
      const drawn = Array.from({ length: frames }, (_, at) => clipAt(el, at))
      expect(new Set(drawn).size).toBe(frames)
    })

    // Where each of the seven shapes rests in the video: its points, and the least and the
    // most it is from the center, in dp, at the size of its drawing in the M3 Design Kit.
    it.each([
      ['soft burst', 0, 10, 13.2, 17.4],
      ['9-sided cookie', 30, 9, 15.7, 17.2],
      ['pentagon', 70, 5, 14.9, 17.45],
      ['pill', 110, 2, 12.9, 15.9],
      ['sunny', 150, 8, 14.35, 17],
      ['4-sided cookie', 190, 4, 12.35, 16.75],
      ['oval', 230, 2, 11.5, 17.8],
    ] as const)('is the %s of the video at frame %i', (_, at, count, least, most) => {
      const path = clipAt(renderOne(), at)
      expect(reaches(path)).toHaveLength(count)
      const all = radii(path)
      expect(Math.abs(Math.min(...all) - least)).toBeLessThan(0.1)
      expect(Math.abs(Math.max(...all) - most)).toBeLessThan(0.1)
    })

    // The Design Kit's drawing of each shape: its area in square dp, and its widest and
    // its narrowest width across. The video has the 4-sided cookie 15% larger than that,
    // the oval 11% and the pill 7%; the soft burst and the pentagon are not quite its shapes.
    it.each([
      ['soft burst', 0, 734, 34.46, 32.56, 0.5],
      ['9-sided cookie', 30, 857, 34, 33.57, 0.1],
      ['pentagon', 70, 813, 34, 32, 0.25],
      ['pill', 110, 676, 31.74, 25.79, 0.1],
      ['sunny', 150, 769, 34, 31.82, 0.1],
      ['4-sided cookie', 190, 694, 33.55, 28, 0.1],
      ['oval', 230, 644, 35.65, 23, 0.1],
    ] as const)(
      'draws the %s at the size of its Design Kit drawing',
      (_, at, area, widest, narrowest, within) => {
        const outline = pointsOf(clipAt(renderOne(), at))
        expect(Math.abs(areaOf(outline) / area - 1)).toBeLessThan(0.005)
        const [wide, narrow] = across(outline)
        expect(Math.abs(wide - widest)).toBeLessThan(within)
        expect(Math.abs(narrow - narrowest)).toBeLessThan(within)
      },
    )

    it('has its center of area on the center of the box in every frame', () => {
      const el = renderOne()
      for (let at = 0; at < frames; at++) {
        expect(offCenter(pointsOf(clipAt(el, at)))).toBeLessThan(0.02)
      }
    })

    // The video draws these two about a point that is not their own center: the cookie
    // 0.35dp off it and the pentagon 1.1dp, which left their points 0.7 and 2.1dp uneven.
    it.each([
      ['9-sided cookie', 30, 0.1],
      ['pentagon', 70, 0.35],
    ] as const)('has the %s on the center, its points all reaching as far', (_, at, uneven) => {
      const all = reaches(clipAt(renderOne(), at))
      expect(Math.max(...all) - Math.min(...all)).toBeLessThan(uneven)
    })

    it('never jumps: a frame is within 3dp of the one before it, and less while a shape rests', () => {
      const el = renderOne()
      let before = drawnAt(el, 0, 6)
      // On into the second round, over where the two meet.
      for (let at = 1; at < frames + 40; at++) {
        const now = drawnAt(el, at, 6)
        const moved = Math.max(apart(before, now), apart(now, before))
        expect(moved).toBeLessThan((at % frames) % 40 >= 25 || at % frames === 0 ? 1 : 3)
        before = now
      }
    })

    it('ends a round on the outline the next begins with, the first turned 72 degrees', () => {
      const all = keyframes(renderOne())
      const [first, last] = [turned(pointsOf(all[0]!.path), turn), pointsOf(all[frames]!.path)]
      expect(apart(first, last)).toBeLessThan(0.02)
      expect(apart(last, first)).toBeLessThan(0.02)
    })

    it('plays each round turned 72 degrees further than the one before', () => {
      const el = renderOne()
      for (let round = 0; round < 2 * rounds; round++) {
        seek(el, round * frames + 100)
        expect(turnOf(el)).toBe((round % rounds) * turn)
      }
    })

    it.each([1, 2, 3, 4, 5])('goes from round %i into the next with no jump', (round) => {
      const el = renderOne()
      const meet = round * frames
      // A frame before, the last moment of the round, the first of the next, a frame after.
      const [before, last, first, after] = [meet - 1, meet - 0.001, meet, meet + 1].map((at) =>
        drawnAt(el, at),
      )
      expect(Math.max(apart(last!, first!), apart(first!, last!))).toBeLessThan(0.02)
      expect(Math.max(apart(before!, first!), apart(first!, before!))).toBeLessThan(0.5)
      expect(Math.max(apart(first!, after!), apart(after!, first!))).toBeLessThan(1)
    })

    it('is back where it began after five rounds: the loop closes', () => {
      const el = renderOne()
      for (const at of [0, 1, 37, 150, 278]) {
        const [once, again] = [drawnAt(el, at), drawnAt(el, rounds * frames + at)]
        expect(turnOf(el)).toBe(0)
        expect(apart(once, again)).toBeLessThan(0.001)
      }
    })

    it('changes size in its paths alone, the box it is drawn in staying put through a round', () => {
      const el = renderOne(96)
      const box = indicator().getBoundingClientRect()
      for (let at = 0; at < frames; at += 5) {
        seek(el, at)
        const style = getComputedStyle(el)
        expect([turnOf(el), style.transform, style.scale]).toEqual([0, 'none', '2'])
        const rect = el.getBoundingClientRect()
        expect([rect.left, rect.top, rect.width, rect.height]).toEqual([box.left, box.top, 96, 96])
      }
    })

    it('stays inside the 48dp box, the soft burst as it comes in reaching the farthest', () => {
      const el = renderOne()
      const reach = Array.from({ length: frames }, (_, at) => Math.max(...radii(clipAt(el, at))))
      const farthest = Math.max(...reach)
      expect(farthest).toBeLessThan(24)
      expect(farthest).toBeCloseTo(19.2, 1)
      expect(reach.indexOf(farthest)).toBe(255)
    })

    it('does not make what it is in scroll, at its largest and with its box turned', () => {
      render(
        <Scheme>
          <div data-testid="scroller" style={{ width: 240, height: 240, overflow: 'auto' }}>
            <LoadingIndicator aria-label="Loading" size={240} />
          </div>
        </Scheme>,
      )
      const scroller = screen.getByTestId('scroller')
      // Every round: the box the shapes are drawn in is turned in all but the first.
      for (let at = 0; at < rounds * frames; at += 15) {
        seek(active(), at)
        expect([scroller.scrollWidth, scroller.scrollHeight]).toEqual([240, 240])
      }
    })
  })

  describe('reduced motion', () => {
    useReducedMotion()

    it('is really emulated, so the check below runs with reduced motion', () => {
      expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
    })

    it('keeps playing, being the only sign that the activity is in progress', () => {
      render(
        <Scheme>
          <LoadingIndicator aria-label="Loading" />
        </Scheme>,
      )
      const el = active()
      const animations = el.getAnimations()
      expect(animations.map((animation) => (animation as CSSAnimation).animationName)).toEqual([
        'loading-indicator-morph',
        'loading-indicator-turn',
      ])
      expect(animations.map(({ playState }) => playState)).toEqual(['running', 'running'])
      expect(clipAt(el, 40)).not.toBe(clipAt(el, 0))
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the check below runs in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it.each([false, true])(
      'keeps the active indicator visible, in the system text color (contained: %s)',
      (contained) => {
        render(
          <Scheme>
            <LoadingIndicator aria-label="Loading" isContained={contained} />
          </Scheme>,
        )
        const el = active()
        expect(getComputedStyle(el).backgroundColor).toBe(computedColor('CanvasText', el))
        expect(getComputedStyle(el).backgroundColor).not.toBe(computedColor('Canvas', el))
      },
    )
  })
})
