import { render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import type { Except } from '../../lib/aria'
import {
  computedColor,
  contrastRatio,
  expectHitArea,
  press,
  rgba,
  Scheme,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
  whilePressed,
} from '../../test-browser'
import { Icon } from '../icon'
import { NavigationBar, NavigationBarItem, type NavigationBarProps } from '.'

/* What needs a real browser and stylesheet: the bar's and the items' sizes in each layout and
 * where the parts sit, the colors per state, the state layer and ripple in the indicator's box,
 * the ring, contrast, the indicator's motion, forced colors. Markup and keys: navigation-bar.test.tsx. */

const bar = () => screen.getByRole('toolbar')
const item = (name: string) => screen.getByRole('button', { name })
const rectOf = (el: Element) => el.getBoundingClientRect()
/** What the item holds, which carries the icon's color, the indicator's box first in it, and the indicator in that. */
const contentOf = (name: string) => item(name).firstElementChild as HTMLElement
const pillOf = (name: string) => contentOf(name).firstElementChild as HTMLElement
const indicatorOf = (name: string) => pillOf(name).firstElementChild as HTMLElement
const glyphOf = (name: string) => item(name).querySelector<HTMLElement>('.font-icon')!
/** The label's `Text`. */
const labelOf = (name: string) => within(item(name)).getByText(name)
const stateLayerOf = (name: string) => item(name).querySelector<HTMLElement>('.state-layer')!
const circlesOf = (name: string) =>
  item(name).querySelectorAll<HTMLElement>('.opacity-state-pressed')
const centerX = (el: Element) => rectOf(el).left + rectOf(el).width / 2
const centerY = (el: Element) => rectOf(el).top + rectOf(el).height / 2
const token = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)

const names = ['Home', 'Browse', 'Radio', 'Library'] as const
/** More destinations than a bar is to have, for what it does with every number of them. */
const eight = [...names, 'Settings', 'Search', 'Profile', 'Updates'] as const
const icons: Record<string, string> = {
  Home: 'home',
  Browse: 'explore',
  Radio: 'radio',
  Library: 'library_music',
  Settings: 'settings',
}

type RowProps = Except<NavigationBarProps, 'children'> & {
  width?: number
  items?: readonly string[]
  disabled?: string
}

/** A bar of destinations in a box of a given width, which keeps which is selected. */
function Row({ width = 412, items = names, disabled, ...props }: RowProps) {
  const [selected, setSelected] = useState(items[0])
  return (
    <div style={{ width }}>
      <NavigationBar aria-label="Main" {...props}>
        {items.map((name) => (
          <NavigationBarItem
            key={name}
            isSelected={name === selected}
            isDisabled={name === disabled}
            onChange={() => setSelected(name)}
          >
            <Icon name={icons[name] ?? 'star'} />
            <Text slot="label">{name}</Text>
          </NavigationBarItem>
        ))}
      </NavigationBar>
    </div>
  )
}

