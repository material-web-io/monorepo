import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Button, Heading, Text } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  computedColor,
  computedStyleOf,
  contrastRatio,
  expectNoNativeStyling,
  rgba,
  Scheme,
  schemes,
  settle,
  useForcedColors,
  useReducedMotion,
  whilePressed,
} from '../../test-browser'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { AppBar, type AppBarProps } from '.'

/* What needs a real browser and stylesheet: the heights, the 48dp targets and insets, the type
 * and colors of each variant, centering, the search bar's width and states, the fill on
 * scroll and the three scroll behaviors, contrast, motion and forced colors. Markup, roles
 * and keys: app-bar.test.tsx. */

const variants = ['small', 'medium-flexible', 'large-flexible'] as const
type Variant = (typeof variants)[number]

const button = (name: string) => screen.getByRole('button', { name })
const bar = (id = 'bar') => screen.getByTestId(id)
/** The row across the bar: the pseudo-element that keeps it 64dp and takes the fill as it compresses. */
const row = (id = 'bar') => getComputedStyle(bar(id), '::before')
const heading = (name = 'Headline') => screen.getByRole('heading', { name })
const rect = (el: Element) => el.getBoundingClientRect()
const center = (el: Element) => rect(el).left + rect(el).width / 2
const role = (name: string, el: Element) => computedColor(`var(--md-sys-color-${name})`, el)
/** The box of an element's text itself, whatever the box of the element around it. */
function textRect(el: Element) {
  const range = document.createRange()
  range.selectNodeContents(el)
  return range.getBoundingClientRect()
}
/** The box of the text written in an element, between the elements in it: a search bar's hint. */
function hintRect(el: Element) {
  const range = document.createRange()
  range.selectNode([...el.childNodes].find((node) => node.nodeType === Node.TEXT_NODE)!)
  return range.getBoundingClientRect()
}
/** The font a type scale class sets, as the browser computes it. */
const type = (className: string) =>
  computedStyleOf(className, ({ fontSize, lineHeight, fontWeight, letterSpacing }) => ({
    fontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
  }))
const typeOf = (el: Element) => {
  const { fontSize, lineHeight, fontWeight, letterSpacing } = getComputedStyle(el)
  return { fontSize, lineHeight, fontWeight, letterSpacing }
}

const Back = () => (
  <IconButton slot="leading" aria-label="Back">
    <Icon name="arrow_back" />
  </IconButton>
)
const Action = ({ name }: { name: string }) => (
  <IconButton slot="trailing" aria-label={name}>
    <Icon name="search" />
  </IconButton>
)
const Avatar = ({ slot }: { slot: 'leading' | 'trailing' }) => (
  <span slot={slot} data-testid="avatar" style={{ width: 32, height: 32, borderRadius: 16 }} />
)

/** A window as wide as the spec draws its phone, or as wide as given, with the bars in it one under another. */
function Window({ width = 412, children }: { width?: number; children: ReactNode }) {
  return <div style={{ width, display: 'grid', gap: 24 }}>{children}</div>
}

/** A bar with a leading button, a headline and two trailing ones, as the spec draws it. */
function Bar({
  headline = 'Headline',
  subtitle,
  centered,
  ...props
}: AppBarProps & { headline?: string; subtitle?: string; centered?: boolean }) {
  return (
    <AppBar data-testid="bar" className={centered ? 'text-center' : undefined} {...props}>
      <Back />
      <Heading slot="headline">{headline}</Heading>
      {subtitle && <Text slot="subtitle">{subtitle}</Text>}
      <Action name="Search" />
      <Action name="Today" />
    </AppBar>
  )
}

