import { render, screen } from '@testing-library/react'
import { userEvent } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import {
  button,
  computedColor,
  computedRadius,
  contrastOf,
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
import { MenuTrigger } from 'react-aria-components'
import { Icon } from '../icon'
import { Menu, MenuItem, MenuPopover } from '../menu'
import {
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
  type SplitButtonLeadingProps,
  type SplitButtonProps,
} from './split-button'

/*
 * Everything that needs a real browser and the real stylesheet: colors, ring
 * width, size, corners (resting, hovered/pressed and expanded), contrast,
 * keyboard use, the focus outline, the 48dp hit area, motion and forced
 * colors. Behavior jsdom can check without a stylesheet - attributes,
 * accessible names, DOM structure, events - is in split-button.test.tsx instead.
 */

const variants = ['elevated', 'filled', 'tonal', 'outlined'] as const
const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

/**
 * A split button with the trailing button named "More" unless given its own menuLabel. Its
 * `aria-expanded` is the trailing button's, `isDisabled` both's, and the rest the leading one's.
 */
function Named({
  variant,
  size,
  menuLabel = 'More',
  'aria-expanded': ariaExpanded,
  isDisabled,
  ...props
}: Pick<SplitButtonProps, 'variant' | 'size'> &
  SplitButtonLeadingProps & { menuLabel?: string; 'aria-expanded'?: boolean }) {
  return (
    <SplitButton variant={variant} size={size}>
      <SplitButtonLeading {...props} isDisabled={isDisabled} />
      <SplitButtonTrailing
        aria-label={menuLabel}
        aria-expanded={ariaExpanded}
        isDisabled={isDisabled}
      />
    </SplitButton>
  )
}

describe('SplitButton accessibility in a browser', () => {
  describe('contrast', () => {
    /*
     * WCAG 1.4.3: the leading label is text at 14px or larger, needing 4.5:1
     * against its container. The trailing icon needs only 3:1 (WCAG 1.4.11).
     */
    it.each(schemes)(
      'keeps the leading label and trailing icon legible against their containers, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            {variants.map((variant) => (
              <Named key={variant} variant={variant} menuLabel={`${variant} more`}>
                {variant}
              </Named>
            ))}
          </Scheme>,
        )

        for (const variant of variants) {
          expect(contrastOf(button(variant)), `${variant} leading`).toBeGreaterThanOrEqual(4.5)
          expect(
            contrastOf(button(`${variant} more`)),
            `${variant} trailing`,
          ).toBeGreaterThanOrEqual(3)
        }
      },
    )
  })

  describe('colors', () => {
    it.each([
      ['elevated', '--md-sys-color-surface-container-low', '--md-sys-color-primary'],
      ['filled', '--md-sys-color-primary', '--md-sys-color-on-primary'],
      ['tonal', '--md-sys-color-secondary-container', '--md-sys-color-on-secondary-container'],
      ['outlined', null, '--md-sys-color-on-surface-variant'],
    ] as const)('fills both buttons of the %s variant alike', (variant, bg, fg) => {
      render(
        <Scheme>
          <Named variant={variant}>Reply</Named>
        </Scheme>,
      )
      for (const el of [button('Reply'), button('More')]) {
        const style = getComputedStyle(el)
        expect(style.backgroundColor).toBe(
          bg ? computedColor(`var(${bg})`, el) : computedColor('transparent', el),
        )
        expect(style.color).toBe(computedColor(`var(${fg})`, el))
      }
    })

    it('does not change the trailing button color when expanded', () => {
      render(
        <Scheme>
          <Named variant="filled">Off</Named>
          <Named aria-expanded variant="filled" menuLabel="More options">
            On
          </Named>
        </Scheme>,
      )
      const off = getComputedStyle(button('More')).backgroundColor
      const on = getComputedStyle(button('More options')).backgroundColor
      expect(on).toBe(off)
    })
  })

  describe('pending', () => {
    it.each(variants)(
      'keeps the colors of a %s leading button and shows the progress cursor',
      (variant) => {
        render(
          <Scheme>
            <Named variant={variant}>Reply</Named>
            <Named variant={variant} menuLabel="More options" isPending>
              Replying
            </Named>
          </Scheme>,
        )
        const enabled = getComputedStyle(button('Reply'))
        const pending = getComputedStyle(button('Replying'))
        expect(pending.backgroundColor).toBe(enabled.backgroundColor)
        expect(pending.color).toBe(enabled.color)
        expect(pending.boxShadow).toBe(enabled.boxShadow)
        expect(enabled.cursor).toBe('pointer')
        expect(pending.cursor).toBe('progress')
      },
    )

    // 1.5 times each button's icon.
    it.each([
      ['xs', 30, 36],
      ['s', 30, 36],
      ['m', 36, 42],
      ['l', 48, 60],
      ['xl', 60, 72],
    ] as const)(
      'shows a loading indicator alone on either button at size %s, %idp and %idp across',
      (size, leading, trailing) => {
        render(
          <Scheme>
            <SplitButton size={size}>
              <SplitButtonLeading>Reply</SplitButtonLeading>
              <SplitButtonTrailing aria-label="More" />
            </SplitButton>
            <SplitButton size={size}>
              <SplitButtonLeading isPending>Reply</SplitButtonLeading>
              <SplitButtonTrailing aria-label="More options" isPending />
            </SplitButton>
          </Scheme>,
        )
        const [enabled, pending] = screen.getAllByRole('button', { name: 'Reply' })
        expectOnlyPendingIndicator(pending!, enabled!, leading)
        expectOnlyPendingIndicator(button('More options'), button('More'), trailing)
      },
    )
  })

  describe('ring', () => {
    it('has no ring except on the outlined variant, on both buttons', () => {
      render(
        <Scheme>
          {variants.map((variant) => (
            <Named key={variant} variant={variant}>
              {variant}
            </Named>
          ))}
        </Scheme>,
      )
      for (const variant of variants) {
        expect(ringWidth(button(variant)), `${variant} leading`).toBe(
          variant === 'outlined' ? 1 : 0,
        )
      }
    })

    it('thickens the ring on large and extra-large outlined buttons', () => {
      render(
        <Scheme>
          {sizes.map((size) => (
            <Named key={size} variant="outlined" size={size}>
              {size}
            </Named>
          ))}
        </Scheme>,
      )
      for (const size of sizes) {
        const expected = size === 'l' || size === 'xl' ? 2 : 1
        expect(ringWidth(button(size)), `${size} leading`).toBe(expected)
      }
    })
  })

  describe('sizing', () => {
    it.each([
      ['xs', 32],
      ['s', 40],
      ['m', 56],
      ['l', 96],
      ['xl', 136],
    ] as const)('gives both buttons of a %s split button a %ipx height', (size, px) => {
      render(
        <Scheme>
          <Named size={size}>Reply</Named>
        </Scheme>,
      )
      expect(button('Reply').getBoundingClientRect().height).toBe(px)
      expect(button('More').getBoundingClientRect().height).toBe(px)
    })

    // Each is as tall as what it holds and its own padding, which lose the same to density.
    it.each([
      ['xs', '-1', 28],
      ['xs', '-2', 24],
      ['s', '-3', 28],
      ['m', '-2', 48],
      ['l', '-1', 92],
      ['xl', '-3', 124],
    ] as const)(
      'keeps both buttons of a %s split button one height at density %s, %ipx',
      (size, density, px) => {
        render(
          <Scheme density={density}>
            <Named size={size}>Reply</Named>
          </Scheme>,
        )
        expect(button('Reply').getBoundingClientRect().height).toBe(px)
        expect(button('More').getBoundingClientRect().height).toBe(px)
      },
    )

    it('keeps the two one height where a density step leaves no padding around the menu icon', () => {
      render(
        <Scheme density="-3">
          <Named size="xs">Reply</Named>
        </Scheme>,
      )
      // The 24dp icon is the least the trailing button can be, and the leading one is as tall.
      expect(button('More').getBoundingClientRect().height).toBe(24)
      expect(button('Reply').getBoundingClientRect().height).toBe(24)
    })

    it.each([
      ['xs', 48],
      ['s', 48],
      ['m', 56],
      ['l', 96],
      ['xl', 136],
    ] as const)('gives the trailing button of a %s split button a %ipx width', (size, px) => {
      render(
        <Scheme>
          <Named size={size}>Reply</Named>
        </Scheme>,
      )
      expect(button('More').getBoundingClientRect().width).toBe(px)
    })
  })

  describe('shape', () => {
    it.each([
      ['xs', '0'],
      ['s', '0'],
      ['m', '0'],
      ['l', '0'],
      ['xl', '0'],
      ['s', '-2'],
      ['xl', '-3'],
    ] as const)(
      'gives each button of a %s split button at density %s a fully round outer end, half its own height',
      (size, density) => {
        render(
          <Scheme density={density}>
            <Named size={size}>Reply</Named>
          </Scheme>,
        )
        const leading = button('Reply')
        const trailing = button('More')
        const half = (el: Element) => `${el.getBoundingClientRect().height / 2}px`
        const style = (el: Element) => getComputedStyle(el)
        expect(style(leading).borderStartStartRadius).toBe(half(leading))
        expect(style(leading).borderEndStartRadius).toBe(half(leading))
        expect(style(trailing).borderStartEndRadius).toBe(half(trailing))
        expect(style(trailing).borderEndEndRadius).toBe(half(trailing))
      },
    )

    it.each([
      ['xs', 'rounded-shape-xs', 'rounded-shape-sm'],
      ['s', 'rounded-shape-xs', 'rounded-shape-md'],
      ['m', 'rounded-shape-xs', 'rounded-shape-md'],
      ['l', 'rounded-shape-sm', 'rounded-shape-lg-inc'],
      ['xl', 'rounded-shape-md', 'rounded-shape-lg-inc'],
    ] as const)(
      'grows the %s inner corner while hovered and pressed',
      async (size, rest, grown) => {
        render(
          <Scheme>
            <Named size={size}>Reply</Named>
          </Scheme>,
        )
        const leading = button('Reply')
        const trailing = button('More')
        expect(getComputedStyle(leading).borderEndEndRadius).toBe(computedRadius(rest))
        expect(getComputedStyle(trailing).borderStartStartRadius).toBe(computedRadius(rest))

        // holdPress hovers the button and then holds its pointer down, so this
        // covers both the hover and the pressed corner - the spec grows the
        // inner corner to the same size for either, and the corner stays grown
        // once released too, since the pointer is still hovering it.
        const pressed = await whilePressed('Reply', async () => {
          await settle()
          return getComputedStyle(leading).borderEndEndRadius
        })
        expect(pressed).toBe(computedRadius(grown))
        await settle()
        expect(getComputedStyle(leading).borderEndEndRadius).toBe(computedRadius(grown))

        // A sibling that was never hovered or pressed stays at its resting corner throughout.
        expect(getComputedStyle(trailing).borderStartStartRadius).toBe(computedRadius(rest))
      },
    )

    it('rounds the trailing button fully, both corners, when expanded', () => {
      render(
        <Scheme>
          <Named aria-expanded>Reply</Named>
        </Scheme>,
      )
      const trailing = button('More')
      const half = `${trailing.getBoundingClientRect().height / 2}px`
      const style = getComputedStyle(trailing)
      expect(style.borderStartStartRadius).toBe(half)
      expect(style.borderStartEndRadius).toBe(half)
    })
  })

  describe('in React Aria’s MenuTrigger', () => {
    it('turns the icon and rounds the trailing button while the menu is open', async () => {
      render(
        <Scheme>
          <SplitButton>
            <SplitButtonLeading>Reply</SplitButtonLeading>
            <MenuTrigger>
              <SplitButtonTrailing aria-label="More" />
              <MenuPopover>
                <Menu>
                  <MenuItem>Forward</MenuItem>
                </Menu>
              </MenuPopover>
            </MenuTrigger>
          </SplitButton>
        </Scheme>,
      )
      const trailing = button('More')
      const icon = trailing.querySelector('.font-icon')!
      const half = `${trailing.getBoundingClientRect().height / 2}px`
      expect(getComputedStyle(trailing).borderStartStartRadius).not.toBe(half)

      await userEvent.click(trailing)
      await screen.findByRole('menu', { name: 'More' })
      await settle()
      expect(getComputedStyle(trailing).borderStartStartRadius).toBe(half)
      expect(getComputedStyle(icon).rotate).toBe('180deg')
    })
  })

  describe('trailing icon', () => {
    it('rotates 180 degrees when expanded, and not otherwise', () => {
      render(
        <Scheme>
          <Named>Off</Named>
          <Named aria-expanded menuLabel="More options">
            On
          </Named>
        </Scheme>,
      )
      expect(getComputedStyle(button('More').querySelector('.font-icon')!).rotate).toBe('none')
      expect(getComputedStyle(button('More options').querySelector('.font-icon')!).rotate).toBe(
        '180deg',
      )
    })

    it.each([
      ['xs', 24],
      ['s', 24],
      ['m', 28],
      ['l', 40],
      ['xl', 48],
    ] as const)('draws the trailing icon of a %s split button at %ipx', (size, px) => {
      render(
        <Scheme>
          <Named size={size}>Reply</Named>
        </Scheme>,
      )
      const rect = screen.getByText('keyboard_arrow_down').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })
  })

  describe('leading icon size', () => {
    it.each([
      ['xs', 20],
      ['s', 20],
      ['m', 24],
      ['l', 32],
      ['xl', 40],
    ] as const)('draws a leading icon at %ipx in a %s split button', (size, px) => {
      render(
        <Scheme>
          <Named size={size}>
            <Icon name="add" />
            Reply
          </Named>
        </Scheme>,
      )
      const rect = screen.getByText('add').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })
  })

  describe('keyboard', () => {
    it('reaches the leading button then the trailing button with Tab', async () => {
      render(
        <Scheme>
          <Named>Reply</Named>
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Reply'))
      await userEvent.tab()
      expect(document.activeElement).toBe(button('More'))
    })

    it('skips both buttons of a disabled split button', async () => {
      render(
        <Scheme>
          <Named isDisabled>Skip</Named>
          <Named menuLabel="More options">Continue</Named>
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Continue'))
    })
  })

  describe('focus ring', () => {
    it('is drawn on both buttons when focused with the keyboard', async () => {
      render(
        <Scheme>
          <Named>Reply</Named>
        </Scheme>,
      )
      await userEvent.tab()
      expect(getComputedStyle(button('Reply')).outlineStyle).toBe('solid')
      await userEvent.tab()
      expect(getComputedStyle(button('More')).outlineStyle).toBe('solid')
    })
  })

  describe('motion', () => {
    it('spring-transitions shape and color together on both buttons', () => {
      render(
        <Scheme>
          <Named>Reply</Named>
        </Scheme>,
      )
      const springsUsed = ['fast-spatial', 'fast-effects', 'fast-effects', 'fast-effects']
      for (const el of [button('Reply'), button('More')]) {
        const style = getComputedStyle(el)
        expect(style.transitionProperty).toBe('border-radius, background-color, color, box-shadow')
        expect(style.transitionDuration).toBe(springsUsed.map(springDuration).join(', '))
        expect(style.transitionTimingFunction).toBe(springsUsed.map(springEasing).join(', '))
      }
    })

    /** Like test-browser's springDuration, but read inside a `[data-motion="standard"]` scope. */
    function standardSpringDuration(spring: string) {
      const probe = document.createElement('div')
      probe.dataset.motion = 'standard'
      probe.style.transitionDuration = `var(--md-sys-motion-spring-${spring}-duration)`
      document.body.append(probe)
      const value = getComputedStyle(probe).transitionDuration
      probe.remove()
      return value
    }

    it('rotates the trailing icon on the standard motion scheme, not the expressive default', () => {
      render(
        <Scheme>
          <Named>Reply</Named>
        </Scheme>,
      )
      const trailing = button('More')
      expect(trailing).toHaveAttribute('data-motion', 'standard')

      const standardDuration = standardSpringDuration('fast-spatial')
      expect(standardDuration).not.toBe(springDuration('fast-spatial'))

      const style = getComputedStyle(screen.getByText('keyboard_arrow_down'))
      expect(style.transitionDuration).toBe(standardDuration)
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles every spring instantly on both buttons', () => {
        render(
          <Scheme>
            <Named>Reply</Named>
          </Scheme>,
        )
        for (const el of [button('Reply'), button('More')]) {
          const durations = getComputedStyle(el).transitionDuration.split(', ')
          expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
        }
      })
    })
  })

  describe('touch target', () => {
    it.each(['xs', 's', 'm', 'l', 'xl'] as const)(
      'gives both buttons of a %s split button a hit area of at least 48dp',
      (size) => {
        render(
          <Scheme>
            <Named size={size}>Reply</Named>
          </Scheme>,
        )
        expectHitArea(button('Reply'))
        expectHitArea(button('More'))
      },
    )
  })

  describe('browser defaults', () => {
    it('leaves none of the native button styling on either button', () => {
      render(
        <Scheme>
          <Named>Reply</Named>
        </Scheme>,
      )
      // Their own padding: 10dp above and below a small button's label, 8dp its menu icon.
      expectNoNativeStyling(button('Reply'), 10)
      expectNoNativeStyling(button('More'), 8)
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('gives every button with a container a ButtonText border', () => {
      render(
        <Scheme>
          {variants.map((variant) => (
            <Named key={variant} variant={variant} menuLabel={`${variant} more`}>
              {variant}
            </Named>
          ))}
        </Scheme>,
      )
      const buttonText = computedColor('ButtonText', schemeOf(button('filled')))
      for (const variant of variants) {
        for (const el of [button(variant), button(`${variant} more`)]) {
          const style = getComputedStyle(el)
          expect(style.borderTopWidth).toBe('1px')
          expect(style.borderTopStyle).toBe('solid')
          expect(style.borderTopColor).toBe(buttonText)
          // The border is around the padding, so each button is 1dp taller above and below.
          expect(el.getBoundingClientRect().height).toBe(42)
        }
        // Each outer end keeps its radius, half of the line and the padding.
        expect(getComputedStyle(button(variant)).borderStartStartRadius).toBe('20px')
        expect(getComputedStyle(button(`${variant} more`)).borderEndEndRadius).toBe('20px')
      }
    })

    it('greys out both buttons when disabled', () => {
      render(
        <Scheme>
          <Named variant="tonal" isDisabled>
            Reply
          </Named>
        </Scheme>,
      )
      const scheme = schemeOf(button('Reply'))
      const grayText = computedColor('GrayText', scheme)
      expect(getComputedStyle(button('Reply')).borderTopColor).toBe(grayText)
      expect(getComputedStyle(button('More')).borderTopColor).toBe(grayText)
    })

    it('still shows the focus outline', async () => {
      render(
        <Scheme>
          <Named>Reply</Named>
        </Scheme>,
      )
      await userEvent.tab()
      expect(getComputedStyle(button('Reply')).outlineStyle).toBe('solid')
    })
  })
})
