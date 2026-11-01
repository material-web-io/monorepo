import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { Text } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  button,
  computedColor,
  computedRadius,
  contrastOf,
  expectNoNativeStyling,
  expectOnlyPendingIndicator,
  Scheme,
  schemeOf,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import type { Except } from '../../lib/aria'
import { Icon } from '../icon'
import { Fab } from './fab'

/*
 * Everything that needs a real browser and the real stylesheet: colors,
 * corners, elevation, size of the target, color contrast, keyboard use, the
 * focus outline, motion and forced colors. Behavior jsdom can check without a
 * stylesheet - attributes, accessible names, DOM structure, events - is in
 * fab.test.tsx instead.
 */

const colors = [
  'primary-container',
  'secondary-container',
  'tertiary-container',
  'primary',
  'secondary',
  'tertiary',
] as const
const sizes = ['baseline', 'medium', 'large'] as const

/** An icon-only FAB, named by its color so a failure says which one. */
function Named({
  label,
  ...props
}: { label: string } & Pick<
  ComponentProps<typeof Fab>,
  'color' | 'size' | 'isDisabled' | 'isPending' | 'className'
>) {
  return (
    <Fab aria-label={label} {...props}>
      <Icon name="add" />
    </Fab>
  )
}

/** An extended FAB, whose label is also its name. */
function Extended(
  props: Except<ComponentProps<typeof Fab>, 'children' | 'aria-label'> & { label: string },
) {
  const { label, ...rest } = props
  return (
    <Fab {...rest}>
      <Icon name="add" />
      <Text slot="label">{label}</Text>
    </Fab>
  )
}

