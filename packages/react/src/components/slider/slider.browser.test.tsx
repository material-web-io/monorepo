import { render, screen } from '@testing-library/react'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  computedColor,
  contrastRatio,
  Scheme,
  schemeOf,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
} from '../../test-browser'
import { Icon } from '../icon'
import { Slider, type SliderProps } from './slider'

/* What needs a real browser and stylesheet: where the handles, stretches of track, stops, inset
 * icon and value indicator are, at each size, value and state, measured by their boxes and by
 * hit-testing the clipped stretches; their colors, the focus ring, the target, the pointer, the
 * motion and forced colors. Markup, values and keys: slider.test.tsx. */

/** The hidden `<input type="range">` of a handle: the name, the value and the focus. */
const input = (name: string) => screen.getByRole<HTMLInputElement>('slider', { name })
/** The slider, React Aria's Slider: the `<div>` in the group role. */
const group = (name: string) => screen.getByRole('group', { name })
/** React Aria's SliderTrack, the group's last child: the handles' travel, 6dp short of the track at either end. */
const track = (name: string) => group(name).lastElementChild as HTMLElement
/** Its thumbs (React Aria's SliderThumb `<div>`s), then its stretches of track (`<span>`s), each the whole track clipped. */
const thumbs = (name: string) =>
  [...track(name).children].filter((el) => el.tagName === 'DIV') as HTMLElement[]
const segments = (name: string) =>
  [...track(name).children].filter((el) => el.tagName === 'SPAN') as HTMLElement[]
/** A thumb holds the hidden input's span, the handle, then the value indicator. */
const handle = (name: string, index = 0) => thumbs(name)[index]!.children[1] as HTMLElement
const indicator = (name: string, index = 0) => thumbs(name)[index]!.children[2] as HTMLElement
const stops = (segment: Element) =>
  [...segment.querySelectorAll<HTMLElement>(':scope > span')].filter((el) => !el.firstElementChild)
/** Where React Aria's SliderTrack is, for the pointer: CSS pixels from its top left corner. */
const trackSelector = (name: string) => `[role="group"][aria-label="${name}"] > div`

const color = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)
/** The same mix Tailwind writes for a color at /disabled-content or /disabled-container. */
const at = (role: string, opacity: 'content' | 'container', within: Element) =>
  computedColor(
    `color-mix(in oklab, var(--md-sys-color-${role}) calc(var(--md-sys-state-disabled-${opacity}-opacity) * 100%), transparent)`,
    within,
  )

/** A slider 320px across (or tall, vertical), named by `label`. */
function Named({ label, ...props }: SliderProps & { label: string }) {
  const length = { [props.orientation === 'vertical' ? 'height' : 'width']: 320 }
  return <Slider aria-label={label} style={length} {...props} />
}

/** The track's box: every stretch is drawn over all of it, and clipped. */
const bar = (name: string) => segments(name)[0]!.getBoundingClientRect()

/** A box's start and end along the track, in px from where values start: its left, right or bottom. */
function span(rect: DOMRect, name: string, from: 'left' | 'right' | 'bottom' = 'left') {
  const track = bar(name)
  if (from === 'left') return [rect.left - track.left, rect.right - track.left]
  if (from === 'right') return [track.right - rect.right, track.right - rect.left]
  return [track.bottom - rect.bottom, track.bottom - rect.top]
}
const center = (rect: DOMRect, name: string, from?: 'left' | 'right' | 'bottom') => {
  const [start, end] = span(rect, name, from)
  return (start! + end!) / 2
}

/**
 * Where each stretch of the track shows, by hit-testing along it, which follows its clip-path
 * corners and all: [start, end] in px from where values start, or null where one shows nowhere.
 * `across` is how far across the track the line runs, as a fraction of its thickness.
 */