describe('AppBar in a browser', () => {
  it('is as tall as the spec has each variant, taller with a subtitle, square and flat', () => {
    const heights: [Variant, boolean, number][] = [
      ['small', false, 64],
      ['small', true, 64],
      ['medium-flexible', false, 112],
      ['medium-flexible', true, 136],
      ['large-flexible', false, 120],
      ['large-flexible', true, 152],
    ]
    render(
      <Scheme>
        <Window>
          {heights.map(([variant, subtitle]) => (
            <Bar
              key={`${variant}-${subtitle}`}
              data-testid={`${variant}-${subtitle}`}
              variant={variant}
              subtitle={subtitle ? 'Subtitle' : undefined}
            />
          ))}
        </Window>
      </Scheme>,
    )
    for (const [variant, subtitle, height] of heights) {
      const el = bar(`${variant}-${subtitle}`)
      expect(rect(el).height, `${variant}, subtitle ${subtitle}`).toBe(height)
      // It spans what it is in, with straight corners and no drop shadow.
      expect(rect(el).width).toBe(412)
      expect(getComputedStyle(el).borderRadius).toBe('0px')
      expect(getComputedStyle(el).boxShadow).toBe('none')
      expect(getComputedStyle(el).backgroundColor).toBe(role('surface', el))
    }
  })

  it.each(variants)(
    'puts the icon buttons of a %s bar in 48dp targets 4dp from its edges',
    (variant) => {
      render(
        <Scheme>
          <Window>
            <Bar variant={variant} />
          </Window>
        </Scheme>,
      )
      const [edge, back, search, today] = [
        bar(),
        button('Back'),
        button('Search'),
        button('Today'),
      ].map(rect)
      // A 40dp button in the middle of a 48dp target: 8dp from the edge, 12dp into the 64dp row.
      expect(back!.width).toBe(40)
      expect(back!.left - edge!.left).toBe(8)
      expect(back!.top - edge!.top).toBe(12)
      expect(edge!.right - today!.right).toBe(8)
      expect(today!.top - edge!.top).toBe(12)
      // The targets touch, so the buttons are 8dp apart.
      expect(today!.left - search!.right).toBe(8)
    },
  )

  it('centers an avatar, or anything else narrower than its target, in 48dp', () => {
    render(
      <Scheme>
        <Window>
          <AppBar data-testid="bar">
            <Avatar slot="leading" />
            <Heading slot="headline">Headline</Heading>
            <Action name="Search" />
            <Avatar slot="trailing" />
          </AppBar>
        </Window>
      </Scheme>,
    )
    const [first, last] = screen.getAllByTestId('avatar').map(rect)
    expect(first!.left - rect(bar()).left).toBe(12)
    expect(first!.top - rect(bar()).top).toBe(16)
    expect(rect(bar()).right - last!.right).toBe(12)
    expect(last!.left - rect(button('Search')).right).toBe(12)
    // The text starts 4dp after the leading target all the same.
    expect(textRect(heading()).left - rect(bar()).left).toBe(56)
  })

  it('places a third trailing element in a target of its own, and a fourth after it', () => {
    render(
      <Scheme>
        <Window>
          <AppBar data-testid="bar">
            <Back />
            <Heading slot="headline">Headline</Heading>
            <Action name="Search" />
            <Action name="Today" />
            <Avatar slot="trailing" />
            <Icon slot="trailing" name="star" data-testid="fourth" />
          </AppBar>
        </Window>
      </Scheme>,
    )
    const [edge, today, avatar, fourth] = [
      bar(),
      button('Today'),
      screen.getByTestId('avatar'),
      screen.getByTestId('fourth'),
    ].map(rect)
    expect(avatar!.left - today!.right).toBe(12)
    expect(fourth!.left - avatar!.right).toBe(20)
    expect(edge!.right - fourth!.right).toBe(16)
    // The text ends where the first of the three targets starts.
    expect(rect(heading()).right).toBe(avatar!.left - 8 - 96)
  })

  it('draws a leading icon on-surface and a trailing one on-surface-variant, and icon buttons the same', () => {
    render(
      <Scheme>
        <Window>
          <AppBar data-testid="icons">
            <Icon slot="leading" name="menu" data-testid="leading-icon" />
            <Heading slot="headline">Headline</Heading>
            <Icon slot="trailing" name="star" data-testid="trailing-icon" />
          </AppBar>
          <AppBar data-testid="bar">
            <Back />
            <Heading slot="headline">Headline</Heading>
            <Action name="Search" />
          </AppBar>
        </Window>
      </Scheme>,
    )
    const color = (el: Element) => getComputedStyle(el).color
    expect(color(screen.getByTestId('leading-icon'))).toBe(role('on-surface', bar()))
    expect(color(screen.getByTestId('trailing-icon'))).toBe(role('on-surface-variant', bar()))
    expect(color(button('Back'))).toBe(role('on-surface', bar()))
    expect(color(button('Search'))).toBe(role('on-surface-variant', bar()))
  })

  it('leaves a leading button that is filled, selected or disabled its own color', () => {
    render(
      <Scheme>
        <Window>
          <AppBar>
            <IconButton slot="leading" variant="filled" aria-label="Filled">
              <Icon name="menu" />
            </IconButton>
            <Heading slot="headline">Headline</Heading>
          </AppBar>
          <AppBar>
            <IconButton slot="leading" isSelectable isSelected aria-label="Selected">
              <Icon name="menu" />
            </IconButton>
            <Heading slot="headline">Headline</Heading>
          </AppBar>
          <AppBar>
            <IconButton slot="leading" isSelectable isSelected={false} aria-label="Unselected">
              <Icon name="menu" />
            </IconButton>
            <Heading slot="headline">Headline</Heading>
          </AppBar>
          <AppBar data-testid="bar">
            <IconButton slot="leading" isDisabled aria-label="Disabled">
              <Icon name="menu" />
            </IconButton>
            <Heading slot="headline">Headline</Heading>
          </AppBar>
        </Window>
      </Scheme>,
    )
    const color = (name: string) => getComputedStyle(button(name)).color
    expect(color('Filled')).toBe(role('on-primary', bar()))
    expect(color('Selected')).toBe(role('primary', bar()))
    expect(color('Unselected')).toBe(role('on-surface', bar()))
    expect(color('Disabled')).toBe(
      computedStyleOf('text-on-surface/disabled-content', (style) => style.color),
    )
  })

  it('draws the headline and the subtitle in each variant’s type and colors', () => {
    const styles: Record<Variant, [string, string]> = {
      small: ['text-title-lg', 'text-label-md'],
      'medium-flexible': ['text-headline-md', 'text-label-lg'],
      'large-flexible': ['text-display-sm', 'text-title-md'],
    }
    render(
      <Scheme>
        <Window>
          {variants.map((variant) => (
            <Bar key={variant} variant={variant} headline={variant} subtitle={`${variant} sub`} />
          ))}
        </Window>
      </Scheme>,
    )
    for (const variant of variants) {
      const headline = heading(variant)
      const subtitle = screen.getByText(`${variant} sub`)
      expect(typeOf(headline), `${variant} headline`).toEqual(type(styles[variant][0]))
      expect(typeOf(subtitle), `${variant} subtitle`).toEqual(type(styles[variant][1]))
      expect(getComputedStyle(headline).color).toBe(role('on-surface', headline))
      expect(getComputedStyle(subtitle).color).toBe(role('on-surface-variant', subtitle))
      // A heading with none of the browser's own margin.
      expect(getComputedStyle(headline).marginTop).toBe('0px')
      expect(getComputedStyle(headline).marginBottom).toBe('0px')
    }
  })

  it('puts a small bar’s text 4dp after the leading target, its two lines centered in the row', () => {
    render(
      <Scheme>
        <Window>
          <Bar subtitle="Subtitle" />
        </Window>
      </Scheme>,
    )
    const [edge, headline, subtitle] = [bar(), heading(), screen.getByText('Subtitle')].map(rect)
    expect(textRect(heading()).left - edge!.left).toBe(56)
    expect(textRect(screen.getByText('Subtitle')).left - edge!.left).toBe(56)
    // 28dp over 16dp, 10dp from the top and the bottom of the 64dp row.
    expect(headline!.top - edge!.top).toBe(10)
    expect(subtitle!.top).toBe(headline!.bottom)
    expect(edge!.bottom - subtitle!.bottom).toBe(10)
    // And up to 4dp before the trailing targets, where its 4dp of padding ends.
    expect(rect(button('Search')).left - 4).toBe(headline!.right)
    expect(getComputedStyle(heading()).paddingRight).toBe('4px')
  })

  it('puts the text 16dp from an edge that nothing is at', () => {
    render(
      <Scheme>
        <Window>
          <AppBar data-testid="bar">
            <Heading slot="headline">Headline</Heading>
          </AppBar>
        </Window>
      </Scheme>,
    )
    expect(textRect(heading()).left - rect(bar()).left).toBe(16)
    expect(rect(bar()).right - rect(heading()).right + 4).toBe(16)
  })

  it.each([
    ['medium-flexible', 4],
    ['large-flexible', 8],
  ] as const)(
    'puts a %s bar’s text under its 64dp row, 16dp in and 12dp from the bottom',
    (variant, gap) => {
      render(
        <Scheme>
          <Window>
            <Bar variant={variant} subtitle="Subtitle" />
          </Window>
        </Scheme>,
      )
      const [edge, headline, subtitle] = [bar(), heading(), screen.getByText('Subtitle')].map(rect)
      expect(row().height).toBe('64px')
      expect(headline!.top - edge!.top).toBe(64)
      expect(textRect(heading()).left - edge!.left).toBe(16)
      expect(subtitle!.top - headline!.bottom).toBe(gap)
      expect(edge!.bottom - subtitle!.bottom).toBe(12)
      expect(edge!.right - headline!.right + 12).toBe(16)
    },
  )

  it.each(variants)('centers the text of a %s bar that a class on it centers', (variant) => {
    render(
      <Scheme>
        <Window>
          <Bar variant={variant} centered subtitle="Subtitle" />
        </Window>
      </Scheme>,
    )
    // Across a flexible bar. In a small one between what leads and what trails: one target
    // leads and two trail, so the middle between them is 24dp before the bar's.
    const off = variant === 'small' ? 24 : 0
    for (const el of [heading(), screen.getByText('Subtitle')]) {
      const text = textRect(el)
      expect(Math.abs(center(bar()) - off - (text.left + text.width / 2))).toBeLessThan(0.5)
    }
  })

  it('keeps a small bar’s headline on one line and wraps a flexible bar’s to two', () => {
    const long = 'Hiking trips with Elie in Santa Monica and Joshua Tree and then back again'
    render(
      <Scheme>
        <Window>
          {variants.map((variant) => (
            <Bar
              key={variant}
              data-testid={variant}
              variant={variant}
              headline={`${variant} ${long}`}
            />
          ))}
        </Window>
      </Scheme>,
    )
    const headline = (variant: Variant) => heading(`${variant} ${long}`)
    expect(rect(bar('small')).height).toBe(64)
    expect(rect(headline('small')).height).toBe(28)
    expect(headline('small').scrollWidth).toBeGreaterThan(headline('small').clientWidth)
    // Two lines and no more: the bar hugs them.
    expect(rect(headline('medium-flexible')).height).toBe(72)
    expect(rect(bar('medium-flexible')).height).toBe(112 + 36)
    expect(rect(headline('large-flexible')).height).toBe(88)
    expect(rect(bar('large-flexible')).height).toBe(120 + 44)
  })

  it.each(variants)(
    'fills a scrolled %s bar with surface-container, linearly over a short-4',
    async (variant) => {
      const { rerender } = render(
        <Scheme>
          <Window>
            <Bar variant={variant} />
          </Window>
        </Scheme>,
      )
      expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface', bar()))
      rerender(
        <Scheme>
          <Window>
            <Bar variant={variant} isScrolled />
          </Window>
        </Scheme>,
      )
      const style = getComputedStyle(bar())
      expect(style.transitionProperty).toBe('background-color')
      expect(style.transitionDuration).toBe('0.2s')
      expect(style.transitionTimingFunction).toBe('linear')
      await settle()
      expect(style.backgroundColor).toBe(role('surface-container', bar()))
      expect(style.boxShadow).toBe('none')
    },
  )

  it.each(schemes)(
    'keeps its text readable on both fills in the %s scheme at %s contrast',
    (theme, contrast) => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <Window>
            <Bar data-testid="flat" headline="Flat" subtitle="Flat subtitle" />
            <Bar
              data-testid="scrolled"
              isScrolled
              headline="Scrolled"
              subtitle="Scrolled subtitle"
            />
          </Window>
        </Scheme>,
      )
      for (const [id, name] of [
        ['flat', 'Flat'],
        ['scrolled', 'Scrolled'],
      ] as const) {
        const fill = getComputedStyle(bar(id)).backgroundColor
        expect(rgba(fill)[3]).toBe(255)
        for (const el of [heading(name), screen.getByText(`${name} subtitle`)])
          expect(
            contrastRatio(getComputedStyle(el).color, fill),
            el.textContent,
          ).toBeGreaterThanOrEqual(4.5)
        for (const el of bar(id).querySelectorAll('button'))
          expect(contrastRatio(getComputedStyle(el).color, fill)).toBeGreaterThanOrEqual(3)
      }
    },
  )
})