describe('Fab accessibility in a browser', () => {
  describe('contrast', () => {
    // WCAG 1.4.11: the icon is a graphical object, so it needs 3:1 against the container.
    it.each(schemes)(
      'keeps the icon at 3:1 or more against its container, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            {colors.map((color) => (
              <Named key={color} label={color} color={color} />
            ))}
          </Scheme>,
        )

        const fabs = screen.getAllByRole('button')
        const below = fabs
          .map((el) => ({ name: el.getAttribute('aria-label'), ratio: contrastOf(el) }))
          .filter(({ ratio }) => ratio < 3)

        expect(fabs).toHaveLength(6)
        expect(below).toEqual([])
      },
    )
  })

  describe('extended contrast', () => {
    // WCAG 1.4.3: the label is text, so it needs 4.5:1 against the container.
    it.each(schemes)(
      'keeps the label at 4.5:1 or more against its container, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            {colors.map((color) => (
              <Extended key={color} label={color} color={color} />
            ))}
          </Scheme>,
        )

        const fabs = screen.getAllByRole('button')
        const below = fabs
          .map((el) => ({ name: el.textContent, ratio: contrastOf(el) }))
          .filter(({ ratio }) => ratio < 4.5)

        expect(fabs).toHaveLength(6)
        expect(below).toEqual([])
      },
    )
  })

  describe('colors', () => {
    it.each([
      [
        'primary-container',
        '--md-sys-color-primary-container',
        '--md-sys-color-on-primary-container',
      ],
      [
        'secondary-container',
        '--md-sys-color-secondary-container',
        '--md-sys-color-on-secondary-container',
      ],
      [
        'tertiary-container',
        '--md-sys-color-tertiary-container',
        '--md-sys-color-on-tertiary-container',
      ],
      ['primary', '--md-sys-color-primary', '--md-sys-color-on-primary'],
      ['secondary', '--md-sys-color-secondary', '--md-sys-color-on-secondary'],
      ['tertiary', '--md-sys-color-tertiary', '--md-sys-color-on-tertiary'],
    ] as const)('fills the %s FAB with its container and icon colors', (color, bg, fg) => {
      render(
        <Scheme>
          <Named label="Create" color={color} />
        </Scheme>,
      )
      const el = button('Create')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(computedColor(`var(${bg})`, el))
      expect(style.color).toBe(computedColor(`var(${fg})`, el))
    })

    it('colors an extended FAB the same as an icon-only one', () => {
      render(
        <Scheme>
          <Extended label="Compose" color="tertiary" />
        </Scheme>,
      )
      const el = button('Compose')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(computedColor('var(--md-sys-color-tertiary)', el))
      expect(style.color).toBe(computedColor('var(--md-sys-color-on-tertiary)', el))
    })

    it('overrides the default fill with a custom class, without dropping the rest', () => {
      render(
        <Scheme>
          <Named label="Create" className="bg-error" />
        </Scheme>,
      )
      const el = button('Create')
      expect(getComputedStyle(el).backgroundColor).toBe(
        computedColor('var(--md-sys-color-error)', el),
      )
    })
  })

  describe('shape', () => {
    it.each([
      ['baseline', 'rounded-shape-lg'],
      ['medium', 'rounded-shape-lg-inc'],
      ['large', 'rounded-shape-xl'],
    ] as const)('gives a %s FAB its corner', (size, corner) => {
      render(
        <Scheme>
          <Named label="Create" size={size} />
        </Scheme>,
      )
      expect(getComputedStyle(button('Create')).borderRadius).toBe(computedRadius(corner))
    })

    it('gives an extended FAB the same corner as an icon-only one', () => {
      render(
        <Scheme>
          <Extended label="Compose" size="medium" />
        </Scheme>,
      )
      expect(getComputedStyle(button('Compose')).borderRadius).toBe(
        computedRadius('rounded-shape-lg-inc'),
      )
    })

    it('is still square when its label renders nothing', () => {
      // A conditional label that is off, which React drops at render time.
      const labelled = false
      render(
        <Scheme>
          <Named label="Icon only" />
          <Fab aria-label="Create">
            <Icon name="add" />
            {labelled && <Text slot="label">Compose</Text>}
          </Fab>
        </Scheme>,
      )
      expect(button('Create').getBoundingClientRect().width).toBe(
        button('Icon only').getBoundingClientRect().width,
      )
    })
  })

  describe('keyboard', () => {
    it('reaches each FAB in order with Tab, and skips a disabled one', async () => {
      render(
        <Scheme>
          <Named label="Create" />
          <Named label="Compose" isDisabled />
          <Named label="Share" />
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Create'))
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Share'))
      await userEvent.tab({ shift: true })
      expect(document.activeElement).toBe(button('Create'))
    })
  })

  describe('focus ring', () => {
    it('is a 3px outline in the secondary color, 2px outside, when focused with the keyboard', async () => {
      render(
        <Scheme>
          <Named label="Create" />
        </Scheme>,
      )
      const el = button('Create')
      expect(getComputedStyle(el).outlineStyle).toBe('none')

      await userEvent.tab()
      const ring = getComputedStyle(el)
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
      expect(ring.outlineOffset).toBe('2px')
      expect(ring.outlineColor).toBe(computedColor('var(--md-sys-color-secondary)', el))
    })

    it('is drawn on every size', async () => {
      render(
        <Scheme>
          {sizes.map((size) => (
            <Named key={size} label={size} size={size} />
          ))}
        </Scheme>,
      )
      for (const size of sizes) {
        await userEvent.tab()
        expect(document.activeElement, size).toBe(button(size))
        expect(getComputedStyle(button(size)).outlineStyle, size).toBe('solid')
      }
    })

    it('is not drawn when the FAB is only clicked', async () => {
      render(
        <Scheme>
          <Named label="Create" />
        </Scheme>,
      )
      await userEvent.click(button('Create'))
      expect(document.activeElement).toBe(button('Create'))
      expect(getComputedStyle(button('Create')).outlineStyle).toBe('none')
    })
  })

  describe('icon size', () => {
    it.each([
      ['baseline', 24],
      ['medium', 28],
      ['large', 36],
    ] as const)('draws the icon in a %s FAB at %ipx', (size, px) => {
      render(
        <Scheme>
          <Named label="Create" size={size} />
        </Scheme>,
      )
      const rect = button('Create').querySelector('.font-icon')!.getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })

    it.each([
      ['baseline', 24],
      ['medium', 28],
      ['large', 36],
    ] as const)('draws the icon in a %s extended FAB at %ipx too', (size, px) => {
      render(
        <Scheme>
          <Extended label="Compose" size={size} />
        </Scheme>,
      )
      const rect = button('Compose').querySelector('.font-icon')!.getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })
  })

  describe('type', () => {
    it.each(sizes)('sets any text in a %s FAB as its label is', (size) => {
      render(
        <Scheme>
          <Fab size={size} aria-label="Create">
            <span>Plain</span>
            <Text slot="label">Label</Text>
          </Fab>
        </Scheme>,
      )
      const plain = getComputedStyle(screen.getByText('Plain'))
      const label = getComputedStyle(screen.getByText('Label'))
      for (const property of [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'lineHeight',
        'letterSpacing',
        'whiteSpace',
      ] as const) {
        expect(plain[property]).toBe(label[property])
      }
      expect(plain.whiteSpace).toBe('nowrap')
    })
  })

  describe('motion', () => {
    const slotOf = (el: Element) => el.querySelector<HTMLElement>('[slot="label"]')!.parentElement!
    // A snapped measurement gets its transition back a frame on, and React renders that a frame later.
    const frames = async (count: number) => {
      for (let i = 0; i < count; i++) await new Promise((resolve) => requestAnimationFrame(resolve))
    }
    const transitionsOn = (el: Element) =>
      el.getAnimations().map((animation) => (animation as CSSTransition).transitionProperty)
    // The box of an element's text, without its padding.
    const textOf = (el: Element) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      return range.getBoundingClientRect()
    }

    it('spring-transitions its padding, and its color and shadow, on their own timings', () => {
      render(
        <Scheme>
          <Named label="Create" />
        </Scheme>,
      )
      const style = getComputedStyle(button('Create'))
      const springs = ['fast-spatial', 'fast-effects', 'fast-effects', 'fast-effects']
      expect(style.transitionProperty).toBe('padding, background-color, color, box-shadow')
      expect(style.transitionDuration).toBe(springs.map(springDuration).join(', '))
      expect(style.transitionTimingFunction).toBe(springs.map(springEasing).join(', '))
    })

    it.each([
      ['baseline', 56],
      ['medium', 80],
      ['large', 96],
    ] as const)(
      'keeps the extended padding while collapsed, so a %s FAB is %ipx wide from its content alone with the icon centered',
      async (size, px) => {
        render(
          <Scheme>
            <Fab aria-label="Create" size={size} isExtended={false}>
              <Icon name="add" />
              <Text slot="label">Compose</Text>
            </Fab>
          </Scheme>,
        )
        await settle()
        const el = button('Create')
        const box = el.getBoundingClientRect()
        const icon = el.querySelector('.font-icon')!.getBoundingClientRect()
        expect(box.width).toBe(px)
        expect(icon.left - box.left).toBeCloseTo(box.right - icon.right, 1)
        expect(getComputedStyle(el).minWidth).toBe('0px')
      },
    )

    it('pulls the label slot back under the trailing edge, and hides the label, while collapsed', async () => {
      render(
        <Scheme>
          <Extended label="Compose" aria-label="Create" isExtended={false} />
        </Scheme>,
      )
      await settle()
      const slot = slotOf(button('Create'))
      const label = slot.firstElementChild!
      const style = getComputedStyle(slot)
      expect(parseFloat(style.marginInlineEnd)).toBeCloseTo(-slot.getBoundingClientRect().width, 1)
      expect(getComputedStyle(label).opacity).toBe('0')
      expect(getComputedStyle(label).visibility).toBe('hidden')
    })

    it('shows the label as soon as it starts to fade in, as the shape starts to change', async () => {
      const fab = (extended: boolean) => (
        <Scheme>
          <Extended label="Compose" aria-label="Create" isExtended={extended} />
        </Scheme>
      )
      const { rerender } = render(fab(false))
      await settle()
      const label = screen.getByText('Compose')
      rerender(fab(true))
      await frames(2)
      // Shown at once: only its opacity transitions.
      const fades = label.getAnimations()
      expect(fades.map((fade) => (fade as CSSTransition).transitionProperty)).toEqual(['opacity'])
      // Held 1ms into the fade: shown already, though barely opaque.
      for (const fade of fades) {
        fade.pause()
        fade.currentTime = 1
      }
      expect(getComputedStyle(label).visibility).toBe('visible')
      expect(parseFloat(getComputedStyle(label).opacity)).toBeLessThan(0.5)
      for (const fade of fades) fade.play()
      await settle()
      expect(getComputedStyle(label).opacity).toBe('1')
    })

    it('hides the label at once with an ancestor hidden, starting no transition', async () => {
      render(
        <Scheme>
          <div data-testid="ancestor">
            <Extended label="Compose" />
          </div>
        </Scheme>,
      )
      await settle()
      const label = screen.getByText('Compose')
      screen.getByTestId('ancestor').style.visibility = 'hidden'
      expect(getComputedStyle(label).visibility).toBe('hidden')
      expect(label.getAnimations()).toEqual([])
    })

    it('holds the label slot at its own width, flush with the padding, when there is a label', async () => {
      render(
        <Scheme>
          <Extended label="Compose" />
        </Scheme>,
      )
      await settle()
      const el = button('Compose')
      const slot = slotOf(el)
      const label = slot.firstElementChild!
      expect(slot.getBoundingClientRect().width).toBeCloseTo(label.getBoundingClientRect().width, 1)
      expect(getComputedStyle(slot).marginInlineEnd).toBe('0px')
      expect(getComputedStyle(label).opacity).toBe('1')
      expect(getComputedStyle(label).visibility).toBe('visible')
      // Padding, icon and slot add up to the width, the slot carrying the gap: no slack, no clipping.
      const icon = el.querySelector('.font-icon')!.getBoundingClientRect()
      expect(el.getBoundingClientRect().width).toBeCloseTo(
        32 + icon.width + slot.getBoundingClientRect().width,
        1,
      )
      expect(textOf(label).left - icon.right).toBeCloseTo(8, 1)
    })

    it('holds the label slot at the label’s laid-out width when mounted in a scaled element, as a dialog scaling in', async () => {
      render(
        <Scheme>
          <div style={{ scale: 0.5 }}>
            <Extended label="Compose" />
          </div>
        </Scheme>,
      )
      await settle()
      const slot = slotOf(button('Compose'))
      const label = slot.firstElementChild!
      expect(slot.getBoundingClientRect().width).toBeCloseTo(label.getBoundingClientRect().width, 1)
    })

    it('draws what a function returns for the state React Aria reports, the button’s own padding included', async () => {
      render(
        <Scheme>
          <Fab size="large" aria-label="Create">
            {({ isHovered }) => (
              <>
                <Icon name="add" />
                {isHovered && <Text slot="label">Compose</Text>}
              </>
            )}
          </Fab>
        </Scheme>,
      )
      const el = button('Create')
      // The pointer may rest where an earlier test left it, which may be here.
      await userEvent.unhover(el)
      await settle()
      // Icon-only, a large FAB keeps its icon 30dp from each edge; extended, 28dp.
      expect(getComputedStyle(el).paddingInlineStart).toBe('30px')
      expect(el.getBoundingClientRect().width).toBe(96)
      await userEvent.hover(el)
      await settle()
      expect(getComputedStyle(el).paddingInlineStart).toBe('28px')
      const slot = slotOf(el)
      const label = slot.firstElementChild!
      expect(label.textContent).toBe('Compose')
      expect(slot.getBoundingClientRect().width).toBeCloseTo(label.getBoundingClientRect().width, 1)
      expect(getComputedStyle(slot).marginInlineEnd).toBe('0px')
      expect(getComputedStyle(label).opacity).toBe('1')
    })

    it('fades the label out instead of dropping it when it collapses back to an icon', async () => {
      const { rerender } = render(
        <Fab>
          <Icon name="add" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      const slot = slotOf(screen.getByRole('button'))
      const label = slot.firstElementChild!
      expect(label).toHaveTextContent('Compose')
      // Past the frames a first measurement holds the slot's transitions off for.
      await frames(2)

      rerender(
        <Fab aria-label="Create" isExtended={false}>
          <Icon name="add" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      const after = screen.getByRole('button')
      // Still there to fade, but out of the accessible name now that it is collapsed.
      expect(label).toHaveTextContent('Compose')
      expect(label).toHaveAttribute('aria-hidden', 'true')
      expect(after).toHaveAccessibleName('Create')
      // Shown while it fades, and hidden once it has.
      expect(getComputedStyle(label).visibility).toBe('visible')
      await settle()
      expect(getComputedStyle(label).opacity).toBe('0')
      expect(getComputedStyle(label).visibility).toBe('hidden')
      expect(parseFloat(getComputedStyle(slot).marginInlineEnd)).toBeCloseTo(
        -slot.getBoundingClientRect().width,
        1,
      )
      expect(after.getBoundingClientRect().width).toBe(56)
    })

    // Compose's extended FAB is lerp(56dp, its full width, the spring), its gap from the icon
    // inside the label's row: the whole difference moves together, with no step at either end.
    it.each([
      ['extending', false, true],
      ['collapsing', true, false],
    ])(
      'springs the gap with the label, %s, so its width moves on one spring from end to end',
      async (_, from, to) => {
        const fab = (extended: boolean) => (
          <Scheme>
            <Extended label="Compose" aria-label="Create" isExtended={extended} />
          </Scheme>
        )
        const { rerender } = render(fab(true))
        await settle()
        const el = button('Create')
        const full = el.getBoundingClientRect().width
        rerender(fab(from))
        await settle()
        const slot = slotOf(el)
        const slide = () =>
          slot
            .getAnimations()
            .find((a) => (a as CSSTransition).transitionProperty === 'margin-right')!
        rerender(fab(to))
        slide().pause()
        // The share of the label's slot still showing, which is what the spring has got to.
        const shown = () =>
          1 +
          parseFloat(getComputedStyle(slot).marginInlineEnd) / slot.getBoundingClientRect().width
        for (const ms of [0, 17, 50, 100, 133, 200, 300, 359]) {
          slide().currentTime = ms
          expect(el.getBoundingClientRect().width - 56).toBeCloseTo((full - 56) * shown(), 1)
        }
        slide().finish()
        expect(el.getBoundingClientRect().width).toBeCloseTo(to ? full : 56, 1)
      },
    )

    it('sizes itself by `extended` alone, with the same icon-and-label children either way', () => {
      render(
        <Scheme>
          <Fab aria-label="Collapsed" isExtended={false}>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
          <Fab isExtended>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
        </Scheme>,
      )
      // Named by aria-label while collapsed, by its own label once expanded.
      expect(button('Collapsed').getBoundingClientRect().width).toBe(56)
      expect(button('Compose').getBoundingClientRect().width).toBeGreaterThan(56)
    })

    it('stays a square FAB with no label, whatever `extended` is', () => {
      render(
        <Scheme>
          <Fab aria-label="Create" isExtended>
            <Icon name="add" />
          </Fab>
        </Scheme>,
      )
      expect(button('Create').getBoundingClientRect().width).toBe(56)
    })

    it('draws a label with no icon without the gap from one, flush with the padding', () => {
      render(
        <Scheme>
          <Fab>
            <Text slot="label">Compose</Text>
          </Fab>
        </Scheme>,
      )
      const box = button('Compose').getBoundingClientRect()
      const label = textOf(screen.getByText('Compose'))
      expect(label.left - box.left).toBeCloseTo(16, 1)
      expect(box.width).toBeCloseTo(32 + label.width, 1)
    })

    it('keeps the label’s type and its gap from the icon while hidden, so nothing snaps as it fades', () => {
      render(
        <Scheme>
          <Fab aria-label="Collapsed" isExtended={false}>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
          <Fab isExtended>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
        </Scheme>,
      )
      const hidden = getComputedStyle(button('Collapsed').querySelector('[slot="label"]')!)
      const shown = getComputedStyle(button('Compose').querySelector('[slot="label"]')!)
      for (const property of [
        'fontWeight',
        'fontSize',
        'letterSpacing',
        'width',
        'paddingInlineStart',
      ] as const) {
        expect(hidden[property]).toBe(shown[property])
      }
      expect(shown.fontWeight).toBe('500')
      // The gap is the label's padding, so it is pulled under the trailing edge with it.
      expect(shown.paddingInlineStart).toBe('8px')
      expect(button('Collapsed').getBoundingClientRect().width).toBe(56)
    })

    it('spring-transitions the label slot on the spatial spring, and its fade on the effects spring', async () => {
      const { rerender } = render(
        <Scheme>
          <Extended label="Compose" />
        </Scheme>,
      )
      await frames(2)
      const slot = slotOf(button('Compose'))
      const label = slot.firstElementChild!
      const slotStyle = getComputedStyle(slot)
      expect(slotStyle.transitionProperty).toBe('width, margin-inline-end')
      expect(slotStyle.transitionDuration).toBe(
        Array(2).fill(springDuration('fast-spatial')).join(', '),
      )
      expect(slotStyle.transitionTimingFunction).toBe(
        Array(2).fill(springEasing('fast-spatial')).join(', '),
      )

      const labelStyle = getComputedStyle(label)
      expect(labelStyle.transitionProperty).toBe('opacity')
      expect(labelStyle.transitionDuration).toBe(springDuration('fast-effects'))
      expect(labelStyle.transitionTimingFunction).toBe(springEasing('fast-effects'))

      // Collapsed, its visibility runs out with its fade, linear.
      rerender(
        <Scheme>
          <Extended label="Compose" isExtended={false} />
        </Scheme>,
      )
      expect(labelStyle.transitionProperty).toBe('opacity, visibility')
      expect(labelStyle.transitionDuration).toBe(
        [springDuration('fast-effects'), springDuration('fast-effects')].join(', '),
      )
      expect(labelStyle.transitionTimingFunction).toBe(`${springEasing('fast-effects')}, linear`)
    })

    it('snaps the slot to its measured width at mount, extended or collapsed, starting no transition', async () => {
      render(
        <Scheme>
          <Fab aria-label="Collapsed" isExtended={false}>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
          <Fab isExtended>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
        </Scheme>,
      )
      const collapsed = slotOf(button('Collapsed'))
      const shown = slotOf(button('Compose'))
      expect(transitionsOn(collapsed)).toEqual([])
      expect(transitionsOn(shown)).toEqual([])
      // Snapped, not merely not yet started: the slot is at its width right away.
      expect(collapsed.getBoundingClientRect().width).toBeCloseTo(
        collapsed.firstElementChild!.getBoundingClientRect().width,
        1,
      )
      await frames(2)
      expect(transitionsOn(collapsed)).toEqual([])
      expect(transitionsOn(shown)).toEqual([])
      expect(getComputedStyle(collapsed).transitionProperty).toBe('width, margin-inline-end')
      expect(getComputedStyle(shown).transitionProperty).toBe('width, margin-inline-end')
    })

    it('shows itself at full width at once when first laid out, such as after mounting hidden, instead of springing there', async () => {
      const { container } = render(
        <div style={{ display: 'none' }}>
          <Extended label="Compose" />
        </div>,
      )
      const hidden = container.firstElementChild as HTMLElement
      const el = screen.getByRole('button', { hidden: true })
      const slot = slotOf(el)
      await frames(2)
      hidden.style.display = ''
      // ResizeObserver reports the real size a frame on; the correction must then already be in place.
      await frames(2)
      expect(transitionsOn(slot)).toEqual([])
      const width = el.getBoundingClientRect().width
      expect(slot.getBoundingClientRect().width).toBeCloseTo(
        slot.firstElementChild!.getBoundingClientRect().width,
        1,
      )
      await settle()
      expect(el.getBoundingClientRect().width).toBe(width)
      expect(getComputedStyle(slot).transitionProperty).toBe('width, margin-inline-end')
    })

    it('springs the slot to the width of a label that changes', async () => {
      const { rerender } = render(
        <Scheme>
          <Extended label="Compose" />
        </Scheme>,
      )
      const slot = slotOf(button('Compose'))
      const before = slot.getBoundingClientRect().width
      rerender(
        <Scheme>
          <Extended label="Compose a message" />
        </Scheme>,
      )
      expect(transitionsOn(slot)).toContain('width')
      await settle()
      const after = slot.getBoundingClientRect().width
      expect(after).toBeGreaterThan(before)
      expect(after).toBeCloseTo(slot.firstElementChild!.getBoundingClientRect().width, 1)
    })

    it('fades the label in and out as the shape starts to change, in neither direction delayed', () => {
      render(
        <Scheme>
          <Fab aria-label="Collapsed" isExtended={false}>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
          <Fab isExtended>
            <Icon name="add" />
            <Text slot="label">Compose</Text>
          </Fab>
        </Scheme>,
      )
      for (const name of ['Collapsed', 'Compose']) {
        const label = button(name).querySelector('[slot="label"]')!
        expect(getComputedStyle(label).transitionDelay).toBe('0s')
        expect(getComputedStyle(label.parentElement!).transitionDelay).toBe('0s')
      }
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles every spring instantly', () => {
        render(
          <Scheme>
            <Named label="Create" />
          </Scheme>,
        )
        const durations = getComputedStyle(button('Create')).transitionDuration.split(', ')
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe('target size', () => {
    // Every size is well above the 48dp minimum, at any density.
    it.each([
      ['baseline', 56],
      ['medium', 80],
      ['large', 96],
    ] as const)('draws a %s FAB %ipx square, even at the densest setting', (size, px) => {
      render(
        <Scheme density="-3">
          <Named label="Create" size={size} />
        </Scheme>,
      )
      const rect = button('Create').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })
  })

  describe('extended target size', () => {
    it.each([
      ['baseline', 56],
      ['medium', 80],
      ['large', 96],
    ] as const)('is %ipx tall for a %s extended FAB, and wide enough for its label', (size, px) => {
      render(
        <Scheme density="-3">
          <Extended label="Compose" size={size} />
          <Extended label="Compose a much longer message" size={size} />
        </Scheme>,
      )
      const [short, long] = screen.getAllByRole('button').map((el) => el.getBoundingClientRect())
      expect(short!.height).toBe(px)
      expect(long!.height).toBe(px)
      expect(short!.width).toBeGreaterThan(px)
      expect(long!.width).toBeGreaterThan(short!.width)
    })

    it('keeps the label on one line, and the icon and label inside the container', () => {
      render(
        <Scheme>
          <Extended label="Compose a message" />
        </Scheme>,
      )
      const el = button('Compose a message')
      const box = el.getBoundingClientRect()
      const icon = el.querySelector('.font-icon')!.getBoundingClientRect()
      expect(box.height).toBe(56)
      expect(icon.left).toBe(box.left + 16)
      expect(box.right - 16).toBeGreaterThan(icon.right)
    })
  })

  describe('elevation', () => {
    // Tailwind's shadow-none is a stack of zero-size shadows, not `none`, so look for any size.
    const visible = (el: Element) => /[1-9]\d*px/.test(getComputedStyle(el).boxShadow)

    it('has a shadow at rest, and none when disabled', () => {
      render(
        <Scheme>
          <Named label="Create" />
          <Named label="Disabled" isDisabled />
        </Scheme>,
      )
      expect(visible(button('Create'))).toBe(true)
      expect(visible(button('Disabled'))).toBe(false)
    })

    it('lifts to a taller shadow on hover', async () => {
      render(
        <Scheme>
          <Named label="Create" />
        </Scheme>,
      )
      const rest = getComputedStyle(button('Create')).boxShadow
      await userEvent.hover(button('Create'))
      expect(getComputedStyle(button('Create')).boxShadow).not.toBe(rest)
    })
  })

  describe('pending', () => {
    it.each(colors)('keeps the colors of a %s FAB and shows the progress cursor', (color) => {
      render(
        <Scheme>
          <Named label="Create" color={color} />
          <Named label="Creating" color={color} isPending />
        </Scheme>,
      )
      const enabled = getComputedStyle(button('Create'))
      const pending = getComputedStyle(button('Creating'))
      expect(pending.backgroundColor).toBe(enabled.backgroundColor)
      expect(pending.color).toBe(enabled.color)
      expect(pending.boxShadow).toBe(enabled.boxShadow)
      expect(enabled.cursor).toBe('pointer')
      expect(pending.cursor).toBe('progress')
    })

    // 1.5 times its icon, over the icon and the label of an extended FAB alike.
    it.each([
      ['baseline', 36],
      ['medium', 42],
      ['large', 54],
    ] as const)('shows its loading indicator alone at size %s, %idp across', (size, px) => {
      render(
        <Scheme>
          <Named label="Create" size={size} />
          <Named label="Creating" size={size} isPending />
          <Extended label="Compose" size={size} />
          <Extended label="Compose" size={size} isPending />
        </Scheme>,
      )
      expectOnlyPendingIndicator(button('Creating'), button('Create'), px)
      const [extended, pending] = screen.getAllByRole('button', { name: 'Compose' })
      expectOnlyPendingIndicator(pending!, extended!, px)
    })
  })

  describe('browser defaults', () => {
    it('leaves none of the native button styling on a FAB, or an extended one', () => {
      render(
        <Scheme>
          <Named label="Create" />
          <Fab isExtended>
            <Icon name="edit" />
            <Text slot="label">Compose</Text>
          </Fab>
        </Scheme>,
      )
      expectNoNativeStyling(button('Create'))
      expectNoNativeStyling(button('Compose'))
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('gives every color a ButtonText border, since the fill and shadow are dropped', () => {
      render(
        <Scheme>
          {colors.map((color) => (
            <Named key={color} label={color} color={color} />
          ))}
        </Scheme>,
      )
      const buttonText = computedColor('ButtonText', schemeOf(button('primary')))
      for (const color of colors) {
        const style = getComputedStyle(button(color))
        expect(style.borderTopWidth, color).toBe('1px')
        expect(style.borderTopStyle, color).toBe('solid')
        expect(style.borderTopColor, color).toBe(buttonText)
      }
    })

    it('greys out a disabled FAB', () => {
      render(
        <Scheme>
          <Named label="Create" isDisabled />
        </Scheme>,
      )
      const grayText = computedColor('GrayText', schemeOf(button('Create')))
      expect(getComputedStyle(button('Create')).borderTopColor).toBe(grayText)
    })

    it('still shows the focus outline', async () => {
      render(
        <Scheme>
          <Named label="Create" />
        </Scheme>,
      )
      await userEvent.tab()
      const ring = getComputedStyle(button('Create'))
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
    })
  })
})
