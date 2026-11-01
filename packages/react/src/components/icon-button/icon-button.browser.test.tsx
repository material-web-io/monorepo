import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  button,
  computedColor,
  computedRadius,
  contrastOf,
  contrastRatio,
  expectHitArea,
  expectNoNativeStyling,
  expectOnlyPendingIndicator,
  ringWidth,
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
import type { Except } from '../../lib/aria'
import { Icon } from '../icon'
import { IconButton, type IconButtonProps } from './icon-button'

/*
 * Everything that needs a real browser and the real stylesheet: colors, ring
 * width, size, corners (resting and pressed), contrast, keyboard use, the
 * focus outline, the 48dp hit area, motion and forced colors. Behavior jsdom
 * can check without a stylesheet - attributes, accessible names, DOM
 * structure, events - is in icon-button.test.tsx instead.
 */

const variants = ['filled', 'tonal', 'outlined', 'standard'] as const
const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

/**
 * A button, named by its variant and state so a failure says which one: React Aria's Button, or
 * its ToggleButton given `isSelectable`. `Except`, not `Omit`, so that union of props stays one.
 */
function Named({
  label,
  ...props
}: Except<IconButtonProps, 'aria-label' | 'children'> & { label: string }) {
  return (
    <IconButton aria-label={label} {...props}>
      <Icon name="favorite" />
    </IconButton>
  )
}

