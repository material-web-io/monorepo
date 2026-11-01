import { render, screen, within } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { Text } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  expectNoNativeStyling,
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
import { Fab } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
  NavigationRailSection,
  type NavigationRailProps,
} from '.'

/* What needs a real browser and stylesheet: the rail's sizes collapsed and expanded and where
 * its parts sit, the colors per state, the motion between the two frame by frame, forced
 * colors. Markup, keys and focus: navigation-rail.test.tsx. */

// React Aria's Toolbar, hidden or not: a rail that hides when collapsed is out of the
// accessibility tree.
const rail = () => screen.getByRole('toolbar', { hidden: true })
const item = (name: string) => screen.getByRole('button', { name })
const page = () => screen.getByTestId('page')
const rectOf = (el: Element) => el.getBoundingClientRect()
/** A rect's place from the rail's top and leading edge. */
const within_ = (el: Element) => {
  const [box, origin] = [rectOf(el), rectOf(rail())]
  return {
    x: box.left - origin.left,
    y: box.top - origin.top,
    width: box.width,
    height: box.height,
    right: box.right - origin.left,
    bottom: box.bottom - origin.top,
  }
}
/** What the rail holds, laid out as wide as the expanded rail. */
const contentOf = () => rail().firstElementChild as HTMLElement
/** What the indicator hugs, the item’s first child: its box, the icon, and the labels beside and under it. */
const hugOf = (name: string) => item(name).firstElementChild as HTMLElement
const boxOf = (name: string) => hugOf(name).firstElementChild as HTMLElement
const indicatorOf = (name: string) => boxOf(name).firstElementChild as HTMLElement
const iconOf = (name: string) => hugOf(name).children[1] as HTMLElement
const besideOf = (name: string) => hugOf(name).children[2] as HTMLElement
const belowOf = (name: string) => hugOf(name).children[3] as HTMLElement
const stateLayerOf = (name: string) => item(name).querySelector<HTMLElement>('.state-layer')!
const token = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)

const names = ['Alarm', 'Clock', 'Timer', 'Stopwatch'] as const
const icons: Record<string, string> = {
  Alarm: 'alarm',
  Clock: 'schedule',
  Timer: 'hourglass_empty',
  Stopwatch: 'timer',
}

type ShellProps = NavigationRailProps & {
  items?: readonly string[]
  disabled?: string
  menu?: boolean
  fab?: boolean
  label?: string
  height?: number
  dir?: 'ltr' | 'rtl'
  sections?: ReactNode
}

/** A window 560dp tall with the rail along its leading edge and a page beside it; the rail keeps which destination is selected, the third at the start. */
function Shell({
  items = names,
  disabled,
  menu = false,
  fab = false,
  label = 'Compose',
  height = 560,
  dir,
  sections,
  ...props
}: ShellProps) {
  const [selected, setSelected] = useState(items[2] ?? items[0])
  return (
    <div dir={dir} style={{ display: 'flex', width: 640, height }}>
      <NavigationRail aria-label="Main" {...props}>
        {(menu || fab) && (
          <NavigationRailHeader>
            {menu && (
              <IconButton aria-label="Menu">
                <Icon name="menu" />
              </IconButton>
            )}
            {fab && (
              <Fab aria-label="Compose" isExtended={props.isExpanded ?? false}>
                <Icon name="edit" />
                <Text slot="label">{label}</Text>
              </Fab>
            )}
          </NavigationRailHeader>
        )}
        {items.map((name) => (
          <NavigationRailItem
            key={name}
            isSelected={name === selected}
            isDisabled={name === disabled}
            onChange={() => setSelected(name)}
          >
            <Icon name={icons[name] ?? 'star'} />
            <Text slot="label">{name}</Text>
          </NavigationRailItem>
        ))}
        {sections}
      </NavigationRail>
      <div data-testid="page" style={{ flex: 1, minWidth: 0 }} />
    </div>
  )
}

/** Renders a shell on the surface and waits for the rail's width to be measured. */
async function show(props: ShellProps = {}) {
  const view = render(
    <Scheme>
      <Shell {...props} />
    </Scheme>,
  )
  await settle()
  return {
    ...view,
    update: (next: ShellProps) =>
      view.rerender(
        <Scheme>
          <Shell {...props} {...next} />
        </Scheme>,
      ),
  }
}

/**
 * Stops what has just started moving, and returns what puts it where it is a number of
 * frames, 60 to the second, after it started.
 */
function freeze() {
  void getComputedStyle(rail()).width
  const animations = document.getAnimations()
  animations.forEach((animation) => animation.pause())
  return (frame: number) =>
    animations.forEach((animation) => (animation.currentTime = (frame * 1000) / 60))
}