function stretches(name: string, from: 'left' | 'right' | 'bottom' = 'left', across = 0.5) {
  const parts = segments(name)
  const el = track(name)
  const box = bar(name)
  // The stretches take no pointer, the track and its thumbs do: the other way round for now.
  el.style.pointerEvents = 'none'
  for (const part of parts) part.style.pointerEvents = 'auto'
  try {
    const found = parts.map(() => [Infinity, -Infinity])
    const length = from === 'bottom' ? box.height : box.width
    for (let d = -4; d <= length + 4; d += 0.25) {
      const [x, y] =
        from === 'bottom'
          ? [box.left + box.width * across, box.bottom - d - 0.125]
          : [
              from === 'left' ? box.left + d + 0.125 : box.right - d - 0.125,
              box.top + box.height * across,
            ]
      const hit = document.elementFromPoint(x, y)
      const index = parts.findIndex((part) => part === hit || part.contains(hit))
      if (index < 0) continue
      found[index]![0] = Math.min(found[index]![0]!, d)
      found[index]![1] = Math.max(found[index]![1]!, d + 0.25)
    }
    return found.map(([start, end]) => (start === Infinity ? null : [start!, end!]))
  } finally {
    el.style.pointerEvents = ''
    for (const part of parts) part.style.pointerEvents = ''
  }
}

/** Expects stretches like `stretches` gives, to a quarter pixel either way. */
function expectStretches(found: (number[] | null)[], expected: ([number, number] | null)[]) {
  expect(found.length).toBe(expected.length)
  expected.forEach((range, index) => {
    if (range === null) return expect(found[index], `stretch ${index}`).toBeNull()
    expect(found[index], `stretch ${index}`).not.toBeNull()
    expect(Math.abs(found[index]![0]! - range[0]), `stretch ${index} start`).toBeLessThanOrEqual(
      0.5,
    )
    expect(Math.abs(found[index]![1]! - range[1]), `stretch ${index} end`).toBeLessThanOrEqual(0.5)
  })
}

/** Where a handle's center is at value fraction p, on a 320px track: 6dp in, 308px of travel. */
const place = (p: number) => 6 + p * 308

