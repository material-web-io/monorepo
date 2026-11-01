import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  button,
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  rgba,
  ringWidth,
  Scheme,
  schemeOf,
  schemes,
  settle,
  useForcedColors,
} from '../../test-browser'
import { Button } from '../button'
import { Card } from './card'

/* What needs a real browser and stylesheet: the corner and the clip, the fills and the
 * outline, the elevation, the typeface, contrast and forced colors. Markup, the role and
 * the tab stops: card.test.tsx. */

const variants = ['elevated', 'filled', 'outlined'] as const
type Variant = (typeof variants)[number]

/** The card whose text this is: the text is its only child. */
const card = (name: string) => screen.getByText(name)
const role = (name: string, el: Element) => computedColor(`var(--md-sys-color-${name})`, el)
const ringColor = (el: Element) =>
  computedColor(getComputedStyle(el).getPropertyValue('--tw-inset-ring-color'), el)

// Spelled out in full because Tailwind only generates utilities it finds as literal strings.
const elevations = [
  'shadow-elevation-1',
  'shadow-elevation-2',
  'shadow-elevation-3',
  'shadow-elevation-4',
  'shadow-elevation-5',
]

/** The elevation level of an element's shadow, 0 with none. */
function elevation(el: Element) {
  const shadow = getComputedStyle(el).getPropertyValue('--tw-shadow')
  if (!/[1-9]\d*px/.test(shadow)) return 0
  const level = elevations.findIndex(
    (each) => computedStyleOf(each, (style) => style.getPropertyValue('--tw-shadow')) === shadow,
  )
  return level + 1
}

const fill: Record<Variant, string> = {
  elevated: 'surface-container-low',
  filled: 'surface-container-highest',
  outlined: 'surface',
}

/** One card of each variant, its text its variant's name. */
function Every() {
  return (
    <>
      {variants.map((variant) => (
        <Card key={variant} variant={variant} style={{ width: 200 }}>
          {variant}
        </Card>
      ))}
    </>
  )
}

describe('Card', () => {
  it('has 12dp corners, a column for its content that clips at them, and the plain typeface in on-surface', () => {
    render(
      <Scheme>
        <Every />
      </Scheme>,
    )
    const style = getComputedStyle(card('elevated'))
    expect(style.borderRadius).toBe(computedRadius('rounded-shape-md'))
    expect(style.display).toBe('flex')
    expect(style.flexDirection).toBe('column')
    expect(style.overflowX).toBe('clip')
    expect(style.overflowY).toBe('clip')
    expect(style.color).toBe(role('on-surface', card('elevated')))
    expect(style.fontFamily).toBe(computedStyleOf('font-plain', (s) => s.fontFamily))
    expect(style.fontSize).toBe(computedStyleOf('text-body-md', (s) => s.fontSize))
  })

  it.each(variants)('fills the %s card with its container color', (variant) => {
    render(
      <Scheme>
        <Every />
      </Scheme>,
    )
    expect(getComputedStyle(card(variant)).backgroundColor).toBe(role(fill[variant], card(variant)))
  })

  it('draws a 1dp outline-variant outline on the outlined card only', () => {
    render(
      <Scheme>
        <Every />
      </Scheme>,
    )
    for (const variant of variants) {
      expect(ringWidth(card(variant)), variant).toBe(variant === 'outlined' ? 1 : 0)
    }
    expect(ringColor(card('outlined'))).toBe(role('outline-variant', card('outlined')))
  })

  it.each(schemes)(
    'keeps on-surface text at 4.5:1 or better on every container in the %s %s-contrast scheme',
    (theme, contrast) => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <Every />
        </Scheme>,
      )
      for (const variant of variants) {
        const { color, backgroundColor } = getComputedStyle(card(variant))
        expect(rgba(backgroundColor)[3], variant).toBe(255)
        expect(contrastRatio(color, backgroundColor), variant).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it('rests at elevation 1 for an elevated card and 0 for the others, and really draws the shadow', () => {
    render(
      <Scheme>
        <Every />
      </Scheme>,
    )
    for (const variant of variants) {
      expect(elevation(card(variant)), variant).toBe(variant === 'elevated' ? 1 : 0)
    }
    expect(getComputedStyle(card('elevated')).boxShadow).toBe(
      computedStyleOf('shadow-elevation-1', (style) => style.boxShadow),
    )
  })

  it('has no states of its own: hovering it, or a button in it, changes nothing', async () => {
    render(
      <Scheme>
        <Every />
        <Card data-testid="with-button" variant="elevated" style={{ width: 200 }}>
          <span>With a button</span>
          <Button>Share</Button>
        </Card>
      </Scheme>,
    )
    for (const variant of variants) {
      const rest = getComputedStyle(card(variant)).backgroundColor
      await userEvent.hover(card(variant))
      await settle()
      expect(elevation(card(variant)), variant).toBe(variant === 'elevated' ? 1 : 0)
      expect(getComputedStyle(card(variant)).backgroundColor, variant).toBe(rest)
    }
    await userEvent.hover(button('Share'))
    await settle()
    expect(elevation(screen.getByTestId('with-button'))).toBe(1)
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('gives every card a ButtonText border, which no fill or shadow would show', () => {
      render(
        <Scheme>
          <Every />
        </Scheme>,
      )
      const buttonText = computedColor('ButtonText', schemeOf(card('elevated')))
      for (const variant of variants) {
        const style = getComputedStyle(card(variant))
        expect(style.borderTopWidth, variant).toBe('1px')
        expect(style.borderTopStyle, variant).toBe('solid')
        expect(style.borderTopColor, variant).toBe(buttonText)
      }
    })
  })
})
