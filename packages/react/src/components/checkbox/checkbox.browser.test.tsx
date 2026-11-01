import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { Except } from '../../lib/aria'
import {
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  expectHitArea,
  rgba,
  Scheme,
  schemeOf,
  schemes,
  settle,
  useForcedColors,
  useReducedMotion,
  whilePressed,
} from '../../test-browser'
import { Checkbox, type CheckboxProps } from './checkbox'

/* What needs a real browser and stylesheet: the 18dp box, its border, corner and colors in
 * each state, the marks, the 40dp state layer and its colors, the focus ring, the 48dp target,
 * the label text, keys, contrast, motion and forced colors. Markup and events: checkbox.test.tsx. */

/** The hidden `<input>` in the checkbox role, which has the name, the state and the focus. */
const input = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name })
/** The `<label>` around it, React Aria's CheckboxButton: what the pointer is on, and what reports the states. */
const pressed = (name: string) => input(name).closest('label')!
/** The 40dp round host, the label's child after the hidden input's span: the state layer, the focus ring and the box. */
const host = (name: string) => input(name).parentElement!.nextElementSibling as HTMLElement
/** The 18dp box, the host's last child, after the state layer and the ripple's surface. */
const box = (name: string) => host(name).lastElementChild as HTMLElement
const marks = (name: string) => box(name).querySelector('svg')!
const stateLayer = (name: string) => host(name).querySelector<HTMLElement>('.state-layer')!
const checked = (name: string) => input(name).checked

/** An element's box from its checkbox host's top left corner: [left, top, width, height]. */
const rectIn = (el: Element, name: string) => {
  const origin = host(name).getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  return [rect.left - origin.left, rect.top - origin.top, rect.width, rect.height]
}

const color = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)

/** A checkbox named by its state so a failure says which one. */
function Named({ label, ...props }: Except<CheckboxProps, 'aria-label'> & { label: string }) {
  return <Checkbox aria-label={label} {...props} />
}