describe('NavigationRail (browser)', () => {
  describe('the container', () => {
    it('is 96dp wide collapsed, as tall as what holds it, on the surface, square and flat', async () => {
      await show()
      expect(rectOf(rail()).width).toBe(96)
      expect(rectOf(rail()).height).toBe(560)
      const style = getComputedStyle(rail())
      expect(style.backgroundColor).toBe(token('surface', rail()))
      expect(style.boxShadow).toBe('none')
      expect(style.borderTopRightRadius).toBe('0px')
    })

    it('is 220dp wide expanded when what it holds needs no more, and the page has the rest', async () => {
      await show({ isExpanded: true })
      expect(rectOf(rail()).width).toBe(220)
      expect(rectOf(page()).left).toBe(rectOf(rail()).right)
      expect(rectOf(page()).width).toBe(420)
    })

    it('is as wide as its widest item expanded, 20dp either side of the indicator, up to 360dp', async () => {
      const long = 'A destination with a long name'
      const { update } = await show({ isExpanded: true, items: [long, 'Clock', 'Timer'] })
      const width = rectOf(rail()).width
      expect(width).toBeGreaterThan(220)
      expect(width).toBeCloseTo(rectOf(boxOf(long)).width + 40, 0)

      const longer = `${long}, which goes on for longer than the rail can be wide`
      update({ isExpanded: true, items: [longer, 'Clock', 'Timer'] })
      await settle()
      expect(rectOf(rail()).width).toBe(360)
      // Its label wraps, where it does not fit, and is not cut.
      expect(rectOf(besideOf(longer)).height).toBeGreaterThan(20)
      expect(rectOf(boxOf(longer)).right).toBeLessThanOrEqual(rectOf(rail()).right - 20)
    })

    it('is as wide as an extended FAB in its header needs', async () => {
      await show({
        isExpanded: true,
        fab: true,
        label: 'Compose a longer message',
        items: ['A', 'B', 'C'],
      })
      const fab = rectOf(item('Compose'))
      expect(fab.left - rectOf(rail()).left).toBe(20)
      expect(fab.width).toBeGreaterThan(180)
      expect(rectOf(rail()).width).toBe(fab.width + 40)
    })

    it('is as wide expanded as what it holds when mounted in a scaled element, as a dialog scaling in', async () => {
      render(
        <Scheme>
          <div style={{ scale: 0.5 }}>
            <Shell isExpanded />
          </div>
        </Scheme>,
      )
      await settle()
      expect(rectOf(rail()).width).toBe(110)
      expect(rectOf(rail()).width).toBe(rectOf(contentOf()).width)
    })
  })

  describe('the header', () => {
    it('puts a menu button and a FAB 44dp from the top, each centered in a 56dp cell, 4dp apart, in line with the icons', async () => {
      await show({ menu: true, fab: true })
      const menu = within_(item('Menu'))
      expect(menu.x + menu.width / 2).toBe(48)
      expect(menu.y + menu.height / 2).toBe(72)
      const fab = within_(item('Compose'))
      expect(fab).toMatchObject({ x: 20, y: 104, width: 56, height: 56 })
      // The items are 40dp under it, the first indicator 6dp further.
      expect(within_(item('Alarm')).y).toBe(200)
      expect(within_(boxOf('Alarm')).y).toBe(206)
    })

    it.each([
      [{ menu: true, fab: false }, 140],
      [{ menu: false, fab: true }, 140],
      [{ menu: false, fab: false }, 44],
    ])('starts the items under what it holds: %o', async (header, top) => {
      await show(header)
      expect(within_(item('Alarm')).y).toBe(top)
    })

    it('keeps the menu button and the FAB where they are as the rail expands', async () => {
      await show({ menu: true, fab: true, isExpanded: true })
      const menu = within_(item('Menu'))
      expect(menu.x + menu.width / 2).toBe(48)
      expect(menu.y + menu.height / 2).toBe(72)
      expect(within_(item('Compose'))).toMatchObject({ x: 20, y: 104, height: 56 })
      expect(within_(item('Compose')).width).toBeGreaterThan(56)
      expect(within_(item('Alarm')).y).toBe(200)
    })

    it('rests its FAB at level 0, and lifts it one level under the pointer', async () => {
      await show({ fab: true })
      expect(getComputedStyle(item('Compose')).boxShadow).toBe(
        computedStyleOf('shadow-none', (style) => style.boxShadow),
      )
      await userEvent.hover(item('Compose'))
      await settle()
      expect(getComputedStyle(item('Compose')).boxShadow).toBe(
        computedStyleOf('shadow-elevation-1', (style) => style.boxShadow),
      )
      await userEvent.unhover(item('Compose'))
    })
  })

  describe('an item of a collapsed rail', () => {
    it('is 64dp tall across the rail, 4dp from the next', async () => {
      await show()
      names.forEach((name, index) => {
        const box = within_(item(name))
        expect(box.x).toBe(0)
        expect(box.y).toBe(44 + index * 68)
        expect(box.width).toBe(96)
        expect(box.height).toBe(64)
      })
    })

    it('has a 56 by 32dp indicator box 6dp from its top, its icon in the middle of it, and its label 4dp under it', async () => {
      await show()
      for (const name of names) {
        const top = within_(item(name)).y
        expect(within_(boxOf(name))).toMatchObject({ x: 20, y: top + 6, width: 56, height: 32 })
        expect(within_(iconOf(name))).toMatchObject({ x: 36, y: top + 10, width: 24, height: 24 })
        const label = within_(belowOf(name))
        expect(label).toMatchObject({ x: 0, y: top + 42, width: 96, height: 16 })
        expect(getComputedStyle(belowOf(name)).textAlign).toBe('center')
        expect(getComputedStyle(belowOf(name)).fontSize).toBe('12px')
        expect(getComputedStyle(belowOf(name)).fontWeight).toBe('500')
        expect(getComputedStyle(belowOf(name)).opacity).toBe('1')
        expect(getComputedStyle(besideOf(name)).opacity).toBe('0')
      }
    })

    it('draws the indicator of the selected item only, all of its box, in secondary-container and fully round', async () => {
      await show()
      expect(rectOf(indicatorOf('Timer'))).toEqual(rectOf(boxOf('Timer')))
      const style = getComputedStyle(indicatorOf('Timer'))
      expect(style.backgroundColor).toBe(token('secondary-container', rail()))
      expect(style.opacity).toBe('1')
      expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(16)
      expect(rectOf(indicatorOf('Alarm')).width).toBe(0)
      expect(getComputedStyle(indicatorOf('Alarm')).opacity).toBe('0')
    })

    it('colors the icon and label on-surface-variant, and the selected icon on-secondary-container over a secondary label', async () => {
      await show()
      expect(getComputedStyle(iconOf('Alarm')).color).toBe(token('on-surface-variant', rail()))
      expect(getComputedStyle(belowOf('Alarm')).color).toBe(token('on-surface-variant', rail()))
      expect(getComputedStyle(iconOf('Timer')).color).toBe(token('on-secondary-container', rail()))
      expect(getComputedStyle(belowOf('Timer')).color).toBe(token('secondary', rail()))
    })

    it('fills the selected item’s icon and leaves the others outlined', async () => {
      await show()
      expect(getComputedStyle(iconOf('Timer')).fontVariationSettings).toContain('"FILL" 1')
      expect(getComputedStyle(iconOf('Alarm')).fontVariationSettings).toContain('"FILL" 0')
    })

    it('takes a press anywhere across the rail, and none past its edge', async () => {
      await show()
      const { left, top } = rectOf(item('Alarm'))
      const hit = (x: number) => document.elementFromPoint(left + x, top + 32)
      expect(item('Alarm').contains(hit(2))).toBe(true)
      expect(item('Alarm').contains(hit(94))).toBe(true)
      expect(hit(98)).toBe(page())
    })

    it('grows with a label that wraps, and keeps its padding', async () => {
      await show({ items: ['Notifications and messages', 'Clock', 'Timer'] })
      const name = 'Notifications and messages'
      const label = within_(belowOf(name))
      expect(label.height).toBeGreaterThan(16)
      expect(label.width).toBe(96)
      expect(within_(item(name)).height).toBe(6 + 32 + 4 + label.height + 6)
      expect(within_(item('Clock')).y).toBe(within_(item(name)).bottom + 4)
    })

    it('leaves nothing of the browser’s own button', async () => {
      await show()
      expectNoNativeStyling(item('Alarm'))
      expect(getComputedStyle(item('Alarm')).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })
  })

  describe('an item of an expanded rail', () => {
    it('is 56dp tall across the rail, with nothing between it and the next', async () => {
      await show({ isExpanded: true })
      names.forEach((name, index) => {
        expect(within_(item(name))).toMatchObject({
          x: 0,
          y: 44 + index * 56,
          width: 220,
          height: 56,
        })
      })
    })

    it('has an indicator box that hugs its icon and the label beside it, 16dp around and 8dp between, 20dp from the rail’s edge', async () => {
      await show({ isExpanded: true })
      for (const name of names) {
        const top = within_(item(name)).y
        const label = within_(besideOf(name))
        expect(within_(iconOf(name))).toMatchObject({ x: 36, y: top + 16, width: 24, height: 24 })
        expect(label.x).toBe(68)
        expect(label.y + label.height / 2).toBe(top + 28)
        const box = within_(boxOf(name))
        expect(box).toMatchObject({ x: 20, y: top, height: 56 })
        expect(box.right).toBeCloseTo(label.right + 16, 1)
        expect(getComputedStyle(besideOf(name)).fontSize).toBe('14px')
        expect(getComputedStyle(besideOf(name)).opacity).toBe('1')
        expect(getComputedStyle(belowOf(name)).opacity).toBe('0')
      }
    })

    it('colors the selected label on-secondary-container, in the indicator', async () => {
      await show({ isExpanded: true })
      expect(getComputedStyle(besideOf('Timer')).color).toBe(
        token('on-secondary-container', rail()),
      )
      expect(getComputedStyle(besideOf('Alarm')).color).toBe(token('on-surface-variant', rail()))
      expect(rectOf(indicatorOf('Timer'))).toEqual(rectOf(boxOf('Timer')))
    })

    it('takes a press anywhere across the rail, past its indicator', async () => {
      await show({ isExpanded: true })
      const { left, top } = rectOf(item('Alarm'))
      expect(item('Alarm').contains(document.elementFromPoint(left + 216, top + 28))).toBe(true)
    })
  })

  describe('the states', () => {
    it.each([false, true])(
      'shows the hover layer in the indicator’s box, on-secondary-container at 8%% (expanded: %s)',
      async (expanded) => {
        await show({ isExpanded: expanded })
        await userEvent.hover(item('Alarm'))
        await settle()
        const layer = stateLayerOf('Alarm')
        expect(rectOf(layer)).toEqual(rectOf(boxOf('Alarm')))
        expect(getComputedStyle(layer).opacity).toBe('0.08')
        expect(getComputedStyle(layer).backgroundColor).toBe(
          token('on-secondary-container', rail()),
        )
        expect(getComputedStyle(stateLayerOf('Clock')).opacity).toBe('0')
        await userEvent.unhover(item('Alarm'))
      },
    )

    it.each([
      [false, 96],
      [true, 220],
    ])(
      'shows the focus layer and a ring at the item’s edges, as wide as the rail (expanded: %s)',
      async (expanded, width) => {
        await show({ isExpanded: expanded })
        await userEvent.tab()
        expect(item('Alarm')).toHaveFocus()
        await settle()
        expect(getComputedStyle(stateLayerOf('Alarm')).opacity).toBe('0.1')
        const ring = getComputedStyle(item('Alarm'))
        expect(ring.outlineStyle).toBe('solid')
        expect(ring.outlineWidth).toBe('3px')
        expect(ring.outlineOffset).toBe('-3px')
        expect(ring.outlineColor).toBe(token('secondary', rail()))
        expect(rectOf(item('Alarm')).width).toBe(width)
        expect(ring.borderTopLeftRadius).toBe(computedRadius('rounded-shape-xs'))
      },
    )

    it('draws no ring or focus layer for a click', async () => {
      await show()
      await userEvent.click(item('Alarm'))
      await userEvent.unhover(item('Alarm'))
      await settle()
      expect(getComputedStyle(item('Alarm')).outlineStyle).toBe('none')
      expect(getComputedStyle(stateLayerOf('Alarm')).opacity).toBe('0')
    })

    it('ripples in the indicator’s box when pressed anywhere on the item', async () => {
      await show()
      const circles = await whilePressed('Alarm', () =>
        item('Alarm').querySelectorAll('.opacity-state-pressed'),
      )
      expect(circles).toHaveLength(1)
      expect(boxOf('Alarm')).toContainElement(circles[0] as HTMLElement)
      expect(getComputedStyle(circles[0]!).backgroundColor).toBe(
        token('on-secondary-container', rail()),
      )
    })

    it('draws a disabled item’s icon and label at 38%, and gives it no pointer states', async () => {
      await show({ disabled: 'Clock' })
      const [, , , alpha] = rgba(getComputedStyle(iconOf('Clock')).color)
      expect(alpha / 255).toBeCloseTo(0.38, 2)
      expect(rgba(getComputedStyle(belowOf('Clock')).color)[3] / 255).toBeCloseTo(0.38, 2)
      expect(getComputedStyle(item('Clock')).cursor).toBe('default')
      await userEvent.hover(item('Clock'))
      await settle()
      expect(getComputedStyle(stateLayerOf('Clock')).opacity).toBe('0')
      await userEvent.unhover(item('Clock'))
    })

    it.each([false, true])(
      'draws a selected item that is disabled in the disabled color, over its indicator (expanded: %s)',
      async (expanded) => {
        await show({ disabled: 'Timer', isExpanded: expanded })
        const disabled = computedStyleOf(
          'text-on-surface-variant/disabled-content',
          (style) => style.color,
        )
        for (const el of [iconOf('Timer'), belowOf('Timer'), besideOf('Timer')]) {
          expect(getComputedStyle(el).color).toBe(disabled)
        }
        expect(rgba(disabled)[3] / 255).toBeCloseTo(0.38, 2)
        expect(getComputedStyle(indicatorOf('Timer')).opacity).toBe('1')
      },
    )
  })

  describe('the arrangement', () => {
    it('centers the items in the whole rail, and leaves the header at its top', async () => {
      await show({ arrangement: 'center', menu: true, height: 900 })
      const first = within_(item('Alarm'))
      const last = within_(item('Stopwatch'))
      expect(first.y).toBe(900 - last.bottom)
      expect(first.y).toBe((900 - (4 * 64 + 3 * 4)) / 2)
      const menu = within_(item('Menu'))
      expect(menu.y + menu.height / 2).toBe(72)
    })

    it('keeps centered items 40dp under the header where the rail is too short for both', async () => {
      await show({ arrangement: 'center', menu: true, fab: true, height: 560 })
      expect(within_(item('Alarm')).y).toBe(200)
    })

    it('centers the items in the whole rail with no header too', async () => {
      await show({ arrangement: 'center', height: 900 })
      expect(within_(item('Alarm')).y).toBe((900 - (4 * 64 + 3 * 4)) / 2)
    })
  })

  describe('a section', () => {
    const sections = (
      <>
        <NavigationRailSection aria-label="More">
          <NavigationRailItem>
            <Icon name="bed" />
            <Text slot="label">Bedtime</Text>
          </NavigationRailItem>
        </NavigationRailSection>
        <NavigationRailSection aria-labelledby="sleep-well" data-testid="section">
          <Text slot="header" id="sleep-well">
            Sleep well
          </Text>
          <NavigationRailItem>
            <Icon name="music_note" />
            <Text slot="label">Sounds</Text>
          </NavigationRailItem>
        </NavigationRailSection>
      </>
    )
    /** A hidden element has no name to find it by. */
    const bedtime = () => screen.getByText('Bedtime').closest('button')!

    it('is clear and out of reach in a collapsed rail, under its items', async () => {
      await show({ sections })
      expect(getComputedStyle(bedtime()).visibility).toBe('hidden')
      expect(getComputedStyle(bedtime().parentElement!).opacity).toBe('0')
      expect(rectOf(bedtime()).top).toBe(rectOf(item('Stopwatch')).bottom - 14)
      // React Aria's arrow keys pass what is not visible by, and Tab leaves the rail.
      item('Stopwatch').focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(item('Stopwatch')).toHaveFocus()
      await userEvent.tab()
      expect(document.activeElement).not.toBe(bedtime())
    })

    it('keeps its icons as far under the rail’s last as in the expanded rail, while the rail expands', async () => {
      const { update } = await show({ sections })
      const middle = (el: Element) => rectOf(el).top + rectOf(el).height / 2
      const apart = () =>
        middle(bedtime().firstElementChild!.children[1]!) - middle(iconOf('Stopwatch'))
      expect(apart()).toBe(56)
      update({ sections, isExpanded: true })
      const at = freeze()
      for (const frame of [1, 3, 6, 10, 16, 40]) {
        at(frame)
        expect(apart(), `at frame ${frame}`).toBeCloseTo(56, 0)
      }
    })

    it('shows in an expanded rail, its items right under the rail’s own', async () => {
      await show({ sections, isExpanded: true })
      expect(getComputedStyle(item('Bedtime')).visibility).toBe('visible')
      expect(getComputedStyle(item('Bedtime').parentElement!).opacity).toBe('1')
      expect(within_(item('Bedtime')).y).toBe(within_(item('Stopwatch')).bottom)
      expect(within_(item('Bedtime')).height).toBe(56)
    })

    it('is centered with the items in a centered rail', async () => {
      await show({ sections, arrangement: 'center', menu: true, height: 900, isExpanded: true })
      expect(within_(item('Alarm')).y).toBe(900 - within_(screen.getByTestId('section')).bottom)
    })

    it('draws its header in title-small, in line with the icons, 12dp under what is over it and 8dp around its line', async () => {
      await show({ sections, isExpanded: true })
      const header = screen.getByText('Sleep well')
      const style = getComputedStyle(header)
      expect(style.fontSize).toBe('14px')
      expect(style.fontWeight).toBe('500')
      expect(style.color).toBe(token('on-surface-variant', rail()))
      const box = within_(header)
      expect(box.y).toBe(within_(item('Bedtime')).bottom + 12)
      expect(box.height).toBe(8 + 20 + 8)
      expect(style.paddingLeft).toBe('36px')
      expect(within_(item('Sounds')).y).toBe(box.bottom)
      expect(screen.getByRole('group', { name: 'Sleep well' })).toBe(screen.getByTestId('section'))
    })
  })

  describe('the motion between collapsed and expanded', () => {
    /* How far the expressive default spatial spring is at each frame from the one the rail is
     * turned in: how far expanded the recording of Compose's rail is in the frames it has,
     * by its rail's width, to within 0.006. */
    const along = [
      0, 0.044, 0.149, 0.28, 0.417, 0.546, 0.66, 0.755, 0.832, 0.891, 0.935, 0.967, 0.988, 1.002,
      1.01, 1.014, 1.015,
    ]
    /* What that recording shows in those frames, in dp: the rail's width, the selected first
     * item's indicator from its item's top and how tall, and the middles of its icon and of
     * the next item's, from the first item's top. A device pixel of it is 0.4dp. */
    const recorded = {
      expanding: [
        [1, 101.0, 5.2, 33.1, 22.0, 89.3],
        [2, 114.0, 4.4, 35.6, 23.4, 88.3],
        [3, 130.7, 3.3, 38.7, 24.8, 87.3],
        [7, 189.3, 0, 50.0, 27.4, 84.1],
        [10, 211.7, 0, 54.3, 28.0, 84.2],
        [11, 215.7, 0, 55.4, 28.0, 83.9],
        [15, 221.7, 0, 56.0, 27.8, 83.3],
      ],
      collapsing: [
        [1, 215.0, 0, 55.0, 28.0, 83.9],
        [4, 169.0, 0, 46.0, 26.0, 83.6],
        [7, 126.7, 3.3, 38.2, 24.0, 86.9],
        [11, 100.3, 5.6, 32.7, 22.4, 89.6],
        [12, 97.3, 5.6, 32.3, 21.8, 89.3],
        [16, 94.0, 6.0, 31.9, 22.0, 90.2],
      ],
    } as const
    const opacity = (el: Element) => Number(getComputedStyle(el).opacity)
    const middle = (el: Element) => within_(el).y + within_(el).height / 2
    /** Where the first item's parts and the next item are, from the first item's top. */
    const measured = () => {
      const top = within_(item('Home')).y
      return [
        rectOf(rail()).width,
        within_(boxOf('Home')).y - top,
        within_(boxOf('Home')).height,
        middle(iconOf('Home')) - top,
        middle(iconOf('Inbox')) - top,
      ]
    }
    const parts = ['width', 'indicator top', 'indicator height', 'icon', 'next icon']

    it('runs how far it is expanded, and its width with it, on the default spatial spring', async () => {
      await show()
      const moving = [
        [rail(), 'width'],
        [contentOf(), '--navigation-rail-progress'],
      ] as const
      for (const [el, properties] of moving) {
        const style = getComputedStyle(el)
        expect(style.transitionProperty).toBe(properties)
        expect(style.transitionDuration).toBe(springDuration('default-spatial'))
        expect(style.transitionTimingFunction).toBe(springEasing('default-spatial'))
      }
      // An item's parts are where that puts them: nothing of theirs runs beside it.
      for (const el of [item('Alarm'), hugOf('Alarm'), boxOf('Alarm'), iconOf('Alarm')]) {
        expect(getComputedStyle(el).transitionDuration).toBe('0s')
      }
    })

    it('expands as the recording does, in the frames it has', async () => {
      const { update } = await show({ items: ['Home', 'Inbox'] })
      update({ isExpanded: true })
      const at = freeze()
      for (const [frame, ...shown] of recorded.expanding) {
        at(frame)
        measured().forEach((ours, index) => {
          const off = Math.abs(ours - shown[index]!)
          expect(off, `${parts[index]} at frame ${frame}: ${ours}`).toBeLessThan(1)
        })
      }
    })

    it('collapses as the recording does, in the frames it has', async () => {
      const { update } = await show({ items: ['Home', 'Inbox'], isExpanded: true })
      update({ isExpanded: false })
      const at = freeze()
      for (const [frame, ...shown] of recorded.collapsing) {
        at(frame)
        measured().forEach((ours, index) => {
          const off = Math.abs(ours - shown[index]!)
          expect(off, `${parts[index]} at frame ${frame}: ${ours}`).toBeLessThan(1)
        })
      }
    })

    it('places everything an item draws by how far the rail is expanded, as Compose does', async () => {
      const { update } = await show({ menu: true })
      const collapsed = rectOf(boxOf('Timer')).width
      update({ isExpanded: true })
      const at = freeze()
      at(40)
      const hugged = rectOf(boxOf('Timer')).width
      for (const [frame, p] of along.entries()) {
        at(frame)
        const where = `at frame ${frame}`
        const top = within_(item('Timer')).y
        // The rail, the page beside it with it, and each item across the rail.
        expect(rectOf(rail()).width, `width ${where}`).toBeCloseTo(96 + (220 - 96) * p, 0)
        expect(rectOf(page()).left, `page ${where}`).toBeCloseTo(rectOf(rail()).right, 1)
        expect(rectOf(item('Alarm')).width, `item ${where}`).toBeCloseTo(
          Math.min(rectOf(rail()).width, 220),
          1,
        )
        // An item is 64dp less 16 of the way until it is the 56 of its indicator, halfway,
        // and the 4dp to the next close all the way.
        const tall = p < 0.5 ? 64 - 16 * p : 56 - 24 * Math.max(0, p - 1)
        expect(rectOf(item('Timer')).height, `item height ${where}`).toBeCloseTo(tall, 0)
        expect(within_(item('Stopwatch')).y - top, `next item ${where}`).toBeCloseTo(
          tall + 4 * (1 - p),
          0,
        )
        // The indicator's box: in the item's middle with the label until halfway, and at its
        // top from there; from 32 to 56dp tall, held there past expanded; from the start edge.
        const box = within_(boxOf('Timer'))
        expect(box.x, `indicator edge ${where}`).toBe(20)
        expect(box.y - top, `indicator top ${where}`).toBeCloseTo(p < 0.5 ? 6 - 10 * p : 0, 0)
        expect(box.height, `indicator height ${where}`).toBeCloseTo(32 + 24 * Math.min(p, 1), 0)
        // The icon keeps its place across the rail, and is under the indicator's middle on the way.
        const icon = within_(iconOf('Timer'))
        expect(icon.x, `icon ${where}`).toBe(36)
        expect(icon.y - box.y, `icon in the indicator ${where}`).toBeCloseTo(
          4 + 12 * Math.min(p, 1) + (p < 0.5 ? 10 : 12) * p * (1 - p),
          0,
        )
        // The labels: 4(p - 0.5)² of the one under the icon until halfway, of the one beside
        // it from there.
        const clear = Math.min(1, 4 * (p - 0.5) ** 2)
        expect(opacity(belowOf('Timer')), `label under ${where}`).toBeCloseTo(
          p < 0.5 ? clear : 0,
          1,
        )
        expect(opacity(besideOf('Timer')), `label beside ${where}`).toBeCloseTo(
          p < 0.5 ? 0 : clear,
          1,
        )
        if (p < 0.5) {
          // Under the icon it is pushed down as the indicator grows, a little further from it.
          expect(within_(belowOf('Timer')).y - box.y - box.height, `gap ${where}`).toBeCloseTo(
            4 + 10 * p * (1 - p),
            0,
          )
        } else {
          // Beside it, it comes from the item's edge, 20dp nearer it still at the start, in
          // the middle of the item.
          const beside = within_(besideOf('Timer'))
          expect(beside.x, `label beside ${where}`).toBeCloseTo((48 + 20 * p) * p, 0)
          expect(beside.y - top + beside.height / 2, `label middle ${where}`).toBeCloseTo(
            tall / 2,
            0,
          )
        }
      }
      // The indicator's box is on its way to the label in the type it is drawn in: until
      // halfway the one under the icon, taken as 12/14 of the label-large one beside it, which
      // is within a dp or so of it on the way; from there the one beside it.
      const under = document.createRange()
      under.selectNodeContents(belowOf('Timer'))
      at(4)
      const narrow = rectOf(boxOf('Timer')).width
      expect(narrow).toBeCloseTo(56 + (8 + ((hugged - 64) * 12) / 14) * along[4]!, 0)
      expect(
        Math.abs(narrow - 56 - (8 + under.getBoundingClientRect().width) * along[4]!),
      ).toBeLessThan(1.5)
      at(7)
      expect(rectOf(boxOf('Timer')).width).toBeCloseTo(56 + (hugged - 56) * along[7]!, 0)
      expect(collapsed).toBe(56)
    })

    it('takes the label beside the icon straight back to the item’s edge as it collapses', async () => {
      const { update } = await show({ isExpanded: true })
      update({ isExpanded: false })
      const at = freeze()
      for (const [frame, part] of along.entries()) {
        at(frame)
        const p = 1 - part
        const clear = p < 0.5 ? 0 : Math.min(1, 4 * (p - 0.5) ** 2)
        expect(opacity(besideOf('Alarm')), `label beside at frame ${frame}`).toBeCloseTo(clear, 1)
        if (p >= 0.5) expect(within_(besideOf('Alarm')).x).toBeCloseTo(68 * p, 0)
        expect(opacity(belowOf('Alarm')), `label under at frame ${frame}`).toBeCloseTo(
          p < 0.5 ? 4 * (Math.max(0, p) - 0.5) ** 2 : 0,
          1,
        )
      }
      // The spring takes the rail a little under its width, and the indicator's box no further.
      at(16)
      expect(rectOf(rail()).width).toBeLessThan(95)
      expect(rectOf(boxOf('Timer')).width).toBe(56)
    })

    it('goes a little past its width before it settles, without making the window scroll', async () => {
      const { update } = await show()
      update({ isExpanded: true })
      const at = freeze()
      at(16)
      expect(rectOf(rail()).width).toBeGreaterThan(221)
      expect(rectOf(rail()).width).toBeLessThan(223)
      expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth)
      at(40)
      expect(rectOf(rail()).width).toBe(220)
    })

    it('grows the indicator of a newly selected item from the start edge of its box, and fades it in, on the default spatial spring', async () => {
      await show()
      const style = getComputedStyle(indicatorOf('Alarm'))
      expect(style.transitionProperty).toBe('width, opacity')
      expect(style.transitionDuration).toBe(springDuration('default-spatial'))
      expect(style.transitionTimingFunction).toBe(springEasing('default-spatial'))
      await userEvent.click(item('Alarm'))
      const at = freeze()
      for (const [frame, part] of along.entries()) {
        at(frame)
        const where = `at frame ${frame}`
        const [box, growing, going] = [boxOf('Alarm'), indicatorOf('Alarm'), indicatorOf('Timer')]
        expect(rectOf(growing).left, `edge ${where}`).toBe(rectOf(box).left)
        expect(rectOf(growing).width / 56, `width ${where}`).toBeCloseTo(part, 1)
        expect(opacity(growing), `fill ${where}`).toBeCloseTo(Math.min(part, 1), 1)
        // The one it is taken from goes the same way back, to nothing and no further.
        expect(rectOf(going).left, `edge of the other ${where}`).toBe(rectOf(boxOf('Timer')).left)
        expect(rectOf(going).width / 56, `width of the other ${where}`).toBeCloseTo(
          Math.max(0, 1 - part),
          1,
        )
        expect(opacity(going), `fill of the other ${where}`).toBeCloseTo(Math.max(0, 1 - part), 1)
      }
    })

    it('takes the icon’s color at once, and fades the label’s on the default effects spring', async () => {
      await show()
      for (const label of [belowOf('Alarm'), besideOf('Alarm')]) {
        const style = getComputedStyle(label)
        expect(style.transitionProperty).toBe('color')
        expect(style.transitionDuration).toBe(springDuration('default-effects'))
        expect(style.transitionTimingFunction).toBe(springEasing('default-effects'))
      }
      const [from, to] = [token('on-surface-variant', rail()), token('secondary', rail())]
      // In the page: a real click's answer can come after the fade, on a busy machine.
      press(item('Alarm'))
      const at = freeze()
      at(3)
      expect(getComputedStyle(iconOf('Alarm')).color).toBe(token('on-secondary-container', rail()))
      const fading = getComputedStyle(belowOf('Alarm')).color
      expect(fading).not.toBe(from)
      expect(fading).not.toBe(to)
      at(40)
      expect(getComputedStyle(belowOf('Alarm')).color).toBe(to)
    })

    it('gives a selected item’s two labels one color, the rail’s layout’s, and fades between them', async () => {
      const { update } = await show()
      const colors = () =>
        [belowOf('Timer'), besideOf('Timer')].map((el) => getComputedStyle(el).color)
      const [under, beside] = [token('secondary', rail()), token('on-secondary-container', rail())]
      expect(colors()).toEqual([under, under])
      update({ isExpanded: true })
      const at = freeze()
      at(3)
      expect(colors()[0]).toBe(colors()[1])
      expect([under, beside]).not.toContain(colors()[0])
      at(40)
      expect(colors()).toEqual([beside, beside])
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('is where it is going at once', async () => {
        const { update } = await show()
        update({ isExpanded: true })
        await settle()
        expect(rectOf(rail()).width).toBe(220)
        expect(getComputedStyle(besideOf('Alarm')).opacity).toBe('1')
        expect(parseFloat(getComputedStyle(rail()).transitionDuration)).toBeLessThan(0.001)
      })
    })
  })

  describe('a rail that hides when collapsed', () => {
    it('takes no room and shows nothing collapsed, and is out of reach', async () => {
      await show({ isHiddenOnCollapse: true })
      expect(rectOf(rail()).width).toBe(0)
      expect(rectOf(page()).width).toBe(640)
      expect(getComputedStyle(rail()).visibility).toBe('hidden')
      expect(getComputedStyle(contentOf()).visibility).toBe('hidden')
      await userEvent.tab()
      expect(rail().contains(document.activeElement)).toBe(false)
    })

    it('is out of the accessibility tree while it is hidden, and in it as soon as it expands', async () => {
      const { update } = await show({ isHiddenOnCollapse: true })
      expect(screen.queryByRole('toolbar')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Alarm' })).toBeNull()
      update({ isHiddenOnCollapse: true, isExpanded: true })
      const at = freeze()
      at(0)
      expect(screen.getByRole('toolbar', { name: 'Main' })).toBe(rail())
      expect(screen.getByRole('button', { name: 'Alarm' })).toBe(item('Alarm'))
    })

    it('expands beside the page as an expanded rail, coming in from the window’s edge', async () => {
      const { update } = await show({ isHiddenOnCollapse: true })
      update({ isHiddenOnCollapse: true, isExpanded: true })
      const at = freeze()
      at(5)
      const width = rectOf(rail()).width
      expect(width / 220).toBeCloseTo(0.546, 1)
      // What it holds is laid out expanded all the way, whole, its far edge at the rail's.
      expect(getComputedStyle(contentOf()).visibility).toBe('visible')
      expect(rectOf(contentOf()).width).toBe(220)
      expect(rectOf(contentOf()).right).toBeCloseTo(rectOf(rail()).right, 1)
      expect(rectOf(item('Alarm'))).toMatchObject({ width: 220, height: 56 })
      expect(rectOf(boxOf('Timer')).height).toBe(56)
      expect(getComputedStyle(besideOf('Alarm')).opacity).toBe('1')
      expect(rectOf(page()).left).toBeCloseTo(rectOf(rail()).right, 1)
      at(60)
      expect(rectOf(rail()).width).toBe(220)
      expect(rectOf(contentOf()).left).toBe(rectOf(rail()).left)
    })

    it('goes back out the way it came, and is out of reach only once it has gone', async () => {
      const { update } = await show({ isHiddenOnCollapse: true, isExpanded: true })
      update({ isHiddenOnCollapse: true, isExpanded: false })
      const at = freeze()
      at(5)
      expect(rectOf(rail()).width / 220).toBeCloseTo(1 - 0.546, 1)
      expect(rectOf(contentOf()).right).toBeCloseTo(rectOf(rail()).right, 1)
      expect(rectOf(item('Alarm')).height).toBe(56)
      expect(getComputedStyle(contentOf()).visibility).toBe('visible')
      expect(screen.queryByRole('toolbar')).toBe(rail())
      at(60)
      expect(rectOf(rail()).width).toBe(0)
      expect(rectOf(page()).width).toBe(640)
      expect(getComputedStyle(rail()).visibility).toBe('hidden')
      expect(getComputedStyle(contentOf()).visibility).toBe('hidden')
      expect(screen.queryByRole('toolbar')).toBeNull()
    })

    it('comes in from the other edge right to left', async () => {
      const { update } = await show({ isHiddenOnCollapse: true, dir: 'rtl' })
      update({ isHiddenOnCollapse: true, dir: 'rtl', isExpanded: true })
      const at = freeze()
      at(5)
      expect(rectOf(contentOf()).left).toBeCloseTo(rectOf(rail()).left, 1)
      expect(rectOf(page()).right).toBeCloseTo(rectOf(rail()).left, 1)
    })
  })

  describe('right to left', () => {
    it('is along the other edge, its parts mirrored', async () => {
      await show({ dir: 'rtl' })
      expect(rectOf(rail()).right).toBe(rectOf(page()).right + 96)
      expect(rectOf(rail()).right - rectOf(boxOf('Alarm')).right).toBe(20)
      expect(rectOf(rail()).right - rectOf(iconOf('Alarm')).right).toBe(36)
    })

    it('expands toward the page, each label on the far side of its icon', async () => {
      await show({ dir: 'rtl', isExpanded: true })
      expect(rectOf(rail()).width).toBe(220)
      expect(rectOf(rail()).right - rectOf(besideOf('Alarm')).right).toBe(68)
      expect(rectOf(rail()).right - rectOf(boxOf('Alarm')).right).toBe(20)
    })
  })

  describe('contrast', () => {
    it.each(schemes)(
      'has readable icons and labels in the %s scheme at %s contrast',
      async (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Shell />
            <Shell isExpanded />
          </Scheme>,
        )
        await settle()
        const [collapsed, expanded] = screen.getAllByRole('toolbar') as [HTMLElement, HTMLElement]
        const surface = getComputedStyle(collapsed).backgroundColor
        const filled = token('secondary-container', collapsed)
        const part = (root: HTMLElement, name: string) => within(root).getByRole('button', { name })
        const colorOf = (el: Element) => getComputedStyle(el).color
        // Collapsed: the label is on the surface, the selected icon on the indicator.
        const [idle, active] = [part(collapsed, 'Alarm'), part(collapsed, 'Timer')]
        expect(
          contrastRatio(colorOf(idle.firstElementChild!.children[3]!), surface),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(colorOf(active.firstElementChild!.children[3]!), surface),
        ).toBeGreaterThanOrEqual(4.5)
        expect(
          contrastRatio(colorOf(idle.firstElementChild!.children[1]!), surface),
        ).toBeGreaterThanOrEqual(3)
        expect(
          contrastRatio(colorOf(active.firstElementChild!.children[1]!), filled),
        ).toBeGreaterThanOrEqual(3)
        // Expanded: the selected label is on the indicator too.
        const chosen = part(expanded, 'Timer').firstElementChild!
        expect(contrastRatio(colorOf(chosen.children[2]!), filled)).toBeGreaterThanOrEqual(4.5)
        expect(contrastRatio(filled, surface)).toBeGreaterThan(1)
      },
    )
  })

  describe('forced colors', () => {
    useForcedColors()

    it('draws the indicator in the system highlight, with the icon and the label in it to match', async () => {
      await show({ isExpanded: true })
      expect(getComputedStyle(indicatorOf('Timer')).backgroundColor).toBe(
        computedColor('Highlight', rail()),
      )
      expect(getComputedStyle(iconOf('Timer')).color).toBe(computedColor('HighlightText', rail()))
      expect(getComputedStyle(besideOf('Timer')).color).toBe(computedColor('HighlightText', rail()))
    })

    it('draws a disabled item’s icon and label in the system’s gray text, selected or not', async () => {
      await show({ isExpanded: true, disabled: 'Timer' })
      const gray = computedColor('GrayText', rail())
      for (const el of [iconOf('Timer'), besideOf('Timer')]) {
        expect(getComputedStyle(el).color).toBe(gray)
      }
      expect(getComputedStyle(indicatorOf('Timer')).backgroundColor).toBe(
        computedColor('Highlight', rail()),
      )
    })
  })
})
