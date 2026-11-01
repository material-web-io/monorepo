import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  expectHitArea,
  expectNoNativeStyling,
  pressKey,
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
import type { Except } from '../../lib/aria'
import { Icon } from '../icon'
import { Tab, TabList, TabPanel, Tabs, type TabListProps, type TabsProps } from '.'

/* What needs a real browser and stylesheet: heights, widths, padding and where the parts sit,
 * the indicator, divider and ring, the colors per state and variant, the state layer and ripple,
 * contrast, the slide, scrolling, forced colors and reduced motion. Markup and keys: tabs.test.tsx. */

const tab = (name: string) => screen.getByRole('tab', { name })
const list = () => screen.getByRole('tablist')
const rectOf = (el: Element) => el.getBoundingClientRect()
/** The label, the span Row puts it in. */
const labelOf = (name: string) => screen.getByText(name)
/** The tab's content, which holds its icon, its label and, primary, its indicator. */
const contentOf = (name: string) => labelOf(name).parentElement!
/** The active indicator: the content's last child on a primary tab, the tab's on a secondary one. */
const indicatorOf = (name: string, variant: TabsProps['variant'] = 'primary') =>
  (variant === 'primary' ? contentOf(name) : tab(name)).lastElementChild as HTMLElement
/** The focus ring, the tab's own element after its state layer and ripple surface. */
const ringOf = (name: string) => tab(name).children[2] as HTMLElement
const stateLayerOf = (name: string) => tab(name).querySelector<HTMLElement>('.state-layer')!
const circlesOf = (name: string) =>
  tab(name).querySelectorAll<HTMLElement>('.opacity-state-pressed')
const centerX = (el: Element) => rectOf(el).left + rectOf(el).width / 2
const centerY = (el: Element) => rectOf(el).top + rectOf(el).height / 2
const colorOf = (name: string) => getComputedStyle(labelOf(name)).color

const names = ['Flights', 'Trips', 'Explore'] as const
const icons = { Flights: 'flight', Trips: 'luggage', Explore: 'explore' } as const
const breeds = ['Akita', 'Alaskan', 'Australian Shepherd', 'Azawakh', 'Barbet', 'Basenji']

type RowProps = Except<TabsProps, 'children'> & {
  width?: number
  withIcons?: boolean
  listProps?: Except<TabListProps, 'children'>
  tabs?: readonly string[]
}

/* A row of tabs in a box of a given width, each its own key, its label in a span to measure it by,
 * with an icon before it if asked. It opens on its first tab unless given a key, so that it is
 * selected as it renders; given none, React Aria selects it once mounted (see colors). */
function Row({ width = 600, withIcons, listProps, tabs = names, ...props }: RowProps) {
  return (
    <Tabs defaultSelectedKey={tabs[0]} {...props} style={{ width }}>
      <TabList {...listProps}>
        {tabs.map((name) => (
          <Tab key={name} id={name}>
            {withIcons && <Icon name={icons[name as keyof typeof icons] ?? 'star'} />}
            <span>{name}</span>
          </Tab>
        ))}
      </TabList>
    </Tabs>
  )
}

/* Vertical tabs beside the panel of the selected one, 200dp tall, in a box of a given width, or
 * of a given height as well, for the column to scroll. */
function Column({
  width = 600,
  height,
  withIcons,
  listProps,
  tabs = names,
  ...props
}: RowProps & { height?: number }) {
  return (
    <Tabs orientation="vertical" defaultSelectedKey={tabs[0]} {...props} style={{ width, height }}>
      <TabList {...listProps}>
        {tabs.map((name) => (
          <Tab key={name} id={name}>
            {withIcons && <Icon name={icons[name as keyof typeof icons] ?? 'star'} />}
            <span>{name}</span>
          </Tab>
        ))}
      </TabList>
      {tabs.map((name) => (
        <TabPanel key={name} id={name} style={{ minHeight: 200 }}>
          {name} panel
        </TabPanel>
      ))}
    </Tabs>
  )
}

/* The M3 emphasized easing, the path the videos follow: the share of the way at a share of
 * the time, from the two curves M3 gives, to check the indicator's slide against. */
