import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { Except } from '../../lib/aria'
import {
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  rgba,
  Scheme,
  schemeOf,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
  whilePressed,
} from '../../test-browser'
import { Switch, type SwitchProps } from './switch'

/* What needs a real browser and stylesheet: the 52x32dp track, the handle's size and
 * place per state, the colors, the 40dp state layer, focus ring, 52x48dp target, keys,
 * contrast, motion and forced colors. Markup and events: switch.test.tsx. */

/** The hidden `<input>` in the switch role, which has the name, the state and the focus. */
const input = (name: string) => screen.getByRole<HTMLInputElement>('switch', { name })
/** The `<label>` around it, React Aria's SwitchButton: what the pointer is on, and what reports the states. */
const pressed = (name: string) => input(name).closest('label')!
/** The 52x32dp switch itself, the label's child after the hidden input's span: it holds the track first and the halo last. */
const host = (name: string) => input(name).parentElement!.nextElementSibling as HTMLElement
const track = (name: string) => host(name).firstElementChild as HTMLElement
/** The 40dp halo holds the state layer, the ripple and, last, the handle. */
const halo = (name: string) => host(name).lastElementChild as HTMLElement
const handle = (name: string) => halo(name).lastElementChild as HTMLElement
const stateLayer = (name: string) => halo(name).querySelector<HTMLElement>('.state-layer')!
const icons = (name: string) => [...handle(name).querySelectorAll<SVGElement>('svg')]
const checked = (name: string) => input(name).checked

/** An element's box in dp from its switch's top left corner: [left, top, width, height]. */
const box = (el: Element, name: string) => {
  const origin = host(name).getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  return [rect.left - origin.left, rect.top - origin.top, rect.width, rect.height]
}

/** The hit area, the switch's ::after, as such a box: its computed size, placed at the center and translated back by half of it. */
const hitArea = (name: string) => {
  const style = getComputedStyle(host(name), '::after')
  const [left, top, width, height] = [style.left, style.top, style.width, style.height].map(
    parseFloat,
  ) as [number, number, number, number]
  return [left - width / 2, top - height / 2, width, height]
}

/**
 * Checks by hit-testing that the hit area is the 52x48dp box centered on the track:
 * just inside it a click lands on the switch, and just outside it does not.
 */
function expectHitAreaOnTrack(name: string) {
  const el = host(name)
  const hits = (x: number, y: number) => {
    const hit = document.elementFromPoint(x, y)
    return hit === el || el.contains(hit)
  }
  const rect = track(name).getBoundingClientRect()
  const [left, right, top, bottom] = [rect.left, rect.right, rect.top - 8, rect.bottom + 8]
  const [midX, midY] = [(left + right) / 2, (top + bottom) / 2]
  expect(hits(left + 1, midY), 'inside, left').toBe(true)
  expect(hits(right - 1, midY), 'inside, right').toBe(true)
  expect(hits(midX, top + 1), 'inside, top').toBe(true)
  expect(hits(midX, bottom - 1), 'inside, bottom').toBe(true)
  expect(hits(left - 2, midY), 'outside, left').toBe(false)
  expect(hits(right + 2, midY), 'outside, right').toBe(false)
  expect(hits(midX, top - 2), 'outside, top').toBe(false)
  expect(hits(midX, bottom + 2), 'outside, bottom').toBe(false)
}

const center = (el: Element) => {
  const rect = el.getBoundingClientRect()
  return [rect.left + rect.width / 2, rect.top + rect.height / 2]
}

const color = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)

/** A switch named by its state so a failure says which one. */
function Named({ label, ...props }: Except<SwitchProps, 'aria-label'> & { label: string }) {
  return <Switch aria-label={label} {...props} />
}

/** Reads a computed style, which starts the transitions of a change just made. */
const flush = (el: Element, pseudo?: string) => getComputedStyle(el, pseudo).insetInlineStart

/** Toggles the switch and holds every transition in it at `ms`, so a frame of them can be read. */
function toggleAndHoldAt(name: string, ms: number) {
  input(name).click()
  for (const part of [halo(name), handle(name)]) flush(part)
  const animations = host(name).getAnimations({ subtree: true })
  animations.forEach((animation) => {
    animation.pause()
    animation.currentTime = ms
  })
  return animations
}

/** The properties an element's running transitions animate, sorted; Chromium names a logical inset by its physical side. */
const animated = (el: Element) =>
  el
    .getAnimations()
    .map((animation) => (animation as CSSTransition).transitionProperty)
    .sort()

