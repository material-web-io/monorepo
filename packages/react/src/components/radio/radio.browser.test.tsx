import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { Except } from '../../lib/aria'
import {
  computedColor,
  computedRadius,
  contrastRatio,
  declaredValue,
  expectHitArea,
  rgba,
  Scheme,
  schemeOf,
  schemes,
  settle,
  springDuration,
  springEasing,
  unregisteredValue,
  useForcedColors,
  useReducedMotion,
  whilePressed,
} from '../../test-browser'
import { Radio, type RadioProps } from './radio'
import { RadioGroup, type RadioGroupProps } from './radio-group'

/* What needs a real browser and stylesheet: the 20dp ring and 10dp dot, their colors
 * per state, the 40dp state layer, focus ring, 48dp target, the label text, the group's
 * keyboard behavior, contrast, motion and forced colors. Markup and events: radio.test.tsx. */

/** The hidden `<input>` in the radio role, which has the name, the state and the focus. */
const input = (name: string) => screen.getByRole<HTMLInputElement>('radio', { name })
/** The `<label>` around it, React Aria's RadioButton: what the pointer is on, and what reports the states. */
const pressed = (name: string) => input(name).closest('label')!
/** The 40dp round host, the label's child after the hidden input's span: the state layer, the focus ring and the ring. */
const host = (name: string) => input(name).parentElement!.nextElementSibling as HTMLElement
/** The 20dp ring, the host's last child, and the 10dp dot in it. */
const ring = (name: string) => host(name).lastElementChild as HTMLElement
const dot = (name: string) => ring(name).firstElementChild as HTMLElement
const stateLayer = (name: string) => host(name).querySelector<HTMLElement>('.state-layer')!
const checked = (name: string) => input(name).checked

const center = (el: Element) => {
  const rect = el.getBoundingClientRect()
  return [rect.left + rect.width / 2, rect.top + rect.height / 2]
}

/** A group of radio buttons, laid out as the Scheme lays its children out, 96dp apart. */
function Group(props: RadioGroupProps) {
  return <RadioGroup aria-label="Options" style={{ display: 'flex', gap: 96 }} {...props} />
}

/** A radio button named by its state so a failure says which one; its value is its name. */
function Named({
  label,
  ...props
}: Except<RadioProps, 'aria-label' | 'value'> & { label: string }) {
  return <Radio aria-label={label} value={label} {...props} />
}

/** Selects the radio button and holds the transitions of it and `others` at 0, so a frame of them can be read. */
function selectAndHold(name: string, ...others: string[]) {
  input(name).click()
  const parts = [name, ...others].flatMap((each) => [ring(each), dot(each)])
  // Reading a computed style starts the transitions of the change just made.
  parts.forEach((part) => getComputedStyle(part).scale)
  const animations = parts.flatMap((part) => part.getAnimations())
  animations.forEach((animation) => {
    animation.pause()
    animation.currentTime = 0
  })
  return animations
}