function emphasized(x: number) {
  const curves = [
    [0, 0, 0.05, 0, 0.133333, 0.06, 0.166666, 0.4],
    [0.166666, 0.4, 0.208333, 0.82, 0.25, 1, 1, 1],
  ] as const
  if (x <= 0) return 0
  if (x >= 1) return 1
  const [x0, y0, x1, y1, x2, y2, x3, y3] = curves[x < 0.166666 ? 0 : 1]!
  const at = (u: number, a: number, b: number, c: number, d: number) =>
    (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d
  let low = 0
  let high = 1
  for (let i = 0; i < 40; i++) {
    const u = (low + high) / 2
    if (at(u, x0, x1, x2, x3) < x) low = u
    else high = u
  }
  return at((low + high) / 2, y0, y1, y2, y3)
}

type Edge = 'left' | 'right' | 'top' | 'bottom'

/** The animations that slide a tab's indicator, paused, each keyed by the edge it moves. */
function pausedSlide(name: string, variant: TabsProps['variant'] = 'primary') {
  return pausedSlideOf(indicatorOf(name, variant))
}

function pausedSlideOf(indicator: HTMLElement) {
  const animations = indicator.getAnimations()
  const byEdge = {} as Record<Edge, Animation>
  for (const animation of animations) {
    animation.pause()
    const frame = (animation.effect as KeyframeEffect).getKeyframes()[0]!
    const edge = (['left', 'right', 'top', 'bottom'] as const).find((edge) => edge in frame)!
    byEdge[edge] = animation
  }
  return { animations, ...byEdge }
}

const ms = (value: string) => Number.parseFloat(value)
/** A duration token, as the page resolves it, in ms. */
const token = (name: string) =>
  ms(getComputedStyle(document.documentElement).getPropertyValue(name))

describe('Tabs in a browser', () => {
  describe('sizing', () => {
    it('makes a row of label tabs 48dp tall, the divider counted in, and one with stacked icons 64dp', () => {
      render(
        <Scheme>
          <Row />
          <Row withIcons tabs={['Trips']} />
        </Scheme>,
      )
      const rows = screen.getAllByRole('tablist')
      expect(rectOf(rows[0]!).height).toBe(48)
      expect(rectOf(rows[1]!).height).toBe(64)
      // The tabs sit on the divider, whose 1dp the row's height counts.
      expect(rectOf(tab('Flights')).height).toBe(47)
      expect(getComputedStyle(rows[0]!).borderBottomWidth).toBe('1px')
      expect(rectOf(rows[0]!).bottom - rectOf(tab('Flights')).bottom).toBe(1)
    })

    it('centers the label in the row, and stacks a 24dp icon over it 10dp from the top', () => {
      render(
        <Scheme>
          <Row />
          <Row withIcons tabs={['Stacked']} />
        </Scheme>,
      )
      const rows = screen.getAllByRole('tablist')
      expect(centerY(labelOf('Flights'))).toBe(centerY(rows[0]!))
      expect(rectOf(labelOf('Flights')).height).toBe(20)
      const icon = tab('Stacked').querySelector('.font-icon')!
      expect(rectOf(icon).height).toBe(24)
      expect(rectOf(icon).width).toBe(24)
      expect(rectOf(icon).top - rectOf(rows[1]!).top).toBe(10)
      expect(rectOf(labelOf('Stacked')).top).toBe(rectOf(icon).bottom)
      expect(rectOf(rows[1]!).bottom - rectOf(labelOf('Stacked')).bottom).toBe(10)
      expect(centerX(icon)).toBeCloseTo(centerX(labelOf('Stacked')), 1)
    })

    it('draws plain text as its label, as written, where a label in a span is drawn, under an icon too', () => {
      render(
        <Scheme>
          <Row width={300} tabs={['Flights']} />
          <Tabs style={{ width: 300 }} defaultSelectedKey="flights">
            <TabList>
              <Tab id="flights">Flights</Tab>
            </TabList>
          </Tabs>
          <Row width={300} withIcons tabs={['Trips']} />
          <Tabs style={{ width: 300 }} defaultSelectedKey="trips">
            <TabList>
              <Tab id="trips">
                <Icon name="luggage" />
                Trips
              </Tab>
            </TabList>
          </Tabs>
        </Scheme>,
      )
      // Plain text has no element of its own: a range around the text node is its box, read against
      // its row and compared with the span label's, since Chromium places both the same way.
      const textOffset = (list: Element, name: string) => {
        const walker = document.createTreeWalker(list, NodeFilter.SHOW_TEXT)
        let node = walker.nextNode()
        while (node && node.textContent !== name) node = walker.nextNode()
        const range = document.createRange()
        range.selectNode(node!)
        const rect = range.getBoundingClientRect()
        return { top: rect.top - rectOf(list).top, left: rect.left - rectOf(list).left }
      }
      const [inSpan, plain, inSpanStacked, plainStacked] = screen.getAllByRole('tablist')
      expect(rectOf(plain!).height).toBe(48)
      expect(textOffset(plain!, 'Flights')).toEqual(textOffset(inSpan!, 'Flights'))
      expect(rectOf(plainStacked!).height).toBe(64)
      const icon = plainStacked!.querySelector('.font-icon')!
      expect(rectOf(icon).top - rectOf(plainStacked!).top).toBe(10)
      expect(textOffset(plainStacked!, 'Trips')).toEqual(textOffset(inSpanStacked!, 'Trips'))
    })

    it('puts a secondary tab icon before the label, 8dp from it, in a 48dp row', () => {
      render(
        <Scheme>
          <Row variant="secondary" withIcons tabs={['Trips']} />
        </Scheme>,
      )
      expect(rectOf(list()).height).toBe(48)
      const icon = tab('Trips').querySelector('.font-icon')!
      expect(rectOf(labelOf('Trips')).left - rectOf(icon).right).toBe(8)
      expect(centerY(icon)).toBe(centerY(list()))
      expect(rectOf(icon).top - rectOf(list()).top).toBe(12)
    })

    it('divides a fixed row equally, with 16dp between the content and the tab edges', () => {
      render(
        <Scheme>
          <Row width={600} />
        </Scheme>,
      )
      for (const name of names) expect(rectOf(tab(name)).width).toBe(200)
      expect(rectOf(tab('Flights')).left).toBe(rectOf(list()).left)
      expect(rectOf(tab('Explore')).right).toBe(rectOf(list()).right)
      expect(getComputedStyle(tab('Flights')).paddingLeft).toBe('16px')
      expect(getComputedStyle(tab('Flights')).paddingRight).toBe('16px')
      expect(centerX(labelOf('Trips'))).toBeCloseTo(centerX(tab('Trips')), 1)
    })

    it('sizes a scrollable row tab to its label plus 16dp at each end, the first 52dp from the start', () => {
      render(
        <Scheme>
          <Row width={300} listProps={{ isScrollable: true }} />
        </Scheme>,
      )
      expect(rectOf(tab('Flights')).left - rectOf(list()).left).toBe(52)
      expect(rectOf(tab('Flights')).width).toBe(rectOf(labelOf('Flights')).width + 32)
      expect(rectOf(tab('Trips')).left).toBe(rectOf(tab('Flights')).right)
      expect(getComputedStyle(list()).overflowX).toBe('auto')
      expect(list().scrollWidth).toBeGreaterThan(list().clientWidth)
      // 52dp after the last tab as well, scrolled to the end.
      list().scrollTo({ left: list().scrollWidth, behavior: 'instant' })
      expect(rectOf(list()).right - rectOf(tab('Explore')).right).toBeCloseTo(52, 0)
    })

    it('shows no scrollbar on a scrollable row', () => {
      render(
        <Scheme>
          <Row width={200} listProps={{ isScrollable: true }} />
        </Scheme>,
      )
      expect(getComputedStyle(list()).scrollbarWidth).toBe('none')
      expect(list().clientHeight).toBe(list().offsetHeight - 1)
    })

    it('sets the label in label-large and wraps one too long for its tab, the row growing with it', () => {
      render(
        <Scheme>
          <Row width={240} tabs={['Flights', 'A label too long for its tab to hold on one line']} />
        </Scheme>,
      )
      const style = getComputedStyle(labelOf('Flights'))
      expect(style.fontSize).toBe('14px')
      expect(style.lineHeight).toBe('20px')
      expect(style.fontWeight).toBe('500')
      // Every line of it, none cut: as many 20dp lines as the font needs, 10dp above and below.
      const long = rectOf(labelOf('A label too long for its tab to hold on one line'))
      expect(long.height).toBeGreaterThan(20)
      expect(long.height % 20).toBe(0)
      expect(rectOf(list()).height).toBe(long.height + 20)
    })

    it('has a 48dp hit area', () => {
      render(
        <Scheme>
          <Row width={600} />
        </Scheme>,
      )
      expectHitArea(tab('Trips'))
    })

    it('loses a density step from the row height', () => {
      render(
        <Scheme density="-1">
          <Row />
        </Scheme>,
      )
      expect(rectOf(list()).height).toBe(44)
    })

    it('takes the density step from above and below the content, stacked icons and a secondary icon too', () => {
      render(
        <Scheme density="-2">
          <Row width={300} />
          <Row width={200} withIcons tabs={['Stacked']} />
          <Row width={200} variant="secondary" withIcons tabs={['Beside']} />
        </Scheme>,
      )
      const [labels, stacked, beside] = screen.getAllByRole('tablist')
      expect(rectOf(labels!).height).toBe(40)
      expect(centerY(labelOf('Flights'))).toBe(centerY(labels!))
      expect(rectOf(stacked!).height).toBe(56)
      const icon = tab('Stacked').querySelector('.font-icon')!
      expect(rectOf(icon).top - rectOf(stacked!).top).toBe(6)
      expect(rectOf(stacked!).bottom - rectOf(labelOf('Stacked')).bottom).toBe(6)
      expect(rectOf(beside!).height).toBe(40)
      expect(centerY(tab('Beside').querySelector('.font-icon')!)).toBe(centerY(beside!))
    })

    it('has nothing of a native control about it, a div in the tab role', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      expectNoNativeStyling(tab('Flights'))
    })

    it('has nothing of a link about it either, an <a> given an href, its label not underlined', () => {
      render(
        <Scheme>
          <Tabs style={{ width: 300 }} selectedKey="#flights">
            <TabList>
              <Tab id="#flights" href="#flights">
                Flights
              </Tab>
            </TabList>
          </Tabs>
        </Scheme>,
      )
      expect(tab('Flights').tagName).toBe('A')
      expectNoNativeStyling(tab('Flights'))
      expect(getComputedStyle(tab('Flights')).textDecorationLine).toBe('none')
    })
  })

  describe('the active indicator', () => {
    it('is 3dp of primary under the content, 2dp inside each end, with round top corners, on the divider', () => {
      render(
        <Scheme>
          <Row defaultSelectedKey="Trips" />
        </Scheme>,
      )
      const indicator = indicatorOf('Trips')
      const rect = rectOf(indicator)
      expect(rect.height).toBe(3)
      expect(rect.left).toBe(rectOf(labelOf('Trips')).left + 2)
      expect(rect.right).toBe(rectOf(labelOf('Trips')).right - 2)
      expect(rect.bottom).toBe(rectOf(tab('Trips')).bottom)
      expect(rectOf(list()).bottom - rect.bottom).toBe(1)
      const style = getComputedStyle(indicator)
      expect(style.backgroundColor).toBe(computedColor('var(--md-sys-color-primary)', indicator))
      expect(style.borderTopLeftRadius).toBe(
        computedStyleOf('rounded-t-full', (probe) => probe.borderTopLeftRadius),
      )
      expect(style.borderBottomLeftRadius).toBe('0px')
      expect(style.opacity).toBe('1')
      expect(getComputedStyle(indicatorOf('Flights')).opacity).toBe('0')
    })

    it('is at least 24dp long', () => {
      render(
        <Scheme>
          <Tabs style={{ width: 300 }} defaultSelectedKey="favorites">
            <TabList>
              <Tab id="favorites" aria-label="Favorites">
                <Icon name="favorite" />
              </Tab>
              <Tab id="trips">Trips</Tab>
            </TabList>
          </Tabs>
        </Scheme>,
      )
      const content = tab('Favorites').lastElementChild!
      const indicator = content.lastElementChild!
      expect(rectOf(content).width).toBe(24)
      expect(rectOf(indicator).width).toBe(24)
      expect(centerX(indicator)).toBeCloseTo(centerX(content), 1)
    })

    it('is 2dp of primary across the whole secondary tab, on the divider', () => {
      render(
        <Scheme>
          <Row variant="secondary" defaultSelectedKey="Trips" />
        </Scheme>,
      )
      const indicator = indicatorOf('Trips', 'secondary')
      const rect = rectOf(indicator)
      expect(rect.height).toBe(2)
      expect(rect.left).toBe(rectOf(tab('Trips')).left)
      expect(rect.right).toBe(rectOf(tab('Trips')).right)
      expect(rect.bottom).toBe(rectOf(tab('Trips')).bottom)
      expect(rectOf(list()).bottom - rect.bottom).toBe(1)
      expect(getComputedStyle(indicator).borderTopLeftRadius).toBe('0px')
      expect(getComputedStyle(indicatorOf('Flights', 'secondary')).opacity).toBe('0')
    })

    it('draws the divider as 1dp of outline-variant across the row', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const style = getComputedStyle(list())
      expect(style.borderBottomStyle).toBe('solid')
      expect(style.borderBottomColor).toBe(
        computedColor('var(--md-sys-color-outline-variant)', list()),
      )
      expect(style.backgroundColor).toBe(computedColor('var(--md-sys-color-surface)', list()))
    })
  })

  describe('colors', () => {
    it('draws an active primary tab in primary and an inactive one in on-surface-variant', () => {
      render(
        <Scheme>
          <Row withIcons />
        </Scheme>,
      )
      const primary = computedColor('var(--md-sys-color-primary)', tab('Flights'))
      const variant = computedColor('var(--md-sys-color-on-surface-variant)', tab('Trips'))
      expect(colorOf('Flights')).toBe(primary)
      expect(getComputedStyle(tab('Flights').querySelector('.font-icon')!).color).toBe(primary)
      expect(colorOf('Trips')).toBe(variant)
      expect(getComputedStyle(tab('Trips').querySelector('.font-icon')!).color).toBe(variant)
    })

    it('draws an active secondary tab in on-surface and an inactive one in on-surface-variant', () => {
      render(
        <Scheme>
          <Row variant="secondary" />
        </Scheme>,
      )
      expect(colorOf('Flights')).toBe(
        computedColor('var(--md-sys-color-on-surface)', tab('Flights')),
      )
      expect(colorOf('Trips')).toBe(
        computedColor('var(--md-sys-color-on-surface-variant)', tab('Trips')),
      )
    })

    it('selects the first tab once mounted when given no key, as React Aria has it, its label fading to the active color', async () => {
      render(
        <Scheme>
          <Tabs style={{ width: 300 }}>
            <TabList>
              {names.map((name) => (
                <Tab key={name} id={name}>
                  {name}
                </Tab>
              ))}
            </TabList>
          </Tabs>
        </Scheme>,
      )
      const primary = computedColor('var(--md-sys-color-primary)', tab('Flights'))
      // Rendered unselected first and selected right after, by React Aria's effect, the tab
      // transitions its color from the inactive one; its indicator is there at once.
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(getComputedStyle(indicatorOf('Flights')).opacity).toBe('1')
      expect(indicatorOf('Flights').getAnimations()).toEqual([])
      expect(
        tab('Flights')
          .getAnimations()
          .some((a) => a instanceof CSSTransition && a.transitionProperty === 'color'),
      ).toBe(true)
      expect(colorOf('Flights')).not.toBe(primary)
      await settle()
      expect(colorOf('Flights')).toBe(primary)
    })

    it('darkens an inactive label to on-surface while hovered or focused, and keeps an active one', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const onSurface = computedColor('var(--md-sys-color-on-surface)', tab('Trips'))
      const primary = computedColor('var(--md-sys-color-primary)', tab('Flights'))
      await userEvent.hover(tab('Trips'))
      await settle()
      expect(colorOf('Trips')).toBe(onSurface)
      await userEvent.unhover(tab('Trips'))
      await settle()
      await userEvent.tab()
      await userEvent.keyboard('{ArrowRight}')
      await settle()
      expect(tab('Trips')).toHaveFocus()
      expect(colorOf('Trips')).toBe(onSurface)
      await userEvent.keyboard('{ArrowLeft}')
      await settle()
      expect(colorOf('Flights')).toBe(primary)
      await userEvent.hover(tab('Flights'))
      await settle()
      expect(colorOf('Flights')).toBe(primary)
      await userEvent.unhover(tab('Flights'))
    })

    it('selects a tab as the mouse goes down on it, as React Aria has it, so that it is active while pressed', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const primary = computedColor('var(--md-sys-color-primary)', tab('Explore'))
      const pressed = await whilePressed(
        'Explore',
        async () => {
          await settle()
          return {
            selected: tab('Explore').getAttribute('aria-selected'),
            pressed: tab('Explore').hasAttribute('data-pressed'),
            color: colorOf('Explore'),
            layer: getComputedStyle(stateLayerOf('Explore')).backgroundColor,
          }
        },
        'tab',
      )
      // The press itself selected the tab: its label and its pressed state layer are primary.
      expect(pressed).toEqual({ selected: 'true', pressed: true, color: primary, layer: primary })
      await settle()
      expect(tab('Explore')).toHaveAttribute('aria-selected', 'true')
      expect(tab('Explore')).not.toHaveAttribute('data-pressed')
      expect(colorOf('Explore')).toBe(primary)
      await userEvent.unhover(tab('Explore'))
    })

    it('shows the hover and focus layers in the label color, at 8% and 10%', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      expect(getComputedStyle(stateLayerOf('Trips')).opacity).toBe('0')
      await userEvent.hover(tab('Trips'))
      await settle()
      expect(getComputedStyle(stateLayerOf('Trips')).opacity).toBe('0.08')
      expect(getComputedStyle(stateLayerOf('Trips')).backgroundColor).toBe(
        computedColor('var(--md-sys-color-on-surface)', tab('Trips')),
      )
      await userEvent.hover(tab('Flights'))
      await settle()
      expect(getComputedStyle(stateLayerOf('Flights')).backgroundColor).toBe(
        computedColor('var(--md-sys-color-primary)', tab('Flights')),
      )
      await userEvent.unhover(tab('Flights'))
      await userEvent.tab()
      await settle()
      expect(tab('Flights')).toHaveFocus()
      expect(getComputedStyle(stateLayerOf('Flights')).opacity).toBe('0.1')
      // The layer covers the whole tab, square.
      expect(rectOf(stateLayerOf('Flights'))).toEqual(rectOf(tab('Flights')))
      expect(getComputedStyle(stateLayerOf('Flights')).borderTopLeftRadius).toBe('0px')
    })

    it('ripples a primary tab in primary, active or not, and a secondary tab in on-surface', async () => {
      render(
        <Scheme>
          <Row />
          <Row variant="secondary" tabs={['Overview', 'Specifications']} />
        </Scheme>,
      )
      const primary = computedColor('var(--md-sys-color-primary)', tab('Trips'))
      const onSurface = computedColor('var(--md-sys-color-on-surface)', tab('Overview'))
      const rippleOf = (name: string) =>
        whilePressed(
          name,
          async () => {
            await settle()
            const circle = circlesOf(name)[0]!
            return [getComputedStyle(circle).backgroundColor, getComputedStyle(circle).opacity]
          },
          'tab',
          true,
        )
      expect(await rippleOf('Trips')).toEqual([primary, '0.1'])
      await settle()
      expect(await rippleOf('Flights')).toEqual([primary, '0.1'])
      await settle()
      expect(await rippleOf('Specifications')).toEqual([onSurface, '0.1'])
    })

    it('greys out a disabled tab to on-surface at 38%, a selected one too', () => {
      render(
        <Scheme>
          <Tabs style={{ width: 300 }} defaultSelectedKey="flights">
            <TabList>
              <Tab id="flights">Flights</Tab>
              <Tab id="trips" isDisabled>
                Trips
              </Tab>
            </TabList>
          </Tabs>
          <Tabs style={{ width: 300 }} defaultSelectedKey="saved" isDisabled>
            <TabList>
              <Tab id="saved">Saved</Tab>
            </TabList>
          </Tabs>
        </Scheme>,
      )
      const faded = computedColor(
        'color-mix(in oklab, var(--md-sys-color-on-surface) calc(var(--md-sys-state-disabled-content-opacity) * 100%), transparent)',
        tab('Trips'),
      )
      expect(rgba(faded)[3] / 255).toBeCloseTo(0.38, 1)
      expect(colorOf('Trips')).toBe(faded)
      expect(getComputedStyle(tab('Trips')).cursor).toBe('default')
      expect(tab('Saved')).toHaveAttribute('aria-selected', 'true')
      expect(colorOf('Saved')).toBe(faded)
      expect(getComputedStyle(tab('Saved')).cursor).toBe('default')
    })

    describe.each(schemes)('in the %s scheme at %s contrast', (theme, contrast) => {
      it('reads the labels at 4.5:1 and the indicator at 3:1 against the surface', () => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Row />
            <Row variant="secondary" tabs={['Overview', 'Specifications']} />
          </Scheme>,
        )
        const surface = getComputedStyle(schemeOf(tab('Flights'))).backgroundColor
        for (const name of ['Flights', 'Trips', 'Overview', 'Specifications']) {
          expect(contrastRatio(colorOf(name), surface), name).toBeGreaterThanOrEqual(4.5)
        }
        expect(
          contrastRatio(getComputedStyle(indicatorOf('Flights')).backgroundColor, surface),
        ).toBeGreaterThanOrEqual(3)
      })
    })
  })

  describe('keyboard', () => {
    it('skips a disabled tab with the arrow keys', async () => {
      render(
        <Scheme>
          <Tabs style={{ width: 300 }} defaultSelectedKey="flights">
            <TabList>
              <Tab id="flights">Flights</Tab>
              <Tab id="trips" isDisabled>
                Trips
              </Tab>
              <Tab id="explore">Explore</Tab>
            </TabList>
          </Tabs>
        </Scheme>,
      )
      await userEvent.tab()
      expect(tab('Flights')).toHaveFocus()
      await userEvent.keyboard('{ArrowRight}')
      expect(tab('Explore')).toHaveFocus()
      await userEvent.keyboard('{ArrowRight}')
      expect(tab('Flights')).toHaveFocus()
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('focus', () => {
    it('draws the 3dp secondary focus indicator inside its box at the tab edges, with 12dp corners, 4dp above the divider, on the keyboard focus the tab reports', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      expect(getComputedStyle(ringOf('Flights')).outlineStyle).toBe('none')
      await userEvent.tab()
      await settle()
      expect(tab('Flights')).toHaveFocus()
      const ring = ringOf('Flights')
      const style = getComputedStyle(ring)
      // The state tokens' indicator, drawn inward from the box's edge: its outer corners are the box's.
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('3px')
      expect(style.outlineOffset).toBe('-3px')
      expect(style.outlineColor).toBe(computedColor('var(--md-sys-color-secondary)', ring))
      expect(style.borderTopLeftRadius).toBe(computedRadius('rounded-shape-md'))
      const rect = rectOf(ring)
      expect(rect.left).toBe(rectOf(tab('Flights')).left)
      expect(rect.right).toBe(rectOf(tab('Flights')).right)
      expect(rect.top).toBe(rectOf(tab('Flights')).top)
      // 4dp above the divider, which the row's bottom edge is.
      expect(rectOf(list()).bottom - rect.bottom).toBe(5)
      // A clicked tab is focused, but not by the keyboard: no ring.
      await userEvent.click(tab('Trips'))
      await settle()
      expect(tab('Trips')).toHaveFocus()
      expect(tab('Trips')).toHaveAttribute('data-focused')
      expect(tab('Trips')).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(ringOf('Trips')).outlineStyle).toBe('none')
      expect(getComputedStyle(ringOf('Flights')).outlineStyle).toBe('none')
    })
  })

  describe('motion', () => {
    it('fades the label color on the default effects spring', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const style = getComputedStyle(tab('Flights'))
      expect(style.transitionProperty).toContain('color')
      expect(style.transitionDuration).toBe(springDuration('default-effects'))
      expect(style.transitionTimingFunction).toBe(springEasing('default-effects'))
    })

    it('slides the indicator to the tab selected, the edge ahead over an extra-long2 and the one behind over an extra-long4, on the emphasized path', async () => {
      render(
        <Scheme>
          <Row width={600} />
        </Scheme>,
      )
      const start = rectOf(indicatorOf('Flights'))
      await userEvent.click(tab('Explore'))
      const { animations, left, right } = pausedSlide('Explore')
      expect(animations).toHaveLength(2)
      // Forward, the right edge leads.
      const lead = token('--md-sys-motion-duration-extra-long2')
      const trail = token('--md-sys-motion-duration-extra-long4')
      expect([lead, trail]).toEqual([800, 1000])
      expect(right.effect!.getComputedTiming().duration).toBe(lead)
      expect(left.effect!.getComputedTiming().duration).toBe(trail)
      expect(right.effect!.getTiming().easing).toMatch(/^linear\(/)
      for (const animation of animations) animation.currentTime = trail
      const end = rectOf(indicatorOf('Explore'))
      expect(end.left).toBe(rectOf(labelOf('Explore')).left + 2)
      for (const animation of animations) animation.currentTime = 0
      const at0 = rectOf(indicatorOf('Explore'))
      expect(at0.left).toBeCloseTo(start.left, 0)
      expect(at0.right).toBeCloseTo(start.right, 0)
      for (const time of [100, 160, 200, 300, 400, 600]) {
        for (const animation of animations) animation.currentTime = time
        const rect = rectOf(indicatorOf('Explore'))
        const expectedRight = start.right + (end.right - start.right) * emphasized(time / lead)
        const expectedLeft = start.left + (end.left - start.left) * emphasized(time / trail)
        expect(Math.abs(rect.right - expectedRight), `right edge at ${time}ms`).toBeLessThan(1.5)
        expect(Math.abs(rect.left - expectedLeft), `left edge at ${time}ms`).toBeLessThan(1.5)
        expect(rect.height).toBe(3)
      }
      // Backward, the left edge leads.
      for (const animation of animations) animation.cancel()
      await userEvent.click(tab('Flights'))
      const back = pausedSlide('Flights')
      expect(back.left.effect!.getComputedTiming().duration).toBe(lead)
      expect(back.right.effect!.getComputedTiming().duration).toBe(trail)
      for (const animation of back.animations) animation.cancel()
    })

    it('slides a secondary indicator the same way, from tab edge to tab edge', async () => {
      render(
        <Scheme>
          <Row variant="secondary" width={600} />
        </Scheme>,
      )
      const start = rectOf(indicatorOf('Flights', 'secondary'))
      await userEvent.click(tab('Trips'))
      const { animations } = pausedSlide('Trips', 'secondary')
      expect(animations).toHaveLength(2)
      for (const animation of animations) animation.currentTime = 0
      expect(rectOf(indicatorOf('Trips', 'secondary')).left).toBeCloseTo(start.left, 0)
      for (const animation of animations) animation.currentTime = 1000
      expect(rectOf(indicatorOf('Trips', 'secondary')).left).toBe(rectOf(tab('Trips')).left)
      expect(rectOf(indicatorOf('Trips', 'secondary')).right).toBe(rectOf(tab('Trips')).right)
      for (const animation of animations) animation.cancel()
    })

    it('slides from where the indicator is when a selection interrupts a slide', async () => {
      render(
        <Scheme>
          <Row width={600} />
        </Scheme>,
      )
      await userEvent.click(tab('Explore'))
      const { animations } = pausedSlide('Explore')
      for (const animation of animations) animation.currentTime = 200
      const midway = rectOf(indicatorOf('Explore'))
      expect(midway.left).toBeGreaterThan(rectOf(tab('Flights')).left + 16)
      expect(midway.right).toBeLessThan(rectOf(labelOf('Explore')).right)
      await userEvent.click(tab('Trips'))
      const next = pausedSlide('Trips')
      for (const animation of next.animations) animation.currentTime = 0
      const rect = rectOf(indicatorOf('Trips'))
      expect(rect.left).toBeCloseTo(midway.left, 0)
      expect(rect.right).toBeCloseTo(midway.right, 0)
      for (const animation of next.animations) animation.cancel()
    })

    it('does not slide on mount, or on the keyboard moving the focus', async () => {
      render(
        <Scheme>
          <Row defaultSelectedKey="Trips" />
        </Scheme>,
      )
      expect(indicatorOf('Trips').getAnimations()).toEqual([])
      await userEvent.tab()
      await userEvent.keyboard('{ArrowRight}')
      await settle()
      expect(tab('Explore')).toHaveFocus()
      expect(getComputedStyle(indicatorOf('Explore')).opacity).toBe('0')
      expect(indicatorOf('Explore').getAnimations()).toEqual([])
      // Pressed in the page: the runner's answer can come after the indicator's spring is over.
      pressKey('Enter')
      expect(indicatorOf('Explore').getAnimations()).toHaveLength(2)
      await settle()
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('moves the indicator at once', async () => {
        render(
          <Scheme>
            <Row width={600} />
          </Scheme>,
        )
        await userEvent.click(tab('Explore'))
        for (const animation of indicatorOf('Explore').getAnimations()) {
          expect(animation.effect!.getComputedTiming().duration).toBeLessThan(1)
        }
        await settle()
        expect(rectOf(indicatorOf('Explore')).left).toBe(rectOf(labelOf('Explore')).left + 2)
      })
    })
  })

  describe('scrolling', () => {
    useReducedMotion()

    const Breeds = (props: RowProps) => (
      <Row width={300} listProps={{ isScrollable: true }} tabs={breeds} {...props} />
    )
    const centered = (name: string) => Math.abs(centerX(tab(name)) - centerX(list()))
    const atEnd = () => list().scrollWidth - list().clientWidth

    it('opens a scrollable row on the selected tab, in the middle as far as it scrolls', () => {
      render(
        <Scheme>
          <Breeds defaultSelectedKey="Azawakh" />
        </Scheme>,
      )
      expect(list().scrollLeft).toBeGreaterThan(0)
      expect(centered('Azawakh')).toBeLessThan(1)
    })

    it('centers the tab a click selects, once React Aria has put the focus in the row', async () => {
      render(
        <Scheme>
          <Breeds />
        </Scheme>,
      )
      expect(list().scrollLeft).toBe(0)
      expect(rectOf(tab('Australian Shepherd')).right).toBeGreaterThan(rectOf(list()).right)
      await userEvent.click(tab('Australian Shepherd'))
      await settle()
      expect(tab('Australian Shepherd')).toHaveAttribute('aria-selected', 'true')
      expect(tab('Australian Shepherd')).toHaveFocus()
      expect(centered('Australian Shepherd')).toBeLessThan(1)
    })

    it('scrolls a tab the keyboard focuses into view at the edge of the row, as React Aria does, and centers it once selected', async () => {
      render(
        <Scheme>
          <Breeds />
        </Scheme>,
      )
      await userEvent.tab()
      expect(tab('Akita')).toHaveFocus()
      // End brings the last tab to the row's end, flush with it: React Aria's scroll, not the 52dp offset.
      await userEvent.keyboard('{End}')
      await settle()
      expect(tab('Basenji')).toHaveFocus()
      expect(rectOf(tab('Basenji')).right).toBeCloseTo(rectOf(list()).right, 0)
      expect(list().scrollLeft).toBeCloseTo(atEnd() - 52, 0)
      // A tab already in view leaves the row where it is.
      const before = list().scrollLeft
      await userEvent.keyboard('{ArrowLeft}')
      await settle()
      expect(tab('Barbet')).toHaveFocus()
      expect(list().scrollLeft).toBe(before)
      // Selecting the focused tab centers it, here as far as the row scrolls: to its end.
      await userEvent.keyboard('{ArrowRight}{Enter}')
      await settle()
      expect(tab('Basenji')).toHaveAttribute('aria-selected', 'true')
      expect(list().scrollLeft).toBe(atEnd())
      expect(rectOf(list()).right - rectOf(tab('Basenji')).right).toBeCloseTo(52, 0)
      // Home brings the first tab to the row's start, flush with it.
      await userEvent.keyboard('{Home}')
      await settle()
      expect(tab('Akita')).toHaveFocus()
      expect(rectOf(tab('Akita')).left).toBeCloseTo(rectOf(list()).left, 0)
    })

    it('scrolls a right-to-left row the same way', async () => {
      render(
        <Scheme>
          <div dir="rtl">
            <Breeds defaultSelectedKey="Azawakh" />
          </div>
        </Scheme>,
      )
      // Opened on Azawakh, in the middle; Akita, the first, is past the start edge on the right.
      expect(centered('Azawakh')).toBeLessThan(1)
      expect(rectOf(tab('Akita')).right).toBeGreaterThan(rectOf(list()).right)
      expect(list().scrollLeft).toBeLessThan(0)
      await userEvent.click(tab('Akita'))
      await settle()
      // Chromium snaps a fractional overflow to whole pixels in rtl, a pixel short of the start.
      expect(Math.abs(list().scrollLeft)).toBeLessThanOrEqual(1)
      const offset = rectOf(list()).right - rectOf(tab('Akita')).right
      expect(offset).toBeGreaterThanOrEqual(52)
      expect(offset).toBeLessThanOrEqual(53)
    })
  })

  describe('vertical', () => {
    /** A vertical tab's active indicator, the tab's own last child in either variant. */
    const sideIndicatorOf = (name: string) => tab(name).lastElementChild as HTMLElement
    const panel = () => screen.getByRole('tabpanel')

    it('stacks the tabs in a column beside the panel, each 48dp tall and as wide as the widest', () => {
      render(
        <Scheme>
          <Column />
        </Scheme>,
      )
      expect(list()).toHaveAttribute('aria-orientation', 'vertical')
      const widest = Math.max(...names.map((name) => rectOf(labelOf(name)).width)) + 32
      names.forEach((name, i) => {
        const rect = rectOf(tab(name))
        expect(rect.height).toBe(48)
        expect(rect.left).toBe(rectOf(list()).left)
        expect(rect.width).toBeCloseTo(widest, 0)
        expect(rect.top).toBe(i === 0 ? rectOf(list()).top : rectOf(tab(names[i - 1]!)).bottom)
        expect(centerX(labelOf(name))).toBeCloseTo(centerX(tab(name)), 1)
        expect(centerY(labelOf(name))).toBeCloseTo(centerY(tab(name)), 1)
      })
      // The panel takes the rest of the width, and the column, with its divider, the whole height.
      expect(rectOf(panel()).left).toBe(rectOf(list()).right)
      expect(rectOf(panel()).right).toBe(rectOf(list().parentElement!).right)
      expect(rectOf(list()).height).toBe(200)
    })

    it('makes a primary tab with its icon over its label 64dp tall, and a secondary one 48dp', () => {
      render(
        <Scheme>
          <Column withIcons />
          <Column withIcons variant="secondary" tabs={['Akita']} />
        </Scheme>,
      )
      expect(rectOf(tab('Flights')).height).toBe(64)
      expect(rectOf(tab('Akita')).height).toBe(48)
      expect(rectOf(sideIndicatorOf('Flights')).height).toBe(40)
    })

    it('draws the divider at the inline end of the column, at its left in right to left', () => {
      render(
        <Scheme>
          <Column />
          <div dir="rtl">
            <Column tabs={['Akita', 'Barbet']} />
          </div>
        </Scheme>,
      )
      const [ltr, rtl] = screen.getAllByRole('tablist') as [HTMLElement, HTMLElement]
      expect(getComputedStyle(ltr).borderBottomWidth).toBe('0px')
      expect(getComputedStyle(ltr).borderRightWidth).toBe('1px')
      expect(getComputedStyle(ltr).borderRightStyle).toBe('solid')
      expect(getComputedStyle(ltr).borderRightColor).toBe(
        computedColor('var(--md-sys-color-outline-variant)', ltr),
      )
      expect(rectOf(ltr).right - rectOf(tab('Flights')).right).toBe(1)
      expect(getComputedStyle(rtl).borderLeftWidth).toBe('1px')
      expect(getComputedStyle(rtl).borderRightWidth).toBe('0px')
      expect(rectOf(tab('Akita')).left - rectOf(rtl).left).toBe(1)
      expect(rectOf(rtl).right).toBe(rectOf(rtl.parentElement!).right)
    })

    it('puts a primary indicator 3dp wide on the divider, 2dp inside the content’s ends, round at its start', () => {
      render(
        <Scheme>
          <Column defaultSelectedKey="Trips" />
        </Scheme>,
      )
      const indicator = sideIndicatorOf('Trips')
      const rect = rectOf(indicator)
      expect(rect.width).toBe(3)
      expect(rect.right).toBe(rectOf(tab('Trips')).right)
      expect(rectOf(list()).right - rect.right).toBe(1)
      // 10dp of padding and 2dp more at each end: 24dp along a label.
      expect(rect.top - rectOf(tab('Trips')).top).toBe(12)
      expect(rectOf(tab('Trips')).bottom - rect.bottom).toBe(12)
      const style = getComputedStyle(indicator)
      expect(style.backgroundColor).toBe(computedColor('var(--md-sys-color-primary)', indicator))
      expect(style.borderTopLeftRadius).toBe(
        computedStyleOf('rounded-s-full', (probe) => probe.borderTopLeftRadius),
      )
      expect(style.borderBottomLeftRadius).toBe(style.borderTopLeftRadius)
      expect(style.borderTopRightRadius).toBe('0px')
      expect(style.opacity).toBe('1')
      expect(getComputedStyle(sideIndicatorOf('Flights')).opacity).toBe('0')
    })

    it('puts a secondary indicator 2dp wide along the whole tab, on the divider', () => {
      render(
        <Scheme>
          <Column variant="secondary" defaultSelectedKey="Trips" />
        </Scheme>,
      )
      const rect = rectOf(sideIndicatorOf('Trips'))
      expect(rect.width).toBe(2)
      expect([rect.top, rect.bottom, rect.right]).toEqual([
        rectOf(tab('Trips')).top,
        rectOf(tab('Trips')).bottom,
        rectOf(tab('Trips')).right,
      ])
      expect(getComputedStyle(sideIndicatorOf('Trips')).borderTopLeftRadius).toBe('0px')
    })

    it('loses a density step from each tab, the indicator still 2dp inside the content', () => {
      render(
        <Scheme>
          <Column className="density-2" defaultSelectedKey="Trips" />
        </Scheme>,
      )
      expect(rectOf(tab('Trips')).height).toBe(40)
      expect(rectOf(sideIndicatorOf('Trips')).height).toBe(24)
      expect(centerY(sideIndicatorOf('Trips'))).toBeCloseTo(centerY(labelOf('Trips')), 1)
    })

    it('moves the focus with the up and down arrow keys, and rings a tab 4dp from the divider', async () => {
      render(
        <Scheme>
          <Column />
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      expect(tab('Trips')).toHaveFocus()
      const ring = ringOf('Trips')
      expect(getComputedStyle(ring).outlineStyle).toBe('solid')
      const rect = rectOf(ring)
      expect([rect.left, rect.top, rect.bottom]).toEqual([
        rectOf(tab('Trips')).left,
        rectOf(tab('Trips')).top,
        rectOf(tab('Trips')).bottom,
      ])
      expect(rectOf(list()).right - rect.right).toBe(5)
      await userEvent.keyboard('{ArrowUp}')
      expect(tab('Flights')).toHaveFocus()
    })

    it('slides the indicator up and down, the edge ahead over an extra-long2 and the one behind over an extra-long4', async () => {
      render(
        <Scheme>
          <Column />
        </Scheme>,
      )
      const lead = token('--md-sys-motion-duration-extra-long2')
      const trail = token('--md-sys-motion-duration-extra-long4')
      const start = rectOf(sideIndicatorOf('Flights'))
      await userEvent.click(tab('Explore'))
      const { animations, top, bottom } = pausedSlideOf(sideIndicatorOf('Explore'))
      expect(animations).toHaveLength(2)
      // Down, the bottom edge leads.
      expect(bottom.effect!.getComputedTiming().duration).toBe(lead)
      expect(top.effect!.getComputedTiming().duration).toBe(trail)
      for (const animation of animations) animation.currentTime = 0
      const at0 = rectOf(sideIndicatorOf('Explore'))
      expect(at0.top).toBeCloseTo(start.top, 0)
      expect(at0.bottom).toBeCloseTo(start.bottom, 0)
      expect([at0.left, at0.width]).toEqual([start.left, start.width])
      for (const animation of animations) animation.currentTime = 400
      const midway = rectOf(sideIndicatorOf('Explore'))
      expect(midway.top).toBeGreaterThan(start.top)
      expect(midway.bottom).toBeLessThan(rectOf(tab('Explore')).bottom - 12)
      expect(midway.width).toBe(3)
      for (const animation of animations) animation.cancel()
      expect(rectOf(sideIndicatorOf('Explore')).top - rectOf(tab('Explore')).top).toBe(12)
      // Up, the top edge leads.
      await userEvent.click(tab('Flights'))
      const back = pausedSlideOf(sideIndicatorOf('Flights'))
      expect(back.top.effect!.getComputedTiming().duration).toBe(lead)
      expect(back.bottom.effect!.getComputedTiming().duration).toBe(trail)
      for (const animation of back.animations) animation.cancel()
    })

    describe('scrollable', () => {
      useReducedMotion()

      const Breeds = (props: RowProps) => (
        <Column height={150} listProps={{ isScrollable: true }} tabs={breeds} {...props} />
      )
      const centered = (name: string) => Math.abs(centerY(tab(name)) - centerY(list()))

      it('scrolls up and down, with no offset at its ends, and opens on the selected tab in the middle', () => {
        render(
          <Scheme>
            <Breeds defaultSelectedKey="Azawakh" />
          </Scheme>,
        )
        expect(rectOf(list()).height).toBe(150)
        expect(getComputedStyle(list()).overflowY).toBe('auto')
        expect(list().scrollWidth).toBe(list().clientWidth)
        expect(list().scrollHeight).toBe(breeds.length * 48)
        expect(list().scrollTop).toBeGreaterThan(0)
        expect(centered('Azawakh')).toBeLessThan(1)
      })

      it('centers the tab a click selects', async () => {
        render(
          <Scheme>
            <Breeds />
          </Scheme>,
        )
        expect(list().scrollTop).toBe(0)
        expect(rectOf(tab('Azawakh')).bottom).toBeGreaterThan(rectOf(list()).bottom)
        await userEvent.click(tab('Azawakh'))
        await settle()
        expect(tab('Azawakh')).toHaveAttribute('aria-selected', 'true')
        expect(centered('Azawakh')).toBeLessThan(1)
      })
    })
  })

  describe('in forced colors', () => {
    useForcedColors()

    it('keeps the indicator, the divider and the ring visible', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const indicator = indicatorOf('Flights')
      expect(getComputedStyle(indicator).backgroundColor).toBe(
        computedColor('CanvasText', indicator),
      )
      expect(getComputedStyle(list()).borderBottomStyle).toBe('solid')
      expect(rgba(getComputedStyle(list()).borderBottomColor)[3]).toBe(255)
      await userEvent.tab()
      await settle()
      expect(getComputedStyle(ringOf('Flights')).outlineStyle).toBe('solid')
      expect(rgba(getComputedStyle(ringOf('Flights')).outlineColor)[3]).toBe(255)
    })

    it('draws a disabled tab in GrayText, a selected one too', () => {
      render(
        <Scheme>
          <Row isDisabled />
        </Scheme>,
      )
      const gray = computedColor('GrayText', tab('Flights'))
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(colorOf('Flights')).toBe(gray)
      expect(colorOf('Trips')).toBe(gray)
    })
  })
})
