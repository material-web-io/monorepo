import { render, screen } from '@testing-library/react'
import { useState, type ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  button,
  computedColor,
  computedRadius,
  computedStyleOf,
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
import { Icon } from '../icon'
import { Button } from './button'

/*
 * Everything that needs a real browser and the real stylesheet: colors, ring
 * width, type scale, corners (resting and pressed), contrast, keyboard use,
 * the focus outline, the 48dp hit area, motion and forced colors. Behavior
 * jsdom can check without a stylesheet - attributes, accessible names, DOM
 * structure, events - is in button.test.tsx instead.
 */

const variants = ['elevated', 'filled', 'tonal', 'outlined', 'text'] as const
/** A text button is not a toggle. */
const toggleVariants = ['elevated', 'filled', 'tonal', 'outlined'] as const
const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

type ButtonProps = ComponentProps<typeof Button>

/**
 * A button named by its label, which is also its text, plus an optional
 * ligature `icon` shorthand so call sites read like the old `icon` prop did.
 * React Aria's Button: a toggle's props are left to `Toggle`.
 */
function Plain({
  label,
  icon,
  ...props
}: Omit<Extract<ButtonProps, { isSelectable?: false }>, 'children'> & {
  label: string
  icon?: string
}) {
  return icon ? (
    <Button {...props}>
      <Icon name={icon} />
      {label}
    </Button>
  ) : (
    <Button {...props}>{label}</Button>
  )
}

/** React Aria's ToggleButton, given `isSelectable`; it takes no text variant, which `Plain` may carry. */
function Toggle({
  label,
  icon,
  ...props
}: Omit<Extract<ButtonProps, { isSelectable: true }>, 'children' | 'isSelectable'> & {
  label: string
  icon?: string
}) {
  return icon ? (
    <Button {...props} isSelectable>
      <Icon name={icon} />
      {label}
    </Button>
  ) : (
    <Button {...props} isSelectable>
      {label}
    </Button>
  )
}

describe('Button accessibility in a browser', () => {
  describe('contrast', () => {
    /*
     * WCAG 1.4.3: the label is text at 14px, which is not large text, so it
     * needs 4.5:1 against what is behind it. That is the container, or the
     * surface when it has none. The icon has the same color, and needs only 3:1.
     * A disabled button is exempt.
     */
    it.each(schemes)(
      'keeps the label at 4.5:1 or more against its container, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            {variants.map((variant) => (
              <Plain key={variant} label={`${variant} plain`} variant={variant} icon="favorite" />
            ))}
            {toggleVariants.flatMap((variant) => [
              <Toggle
                key={`${variant}-off`}
                label={`${variant} off`}
                variant={variant}
                isSelected={false}
                icon="favorite"
              />,
              <Toggle
                key={`${variant}-on`}
                label={`${variant} on`}
                variant={variant}
                isSelected
                icon="favorite"
              />,
            ])}
          </Scheme>,
        )

        const buttons = screen.getAllByRole('button')
        const below = buttons
          .map((el) => ({ name: el.textContent, ratio: contrastOf(el) }))
          .filter(({ ratio }) => ratio < 4.5)

        expect(buttons).toHaveLength(13)
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
      ['elevated', '--md-sys-color-surface-container-low', '--md-sys-color-primary'],
      ['filled', '--md-sys-color-primary', '--md-sys-color-on-primary'],
      ['tonal', '--md-sys-color-secondary-container', '--md-sys-color-on-secondary-container'],
      ['outlined', null, '--md-sys-color-on-surface-variant'],
      ['text', null, '--md-sys-color-primary'],
    ] as const)('fills the %s variant with its container and label colors', (variant, bg, fg) => {
      render(
        <Scheme>
          <Plain label="Save" variant={variant} />
        </Scheme>,
      )
      const el = button('Save')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(
        bg ? computedColor(`var(${bg})`, el) : computedColor('transparent', el),
      )
      expect(style.color).toBe(computedColor(`var(${fg})`, el))
    })

    it('has a shadow at rest only when elevated', () => {
      render(
        <Scheme>
          <Plain label="Elevated" variant="elevated" />
          <Plain label="Filled" variant="filled" />
        </Scheme>,
      )
      // Tailwind's shadow-none is a stack of zero-size shadows, not `none`, so look for any size.
      const visible = (el: Element) => /[1-9]\d*px/.test(getComputedStyle(el).boxShadow)
      expect(visible(button('Elevated'))).toBe(true)
      expect(visible(button('Filled'))).toBe(false)
    })

    it('overrides the default fill with a custom class, without dropping the rest', () => {
      render(
        <Scheme>
          <Plain label="Save" className="bg-tertiary" />
        </Scheme>,
      )
      const el = button('Save')
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
            <Plain key={variant} label={variant} variant={variant} />
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
            <Plain key={size} label={size} variant="outlined" size={size} />
          ))}
        </Scheme>,
      )
      for (const size of sizes) {
        expect(ringWidth(button(size)), size).toBe(size === 'l' || size === 'xl' ? 2 : 1)
      }
    })
  })

  describe('type scale', () => {
    it.each([
      ['xs', 'text-label-lg'],
      ['s', 'text-label-lg'],
      ['m', 'text-title-md'],
      ['l', 'text-headline-sm'],
      ['xl', 'text-headline-lg'],
    ] as const)('gives a %s button the %s type scale', (size, type) => {
      render(
        <Scheme>
          <Plain label="Save" size={size} />
        </Scheme>,
      )
      const style = getComputedStyle(button('Save'))
      expect(style.fontSize).toBe(computedStyleOf(type, (s) => s.fontSize))
      expect(style.lineHeight).toBe(computedStyleOf(type, (s) => s.lineHeight))
    })
  })

  describe('shape', () => {
    it('is a full pill by default, half its own height', () => {
      render(
        <Scheme>
          <Plain label="Save" />
        </Scheme>,
      )
      const el = button('Save')
      expect(getComputedStyle(el).borderRadius).toBe(`${el.getBoundingClientRect().height / 2}px`)
    })

    // The height is the label's line and the padding around it, and the radius half of the two.
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
      'is a full pill at %s and density %s, half of the %ipx its padding makes it, with an icon too',
      (size, density, height) => {
        render(
          <Scheme density={density}>
            <Plain label="Save" size={size} />
            <Plain label="Add" size={size} icon="add" />
          </Scheme>,
        )
        for (const el of [button('Save'), button('Add')]) {
          expect(el.getBoundingClientRect().height).toBe(height)
          expect(getComputedStyle(el).borderRadius).toBe(`${height / 2}px`)
        }
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
          <Plain label="Save" size={size} shape="square" />
        </Scheme>,
      )
      expect(getComputedStyle(button('Save')).borderRadius).toBe(computedRadius(corner))
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
            <Plain label="Save" size={size} shape="square" hasShapeMorph />
          </Scheme>,
        )
        const rest = getComputedStyle(button('Save')).borderRadius
        const pressed = await whilePressed('Save', async () => {
          await settle()
          return getComputedStyle(button('Save')).borderRadius
        })
        expect(pressed).toBe(computedRadius(corner))
        await settle()
        expect(getComputedStyle(button('Save')).borderRadius).toBe(rest)
      },
    )

    it('gives a round button the same pressed corner as a square one of the same size', async () => {
      render(
        <Scheme>
          <Plain label="Round" size="l" shape="round" hasShapeMorph />
          <Plain label="Square" size="l" shape="square" hasShapeMorph />
        </Scheme>,
      )
      const cornerOf = (name: string) =>
        whilePressed(name, async () => {
          await settle()
          return getComputedStyle(button(name)).borderRadius
        })
      expect(await cornerOf('Round')).toBe(await cornerOf('Square'))
    })

    it('lets a text button morph when pressed, though it can never be a toggle', async () => {
      render(
        <Scheme>
          <Plain label="Save" variant="text" hasShapeMorph />
        </Scheme>,
      )
      const pressed = await whilePressed('Save', async () => {
        await settle()
        return getComputedStyle(button('Save')).borderRadius
      })
      expect(pressed).toBe(computedRadius('rounded-shape-sm'))
    })

    it('keeps its resting corner when pressed unless shapeMorph is on', async () => {
      render(
        <Scheme>
          <Plain label="Save" />
        </Scheme>,
      )
      const rest = getComputedStyle(button('Save')).borderRadius
      const pressed = await whilePressed('Save', async () => {
        await settle()
        return getComputedStyle(button('Save')).borderRadius
      })
      expect(pressed).toBe(rest)
    })
  })

  describe('toggle shape and color', () => {
    it('swaps a round button to square when selected, and a square one to round', () => {
      render(
        <Scheme>
          <Toggle label="Round off" isSelected={false} />
          <Toggle label="Round on" isSelected />
          <Toggle label="Square off" shape="square" isSelected={false} />
          <Toggle label="Square on" shape="square" isSelected />
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

    it('has the same pressed corner isSelected as unselected, since only the resting shape swaps', async () => {
      render(
        <Scheme>
          <Toggle label="Off" size="m" isSelected={false} hasShapeMorph />
          <Toggle label="On" size="m" isSelected hasShapeMorph />
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
      ['elevated', false, '--md-sys-color-surface-container-low', '--md-sys-color-primary'],
      ['elevated', true, '--md-sys-color-primary', '--md-sys-color-on-primary'],
      ['filled', false, '--md-sys-color-surface-container', '--md-sys-color-on-surface-variant'],
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
    ] as const)('colors a %s toggle, selected: %s', (variant, selected, bg, fg) => {
      render(
        <Scheme>
          <Toggle label="Save" variant={variant} isSelected={selected} />
        </Scheme>,
      )
      const el = button('Save')
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(
        bg ? computedColor(`var(${bg})`, el) : computedColor('transparent', el),
      )
      expect(style.color).toBe(computedColor(`var(${fg})`, el))
    })

    it('rings an unselected outlined toggle but not a isSelected one', () => {
      render(
        <Scheme>
          <Toggle label="Off" variant="outlined" isSelected={false} />
          <Toggle label="On" variant="outlined" isSelected />
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
    const expectGreyed = (el: Element, container: boolean) => {
      const style = getComputedStyle(el)
      expect(style.backgroundColor).toBe(
        container
          ? mixed('on-surface', 'disabled-container', el)
          : computedColor('transparent', el),
      )
      expect(style.color).toBe(mixed('on-surface', 'disabled-content', el))
    }

    // Its label is on-surface at 38%, and its container on-surface at 12%, or none where an
    // outlined or text one has none.
    it.each([
      ['elevated', true],
      ['filled', true],
      ['tonal', true],
      ['outlined', false],
      ['text', false],
    ] as const)('greys out a disabled %s button', (variant, container) => {
      render(
        <Scheme>
          <Plain label="Save" variant={variant} isDisabled />
        </Scheme>,
      )
      expectGreyed(button('Save'), container)
    })

    // A selected outlined toggle keeps its container, greyed.
    it.each([
      ['elevated', false, true],
      ['elevated', true, true],
      ['filled', false, true],
      ['filled', true, true],
      ['tonal', false, true],
      ['tonal', true, true],
      ['outlined', false, false],
      ['outlined', true, true],
    ] as const)(
      'greys out a disabled %s toggle, selected: %s',
      (variant, isSelected, container) => {
        render(
          <Scheme>
            <Toggle label="Save" variant={variant} isSelected={isSelected} isDisabled />
          </Scheme>,
        )
        expectGreyed(button('Save'), container)
      },
    )

    it('drops the shadow of an elevated button, hovered too', async () => {
      render(
        <Scheme>
          <Plain label="Save" variant="elevated" isDisabled />
        </Scheme>,
      )
      // Tailwind's shadow-none is a stack of zero-size shadows, not `none`, so look for any size.
      const visible = (el: Element) => /[1-9]\d*px/.test(getComputedStyle(el).boxShadow)
      expect(visible(button('Save'))).toBe(false)
      await userEvent.hover(button('Save'))
      expect(button('Save').matches(':hover')).toBe(true)
      await settle()
      expect(visible(button('Save'))).toBe(false)
    })
  })

  describe('pending', () => {
    it.each(variants)(
      'keeps the colors of a %s button and shows the progress cursor',
      (variant) => {
        render(
          <Scheme>
            <Plain label="Save" variant={variant} />
            <Plain label="Saving" variant={variant} isPending />
          </Scheme>,
        )
        const enabled = getComputedStyle(button('Save'))
        const pending = getComputedStyle(button('Saving'))
        expect(pending.backgroundColor).toBe(enabled.backgroundColor)
        expect(pending.color).toBe(enabled.color)
        expect(pending.boxShadow).toBe(enabled.boxShadow)
        expect(enabled.cursor).toBe('pointer')
        expect(pending.cursor).toBe('progress')
      },
    )

    // 1.5 times its icon.
    it.each([
      ['xs', 30],
      ['s', 30],
      ['m', 36],
      ['l', 48],
      ['xl', 60],
    ] as const)('shows its loading indicator alone at size %s, %idp across', (size, px) => {
      render(
        <Scheme>
          <Plain label="Save" icon="save" size={size} />
          <Plain label="Save" icon="save" size={size} isPending />
        </Scheme>,
      )
      const [enabled, pending] = screen.getAllByRole('button')
      expectOnlyPendingIndicator(pending!, enabled!, px)
    })

    it.each(
      toggleVariants.flatMap((variant) => [[variant, false] as const, [variant, true] as const]),
    )(
      'keeps the colors of a %s toggle button, selected %s, and shows its loading indicator alone',
      (variant, isSelected) => {
        render(
          <Scheme>
            <Toggle
              label="Bold"
              icon="format_bold"
              variant={variant}
              size="m"
              isSelected={isSelected}
            />
            <Toggle
              label="Bold"
              icon="format_bold"
              variant={variant}
              size="m"
              isSelected={isSelected}
              isPending
            />
          </Scheme>,
        )
        const [enabled, pending] = screen.getAllByRole('button')
        const enabledStyle = getComputedStyle(enabled!)
        const pendingStyle = getComputedStyle(pending!)
        expect(pendingStyle.backgroundColor).toBe(enabledStyle.backgroundColor)
        expect(pendingStyle.color).toBe(enabledStyle.color)
        expect(pendingStyle.boxShadow).toBe(enabledStyle.boxShadow)
        expect(pendingStyle.borderRadius).toBe(enabledStyle.borderRadius)
        expect(enabledStyle.cursor).toBe('pointer')
        expect(pendingStyle.cursor).toBe('progress')
        expectOnlyPendingIndicator(pending!, enabled!, 36)
      },
    )
  })

  describe('keyboard', () => {
    it('reaches each button in order with Tab, and skips a disabled one', async () => {
      render(
        <Scheme>
          <Plain label="Undo" />
          <Plain label="Redo" isDisabled />
          <Plain label="Save" />
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Undo'))
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Save'))
      await userEvent.tab({ shift: true })
      expect(document.activeElement).toBe(button('Undo'))
    })

    it('is activated by both Space and Enter', async () => {
      let clicks = 0
      render(
        <Scheme>
          <Plain label="Save" onPress={() => clicks++} />
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.keyboard(' ')
      expect(clicks).toBe(1)
      await userEvent.keyboard('{Enter}')
      expect(clicks).toBe(2)
    })

    it('toggles aria-pressed from the keyboard, and keeps focus', async () => {
      function Favorite() {
        const [on, setOn] = useState(false)
        return <Toggle label="Favorite" isSelected={on} onPress={() => setOn(!on)} />
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
          <Plain label="Save" />
        </Scheme>,
      )
      const el = button('Save')
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
            <Plain key={variant} label={variant} variant={variant} />
          ))}
          {sizes.map((size) => (
            <Plain key={size} label={`square ${size}`} size={size} shape="square" />
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
          <Toggle label="Favorite" isSelected />
        </Scheme>,
      )
      await userEvent.tab()
      expect(getComputedStyle(button('Favorite')).outlineStyle).toBe('solid')
    })

    it('is not drawn when the button is only clicked', async () => {
      render(
        <Scheme>
          <Plain label="Save" />
        </Scheme>,
      )
      await userEvent.click(button('Save'))
      expect(document.activeElement).toBe(button('Save'))
      expect(getComputedStyle(button('Save')).outlineStyle).toBe('none')
    })

    it('is drawn in the secondary color of the dark scheme too', async () => {
      render(
        <Scheme theme="dark">
          <Plain label="Save" />
        </Scheme>,
      )
      await userEvent.tab()
      const el = button('Save')
      expect(getComputedStyle(el).outlineColor).toBe(
        computedColor('var(--md-sys-color-secondary)', el),
      )
    })
  })

  describe('icon size', () => {
    it.each([
      ['xs', 20],
      ['s', 20],
      ['m', 24],
      ['l', 32],
      ['xl', 40],
    ] as const)('draws the icon in a %s button at %ipx', (size, px) => {
      render(
        <Scheme>
          <Plain label="Save" size={size} icon="add" />
        </Scheme>,
      )
      const rect = screen.getByText('add').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })
  })

  describe('motion', () => {
    it('spring-transitions shape on its own timing, and color and shadow together on theirs', () => {
      render(
        <Scheme>
          <Plain label="Save" />
        </Scheme>,
      )
      const style = getComputedStyle(button('Save'))
      const springs = ['fast-spatial', 'fast-effects', 'fast-effects', 'fast-effects']
      expect(style.transitionProperty).toBe('border-radius, background-color, color, box-shadow')
      expect(style.transitionDuration).toBe(springs.map(springDuration).join(', '))
      expect(style.transitionTimingFunction).toBe(springs.map(springEasing).join(', '))
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles every spring instantly', () => {
        render(
          <Scheme>
            <Plain label="Save" />
          </Scheme>,
        )
        const durations = getComputedStyle(button('Save')).transitionDuration.split(', ')
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe('touch target', () => {
    /*
     * The visual size is unchanged, and a click up to 48dp across still lands on
     * the button: the hit area is real, not just a declared style. The width
     * follows the label, so only the height is fixed.
     */
    it.each([
      ['xs', '0', 32],
      ['s', '0', 40],
      ['m', '0', 56],
      ['l', '0', 96],
      ['xl', '0', 136],
      ['xs', '-3', 20],
      ['s', '-3', 28],
    ] as const)(
      'gives a %s button at density %s, drawn %ipx tall, a hit area of at least 48dp',
      (size, density, drawnHeight) => {
        render(
          <Scheme density={density}>
            <Plain label="Save" size={size} />
          </Scheme>,
        )
        const el = button('Save')
        expect(el.getBoundingClientRect().height).toBe(drawnHeight)
        expectHitArea(el)
      },
    )

    it('gives a button with an icon, and a text button, the same hit area', () => {
      render(
        <Scheme>
          <Plain label="With icon" size="xs" icon="add" />
          <Plain label="Text" size="xs" variant="text" />
        </Scheme>,
      )
      expectHitArea(button('With icon'))
      expectHitArea(button('Text'))
    })
  })

  describe('browser defaults', () => {
    it.each(variants)('leaves none of the native button styling on a %s button', (variant) => {
      render(
        <Scheme>
          <Plain label="Save" variant={variant} />
        </Scheme>,
      )
      // Its own padding: 10dp above and below a small button's label.
      expectNoNativeStyling(button('Save'), 10)
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('leaves the text of a pending button unpainted, under its loading indicator', () => {
      render(
        <Scheme>
          <Plain label="Save" isPending />
        </Scheme>,
      )
      expect(getComputedStyle(button('Save')).webkitTextFillColor).toBe('rgba(0, 0, 0, 0)')
    })

    it('gives every button with a container a ButtonText border, and a text button none', () => {
      render(
        <Scheme>
          {variants.map((variant) => (
            <Plain key={variant} label={variant} variant={variant} />
          ))}
        </Scheme>,
      )
      const buttonText = computedColor('ButtonText', schemeOf(button('filled')))
      for (const variant of variants) {
        const style = getComputedStyle(button(variant))
        if (variant === 'text') {
          expect(style.borderTopWidth, variant).toBe('0px')
        } else {
          expect(style.borderTopWidth, variant).toBe('1px')
          expect(style.borderTopStyle, variant).toBe('solid')
          expect(style.borderTopColor, variant).toBe(buttonText)
        }
        // The border is around the padding, so a button with one is 1dp taller above and below.
        expect(button(variant).getBoundingClientRect().height, variant).toBe(
          variant === 'text' ? 40 : 42,
        )
        // Its radius is the same half of the line and the padding.
        expect(style.borderRadius, variant).toBe('20px')
      }
    })

    it('fills a selected toggle with Highlight so it differs from an unselected one', () => {
      render(
        <Scheme>
          {toggleVariants.flatMap((variant) => [
            <Toggle
              key={`${variant}-off`}
              label={`${variant} off`}
              variant={variant}
              isSelected={false}
            />,
            <Toggle key={`${variant}-on`} label={`${variant} on`} variant={variant} isSelected />,
          ])}
        </Scheme>,
      )
      const scheme = schemeOf(button('filled off'))
      const highlight = computedColor('Highlight', scheme)
      const highlightText = computedColor('HighlightText', scheme)

      for (const variant of toggleVariants) {
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
          <Toggle label="Favorite" variant="tonal" isSelected icon="favorite" />
        </Scheme>,
      )
      const el = button('Favorite')
      const highlightText = computedColor('HighlightText', schemeOf(el))
      expect(getComputedStyle(el.querySelector('.font-icon')!).color).toBe(highlightText)
    })

    it('greys out a disabled button, selected or not', () => {
      render(
        <Scheme>
          <Plain label="off" variant="tonal" isDisabled />
          <Toggle label="on" variant="tonal" isSelected isDisabled />
          <Plain label="text" variant="text" isDisabled />
        </Scheme>,
      )
      const scheme = schemeOf(button('off'))
      const grayText = computedColor('GrayText', scheme)
      const canvas = computedColor('Canvas', scheme)

      expect(getComputedStyle(button('off')).borderTopColor).toBe(grayText)
      expect(getComputedStyle(button('on')).borderTopColor).toBe(grayText)
      expect(getComputedStyle(button('on')).backgroundColor).toBe(grayText)
      expect(getComputedStyle(button('on')).color).toBe(canvas)
      expect(getComputedStyle(button('text')).borderTopWidth).toBe('0px')
    })

    it('still shows the focus outline', async () => {
      render(
        <Scheme>
          <Plain label="Save" />
        </Scheme>,
      )
      await userEvent.tab()
      const ring = getComputedStyle(button('Save'))
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
    })
  })
})