describe('Radio in a browser', () => {
  describe('sizing', () => {
    it('draws a 20dp ring with a 2dp border inside a 40dp round host', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      const ringRect = ring('Home').getBoundingClientRect()
      const hostRect = host('Home').getBoundingClientRect()
      expect([ringRect.width, ringRect.height]).toEqual([20, 20])
      expect([hostRect.width, hostRect.height]).toEqual([40, 40])
      expect(ringRect.left - hostRect.left).toBe(10)
      expect(ringRect.top - hostRect.top).toBe(10)
      const style = getComputedStyle(ring('Home'))
      expect(style.borderTopWidth).toBe('2px')
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderRadius).toBe(computedRadius('rounded-full'))
      expect(getComputedStyle(host('Home')).borderRadius).toBe(computedRadius('rounded-full'))
    })

    it('is the whole of its label when given no text, which is the whole of its field', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      const size = (el: Element) => {
        const { width, height } = el.getBoundingClientRect()
        return [width, height]
      }
      expect(size(pressed('Home'))).toEqual([40, 40])
      expect(size(pressed('Home').parentElement!)).toEqual([40, 40])
    })

    it('fills a selected ring with a 10dp round dot at its center', () => {
      render(
        <Scheme>
          <Group defaultValue="Home">
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      const dotRect = dot('Home').getBoundingClientRect()
      expect([dotRect.width, dotRect.height]).toEqual([10, 10])
      expect(center(dot('Home'))).toEqual(center(ring('Home')))
      expect(getComputedStyle(dot('Home')).borderRadius).toBe(computedRadius('rounded-full'))
    })

    it('has a 48dp hit area around the 40dp host, centered on the ring', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      expect(center(host('Home'))).toEqual(center(ring('Home')))
      expectHitArea(host('Home'))
    })
  })

  describe('colors', () => {
    it('outlines an unselected ring in on-surface-variant, with no dot', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      const el = ring('Home')
      expect(getComputedStyle(el).borderTopColor).toBe(
        computedColor('var(--md-sys-color-on-surface-variant)', el),
      )
      expect(rgba(getComputedStyle(el).backgroundColor)[3]).toBe(0)
      expect(dot('Home').getBoundingClientRect().width).toBe(0)
    })

    it('draws a selected ring and its dot in primary', () => {
      render(
        <Scheme>
          <Group defaultValue="Home">
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      const primary = computedColor('var(--md-sys-color-primary)', ring('Home'))
      expect(getComputedStyle(ring('Home')).borderTopColor).toBe(primary)
      expect(getComputedStyle(dot('Home')).backgroundColor).toBe(primary)
    })

    it('darkens the ring to on-surface while hovered, focused or pressed, unselected only', async () => {
      render(
        <Scheme>
          <Group>
            <Named label="Off" />
          </Group>
          <Group defaultValue="On">
            <Named label="On" />
          </Group>
        </Scheme>,
      )
      const onSurface = computedColor('var(--md-sys-color-on-surface)', ring('Off'))
      const primary = computedColor('var(--md-sys-color-primary)', ring('On'))

      await userEvent.hover(pressed('Off'))
      await settle()
      expect(getComputedStyle(ring('Off')).borderTopColor).toBe(onSurface)
      await userEvent.unhover(pressed('Off'))

      await userEvent.tab()
      await settle()
      expect(document.activeElement).toBe(input('Off'))
      expect(getComputedStyle(ring('Off')).borderTopColor).toBe(onSurface)

      const held = await whilePressed(
        'Off',
        async () => {
          await settle()
          return getComputedStyle(ring('Off')).borderTopColor
        },
        'radio',
      )
      expect(held).toBe(onSurface)

      await userEvent.hover(pressed('On'))
      await settle()
      expect(getComputedStyle(ring('On')).borderTopColor).toBe(primary)
      await userEvent.tab()
      await settle()
      expect(document.activeElement).toBe(input('On'))
      expect(getComputedStyle(ring('On')).borderTopColor).toBe(primary)
    })

    it('greys out a disabled ring and dot to on-surface at 38%', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Off" isDisabled />
          </Group>
          <Group defaultValue="On" isDisabled>
            <Named label="On" />
          </Group>
        </Scheme>,
      )
      // The same mix Tailwind writes for on-surface/disabled-content, the 38% token.
      const faded = computedColor(
        'color-mix(in oklab, var(--md-sys-color-on-surface) calc(var(--md-sys-state-disabled-content-opacity) * 100%), transparent)',
        ring('Off'),
      )
      const at38 = (color: string) => {
        expect(color).toBe(faded)
        expect(rgba(color)[3] / 255).toBeCloseTo(0.38, 1)
      }
      at38(getComputedStyle(ring('Off')).borderTopColor)
      at38(getComputedStyle(ring('On')).borderTopColor)
      at38(getComputedStyle(dot('On')).backgroundColor)
      expect(dot('On').getBoundingClientRect().width).toBe(10)
    })
  })

  describe('state layer', () => {
    it('is the 40dp host, tinted on-surface at 8% while an unselected radio button is hovered', async () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      const layer = stateLayer('Home')
      expect(getComputedStyle(layer).opacity).toBe('0')
      await userEvent.hover(pressed('Home'))
      await settle()
      const style = getComputedStyle(layer)
      expect(style.opacity).toBe('0.08')
      expect(style.backgroundColor).toBe(computedColor('var(--md-sys-color-on-surface)', layer))
      expect(layer.getBoundingClientRect()).toMatchObject(
        (({ width, height }) => ({ width, height }))(host('Home').getBoundingClientRect()),
      )
    })

    it.each([
      ['unselected', undefined, '--md-sys-color-on-surface', '--md-sys-color-primary'],
      ['selected', 'Home', '--md-sys-color-primary', '--md-sys-color-on-surface'],
    ] as const)(
      'tints the hover and focus layer of a %s radio button with one role and its press ripple with the other',
      async (_, selected, hover, press) => {
        render(
          <Scheme>
            <Group defaultValue={selected}>
              <Named label="Home" />
            </Group>
          </Scheme>,
        )
        const layer = stateLayer('Home')
        expect(getComputedStyle(layer).backgroundColor).toBe(computedColor(`var(${hover})`, layer))
        const ripple = await whilePressed(
          'Home',
          async () => {
            await settle()
            const circle = host('Home').querySelector<HTMLElement>('.opacity-state-pressed')!
            return getComputedStyle(circle).backgroundColor
          },
          'radio',
        )
        expect(ripple).toBe(computedColor(`var(${press})`, layer))
      },
    )

    it('is hidden, with no ripple, when disabled, and leaves the ring greyed out', async () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" isDisabled />
          </Group>
        </Scheme>,
      )
      const resting = getComputedStyle(ring('Home')).borderTopColor
      // The pointer's own :hover matches a disabled label too: disabled outweighs it.
      await userEvent.hover(pressed('Home'))
      await settle()
      expect(pressed('Home').matches(':hover')).toBe(true)
      expect(getComputedStyle(stateLayer('Home')).opacity).toBe('0')
      expect(getComputedStyle(ring('Home')).borderTopColor).toBe(resting)
      const circles = await whilePressed(
        'Home',
        () => host('Home').querySelectorAll('.opacity-state-pressed').length,
        'radio',
      )
      expect(circles).toBe(0)
    })
  })

  describe('focus ring', () => {
    it('is a 3px secondary outline 2px outside the round host, on keyboard focus only', async () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      const el = host('Home')
      expect(getComputedStyle(el).outlineStyle).toBe('none')

      await userEvent.tab()
      expect(document.activeElement).toBe(input('Home'))
      const focused = getComputedStyle(el)
      expect(focused.outlineStyle).toBe('solid')
      expect(focused.outlineWidth).toBe('3px')
      expect(focused.outlineOffset).toBe('2px')
      expect(focused.outlineColor).toBe(computedColor('var(--md-sys-color-secondary)', el))
      // Around the host only: the label around it has none.
      expect(getComputedStyle(pressed('Home')).outlineStyle).toBe('none')
      await settle()
      expect(getComputedStyle(stateLayer('Home')).opacity).toBe('0.1')
    })

    it('is not drawn when the radio button is only clicked, which focuses it too', async () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      await userEvent.click(pressed('Home'))
      expect(document.activeElement).toBe(input('Home'))
      expect(pressed('Home')).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(host('Home')).outlineStyle).toBe('none')
      await settle()
      expect(getComputedStyle(stateLayer('Home')).opacity).toBe('0.08')
    })
  })

  describe('keyboard', () => {
    /* The spec's keyboard table, as React Aria's group has it: Tab and Shift+Tab enter
     * it at the selected radio button, or with none selected at the first going forward
     * and the last going back, the arrows move focus and selection and wrap, Space selects. */
    function Groups() {
      return (
        <Scheme>
          <Group aria-label="Ship to" defaultValue="Office">
            <Named label="Home" />
            <Named label="Office" />
            <Named label="Other" />
          </Group>
          <Group aria-label="Pay with">
            <Named label="Card" />
            <Named label="Cash" />
          </Group>
          <button>Continue</button>
        </Scheme>
      )
    }

    it('is one tab stop each way, entered at the selected radio button, else the first or the last', async () => {
      render(<Groups />)
      await userEvent.tab()
      expect(document.activeElement).toBe(input('Office'))
      await userEvent.tab()
      expect(document.activeElement).toBe(input('Card'))
      await userEvent.tab()
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continue' }))
      await userEvent.tab({ shift: true })
      expect(document.activeElement).toBe(input('Cash'))
      await userEvent.tab({ shift: true })
      expect(document.activeElement).toBe(input('Office'))
      await userEvent.tab()
      expect(document.activeElement).toBe(input('Card'))
    })

    it('moves focus and the selection with the arrows, wrapping between the first and last', async () => {
      render(<Groups />)
      await userEvent.tab()
      const selected = () => ['Home', 'Office', 'Other'].filter(checked)
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(input('Other'))
      expect(selected()).toEqual(['Other'])
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(input('Home'))
      expect(selected()).toEqual(['Home'])
      await userEvent.keyboard('{ArrowUp}')
      expect(selected()).toEqual(['Other'])
      await userEvent.keyboard('{ArrowRight}')
      expect(selected()).toEqual(['Home'])
      await userEvent.keyboard('{ArrowLeft}')
      expect(selected()).toEqual(['Other'])
      expect(document.activeElement).toBe(input('Other'))
    })

    it('is selected by Space, and stays selected on another Space', async () => {
      render(<Groups />)
      await userEvent.tab()
      await userEvent.tab()
      expect(document.activeElement).toBe(input('Card'))
      expect(checked('Card')).toBe(false)
      await userEvent.keyboard(' ')
      expect(checked('Card')).toBe(true)
      await userEvent.keyboard(' ')
      expect(checked('Card')).toBe(true)
      expect(document.activeElement).toBe(input('Card'))
    })

    it('is selected by Enter too, as React Aria has it: the input lets the key through to the label', async () => {
      render(<Groups />)
      await userEvent.tab()
      await userEvent.tab()
      expect(document.activeElement).toBe(input('Card'))
      await userEvent.keyboard('{Enter}')
      expect(checked('Card')).toBe(true)
    })
  })

  describe('with label text', () => {
    it('draws the text after the host in the label, in on-surface, and greys it when disabled', () => {
      render(
        <Scheme>
          <Group>
            <Radio value="home">
              <span>Home</span>
            </Radio>
            <Radio value="office" isDisabled>
              <span>Office</span>
            </Radio>
          </Group>
        </Scheme>,
      )
      const text = screen.getByText('Home')
      expect(pressed('Home')).toContainElement(text)
      expect(text.getBoundingClientRect().left).toBe(host('Home').getBoundingClientRect().right)
      expect(getComputedStyle(text).color).toBe(
        computedColor('var(--md-sys-color-on-surface)', text),
      )
      const disabled = screen.getByText('Office')
      expect(rgba(getComputedStyle(disabled).color)[3] / 255).toBeCloseTo(0.38, 1)
    })

    it('is selected by a click on the text, which shows the pointer and does not ring it', async () => {
      render(
        <Scheme>
          <Group>
            <Radio value="home">
              <span>Home</span>
            </Radio>
          </Group>
        </Scheme>,
      )
      const text = screen.getByText('Home')
      expect(getComputedStyle(text).cursor).toBe('pointer')
      await userEvent.click(text)
      await settle()
      expect(checked('Home')).toBe(true)
      expect(getComputedStyle(dot('Home')).backgroundColor).toBe(
        computedColor('var(--md-sys-color-primary)', dot('Home')),
      )
      expect(document.activeElement).toBe(input('Home'))
      expect(getComputedStyle(host('Home')).outlineStyle).toBe('none')
    })
  })

  describe('contrast', () => {
    /* WCAG 1.4.11: the ring and the dot are graphical objects, so each
     * needs 3:1 against the surface behind it. */
    it.each(schemes)(
      'keeps the ring and dot at 3:1 or more, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Group>
              <Named label="Off" />
            </Group>
            <Group defaultValue="On">
              <Named label="On" />
            </Group>
          </Scheme>,
        )
        const surface = getComputedStyle(schemeOf(ring('Off'))).backgroundColor
        const below: string[] = []
        for (const name of ['Off', 'On']) {
          if (contrastRatio(getComputedStyle(ring(name)).borderTopColor, surface) < 3)
            below.push(`${name} ring`)
        }
        if (contrastRatio(getComputedStyle(dot('On')).backgroundColor, surface) < 3)
          below.push('On dot')
        expect(below).toEqual([])
      },
    )
  })

  describe('motion', () => {
    /** Where a spring is `ms` after its release, from its own damping and stiffness. */
    const spring = (name: string, ms: number, within: Element = document.documentElement) => {
      const style = getComputedStyle(within)
      const token = (part: string) =>
        Number(style.getPropertyValue(`--md-sys-motion-spring-${name}-${part}`))
      const [damping, pace] = [token('damping'), Math.sqrt(token('stiffness'))]
      const t = ms / 1000
      // Critically damped, as the effects springs are, it has no swing.
      if (damping === 1) return 1 - Math.exp(-pace * t) * (1 + pace * t)
      const swing = pace * Math.sqrt(1 - damping ** 2)
      const decay = damping * pace
      return (
        1 - Math.exp(-decay * t) * (Math.cos(swing * t) + (decay / swing) * Math.sin(swing * t))
      )
    }
    /** The dot Android draws: a radius on the spring between 0 and 6dp, less 1dp, never below none. */
    const drawn = (progress: number) => Math.max(0, 12 * progress - 2)
    const width = (el: Element) => el.getBoundingClientRect().width

    function Pair() {
      return (
        <Scheme>
          <Group defaultValue="Home">
            <Named label="Home" />
            <Named label="Office" />
          </Group>
        </Scheme>
      )
    }

    it('moves the dot on the fast spatial spring and fades the ring on the default effects one, in both states', () => {
      render(<Pair />)
      for (const name of ['Home', 'Office']) {
        const moved = getComputedStyle(dot(name))
        expect(moved.transitionProperty).toBe('--radio-inner-circle-radius')
        expect(moved.transitionDuration).toBe(springDuration('fast-spatial'))
        expect(moved.transitionTimingFunction).toBe(springEasing('fast-spatial'))
        const faded = getComputedStyle(ring(name))
        expect(faded.transitionProperty.split(', ')).toContain('color')
        expect(faded.transitionDuration).toBe(springDuration('default-effects'))
        expect(faded.transitionTimingFunction).toBe(springEasing('default-effects'))
        expect(faded.transitionDelay).toBe('0s')
      }
    })

    it('grows the dot a beat after the spring starts, past its 10dp and back onto it', () => {
      render(<Pair />)
      const animations = selectAndHold('Office')
      const times = [0, 17, 33, 50, 67, 83, 100, 117, 133, 150, 200, 250, 278, 320]
      const sizes = times.map((ms) => {
        animations.forEach((animation) => (animation.currentTime = ms))
        const rect = dot('Office').getBoundingClientRect()
        expect(rect.height).toBeCloseTo(rect.width, 3)
        const [x, y] = center(dot('Office')) as [number, number]
        const [ringX, ringY] = center(ring('Office')) as [number, number]
        expect(x).toBeCloseTo(ringX, 3)
        expect(y).toBeCloseTo(ringY, 3)
        return rect.width
      })
      const at = (ms: number) => sizes[times.indexOf(ms)]!
      for (const ms of times) {
        expect(Math.abs(at(ms) - drawn(spring('fast-spatial', ms)))).toBeLessThan(0.06)
      }
      // Nothing on the first frame, a speck on the second, as in the recording.
      expect(at(17)).toBe(0)
      expect(at(33)).toBeGreaterThan(1.2)
      expect(at(33)).toBeLessThan(1.8)
      // It is 10dp at 100ms, 11dp at 133ms and a tenth short of 10dp at 278ms.
      expect(at(100)).toBeCloseTo(10, 0)
      expect(at(133)).toBeGreaterThan(11)
      expect(at(133)).toBeLessThan(11.2)
      expect(at(278)).toBeGreaterThan(9.85)
      expect(at(278)).toBeLessThan(10)
      animations.forEach((animation) => animation.finish())
      expect(width(dot('Office'))).toBe(10)
    })

    it('shrinks the dot of the one deselected on the same spring, as the other grows', () => {
      render(<Pair />)
      const animations = selectAndHold('Office', 'Home')
      const times = [0, 17, 33, 50, 67, 83, 100, 133, 200, 278]
      const sizes = times.map((ms) => {
        animations.forEach((animation) => (animation.currentTime = ms))
        return [width(dot('Home')), width(dot('Office'))] as const
      })
      times.forEach((ms, i) => {
        const progress = spring('fast-spatial', ms)
        const [shrinking, growing] = sizes[i]!
        expect(Math.abs(shrinking - drawn(1 - progress))).toBeLessThan(0.06)
        expect(Math.abs(growing - drawn(progress))).toBeLessThan(0.06)
      })
      // The recording's frames: 9dp with none yet, 6.5dp with 1.5dp, and gone by 83ms.
      expect(sizes[1]![0]).toBeCloseTo(8.9, 0)
      expect(sizes[2]![0]).toBeCloseTo(6.5, 0)
      expect(sizes[5]![0]).toBe(0)
      expect(sizes.slice(5).every(([shrinking]) => shrinking === 0)).toBe(true)
      animations.forEach((animation) => animation.finish())
      expect(width(dot('Home'))).toBe(0)
    })

    it('draws the dot in the color of the ring at every frame of its fade, both ways', () => {
      render(<Pair />)
      const unselected = rgba(getComputedStyle(ring('Office')).borderTopColor)
      const selected = rgba(getComputedStyle(ring('Home')).borderTopColor)
      const animations = selectAndHold('Office', 'Home')
      for (const ms of [0, 17, 33, 50, 83, 133, 200]) {
        animations.forEach((animation) => (animation.currentTime = ms))
        const progress = spring('default-effects', ms)
        for (const [name, from, to] of [
          ['Office', unselected, selected],
          ['Home', selected, unselected],
        ] as const) {
          const color = getComputedStyle(ring(name)).borderTopColor
          expect(getComputedStyle(dot(name)).backgroundColor).toBe(color)
          rgba(color)
            .slice(0, 3)
            .forEach((channel, i) => {
              const expected = from[i]! + (to[i]! - from[i]!) * progress
              expect(Math.abs(channel - expected)).toBeLessThan(1.5)
            })
        }
      }
      // Only the ring fades: the dot takes its color, with no transition of its own.
      const animated = (el: Element) =>
        el.getAnimations().map((animation) => (animation as CSSTransition).transitionProperty)
      expect(animated(dot('Office'))).toEqual(['--radio-inner-circle-radius'])
      expect(animated(ring('Office'))).toEqual(['color'])
    })

    it('keeps to the fast spatial spring of the standard scheme, which has no overshoot', () => {
      render(
        <Scheme>
          <div data-motion="standard">
            <Group defaultValue="Home">
              <Named label="Home" />
              <Named label="Office" />
            </Group>
          </div>
        </Scheme>,
      )
      const scope = dot('Office').closest('[data-motion]')!
      expect(
        getComputedStyle(scope).getPropertyValue('--md-sys-motion-spring-fast-spatial-damping'),
      ).toBe('0.9')
      const animations = selectAndHold('Office')
      const sizes = [33, 50, 100, 150, 200].map((ms) => {
        animations.forEach((animation) => (animation.currentTime = ms))
        expect(
          Math.abs(width(dot('Office')) - drawn(spring('fast-spatial', ms, scope))),
        ).toBeLessThan(0.06)
        return width(dot('Office'))
      })
      expect(Math.max(...sizes)).toBeLessThan(10.05)
    })

    it('animates nothing when disabled', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Off" isDisabled />
          </Group>
          <Group defaultValue="On">
            <Named label="On" isDisabled />
          </Group>
        </Scheme>,
      )
      for (const name of ['Off', 'On']) {
        expect(getComputedStyle(ring(name)).transitionProperty).toBe('none')
        expect(getComputedStyle(dot(name)).transitionProperty).toBe('none')
      }
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles the ring and the dot instantly', async () => {
        render(
          <Scheme>
            <Group>
              <Named label="Home" />
            </Group>
          </Scheme>,
        )
        await userEvent.click(pressed('Home'))
        const durations = [
          ...getComputedStyle(ring('Home')).transitionDuration.split(', '),
          ...getComputedStyle(dot('Home')).transitionDuration.split(', '),
        ]
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe("in a page's own group", () => {
    /* A page's rows and cards often carry `group`, or a named one such as `group/radio`,
     * and Tailwind's group variants match any ancestor that has the class. The radio
     * button's own group is `md-radio`, a name no page picks by chance, on its label alone. */
    it.each(['group', 'group/radio'])(
      'draws the dot of the selected radio button only, in a %s',
      async (group) => {
        render(
          <Scheme>
            <div className={group}>
              <Group defaultValue="Home">
                <Named label="Home" />
                <Named label="Office" />
                <Named label="Other" isDisabled />
              </Group>
              <input type="checkbox" aria-label="Agree" defaultChecked />
            </div>
          </Scheme>,
        )
        const dots = () =>
          ['Home', 'Office', 'Other'].map((name) => dot(name).getBoundingClientRect().width)
        expect(dots()).toEqual([10, 0, 0])
        const el = ring('Office')
        expect(getComputedStyle(el).borderTopColor).toBe(
          computedColor('var(--md-sys-color-on-surface-variant)', el),
        )

        await userEvent.click(pressed('Office'))
        await settle()
        expect(dots()).toEqual([0, 10, 0])
      },
    )
  })

  describe('in a browser without @property', () => {
    /* There the radius is a plain property, with no value unless a rule sets it, and a
     * scale that reads none is invalid, which draws the dot at its size. Tailwind sets
     * every registered property on all elements there: that is what gives it its 0. */
    it('starts every element with a radius of 0', () => {
      expect(unregisteredValue('--radio-inner-circle-radius')).toEqual(['0'])
    })

    it.each([
      ['no dot on an unselected radio button', undefined, '0', 0],
      ['the dot on a selected one', 'Home', '1', 10],
    ] as const)('draws %s', (_, selected, scale, size) => {
      render(
        <Scheme>
          <Group defaultValue={selected}>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      // This browser has the radius registered, so the dot's rules are read into a
      // property that nothing has, as a browser without @property reads the radius.
      const unregistered = (value: string) =>
        value.replaceAll('--radio-inner-circle-radius', '--radio-inner-circle-radius-unregistered')
      const declared = declaredValue(dot('Home'), 'scale')!
      const radius = declaredValue(dot('Home'), '--radio-inner-circle-radius')
      expect(declared).toContain('var(--radio-inner-circle-radius')
      expect(radius).toBe(selected ? '6' : undefined)

      const probe = document.createElement('span')
      probe.style.display = 'block'
      probe.style.width = probe.style.height = getComputedStyle(dot('Home')).width
      probe.style.scale = unregistered(declared)
      // Beside the host, whose last child the tests take for its ring.
      host('Home').after(probe)
      // With no value at all the dot would be drawn, selected or not.
      expect(getComputedStyle(probe).scale).toBe('none')
      probe.style.setProperty(
        unregistered('--radio-inner-circle-radius'),
        radius ?? unregisteredValue('--radio-inner-circle-radius')[0]!,
      )
      expect(getComputedStyle(probe).scale).toBe(scale)
      expect(probe.getBoundingClientRect().width).toBe(size)
      probe.remove()
    })
  })

  describe('browser defaults', () => {
    it('leaves nothing of the browser on the label or the host, and shows a pointer over it', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
            <Named label="Disabled" isDisabled />
          </Group>
        </Scheme>,
      )
      const label = getComputedStyle(pressed('Home'))
      expect(label.cursor).toBe('pointer')
      expect(label.userSelect).toBe('none')
      expect(label.getPropertyValue('-webkit-tap-highlight-color')).toBe('rgba(0, 0, 0, 0)')
      const style = getComputedStyle(host('Home'))
      expect(rgba(style.backgroundColor)[3]).toBe(0)
      expect(style.outlineStyle).toBe('none')
      expect(style.touchAction).toBe('manipulation')
      expect(style.borderTopWidth).toBe('0px')
      expect(style.paddingTop).toBe('0px')
      expect(style.marginTop).toBe('0px')
      // The input is for assistive technology and the keyboard: in a clipped pixel, never seen.
      const hidden = input('Home').parentElement!
      const rect = hidden.getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([1, 1])
      expect(getComputedStyle(hidden).clipPath).toBe('inset(50%)')
      expect(getComputedStyle(pressed('Disabled')).cursor).toBe('default')
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('outlines the ring and fills the dot in CanvasText, selected or not', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Off" />
          </Group>
          <Group defaultValue="On">
            <Named label="On" />
          </Group>
        </Scheme>,
      )
      const canvasText = computedColor('CanvasText', schemeOf(ring('Off')))
      expect(getComputedStyle(ring('Off')).borderTopColor).toBe(canvasText)
      expect(getComputedStyle(ring('On')).borderTopColor).toBe(canvasText)
      expect(getComputedStyle(dot('On')).backgroundColor).toBe(canvasText)
      expect(dot('On').getBoundingClientRect().width).toBe(10)
    })

    it('greys out a disabled one, selected or not', () => {
      render(
        <Scheme>
          <Group>
            <Named label="Off" isDisabled />
          </Group>
          <Group defaultValue="On">
            <Named label="On" isDisabled />
          </Group>
        </Scheme>,
      )
      const grayText = computedColor('GrayText', schemeOf(ring('Off')))
      expect(getComputedStyle(ring('Off')).borderTopColor).toBe(grayText)
      expect(getComputedStyle(ring('On')).borderTopColor).toBe(grayText)
      expect(getComputedStyle(dot('On')).backgroundColor).toBe(grayText)
    })

    it('still shows the focus ring', async () => {
      render(
        <Scheme>
          <Group>
            <Named label="Home" />
          </Group>
        </Scheme>,
      )
      await userEvent.tab()
      const focused = getComputedStyle(host('Home'))
      expect(focused.outlineStyle).toBe('solid')
      expect(focused.outlineWidth).toBe('3px')
    })
  })
})