describe('the search slot in a browser', () => {
  /** A search app bar as the spec measures it: a leading button, the search bar, an avatar-sized trailing button. */
  const SearchBar = ({
    children = 'Search product',
    searchClassName,
    ...props
  }: AppBarProps & { searchClassName?: string }) => (
    <AppBar data-testid="bar" {...props}>
      <Back />
      <Button slot="search" className={searchClassName}>
        {children}
      </Button>
      <Action name="Account" />
    </AppBar>
  )
  const search = (name = 'Search product') => button(name)

  it('is a 56dp pill 8dp from the targets around it, in a 64dp bar', () => {
    render(
      <Scheme>
        <Window>
          <SearchBar />
        </Window>
      </Scheme>,
    )
    const [edge, pill] = [bar(), search()].map(rect)
    expect(edge!.height).toBe(64)
    expect(pill!.height).toBe(56)
    expect(pill!.top - edge!.top).toBe(4)
    expect(pill!.left - edge!.left).toBe(4 + 48 + 8)
    expect(edge!.right - pill!.right).toBe(4 + 48 + 8)
    expect(
      Number.parseFloat(getComputedStyle(search()).borderTopLeftRadius),
    ).toBeGreaterThanOrEqual(28)
    expectNoNativeStyling(search())
  })

  it('keeps 16dp from an edge that nothing is at, and is centered on the bar past 312dp', () => {
    render(
      <Scheme>
        <Window>
          <AppBar data-testid="bar">
            <Button slot="search">Search product</Button>
          </AppBar>
          <AppBar data-testid="led">
            <Back />
            <Button slot="search">Search product</Button>
          </AppBar>
        </Window>
      </Scheme>,
    )
    const [alone, led] = screen.getAllByRole('button', { name: 'Search product' })
    // 380dp of room: 312dp of it, in the middle of the bar.
    expect(rect(alone!).width).toBe(312)
    expect(rect(alone!).left - rect(bar()).left).toBe(50)
    // 336dp of room, 60dp led: 312dp of it, as near the middle as that lets it be, 16dp from the end.
    expect(rect(led!).width).toBe(312)
    expect(rect(led!).left - rect(bar('led')).left).toBe(60)
    expect(rect(bar('led')).right - rect(led!).right).toBe(40)
  })

  it('is surface-container with its hinted text in body large, on-surface-variant', () => {
    render(
      <Scheme>
        <Window>
          <SearchBar />
        </Window>
      </Scheme>,
    )
    expect(getComputedStyle(search()).backgroundColor).toBe(role('surface-container', search()))
    expect(getComputedStyle(search()).color).toBe(role('on-surface-variant', search()))
    expect(typeOf(search())).toEqual(type('text-body-lg'))
  })

  it('starts its text 24dp in, or centers it where a class on it says so', () => {
    render(
      <Scheme>
        <Window>
          <SearchBar>
            Start
            <Icon slot="trailing" name="mic" data-testid="start-icon" />
          </SearchBar>
          <SearchBar searchClassName="text-center">
            Centered
            <Icon slot="trailing" name="mic" data-testid="centered-icon" />
          </SearchBar>
        </Window>
      </Scheme>,
    )
    expect(hintRect(search('Start')).left - rect(search('Start')).left).toBe(24)
    const centered = hintRect(search('Centered'))
    // Between the 20dp its start keeps and the 52dp of the icon's target at its end.
    expect(
      Math.abs(center(search('Centered')) - 16 - (centered.left + centered.width / 2)),
    ).toBeLessThan(0.5)
    // A 24dp icon in a 48dp target 4dp from the end: 16dp from it, on-surface-variant.
    for (const id of ['start-icon', 'centered-icon']) {
      const icon = screen.getByTestId(id)
      expect(rect(icon.closest('button')!).right - rect(icon).right).toBe(16)
      expect(getComputedStyle(icon).color).toBe(role('on-surface-variant', icon))
    }
  })

  it('draws an icon before its text 16dp in, on-surface, with the text 16dp after it', () => {
    render(
      <Scheme>
        <Window>
          <SearchBar>
            <Icon slot="leading" name="search" data-testid="icon" />
            Search product
          </SearchBar>
        </Window>
      </Scheme>,
    )
    const icon = screen.getByTestId('icon')
    expect(rect(icon).left - rect(search()).left).toBe(16)
    expect(hintRect(search()).left - rect(icon).right).toBe(16)
    expect(getComputedStyle(icon).color).toBe(role('on-surface', icon))
  })

  it('fills the room between the sides to 312dp, stays centered on the bar, then takes half the room', async () => {
    const Wide = ({ id }: { id: string }) => (
      <AppBar data-testid={id}>
        <Back />
        <Button slot="search">{id}</Button>
        <Action name={`${id} ask`} />
        <Action name={`${id} account`} />
      </AppBar>
    )
    render(
      <Scheme>
        <div style={{ display: 'grid', gap: 24 }}>
          {[412, 500, 600, 1100].map((width) => (
            <div key={width} style={{ width }}>
              <Wide id={`w${width}`} />
            </div>
          ))}
        </div>
      </Scheme>,
    )
    await settle()
    // One target leads (60dp with the 8dp to the search bar) and two trail (108dp).
    const [narrow, tight, mid, wide] = ['w412', 'w500', 'w600', 'w1100'].map((id) =>
      rect(search(id)),
    )
    // All of the 244dp between them.
    expect(narrow!.width).toBe(412 - 60 - 108)
    expect(narrow!.left - rect(bar('w412')).left).toBe(60)
    // 332dp of room: 312dp of it, as near the bar's center as the wider side lets it be.
    expect(tight!.width).toBe(312)
    expect(rect(bar('w500')).right - tight!.right).toBe(108)
    // 432dp of room: 312dp still, centered on the bar.
    expect(mid!.width).toBe(312)
    expect(Math.abs(center(bar('w600')) - (mid!.left + mid!.width / 2))).toBeLessThan(0.5)
    // 932dp of room: half of it, centered on the bar.
    expect(wide!.width).toBe((1100 - 60 - 108) / 2)
    expect(Math.abs(center(bar('w1100')) - (wide!.left + wide!.width / 2))).toBeLessThan(0.5)
  })

  it('fills with surface-container-highest once its bar has scrolled', async () => {
    render(
      <Scheme>
        <Window>
          <SearchBar isScrolled />
        </Window>
      </Scheme>,
    )
    await settle()
    expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface-container', bar()))
    expect(getComputedStyle(search()).backgroundColor).toBe(
      role('surface-container-highest', search()),
    )
  })

  it('shows an on-surface state layer when hovered and pressed, and a ripple', async () => {
    render(
      <Scheme>
        <Window>
          <SearchBar />
        </Window>
      </Scheme>,
    )
    const layer = search().querySelector<HTMLElement>(':scope > .state-layer')!
    expect(getComputedStyle(layer).opacity).toBe('0')
    await userEvent.hover(search())
    await settle()
    expect(getComputedStyle(layer).opacity).toBe('0.08')
    expect(getComputedStyle(layer).backgroundColor).toBe(role('on-surface', search()))
    const ripples = await whilePressed('Search product', () =>
      search().querySelectorAll(':scope > span > .opacity-state-pressed'),
    )
    expect(ripples).toHaveLength(1)
    expect(getComputedStyle(ripples[0]!).opacity).toBe('0.1')
    expect(getComputedStyle(ripples[0]!).color).toBe(role('on-surface', search()))
  })

  it('tells children given as a function of the pointer, the keyboard and a press on it', async () => {
    render(
      <Scheme>
        <Window>
          <AppBar>
            <Back />
            <Button slot="search" data-testid="search">
              {({ isHovered, isFocused, isPressed }) =>
                isPressed ? 'Pressed' : isFocused ? 'Focused' : isHovered ? 'Hovered' : 'Search'
              }
            </Button>
          </AppBar>
        </Window>
      </Scheme>,
    )
    // Named by its text, which says what the function was last told.
    const told = () => screen.getByTestId('search')
    // The pointer rests where the test before left it.
    await userEvent.unhover(told())
    expect(told()).toHaveAccessibleName('Search')

    await userEvent.tab()
    await userEvent.tab()
    expect(told()).toHaveFocus()
    expect(told()).toHaveAccessibleName('Focused')
    await userEvent.tab()
    expect(told()).toHaveAccessibleName('Search')

    await userEvent.hover(told())
    expect(told()).toHaveAccessibleName('Hovered')
    const pressed = await whilePressed('Hovered', () => told().hasAttribute('data-pressed'))
    expect(pressed).toBe(true)
  })

  it('draws a 3dp secondary focus ring 2dp outside it for the keyboard', async () => {
    render(
      <Scheme>
        <Window>
          <SearchBar />
        </Window>
      </Scheme>,
    )
    await userEvent.tab()
    await userEvent.tab()
    expect(search()).toHaveFocus()
    const style = getComputedStyle(search())
    expect(style.outlineWidth).toBe('3px')
    expect(style.outlineOffset).toBe('2px')
    expect(style.outlineColor).toBe(role('secondary', search()))
  })

  it.each(schemes)(
    'keeps its text at 3:1 on both fills in the %s scheme at %s contrast',
    async (theme, contrast) => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <Window>
            <SearchBar>Flat</SearchBar>
            <SearchBar isScrolled>Scrolled</SearchBar>
          </Window>
        </Scheme>,
      )
      await settle()
      for (const name of ['Flat', 'Scrolled'])
        expect(
          contrastRatio(
            getComputedStyle(search(name)).color,
            getComputedStyle(search(name)).backgroundColor,
          ),
          name,
        ).toBeGreaterThanOrEqual(3)
    },
  )

  describe('in forced colors', () => {
    useForcedColors()

    it('keeps an edge, which its fill no longer gives it', () => {
      render(
        <Scheme>
          <Window>
            <SearchBar />
          </Window>
        </Scheme>,
      )
      const style = getComputedStyle(search())
      expect(style.borderTopWidth).toBe('1px')
      expect(style.borderTopStyle).toBe('solid')
    })
  })
})