describe('Switch in a browser', () => {
  describe('sizing', () => {
    it('draws a 52x32dp round track with a 2dp outline', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      expect(box(host('Wi-Fi'), 'Wi-Fi')).toEqual([0, 0, 52, 32])
      expect(box(track('Wi-Fi'), 'Wi-Fi')).toEqual([0, 0, 52, 32])
      const style = getComputedStyle(track('Wi-Fi'))
      expect(style.borderTopWidth).toBe('2px')
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderRadius).toBe(computedRadius('rounded-full'))
      expect(getComputedStyle(host('Wi-Fi')).borderRadius).toBe(computedRadius('rounded-full'))
    })

    it('is the whole of its label when given no text, which is the whole of its field', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      const field = pressed('Wi-Fi').parentElement!
      expect(box(pressed('Wi-Fi'), 'Wi-Fi')).toEqual([0, 0, 52, 32])
      expect(box(field, 'Wi-Fi')).toEqual([0, 0, 52, 32])
    })

    it('draws a 16dp round handle at the start when unselected, and a 24dp one at the end when selected', () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      expect(box(handle('Off'), 'Off')).toEqual([8, 8, 16, 16])
      expect(box(handle('On'), 'On')).toEqual([24, 4, 24, 24])
      expect(getComputedStyle(handle('Off')).borderRadius).toBe(computedRadius('rounded-full'))
    })

    it('draws a 24dp handle in both states when both hold an icon, each 16dp at its center', () => {
      render(
        <Scheme>
          <Named label="Off" icons="both" />
          <Named label="On" icons="both" defaultSelected />
          <Named label="Selected only" icons="selected" />
        </Scheme>,
      )
      expect(box(handle('Off'), 'Off')).toEqual([4, 4, 24, 24])
      expect(box(handle('On'), 'On')).toEqual([24, 4, 24, 24])
      expect(box(handle('Selected only'), 'Selected only')).toEqual([8, 8, 16, 16])
      for (const name of ['Off', 'On']) {
        for (const icon of icons(name)) {
          const rect = icon.getBoundingClientRect()
          expect([rect.width, rect.height]).toEqual([16, 16])
          expect(center(icon)).toEqual(center(handle(name)))
        }
      }
    })

    it('shows the icon of the state the switch is in, and no other', () => {
      render(
        <Scheme>
          <Named label="Off" icons="both" />
          <Named label="On" icons="both" defaultSelected />
          <Named label="Selected only" icons="selected" />
        </Scheme>,
      )
      const shown = (name: string) => icons(name).map((icon) => getComputedStyle(icon).opacity)
      // The selected state's icon comes first.
      expect(shown('Off')).toEqual(['0', '1'])
      expect(shown('On')).toEqual(['1', '0'])
      expect(shown('Selected only')).toEqual(['0'])
    })

    it('grows the handle to 28dp around its center while pressed, selected or not', async () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      const held = (name: string) =>
        whilePressed(
          name,
          async () => {
            await settle()
            return box(handle(name), name)
          },
          'switch',
        )
      expect(await held('Off')).toEqual([2, 2, 28, 28])
      // Releasing toggles it, so press the other one from its own rest.
      expect(await held('On')).toEqual([22, 2, 28, 28])
    })

    it('centers the 40dp round state layer on the handle, in both states', () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      expect(box(halo('Off'), 'Off')).toEqual([-4, -4, 40, 40])
      expect(box(halo('On'), 'On')).toEqual([16, -4, 40, 40])
      for (const name of ['Off', 'On']) {
        expect(center(halo(name))).toEqual(center(handle(name)))
        expect(getComputedStyle(halo(name)).borderRadius).toBe(computedRadius('rounded-full'))
        expect(box(stateLayer(name), name)).toEqual(box(halo(name), name))
      }
    })

    it('has a 52x48dp hit area centered on the track, in both states', () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      for (const name of ['Off', 'On']) {
        expect(hitArea(name)).toEqual([0, -8, 52, 48])
        expectHitAreaOnTrack(name)
      }
    })

    it('mirrors in a right-to-left layout: unselected at the right, selected at the left', () => {
      render(
        <Scheme>
          <div dir="rtl" style={{ display: 'flex', gap: 96 }}>
            <Named label="Off" />
            <Named label="On" defaultSelected />
          </div>
        </Scheme>,
      )
      expect(box(handle('Off'), 'Off')).toEqual([28, 8, 16, 16])
      expect(box(handle('On'), 'On')).toEqual([4, 4, 24, 24])
      for (const name of ['Off', 'On']) {
        expect(center(halo(name))).toEqual(center(handle(name)))
        expect(hitArea(name)).toEqual([0, -8, 52, 48])
        expectHitAreaOnTrack(name)
      }
    })
  })

  describe('colors', () => {
    it('fills an unselected track with surface-container-highest inside an outline, its handle in outline', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" icons="both" />
        </Scheme>,
      )
      const el = track('Wi-Fi')
      expect(getComputedStyle(el).backgroundColor).toBe(color('surface-container-highest', el))
      expect(getComputedStyle(el).borderTopColor).toBe(color('outline', el))
      expect(getComputedStyle(handle('Wi-Fi')).backgroundColor).toBe(color('outline', el))
      expect(getComputedStyle(icons('Wi-Fi')[1]!).fill).toBe(color('surface-container-highest', el))
    })

    it('fills a selected track with primary, outline included, its handle in on-primary', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" icons="both" defaultSelected />
        </Scheme>,
      )
      const el = track('Wi-Fi')
      expect(getComputedStyle(el).backgroundColor).toBe(color('primary', el))
      expect(getComputedStyle(el).borderTopColor).toBe(color('primary', el))
      expect(getComputedStyle(handle('Wi-Fi')).backgroundColor).toBe(color('on-primary', el))
      expect(getComputedStyle(icons('Wi-Fi')[0]!).fill).toBe(color('primary', el))
    })

    it.each([
      ['an unselected', {}, 'on-surface-variant', 'surface-container-highest', 'outline'],
      ['a selected', { defaultSelected: true }, 'primary-container', 'primary', 'primary'],
    ] as const)(
      'darkens the handle of %s switch while hovered, focused or pressed, and leaves its track',
      async (_, state, role, fill, outline) => {
        render(
          <Scheme>
            <Named label="Wi-Fi" {...state} />
          </Scheme>,
        )
        const el = handle('Wi-Fi')
        const expected = color(role, el)
        const sameTrack = () => {
          expect(getComputedStyle(track('Wi-Fi')).backgroundColor).toBe(color(fill, el))
          expect(getComputedStyle(track('Wi-Fi')).borderTopColor).toBe(color(outline, el))
        }

        await userEvent.hover(pressed('Wi-Fi'))
        await settle()
        expect(getComputedStyle(el).backgroundColor).toBe(expected)
        sameTrack()
        await userEvent.unhover(pressed('Wi-Fi'))

        await userEvent.tab()
        await settle()
        expect(document.activeElement).toBe(input('Wi-Fi'))
        expect(getComputedStyle(el).backgroundColor).toBe(expected)
        sameTrack()
        input('Wi-Fi').blur()

        const held = await whilePressed(
          'Wi-Fi',
          async () => {
            await settle()
            sameTrack()
            return getComputedStyle(el).backgroundColor
          },
          'switch',
        )
        expect(held).toBe(expected)
      },
    )

    it('greys out a disabled track to 12%, and its handle to on-surface at 38% or to surface', () => {
      render(
        <Scheme>
          <Named label="Off" icons="both" isDisabled />
          <Named label="On" icons="both" isDisabled defaultSelected />
        </Scheme>,
      )
      const el = track('Off')
      // The same mix Tailwind writes for a color at /disabled-content, the 38% token.
      const at38 = (role: string) =>
        computedColor(
          `color-mix(in oklab, var(--md-sys-color-${role}) calc(var(--md-sys-state-disabled-content-opacity) * 100%), transparent)`,
          el,
        )
      for (const name of ['Off', 'On']) {
        expect(getComputedStyle(track(name)).opacity).toBe('0.12')
        expect(getComputedStyle(track(name)).borderTopColor).toBe(color('on-surface', el))
      }
      expect(getComputedStyle(track('Off')).backgroundColor).toBe(
        color('surface-container-highest', el),
      )
      expect(getComputedStyle(track('On')).backgroundColor).toBe(color('on-surface', el))

      expect(getComputedStyle(handle('Off')).backgroundColor).toBe(at38('on-surface'))
      expect(rgba(getComputedStyle(handle('Off')).backgroundColor)[3] / 255).toBeCloseTo(0.38, 1)
      expect(getComputedStyle(handle('On')).backgroundColor).toBe(color('surface', el))
      expect(getComputedStyle(handle('On')).opacity).toBe('1')

      expect(getComputedStyle(icons('Off')[1]!).fill).toBe(at38('surface-container-highest'))
      expect(getComputedStyle(icons('On')[0]!).fill).toBe(at38('on-surface'))
    })

    it('keeps a disabled switch as it is while hovered or pressed, selected or not', async () => {
      render(
        <Scheme>
          <Named label="Off" isDisabled />
          <Named label="On" isDisabled defaultSelected />
        </Scheme>,
      )
      for (const [name, rest] of [
        ['Off', [8, 8, 16, 16]],
        ['On', [24, 4, 24, 24]],
      ] as const) {
        const before = getComputedStyle(handle(name)).backgroundColor
        // The pointer's own :hover matches a disabled label too: disabled outweighs it.
        await userEvent.hover(pressed(name))
        await settle()
        expect(pressed(name).matches(':hover')).toBe(true)
        expect(getComputedStyle(handle(name)).backgroundColor, name).toBe(before)
        const held = await whilePressed(
          name,
          async () => {
            await settle()
            return [box(handle(name), name), getComputedStyle(handle(name)).backgroundColor]
          },
          'switch',
        )
        expect(held, name).toEqual([rest, before])
        expect(checked(name)).toBe(name === 'On')
        await userEvent.unhover(pressed(name))
      }
    })
  })

  describe('state layer', () => {
    it.each([
      ['unselected', {}, 'on-surface'],
      ['selected', { defaultSelected: true }, 'primary'],
    ] as const)(
      'tints the hover, focus and press layers of a %s switch with one role, at 8% hovered',
      async (_, state, role) => {
        render(
          <Scheme>
            <Named label="Wi-Fi" {...state} />
          </Scheme>,
        )
        const layer = stateLayer('Wi-Fi')
        expect(getComputedStyle(layer).opacity).toBe('0')
        // Anywhere on the switch, not only on the handle.
        await userEvent.hover(host('Wi-Fi'))
        await settle()
        expect(getComputedStyle(layer).opacity).toBe('0.08')
        expect(getComputedStyle(layer).backgroundColor).toBe(color(role, layer))

        const ripple = await whilePressed(
          'Wi-Fi',
          async () => {
            await settle()
            const circle = halo('Wi-Fi').querySelector<HTMLElement>('.opacity-state-pressed')!
            return [getComputedStyle(circle).backgroundColor, getComputedStyle(circle).opacity]
          },
          'switch',
        )
        expect(ripple).toEqual([color(role, layer), '0.1'])
      },
    )

    it('moves to the other end with the handle, and takes the other role, once toggled', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      await userEvent.click(pressed('Wi-Fi'))
      await settle()
      expect(checked('Wi-Fi')).toBe(true)
      expect(box(halo('Wi-Fi'), 'Wi-Fi')).toEqual([16, -4, 40, 40])
      expect(center(halo('Wi-Fi'))).toEqual(center(handle('Wi-Fi')))
      const layer = stateLayer('Wi-Fi')
      expect(getComputedStyle(layer).backgroundColor).toBe(color('primary', layer))
    })

    it('is hidden, with no ripple, when disabled', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" isDisabled />
        </Scheme>,
      )
      await userEvent.hover(pressed('Wi-Fi'))
      await settle()
      expect(getComputedStyle(stateLayer('Wi-Fi')).opacity).toBe('0')
      const circles = await whilePressed(
        'Wi-Fi',
        () => halo('Wi-Fi').querySelectorAll('.opacity-state-pressed').length,
        'switch',
      )
      expect(circles).toBe(0)
    })
  })

  describe('focus ring', () => {
    it('is a 3px secondary outline 2px outside the track, on keyboard focus only', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      const el = host('Wi-Fi')
      expect(getComputedStyle(el).outlineStyle).toBe('none')

      await userEvent.tab()
      expect(document.activeElement).toBe(input('Wi-Fi'))
      const focused = getComputedStyle(el)
      expect(focused.outlineStyle).toBe('solid')
      expect(focused.outlineWidth).toBe('3px')
      expect(focused.outlineOffset).toBe('2px')
      expect(focused.outlineColor).toBe(color('secondary', el))
      // Around the track only: the label around it and the halo inside, which draws the state layer, have none.
      expect(getComputedStyle(pressed('Wi-Fi')).outlineStyle).toBe('none')
      expect(getComputedStyle(halo('Wi-Fi')).outlineStyle).toBe('none')
      await settle()
      expect(getComputedStyle(stateLayer('Wi-Fi')).opacity).toBe('0.1')
    })

    it('is not drawn when the switch is only clicked, which focuses it too', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      await userEvent.click(pressed('Wi-Fi'))
      expect(document.activeElement).toBe(input('Wi-Fi'))
      expect(pressed('Wi-Fi')).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(host('Wi-Fi')).outlineStyle).toBe('none')
      await settle()
      expect(getComputedStyle(stateLayer('Wi-Fi')).opacity).toBe('0.08')
    })
  })

  describe('keyboard', () => {
    it('is reached with Tab, in order, and toggled by Space and by Enter', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
          <Named label="Bluetooth" defaultSelected />
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(input('Wi-Fi'))
      await userEvent.keyboard(' ')
      expect(checked('Wi-Fi')).toBe(true)
      await userEvent.keyboard('{Enter}')
      expect(checked('Wi-Fi')).toBe(false)
      expect(document.activeElement).toBe(input('Wi-Fi'))

      await userEvent.tab()
      expect(document.activeElement).toBe(input('Bluetooth'))
      await userEvent.keyboard('{Enter}')
      expect(checked('Bluetooth')).toBe(false)
      await userEvent.keyboard(' ')
      expect(checked('Bluetooth')).toBe(true)
      await settle()
      expect(box(handle('Bluetooth'), 'Bluetooth')).toEqual([24, 4, 24, 24])
    })

    it('does not submit its form on Enter', async () => {
      let submitted = 0
      render(
        <Scheme>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submitted += 1
            }}
          >
            <Named label="Wi-Fi" />
            <button>Save</button>
          </form>
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{Enter}')
      expect(checked('Wi-Fi')).toBe(true)
      expect(submitted).toBe(0)
    })

    it('keeps the handle at rest through a keyboard toggle: no press, so no growth', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.keyboard(' ')
      await settle()
      expect(pressed('Wi-Fi')).not.toHaveAttribute('data-pressed')
      expect(box(handle('Wi-Fi'), 'Wi-Fi')).toEqual([24, 4, 24, 24])
    })
  })

  describe('contrast', () => {
    /* WCAG 1.4.11: the track's edge against the surface, the handle against the
     * track and an icon against its handle are graphical objects, 3:1 or more each. */
    it.each(schemes)(
      'keeps the track, handle and icons at 3:1 or more, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Named label="Off" icons="both" />
            <Named label="On" icons="both" defaultSelected />
          </Scheme>,
        )
        const surface = getComputedStyle(schemeOf(track('Off'))).backgroundColor
        const below: string[] = []
        const check = (what: string, a: string, b: string) => {
          if (contrastRatio(a, b) < 3) below.push(`${what} ${contrastRatio(a, b).toFixed(2)}`)
        }
        for (const name of ['Off', 'On']) {
          const edge = getComputedStyle(track(name)).borderTopColor
          const fill = getComputedStyle(track(name)).backgroundColor
          const knob = getComputedStyle(handle(name)).backgroundColor
          const icon = icons(name)[name === 'On' ? 0 : 1]!
          check(`${name} track edge`, edge, surface)
          check(`${name} handle`, knob, fill)
          check(`${name} icon`, getComputedStyle(icon).fill, knob)
        }
        expect(below).toEqual([])
      },
    )
  })

  describe('motion', () => {
    const short1 = () => computedStyleOf('duration-short-1', (style) => style.transitionDuration)

    /** Where the fast spatial spring is `ms` after its release, from its own damping and stiffness. */
    const fastSpatialSpring = (ms: number) => {
      const root = getComputedStyle(document.documentElement)
      const token = (name: string) =>
        Number(root.getPropertyValue(`--md-sys-motion-spring-fast-spatial-${name}`))
      const [damping, pace] = [token('damping'), Math.sqrt(token('stiffness'))]
      const swing = pace * Math.sqrt(1 - damping ** 2)
      const decay = damping * pace
      const t = ms / 1000
      return (
        1 - Math.exp(-decay * t) * (Math.cos(swing * t) + (decay / swing) * Math.sin(swing * t))
      )
    }

    it('resizes the handle on the fast spatial spring that slides it, in both states', () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      const spring = springDuration('fast-spatial')
      for (const name of ['Off', 'On']) {
        const size = getComputedStyle(handle(name))
        expect(size.transitionProperty).toBe('width, height, background-color')
        // The color has no duration: it changes at once.
        expect(size.transitionDuration).toBe(`${spring}, ${spring}, 0s`)
        expect(size.transitionTimingFunction).toBe(springEasing('fast-spatial'))
        expect(size.transitionDelay).toBe('0s')
        // The halo slides; the track stays put and transitions nothing.
        const slide = getComputedStyle(halo(name))
        expect(slide.transitionProperty).toBe('inset-inline-start')
        expect(slide.transitionDuration).toBe(spring)
        expect(slide.transitionTimingFunction).toBe(springEasing('fast-spatial'))
        expect(getComputedStyle(track(name)).transitionDuration).toBe('0s')
      }
    })

    it.each([
      ['selected', {}, 16, 24],
      ['unselected', { defaultSelected: true }, 24, 16],
    ] as const)(
      'keeps the handle round and its size in step with its slide on its way to %s, overshooting together',
      (_, state, from, to) => {
        render(
          <Scheme>
            <Named label="Wi-Fi" {...state} />
          </Scheme>,
        )
        const [fromLeft, toLeft] = to === 24 ? [-4, 16] : [16, -4]
        const animations = toggleAndHoldAt('Wi-Fi', 0)
        const times = [0, 17, 33, 50, 67, 83, 100, 117, 133, 167, 200, 250, 278, 320]
        const progress = times.map((ms) => {
          animations.forEach((animation) => (animation.currentTime = ms))
          const [, , width, height] = box(handle('Wi-Fi'), 'Wi-Fi') as number[]
          const slid = (box(halo('Wi-Fi'), 'Wi-Fi')[0]! - fromLeft) / (toLeft - fromLeft)
          const resized = (width! - from) / (to - from)
          expect(Math.abs(resized - slid)).toBeLessThan(0.01)
          expect(height).toBeCloseTo(width!, 2)
          // Around its center, which is the halo's as it slides.
          const [x, y] = center(handle('Wi-Fi')) as [number, number]
          const [haloX, haloY] = center(halo('Wi-Fi')) as [number, number]
          expect(x).toBeCloseTo(haloX, 1)
          expect(y).toBeCloseTo(haloY, 1)
          return slid
        })
        const at = (ms: number) => progress[times.indexOf(ms)]!
        // The fast spatial spring all the way: there at 100ms, 9% past it at 133ms.
        for (const ms of times) {
          expect(Math.abs(at(ms) - fastSpatialSpring(ms))).toBeLessThan(0.005)
        }
        expect(at(100)).toBeCloseTo(1, 1)
        expect(at(133)).toBeGreaterThan(1.08)
        expect(at(133)).toBeLessThan(1.1)
        // Its swing back past its rest is under 1%, a fifth of a dp of the slide.
        expect(at(278)).toBeGreaterThan(0.99)
        expect(at(278)).toBeLessThan(1)
        animations.forEach((animation) => animation.finish())
        expect(box(handle('Wi-Fi'), 'Wi-Fi')).toEqual(to === 16 ? [8, 8, 16, 16] : [24, 4, 24, 24])
      },
    )

    it('keeps to the fast spatial spring of the standard scheme, which has no overshoot', () => {
      const standard = (
        style: 'transitionDuration' | 'transitionTimingFunction',
        token: string,
      ) => {
        const probe = document.createElement('div')
        probe.dataset.motion = 'standard'
        probe.style[style] = `var(--md-sys-motion-spring-fast-spatial-${token})`
        document.body.append(probe)
        const value = getComputedStyle(probe)[style]
        probe.remove()
        return value
      }
      render(
        <Scheme>
          <div data-motion="standard">
            <Named label="Wi-Fi" />
          </div>
        </Scheme>,
      )
      for (const part of [handle('Wi-Fi'), halo('Wi-Fi')]) {
        const style = getComputedStyle(part)
        expect(style.transitionDuration.split(', ')[0]).toBe(
          standard('transitionDuration', 'duration'),
        )
        expect(style.transitionTimingFunction).toBe(standard('transitionTimingFunction', 'easing'))
      }
      const animations = toggleAndHoldAt('Wi-Fi', 0)
      const lefts = [50, 100, 150, 200].map((ms) => {
        animations.forEach((animation) => (animation.currentTime = ms))
        return box(halo('Wi-Fi'), 'Wi-Fi')[0]!
      })
      expect(Math.max(...lefts)).toBeLessThan(16.1)
      expect(Math.min(...lefts)).toBeGreaterThan(-4)
    })

    it('keeps a handle that holds an icon in both states at 24dp all the way', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" icons="both" />
        </Scheme>,
      )
      const animations = toggleAndHoldAt('Wi-Fi', 0)
      for (const ms of [0, 50, 100, 133, 250]) {
        animations.forEach((animation) => (animation.currentTime = ms))
        const [, , width, height] = box(handle('Wi-Fi'), 'Wi-Fi')
        expect([width, height]).toEqual([24, 24])
      }
      animations.forEach((animation) => animation.finish())
      expect(box(handle('Wi-Fi'), 'Wi-Fi')).toEqual([24, 4, 24, 24])
    })

    it('changes the colors of the track and the handle at once, before the handle has moved', () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      const colors = (name: string) => [
        getComputedStyle(track(name)).backgroundColor,
        getComputedStyle(track(name)).borderTopColor,
        getComputedStyle(handle(name)).backgroundColor,
      ]
      const [off, on] = [colors('Off'), colors('On')]

      toggleAndHoldAt('Off', 0)
      expect(colors('Off')).toEqual(on)
      expect(box(handle('Off'), 'Off')).toEqual([8, 8, 16, 16])
      // The track stays put; no color of it is on its way.
      expect(animated(track('Off'))).toEqual([])
      expect(animated(handle('Off'))).toEqual(['height', 'width'])

      toggleAndHoldAt('On', 0)
      expect(colors('On')).toEqual(off)
      expect(box(handle('On'), 'On')).toEqual([24, 4, 24, 24])
      expect(animated(track('On'))).toEqual([])
      expect(animated(handle('On'))).toEqual(['height', 'width'])
    })

    it('slides the state layer with the handle and keeps the track and the hit area still', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      const animations = toggleAndHoldAt('Wi-Fi', 0)
      const lefts: number[] = []
      for (const ms of [0, 17, 50, 100, 133, 200, 300]) {
        animations.forEach((animation) => (animation.currentTime = ms))
        expect(hitArea('Wi-Fi')).toEqual([0, -8, 52, 48])
        expect(box(track('Wi-Fi'), 'Wi-Fi')).toEqual([0, 0, 52, 32])
        lefts.push(box(halo('Wi-Fi'), 'Wi-Fi')[0]!)
      }
      // The spring carries the halo from -4 past 16 and back onto it.
      expect(lefts[0]).toBe(-4)
      expect(Math.max(...lefts)).toBeGreaterThan(16)
      animations.forEach((animation) => animation.finish())
      expect(box(halo('Wi-Fi'), 'Wi-Fi')[0]).toBe(16)
      expect(hitArea('Wi-Fi')).toEqual([0, -8, 52, 48])
      expect(box(track('Wi-Fi'), 'Wi-Fi')).toEqual([0, 0, 52, 32])
    })

    it('grows the handle only once a press is held for a short-1, so a tap slides it from rest', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      const held = await whilePressed(
        'Wi-Fi',
        () => {
          const delay = getComputedStyle(handle('Wi-Fi')).transitionDelay
          const animations = handle('Wi-Fi').getAnimations()
          animations.forEach((animation) => animation.pause())
          // The time of a transition counts from the start of its delay.
          const sizes = [0, 25, 45, 100, 150, 410].map((ms) => {
            animations.forEach((animation) => (animation.currentTime = ms))
            return box(handle('Wi-Fi'), 'Wi-Fi').map((value) => Math.round(value * 10) / 10)
          })
          animations.forEach((animation) => animation.finish())
          return { delay, sizes }
        },
        'switch',
      )
      expect(held.delay).toBe(short1())
      const [atOnce, waiting, stillWaiting, growing, there, settled] = held.sizes as number[][]
      for (const resting of [atOnce, waiting, stillWaiting]) {
        expect(resting).toEqual([8, 8, 16, 16])
      }
      // 50ms into the spring it is about halfway, and at 100ms it reaches 28dp.
      expect(growing![2]).toBeGreaterThan(21)
      expect(growing![2]).toBeLessThan(24)
      expect(there![2]).toBeCloseTo(28, 0)
      expect(settled).toEqual([2, 2, 28, 28])
      // Round, and around its center; the boxes above are rounded to a tenth.
      for (const [left, top, width, height] of held.sizes as number[][]) {
        expect(width).toBe(height)
        expect(Math.abs(left! + width! / 2 - 16)).toBeLessThan(0.11)
        expect(Math.abs(top! + height! / 2 - 16)).toBeLessThan(0.11)
      }
      // Released, it has toggled, and nothing delays the way back.
      expect(getComputedStyle(handle('Wi-Fi')).transitionDelay).toBe('0s')
    })

    it('fades an icon in over a short-1 in its own state, and drops it at once in the other', () => {
      render(
        <Scheme>
          <Named label="Off" icons="both" />
          <Named label="On" icons="both" defaultSelected />
        </Scheme>,
      )
      const transition = (icon: Element) => {
        const style = getComputedStyle(icon)
        return [style.transitionProperty, style.transitionDuration]
      }
      const [check, close] = icons('On')
      expect(transition(check!)).toEqual(['opacity', short1()])
      expect(transition(close!)[0]).toBe('none')
      const [offCheck, offClose] = icons('Off')
      expect(transition(offCheck!)[0]).toBe('none')
      expect(transition(offClose!)).toEqual(['opacity', short1()])
    })

    it('animates nothing when disabled: a state set from outside is there at once', () => {
      function Pair({ on }: { on: boolean }) {
        return (
          <Scheme>
            <Named label="Off" icons="selected" isDisabled isSelected={on} />
            <Named label="On" icons="selected" isDisabled isSelected={!on} />
          </Scheme>
        )
      }
      const { rerender } = render(<Pair on={false} />)
      rerender(<Pair on />)
      for (const name of ['Off', 'On']) {
        for (const part of [track(name), handle(name), halo(name), ...icons(name)]) flush(part)
        expect(host(name).getAnimations({ subtree: true })).toEqual([])
      }
      expect(box(handle('Off'), 'Off')).toEqual([24, 4, 24, 24])
      expect(box(handle('On'), 'On')).toEqual([8, 8, 16, 16])
      expect(hitArea('Off')).toEqual([0, -8, 52, 48])
      expect(box(track('Off'), 'Off')).toEqual([0, 0, 52, 32])
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles the track, the handle and the state layer instantly', async () => {
        render(
          <Scheme>
            <Named label="Wi-Fi" icons="both" />
          </Scheme>,
        )
        await userEvent.click(pressed('Wi-Fi'))
        const durations = [
          getComputedStyle(track('Wi-Fi')),
          getComputedStyle(handle('Wi-Fi')),
          getComputedStyle(halo('Wi-Fi')),
        ].flatMap((style) => style.transitionDuration.split(', '))
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe('with label text', () => {
    it('draws the text after the switch in the label, in on-surface, and greys it when disabled', () => {
      render(
        <Scheme>
          <Switch>
            <span>Wi-Fi</span>
          </Switch>
          <Switch isDisabled>
            <span>Bluetooth</span>
          </Switch>
        </Scheme>,
      )
      const text = screen.getByText('Wi-Fi')
      expect(pressed('Wi-Fi')).toContainElement(text)
      expect(text.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        host('Wi-Fi').getBoundingClientRect().right,
      )
      expect(getComputedStyle(text).color).toBe(color('on-surface', text))
      const disabled = screen.getByText('Bluetooth')
      expect(rgba(getComputedStyle(disabled).color)[3] / 255).toBeCloseTo(0.38, 1)
    })

    it('toggles on a click on the text, with the handle sliding from rest, and shows the pointer over it', async () => {
      render(
        <Scheme>
          <Switch>
            <span>Wi-Fi</span>
          </Switch>
        </Scheme>,
      )
      const text = screen.getByText('Wi-Fi')
      expect(getComputedStyle(text).cursor).toBe('pointer')
      await userEvent.click(text)
      await settle()
      expect(checked('Wi-Fi')).toBe(true)
      expect(box(handle('Wi-Fi'), 'Wi-Fi')).toEqual([24, 4, 24, 24])
      expect(document.activeElement).toBe(input('Wi-Fi'))
      expect(getComputedStyle(host('Wi-Fi')).outlineStyle).toBe('none')
    })
  })

  describe("in a page's own group", () => {
    /* A page's rows and cards often carry `group`, or a named one such as `group/switch`,
     * and Tailwind's group variants match any ancestor that has the class. The switch
     * draws from what React Aria reports about its own label alone, so none of that reaches it. */
    const groups = ['group', 'group/switch'] as const

    function Row({ group }: { group: string }) {
      return (
        <Scheme>
          <div className={group}>
            <Named label="Off" icons="both" />
            <Named label="Off, disabled" isDisabled />
            <Named label="On" defaultSelected />
            <input type="checkbox" aria-label="Agree" defaultChecked />
            <button>Elsewhere</button>
          </div>
        </Scheme>
      )
    }

    it.each(groups)(
      'draws an unselected switch as unselected next to a selected one, in a %s',
      (group) => {
        render(<Row group={group} />)
        const el = track('Off')
        expect(getComputedStyle(el).backgroundColor).toBe(color('surface-container-highest', el))
        expect(getComputedStyle(el).borderTopColor).toBe(color('outline', el))
        expect(getComputedStyle(handle('Off')).backgroundColor).toBe(color('outline', el))
        expect(box(handle('Off'), 'Off')).toEqual([4, 4, 24, 24])
        expect(icons('Off').map((icon) => getComputedStyle(icon).opacity)).toEqual(['0', '1'])

        const disabled = getComputedStyle(handle('Off, disabled'))
        expect(rgba(disabled.backgroundColor)[3] / 255).toBeCloseTo(0.38, 1)
        expect(box(handle('Off, disabled'), 'Off, disabled')).toEqual([8, 8, 16, 16])

        expect(getComputedStyle(track('On')).backgroundColor).toBe(color('primary', el))
        expect(box(handle('On'), 'On')).toEqual([24, 4, 24, 24])
      },
    )

    it.each(groups)(
      'keeps its handle as it is while a %s is hovered or pressed elsewhere',
      async (group) => {
        render(<Row group={group} />)
        const rest = () => [
          getComputedStyle(handle('Off')).backgroundColor,
          getComputedStyle(handle('On')).backgroundColor,
          ...box(handle('Off'), 'Off'),
          ...box(handle('On'), 'On'),
        ]
        const atRest = rest()
        await userEvent.hover(screen.getByRole('button', { name: 'Elsewhere' }))
        await settle()
        expect(rest()).toEqual(atRest)
        const held = await whilePressed('Elsewhere', async () => {
          await settle()
          return rest()
        })
        expect(held).toEqual(atRest)
      },
    )
  })

  describe('browser defaults', () => {
    it('leaves nothing of the browser on the label or the switch, and shows a pointer over it', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      const label = getComputedStyle(pressed('Wi-Fi'))
      expect(label.cursor).toBe('pointer')
      expect(label.userSelect).toBe('none')
      expect(label.getPropertyValue('-webkit-tap-highlight-color')).toBe('rgba(0, 0, 0, 0)')
      const style = getComputedStyle(host('Wi-Fi'))
      expect(rgba(style.backgroundColor)[3]).toBe(0)
      expect(style.outlineStyle).toBe('none')
      expect(style.touchAction).toBe('manipulation')
      expect(style.borderTopWidth).toBe('0px')
      expect(style.paddingTop).toBe('0px')
      expect(style.marginTop).toBe('0px')
      // The input is for assistive technology and the keyboard: in a clipped pixel, never seen.
      const hidden = input('Wi-Fi').parentElement!
      const rect = hidden.getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([1, 1])
      expect(getComputedStyle(hidden).clipPath).toBe('inset(50%)')
    })

    it('shows the default cursor over a disabled switch', () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" isDisabled />
        </Scheme>,
      )
      expect(getComputedStyle(pressed('Wi-Fi')).cursor).toBe('default')
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('outlines an unselected track in CanvasText and fills a selected one with Highlight', () => {
      render(
        <Scheme>
          <Named label="Off" icons="both" />
          <Named label="On" icons="both" defaultSelected />
        </Scheme>,
      )
      const within = schemeOf(track('Off'))
      const system = (name: string) => computedColor(name, within)
      expect(getComputedStyle(track('Off')).borderTopColor).toBe(system('CanvasText'))
      expect(getComputedStyle(track('Off')).backgroundColor).toBe(system('Canvas'))
      expect(getComputedStyle(handle('Off')).backgroundColor).toBe(system('CanvasText'))
      expect(getComputedStyle(icons('Off')[1]!).fill).toBe(system('Canvas'))

      expect(getComputedStyle(track('On')).borderTopColor).toBe(system('Highlight'))
      expect(getComputedStyle(track('On')).backgroundColor).toBe(system('Highlight'))
      expect(getComputedStyle(handle('On')).backgroundColor).toBe(system('HighlightText'))
      expect(getComputedStyle(icons('On')[0]!).fill).toBe(system('Highlight'))
      expect(box(handle('On'), 'On')).toEqual([24, 4, 24, 24])
    })

    it('keeps those colors while hovered', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" defaultSelected />
        </Scheme>,
      )
      await userEvent.hover(pressed('Wi-Fi'))
      await settle()
      expect(getComputedStyle(handle('Wi-Fi')).backgroundColor).toBe(
        computedColor('HighlightText', schemeOf(track('Wi-Fi'))),
      )
    })

    it('greys out a disabled one, selected or not, at full opacity', () => {
      render(
        <Scheme>
          <Named label="Off" icons="both" isDisabled />
          <Named label="On" icons="both" isDisabled defaultSelected />
        </Scheme>,
      )
      const within = schemeOf(track('Off'))
      const system = (name: string) => computedColor(name, within)
      for (const name of ['Off', 'On']) {
        expect(getComputedStyle(track(name)).opacity).toBe('1')
        expect(getComputedStyle(track(name)).borderTopColor).toBe(system('GrayText'))
      }
      expect(getComputedStyle(track('Off')).backgroundColor).toBe(system('Canvas'))
      expect(getComputedStyle(handle('Off')).backgroundColor).toBe(system('GrayText'))
      expect(getComputedStyle(icons('Off')[1]!).fill).toBe(system('Canvas'))
      expect(getComputedStyle(track('On')).backgroundColor).toBe(system('GrayText'))
      expect(getComputedStyle(handle('On')).backgroundColor).toBe(system('Canvas'))
      expect(getComputedStyle(icons('On')[0]!).fill).toBe(system('GrayText'))
    })

    it('still shows the focus ring', async () => {
      render(
        <Scheme>
          <Named label="Wi-Fi" />
        </Scheme>,
      )
      await userEvent.tab()
      const focused = getComputedStyle(host('Wi-Fi'))
      expect(focused.outlineStyle).toBe('solid')
      expect(focused.outlineWidth).toBe('3px')
    })
  })
})