describe('IconButton accessibility in a browser', () => {
  describe('contrast', () => {
    /*
     * WCAG 1.4.11: the icon is a graphical object, so it needs 3:1 against what
     * is behind it. That is the container, or the surface when it has none. A
     * disabled button is exempt.
     */
    it.each(schemes)(
      'keeps the icon at 3:1 or more against its container, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            {variants.flatMap((variant) => [
              <Named key={`${variant}-plain`} label={`${variant} plain`} variant={variant} />,
              <Named
                key={`${variant}-off`}
                label={`${variant} off`}
                variant={variant}
                isSelectable
                isSelected={false}
              />,
              <Named
                key={`${variant}-on`}
                label={`${variant} on`}
                variant={variant}
                isSelectable
                isSelected
              />,
            ])}
          </Scheme>,
        )

        const buttons = screen.getAllByRole('button')
        const below = buttons
          .map((el) => ({ name: el.getAttribute('aria-label'), ratio: contrastOf(el) }))
          .filter(({ ratio }) => ratio < 3)

        expect(buttons).toHaveLength(12)
        expect(below).toEqual([])
      },
    )

    it('measures a real difference, so the check above cannot pass by reading nothing', () => {
      expect(contrastRatio('rgb(0, 0, 0)', 'rgb(255, 255, 255)')).toBeCloseTo(21, 5)
      expect(contrastRatio('rgb(119, 119, 119)', 'rgb(119, 119, 119)')).toBe(1)
    })
  })

  describe('colors', () => {
    it.each([
      ['filled', '--md-sys-color-primary', '--md-sys-color-on-primary'],
      ['tonal', '--md-sys-color-secondary-container', '--md-sys-color-on-secondary-container'],
      ['outlined', null, '--md-sys-color-on-surface-variant'],
      ['standard', null, '--md-sys-color-on-surface-variant'],
    ] as const)('fills the %s variant with its container and icon colors', (variant, bg, fg) => {
      render(
        <Scheme>
          <Named label="Favorite" variant={variant} />
        </Scheme>,
      )
      const el = button('Favorite')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(
        bg ? computedColor(`var(${bg})`, el) : computedColor('transparent', el),
      )
      expect(style.color).toBe(computedColor(`var(${fg})`, el))
    })

    it('overrides the default fill with a custom class, without dropping the rest', () => {
      render(
        <Scheme>
          <Named label="Favorite" variant="filled" className="bg-tertiary" />
        </Scheme>,
      )
      const el = button('Favorite')
      expect(getComputedStyle(el).backgroundColor).toBe(
        computedColor('var(--md-sys-color-tertiary)', el),
      )
    })
  })

  describe('ring', () => {
    it('has no ring except on an outlined button', () => {
      render(
        <Scheme>
          {variants.map((variant) => (
            <Named key={variant} label={variant} variant={variant} />
          ))}
        </Scheme>,
      )
      for (const variant of variants) {
        expect(ringWidth(button(variant)), variant).toBe(variant === 'outlined' ? 1 : 0)
      }
    })

    it('thickens the ring on large and extra-large outlined buttons', () => {
      render(
        <Scheme>
          {sizes.map((size) => (
            <Named key={size} label={size} variant="outlined" size={size} />
          ))}
        </Scheme>,
      )
      for (const size of sizes) {
        expect(ringWidth(button(size)), size).toBe(size === 'l' || size === 'xl' ? 2 : 1)
      }
    })
  })

  describe('sizing', () => {
    it.each([
      ['xs', 'narrow', 28],
      ['xs', 'default', 32],
      ['xs', 'wide', 40],
      ['s', 'narrow', 32],
      ['s', 'default', 40],
      ['s', 'wide', 52],
      ['m', 'narrow', 48],
      ['m', 'default', 56],
      ['m', 'wide', 72],
      ['l', 'narrow', 64],
      ['l', 'default', 96],
      ['l', 'wide', 128],
      ['xl', 'narrow', 104],
      ['xl', 'default', 136],
      ['xl', 'wide', 184],
    ] as const)('gives a %s %s button a %ipx width', (size, width, px) => {
      render(
        <Scheme>
          <Named label="Favorite" size={size} width={width} />
        </Scheme>,
      )
      expect(button('Favorite').getBoundingClientRect().width).toBe(px)
    })

    it.each([
      ['xs', 32],
      ['s', 40],
      ['m', 56],
      ['l', 96],
      ['xl', 136],
    ] as const)('gives a %s button a %ipx height', (size, px) => {
      render(
        <Scheme>
          <Named label="Favorite" size={size} />
        </Scheme>,
      )
      expect(button('Favorite').getBoundingClientRect().height).toBe(px)
    })
  })

  describe('shape', () => {
    it('is a full pill by default, half its own height', () => {
      render(
        <Scheme>
          <Named label="Favorite" />
        </Scheme>,
      )
      const el = button('Favorite')
      expect(getComputedStyle(el).borderRadius).toBe(`${el.getBoundingClientRect().height / 2}px`)
    })

    // The height is the icon and the padding around it, and the radius half of the two.
    it.each([
      ['xs', '0', 32],
      ['s', '0', 40],
      ['m', '0', 56],
      ['l', '0', 96],
      ['xl', '0', 136],
      ['xs', '-2', 24],
      ['s', '-2', 32],
      ['m', '-1', 52],
      ['xl', '-3', 124],
    ] as const)(
      'is a full pill at %s and density %s, half of the %ipx its padding makes it',
      (size, density, height) => {
        render(
          <Scheme density={density}>
            <Named label="Favorite" size={size} />
          </Scheme>,
        )
        const el = button('Favorite')
        expect(el.getBoundingClientRect().height).toBe(height)
        expect(getComputedStyle(el).borderRadius).toBe(`${height / 2}px`)
      },
    )

    it.each([
      ['xs', 'rounded-shape-md'],
      ['s', 'rounded-shape-md'],
      ['m', 'rounded-shape-lg'],
      ['l', 'rounded-shape-xl'],
      ['xl', 'rounded-shape-xl'],
    ] as const)('gives a square %s button its resting corner', (size, corner) => {
      render(
        <Scheme>
          <Named label="Favorite" size={size} shape="square" />
        </Scheme>,
      )
      expect(getComputedStyle(button('Favorite')).borderRadius).toBe(computedRadius(corner))
    })

    it.each([
      ['xs', 'rounded-shape-sm'],
      ['s', 'rounded-shape-sm'],
      ['m', 'rounded-shape-md'],
      ['l', 'rounded-shape-lg'],
      ['xl', 'rounded-shape-lg'],
    ] as const)(
      'morphs a square %s button to its pressed corner, and back at rest',
      async (size, corner) => {
        render(
          <Scheme>
            <Named label="Favorite" size={size} shape="square" hasShapeMorph />
          </Scheme>,
        )
        const rest = getComputedStyle(button('Favorite')).borderRadius
        const pressed = await whilePressed('Favorite', async () => {
          await settle()
          return getComputedStyle(button('Favorite')).borderRadius
        })
        expect(pressed).toBe(computedRadius(corner))
        await settle()
        expect(getComputedStyle(button('Favorite')).borderRadius).toBe(rest)
      },
    )

    it('gives a round button the same pressed corner as a square one of the same size', async () => {
      render(
        <Scheme>
          <Named label="Round" size="l" shape="round" hasShapeMorph />
          <Named label="Square" size="l" shape="square" hasShapeMorph />
        </Scheme>,
      )
      const cornerOf = (name: string) =>
        whilePressed(name, async () => {
          await settle()
          return getComputedStyle(button(name)).borderRadius
        })
      expect(await cornerOf('Round')).toBe(await cornerOf('Square'))
    })

    it('keeps its resting corner when pressed unless shapeMorph is on', async () => {
      render(
        <Scheme>
          <Named label="Favorite" />
        </Scheme>,
      )
      const rest = getComputedStyle(button('Favorite')).borderRadius
      const pressed = await whilePressed('Favorite', async () => {
        await settle()
        return getComputedStyle(button('Favorite')).borderRadius
      })
      expect(pressed).toBe(rest)
    })
  })

  describe('toggle shape and color', () => {
    it('swaps a round button to square when selected, and a square one to round', () => {
      render(
        <Scheme>
          <Named label="Round off" isSelectable isSelected={false} />
          <Named label="Round on" isSelectable isSelected />
          <Named label="Square off" shape="square" isSelectable isSelected={false} />
          <Named label="Square on" shape="square" isSelectable isSelected />
        </Scheme>,
      )
      const half = (name: string) => `${button(name).getBoundingClientRect().height / 2}px`
      expect(getComputedStyle(button('Round off')).borderRadius).toBe(half('Round off'))
      expect(getComputedStyle(button('Round on')).borderRadius).toBe(
        computedRadius('rounded-shape-md'),
      )
      expect(getComputedStyle(button('Square off')).borderRadius).toBe(
        computedRadius('rounded-shape-md'),
      )
      expect(getComputedStyle(button('Square on')).borderRadius).toBe(half('Square on'))
    })

    it('has the same pressed corner selected as unselected, since only the resting shape swaps', async () => {
      render(
        <Scheme>
          <Named label="Off" size="m" isSelectable isSelected={false} hasShapeMorph />
          <Named label="On" size="m" isSelectable isSelected hasShapeMorph />
        </Scheme>,
      )
      const cornerOf = (name: string) =>
        whilePressed(name, async () => {
          await settle()
          return getComputedStyle(button(name)).borderRadius
        })
      // Sequential: only one real pointer exists, so two presses can't overlap.
      const off = await cornerOf('Off')
      const on = await cornerOf('On')
      expect(off).toBe(computedRadius('rounded-shape-md'))
      expect(off).toBe(on)
    })

    it.each([
      ['filled', false, '--md-sys-color-surface-container-highest', '--md-sys-color-primary'],
      ['filled', true, '--md-sys-color-primary', '--md-sys-color-on-primary'],
      [
        'tonal',
        false,
        '--md-sys-color-secondary-container',
        '--md-sys-color-on-secondary-container',
      ],
      ['tonal', true, '--md-sys-color-secondary', '--md-sys-color-on-secondary'],
      ['outlined', false, null, '--md-sys-color-on-surface-variant'],
      ['outlined', true, '--md-sys-color-inverse-surface', '--md-sys-color-inverse-on-surface'],
      ['standard', false, null, '--md-sys-color-on-surface-variant'],
      ['standard', true, null, '--md-sys-color-primary'],
    ] as const)('colors a %s toggle, selected: %s', (variant, selected, bg, fg) => {
      render(
        <Scheme>
          <Named label="Favorite" variant={variant} isSelectable isSelected={selected} />
        </Scheme>,
      )
      const el = button('Favorite')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(
        bg ? computedColor(`var(${bg})`, el) : computedColor('transparent', el),
      )
      expect(style.color).toBe(computedColor(`var(${fg})`, el))
    })

    it('rings an unselected outlined toggle but not a selected one', () => {
      render(
        <Scheme>
          <Named label="Off" variant="outlined" isSelectable isSelected={false} />
          <Named label="On" variant="outlined" isSelectable isSelected />
        </Scheme>,
      )
      expect(ringWidth(button('Off'))).toBe(1)
      expect(ringWidth(button('On'))).toBe(0)
    })
  })

  describe('disabled', () => {
    /** A role at one of the opacity tokens, mixed as Tailwind writes a color modifier. */
    const mixed = (name: string, token: string, el: Element) =>
      computedColor(
        `color-mix(in oklab, var(--md-sys-color-${name}) calc(var(--md-sys-state-${token}-opacity) * 100%), transparent)`,
        el,
      )

    // Its icon is on-surface at 38%, and its container on-surface at 12%, or none where an outlined
    // or standard one has none; a selected outlined toggle keeps its container, greyed.
    it.each([
      ['filled', 'plain', true],
      ['filled', 'off', true],
      ['filled', 'on', true],
      ['tonal', 'plain', true],
      ['tonal', 'off', true],
      ['tonal', 'on', true],
      ['outlined', 'plain', false],
      ['outlined', 'off', false],
      ['outlined', 'on', true],
      ['standard', 'plain', false],
      ['standard', 'off', false],
      ['standard', 'on', false],
    ] as const)('greys out a disabled %s button (%s)', (variant, state, container) => {
      render(
        <Scheme>
          {state === 'plain' ? (
            <Named label="Favorite" variant={variant} isDisabled />
          ) : (
            <Named
              label="Favorite"
              variant={variant}
              isSelectable
              isSelected={state === 'on'}
              isDisabled
            />
          )}
        </Scheme>,
      )
      const el = button('Favorite')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(
        container
          ? mixed('on-surface', 'disabled-container', el)
          : computedColor('transparent', el),
      )
      expect(style.color).toBe(mixed('on-surface', 'disabled-content', el))
    })
  })

  describe('pending', () => {
    it.each(variants)(
      'keeps the colors of a %s button and shows the progress cursor',
      (variant) => {
        render(
          <Scheme>
            <Named label="Send" variant={variant} />
            <Named label="Sending" variant={variant} isPending />
          </Scheme>,
        )
        const enabled = getComputedStyle(button('Send'))
        const pending = getComputedStyle(button('Sending'))
        expect(pending.backgroundColor).toBe(enabled.backgroundColor)
        expect(pending.color).toBe(enabled.color)
        expect(enabled.cursor).toBe('pointer')
        expect(pending.cursor).toBe('progress')
      },
    )

    // 1.5 times its icon.
    it.each([
      ['xs', 30],
      ['s', 36],
      ['m', 36],
      ['l', 48],
      ['xl', 60],
    ] as const)('shows its loading indicator alone at size %s, %idp across', (size, px) => {
      render(
        <Scheme>
          <Named label="Send" size={size} />
          <Named label="Sending" size={size} isPending />
        </Scheme>,
      )
      expectOnlyPendingIndicator(button('Sending'), button('Send'), px)
    })

    it.each(variants.flatMap((variant) => [[variant, false] as const, [variant, true] as const]))(
      'keeps the colors of a %s toggle button, selected %s, and shows its loading indicator alone',
      (variant, isSelected) => {
        render(
          <Scheme>
            <Named label="Like" variant={variant} size="m" isSelectable isSelected={isSelected} />
            <Named
              label="Liking"
              variant={variant}
              size="m"
              isSelectable
              isSelected={isSelected}
              isPending
            />
          </Scheme>,
        )
        const enabled = getComputedStyle(button('Like'))
        const pending = getComputedStyle(button('Liking'))
        expect(pending.backgroundColor).toBe(enabled.backgroundColor)
        expect(pending.color).toBe(enabled.color)
        expect(pending.borderRadius).toBe(enabled.borderRadius)
        expect(enabled.cursor).toBe('pointer')
        expect(pending.cursor).toBe('progress')
        expectOnlyPendingIndicator(button('Liking'), button('Like'), 36)
      },
    )
  })

  describe('keyboard', () => {
    it('reaches each button in order with Tab, and skips a disabled one', async () => {
      render(
        <Scheme>
          <Named label="Undo" />
          <Named label="Redo" isDisabled />
          <Named label="Save" />
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Undo'))
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Save'))
      await userEvent.tab({ shift: true })
      expect(document.activeElement).toBe(button('Undo'))
    })

    it('is activated by both Space and Enter, and keeps focus while it toggles', async () => {
      function Favorite() {
        const [on, setOn] = useState(false)
        return <Named label="Favorite" isSelectable isSelected={on} onChange={setOn} />
      }
      render(
        <Scheme>
          <Favorite />
        </Scheme>,
      )

      await userEvent.tab()
      expect(button('Favorite')).toHaveAttribute('aria-pressed', 'false')
      await userEvent.keyboard(' ')
      expect(button('Favorite')).toHaveAttribute('aria-pressed', 'true')
      await userEvent.keyboard('{Enter}')
      expect(button('Favorite')).toHaveAttribute('aria-pressed', 'false')
      expect(document.activeElement).toBe(button('Favorite'))
    })
  })

  describe('focus ring', () => {
    it('is a 3px outline in the secondary color, 2px outside, when focused with the keyboard', async () => {
      render(
        <Scheme>
          <Named label="Favorite" />
        </Scheme>,
      )
      const el = button('Favorite')
      expect(getComputedStyle(el).outlineStyle).toBe('none')

      await userEvent.tab()
      const ring = getComputedStyle(el)
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
      expect(ring.outlineOffset).toBe('2px')
      expect(ring.outlineColor).toBe(computedColor('var(--md-sys-color-secondary)', el))
    })

    it('is drawn on every color style, and on a square button of every size', async () => {
      const names = [...variants, ...sizes.map((size) => `square ${size}`)]
      render(
        <Scheme>
          {variants.map((variant) => (
            <Named key={variant} label={variant} variant={variant} />
          ))}
          {sizes.map((size) => (
            <Named key={size} label={`square ${size}`} size={size} shape="square" />
          ))}
        </Scheme>,
      )
      for (const name of names) {
        await userEvent.tab()
        expect(document.activeElement, name).toBe(button(name))
        expect(getComputedStyle(button(name)).outlineStyle, name).toBe('solid')
      }
    })

    it('is drawn on a selected toggle too', async () => {
      render(
        <Scheme>
          <Named label="Favorite" isSelectable isSelected />
        </Scheme>,
      )
      await userEvent.tab()
      expect(getComputedStyle(button('Favorite')).outlineStyle).toBe('solid')
    })

    it('is not drawn when the button is only clicked', async () => {
      render(
        <Scheme>
          <Named label="Favorite" />
        </Scheme>,
      )
      await userEvent.click(button('Favorite'))
      expect(document.activeElement).toBe(button('Favorite'))
      expect(getComputedStyle(button('Favorite')).outlineStyle).toBe('none')
    })

    it('is drawn in the secondary color of the dark scheme too', async () => {
      render(
        <Scheme theme="dark">
          <Named label="Favorite" />
        </Scheme>,
      )
      await userEvent.tab()
      const el = button('Favorite')
      expect(getComputedStyle(el).outlineColor).toBe(
        computedColor('var(--md-sys-color-secondary)', el),
      )
    })
  })

  describe('motion', () => {
    it('spring-transitions shape on its own timing, and color together on theirs', () => {
      render(
        <Scheme>
          <Named label="Favorite" />
        </Scheme>,
      )
      const style = getComputedStyle(button('Favorite'))
      const springs = ['fast-spatial', 'fast-effects', 'fast-effects']
      expect(style.transitionProperty).toBe('border-radius, background-color, color')
      expect(style.transitionDuration).toBe(springs.map(springDuration).join(', '))
      expect(style.transitionTimingFunction).toBe(springs.map(springEasing).join(', '))
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles every spring instantly', () => {
        render(
          <Scheme>
            <Named label="Favorite" />
          </Scheme>,
        )
        const durations = getComputedStyle(button('Favorite')).transitionDuration.split(', ')
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe('icon size', () => {
    it.each([
      ['xs', 20],
      ['s', 24],
      ['m', 24],
      ['l', 32],
      ['xl', 40],
    ] as const)('draws the icon in a %s button at %ipx', (size, px) => {
      render(
        <Scheme>
          <Named label="Add" size={size} />
        </Scheme>,
      )
      const rect = screen.getByText('favorite').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })
  })

  describe('touch target', () => {
    /*
     * The visual size is unchanged, and a click up to 48dp across still lands on
     * the button: the hit area is real, not just a declared style.
     */
    it.each([
      ['xs', 'default', '0', 32, 32],
      ['xs', 'narrow', '0', 28, 32],
      ['s', 'default', '0', 40, 40],
      ['s', 'wide', '0', 52, 40],
      ['m', 'narrow', '0', 48, 56],
      ['xs', 'default', '-3', 32, 20],
      ['s', 'default', '-3', 40, 28],
    ] as const)(
      'gives a %s %s button at density %s, drawn %ipx by %ipx, a hit area of at least 48dp',
      (size, width, density, drawnWidth, drawnHeight) => {
        render(
          <Scheme density={density}>
            <Named label="Favorite" size={size} width={width} />
          </Scheme>,
        )
        const el = button('Favorite')
        const rect = el.getBoundingClientRect()
        expect([rect.width, rect.height]).toEqual([drawnWidth, drawnHeight])

        expectHitArea(el)
      },
    )
  })

  describe('browser defaults', () => {
    it.each(variants)('leaves none of the native button styling on a %s icon button', (variant) => {
      render(
        <Scheme>
          <Named label="Favorite" variant={variant} />
        </Scheme>,
      )
      // Its own padding: 8dp above and below a small button's icon.
      expectNoNativeStyling(button('Favorite'), 8)
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('gives every button with a container a ButtonText border, and a standard one none', () => {
      render(
        <Scheme>
          {variants.map((variant) => (
            <Named key={variant} label={variant} variant={variant} />
          ))}
        </Scheme>,
      )
      const buttonText = computedColor('ButtonText', schemeOf(button('filled')))
      for (const variant of variants) {
        const style = getComputedStyle(button(variant))
        if (variant === 'standard') {
          expect(style.borderTopWidth, variant).toBe('0px')
        } else {
          expect(style.borderTopWidth, variant).toBe('1px')
          expect(style.borderTopStyle, variant).toBe('solid')
          expect(style.borderTopColor, variant).toBe(buttonText)
        }
        // The border is around the padding, so a button with one is 1dp taller above and below.
        expect(button(variant).getBoundingClientRect().height, variant).toBe(
          variant === 'standard' ? 40 : 42,
        )
        // Its radius is the same half of the icon and the padding.
        expect(style.borderRadius, variant).toBe('20px')
      }
    })

    it('fills a selected toggle with Highlight so it differs from an unselected one', () => {
      render(
        <Scheme>
          {variants.flatMap((variant) => [
            <Named
              key={`${variant}-off`}
              label={`${variant} off`}
              variant={variant}
              isSelectable
              isSelected={false}
            />,
            <Named
              key={`${variant}-on`}
              label={`${variant} on`}
              variant={variant}
              isSelectable
              isSelected
            />,
          ])}
        </Scheme>,
      )
      const scheme = schemeOf(button('filled off'))
      const highlight = computedColor('Highlight', scheme)
      const highlightText = computedColor('HighlightText', scheme)

      for (const variant of variants) {
        const off = getComputedStyle(button(`${variant} off`))
        const on = getComputedStyle(button(`${variant} on`))
        expect(on.backgroundColor, `${variant} on`).toBe(highlight)
        expect(on.color, `${variant} on`).toBe(highlightText)
        expect(off.backgroundColor, `${variant} off`).not.toBe(highlight)
        expect(off.backgroundColor, variant).not.toBe(on.backgroundColor)
      }
    })

    it('draws the icon in the text color of its button, so it shows on the Highlight fill', () => {
      render(
        <Scheme>
          <Named label="Favorite" variant="standard" isSelectable isSelected />
        </Scheme>,
      )
      const el = button('Favorite')
      const highlightText = computedColor('HighlightText', schemeOf(el))
      expect(getComputedStyle(el.querySelector('.font-icon')!).color).toBe(highlightText)
    })

    it('greys out a disabled button, selected or not', () => {
      render(
        <Scheme>
          <Named label="off" variant="tonal" isDisabled />
          <Named label="on" variant="tonal" isSelectable isSelected isDisabled />
          <Named label="standard" variant="standard" isDisabled />
        </Scheme>,
      )
      const scheme = schemeOf(button('off'))
      const grayText = computedColor('GrayText', scheme)
      const canvas = computedColor('Canvas', scheme)

      expect(getComputedStyle(button('off')).borderTopColor).toBe(grayText)
      expect(getComputedStyle(button('on')).borderTopColor).toBe(grayText)
      expect(getComputedStyle(button('on')).backgroundColor).toBe(grayText)
      expect(getComputedStyle(button('on')).color).toBe(canvas)
      expect(getComputedStyle(button('standard')).borderTopWidth).toBe('0px')
    })

    it('still shows the focus outline', async () => {
      render(
        <Scheme>
          <Named label="Favorite" />
        </Scheme>,
      )
      await userEvent.tab()
      const ring = getComputedStyle(button('Favorite'))
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
    })
  })
})