describe('Checkbox in a browser', () => {
  describe('sizing', () => {
    it('draws an 18dp box with a 2dp border and 2dp corners, inside a 40dp round host', () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      expect(rectIn(host('Pickles'), 'Pickles')).toEqual([0, 0, 40, 40])
      expect(rectIn(box('Pickles'), 'Pickles')).toEqual([11, 11, 18, 18])
      const style = getComputedStyle(box('Pickles'))
      expect(style.borderTopWidth).toBe('2px')
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderRadius).toBe(computedRadius('rounded-checkbox-container'))
      expect(style.borderRadius).toBe('2px')
      expect(getComputedStyle(host('Pickles')).borderRadius).toBe(computedRadius('rounded-full'))
    })

    it('is the whole of its label when given no text, which is the whole of its field', () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      const field = pressed('Pickles').parentElement!
      expect(rectIn(pressed('Pickles'), 'Pickles')).toEqual([0, 0, 40, 40])
      expect(rectIn(field, 'Pickles')).toEqual([0, 0, 40, 40])
    })

    it('spans the box with the marks, so the 18-unit drawing is 1dp per unit', () => {
      render(
        <Scheme>
          <Named label="Pickles" defaultSelected />
        </Scheme>,
      )
      expect(rectIn(marks('Pickles'), 'Pickles')).toEqual(rectIn(box('Pickles'), 'Pickles'))
      // By a size of its own, not `auto`: WebKit fits an svg that is only inset
      // to the box's 14dp padding box, which Chromium's rect above cannot show.
      const computed = marks('Pickles').computedStyleMap()
      expect([String(computed.get('width')), String(computed.get('height'))]).toEqual([
        '18px',
        '18px',
      ])
    })

    it('has a 48dp hit area around the 40dp host, centered on the box', () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      const rect = host('Pickles').getBoundingClientRect()
      const boxRect = box('Pickles').getBoundingClientRect()
      expect(rect.left + 20).toBe(boxRect.left + 9)
      expect(rect.top + 20).toBe(boxRect.top + 9)
      expectHitArea(host('Pickles'))
    })
  })

  describe('colors', () => {
    it('outlines an unselected box in on-surface-variant, with no fill and hidden marks', () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      const el = box('Pickles')
      const style = getComputedStyle(el)
      expect(style.borderTopColor).toBe(color('on-surface-variant', el))
      expect(rgba(style.backgroundColor)[3]).toBe(0)
      expect(getComputedStyle(marks('Pickles')).opacity).toBe('0')
    })

    it.each([
      ['selected', { defaultSelected: true }],
      ['indeterminate', { isIndeterminate: true }],
    ] as const)('fills a %s box in primary and draws its marks in on-primary', (_, state) => {
      render(
        <Scheme>
          <Named label="Pickles" {...state} />
        </Scheme>,
      )
      const el = box('Pickles')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(color('primary', el))
      expect(rgba(style.borderTopColor)[3]).toBe(0)
      expect(getComputedStyle(marks('Pickles')).opacity).toBe('1')
      for (const rect of marks('Pickles').querySelectorAll('rect')) {
        expect(getComputedStyle(rect).fill).toBe(color('on-primary', el))
      }
    })

    it('darkens the outline to on-surface while hovered, focused or pressed, unselected only', async () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      const onSurface = color('on-surface', box('Off'))
      const primary = color('primary', box('On'))

      await userEvent.hover(pressed('Off'))
      await settle()
      expect(getComputedStyle(box('Off')).borderTopColor).toBe(onSurface)
      await userEvent.unhover(pressed('Off'))

      await userEvent.tab()
      await settle()
      expect(document.activeElement).toBe(input('Off'))
      expect(getComputedStyle(box('Off')).borderTopColor).toBe(onSurface)

      const held = await whilePressed(
        'Off',
        async () => {
          await settle()
          return getComputedStyle(box('Off')).borderTopColor
        },
        'checkbox',
      )
      expect(held).toBe(onSurface)

      await userEvent.hover(pressed('On'))
      await settle()
      expect(getComputedStyle(box('On')).backgroundColor).toBe(primary)
      expect(rgba(getComputedStyle(box('On')).borderTopColor)[3]).toBe(0)
    })

    it('uses the error role for the outline, the fill and the marks when invalid', () => {
      render(
        <Scheme>
          <Named label="Off" isInvalid />
          <Named label="On" isInvalid defaultSelected />
          <Named label="Some" isInvalid isIndeterminate />
        </Scheme>,
      )
      const error = color('error', box('Off'))
      expect(getComputedStyle(box('Off')).borderTopColor).toBe(error)
      for (const name of ['On', 'Some']) {
        expect(getComputedStyle(box(name)).backgroundColor).toBe(error)
        expect(rgba(getComputedStyle(box(name)).borderTopColor)[3]).toBe(0)
        expect(getComputedStyle(marks(name).querySelector('rect')!).fill).toBe(
          color('on-error', box(name)),
        )
      }
    })

    it('keeps an invalid outline in the error role while hovered, focused or pressed', async () => {
      render(
        <Scheme>
          <Named label="Terms" isInvalid />
        </Scheme>,
      )
      const error = color('error', box('Terms'))
      await userEvent.hover(pressed('Terms'))
      await settle()
      expect(getComputedStyle(box('Terms')).borderTopColor).toBe(error)
      await userEvent.unhover(pressed('Terms'))
      await userEvent.tab()
      await settle()
      expect(pressed('Terms')).toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(box('Terms')).borderTopColor).toBe(error)
      const held = await whilePressed(
        'Terms',
        async () => {
          await settle()
          return getComputedStyle(box('Terms')).borderTopColor
        },
        'checkbox',
      )
      expect(held).toBe(error)
    })

    it('greys out a disabled box to on-surface at 38%, with the marks in the surface color', () => {
      render(
        <Scheme>
          <Named label="Off" isDisabled />
          <Named label="On" isDisabled defaultSelected />
          <Named label="Some" isDisabled isIndeterminate />
          <Named label="Error off" isDisabled isInvalid />
          <Named label="Error" isDisabled isInvalid defaultSelected />
        </Scheme>,
      )
      // The same mix Tailwind writes for on-surface/disabled-content, the 38% token.
      const faded = computedColor(
        'color-mix(in oklab, var(--md-sys-color-on-surface) calc(var(--md-sys-state-disabled-content-opacity) * 100%), transparent)',
        box('Off'),
      )
      const at38 = (value: string) => {
        expect(value).toBe(faded)
        expect(rgba(value)[3] / 255).toBeCloseTo(0.38, 1)
      }
      for (const name of ['Off', 'Error off']) {
        at38(getComputedStyle(box(name)).borderTopColor)
        expect(rgba(getComputedStyle(box(name)).backgroundColor)[3]).toBe(0)
      }
      for (const name of ['On', 'Some', 'Error']) {
        at38(getComputedStyle(box(name)).backgroundColor)
        expect(rgba(getComputedStyle(box(name)).borderTopColor)[3]).toBe(0)
      }
      expect(getComputedStyle(marks('On').querySelector('rect')!).fill).toBe(
        color('surface', box('On')),
      )
    })

    it('keeps a disabled checkbox as it is while hovered or pressed', async () => {
      render(
        <Scheme>
          <Named label="Pickles" isDisabled />
        </Scheme>,
      )
      const before = getComputedStyle(box('Pickles')).borderTopColor
      await userEvent.hover(pressed('Pickles'))
      await settle()
      expect(getComputedStyle(box('Pickles')).borderTopColor).toBe(before)
      const held = await whilePressed(
        'Pickles',
        async () => {
          await settle()
          return getComputedStyle(box('Pickles')).borderTopColor
        },
        'checkbox',
      )
      expect(held).toBe(before)
      expect(checked('Pickles')).toBe(false)
    })
  })

  describe('marks', () => {
    it('lays the check out as two arms, and the dash as two halves of one line', () => {
      render(
        <Scheme>
          <Named label="Check" defaultSelected />
          <Named label="Dash" isIndeterminate />
        </Scheme>,
      )
      const arms = (name: string) =>
        [...marks(name).querySelectorAll('rect')].map((rect) => {
          const style = getComputedStyle(rect)
          return [style.translate, style.rotate, style.scale]
        })
      expect(arms('Check')).toEqual([
        ['3.6px 9px', '45deg', '5.49 1'],
        ['6.917px 12.883px', '-45deg', '10.58 1'],
      ])
      expect(arms('Dash')).toEqual([
        ['4px 9px', '0deg', '5.4 1'],
        ['8.6px 9px', '0deg', '5.4 1'],
      ])
    })

    it('keeps the last shape while fading out, so an unselected box is not redrawn', async () => {
      function Additions() {
        const [state, setState] = useState<'indeterminate' | 'unselected'>('indeterminate')
        return (
          <Named
            label="Additions"
            isSelected={false}
            isIndeterminate={state === 'indeterminate'}
            onChange={() => setState('unselected')}
          />
        )
      }
      render(
        <Scheme>
          <Additions />
        </Scheme>,
      )
      await userEvent.click(pressed('Additions'))
      await settle()
      expect(getComputedStyle(marks('Additions')).opacity).toBe('0')
      expect(getComputedStyle(marks('Additions').querySelector('rect')!).rotate).toBe('0deg')
    })
  })

  describe('state layer', () => {
    it('is the 40dp host, tinted on-surface at 8% while an unselected checkbox is hovered', async () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      const layer = stateLayer('Pickles')
      expect(getComputedStyle(layer).opacity).toBe('0')
      await userEvent.hover(pressed('Pickles'))
      await settle()
      const style = getComputedStyle(layer)
      expect(style.opacity).toBe('0.08')
      expect(style.backgroundColor).toBe(color('on-surface', layer))
      expect(rectIn(layer, 'Pickles')).toEqual([0, 0, 40, 40])
    })

    it.each([
      ['unselected', {}, 'on-surface', 'primary'],
      ['selected', { defaultSelected: true }, 'primary', 'on-surface'],
      ['indeterminate', { isIndeterminate: true }, 'primary', 'on-surface'],
      ['invalid', { isInvalid: true }, 'error', 'error'],
    ] as const)(
      'tints the hover and focus layer of a %s checkbox with one role and its press ripple with another',
      async (_, state, hover, press) => {
        render(
          <Scheme>
            <Named label="Pickles" {...state} />
          </Scheme>,
        )
        const layer = stateLayer('Pickles')
        expect(getComputedStyle(layer).backgroundColor).toBe(color(hover, layer))
        const ripple = await whilePressed(
          'Pickles',
          async () => {
            await settle()
            const circle = host('Pickles').querySelector<HTMLElement>('.opacity-state-pressed')!
            return getComputedStyle(circle).backgroundColor
          },
          'checkbox',
        )
        expect(ripple).toBe(color(press, layer))
      },
    )

    it('is hidden, with no ripple, when disabled', async () => {
      render(
        <Scheme>
          <Named label="Pickles" isDisabled />
        </Scheme>,
      )
      await userEvent.hover(pressed('Pickles'))
      await settle()
      expect(getComputedStyle(stateLayer('Pickles')).opacity).toBe('0')
      const circles = await whilePressed(
        'Pickles',
        () => host('Pickles').querySelectorAll('.opacity-state-pressed').length,
        'checkbox',
      )
      expect(circles).toBe(0)
    })
  })

  describe('focus ring', () => {
    it('is a 3px secondary outline 2px outside the round host, on keyboard focus only', async () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      const el = host('Pickles')
      expect(getComputedStyle(el).outlineStyle).toBe('none')

      await userEvent.tab()
      expect(document.activeElement).toBe(input('Pickles'))
      const ring = getComputedStyle(el)
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
      expect(ring.outlineOffset).toBe('2px')
      expect(ring.outlineColor).toBe(color('secondary', el))
      // Around the host only: the label around it has none.
      expect(getComputedStyle(pressed('Pickles')).outlineStyle).toBe('none')
      await settle()
      expect(getComputedStyle(stateLayer('Pickles')).opacity).toBe('0.1')
    })

    it('is not drawn when the checkbox is only clicked, which focuses it too', async () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      await userEvent.click(pressed('Pickles'))
      expect(document.activeElement).toBe(input('Pickles'))
      expect(pressed('Pickles')).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(host('Pickles')).outlineStyle).toBe('none')
      await settle()
      expect(getComputedStyle(stateLayer('Pickles')).opacity).toBe('0.08')
    })
  })

  describe('keyboard', () => {
    it('is reached with Tab, in order, toggled by Space, not Enter, and keeps focus', async () => {
      render(
        <Scheme>
          <Named label="Pickles" />
          <Named label="Tomato" defaultSelected />
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(input('Pickles'))
      await userEvent.keyboard(' ')
      expect(checked('Pickles')).toBe(true)
      await userEvent.keyboard('{Enter}')
      expect(checked('Pickles')).toBe(true)
      await userEvent.keyboard(' ')
      expect(checked('Pickles')).toBe(false)
      expect(document.activeElement).toBe(input('Pickles'))

      await userEvent.tab()
      expect(document.activeElement).toBe(input('Tomato'))
      await userEvent.keyboard(' ')
      expect(checked('Tomato')).toBe(false)
    })
  })

  describe('with label text', () => {
    it('draws the text after the host in the label, in on-surface, and greys it when disabled', () => {
      render(
        <Scheme>
          <Checkbox>
            <span>Pickles</span>
          </Checkbox>
          <Checkbox isDisabled>
            <span>Tomato</span>
          </Checkbox>
        </Scheme>,
      )
      const text = screen.getByText('Pickles')
      expect(pressed('Pickles')).toContainElement(text)
      expect(text.getBoundingClientRect().left).toBe(host('Pickles').getBoundingClientRect().right)
      expect(getComputedStyle(text).color).toBe(color('on-surface', text))
      const disabled = screen.getByText('Tomato')
      expect(rgba(getComputedStyle(disabled).color)[3] / 255).toBeCloseTo(0.38, 1)
    })

    it('toggles on a click on the text, and shows the pointer over it', async () => {
      render(
        <Scheme>
          <Checkbox>
            <span>Pickles</span>
          </Checkbox>
        </Scheme>,
      )
      const text = screen.getByText('Pickles')
      expect(getComputedStyle(text).cursor).toBe('pointer')
      await userEvent.click(text)
      await settle()
      expect(checked('Pickles')).toBe(true)
      expect(getComputedStyle(box('Pickles')).backgroundColor).toBe(
        color('primary', box('Pickles')),
      )
      expect(document.activeElement).toBe(input('Pickles'))
      expect(getComputedStyle(host('Pickles')).outlineStyle).toBe('none')
    })
  })

  describe('contrast', () => {
    /* WCAG 1.4.11: the outline and the marks are graphical objects, so each
     * needs 3:1 against what is behind it: the surface, or the filled box. */
    it.each(schemes)(
      'keeps the outline and marks at 3:1 or more, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Named label="Off" />
            <Named label="On" defaultSelected />
            <Named label="Error off" isInvalid />
            <Named label="Error on" isInvalid defaultSelected />
          </Scheme>,
        )
        const surface = getComputedStyle(schemeOf(box('Off'))).backgroundColor
        const below: string[] = []
        for (const name of ['Off', 'Error off']) {
          if (contrastRatio(getComputedStyle(box(name)).borderTopColor, surface) < 3)
            below.push(name)
        }
        for (const name of ['On', 'Error on']) {
          const fill = getComputedStyle(box(name)).backgroundColor
          const mark = getComputedStyle(marks(name).querySelector('rect')!).fill
          if (contrastRatio(mark, fill) < 3) below.push(`${name} marks`)
          if (contrastRatio(fill, surface) < 3) below.push(`${name} fill`)
        }
        expect(below).toEqual([])
      },
    )
  })

  describe('motion', () => {
    it('cross-fades the box colors over a short-2, and the marks in over a short-1 and out over a short-2', () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
        </Scheme>,
      )
      const short1 = '0.05s'
      const short2 = '0.1s'
      const linear = computedStyleOf('ease-linear', (style) => style.transitionTimingFunction)
      const boxStyle = getComputedStyle(box('Off'))
      expect(boxStyle.transitionProperty).toContain('background-color')
      expect(boxStyle.transitionProperty).toContain('border-color')
      expect(boxStyle.transitionDuration.startsWith(short2)).toBe(true)
      expect(boxStyle.transitionTimingFunction.startsWith(linear)).toBe(true)
      expect(getComputedStyle(marks('On')).transitionProperty).toBe('opacity')
      expect(getComputedStyle(marks('On')).transitionDuration).toBe(short1)
      expect(getComputedStyle(marks('Off')).transitionDuration).toBe(short2)
    })

    it('draws a freshly selected mark arm by arm, over two short-1s in a row', async () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      await userEvent.click(pressed('Pickles'))
      const [short, long] = [...marks('Pickles').querySelectorAll('rect')].map((rect) =>
        getComputedStyle(rect),
      )
      expect(short!.animationName).toBe('checkbox-mark-draw')
      expect(short!.animationDuration).toBe('0.05s')
      expect(short!.animationDelay).toBe('0s')
      expect(long!.animationName).toBe('checkbox-mark-draw')
      expect(long!.animationDelay).toBe('0.05s')
      expect(short!.transitionProperty).toBe('none')
    })

    it('morphs the marks between the check and the dash over a short-2, not when disabled', async () => {
      function Parent({ isDisabled }: { isDisabled?: boolean }) {
        const [all, setAll] = useState(false)
        return (
          <Named
            label={isDisabled ? 'Disabled' : 'Additions'}
            isSelected={all}
            isIndeterminate={!all}
            isDisabled={isDisabled}
            onChange={setAll}
          />
        )
      }
      render(
        <Scheme>
          <Parent />
          <Parent isDisabled />
        </Scheme>,
      )
      await userEvent.click(pressed('Additions'))
      const arm = getComputedStyle(marks('Additions').querySelector('rect')!)
      expect(arm.transitionProperty).toBe('transform, translate, scale, rotate')
      expect(arm.transitionDuration).toBe('0.1s')
      expect(getComputedStyle(marks('Disabled').querySelector('rect')!).transitionProperty).toBe(
        'none',
      )
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles every transition and the draw instantly', async () => {
        render(
          <Scheme>
            <Named label="Pickles" />
          </Scheme>,
        )
        await userEvent.click(pressed('Pickles'))
        const durations = [
          ...getComputedStyle(box('Pickles')).transitionDuration.split(', '),
          getComputedStyle(marks('Pickles')).transitionDuration,
          ...[...marks('Pickles').querySelectorAll('rect')].map(
            (rect) => getComputedStyle(rect).animationDuration,
          ),
        ]
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe('browser defaults', () => {
    it('leaves nothing of the browser on the label or the host, and shows a pointer over it', () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      const label = getComputedStyle(pressed('Pickles'))
      expect(label.cursor).toBe('pointer')
      expect(label.userSelect).toBe('none')
      expect(label.getPropertyValue('-webkit-tap-highlight-color')).toBe('rgba(0, 0, 0, 0)')
      const style = getComputedStyle(host('Pickles'))
      expect(rgba(style.backgroundColor)[3]).toBe(0)
      expect(style.outlineStyle).toBe('none')
      expect(style.touchAction).toBe('manipulation')
      expect(style.borderTopWidth).toBe('0px')
      expect(style.paddingTop).toBe('0px')
      expect(style.marginTop).toBe('0px')
      // The input is for assistive technology and the keyboard: in a clipped pixel, never seen.
      const hidden = input('Pickles').parentElement!
      const rect = hidden.getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([1, 1])
      expect(getComputedStyle(hidden).clipPath).toBe('inset(50%)')
    })

    it('shows the default cursor over a disabled checkbox', () => {
      render(
        <Scheme>
          <Named label="Pickles" isDisabled />
        </Scheme>,
      )
      expect(getComputedStyle(pressed('Pickles')).cursor).toBe('default')
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('outlines an unselected box in CanvasText and fills a selected one with Highlight, invalid or not', () => {
      render(
        <Scheme>
          <Named label="Off" />
          <Named label="On" defaultSelected />
          <Named label="Some" isIndeterminate />
          <Named label="Error" isInvalid defaultSelected />
        </Scheme>,
      )
      const scheme = schemeOf(box('Off'))
      expect(getComputedStyle(box('Off')).borderTopColor).toBe(computedColor('CanvasText', scheme))
      for (const name of ['On', 'Some', 'Error']) {
        expect(getComputedStyle(box(name)).backgroundColor).toBe(computedColor('Highlight', scheme))
        expect(rgba(getComputedStyle(box(name)).borderTopColor)[3]).toBe(0)
        expect(getComputedStyle(marks(name).querySelector('rect')!).fill).toBe(
          computedColor('HighlightText', scheme),
        )
      }
    })

    it('greys out a disabled box, selected or not, and its label text', () => {
      render(
        <Scheme>
          <Named label="Off" isDisabled />
          <Named label="On" isDisabled defaultSelected />
          <Named label="Some" isDisabled isIndeterminate />
          <Checkbox isDisabled>
            <span>Tomato</span>
          </Checkbox>
        </Scheme>,
      )
      const scheme = schemeOf(box('Off'))
      const grayText = computedColor('GrayText', scheme)
      expect(rgba(getComputedStyle(box('Off')).borderTopColor).slice(0, 3)).toEqual(
        rgba(grayText).slice(0, 3),
      )
      for (const name of ['On', 'Some']) {
        expect(getComputedStyle(box(name)).backgroundColor).toBe(grayText)
        expect(getComputedStyle(marks(name).querySelector('rect')!).fill).toBe(
          computedColor('Canvas', scheme),
        )
      }
      expect(getComputedStyle(screen.getByText('Tomato')).color).toBe(grayText)
    })

    it('still shows the focus ring', async () => {
      render(
        <Scheme>
          <Named label="Pickles" />
        </Scheme>,
      )
      await userEvent.tab()
      const ring = getComputedStyle(host('Pickles'))
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
    })
  })
})