describe('Slider', () => {
  describe('geometry', () => {
    it('draws a 16dp track as long as the slider, and a 4x44dp handle whose center travels 6dp in from either end', () => {
      render(
        <Scheme>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <Named label="Min" defaultValue={0} />
            <Named label="Half" defaultValue={50} />
            <Named label="Max" defaultValue={100} />
          </div>
        </Scheme>,
      )
      for (const [name, p] of [
        ['Min', 0],
        ['Half', 0.5],
        ['Max', 1],
      ] as const) {
        expect(bar(name).width).toBe(320)
        expect(bar(name).height).toBe(16)
        expect(bar(name).left).toBe(group(name).getBoundingClientRect().left)
        const rect = handle(name).getBoundingClientRect()
        expect([rect.width, rect.height]).toEqual([4, 44])
        expect(center(rect, name)).toBeCloseTo(place(p), 1)
        // Centered across the track.
        expect(rect.top + rect.height / 2).toBeCloseTo(bar(name).top + 8, 1)
      }
    })

    it('leaves 6dp between the handle and the stretch on either side, which shows nowhere once it has no length', () => {
      render(
        <Scheme>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <Named label="Min" defaultValue={0} />
            <Named label="Half" defaultValue={50} />
            <Named label="Max" defaultValue={100} />
          </div>
        </Scheme>,
      )
      expectStretches(stretches('Half'), [
        [0, 152],
        [168, 320],
      ])
      expectStretches(stretches('Min'), [null, [14, 320]])
      expectStretches(stretches('Max'), [[0, 306], null])
    })

    it('rounds a stretch by the track’s outer corner at its ends and by 2dp toward a handle', () => {
      render(
        <Scheme>
          <Named label="Half" defaultValue={50} />
        </Scheme>,
      )
      const [active, inactive] = segments('Half')
      expect(getComputedStyle(active!).clipPath).toMatch(/round 8px 2px 2px 8px\)$/)
      expect(getComputedStyle(inactive!).clipPath).toMatch(/round 2px 8px 8px 2px\)$/)
      // 1px in from its top edge, a corner of radius r is r - sqrt(r² - (r - 1)²) in from the side.
      const inset = (r: number) => r - Math.sqrt(r * r - (r - 1) ** 2)
      expectStretches(stretches('Half', 'left', 1 / 16), [
        [inset(8), 152 - inset(2)],
        [168 + inset(2), 320 - inset(8)],
      ])
    })

    it.each([
      ['xs', 16, 8, 44],
      ['s', 24, 8, 44],
      ['m', 40, 12, 52],
      ['l', 56, 16, 68],
      ['xl', 96, 28, 108],
    ] as const)(
      'sizes a %s slider’s track %idp thick, its outer corners %idp and its handle %idp long',
      (size, thickness, corner, length) => {
        render(
          <Scheme>
            <Named label="Volume" size={size} defaultValue={50} />
          </Scheme>,
        )
        expect(bar('Volume').height).toBe(thickness)
        expect(getComputedStyle(segments('Volume')[0]!).clipPath).toMatch(
          new RegExp(`round ${corner}px 2px 2px ${corner}px\\)$`),
        )
        const rect = handle('Volume').getBoundingClientRect()
        expect([rect.width, rect.height]).toEqual([4, length])
        // The handle's travel is as tall as it is, the track centered on it.
        expect(track('Volume').getBoundingClientRect().height).toBe(length)
        expect(bar('Volume').top + thickness / 2).toBeCloseTo(rect.top + length / 2, 1)
      },
    )

    it('draws a centered slider’s active track from 2dp past the center to the handle, on either side of it', () => {
      render(
        <Scheme>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <Named label="Above" minValue={-50} maxValue={50} defaultValue={20} isCentered />
            <Named label="Below" minValue={-50} maxValue={50} defaultValue={-20} isCentered />
            <Named label="Zero" minValue={-50} maxValue={50} defaultValue={0} isCentered />
          </div>
        </Scheme>,
      )
      expectStretches(stretches('Above'), [
        [0, 158],
        [162, place(0.7) - 8],
        [place(0.7) + 8, 320],
      ])
      expectStretches(stretches('Below'), [
        [0, place(0.3) - 8],
        [place(0.3) + 8, 158],
        [162, 320],
      ])
      // At the center, the handle's gaps alone.
      expectStretches(stretches('Zero'), [[0, 152], null, [168, 320]])
    })

    it('draws a range slider’s active track between its two handles', () => {
      render(
        <Scheme>
          <Named label="Price" defaultValue={[30, 70]} />
        </Scheme>,
      )
      expectStretches(stretches('Price'), [
        [0, place(0.3) - 8],
        [place(0.3) + 8, place(0.7) - 8],
        [place(0.7) + 8, 320],
      ])
    })
  })

  describe('stops', () => {
    it('draws a 4dp stop centered 6dp in from the end of the inactive track, and from its start too if centered or a range', () => {
      render(
        <Scheme>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <Named label="Standard" defaultValue={50} />
            <Named label="Range" defaultValue={[30, 70]} />
          </div>
        </Scheme>,
      )
      const [, inactive] = segments('Standard')
      const [end] = stops(inactive!)
      const rect = end!.getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([4, 4])
      expect(center(rect, 'Standard')).toBeCloseTo(314, 1)
      expect(rect.top + 2).toBeCloseTo(bar('Standard').top + 8, 1)
      const [first, , last] = segments('Range')
      expect(stops(first!).map((el) => center(el.getBoundingClientRect(), 'Range'))).toEqual([
        6, 314,
      ])
      expect(stops(last!).map((el) => center(el.getBoundingClientRect(), 'Range'))).toEqual([
        6, 314,
      ])
    })

    it('draws one at every step with stops, where the handle can rest', () => {
      render(
        <Scheme>
          <Named label="Volume" step={25} defaultValue={50} showStops />
        </Scheme>,
      )
      for (const segment of segments('Volume'))
        expect(stops(segment).map((el) => center(el.getBoundingClientRect(), 'Volume'))).toEqual([
          6, 83, 160, 237, 314,
        ])
      expect(center(handle('Volume').getBoundingClientRect(), 'Volume')).toBe(160)
    })

    it('colors the stops on-primary on the active track and on-secondary-container on the inactive one', () => {
      render(
        <Scheme>
          <Named label="Volume" step={25} defaultValue={50} showStops />
        </Scheme>,
      )
      const el = group('Volume')
      const [active, inactive] = segments('Volume')
      expect(getComputedStyle(stops(active!)[0]!).backgroundColor).toBe(color('on-primary', el))
      expect(getComputedStyle(stops(inactive!)[0]!).backgroundColor).toBe(
        color('on-secondary-container', el),
      )
    })

    // The spec's 3:1 is for the end of the inactive track: its stop, or the track itself where that
    // already contrasts, as in the medium and high contrast schemes, whose stop is then white.
    it.each(schemes)(
      'marks the end of the inactive track at least 3:1 against the surface in %s %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Named label="Volume" defaultValue={50} />
          </Scheme>,
        )
        const inactive = segments('Volume')[1]!
        const stop = stops(inactive)[0]!
        const surface = getComputedStyle(schemeOf(stop)).backgroundColor
        expect(
          Math.max(
            contrastRatio(getComputedStyle(stop).backgroundColor, surface),
            contrastRatio(getComputedStyle(inactive).backgroundColor, surface),
          ),
        ).toBeGreaterThanOrEqual(3)
      },
    )
  })

  describe('colors', () => {
    it('draws the active track and the handle primary, the inactive track secondary-container', () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} />
        </Scheme>,
      )
      const el = group('Volume')
      const [active, inactive] = segments('Volume')
      expect(getComputedStyle(active!).backgroundColor).toBe(color('primary', el))
      expect(getComputedStyle(inactive!).backgroundColor).toBe(color('secondary-container', el))
      expect(getComputedStyle(handle('Volume')).backgroundColor).toBe(color('primary', el))
    })

    it('greys a disabled slider out: its active track and handle on-surface at 38%, its inactive track at 12%, the stops at 38%', () => {
      render(
        <Scheme>
          <Named label="Volume" step={25} defaultValue={50} showStops isDisabled />
        </Scheme>,
      )
      const el = group('Volume')
      const [active, inactive] = segments('Volume')
      expect(getComputedStyle(active!).backgroundColor).toBe(at('on-surface', 'content', el))
      expect(getComputedStyle(inactive!).backgroundColor).toBe(at('on-surface', 'container', el))
      expect(getComputedStyle(handle('Volume')).backgroundColor).toBe(
        at('on-surface', 'content', el),
      )
      expect(getComputedStyle(stops(active!)[0]!).backgroundColor).toBe(
        at('inverse-on-surface', 'content', el),
      )
      expect(getComputedStyle(stops(inactive!)[0]!).backgroundColor).toBe(
        at('on-surface', 'content', el),
      )
      expect(getComputedStyle(track('Volume')).cursor).toBe('default')
    })
  })

  describe('pointer', () => {
    it('shows a pointer cursor over the track, which takes a press 48dp tall across it', () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} />
        </Scheme>,
      )
      const el = track('Volume')
      expect(getComputedStyle(el).cursor).toBe('pointer')
      const rect = el.getBoundingClientRect()
      const hits = (y: number) => {
        const hit = document.elementFromPoint(rect.left + 40, y)
        return hit === el || el.contains(hit)
      }
      expect(rect.height).toBe(44)
      expect(hits(rect.top - 1), 'inside, top').toBe(true)
      expect(hits(rect.bottom + 1), 'inside, bottom').toBe(true)
      expect(hits(rect.top - 3), 'outside, top').toBe(false)
      expect(hits(rect.bottom + 3), 'outside, bottom').toBe(false)
    })

    it('moves the handle to a press on the track and follows a drag, narrowing it to 2dp, the track 6dp from it, while held', async () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={20} />
        </Scheme>,
      )
      // The travel is the SliderTrack: 308px, from 6dp in.
      await commands.pointer(trackSelector('Volume'), 154, 22, 'down')
      expect(input('Volume')).toHaveValue('50')
      expect(handle('Volume').getBoundingClientRect().width).toBe(2)
      expectStretches(stretches('Volume'), [
        [0, 153],
        [167, 320],
      ])
      await commands.pointer(trackSelector('Volume'), 231, 22)
      expect(input('Volume')).toHaveValue('75')
      await commands.releasePress()
      expect(handle('Volume').getBoundingClientRect().width).toBe(4)
      expectStretches(stretches('Volume'), [
        [0, place(0.75) - 8],
        [place(0.75) + 8, 320],
      ])
    })

    it('moves the nearer handle of a range', async () => {
      render(
        <Scheme>
          <Named label="Price" defaultValue={[20, 80]} />
        </Scheme>,
      )
      await commands.pointer(trackSelector('Price'), 0.6 * 308, 22, 'down')
      await commands.releasePress()
      const [start, end] = screen.getAllByRole<HTMLInputElement>('slider', { name: 'Price' })
      expect(start).toHaveValue('20')
      expect(end).toHaveValue('60')
    })

    it('takes no press while disabled', async () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={20} isDisabled />
        </Scheme>,
      )
      await commands.pointer(trackSelector('Volume'), 154, 22, 'down')
      await commands.releasePress()
      expect(input('Volume')).toHaveValue('20')
    })
  })

  describe('keyboard focus', () => {
    it('narrows the handle to 2dp and rings it, 3dp of secondary 2dp outside a box 3dp beside it and 4dp past its ends', async () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} />
        </Scheme>,
      )
      await userEvent.tab()
      expect(input('Volume')).toHaveFocus()
      const thumb = thumbs('Volume')[0]!
      const ring = getComputedStyle(thumb)
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
      expect(ring.outlineOffset).toBe('2px')
      expect(ring.outlineColor).toBe(color('secondary', thumb))
      const box = thumb.getBoundingClientRect()
      expect([box.width, box.height]).toEqual([8, 52])
      expect(center(box, 'Volume')).toBe(160)
      expect(handle('Volume').getBoundingClientRect().width).toBe(2)
      expectStretches(stretches('Volume'), [
        [0, 153],
        [167, 320],
      ])
    })

    it('draws no ring and keeps the handle 4dp once a pointer has let go of it', async () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} />
        </Scheme>,
      )
      await commands.pointer(trackSelector('Volume'), 154, 22, 'down')
      await commands.releasePress()
      expect(input('Volume')).toHaveFocus()
      expect(getComputedStyle(thumbs('Volume')[0]!).outlineStyle).toBe('none')
      expect(handle('Volume').getBoundingClientRect().width).toBe(4)
    })

    it('narrows only the focused handle of a range, and the track beside it', async () => {
      render(
        <Scheme>
          <Named label="Price" defaultValue={[30, 70]} />
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.tab()
      expect(handle('Price', 0).getBoundingClientRect().width).toBe(4)
      expect(handle('Price', 1).getBoundingClientRect().width).toBe(2)
      expectStretches(stretches('Price'), [
        [0, place(0.3) - 8],
        [place(0.3) + 8, place(0.7) - 7],
        [place(0.7) + 7, 320],
      ])
    })
  })

  describe('value indicator', () => {
    it('is hidden at rest', () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} showValueIndicator />
        </Scheme>,
      )
      expect(getComputedStyle(indicator('Volume')).scale).toBe('0')
      const rect = indicator('Volume').getBoundingClientRect()
      expect(rect.width * rect.height).toBe(0)
    })

    it('shows the value while the handle is held, 44dp tall and at least 48dp wide, 4dp above it', async () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={20} showValueIndicator />
        </Scheme>,
      )
      await commands.pointer(trackSelector('Volume'), 154, 22, 'down')
      await settle()
      const el = indicator('Volume')
      expect(el).toHaveTextContent('50')
      const rect = el.getBoundingClientRect()
      const knob = handle('Volume').getBoundingClientRect()
      // 48dp unless the text and its 16dp either side are wider.
      const text = document.createRange()
      text.selectNodeContents(el)
      expect(rect.height).toBe(44)
      expect(rect.width).toBeCloseTo(Math.max(48, text.getBoundingClientRect().width + 32), 0)
      expect(knob.top - rect.bottom).toBe(4)
      expect(rect.left + rect.width / 2).toBeCloseTo(knob.left + knob.width / 2, 1)
      await commands.releasePress()
      await settle()
      expect(getComputedStyle(el).scale).toBe('0')
    })

    it('is a full-round inverse-surface container with the value in inverse-on-surface, 14/20 at 0.5 tracking, regular, 16dp either side', async () => {
      render(
        <Scheme>
          <Named
            label="Price"
            maxValue={1000}
            defaultValue={500}
            formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
            showValueIndicator
          />
        </Scheme>,
      )
      await userEvent.tab()
      await settle()
      const el = indicator('Price')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(color('inverse-surface', el))
      expect(style.color).toBe(color('inverse-on-surface', el))
      expect(style.fontSize).toBe('14px')
      expect(style.lineHeight).toBe('20px')
      expect(style.letterSpacing).toBe('0.5px')
      expect(style.fontWeight).toBe('400')
      expect(style.paddingLeft).toBe('16px')
      expect(style.paddingRight).toBe('16px')
      const rect = el.getBoundingClientRect()
      // "$500" is wider than 16dp, so the container grows past 48dp with it, and stays round.
      expect(rect.width).toBeGreaterThan(48)
      expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(22)
    })

    it('shows on the keyboard-focused handle of a range only', async () => {
      render(
        <Scheme>
          <Named label="Price" defaultValue={[30, 70]} showValueIndicator />
        </Scheme>,
      )
      await userEvent.tab()
      await settle()
      expect(getComputedStyle(indicator('Price', 0)).scale).toBe('1')
      expect(getComputedStyle(indicator('Price', 1)).scale).toBe('0')
      await userEvent.tab()
      await settle()
      expect(getComputedStyle(indicator('Price', 0)).scale).toBe('0')
      expect(getComputedStyle(indicator('Price', 1)).scale).toBe('1')
    })

    it('grows out of the handle’s end on the default spatial spring, and shrinks back on emphasized accelerate over 150ms', async () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} showValueIndicator />
        </Scheme>,
      )
      const el = indicator('Volume')
      const hidden = getComputedStyle(el)
      expect(hidden.transitionProperty).toBe('scale')
      expect(hidden.transitionDuration).toBe('0.15s')
      expect(hidden.transitionTimingFunction).toBe('cubic-bezier(0.3, 0, 0.8, 0.15)')
      await userEvent.tab()
      const shown = getComputedStyle(el)
      expect(shown.transitionDuration).toBe(springDuration('default-spatial'))
      expect(shown.transitionTimingFunction).toBe(springEasing('default-spatial'))
      await settle()
      // Its pivot is the handle's end, 4dp below its bottom edge.
      const rect = el.getBoundingClientRect()
      const [x, y] = getComputedStyle(el).transformOrigin.split(' ').map(parseFloat)
      expect(x).toBeCloseTo(rect.width / 2, 2)
      expect(y).toBeCloseTo(rect.height + 4, 2)
    })

    it('changes the handle’s width at once, as Compose does', () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} />
        </Scheme>,
      )
      expect(getComputedStyle(handle('Volume')).transitionDuration).toBe('0s')
    })
  })

  describe('inset icon', () => {
    /** Which copy of the icon shows at a point, by hit-testing: the active track's, the inactive's or neither. */
    function iconAt(name: string, x: number) {
      const el = track(name)
      const copies = segments(name).map((part) =>
        part.querySelector<HTMLElement>(':scope > span:has(> span)'),
      )
      el.style.pointerEvents = 'none'
      for (const copy of copies) if (copy) copy.style.pointerEvents = 'auto'
      try {
        const box = bar(name)
        const hit = document.elementFromPoint(box.left + x, box.top + box.height / 2)
        return copies.findIndex((copy) => copy?.contains(hit) ?? false)
      } finally {
        el.style.pointerEvents = ''
        for (const copy of copies) if (copy) copy.style.pointerEvents = ''
      }
    }
    const icon = (name: string, index: number) =>
      segments(name)[index]!.querySelector<HTMLElement>(':scope > span > span')!

    it('sits 6dp in from the active track’s start, 24dp across, on-primary', () => {
      render(
        <Scheme>
          <Named label="Volume" size="m" defaultValue={40} icon={<Icon name="volume_up" />} />
        </Scheme>,
      )
      const rect = icon('Volume', 0).getBoundingClientRect()
      expect(span(rect, 'Volume')).toEqual([6, 30])
      expect(rect.height).toBe(24)
      expect(rect.top + 12).toBeCloseTo(bar('Volume').top + 20, 1)
      expect(iconAt('Volume', 18)).toBe(0)
      expect(getComputedStyle(icon('Volume', 0)).color).toBe(color('on-primary', group('Volume')))
    })

    it('moves to the inactive track, 6dp past the handle’s gap, on-secondary-container, once the active track cannot hold it and its padding', () => {
      render(
        <Scheme>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            <Named
              label="Fits"
              size="m"
              minValue={0}
              maxValue={308}
              defaultValue={38}
              icon={<Icon name="volume_up" />}
            />
            <Named
              label="Low"
              size="m"
              minValue={0}
              maxValue={308}
              defaultValue={37}
              icon={<Icon name="volume_up" />}
            />
          </div>
        </Scheme>,
      )
      // At 38 the active track runs 38 + 6 - 8 = 36dp: the icon and its padding exactly.
      expect(iconAt('Fits', 18)).toBe(0)
      // At 37 it is 35dp, so the icon is on the inactive track, 6dp past the gap after the handle.
      expect(iconAt('Low', 18)).toBe(-1)
      const after = 37 + 6 + 8
      expect(iconAt('Low', after + 6 + 12)).toBe(1)
      const rect = icon('Low', 1).getBoundingClientRect()
      expect(span(rect, 'Low')).toEqual([after + 6, after + 30])
      expect(getComputedStyle(icon('Low', 1)).color).toBe(
        color('on-secondary-container', group('Low')),
      )
    })

    it('is 32dp, 8dp in, on an XL slider', () => {
      render(
        <Scheme>
          <Named label="Volume" size="xl" defaultValue={50} icon={<Icon name="volume_up" />} />
        </Scheme>,
      )
      const rect = icon('Volume', 0).getBoundingClientRect()
      expect(span(rect, 'Volume')).toEqual([8, 40])
      expect(rect.height).toBe(32)
    })
  })

  describe('vertical', () => {
    it('runs from the bottom: a 44x4dp handle 6dp up at 0, the stretches 6dp from it, the value indicator 4dp to its inline start', async () => {
      render(
        <Scheme>
          <Named label="Volume" orientation="vertical" defaultValue={25} showValueIndicator />
        </Scheme>,
      )
      expect(bar('Volume').height).toBe(320)
      expect(bar('Volume').width).toBe(16)
      const rect = handle('Volume').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([44, 4])
      expect(center(rect, 'Volume', 'bottom')).toBeCloseTo(place(0.25), 1)
      expectStretches(stretches('Volume', 'bottom'), [
        [0, place(0.25) - 8],
        [place(0.25) + 8, 320],
      ])
      await userEvent.tab()
      await settle()
      const bubble = indicator('Volume').getBoundingClientRect()
      const knob = handle('Volume').getBoundingClientRect()
      expect(knob.left - bubble.right).toBe(4)
      expect(bubble.top + bubble.height / 2).toBeCloseTo(knob.top + knob.height / 2, 1)
      expect(handle('Volume').getBoundingClientRect().height).toBe(2)
    })

    it('puts an inset icon at the bottom of the active track', () => {
      render(
        <Scheme>
          <Named
            label="Volume"
            orientation="vertical"
            size="m"
            defaultValue={40}
            icon={<Icon name="light_mode" />}
          />
        </Scheme>,
      )
      const rect = segments('Volume')[0]!
        .querySelector(':scope > span > span')!
        .getBoundingClientRect()
      expect(span(rect, 'Volume', 'bottom')).toEqual([6, 30])
    })
  })

  describe('right to left', () => {
    it('runs from the right in a right-to-left locale', () => {
      render(
        <I18nProvider locale="ar-EG">
          <Scheme>
            <div dir="rtl">
              <Named label="Volume" defaultValue={25} />
            </div>
          </Scheme>
        </I18nProvider>,
      )
      expect(center(handle('Volume').getBoundingClientRect(), 'Volume', 'right')).toBeCloseTo(
        place(0.25),
        1,
      )
      expectStretches(stretches('Volume', 'right'), [
        [0, place(0.25) - 8],
        [place(0.25) + 8, 320],
      ])
      const [active] = segments('Volume')
      // Its outer corners on the right now.
      expect(getComputedStyle(active!).clipPath).toMatch(/round 2px 8px 8px 2px\)$/)
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('draws the active track in Highlight, the inactive track and the handle in CanvasText, the stops in HighlightText and Canvas', () => {
      render(
        <Scheme>
          <Named label="Volume" step={25} defaultValue={50} showStops />
        </Scheme>,
      )
      const el = group('Volume')
      const [active, inactive] = segments('Volume')
      expect(getComputedStyle(active!).backgroundColor).toBe(computedColor('Highlight', el))
      expect(getComputedStyle(inactive!).backgroundColor).toBe(computedColor('CanvasText', el))
      expect(getComputedStyle(handle('Volume')).backgroundColor).toBe(
        computedColor('CanvasText', el),
      )
      expect(getComputedStyle(stops(active!)[0]!).backgroundColor).toBe(
        computedColor('HighlightText', el),
      )
      expect(getComputedStyle(stops(inactive!)[0]!).backgroundColor).toBe(
        computedColor('Canvas', el),
      )
    })

    it('greys a disabled slider out in GrayText', () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} isDisabled />
        </Scheme>,
      )
      const el = group('Volume')
      for (const part of [...segments('Volume'), handle('Volume')])
        expect(getComputedStyle(part).backgroundColor).toBe(computedColor('GrayText', el))
    })

    it('draws the value indicator in CanvasText with Canvas text', async () => {
      render(
        <Scheme>
          <Named label="Volume" defaultValue={50} showValueIndicator />
        </Scheme>,
      )
      await userEvent.tab()
      const el = indicator('Volume')
      expect(getComputedStyle(el).backgroundColor).toBe(computedColor('CanvasText', el))
      expect(getComputedStyle(el).color).toBe(computedColor('Canvas', el))
    })
  })
})