describe('NavigationBar (browser)', () => {
  describe('the container', () => {
    it('is 64dp tall across its parent, on surface-container, with no shadow or corners', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      expect(rectOf(bar()).width).toBe(412)
      expect(rectOf(bar()).height).toBe(64)
      const style = getComputedStyle(bar())
      expect(style.backgroundColor).toBe(token('surface-container', bar()))
      expect(style.boxShadow).toBe('none')
      expect(style.borderTopLeftRadius).toBe('0px')
    })

    it.each([3, 4, 5])('divides its width equally between %i items of equal weight', (count) => {
      const items = [...names, 'Settings'].slice(0, count)
      render(
        <Scheme>
          <Row items={items} />
        </Scheme>,
      )
      let left = rectOf(bar()).left
      for (const name of items) {
        expect(rectOf(item(name)).left).toBeCloseTo(left, 1)
        expect(rectOf(item(name)).width).toBeCloseTo(412 / count, 1)
        expect(rectOf(item(name)).height).toBe(64)
        left += 412 / count
      }
    })

    // Compose's shares: a tenth of the bar more with each item up to six, and all of it from
    // seven. 960 wide, so the least of them, 144 each of six, has room for a label.
    it.each([
      [1, 0.4],
      [2, 0.5],
      [3, 0.6],
      [4, 0.7],
      [5, 0.8],
      [6, 0.9],
      [7, 1],
      [8, 1],
    ])('gives %i centered items %f of its width between them, in its middle', (count, share) => {
      const items = eight.slice(0, count)
      render(
        <Scheme>
          <Row width={960} layout="horizontal" arrangement="centered" items={items} />
        </Scheme>,
      )
      for (const name of items) {
        expect(rectOf(item(name)).width).toBeCloseTo((960 * share) / count, 1)
        expect(rectOf(item(name)).height).toBe(64)
      }
      const first = rectOf(item(items[0]!))
      const last = rectOf(item(items.at(-1)!))
      expect(first.left - rectOf(bar()).left).toBeCloseTo((960 * (1 - share)) / 2, 1)
      expect(rectOf(bar()).right - last.right).toBeCloseTo((960 * (1 - share)) / 2, 1)
      expect(bar().scrollWidth).toBe(bar().clientWidth)
    })

    it('counts the items a component in between draws, and one it draws later', async () => {
      // The bar's one child, which draws three items and, once Home is clicked, a fourth.
      function Group() {
        const [grown, setGrown] = useState(false)
        return names.slice(0, grown ? 4 : 3).map((name) => (
          <NavigationBarItem key={name} onPress={() => setGrown(true)}>
            <Icon name={icons[name]!} />
            <Text slot="label">{name}</Text>
          </NavigationBarItem>
        ))
      }
      render(
        <Scheme>
          <div style={{ width: 960 }}>
            <NavigationBar aria-label="Main" layout="horizontal" arrangement="centered">
              <Group />
            </NavigationBar>
          </div>
        </Scheme>,
      )
      // 60% of 960 between three, then 70% of it between four.
      for (const name of names.slice(0, 3)) expect(rectOf(item(name)).width).toBeCloseTo(192, 1)
      expect(rectOf(item('Home')).left - rectOf(bar()).left).toBeCloseTo(192, 1)
      await userEvent.click(item('Home'))
      for (const name of names) expect(rectOf(item(name)).width).toBeCloseTo(168, 1)
      expect(rectOf(item('Home')).left - rectOf(bar()).left).toBeCloseTo(144, 1)
      expect(bar().scrollWidth).toBe(bar().clientWidth)
    })

    it('divides its width equally between horizontal items too, unless told to center them', () => {
      render(
        <Scheme>
          <Row width={720} layout="horizontal" />
        </Scheme>,
      )
      expect(getComputedStyle(bar()).justifyContent).toBe('normal')
      let left = rectOf(bar()).left
      for (const name of names) {
        expect(rectOf(item(name)).left).toBeCloseTo(left, 1)
        expect(rectOf(item(name)).width).toBeCloseTo(180, 1)
        // The box keeps the width of its content, in the middle of the item's part.
        expect(rectOf(pillOf(name)).width).toBeLessThan(120)
        expect(centerX(pillOf(name))).toBeCloseTo(centerX(item(name)), 1)
        left += 180
      }
    })

    it('centers vertical items the same way, each under its share of the bar', () => {
      render(
        <Scheme>
          <Row width={720} arrangement="centered" />
        </Scheme>,
      )
      expect(getComputedStyle(bar()).justifyContent).toBe('center')
      let left = rectOf(bar()).left + 108
      for (const name of names) {
        expect(rectOf(item(name)).left).toBeCloseTo(left, 1)
        expect(rectOf(item(name)).width).toBeCloseTo(126, 1)
        expect(rectOf(pillOf(name)).width).toBe(56)
        expect(centerX(pillOf(name))).toBeCloseTo(centerX(item(name)), 1)
        expect(rectOf(labelOf(name)).top - rectOf(pillOf(name)).bottom).toBe(4)
        left += 126
      }
    })

    it('cuts a horizontal label that needs more than its equal share', () => {
      const items = ['Home', 'A destination with a very long name', 'Radio']
      render(
        <Scheme>
          <Row width={300} layout="horizontal" items={items} />
        </Scheme>,
      )
      const long = item('A destination with a very long name')
      expect(rectOf(long).width).toBeCloseTo(100, 1)
      const label = labelOf('A destination with a very long name')
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
      expect(rectOf(pillOf('A destination with a very long name')).width).toBeCloseTo(100, 1)
      expect(rectOf(item('Radio')).right).toBeCloseTo(rectOf(bar()).right, 1)
    })

    it('lets a centered item grow with its content up to an equal part, the row still centered', () => {
      const items = ['Home', 'Recently played', 'Radio']
      render(
        <Scheme>
          <Row width={600} layout="horizontal" arrangement="centered" items={items} />
        </Scheme>,
      )
      // 60% of 600 between three is 120 each, room for a short label; the long one needs more
      // and takes it, short of a third, 200.
      expect(rectOf(item('Home')).width).toBeCloseTo(120, 1)
      const long = rectOf(item('Recently played')).width
      expect(long).toBeGreaterThan(120)
      expect(long).toBeLessThan(200)
      expect(labelOf('Recently played').scrollWidth).toBe(labelOf('Recently played').clientWidth)
      const before = rectOf(item('Home')).left - rectOf(bar()).left
      const after = rectOf(bar()).right - rectOf(item('Radio')).right
      expect(before).toBeCloseTo(after, 1)
    })

    it('cuts a centered item’s horizontal label that needs more than an equal part of the bar', () => {
      const items = ['Home', 'A destination with a very long name', 'Radio']
      render(
        <Scheme>
          <Row width={360} layout="horizontal" arrangement="centered" items={items} />
        </Scheme>,
      )
      const long = item('A destination with a very long name')
      expect(rectOf(long).width).toBeCloseTo(120, 1)
      const label = labelOf('A destination with a very long name')
      expect(getComputedStyle(label).textOverflow).toBe('ellipsis')
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
      expect(rectOf(pillOf('A destination with a very long name')).right).toBeLessThanOrEqual(
        rectOf(long).right,
      )
    })

    it.each([6, 7, 8])(
      'holds %i centered items to an equal part each in a bar with no room for their labels',
      (count) => {
        const items = eight.slice(0, count)
        render(
          <Scheme>
            <Row width={480} layout="horizontal" arrangement="centered" items={items} />
          </Scheme>,
        )
        // Six need more than their 72 each and stop at a sixth, 80; seven or more share it out.
        for (const name of items) {
          expect(rectOf(item(name)).width).toBeCloseTo(480 / count, 1)
          expect(labelOf(name).scrollWidth).toBeGreaterThan(labelOf(name).clientWidth)
          expect(rectOf(pillOf(name)).right).toBeLessThanOrEqual(rectOf(item(name)).right)
        }
        expect(rectOf(item(items[0]!)).left).toBeCloseTo(rectOf(bar()).left, 1)
        expect(rectOf(item(items.at(-1)!)).right).toBeCloseTo(rectOf(bar()).right, 1)
        expect(bar().scrollWidth).toBe(bar().clientWidth)
      },
    )

    it('grows with a vertical label that wraps, the other items as tall and their icons level', () => {
      const items = ['Home', 'Radio stations and podcasts', 'Library']
      render(
        <Scheme>
          <Row width={300} items={items} />
        </Scheme>,
      )
      const label = labelOf('Radio stations and podcasts')
      expect(rectOf(label).height).toBeGreaterThan(16)
      expect(rectOf(bar()).height).toBe(6 + 32 + 4 + rectOf(label).height + 6)
      expect(rectOf(item('Home')).height).toBe(rectOf(bar()).height)
      expect(rectOf(pillOf('Home')).top).toBe(rectOf(pillOf('Radio stations and podcasts')).top)
      expect(getComputedStyle(label).textAlign).toBe('center')
    })
  })

  describe('a vertical item', () => {
    it('is the button itself, with no native styling, and takes a press anywhere in its part', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      // The 6dp above and below its content are its own padding, not the button's native one.
      const style = getComputedStyle(item('Browse'))
      expect(style.appearance).toBe('none')
      expect(style.borderTopWidth).toBe('0px')
      expect(style.marginTop).toBe('0px')
      expect(style.paddingLeft).toBe('0px')
      expect(rgba(style.backgroundColor)[3]).toBe(0)
      expect(style.touchAction).toBe('manipulation')
      expect(style.userSelect).toBe('none')
      expectHitArea(item('Browse'))
      expect(getComputedStyle(item('Browse')).cursor).toBe('pointer')
      const { left, top } = rectOf(item('Browse'))
      expect(document.elementFromPoint(left + 2, top + 2)).toBe(item('Browse'))
      // The parts take no pointer: a press on the icon or the indicator's box is the item's.
      expect(
        document.elementFromPoint(centerX(glyphOf('Browse')), centerY(glyphOf('Browse'))),
      ).toBe(item('Browse'))
    })

    it('puts a 56 by 32dp indicator box 6dp from the top, the 24dp icon in its middle', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      for (const name of names) {
        const pill = rectOf(pillOf(name))
        expect(pill.width).toBe(56)
        expect(pill.height).toBe(32)
        expect(pill.top - rectOf(bar()).top).toBe(6)
        expect(centerX(pillOf(name))).toBeCloseTo(centerX(item(name)), 1)
        const glyph = rectOf(glyphOf(name))
        expect(glyph.width).toBe(24)
        expect(glyph.height).toBe(24)
        expect(centerX(glyphOf(name))).toBeCloseTo(centerX(pillOf(name)), 1)
        expect(centerY(glyphOf(name))).toBeCloseTo(centerY(pillOf(name)), 1)
      }
      expect(getComputedStyle(pillOf('Home')).borderTopLeftRadius).not.toBe('0px')
      expect(parseFloat(getComputedStyle(pillOf('Home')).borderTopLeftRadius)).toBeGreaterThan(16)
    })

    it('puts the label 4dp under the box and 6dp from the bottom, in label medium', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      for (const name of names) {
        const label = rectOf(labelOf(name))
        expect(label.top - rectOf(pillOf(name)).bottom).toBe(4)
        expect(label.height).toBe(16)
        expect(rectOf(bar()).bottom - label.bottom).toBe(6)
        expect(centerX(labelOf(name))).toBeCloseTo(centerX(item(name)), 1)
      }
      const style = getComputedStyle(labelOf('Home'))
      expect(style.fontSize).toBe('12px')
      expect(style.lineHeight).toBe('16px')
      expect(style.fontWeight).toBe('500')
      expect(style.letterSpacing).toBe('0.5px')
      // Selected or not, the label keeps its weight, so nothing shifts on selection.
      expect(getComputedStyle(labelOf('Browse')).fontWeight).toBe('500')
    })
  })

  describe('a vertical item with a label or an icon alone', () => {
    it('keeps the 32dp box over a label with no icon, the label 4dp under it', () => {
      render(
        <Scheme>
          <div style={{ width: 412 }}>
            <NavigationBar aria-label="Main">
              <NavigationBarItem isSelected>
                <Text slot="label">Home</Text>
              </NavigationBarItem>
              <NavigationBarItem aria-label="Browse">
                <Icon name="explore" />
              </NavigationBarItem>
            </NavigationBar>
          </div>
        </Scheme>,
      )
      const box = rectOf(pillOf('Home'))
      expect([box.width, box.height, box.top - rectOf(bar()).top]).toEqual([56, 32, 6])
      expect(rectOf(labelOf('Home')).top - box.bottom).toBe(4)
      expect(rectOf(bar()).height).toBe(64)
      // An icon alone is in the middle of the bar, its box 16dp from the top, as Compose places it.
      expect(rectOf(pillOf('Browse')).top - rectOf(bar()).top).toBe(16)
      expect(centerY(glyphOf('Browse'))).toBeCloseTo(centerY(pillOf('Browse')), 1)
    })

    it('puts an icon alone in the middle of the bar, a taller one too', () => {
      render(
        <Scheme>
          <div style={{ width: 412 }}>
            <NavigationBar aria-label="Main">
              <NavigationBarItem aria-label="Home" isSelected>
                <Icon name="home" />
              </NavigationBarItem>
              <NavigationBarItem aria-label="Browse">
                <Icon name="explore" />
              </NavigationBarItem>
            </NavigationBar>
          </div>
          <div style={{ width: 300 }}>
            <NavigationBar aria-label="Other">
              <NavigationBarItem aria-label="Radio">
                <Icon name="radio" />
              </NavigationBarItem>
              <NavigationBarItem>
                <Icon name="library_music" />
                <Text slot="label">Library of stations and podcasts</Text>
              </NavigationBarItem>
            </NavigationBar>
          </div>
        </Scheme>,
      )
      const [bar, taller] = screen.getAllByRole('toolbar') as [HTMLElement, HTMLElement]
      expect(rectOf(bar).height).toBe(64)
      for (const name of ['Home', 'Browse']) {
        expect([rectOf(pillOf(name)).width, rectOf(pillOf(name)).height]).toEqual([56, 32])
        expect(rectOf(pillOf(name)).top - rectOf(bar).top).toBe(16)
        expect(centerY(glyphOf(name))).toBeCloseTo(centerY(bar), 1)
      }
      // Beside a label that wraps, an icon alone is in the middle of the taller bar.
      expect(rectOf(taller).height).toBeGreaterThan(64)
      expect(centerY(pillOf('Radio'))).toBeCloseTo(centerY(taller), 1)
      expect(rectOf(pillOf('Library of stations and podcasts')).top - rectOf(taller).top).toBe(6)
    })
  })

  describe('a horizontal item', () => {
    it('puts a 40dp indicator box 12dp from the top and bottom, in the item’s middle', () => {
      render(
        <Scheme>
          <Row width={720} layout="horizontal" arrangement="centered" />
        </Scheme>,
      )
      for (const name of names) {
        const pill = rectOf(pillOf(name))
        expect(pill.height).toBe(40)
        expect(pill.top - rectOf(bar()).top).toBe(12)
        expect(rectOf(bar()).bottom - pill.bottom).toBe(12)
        expect(centerX(pillOf(name))).toBeCloseTo(centerX(item(name)), 1)
      }
      expect(parseFloat(getComputedStyle(pillOf('Home')).borderTopLeftRadius)).toBeGreaterThan(20)
    })

    it('puts the icon 16dp inside the box, the label 4dp after it and 16dp from the end', () => {
      render(
        <Scheme>
          <Row width={720} layout="horizontal" arrangement="centered" />
        </Scheme>,
      )
      for (const name of names) {
        const pill = rectOf(pillOf(name))
        const glyph = rectOf(glyphOf(name))
        const label = rectOf(labelOf(name))
        expect(glyph.left - pill.left).toBeCloseTo(16, 1)
        expect(glyph.width).toBe(24)
        expect(label.left - glyph.right).toBeCloseTo(4, 1)
        expect(pill.right - label.right).toBeCloseTo(16, 1)
        expect(centerY(glyphOf(name))).toBeCloseTo(centerY(pillOf(name)), 1)
        expect(centerY(labelOf(name))).toBeCloseTo(centerY(pillOf(name)), 1)
        expect(label.height).toBe(16)
      }
    })

    it('mirrors in a right-to-left bar: the icon at the right of its label', () => {
      render(
        <Scheme>
          <div dir="rtl">
            <Row width={720} layout="horizontal" arrangement="centered" />
          </div>
        </Scheme>,
      )
      const pill = rectOf(pillOf('Home'))
      expect(pill.right - rectOf(glyphOf('Home')).right).toBeCloseTo(16, 1)
      expect(rectOf(glyphOf('Home')).left - rectOf(labelOf('Home')).right).toBeCloseTo(4, 1)
      // The first destination is at the right end of the row.
      expect(rectOf(item('Home')).left).toBeGreaterThan(rectOf(item('Library')).left)
    })
  })

  it('grows a horizontal item’s indicator to its box when selected', async () => {
    function Example() {
      const [selected, setSelected] = useState('Home')
      return (
        <div style={{ width: 412 }}>
          <NavigationBar aria-label="Main" layout="horizontal">
            {(['Home', 'Browse'] as const).map((name) => (
              <NavigationBarItem
                key={name}
                isSelected={name === selected}
                onChange={() => setSelected(name)}
              >
                <Icon name={icons[name]!} />
                <Text slot="label">{name}</Text>
              </NavigationBarItem>
            ))}
          </NavigationBar>
        </div>
      )
    }
    render(
      <Scheme>
        <Example />
      </Scheme>,
    )
    expect(rectOf(indicatorOf('Browse')).width).toBe(0)
    await userEvent.click(item('Browse'))
    await settle()
    expect(rectOf(indicatorOf('Browse'))).toEqual(rectOf(pillOf('Browse')))
    expect(rectOf(indicatorOf('Browse')).height).toBe(40)
    expect(rectOf(indicatorOf('Home')).width).toBe(0)
    await userEvent.unhover(item('Browse'))
  })

  describe('colors', () => {
    it('draws an inactive item’s icon and label in on-surface-variant', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const role = token('on-surface-variant', bar())
      expect(getComputedStyle(glyphOf('Browse')).color).toBe(role)
      expect(getComputedStyle(labelOf('Browse')).color).toBe(role)
    })

    it('draws the active item’s icon in on-secondary-container and its label in secondary', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      expect(getComputedStyle(glyphOf('Home')).color).toBe(token('on-secondary-container', bar()))
      expect(getComputedStyle(labelOf('Home')).color).toBe(token('secondary', bar()))
    })

    it('draws a horizontal active label, inside the indicator, in on-secondary-container', () => {
      render(
        <Scheme>
          <Row width={720} layout="horizontal" arrangement="centered" />
        </Scheme>,
      )
      const role = token('on-secondary-container', bar())
      expect(getComputedStyle(glyphOf('Home')).color).toBe(role)
      expect(getComputedStyle(labelOf('Home')).color).toBe(role)
      expect(getComputedStyle(labelOf('Browse')).color).toBe(token('on-surface-variant', bar()))
    })

    it('fills the active item’s icon and leaves the others outlined', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      expect(getComputedStyle(glyphOf('Home')).fontVariationSettings).toContain('"FILL" 1')
      expect(getComputedStyle(glyphOf('Browse')).fontVariationSettings).toContain('"FILL" 0')
    })

    it('leaves an icon’s own fill alone', () => {
      render(
        <NavigationBar>
          <NavigationBarItem isSelected>
            <Icon name="radio" className="icon-outlined" />
            <Text slot="label">Radio</Text>
          </NavigationBarItem>
        </NavigationBar>,
      )
      expect(getComputedStyle(glyphOf('Radio')).fontVariationSettings).toContain('"FILL" 0')
    })

    it.each(schemes)(
      'keeps icons at 3:1 and labels at 4.5:1 with what is behind them in %s %s',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Row />
            <Row width={600} layout="horizontal" arrangement="centered" />
          </Scheme>,
        )
        for (const nav of screen.getAllByRole('toolbar')) {
          const [active, inactive] = within(nav).getAllByRole('button')
          const container = getComputedStyle(nav).backgroundColor
          const fill = getComputedStyle(
            active!.querySelector('.navigation-bar-active-indicator')!,
          ).backgroundColor
          const glyph = (el: Element) => getComputedStyle(el.querySelector('.font-icon')!).color
          const text = (el: Element) => getComputedStyle(el.querySelector('[slot=label]')!).color
          expect(contrastRatio(glyph(active!), fill)).toBeGreaterThanOrEqual(3)
          expect(contrastRatio(glyph(inactive!), container)).toBeGreaterThanOrEqual(3)
          expect(contrastRatio(text(inactive!), container)).toBeGreaterThanOrEqual(4.5)
        }
        const [vertical, horizontal] = screen.getAllByRole('toolbar')
        const home = (nav: HTMLElement) =>
          within(within(nav).getAllByRole('button')[0]!).getByText('Home')
        expect(
          contrastRatio(
            getComputedStyle(home(vertical!)).color,
            getComputedStyle(vertical!).backgroundColor,
          ),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(
            getComputedStyle(home(horizontal!)).color,
            token('secondary-container', horizontal!),
          ),
        ).toBeGreaterThanOrEqual(4.5)
      },
    )

    it('greys out a disabled item’s icon and label to on-surface-variant at 38%', () => {
      render(
        <Scheme>
          <Row disabled="Radio" />
        </Scheme>,
      )
      const [r, g, b] = rgba(token('on-surface-variant', bar()))
      for (const el of [glyphOf('Radio'), labelOf('Radio')]) {
        const color = rgba(getComputedStyle(el).color)
        // The canvas reads a color with alpha back a level off at most.
        for (const [index, channel] of [r, g, b].entries()) {
          expect(Math.abs(color[index]! - channel!)).toBeLessThanOrEqual(1)
        }
        expect(color[3]! / 255).toBeCloseTo(0.38, 1)
      }
      expect(getComputedStyle(item('Radio')).cursor).toBe('default')
    })

    it.each(['vertical', 'horizontal'] as const)(
      'greys out a selected %s item that is disabled the same way, on its indicator',
      (layout) => {
        render(
          <Scheme>
            <Row width={720} layout={layout} disabled="Home" />
          </Scheme>,
        )
        expect(item('Home')).toHaveAttribute('aria-pressed', 'true')
        expect(getComputedStyle(indicatorOf('Home')).opacity).toBe('1')
        const [r, g, b] = rgba(token('on-surface-variant', bar()))
        for (const el of [glyphOf('Home'), labelOf('Home')]) {
          const color = rgba(getComputedStyle(el).color)
          for (const [index, channel] of [r, g, b].entries()) {
            expect(Math.abs(color[index]! - channel!)).toBeLessThanOrEqual(1)
          }
          expect(color[3]! / 255).toBeCloseTo(0.38, 1)
        }
        expect(getComputedStyle(glyphOf('Home')).fontVariationSettings).toContain('"FILL" 1')
      },
    )
  })

  describe('the active indicator', () => {
    it('fills the box of the active item in secondary-container, round at its ends', () => {
      render(
        <Scheme>
          <Row />
          <Row
            width={720}
            layout="horizontal"
            arrangement="centered"
            items={['Explore', 'Saved', 'Updates']}
          />
        </Scheme>,
      )
      for (const name of ['Home', 'Explore']) {
        const indicator = indicatorOf(name)
        expect(rectOf(indicator)).toEqual(rectOf(pillOf(name)))
        const style = getComputedStyle(indicator)
        expect(style.backgroundColor).toBe(token('secondary-container', indicator))
        expect(style.opacity).toBe('1')
        expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(16)
      }
    })

    it('is clear and has no width, at the middle of an inactive item’s box', () => {
      render(
        <Scheme>
          <Row />
          <Row
            width={720}
            layout="horizontal"
            arrangement="centered"
            items={['Explore', 'Saved', 'Updates']}
          />
        </Scheme>,
      )
      for (const name of ['Browse', 'Library', 'Saved']) {
        const indicator = indicatorOf(name)
        expect(getComputedStyle(indicator).opacity).toBe('0')
        expect(rectOf(indicator).width).toBe(0)
        expect(rectOf(indicator).height).toBe(rectOf(pillOf(name)).height)
        expect(centerX(indicator)).toBeCloseTo(centerX(pillOf(name)), 1)
      }
    })

    it.each([
      ['vertical', 412],
      ['horizontal', 720],
    ] as const)('is drawn over the bar and under what a %s item holds', async (layout, width) => {
      render(
        <Scheme>
          <Row width={width} layout={layout} />
        </Scheme>,
      )
      await settle()
      // Found once: a hidden label takes the item's name away.
      const box = pillOf('Home')
      const shot = () => page.screenshot({ element: box, save: false })
      const whole = await shot()
      // Each part changes what is drawn in the box when it is hidden: none is under another.
      const parts = [indicatorOf('Home'), glyphOf('Home')]
      if (layout === 'horizontal') parts.push(labelOf('Home'))
      for (const part of parts) {
        part.style.visibility = 'hidden'
        expect(await shot()).not.toBe(whole)
        part.style.visibility = ''
      }
      expect(await shot()).toBe(whole)
    })

    it('moves to the item selected', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      await userEvent.click(item('Radio'))
      await settle()
      expect(getComputedStyle(indicatorOf('Radio')).opacity).toBe('1')
      expect(rectOf(indicatorOf('Radio'))).toEqual(rectOf(pillOf('Radio')))
      expect(getComputedStyle(indicatorOf('Home')).opacity).toBe('0')
      expect(rectOf(indicatorOf('Home')).width).toBe(0)
      expect(getComputedStyle(glyphOf('Radio')).fontVariationSettings).toContain('"FILL" 1')
      expect(getComputedStyle(glyphOf('Home')).fontVariationSettings).toContain('"FILL" 0')
      await userEvent.unhover(item('Radio'))
    })
  })

  describe('states', () => {
    it('shows the hover and focus layers in the indicator’s box, on-secondary-container at 8% and 10%', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const role = token('on-secondary-container', bar())
      for (const name of ['Browse', 'Home']) {
        expect(getComputedStyle(stateLayerOf(name)).opacity).toBe('0')
        await userEvent.hover(item(name))
        await settle()
        const layer = stateLayerOf(name)
        expect(getComputedStyle(layer).opacity).toBe('0.08')
        expect(getComputedStyle(layer).backgroundColor).toBe(role)
        // The reduced indicator: the box's own shape, not the whole item.
        expect(rectOf(layer)).toEqual(rectOf(pillOf(name)))
        expect(parseFloat(getComputedStyle(layer).borderTopLeftRadius)).toBeGreaterThanOrEqual(16)
        await userEvent.unhover(item(name))
        await settle()
        expect(getComputedStyle(layer).opacity).toBe('0')
      }
      await userEvent.tab()
      await settle()
      expect(item('Home')).toHaveFocus()
      expect(getComputedStyle(stateLayerOf('Home')).opacity).toBe('0.1')
      await userEvent.keyboard('{ArrowRight}')
      await settle()
      expect(item('Browse')).toHaveFocus()
      expect(getComputedStyle(stateLayerOf('Browse')).opacity).toBe('0.1')
      expect(getComputedStyle(stateLayerOf('Home')).opacity).toBe('0')
    })

    it('hovers from anywhere in the item, the label included', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      // The label takes no pointer, so the pointer goes over the item where the label is.
      const position = {
        x: centerX(labelOf('Radio')) - rectOf(item('Radio')).left,
        y: centerY(labelOf('Radio')) - rectOf(item('Radio')).top,
      }
      expect(document.elementFromPoint(centerX(labelOf('Radio')), centerY(labelOf('Radio')))).toBe(
        item('Radio'),
      )
      await userEvent.hover(item('Radio'), { position })
      await settle()
      expect(getComputedStyle(stateLayerOf('Radio')).opacity).toBe('0.08')
      await userEvent.unhover(item('Radio'))
    })

    it('covers a horizontal item’s icon and label with the layer, in its box', async () => {
      render(
        <Scheme>
          <Row width={720} layout="horizontal" arrangement="centered" />
        </Scheme>,
      )
      await userEvent.hover(item('Browse'))
      await settle()
      const layer = stateLayerOf('Browse')
      expect(getComputedStyle(layer).opacity).toBe('0.08')
      expect(rectOf(layer)).toEqual(rectOf(pillOf('Browse')))
      expect(rectOf(layer).height).toBe(40)
      await userEvent.unhover(item('Browse'))
    })

    it('ripples in the indicator’s box in on-secondary-container at 10%, active or not', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const role = token('on-secondary-container', bar())
      for (const name of ['Browse', 'Home']) {
        const pressed = await whilePressed(name, async () => {
          await settle()
          const circle = circlesOf(name)[0]!
          const surface = circle.parentElement!
          return {
            color: getComputedStyle(circle).backgroundColor,
            opacity: getComputedStyle(circle).opacity,
            surface: rectOf(surface),
            clipped: getComputedStyle(surface).overflow,
          }
        })
        expect(pressed.color).toBe(role)
        expect(pressed.opacity).toBe('0.1')
        expect(pressed.surface).toEqual(rectOf(pillOf(name)))
        expect(pressed.clipped).toBe('hidden')
        await settle()
      }
      await userEvent.unhover(item('Home'))
    })

    it('rings the focused item 3dp inside its edges in secondary, from the keyboard only', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      expect(getComputedStyle(item('Home')).outlineStyle).toBe('none')
      await userEvent.tab()
      await settle()
      const style = getComputedStyle(item('Home'))
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('3px')
      expect(style.outlineOffset).toBe('-3px')
      expect(style.outlineColor).toBe(token('secondary', bar()))
      expect(style.borderTopLeftRadius).toBe('4px')
      await userEvent.click(item('Radio'))
      await settle()
      expect(getComputedStyle(item('Radio')).outlineStyle).toBe('none')
      expect(getComputedStyle(stateLayerOf('Radio')).opacity).not.toBe('0.1')
      await userEvent.unhover(item('Radio'))
    })

    it('shows no layer on a disabled item, which the arrow keys pass over', async () => {
      render(
        <Scheme>
          <Row disabled="Browse" />
        </Scheme>,
      )
      await userEvent.hover(item('Browse'))
      await settle()
      expect(getComputedStyle(stateLayerOf('Browse')).opacity).toBe('0')
      await userEvent.unhover(item('Browse'))
      await userEvent.tab()
      await userEvent.keyboard('{ArrowRight}')
      expect(item('Radio')).toHaveFocus()
    })
  })

  describe('motion', () => {
    it('grows and fades the indicator by the one spring, the default spatial', () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      for (const name of ['Home', 'Browse']) {
        const style = getComputedStyle(indicatorOf(name))
        expect(style.transitionProperty).toBe('width, opacity')
        expect(style.transitionDuration).toBe(springDuration('default-spatial'))
        expect(style.transitionTimingFunction).toBe(springEasing('default-spatial'))
      }
    })

    it('changes the icon’s and the label’s colors at once', async () => {
      render(
        <Scheme>
          <Row />
          <Row width={720} layout="horizontal" items={['Explore', 'Saved', 'Updates']} />
        </Scheme>,
      )
      for (const [name, was, role] of [
        ['Browse', 'Home', 'secondary'],
        ['Saved', 'Explore', 'on-secondary-container'],
      ] as const) {
        // Pressed in the page: the runner's answer can come after the indicator's spring is over.
        press(item(name))
        // With the indicator's transitions still at their start, the colors are already the new ones.
        const running = [...indicatorOf(name).getAnimations(), ...indicatorOf(was).getAnimations()]
        expect(running).toHaveLength(4)
        running.forEach((animation) => animation.pause())
        const inactive = token('on-surface-variant', item(name))
        expect(getComputedStyle(glyphOf(name)).color).toBe(
          token('on-secondary-container', item(name)),
        )
        expect(getComputedStyle(labelOf(name)).color).toBe(token(role, item(name)))
        expect(getComputedStyle(glyphOf(was)).color).toBe(inactive)
        expect(getComputedStyle(labelOf(was)).color).toBe(inactive)
        for (const part of [
          contentOf(name),
          glyphOf(name),
          labelOf(name),
          contentOf(was),
          labelOf(was),
        ]) {
          expect(part.getAnimations()).toHaveLength(0)
        }
        running.forEach((animation) => animation.finish())
      }
    })

    /* What the recordings of Compose's bar show of an indicator going away, per frame from the
     * frame its item is deselected in: its width as a part of its box, and its opacity. The one
     * coming in is as far along the other way. */
    const leaving = {
      vertical: [
        [4, 0.59, 0.62],
        [7, 0.247, 0.232],
        [10, 0.064, 0.028],
      ],
      horizontal: [
        [3, 0.72, 0.731],
        [4, 0.591, 0.62],
        [6, 0.351, 0.298],
        [7, 0.253, 0.232],
        [9, 0.114, 0.097],
        [10, 0.068, 0.031],
      ],
    } as const

    it.each([
      ['vertical', 412, 'Browse', 'Home'],
      ['horizontal', 720, 'Library', 'Home'],
    ] as const)(
      'follows the recording of a %s bar frame by frame: from no width, a little past its box, and back',
      async (layout, width, name, was) => {
        render(
          <Scheme>
            <Row width={width} layout={layout} />
          </Scheme>,
        )
        // Pressed in the page: the runner's answer can come after the indicator's spring is over.
        press(item(name))
        const growing = indicatorOf(name)
        const shrinking = indicatorOf(was)
        const animations = [...growing.getAnimations(), ...shrinking.getAnimations()]
        expect(animations).toHaveLength(4)
        animations.forEach((animation) => animation.pause())
        const full = rectOf(pillOf(name)).width
        const fullBefore = rectOf(pillOf(was)).width
        const at = (frame: number) => {
          animations.forEach((animation) => (animation.currentTime = (frame * 1000) / 60))
          return {
            width: rectOf(growing).width / full,
            opacity: Number(getComputedStyle(growing).opacity),
            left: rectOf(shrinking).width / fullBefore,
            leaving: Number(getComputedStyle(shrinking).opacity),
            centered: Math.abs(centerX(growing) - centerX(pillOf(name))),
            height: rectOf(growing).height,
          }
        }
        // It starts with no width, clear, and the one it takes over from whole.
        expect(at(0)).toMatchObject({ width: 0, opacity: 0, left: 1, leaving: 1 })
        for (const [frame, part, opacity] of leaving[layout]) {
          const now = at(frame)
          expect(Math.abs(now.left - part), `width leaving at frame ${frame}`).toBeLessThan(0.02)
          expect(Math.abs(now.leaving - opacity), `opacity leaving at frame ${frame}`).toBeLessThan(
            0.05,
          )
          // Its opacity is how far along its width is, as the one coming in's is.
          expect(now.leaving).toBeCloseTo(now.left, 2)
          expect(now.opacity).toBeCloseTo(now.width, 2)
          expect(now.width + now.left).toBeCloseTo(1, 2)
          expect(now.centered).toBeLessThan(0.1)
          expect(now.height).toBe(layout === 'vertical' ? 32 : 40)
        }
        // Past its box at the spring's peak, by the 1 to 1.6% the recordings measure, and whole.
        const peak = at(16)
        expect(peak.width).toBeGreaterThan(1.01)
        expect(peak.width).toBeLessThan(1.016)
        expect(peak.opacity).toBe(1)
        expect(peak.centered).toBeLessThan(0.1)
        // The one going away is gone by then, with no width to go under.
        expect(peak.left).toBe(0)
        expect(peak.leaving).toBe(0)
        // Past its box, it makes neither the item nor the bar any wider.
        expect(bar().scrollWidth).toBe(bar().clientWidth)
        animations.forEach((animation) => animation.finish())
        await settle()
        expect(rectOf(growing).width).toBeCloseTo(full, 1)
        expect(rectOf(shrinking).width).toBe(0)
      },
    )

    it('keeps an indicator as wide as its item inside it, the bar no wider at the spring’s peak', async () => {
      const long = 'A destination with a very long name'
      render(
        <Scheme>
          <Row width={300} layout="horizontal" items={['Home', 'Radio', long]} />
        </Scheme>,
      )
      expect(rectOf(item(long)).right).toBeCloseTo(rectOf(bar()).right, 1)
      // Pressed in the page: the runner's answer can come after the indicator's spring is over.
      press(item(long))
      const animations = indicatorOf(long).getAnimations()
      expect(animations).toHaveLength(2)
      animations.forEach((animation) => animation.pause())
      animations.forEach((animation) => (animation.currentTime = (16 * 1000) / 60))
      // Its box is its item's width, so the spring carries it past the item and the bar's end.
      expect(rectOf(indicatorOf(long)).right).toBeGreaterThan(rectOf(bar()).right + 0.5)
      // The item cuts it there, as Compose holds it to the item's width: nothing to scroll to.
      expect(bar().scrollWidth).toBe(bar().clientWidth)
      expect(getComputedStyle(item(long)).overflowX).toBe('clip')
      expect(getComputedStyle(item(long)).overflowY).toBe('visible')
      animations.forEach((animation) => animation.finish())
      await settle()
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('moves the indicator at once', async () => {
        render(
          <Scheme>
            <Row />
          </Scheme>,
        )
        await userEvent.click(item('Browse'))
        for (const animation of indicatorOf('Browse').getAnimations()) {
          expect(animation.effect!.getComputedTiming().duration).toBeLessThan(1)
        }
        await settle()
        expect(rectOf(indicatorOf('Browse')).width).toBe(56)
        expect(getComputedStyle(indicatorOf('Browse')).opacity).toBe('1')
        await userEvent.unhover(item('Browse'))
      })
    })

    it('follows a standard motion scope', () => {
      render(
        <Scheme>
          <div data-motion="standard">
            <Row />
          </div>
        </Scheme>,
      )
      const probe = document.createElement('div')
      probe.style.transitionDuration = 'var(--md-sys-motion-spring-default-spatial-duration)'
      bar().append(probe)
      const standard = getComputedStyle(probe).transitionDuration
      probe.remove()
      expect(standard).not.toBe(springDuration('default-spatial'))
      expect(getComputedStyle(indicatorOf('Home')).transitionDuration).toBe(standard)
    })
  })

  describe('in forced colors', () => {
    useForcedColors()

    it('draws the indicator in the system highlight and the icon on it in its text color', async () => {
      render(
        <Scheme>
          <Row />
        </Scheme>,
      )
      const indicator = indicatorOf('Home')
      expect(getComputedStyle(indicator).backgroundColor).toBe(
        computedColor('Highlight', indicator),
      )
      expect(getComputedStyle(glyphOf('Home')).color).toBe(
        computedColor('HighlightText', indicator),
      )
      await userEvent.tab()
      await settle()
      expect(getComputedStyle(item('Home')).outlineStyle).toBe('solid')
      expect(getComputedStyle(item('Home')).outlineWidth).toBe('3px')
    })

    it('draws a horizontal label on the indicator in its text color, and a disabled item in GrayText', () => {
      render(
        <Scheme>
          <Row width={720} layout="horizontal" disabled="Radio" />
        </Scheme>,
      )
      const indicator = indicatorOf('Home')
      expect(getComputedStyle(labelOf('Home')).color).toBe(
        computedColor('HighlightText', indicator),
      )
      for (const el of [glyphOf('Radio'), labelOf('Radio')]) {
        expect(getComputedStyle(el).color).toBe(computedColor('GrayText', el))
      }
    })

    it('draws a selected item that is disabled in GrayText on the highlight', () => {
      render(
        <Scheme>
          <Row disabled="Home" />
        </Scheme>,
      )
      const indicator = indicatorOf('Home')
      expect(getComputedStyle(indicator).backgroundColor).toBe(
        computedColor('Highlight', indicator),
      )
      expect(getComputedStyle(glyphOf('Home')).color).toBe(
        computedColor('GrayText', glyphOf('Home')),
      )
    })
  })
})