describe('AppBar scroll behaviors', () => {
  /** A page that scrolls under the bar it is given, at the top of it. */
  function Page({ children }: { children: ReactNode }) {
    return (
      <Scheme>
        <div data-testid="page" style={{ width: 412, height: 400, overflowY: 'auto' }}>
          {children}
          <div style={{ height: 2000 }} />
        </div>
      </Scheme>
    )
  }
  const page = () => screen.getByTestId('page')
  /** Scrolls the page to an offset and waits for the bar to have heard of it. */
  async function scrollTo(top: number) {
    page().scrollTop = top
    await settle()
  }
  /** How far below the top of the page's own box an element is drawn. */
  const offset = (el: Element) => rect(el).top - rect(page()).top
  /** Where the row is drawn: 12dp above its leading button, in the middle of its 64dp. */
  const rowOffset = () => offset(button('Back')) - 12
  /** The bar's headline and the small title in its row, as written and drawn after it. */
  const texts = (name = 'Headline') => screen.getAllByText(name) as [HTMLElement, HTMLElement]
  /** A finger on the page, under which a bar stays where a scroll leaves it, and its lifting. */
  const touch = () => page().dispatchEvent(new Event('touchstart'))
  const lift = () => page().dispatchEvent(new Event('touchend'))
  /**
   * Where the bar and the page come to rest once a scroll has ended, drawn at that end: its box
   * and the page's scroll are whole pixels, which the settle's last frame is within a frame
   * before it is there, with a flexible bar still drawn a little short of it.
   */
  const rest = (top: number, scrollTop: number) =>
    waitFor(
      () => {
        expect(offset(bar())).toBe(top)
        expect(page().scrollTop).toBe(scrollTop)
        expect(['', '0', '1']).toContain(
          getComputedStyle(bar()).getPropertyValue('--app-bar-collapse'),
        )
      },
      { timeout: 3000 },
    )
  /** y at x on a cubic Bézier easing, worked out here to hold the bar's own up to. */
  function bezier(x1: number, y1: number, x2: number, y2: number, x: number) {
    const at = (a: number, b: number, t: number) =>
      3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3
    let [low, high] = [0, 1]
    for (let step = 0; step < 40; step++) {
      const t = (low + high) / 2
      if (at(x1, x2, t) < x) low = t
      else high = t
    }
    return at(y1, y2, low)
  }
  /** The fill a bar that compresses has that far along, between its two. */
  function fillAt(collapse: number) {
    const [from, to] = ['surface', 'surface-container'].map((name) => rgba(role(name, bar())))
    const mix = bezier(0.4, 0, 1, 1, collapse)
    return from!.map((channel, i) => channel + (to![i]! - channel) * mix)
  }
  const expectFill = (style: CSSStyleDeclaration, collapse: number) =>
    rgba(style.backgroundColor).forEach((channel, i) =>
      expect(Math.abs(channel - fillAt(collapse)[i]!)).toBeLessThanOrEqual(1),
    )

  it('is pinned unless it is told otherwise', async () => {
    render(
      <Page>
        <Bar />
      </Page>,
    )
    await scrollTo(100)
    expect(getComputedStyle(bar()).position).toBe('sticky')
    expect(offset(bar())).toBe(0)
    expect(bar()).toHaveAttribute('data-scrolled')
    expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface-container', bar()))
  })

  it('pinned: remains at the top, above the content, and fills on scroll', async () => {
    render(
      <Page>
        <Bar scrollBehavior="pinned" />
      </Page>,
    )
    await settle()
    expect(getComputedStyle(bar()).position).toBe('sticky')
    expect(getComputedStyle(bar()).zIndex).toBe(computedStyleOf('z-app-bar', (s) => s.zIndex))
    expect(bar()).not.toHaveAttribute('data-scrolled')
    await scrollTo(100)
    expect(offset(bar())).toBe(0)
    expect(bar()).toHaveAttribute('data-scrolled')
    expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface-container', bar()))
    await scrollTo(0)
    expect(bar()).not.toHaveAttribute('data-scrolled')
    expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface', bar()))
  })

  it.each(['pinned', 'enter-always'] as const)(
    'takes `isScrolled` as it is told over what a %s bar reads from the page',
    async (scrollBehavior) => {
      render(
        <Page>
          <Bar variant="medium-flexible" scrollBehavior={scrollBehavior} isScrolled={false} />
        </Page>,
      )
      await scrollTo(100)
      expect(bar()).not.toHaveAttribute('data-scrolled')
      expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface', bar()))
    },
  )

  it('enter-always: a small bar goes by as much as the page scrolls down, and comes back by as much as it scrolls up', async () => {
    render(
      <Page>
        <Bar scrollBehavior="enter-always" />
      </Page>,
    )
    await settle()
    touch()
    await scrollTo(20)
    expect(offset(bar())).toBe(-20)
    await scrollTo(300)
    // Gone, and no further than its own height.
    expect(offset(bar())).toBe(-64)
    await scrollTo(290)
    expect(offset(bar())).toBe(-54)
    await scrollTo(100)
    expect(offset(bar())).toBe(0)
    expect(bar()).toHaveAttribute('data-scrolled')
    await scrollTo(0)
    expect(offset(bar())).toBe(0)
    expect(bar()).not.toHaveAttribute('data-scrolled')
  })

  it('enter-always: a small bar left part way settles on the nearer end and takes the page with it', async () => {
    render(
      <Page>
        <Bar scrollBehavior="enter-always" />
      </Page>,
    )
    await settle()
    // Under half of it gone, at the top of the page: back where it was.
    await scrollTo(20)
    await rest(0, 0)

    touch()
    await scrollTo(300)
    await scrollTo(280)
    expect(offset(bar())).toBe(-44)
    // Nothing settles under a finger.
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(offset(bar())).toBe(-44)
    lift()
    // Over half gone: all of it goes, and the page 20dp further down with it.
    await rest(-64, 300)

    touch()
    await scrollTo(250)
    expect(offset(bar())).toBe(-14)
    lift()
    // Under half: it comes back, and the page 14dp further up.
    await rest(0, 236)
  })

  it.each([
    ['medium-flexible', 48],
    ['large-flexible', 56],
  ] as const)(
    'enter-always: a %s bar scrolls away down to its row, drawn by how far it has',
    async (variant, distance) => {
      render(
        <Page>
          <Bar variant={variant} scrollBehavior="enter-always" />
        </Page>,
      )
      await settle()
      const [headline, title] = texts()
      expect(title).toHaveClass('app-bar-collapsed-headline')
      expect(getComputedStyle(title).opacity).toBe('0')
      expect(getComputedStyle(title).visibility).toBe('hidden')
      expect(title).toHaveAttribute('aria-hidden', 'true')

      // A quarter of the way: the row has stayed and the rest has gone up with the page.
      touch()
      await scrollTo(distance / 4)
      expect(rowOffset()).toBe(0)
      expect(offset(bar())).toBe(-distance / 4)
      expect(Number(getComputedStyle(headline).opacity)).toBeCloseTo(0.75, 3)
      expect(bar()).not.toHaveAttribute('data-collapsed')
      expect(screen.getByRole('heading', { name: 'Headline' })).toBe(headline)

      // Half way: the headline is half gone, the small title has barely begun and the fill
      // has come a third of its way. From here the small title is the one read out.
      await scrollTo(distance / 2)
      expect(offset(bar())).toBe(-distance / 2)
      expect(Number(getComputedStyle(headline).opacity)).toBeCloseTo(0.5, 3)
      expect(Number(getComputedStyle(title).opacity)).toBeCloseTo(bezier(0.8, 0, 0.8, 0.15, 0.5), 3)
      expect(getComputedStyle(title).visibility).toBe('visible')
      expectFill(getComputedStyle(bar()), 0.5)
      expectFill(row(), 0.5)
      expect(bar()).toHaveAttribute('data-collapsed')
      expect(title).not.toHaveAttribute('aria-hidden')
      expect(headline).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByRole('heading', { name: 'Headline' })).toBe(title)

      // All the way, and beyond: a small bar, with its title in the row and filled.
      await scrollTo(distance + 200)
      expect(rowOffset()).toBe(0)
      expect(offset(bar())).toBe(-distance)
      expect(bar()).toHaveAttribute('data-collapsed')
      expect(bar()).toHaveAttribute('data-scrolled')
      expect(getComputedStyle(headline).opacity).toBe('0')
      expect(getComputedStyle(title).opacity).toBe('1')
      expect(typeOf(title)).toEqual(type('text-title-lg'))
      expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface-container', bar()))
      expect(row().backgroundColor).toBe(role('surface-container', bar()))

      // Any scroll back up brings as much of it back, wherever in the page that is.
      await scrollTo(distance + 190)
      expect(rowOffset()).toBe(0)
      expect(offset(bar())).toBe(-(distance - 10))
      expect(Number(getComputedStyle(headline).opacity)).toBeCloseTo(10 / distance, 3)
      await scrollTo(100)
      expect(offset(bar())).toBe(0)
      expect(bar()).not.toHaveAttribute('data-collapsed')
      expect(getComputedStyle(headline).opacity).toBe('1')
      expect(getComputedStyle(title).opacity).toBe('0')
      expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface', bar()))

      // And scrolled down again from there, it goes again.
      await scrollTo(100 + distance)
      expect(offset(bar())).toBe(-distance)
      await scrollTo(0)
      expect(offset(bar())).toBe(0)
      expect(getComputedStyle(headline).opacity).toBe('1')
    },
  )

  it('keeps the row’s parts where a small bar has them while the headline scrolls away', async () => {
    render(
      <Page>
        <Bar variant="large-flexible" scrollBehavior="enter-always" subtitle="Subtitle" />
      </Page>,
    )
    await settle()
    const [, title] = texts()
    const [, subtitle] = texts('Subtitle')
    touch()
    for (const top of [20, 56, 300]) {
      await scrollTo(top)
      // The buttons 12dp from the top, the two lines 10dp from it, as in a small bar.
      expect(offset(button('Back'))).toBe(12)
      expect(offset(button('Today'))).toBe(12)
      expect(offset(title)).toBe(10)
      expect(offset(subtitle)).toBe(38)
      expect(rect(title).height).toBe(28)
      expect(rect(subtitle).height).toBe(16)
    }
  })

  it('enter-always: a flexible bar left part way settles on the nearer end and takes the page with it', async () => {
    render(
      <Page>
        <Bar variant="medium-flexible" scrollBehavior="enter-always" />
      </Page>,
    )
    await settle()
    const [headline, title] = texts()
    // From the top, 30dp of its 48dp: it goes on to its row, a step at a time.
    touch()
    await scrollTo(30)
    let steps = 0
    page().addEventListener('scroll', () => steps++)
    lift()
    await rest(-48, 48)
    expect(steps).toBeGreaterThan(1)
    expect(getComputedStyle(title).opacity).toBe('1')
    expect(bar()).toHaveAttribute('data-collapsed')

    // Brought 20dp back further down the page, it is small again, and the page 20dp down.
    touch()
    await scrollTo(300)
    await scrollTo(280)
    expect(offset(bar())).toBe(-28)
    lift()
    await rest(-48, 300)

    // Brought 30dp back, it comes back whole, over the content, and the page 18dp up.
    touch()
    await scrollTo(270)
    expect(offset(bar())).toBe(-18)
    lift()
    await rest(0, 252)
    expect(getComputedStyle(headline).opacity).toBe('1')
    expect(bar()).not.toHaveAttribute('data-collapsed')
  })

  it.each([
    ['medium-flexible', 48],
    ['large-flexible', 56],
  ] as const)(
    'exit-until-collapsed: a %s bar remains small until the page is back at its top',
    async (variant, distance) => {
      render(
        <Page>
          <Bar variant={variant} scrollBehavior="exit-until-collapsed" />
        </Page>,
      )
      await settle()
      const [headline, title] = texts()
      touch()
      await scrollTo(distance + 200)
      expect(rowOffset()).toBe(0)
      expect(offset(bar())).toBe(-distance)
      expect(bar()).toHaveAttribute('data-collapsed')
      expect(getComputedStyle(title).opacity).toBe('1')
      expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface-container', bar()))

      // A scroll back up leaves it small, all the way to where the page has the headline.
      await scrollTo(distance + 190)
      expect(offset(bar())).toBe(-distance)
      await scrollTo(distance)
      expect(offset(bar())).toBe(-distance)
      expect(getComputedStyle(headline).opacity).toBe('0')
      expect(bar()).toHaveAttribute('data-collapsed')

      // From there it expands with the page, drawn by how far it has.
      await scrollTo(distance / 4)
      expect(rowOffset()).toBe(0)
      expect(offset(bar())).toBe(-distance / 4)
      expect(Number(getComputedStyle(headline).opacity)).toBeCloseTo(0.75, 3)
      expectFill(getComputedStyle(bar()), 0.25)
      expect(bar()).not.toHaveAttribute('data-collapsed')
      await scrollTo(0)
      expect(offset(bar())).toBe(0)
      expect(getComputedStyle(headline).opacity).toBe('1')
      expect(getComputedStyle(title).opacity).toBe('0')
      expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface', bar()))

      // Left part way, it settles on the nearer end and takes the page with it.
      await scrollTo(distance - 10)
      lift()
      await rest(-distance, distance)
      touch()
      await scrollTo(10)
      lift()
      await rest(0, 0)
    },
  )

  /** A flexible bar that exits until collapsed, in a tab hidden while another one is shown. */
  const tab = (isHidden: boolean) => (
    <div hidden={isHidden}>
      <Page>
        <Bar variant="medium-flexible" scrollBehavior="exit-until-collapsed" />
      </Page>
    </div>
  )

  it('is as it was once its tab is shown again', async () => {
    const { rerender } = render(tab(false))
    await settle()
    const [headline, title] = texts()
    // At the top of the page: whole.
    rerender(tab(true))
    await settle()
    rerender(tab(false))
    await settle()
    expect(offset(bar())).toBe(0)
    expect(bar()).not.toHaveAttribute('data-collapsed')
    expect(getComputedStyle(headline).opacity).toBe('1')
    expect(getComputedStyle(title).opacity).toBe('0')
    expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface', bar()))

    // Scrolled past its headline: small.
    touch()
    await scrollTo(300)
    rerender(tab(true))
    await settle()
    rerender(tab(false))
    await settle()
    expect(page().scrollTop).toBe(300)
    expect(offset(bar())).toBe(-48)
    expect(bar()).toHaveAttribute('data-collapsed')
    expect(getComputedStyle(title).opacity).toBe('1')
    await scrollTo(0)
    expect(offset(bar())).toBe(0)
    expect(bar()).not.toHaveAttribute('data-collapsed')
  })

  it('starts whole in a tab that is hidden as it is drawn, once that is shown', async () => {
    const { rerender } = render(tab(true))
    await settle()
    rerender(tab(false))
    await settle()
    const [headline] = texts()
    expect(offset(bar())).toBe(0)
    expect(bar()).not.toHaveAttribute('data-collapsed')
    expect(getComputedStyle(headline).opacity).toBe('1')
    expect(getComputedStyle(bar()).backgroundColor).toBe(role('surface', bar()))

    // And collapses as the page scrolls, as one drawn shown does.
    touch()
    await scrollTo(300)
    expect(offset(bar())).toBe(-48)
    expect(bar()).toHaveAttribute('data-collapsed')
    await scrollTo(0)
    expect(offset(bar())).toBe(0)
    expect(bar()).not.toHaveAttribute('data-collapsed')
  })

  it('exit-until-collapsed: a small bar goes with the page, and is back only at its top', async () => {
    render(
      <Page>
        <Bar scrollBehavior="exit-until-collapsed" />
      </Page>,
    )
    await settle()
    touch()
    await scrollTo(300)
    expect(offset(bar())).toBe(-64)
    expect(bar()).toHaveAttribute('data-scrolled')
    await scrollTo(200)
    expect(offset(bar())).toBe(-64)
    await scrollTo(24)
    expect(offset(bar())).toBe(-24)
    await scrollTo(0)
    expect(offset(bar())).toBe(0)
    expect(bar()).not.toHaveAttribute('data-scrolled')

    await scrollTo(40)
    lift()
    await rest(-64, 64)
  })

  it('lets a taller headline scroll away whole', async () => {
    const long = 'Hiking trips with Elie in Santa Monica and Joshua Tree'
    render(
      <Page>
        <Bar variant="medium-flexible" scrollBehavior="enter-always" headline={long} />
      </Page>,
    )
    await settle()
    // Two lines of headline: 36dp more to scroll away.
    expect(rect(bar()).height).toBe(112 + 36)
    await scrollTo(48 + 36)
    expect(bar()).toHaveAttribute('data-collapsed')
    expect(offset(bar())).toBe(-(48 + 36))
    const title = screen.getByRole('heading', { name: long })
    expect(title).toHaveClass('app-bar-collapsed-headline')
    expect(rect(title).height).toBe(28)
  })

  it('draws the small title where a small bar has its text, centered if its text is', async () => {
    const { rerender } = render(
      <Page>
        <Bar variant="large-flexible" scrollBehavior="enter-always" subtitle="Subtitle" />
      </Page>,
    )
    await scrollTo(300)
    const title = () => screen.getByRole('heading', { name: 'Headline' })
    const [, subtitle] = texts('Subtitle')
    // 4dp after the leading target, its two lines centered in the row.
    expect(textRect(title()).left - rect(bar()).left).toBe(56)
    expect(typeOf(subtitle)).toEqual(type('text-label-md'))
    expect(offset(title())).toBe(10)
    expect(rect(subtitle).bottom - rect(title()).top).toBe(44)

    rerender(
      <Page>
        <Bar variant="large-flexible" scrollBehavior="enter-always" subtitle="Subtitle" centered />
      </Page>,
    )
    // Between what leads and what trails, as a small bar's is.
    const centered = textRect(title())
    expect(Math.abs(center(bar()) - 24 - (centered.left + centered.width / 2))).toBeLessThan(0.5)
  })

  it('reads the window where no ancestor scrolls, and scrolls it to settle', async () => {
    render(
      <Scheme>
        <Bar variant="medium-flexible" scrollBehavior="enter-always" />
        <div style={{ height: 3000 }} />
      </Scheme>,
    )
    await settle()
    const top = rect(bar()).top
    try {
      window.dispatchEvent(new Event('touchstart'))
      window.scrollTo(0, top + 30)
      await settle()
      expect(rect(button('Back')).top).toBe(12)
      expect(rect(bar()).top).toBe(-30)
      window.dispatchEvent(new Event('touchend'))
      await waitFor(() => expect(rect(bar()).top).toBe(-48), { timeout: 3000 })
      expect(window.scrollY).toBe(top + 48)
    } finally {
      window.scrollTo(0, 0)
    }
  })

  describe('where the browser does not say when a scroll has ended', () => {
    const onscrollend = Object.getOwnPropertyDescriptor(window, 'onscrollend')!
    beforeEach(() => {
      delete (window as { onscrollend?: unknown }).onscrollend
    })
    afterEach(() => {
      Object.defineProperty(window, 'onscrollend', onscrollend)
    })

    it('settles once no more is heard of the scroll for a moment', async () => {
      expect('onscrollend' in window).toBe(false)
      render(
        <Page>
          <Bar scrollBehavior="enter-always" />
        </Page>,
      )
      await settle()
      await scrollTo(300)
      await scrollTo(260)
      expect(offset(bar())).toBe(-24)
      await rest(0, 236)
    })
  })

  describe('with reduced motion', () => {
    useReducedMotion()

    it('settles at once', async () => {
      render(
        <Page>
          <Bar variant="medium-flexible" scrollBehavior="enter-always" />
        </Page>,
      )
      await settle()
      touch()
      await scrollTo(30)
      let steps = 0
      page().addEventListener('scroll', () => steps++)
      lift()
      await rest(-48, 48)
      // The one scroll that took the page there, heard of a frame later.
      await settle()
      expect(steps).toBe(1)
    })
  })
})
