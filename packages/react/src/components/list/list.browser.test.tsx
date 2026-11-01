import { render, screen, waitFor, within } from '@testing-library/react'
import type { CSSProperties, ReactNode } from 'react'
import { useFocusVisible } from 'react-aria'
import {
  DropIndicator,
  isTextDropItem,
  Text,
  useDragAndDrop as useAriaDragAndDrop,
  useListData,
  type DragAndDropOptions,
  type Key,
} from 'react-aria-components'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  catchTransitions,
  computedColor,
  contrastRatio,
  expectHitArea,
  rgba,
  Scheme,
  schemeOf,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { Checkbox } from '../checkbox'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { List, ListItem, useDragAndDrop, type ListProps } from '.'

/*
 * Everything that needs a real browser and the real stylesheet: sizes and padding against the
 * specs' measurements, colors in every scheme, the states, the shapes, the 48dp targets, forced
 * colors and motion. Behavior jsdom can check - roles, names, selection, the keyboard - is in
 * list.test.tsx.
 */

/** A color role, as the browser computes it where `el` is. */
const role = (name: string, el: Element) => computedColor(`var(--md-sys-color-${name})`, el)

/** A color role at an opacity, mixed as Tailwind's opacity modifier mixes it. */
const roleAt = (name: string, percent: number, el: Element) =>
  computedColor(`color-mix(in oklab, var(--md-sys-color-${name}) ${percent}%, transparent)`, el)

/** The shadow of an elevation level, as the browser computes it where `el` is. */
function elevation(level: number, el: Element) {
  const probe = document.createElement('div')
  probe.style.boxShadow = `var(--md-sys-elevation-level${level})`
  schemeOf(el).append(probe)
  const shadow = getComputedStyle(probe).boxShadow
  probe.remove()
  return shadow
}

/** Contrast of an element's text against the nearest fill behind it: its own, its item's or the page's. */
function contrastIn(el: Element) {
  let behind: Element | null = el
  while (behind && rgba(getComputedStyle(behind).backgroundColor)[3] === 0)
    behind = behind.parentElement
  return contrastRatio(getComputedStyle(el).color, getComputedStyle(behind!).backgroundColor)
}

const row = (name: string | RegExp) => screen.getByRole('row', { name })
const rect = (el: Element) => el.getBoundingClientRect()
const layerOf = (item: Element) => item.querySelector<HTMLElement>(':scope > .state-layer')!
/** What an item's press ripple is drawn in, the part after its state layer. */
const surfaceOf = (item: Element) => item.querySelector<HTMLElement>(':scope > .state-layer + *')!
const center = (box: DOMRect) => box.top + box.height / 2

/** A 40dp round avatar of an initial, as a leading one is drawn. */
const Avatar = ({ initial }: { initial: string }) => (
  <span
    slot="leading"
    className="grid size-10 place-items-center rounded-full bg-primary-container text-title-md text-on-primary-container"
  >
    {initial}
  </span>
)

/** Items of one, two and three lines of text, with a leading icon and trailing text; `props` go on the list. */
function Lines(props: Partial<ListProps>) {
  return (
    <Scheme>
      <List aria-label="Inbox" className="w-80" {...props}>
        <ListItem id="one" textValue="One line">
          <Icon slot="leading" name="mail" />
          <Text slot="label">One line</Text>
          <Text slot="trailing">100+</Text>
        </ListItem>
        <ListItem id="two" textValue="Two lines">
          <Icon slot="leading" name="mail" />
          <Text slot="label">Two lines</Text>
          <Text slot="description">Supporting text</Text>
          <Text slot="trailing">100+</Text>
        </ListItem>
        <ListItem id="three" textValue="Three lines">
          <Avatar initial="A" />
          <Text slot="overline">Overline</Text>
          <Text slot="label">Three lines</Text>
          <Text slot="description">Supporting text</Text>
          <Icon slot="trailing" name="arrow_right" />
        </ListItem>
      </List>
    </Scheme>
  )
}

/** A list of three contacts with icons, selected and disabled ones among them; `props` go on the list. */
function Contacts(props: Partial<ListProps>) {
  return (
    <List aria-label="Contacts" className="w-80" selectionMode="single" {...props}>
      <ListItem id="ali" textValue="Ali Connors">
        <Icon slot="leading" name="person" />
        <Text slot="overline">Overline</Text>
        <Text slot="label">Ali Connors</Text>
        <Text slot="description">Brunch this weekend?</Text>
        <Text slot="trailing">15 min</Text>
        <Icon slot="trailing" name="star" />
      </ListItem>
      <ListItem id="jennifer" textValue="Jennifer Lopez">
        <Icon slot="leading" name="person" />
        <Text slot="label">Jennifer Lopez</Text>
        <Text slot="description">Summer BBQ</Text>
        <Icon slot="trailing" name="star" />
      </ListItem>
      <ListItem id="sandra" textValue="Sandra Adams">
        <Icon slot="leading" name="person" />
        <Text slot="label">Sandra Adams</Text>
        <Text slot="description">Oui oui</Text>
        <Icon slot="trailing" name="star" />
      </ListItem>
    </List>
  )
}

/** A list that reorders its items by drag and drop, with a drag handle in each, and each in `itemStyle`. */
function Reorderable({
  renderDragPreview,
  renderDropIndicator,
  itemStyle,
  ...props
}: Pick<DragAndDropOptions, 'renderDragPreview' | 'renderDropIndicator'> &
  Pick<ListProps, 'orientation' | 'className'> & { itemStyle?: CSSProperties }) {
  const list = useListData({
    initialItems: ['Ali Connors', 'Jennifer Lopez', 'Sandra Adams', 'Trevor Hansen'].map(
      (name) => ({ id: name, name }),
    ),
  })
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys: Set<Key>) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder(e) {
      if (e.target.dropPosition === 'before') list.moveBefore(e.target.key, e.keys)
      else if (e.target.dropPosition === 'after') list.moveAfter(e.target.key, e.keys)
    },
    renderDragPreview,
    renderDropIndicator,
  })
  return (
    <Scheme>
      <List
        aria-label="Favorites"
        variant="segmented"
        className="w-80"
        {...props}
        items={list.items}
        dragAndDropHooks={dragAndDropHooks}
      >
        {(item) => (
          <ListItem textValue={item.name} style={itemStyle}>
            <Text slot="label">{item.name}</Text>
          </ListItem>
        )}
      </List>
    </Scheme>
  )
}

/** A list that reorders its items, the first of one line and the rest of two, after a thing of the page's own to drag and before its `children`; `props` go on the list. */
function Uneven({
  children,
  ...props
}: Pick<ListProps, 'selectionMode' | 'defaultSelectedKeys'> & { children?: ReactNode }) {
  const list = useListData({
    initialItems: ['Ali Connors', 'Jennifer Lopez', 'Sandra Adams', 'Trevor Hansen'].map(
      (name) => ({
        id: name,
        name,
      }),
    ),
  })
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys: Set<Key>) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder(e) {
      if (e.target.dropPosition === 'before') list.moveBefore(e.target.key, e.keys)
      else if (e.target.dropPosition === 'after') list.moveAfter(e.target.key, e.keys)
    },
  })
  return (
    <Scheme>
      <button>Before</button>
      <div
        id="stranger"
        draggable
        className="size-12 bg-primary"
        onDragStart={(event) => event.dataTransfer.setData('text/x-stranger', 'stranger')}
      />
      <List
        aria-label="Favorites"
        className="w-80"
        {...props}
        items={list.items}
        dragAndDropHooks={dragAndDropHooks}
      >
        {(item) => (
          <ListItem textValue={item.name}>
            <Text slot="label">{item.name}</Text>
            {item.name !== 'Ali Connors' && <Text slot="description">Favorite</Text>}
          </ListItem>
        )}
      </List>
      {children}
    </Scheme>
  )
}

/** A segmented list that reorders its items with React Aria's own `useDragAndDrop`, not this package's. */
function Plain({ orientation }: Pick<ListProps, 'orientation'>) {
  const list = useListData({
    initialItems: ['Ali Connors', 'Jennifer Lopez', 'Sandra Adams'].map((name) => ({
      id: name,
      name,
    })),
  })
  const { dragAndDropHooks } = useAriaDragAndDrop({
    getItems: (keys: Set<Key>) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder(e) {
      if (e.target.dropPosition === 'before') list.moveBefore(e.target.key, e.keys)
      else if (e.target.dropPosition === 'after') list.moveAfter(e.target.key, e.keys)
    },
  })
  return (
    <Scheme>
      <List
        aria-label="Favorites"
        variant="segmented"
        orientation={orientation}
        className={orientation === 'horizontal' ? 'w-max' : 'w-80'}
        items={list.items}
        dragAndDropHooks={dragAndDropHooks}
      >
        {(item) => <ListItem>{item.name}</ListItem>}
      </List>
    </Scheme>
  )
}

/** A list that takes what is dragged to it among its one-line items, and does nothing with it. */
function Taker() {
  const { dragAndDropHooks } = useDragAndDrop({
    acceptedDragTypes: ['text/plain'],
    onInsert() {},
  })
  return (
    <List aria-label="Others" className="w-80" dragAndDropHooks={dragAndDropHooks}>
      <ListItem>Peter Carlsson</ListItem>
      <ListItem>Janet Perkins</ListItem>
    </List>
  )
}

/** When an item moved to another list leaves its own. */
const leaving = ['as its drag ends', 'as the other list takes it'] as const

/* Two lists: the first gives its two-line items to drags, the second takes them among its one-line
 * ones. A moved item leaves the first as its drag ends, as React Aria's guide writes a move, or as
 * the second takes it, before the first has heard the drag end. */
function Boards({ leaves }: { leaves: (typeof leaving)[number] }) {
  const favorites = useListData({
    initialItems: ['Ali Connors', 'Jennifer Lopez'].map((name) => ({ id: name, name })),
  })
  const others = useListData({
    initialItems: ['Sandra Adams', 'Trevor Hansen'].map((name) => ({ id: name, name })),
  })
  const { dragAndDropHooks: gives } = useDragAndDrop({
    getItems: (keys: Set<Key>) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onDragEnd(e) {
      if (leaves === 'as its drag ends' && e.dropOperation === 'move') favorites.remove(...e.keys)
    },
  })
  const { dragAndDropHooks: takes } = useDragAndDrop({
    acceptedDragTypes: ['text/plain'],
    async onInsert(e) {
      const dropped = await Promise.all(
        e.items.filter(isTextDropItem).map((item) => item.getText('text/plain')),
      )
      const items = dropped.map((name) => ({ id: name, name }))
      if (e.target.dropPosition === 'before') others.insertBefore(e.target.key, ...items)
      else others.insertAfter(e.target.key, ...items)
      if (leaves === 'as the other list takes it') favorites.remove(...dropped)
    },
  })
  return (
    <Scheme>
      <button>Before</button>
      <List
        aria-label="Favorites"
        className="w-80"
        items={favorites.items}
        dragAndDropHooks={gives}
      >
        {(item) => (
          <ListItem textValue={item.name}>
            <Text slot="label">{item.name}</Text>
            <Text slot="description">Favorite</Text>
          </ListItem>
        )}
      </List>
      <List aria-label="Others" className="w-80" items={others.items} dragAndDropHooks={takes}>
        {(item) => (
          <ListItem textValue={item.name}>
            <Text slot="label">{item.name}</Text>
          </ListItem>
        )}
      </List>
    </Scheme>
  )
}

/** What is in use, the keyboard or the pointer, as React Aria has it. */
function Modality() {
  const { isFocusVisible } = useFocusVisible()
  return <output>{isFocusVisible ? 'keyboard' : 'pointer'}</output>
}

const names = () =>
  screen.getAllByRole('row').map((item) => item.textContent?.replace('drag_handle', ''))

/** A dragged item's placeholder: React Aria's drop indicator, where the drop would land. */
const placeholder = () => document.querySelector<HTMLElement>('.list-placeholder[data-drop-target]')

/* The pointer at x, y of the list, pressed or let go there if asked. It is moved there twice: the
 * test browser sends a drag's `dragover` only on a move within the element the pointer is on
 * already, where a real one sends them all the while. */
async function pointAt(x: number, y: number, button?: 'down' | 'up') {
  await commands.pointer('[role="grid"]', x, y)
  await commands.pointer('[role="grid"]', x, y, button)
}

/** Takes the first item of a `Reorderable` by its middle and drags it to x, y of the list. */
async function drag(x = 150, y = 40) {
  onTestFinished(() => commands.releasePress())
  await pointAt(150, 28, 'down')
  await pointAt(150, 34)
  await pointAt(x, y)
  await waitFor(() => expect(row(/Ali Connors/)).toHaveAttribute('data-dragging'))
  await waitFor(() => expect(placeholder()).not.toBeNull())
}

/** Every move an element is given from here on, by `animate()`: its keyframes and its timing. */
function movesOf(el: Element) {
  const animate = vi.spyOn(Element.prototype, 'animate')
  onTestFinished(() => animate.mockRestore())
  return () =>
    animate.mock.results
      .filter((_, call) => animate.mock.contexts[call] === el)
      .map(({ value }) => {
        const effect = (value as Animation).effect as KeyframeEffect
        const { duration, easing } = effect.getTiming()
        const translate = effect.getKeyframes().map((frame) => frame.translate)
        return { translate, duration, easing, composite: effect.composite }
      })
}

/** A motion token's easing where `el` is, as an animation reports it: not quite as a transition does. */
const easingOf = (token: string, el: Element) =>
  new KeyframeEffect(null, null, {
    easing: getComputedStyle(el).getPropertyValue(`--md-sys-motion-${token}`).trim(),
  }).getTiming().easing

/** Where in an item the pointer takes it, once a drag of it begins. */
function heldPointOf(item: HTMLElement) {
  const held = { x: 0, y: 0 }
  item.addEventListener('dragstart', (event) => {
    held.x = event.clientX - rect(item).left
    held.y = event.clientY - rect(item).top
  })
  return held
}

/** The copy of an item in each drag image drawn from here on: its size, and the room around it. */
function copiesDrawn() {
  const copies: { size: number[]; room: string }[] = []
  const setDragImage = vi
    .spyOn(DataTransfer.prototype, 'setDragImage')
    .mockImplementation((image) => {
      const copy = image.querySelector<HTMLElement>('[role="row"]')!
      copies.push({
        size: [rect(copy).width, rect(copy).height],
        room: getComputedStyle(copy.parentElement!).padding,
      })
    })
  onTestFinished(() => setDragImage.mockRestore())
  return copies
}

/** How far an element is under the top of its list in each frame drawn from here on, until `stop()`. */
function topsOf(el: Element, list: Element) {
  const tops: number[] = []
  let on = true
  const frame = () => {
    tops.push(rect(el).top - rect(list).top)
    if (on) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
  return { tops, stop: () => void (on = false) }
}

/* Runs a test that has the keyboard drag an item, and ends the drag if the test leaves it going,
 * while its list is still there: with one on, React Aria keeps the pointer's events from the
 * page, the next test's too. */
async function withKeyboardDrag(test: () => Promise<void>) {
  try {
    await test()
  } finally {
    await userEvent.keyboard('{Escape}')
  }
}

describe('List', () => {
  describe('size', () => {
    it('is 56, 72 and 88dp tall for one, two and three lines of text, 16dp in from its sides and 10dp from its top and bottom', () => {
      render(<Lines />)
      const [one, two, three] = screen.getAllByRole('row') as [
        HTMLElement,
        HTMLElement,
        HTMLElement,
      ]
      expect(rect(one).height, 'one line').toBe(56)
      expect(rect(two).height, 'two lines').toBe(72)
      expect(rect(three).height, 'three lines').toBe(88)
      for (const item of [one, two, three]) {
        const style = getComputedStyle(item)
        expect(style.paddingLeft).toBe('16px')
        expect(style.paddingRight).toBe('16px')
        expect(style.paddingTop).toBe('10px')
        expect(style.paddingBottom).toBe('10px')
      }
      expect(rect(one).width).toBe(320)
    })

    it('draws the label in body large, the supporting text in body medium and the overline and trailing text in label small', () => {
      render(<Lines />)
      const type = (el: Element) => {
        const s = getComputedStyle(el)
        return [s.fontSize, s.lineHeight, s.fontWeight, s.letterSpacing].join(' ')
      }
      expect(type(screen.getByText('Three lines'))).toBe('16px 24px 400 0.5px')
      expect(type(screen.getAllByText('Supporting text')[0]!)).toBe('14px 20px 400 0.25px')
      expect(type(screen.getByText('Overline'))).toBe('11px 16px 500 0.5px')
      expect(type(screen.getAllByText('100+')[0]!)).toBe('11px 16px 500 0.5px')
    })

    it('draws a 20dp leading icon 12dp before the label and a trailing part 12dp after it, each in the middle of one or two lines', () => {
      render(<Lines />)
      const [one, two] = screen.getAllByRole('row') as [HTMLElement, HTMLElement]
      for (const [item, label] of [
        [one, 'One line'],
        [two, 'Two lines'],
      ] as const) {
        const icon = within(item).getByText('mail')
        const text = within(item).getByText(label)
        const trailing = within(item).getByText('100+')
        expect(rect(icon).width, `${label} icon`).toBe(20)
        expect(rect(icon).height, `${label} icon`).toBe(20)
        expect(rect(icon).left - rect(item).left, `${label} icon inset`).toBe(16)
        expect(rect(text).left - rect(icon).right, `${label} icon to label`).toBe(12)
        expect(center(rect(icon)), `${label} icon center`).toBeCloseTo(center(rect(item)), 1)
        expect(rect(item).right - rect(trailing).right, `${label} trailing inset`).toBe(16)
        expect(center(rect(trailing)), `${label} trailing center`).toBeCloseTo(
          center(rect(item)),
          1,
        )
      }
      const description = within(two).getByText('Supporting text')
      const label = within(two).getByText('Two lines')
      expect(rect(description).top, 'supporting under the label').toBe(rect(label).bottom)
      expect(rect(trailingOf(two)).left - rect(description).right).toBeGreaterThanOrEqual(12)
    })

    it('tops a three-line item’s parts, the avatar and the overline at its top edge', () => {
      render(<Lines />)
      const three = screen.getAllByRole('row')[2]!
      const avatar = within(three).getByText('A')
      const overline = within(three).getByText('Overline')
      const arrow = within(three).getByText('arrow_right')
      expect(rect(avatar).width).toBe(40)
      expect(rect(avatar).top - rect(three).top).toBe(10)
      expect(rect(overline).top - rect(three).top).toBe(10)
      expect(rect(arrow).top - rect(three).top).toBe(10)
      expect(rect(overline).left - rect(avatar).right).toBe(12)
    })

    it('is as tall as a 56dp leading image with the padding around it, the text in the middle', () => {
      render(
        <Scheme>
          <List aria-label="Albums" className="w-80">
            <ListItem id="a" textValue="Album">
              <img slot="leading" alt="" className="size-14 rounded-shape-sm" />
              <Text slot="label">Album</Text>
              <Text slot="description">Artist</Text>
            </ListItem>
          </List>
        </Scheme>,
      )
      const item = row('Album Artist')
      expect(rect(item).height).toBe(76)
      const label = screen.getByText('Album')
      const description = screen.getByText('Artist')
      expect(center(rect(item))).toBeCloseTo((rect(label).top + rect(description).bottom) / 2, 1)
    })

    it('gives an item whose supporting text wraps to a second line the three lines’ 88dp with its parts at its top, and two lines’ 72dp once it fits on one', async () => {
      const long = 'Brunch this weekend? I’ll be in your neighborhood doing errands.'
      const Wrapping = ({
        className,
        supporting = long,
      }: {
        className: string
        supporting?: string
      }) => (
        <Scheme>
          <List aria-label="Inbox" className={className}>
            <ListItem id="ali" textValue="Ali Connors">
              <Icon slot="leading" name="person" />
              <Text slot="label">Ali Connors</Text>
              <Text slot="description">{supporting}</Text>
              <Icon slot="trailing" name="star" />
            </ListItem>
          </List>
        </Scheme>
      )
      const { rerender } = render(<Wrapping className="w-80" />)
      const item = row(/Ali Connors/)
      const tops = () =>
        ['person', 'Ali Connors', 'star'].map(
          (part) => rect(within(item).getByText(part)).top - rect(item).top,
        )
      expect(rect(within(item).getByText(/Brunch/)).height).toBe(40)
      expect(rect(item).height).toBe(88)
      expect(tops()).toEqual([10, 10, 10])
      rerender(<Wrapping className="w-160" />)
      await waitFor(() => expect(rect(item).height).toBe(72))
      expect(rect(within(item).getByText(/Brunch/)).height).toBe(20)
      // Its height first, then its parts: it is measured again once it is no longer 88dp tall.
      await waitFor(() => expect(tops()).toEqual([26, 14, 26]))
      rerender(<Wrapping className="w-80" />)
      await waitFor(() => expect(rect(item).height).toBe(88))
      expect(tops()).toEqual([10, 10, 10])
      // Shorter text at the same width, once all is still: the three lines' height hides the
      // change from the row's own size.
      await settle()
      rerender(<Wrapping className="w-80" supporting="Brunch this weekend?" />)
      await waitFor(() => expect(rect(item).height).toBe(72))
      await waitFor(() => expect(tops()).toEqual([26, 14, 26]))
      await settle()
      rerender(<Wrapping className="w-80" />)
      await waitFor(() => expect(rect(item).height).toBe(88))
    })

    it('goes back to the middle once a leading image 80dp tall is one of 56dp, with three lines’ height no more', async () => {
      const Album = ({ image }: { image: string }) => (
        <Scheme>
          <List aria-label="Albums" className="w-80">
            <ListItem id="a" textValue="Album">
              <img slot="leading" alt="" className={image} />
              <Text slot="label">Album</Text>
            </ListItem>
          </List>
        </Scheme>
      )
      const { rerender } = render(<Album image="size-17 rounded-shape-sm" />)
      const item = row('Album')
      expect(rect(item).height).toBe(88)
      expect(rect(screen.getByText('Album')).top - rect(item).top).toBe(10)
      await settle()
      rerender(<Album image="size-14 rounded-shape-sm" />)
      await waitFor(() => expect(rect(item).height).toBe(76))
      await waitFor(() =>
        expect(center(rect(screen.getByText('Album')))).toBeCloseTo(center(rect(item)), 1),
      )
    })

    it('gives an item whose label wraps to a second line the two lines’ 72dp, and one line’s 56dp once it fits, a label written as plain text too', async () => {
      const Wrapping = ({ label }: { label: string }) => (
        <Scheme>
          <List aria-label="Names" className="w-40">
            <ListItem id="slot" textValue={label}>
              <Text slot="label">{label}</Text>
            </ListItem>
            <ListItem id="plain">{label}</ListItem>
          </List>
        </Scheme>
      )
      const { rerender } = render(<Wrapping label="Brunch this weekend?" />)
      const heights = () => screen.getAllByRole('row').map((item) => rect(item).height)
      expect(rect(screen.getAllByText('Brunch this weekend?')[0]!).height).toBe(48)
      expect(heights()).toEqual([72, 72])
      // Shorter text at the same width, once all is still: the two lines' height hides the change.
      await settle()
      rerender(<Wrapping label="Brunch" />)
      await waitFor(() => expect(heights()).toEqual([56, 56]))
      await settle()
      rerender(<Wrapping label="Brunch this weekend?" />)
      await waitFor(() => expect(heights()).toEqual([72, 72]))
    })

    it('tops the parts of an item its list or its own height makes 88dp tall or more, and centres them again under that', async () => {
      const Tall = ({ height }: { height?: string }) => (
        <Scheme>
          <List aria-label="Side by side" orientation="horizontal" className="w-max">
            <ListItem id="one" textValue="Beside">
              <Icon slot="leading" name="mail" />
              <Text slot="label">Beside</Text>
            </ListItem>
            <ListItem id="three" textValue="Three lines">
              <Text slot="overline">Overline</Text>
              <Text slot="label">Three lines</Text>
              <Text slot="description">Supporting text</Text>
            </ListItem>
          </List>
          <List aria-label="Given" className="w-80">
            <ListItem id="given" textValue="Given" className={height}>
              <Icon slot="leading" name="mail" />
              <Text slot="label">Given</Text>
            </ListItem>
          </List>
        </Scheme>
      )
      const { rerender } = render(<Tall height="h-24" />)
      const tops = (item: HTMLElement, label: string) =>
        ['mail', label].map((part) => rect(within(item).getByText(part)).top - rect(item).top)
      const beside = row('Beside')
      const given = row('Given')
      expect(rect(beside).height).toBe(88)
      expect(rect(given).height).toBe(96)
      await waitFor(() => expect(tops(beside, 'Beside')).toEqual([10, 10]))
      expect(tops(given, 'Given')).toEqual([10, 10])
      await settle()
      rerender(<Tall />)
      await waitFor(() => expect(rect(given).height).toBe(56))
      await waitFor(() => expect(tops(given, 'Given')).toEqual([18, 16]))
      expect(tops(beside, 'Beside')).toEqual([10, 10])
    })

    it('counts the 88dp by the item’s whole height, its padding too: 76dp at the highest density is under it, and 96dp with padding of its own is not', async () => {
      const Album = ({ className }: { className?: string }) => (
        <ListItem id="a" textValue="Album" className={className}>
          <img slot="leading" alt="" className={className ? 'size-16' : 'size-17'} />
          <Text slot="label">Album</Text>
        </ListItem>
      )
      render(
        <>
          <Scheme density="-3">
            <List aria-label="Dense" className="w-80">
              <Album />
            </List>
          </Scheme>
          <Scheme>
            <List aria-label="Padded" className="w-80">
              <Album className="py-4" />
            </List>
          </Scheme>
        </>,
      )
      const [dense, padded] = screen.getAllByRole('row') as [HTMLElement, HTMLElement]
      const [inDense, inPadded] = screen.getAllByText('Album') as [HTMLElement, HTMLElement]
      expect(rect(dense).height).toBe(76)
      expect(rect(padded).height).toBe(96)
      await settle()
      expect(rect(inPadded).top - rect(padded).top).toBe(16)
      expect(center(rect(inDense))).toBeCloseTo(center(rect(dense)), 1)
    })

    it('centres the parts of an item again once its padding alone takes it under 88dp, as a change of density does', async () => {
      const Album = ({ density }: { density?: '-2' }) => (
        <Scheme density={density}>
          <List aria-label="Albums" className="w-80">
            <ListItem id="a" textValue="Album">
              <img slot="leading" alt="" className="size-18 rounded-shape-sm" />
              <Text slot="label">Album</Text>
            </ListItem>
          </List>
        </Scheme>
      )
      const { rerender } = render(<Album />)
      const item = row('Album')
      const label = screen.getByText('Album')
      expect(rect(item).height).toBe(92)
      await waitFor(() => expect(rect(label).top - rect(item).top).toBe(10))
      await settle()
      rerender(<Album density="-2" />)
      await waitFor(() => expect(rect(item).height).toBe(84))
      await waitFor(() => expect(center(rect(label))).toBeCloseTo(center(rect(item)), 1))
    })

    it('keeps each item its height in a list too short for them all, which scrolls', () => {
      render(
        <Scheme>
          <Contacts className="h-40 w-80 overflow-y-auto" />
        </Scheme>,
      )
      expect(screen.getAllByRole('row').map((item) => rect(item).height)).toEqual([88, 72, 72])
      expect(screen.getByRole('grid').scrollHeight).toBe(232)
    })

    it('tops the parts of an item 88dp tall or more, as an 80dp leading image makes it, whatever its text', () => {
      render(
        <Scheme>
          <List aria-label="Albums" className="w-80">
            <ListItem id="a" textValue="Album">
              <img slot="leading" alt="" className="size-20 rounded-shape-sm" />
              <Text slot="label">Album</Text>
              <Icon slot="trailing" name="more_vert" />
            </ListItem>
          </List>
        </Scheme>,
      )
      const item = row('Album')
      expect(rect(item).height).toBe(100)
      expect(rect(screen.getByText('Album')).top - rect(item).top).toBe(10)
      expect(rect(screen.getByText('more_vert')).top - rect(item).top).toBe(10)
    })

    it('draws text alone as the label, in the middle, 16dp in', () => {
      render(
        <Scheme>
          <List aria-label="Names" className="w-80">
            <ListItem id="a">Ali Connors</ListItem>
          </List>
        </Scheme>,
      )
      const item = row('Ali Connors')
      const range = document.createRange()
      const node = [...within(item).getByRole('gridcell').childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE,
      )!
      range.selectNodeContents(node)
      const text = range.getBoundingClientRect()
      expect(rect(item).height).toBe(56)
      expect(text.left - rect(item).left).toBe(16)
      // Within the half pixel a line of text is laid out to.
      expect(Math.abs(center(text) - center(rect(item)))).toBeLessThanOrEqual(0.5)
    })

    it('is 2dp shorter at its top and bottom for each step of density, and 48dp tall at least, its text in the middle', () => {
      render(
        <>
          <Lines />
          {(['-1', '-2', '-3'] as const).map((density) => (
            <Scheme key={density} density={density}>
              <List aria-label={`Density ${density}`} className="w-80">
                <ListItem id="one" textValue={`One at ${density}`}>
                  <Text slot="label">One at {density}</Text>
                </ListItem>
                <ListItem id="two" textValue={`Two at ${density}`}>
                  <Text slot="label">Two at {density}</Text>
                  <Text slot="description">Supporting text</Text>
                </ListItem>
              </List>
            </Scheme>
          ))}
        </>,
      )
      expect(rect(row('One line')).height).toBe(56)
      expect(rect(row('One at -1')).height).toBe(52)
      expect(rect(row('One at -2')).height).toBe(48)
      expect(rect(row(/Two at -3/)).height).toBe(60)
      // Its padding alone would leave it 44dp tall: the 48dp of a target is its least.
      const dense = row('One at -3')
      expect(getComputedStyle(dense).paddingTop).toBe('4px')
      expect(getComputedStyle(dense).paddingBottom).toBe('4px')
      expect(rect(dense).height).toBe(48)
      expect(center(rect(within(dense).getByText('One at -3')))).toBeCloseTo(center(rect(dense)), 1)
    })

    it('draws a drag handle at the start of a list that drags its items, its icon 16dp in and 12dp before the label', () => {
      render(<Reorderable />)
      const item = row(/Ali Connors/)
      const handle = within(item).getByRole('button')
      const icon = within(handle).getByText('drag_handle')
      expect(rect(handle).width).toBe(32)
      expect(rect(handle).height).toBe(32)
      expect(parseFloat(getComputedStyle(handle).borderRadius)).toBeGreaterThanOrEqual(16)
      expect(rect(icon).width).toBe(20)
      expect(rect(icon).left - rect(item).left).toBe(16)
      expect(rect(within(item).getByText('Ali Connors')).left - rect(icon).right).toBe(12)
      expect(center(rect(icon))).toBeCloseTo(center(rect(item)), 1)
    })
  })

  describe('colors', () => {
    it.each(schemes)(
      'draws its parts in their roles at rest, selected and disabled, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Contacts defaultSelectedKeys={['jennifer']} disabledKeys={['sandra']} />
          </Scheme>,
        )
        const ali = row(/Ali Connors/)
        expect(getComputedStyle(ali).backgroundColor).toBe(role('surface', ali))
        expect(getComputedStyle(within(ali).getByText('Ali Connors')).color).toBe(
          role('on-surface', ali),
        )
        for (const part of ['Overline', 'Brunch this weekend?', '15 min', 'person', 'star'])
          expect(getComputedStyle(within(ali).getByText(part)).color, part).toBe(
            role('on-surface-variant', ali),
          )
        const jennifer = row(/Jennifer Lopez/)
        expect(getComputedStyle(jennifer).backgroundColor).toBe(
          role('secondary-container', jennifer),
        )
        for (const part of ['Jennifer Lopez', 'Summer BBQ', 'person', 'star'])
          expect(getComputedStyle(within(jennifer).getByText(part)).color, `selected ${part}`).toBe(
            role('on-secondary-container', jennifer),
          )
        const sandra = row(/Sandra Adams/)
        expect(getComputedStyle(sandra).backgroundColor).toBe(role('surface', sandra))
        for (const part of ['Sandra Adams', 'Oui oui', 'person', 'star'])
          expect(getComputedStyle(within(sandra).getByText(part)).color, `disabled ${part}`).toBe(
            roleAt('on-surface', 38, sandra),
          )
      },
    )

    it.each(schemes)(
      'keeps its text at 4.5:1 or more and its icons at 3:1, at rest and selected, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Contacts defaultSelectedKeys={['jennifer']} />
          </Scheme>,
        )
        for (const name of [/Ali Connors/, /Jennifer Lopez/]) {
          const item = row(name)
          for (const text of within(item).getAllByText(/[A-Za-z]/)) {
            const minimum = text.classList.contains('font-icon') ? 3 : 4.5
            expect(contrastIn(text), `${text.textContent} in ${name}`).toBeGreaterThanOrEqual(
              minimum,
            )
          }
        }
      },
    )

    it('fills the icons of a selected item', () => {
      render(
        <Scheme>
          <Contacts defaultSelectedKeys={['jennifer']} />
        </Scheme>,
      )
      const fill = (item: Element) =>
        getComputedStyle(within(item as HTMLElement).getByText('person')).fontVariationSettings
      expect(fill(row(/Ali Connors/))).toContain('"FILL" 0')
      expect(fill(row(/Jennifer Lopez/))).toContain('"FILL" 1')
    })

    it('draws a selected disabled item on its disabled state layer, on-surface at 10%', () => {
      render(
        <Scheme>
          <Contacts defaultSelectedKeys={['jennifer']} disabledKeys={['jennifer']} />
        </Scheme>,
      )
      const item = row(/Jennifer Lopez/)
      expect(getComputedStyle(item).backgroundColor).toBe(roleAt('on-surface', 10, item))
      expect(getComputedStyle(within(item).getByText('Jennifer Lopez')).color).toBe(
        roleAt('on-surface', 38, item),
      )
    })
  })

  describe('shape', () => {
    it('has 4dp corners, 16dp selected, and in a segmented list 16dp outer corners and 2dp between the items', () => {
      const { unmount } = render(
        <Scheme>
          <Contacts defaultSelectedKeys={['jennifer']} />
        </Scheme>,
      )
      const rows = () => screen.getAllByRole('row') as [HTMLElement, HTMLElement, HTMLElement]
      const [first, second] = rows()
      expect(getComputedStyle(first).borderRadius).toBe('4px')
      expect(getComputedStyle(second).borderRadius).toBe('16px')
      expect(rect(second).top).toBe(rect(first).bottom)
      // Rendered anew, since a change of corners would be on its spring for a while.
      unmount()
      render(
        <Scheme>
          <Contacts variant="segmented" defaultSelectedKeys={['jennifer']} />
        </Scheme>,
      )
      const [ali, jennifer, sandra] = rows()
      expect(getComputedStyle(ali).borderRadius).toBe('16px 16px 4px 4px')
      expect(getComputedStyle(jennifer).borderRadius).toBe('16px')
      expect(getComputedStyle(sandra).borderRadius).toBe('4px 4px 16px 16px')
      expect(rect(jennifer).top - rect(ali).bottom).toBe(2)
      expect(rect(sandra).top - rect(jennifer).bottom).toBe(2)
    })

    it('rounds the first item’s start corners and the last’s end corners in a segmented list laid side by side, as its direction has them', () => {
      const SideBySide = ({ dir }: { dir: 'ltr' | 'rtl' }) => (
        <Scheme>
          <div dir={dir}>
            <Contacts variant="segmented" orientation="horizontal" className="w-max" />
          </div>
        </Scheme>
      )
      const radii = () =>
        screen.getAllByRole('row').map((item) => getComputedStyle(item).borderRadius)
      const { unmount } = render(<SideBySide dir="ltr" />)
      expect(radii()).toEqual(['16px 4px 4px 16px', '4px', '4px 16px 16px 4px'])
      const [ali, jennifer] = screen.getAllByRole('row') as [HTMLElement, HTMLElement]
      expect(rect(jennifer).left - rect(ali).right).toBeCloseTo(2, 1)
      // Rendered anew, since a change of corners would be on its spring for a while.
      unmount()
      render(<SideBySide dir="rtl" />)
      expect(radii()).toEqual(['4px 16px 16px 4px', '4px', '16px 4px 4px 16px'])
    })

    it('draws a divider over each item but the first, 1dp of outline variant 16dp in from the sides', () => {
      render(
        <Scheme>
          <Contacts hasDivider selectionMode="none" />
        </Scheme>,
      )
      const [ali, jennifer] = screen.getAllByRole('row') as [HTMLElement, HTMLElement]
      expect(getComputedStyle(ali).backgroundImage).toBe('none')
      const style = getComputedStyle(jennifer)
      expect(style.backgroundImage).toContain(role('outline-variant', jennifer))
      expect(style.backgroundSize).toBe('calc(100% - 32px) 1px')
      expect(style.backgroundPosition).toBe('50% 0%')
      expect(style.backgroundRepeat).toBe('no-repeat')
    })
  })

  describe('states', () => {
    it('shows the 8% hover layer, the pointer and 12dp corners over an item that selects or acts, and nothing over one that does neither', async () => {
      render(
        <Scheme>
          <Contacts />
          <List aria-label="Details" className="w-80">
            <ListItem id="size" textValue="Size">
              <Text slot="label">Size</Text>
            </ListItem>
          </List>
        </Scheme>,
      )
      await userEvent.hover(document.body)
      const ali = row(/Ali Connors/)
      await userEvent.hover(ali)
      await settle()
      expect(ali).toHaveAttribute('data-hovered')
      expect(getComputedStyle(layerOf(ali)).opacity).toBe('0.08')
      expect(getComputedStyle(layerOf(ali)).backgroundColor).toBe(role('on-surface', ali))
      expect(getComputedStyle(ali).cursor).toBe('pointer')
      expect(getComputedStyle(ali).borderRadius).toBe('12px')
      const size = row('Size')
      await userEvent.hover(size)
      await settle()
      expect(size).not.toHaveAttribute('data-hovered')
      expect(getComputedStyle(layerOf(size)).opacity).toBe('0')
      expect(getComputedStyle(size).cursor).not.toBe('pointer')
      expect(getComputedStyle(size).borderRadius).toBe('4px')
    })

    it('draws the focus ring inside its edge and over its neighbours at once, 16dp corners and the 10% layer on keyboard focus, lets the item down as the ring goes, and draws no ring from a press', async () => {
      render(
        <Scheme>
          <button>Before</button>
          <Contacts />
        </Scheme>,
      )
      const ali = row(/Ali Connors/)
      // Held where they begin: a ring that waited to rise over the item's neighbours has not risen.
      const morphs = catchTransitions(ali)
      await userEvent.click(screen.getByRole('button', { name: 'Before' }))
      await userEvent.tab()
      expect(ali).toHaveFocus()
      await waitFor(() => expect(morphs.caught.length).toBeGreaterThan(0))
      expect(getComputedStyle(ali).zIndex).toBe('5')
      morphs.release()
      await settle()
      expect(ali).toHaveAttribute('data-focus-visible')
      const style = getComputedStyle(ali)
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('3px')
      expect(style.outlineOffset).toBe('-3px')
      expect(style.outlineColor).toBe(role('secondary', ali))
      expect(style.borderRadius).toBe('16px')
      expect(getComputedStyle(layerOf(ali)).opacity).toBe('0.1')
      // The ring gone, the item is let down at once: only a dragged item's lift is slow to go.
      const lowering = catchTransitions(ali)
      await userEvent.click(row(/Jennifer Lopez/))
      await waitFor(() => expect(lowering.caught.length).toBeGreaterThan(0))
      expect(getComputedStyle(ali).zIndex).toBe('auto')
      lowering.release()
      await settle()
      expect(row(/Jennifer Lopez/)).toHaveFocus()
      expect(row(/Jennifer Lopez/)).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(row(/Jennifer Lopez/)).outlineStyle).toBe('none')
    })

    it('goes to 16dp corners while pressed, and draws the ripple', async () => {
      render(
        <Scheme>
          <Contacts />
        </Scheme>,
      )
      const ali = row(/Ali Connors/)
      await commands.pointer('[role="row"]', 100, 30, 'down')
      try {
        await waitFor(() => expect(ali).toHaveAttribute('data-pressed'))
        await settle()
        expect(getComputedStyle(ali).borderRadius).toBe('16px')
        expect(ali.querySelector('.opacity-state-pressed')).not.toBeNull()
        expect(getComputedStyle(surfaceOf(ali)).opacity).toBe('1')
      } finally {
        await commands.pointer('[role="row"]', 100, 30, 'up')
      }
    })

    it('draws no ripple and keeps its 4dp corners under a press on an item that neither selects nor acts', async () => {
      render(
        <Scheme>
          <List aria-label="Details" className="w-80">
            <ListItem id="size" textValue="Size">
              <Text slot="label">Size</Text>
            </ListItem>
          </List>
        </Scheme>,
      )
      const size = row('Size')
      await commands.pointer('[role="row"]', 100, 30, 'down')
      try {
        // The press has come: the row it is on takes the focus, as any row does.
        await waitFor(() => expect(size).toHaveFocus())
        await settle()
        expect(size).not.toHaveAttribute('data-pressed')
        expect(getComputedStyle(surfaceOf(size)).opacity).toBe('0')
        expect(getComputedStyle(layerOf(size)).opacity).toBe('0')
        expect(getComputedStyle(size).borderRadius).toBe('4px')
        expect(getComputedStyle(size).outlineStyle).toBe('none')
      } finally {
        await commands.pointer('[role="row"]', 100, 30, 'up')
      }
    })

    it('keeps the ripple of a tap for half its growth and its fade after the press, then fades it', () => {
      render(
        <Scheme>
          <Contacts />
        </Scheme>,
      )
      const ali = row(/Ali Connors/)
      const tokens = getComputedStyle(ali)
      const seconds = (token: string) => parseFloat(tokens.getPropertyValue(token)) / 1000
      const grow = seconds('--md-sys-motion-duration-long1')
      const fade = seconds('--md-sys-motion-duration-short4')
      const style = getComputedStyle(surfaceOf(ali))
      expect(style.opacity).toBe('0')
      expect(style.transitionProperty).toBe('opacity')
      expect(parseFloat(style.transitionDelay)).toBeCloseTo(grow / 2 + fade, 5)
      expect(parseFloat(style.transitionDuration)).toBeCloseTo(fade, 5)
    })

    it('draws a disabled item with no hover layer and no pointer', async () => {
      render(
        <Scheme>
          <Contacts disabledKeys={['sandra']} />
        </Scheme>,
      )
      const sandra = row(/Sandra Adams/)
      await userEvent.hover(sandra)
      await settle()
      expect(getComputedStyle(layerOf(sandra)).opacity).toBe('0')
      expect(getComputedStyle(sandra).cursor).not.toBe('pointer')
    })
  })

  describe('drag and drop', () => {
    it('takes the item a pointer drags out of the list and draws its placeholder in the room it left: 12dp from the sides and 6dp from the top and bottom, the dragged look at 38%', async () => {
      render(<Reorderable />)
      const grid = screen.getByRole('grid')
      const ali = row(/Ali Connors/)
      const others = screen.getAllByRole('row').slice(1)
      const room = rect(ali)
      const height = rect(grid).height
      const tops = others.map((item) => rect(item).top)
      await drag()
      await settle()
      expect(rect(ali).height).toBe(0)
      expect(getComputedStyle(ali).opacity).toBe('0')
      expect(others.map((item) => rect(item).top)).toEqual(tops)
      expect(rect(grid).height).toBe(height)
      const spot = placeholder()!
      expect(rect(spot).top).toBe(room.top)
      expect(rect(spot).left).toBe(room.left)
      expect(rect(spot).width).toBe(room.width)
      expect(rect(spot).height).toBe(room.height)
      expect(getComputedStyle(spot).opacity).toBe('0.38')
      for (const part of ['::before', '::after']) {
        const style = getComputedStyle(spot, part)
        expect(style.content).toBe('""')
        expect([style.top, style.right, style.bottom, style.left]).toEqual([
          '6px',
          '12px',
          '6px',
          '12px',
        ])
        expect(style.borderRadius).toBe('4px')
      }
      expect(getComputedStyle(spot, '::before').backgroundColor).toBe(
        role('tertiary-container', spot),
      )
      expect(getComputedStyle(spot, '::after').backgroundColor).toBe(
        roleAt('on-tertiary-container', 16, spot),
      )
      await pointAt(150, 40, 'up')
      await waitFor(() => expect(ali).not.toHaveAttribute('data-dragging'))
      expect(names()).toEqual(['Ali Connors', 'Jennifer Lopez', 'Sandra Adams', 'Trevor Hansen'])
    })

    it('keeps the items under the placeholder where they are in a list given a gap of its own', async () => {
      render(<Reorderable className="w-80 gap-2" />)
      expect(getComputedStyle(screen.getByRole('grid')).rowGap).toBe('8px')
      const others = screen.getAllByRole('row').slice(1)
      const tops = others.map((item) => rect(item).top)
      await drag()
      await settle()
      expect(others.map((item) => rect(item).top)).toEqual(tops)
      await pointAt(150, 40, 'up')
    })

    it('draws what the pointer drags as the item lifted: a copy on tertiary container at elevation 4 with 16dp corners and no press ripple, with 24dp around it, held where the pointer took it', async () => {
      render(<Reorderable />)
      const ali = row(/Ali Connors/)
      const size = rect(ali)
      const shadow = elevation(4, ali)
      const held = heldPointOf(ali)
      const drawn: Record<string, unknown>[] = []
      const setDragImage = vi
        .spyOn(DataTransfer.prototype, 'setDragImage')
        .mockImplementation((image, x, y) => {
          const copy = image.querySelector<HTMLElement>('[role="row"]')!
          const style = getComputedStyle(copy)
          drawn.push({
            at: [x, y],
            room: getComputedStyle(copy.parentElement!).padding,
            hidden: copy.parentElement!.getAttribute('aria-hidden'),
            size: [rect(copy).width, rect(copy).height],
            dragging: copy.hasAttribute('data-dragging'),
            background: style.backgroundColor,
            label: getComputedStyle(within(copy).getByText('Ali Connors')).color,
            radius: style.borderRadius,
            shadow: style.boxShadow.includes(shadow),
            layer: getComputedStyle(layerOf(copy)).opacity,
            ripples: [layerOf(ali), layerOf(copy)].map(
              (layer) => layer.nextElementSibling!.childElementCount,
            ),
          })
        })
      onTestFinished(() => setDragImage.mockRestore())
      await drag()
      expect(drawn).toEqual([
        {
          at: [held.x + 24, held.y + 24],
          room: '24px',
          hidden: 'true',
          size: [size.width, size.height],
          dragging: true,
          background: role('tertiary-container', ali),
          label: role('on-tertiary-container', ali),
          radius: '16px',
          shadow: true,
          layer: '0.16',
          ripples: [1, 0],
        },
      ])
      await pointAt(150, 40, 'up')
    })

    it('draws the drag preview given to useDragAndDrop in place of its own', async () => {
      render(<Reorderable renderDragPreview={() => <div>One contact</div>} />)
      const setDragImage = vi.spyOn(DataTransfer.prototype, 'setDragImage')
      onTestFinished(() => setDragImage.mockRestore())
      await drag()
      expect(setDragImage.mock.calls.map(([image]) => image.textContent)).toEqual(['One contact'])
      await pointAt(150, 40, 'up')
    })

    it('draws the lifted copy the size of the item on a page that sizes every box by its border, as Tailwind’s preflight does', async () => {
      const preflight = document.createElement('style')
      preflight.textContent = '*, ::before, ::after { box-sizing: border-box }'
      document.head.append(preflight)
      onTestFinished(() => preflight.remove())
      render(<Reorderable />)
      const size = rect(row(/Ali Connors/))
      const copies = copiesDrawn()
      await drag()
      expect(copies).toEqual([{ size: [size.width, size.height], room: '24px' }])
      await pointAt(150, 40, 'up')
    })

    it('draws the lifted copy as tall as its list makes the item, in one laid side by side that is taller than its items', async () => {
      render(<Reorderable orientation="horizontal" className="h-24 w-max" />)
      const size = rect(row(/Ali Connors/))
      expect(size.height).toBe(96)
      const copies = copiesDrawn()
      onTestFinished(() => commands.releasePress())
      await pointAt(40, 28, 'down')
      await pointAt(46, 28)
      await pointAt(52, 28)
      await waitFor(() => expect(placeholder()).not.toBeNull())
      expect(copies).toEqual([{ size: [size.width, size.height], room: '24px' }])
      await pointAt(52, 28, 'up')
    })

    it('draws the drop indicator given to useDragAndDrop in place of the placeholder, and leaves the dragged item its room', async () => {
      render(
        <Reorderable
          renderDropIndicator={(target) => <DropIndicator target={target} className="h-1" />}
        />,
      )
      const ali = row(/Ali Connors/)
      onTestFinished(() => commands.releasePress())
      await pointAt(150, 28, 'down')
      await pointAt(150, 34)
      await pointAt(150, 100)
      await waitFor(() => expect(ali).toHaveAttribute('data-dragging'))
      const indicator = () => document.querySelector<HTMLElement>('[role="row"][data-drop-target]')
      await waitFor(() => expect(indicator()).not.toBeNull())
      await settle()
      expect(rect(indicator()!).height).toBe(4)
      expect(placeholder()).toBeNull()
      expect(rect(ali).height).toBe(56)
      await pointAt(150, 100, 'up')
    })

    it('slides the item the placeholder passes to its new place on the fast spatial spring, and opens and fades the placeholder in on the fast effects one, a short-1 later', async () => {
      render(<Reorderable />)
      const grid = screen.getByRole('grid')
      const jennifer = row(/Jennifer Lopez/)
      const top = rect(jennifer).top
      await drag()
      await settle()
      const slides = movesOf(jennifer)
      const fades = catchTransitions(grid, (el) => el.matches('.list-placeholder'))
      await pointAt(150, 100)
      await waitFor(() => expect(placeholder()?.previousElementSibling).toBe(jennifer))
      expect(slides()).toEqual([
        {
          translate: ['0px 58px', '0px'],
          duration: parseFloat(springDuration('fast-spatial')) * 1000,
          easing: easingOf('spring-fast-spatial-easing', jennifer),
          composite: 'add',
        },
      ])
      const spot = placeholder()!
      await waitFor(() => expect(fades.caught).toHaveLength(2))
      const style = getComputedStyle(spot)
      expect(style.opacity).toBe('0')
      expect(style.scale).toBe('1 0.6')
      expect(style.transitionProperty).toBe('opacity, scale')
      expect(style.transitionDuration).toBe(springDuration('fast-effects'))
      expect(style.transitionTimingFunction).toBe(springEasing('fast-effects'))
      expect(style.transitionDelay).toBe('0.05s')
      fades.release()
      await settle()
      expect(style.opacity).toBe('0.38')
      expect(style.scale).toBe('1')
      expect(rect(jennifer).top).toBe(top - 58)
      expect(rect(spot).top).toBe(top)
      await pointAt(150, 100, 'up')
    })

    it('keeps the placeholder as it is while the pointer goes from after the item above to before the one below: one place, two drop positions of React Aria’s', async () => {
      render(<Reorderable />)
      const jennifer = row(/Jennifer Lopez/)
      const room = rect(jennifer)
      onTestFinished(() => commands.releasePress())
      // Taken below its middle, the item is first to be dropped after itself.
      await pointAt(150, 100, 'down')
      await pointAt(150, 104)
      await pointAt(150, 108)
      await waitFor(() => expect(placeholder()?.previousElementSibling).toBe(jennifer))
      await settle()
      const before = placeholder()
      await pointAt(150, 40)
      await waitFor(() => expect(placeholder()?.nextElementSibling).toBe(jennifer))
      const spot = placeholder()!
      expect(spot).not.toBe(before)
      expect(spot.getAnimations().filter(({ playState }) => playState === 'running')).toEqual([])
      expect(getComputedStyle(spot).opacity).toBe('0.38')
      expect(getComputedStyle(spot).scale).toBe('1')
      expect(rect(spot).top).toBe(room.top)
      expect(rect(spot).height).toBe(room.height)
      await pointAt(150, 40, 'up')
      await waitFor(() => expect(jennifer).not.toHaveAttribute('data-dragging'))
      expect(names()).toEqual(['Ali Connors', 'Jennifer Lopez', 'Sandra Adams', 'Trevor Hansen'])
    })

    it('drops the item where its placeholder is: it springs there from where the pointer left it, as it was dragged and over its neighbours until it has settled, and is never ringed', async () => {
      render(<Reorderable />)
      const grid = screen.getByRole('grid')
      const ali = row(/Ali Connors/)
      const held = heldPointOf(ali)
      await drag(150, 100)
      await settle()
      const glides = movesOf(ali)
      const fades = catchTransitions(ali)
      // Each frame drawn from here on: whether an item is ringed in it.
      const ringed: boolean[] = []
      let watching = true
      const watch = () => {
        ringed.push(!!grid.querySelector('[data-focus-visible]'))
        if (watching) requestAnimationFrame(watch)
      }
      requestAnimationFrame(watch)
      await pointAt(170, 104, 'up')
      await waitFor(() =>
        expect(names()).toEqual(['Jennifer Lopez', 'Ali Connors', 'Sandra Adams', 'Trevor Hansen']),
      )
      // From the corner of what was dragged, let go at 170, 104, to the second room, 58 down.
      const spring = parseFloat(springDuration('fast-spatial')) * 1000
      expect(glides()).toEqual([
        {
          translate: [`${170 - held.x}px ${104 - held.y - 58}px`, '0px'],
          duration: spring,
          easing: easingOf('spring-fast-spatial-easing', ali),
          composite: 'add',
        },
      ])
      await waitFor(() => expect(ali).not.toHaveAttribute('data-dragging'))
      await waitFor(() => expect(fades.caught.length).toBeGreaterThan(0))
      expect(getComputedStyle(ali).backgroundColor).toBe(role('tertiary-container', ali))
      expect(getComputedStyle(ali).borderRadius).toBe('16px')
      // No longer marked as dragged, it is let down among its neighbours only as its spring ends.
      expect(getComputedStyle(ali).zIndex).toBe('1')
      const lowering = fades.caught.find(
        (fade) => (fade as CSSTransition).transitionProperty === '--list-item-lift',
      )
      expect(lowering?.effect?.getTiming()).toMatchObject({ delay: spring, duration: 0 })
      fades.release()
      await new Promise((resolve) => setTimeout(resolve, 200))
      await settle()
      watching = false
      expect(ringed.length).toBeGreaterThan(1)
      expect(ringed).not.toContain(true)
      expect(ali).not.toHaveAttribute('data-dragging')
      expect(getComputedStyle(ali).backgroundColor).toBe(role('surface', ali))
      expect(getComputedStyle(ali).zIndex).toBe('auto')
      expect(rect(ali).top).toBe(rect(grid).top + 58)
    })

    it('rings the item the keyboard goes to at once, over a dropped item that has not settled beside it', async () => {
      render(<Reorderable />)
      const grid = screen.getByRole('grid')
      const ali = row(/Ali Connors/)
      await drag(150, 100)
      await settle()
      // Held where they begin: the dropped item is not let down, and a ring that waited has not risen.
      const morphs = catchTransitions(grid, () => true)
      await pointAt(170, 104, 'up')
      await waitFor(() => expect(ali).not.toHaveAttribute('data-dragging'))
      await waitFor(() => expect(ali).toHaveFocus())
      await userEvent.keyboard('{ArrowDown}')
      const sandra = row(/Sandra Adams/)
      await waitFor(() => expect(sandra).toHaveAttribute('data-focus-visible'))
      await waitFor(() => expect(sandra.getAnimations().length).toBeGreaterThan(0))
      expect(getComputedStyle(ali).zIndex).toBe('1')
      expect(getComputedStyle(sandra).outlineStyle).toBe('solid')
      expect(getComputedStyle(sandra).zIndex).toBe('5')
      morphs.release()
      await settle()
      expect(getComputedStyle(ali).zIndex).toBe('auto')
    })

    it('puts the item back in its room, lifted on tertiary container at elevation 4, while the pointer has it out of the list', async () => {
      render(<Reorderable />)
      const grid = screen.getByRole('grid')
      const ali = row(/Ali Connors/)
      const others = screen.getAllByRole('row').slice(1)
      const room = rect(ali)
      const tops = others.map((item) => rect(item).top)
      await drag(150, 100)
      await commands.pointer('html', rect(grid).left + 150, rect(grid).bottom + 100)
      await waitFor(() => expect(placeholder()).toBeNull())
      await settle()
      expect(rect(ali).top).toBe(room.top)
      expect(rect(ali).height).toBe(room.height)
      expect(others.map((item) => rect(item).top)).toEqual(tops)
      const style = getComputedStyle(ali)
      expect(style.opacity).toBe('1')
      expect(style.backgroundColor).toBe(role('tertiary-container', ali))
      expect(getComputedStyle(within(ali).getByText('Ali Connors')).color).toBe(
        role('on-tertiary-container', ali),
      )
      expect(style.boxShadow).toContain(elevation(4, ali))
      expect(style.borderRadius).toBe('16px')
      // Over its neighbours, and at once, where it is let down only after a wait.
      expect(style.zIndex).toBe('1')
      expect(style.transitionDelay).toBe('0s')
      await commands.pointer('html', rect(grid).left + 150, rect(grid).bottom + 100, 'up')
      await waitFor(() => expect(ali).not.toHaveAttribute('data-dragging'))
      expect(names()).toEqual(['Ali Connors', 'Jennifer Lopez', 'Sandra Adams', 'Trevor Hansen'])
    })

    it('gives the placeholder of a list laid side by side the width of the item, which gives up its own', async () => {
      render(<Reorderable orientation="horizontal" className="w-max" />)
      const ali = row(/Ali Connors/)
      const others = screen.getAllByRole('row').slice(1)
      const room = rect(ali)
      const lefts = others.map((item) => rect(item).left)
      onTestFinished(() => commands.releasePress())
      await pointAt(40, 28, 'down')
      await pointAt(46, 28)
      await pointAt(52, 28)
      await waitFor(() => expect(placeholder()).not.toBeNull())
      await settle()
      expect(rect(ali).width).toBe(0)
      expect(rect(ali).height).toBe(room.height)
      expect(rect(placeholder()!).left).toBe(room.left)
      expect(rect(placeholder()!).width).toBe(room.width)
      expect(rect(placeholder()!).height).toBe(room.height)
      expect(others.map((item) => rect(item).left)).toEqual(lefts)
      expect(others.map((item) => rect(item).height)).toEqual([56, 56, 56])
      expect(rect(screen.getByRole('grid')).height).toBe(56)
      await pointAt(52, 28, 'up')
    })

    it.each([
      ['a height', { height: 96, paddingBlock: 20 }],
      ['a flex basis', { flex: '1 0 96px' }],
    ])(
      'takes an item given %s in its own style out of the list as any other, its room left to the placeholder',
      async (_, itemStyle) => {
        render(<Reorderable itemStyle={itemStyle} />)
        const ali = row(/Ali Connors/)
        const others = screen.getAllByRole('row').slice(1)
        const tops = others.map((item) => rect(item).top)
        expect(rect(ali).height).toBe(96)
        await drag()
        await settle()
        expect(rect(ali).height).toBe(0)
        expect(rect(placeholder()!).height).toBe(96)
        expect(others.map((item) => rect(item).top)).toEqual(tops)
        await pointAt(150, 40, 'up')
      },
    )

    it.each([
      ['a width', { width: 220, paddingInline: 20 }],
      ['a flex basis', { flex: '1 0 220px' }],
    ])(
      'takes an item given %s in its own style out of a list laid side by side, and leaves the items their height',
      async (_, itemStyle) => {
        render(<Reorderable orientation="horizontal" className="w-max" itemStyle={itemStyle} />)
        const ali = row(/Ali Connors/)
        const others = screen.getAllByRole('row').slice(1)
        const lefts = others.map((item) => rect(item).left)
        const heights = () => [ali, ...others].map((item) => rect(item).height)
        expect(rect(ali).width).toBe(220)
        expect(heights()).toEqual([56, 56, 56, 56])
        onTestFinished(() => commands.releasePress())
        await pointAt(40, 28, 'down')
        await pointAt(46, 28)
        await pointAt(52, 28)
        await waitFor(() => expect(placeholder()).not.toBeNull())
        await settle()
        expect(rect(ali).width).toBe(0)
        expect(rect(placeholder()!).width).toBe(220)
        expect(others.map((item) => rect(item).left)).toEqual(lefts)
        expect(heights()).toEqual([56, 56, 56, 56])
        expect(rect(screen.getByRole('grid')).height).toBe(56)
        await pointAt(52, 28, 'up')
      },
    )

    it('leaves the items of a list laid side by side their height while one whose label is of several words is out of it', async () => {
      const Words = () => {
        const { dragAndDropHooks } = useDragAndDrop({
          getItems: (keys: Set<Key>) => [...keys].map((key) => ({ 'text/plain': String(key) })),
          onReorder() {},
        })
        return (
          <Scheme>
            <List
              aria-label="Words"
              orientation="horizontal"
              className="w-max"
              dragAndDropHooks={dragAndDropHooks}
            >
              <ListItem id="long">Brunch this weekend with friends</ListItem>
              <ListItem id="short">Brunch</ListItem>
            </List>
          </Scheme>
        )
      }
      render(<Words />)
      const long = row(/Brunch this weekend/)
      const grid = screen.getByRole('grid')
      expect(rect(long).height).toBe(56)
      onTestFinished(() => commands.releasePress())
      await pointAt(60, 28, 'down')
      await pointAt(66, 28)
      await pointAt(72, 28)
      await waitFor(() => expect(placeholder()).not.toBeNull())
      await settle()
      expect(rect(long).width).toBe(0)
      expect(rect(long).height).toBe(56)
      expect(rect(grid).height).toBe(56)
      expect(rect(row(/^(Drag )?Brunch$/)).height).toBe(56)
      await pointAt(72, 28, 'up')
    })

    it('gives the placeholder the item’s room by the list’s own measure, under an ancestor that scales the list', async () => {
      render(
        <div style={{ transform: 'scale(0.5)', transformOrigin: '0 0' }}>
          <Reorderable />
        </div>,
      )
      const ali = row(/Ali Connors/)
      const others = screen.getAllByRole('row').slice(1)
      const tops = others.map((item) => rect(item).top)
      expect(rect(ali).height).toBe(28)
      onTestFinished(() => commands.releasePress())
      await pointAt(75, 14, 'down')
      await pointAt(75, 17)
      await pointAt(75, 20)
      await waitFor(() => expect(ali).toHaveAttribute('data-dragging'))
      await waitFor(() => expect(placeholder()).not.toBeNull())
      await settle()
      expect(rect(placeholder()!).height).toBe(28)
      expect(others.map((item) => rect(item).top)).toEqual(tops)
      await pointAt(75, 20, 'up')
    })

    it('springs a dropped item from where the pointer left it under an ancestor that scales the list, the way there in the list’s own measure', async () => {
      render(
        <div style={{ transform: 'scale(0.5)', transformOrigin: '0 0' }}>
          <Reorderable />
        </div>,
      )
      const ali = row(/Ali Connors/)
      const held = heldPointOf(ali)
      onTestFinished(() => commands.releasePress())
      await pointAt(75, 14, 'down')
      await pointAt(75, 17)
      await pointAt(75, 50)
      await waitFor(() => expect(ali).toHaveAttribute('data-dragging'))
      await waitFor(() => expect(placeholder()).not.toBeNull())
      await settle()
      const glides = movesOf(ali)
      await pointAt(85, 52, 'up')
      await waitFor(() =>
        expect(names()).toEqual(['Jennifer Lopez', 'Ali Connors', 'Sandra Adams', 'Trevor Hansen']),
      )
      // Let go at 85, 52 of the list on the screen, where the second room is 29 down: twice that in the list.
      expect(glides().map((glide) => glide.translate)).toEqual([
        [`${(85 - held.x) * 2}px ${(52 - held.y - 29) * 2}px`, '0px'],
      ])
    })

    it('leaves the item a keyboard drags lifted in its place and opens the placeholder where it would land; dropped, the item springs there, ringed', async () => {
      render(
        <Scheme>
          <button>Before</button>
          <Reorderable />
        </Scheme>,
      )
      const grid = screen.getByRole('grid')
      const height = rect(grid).height
      await userEvent.click(screen.getByRole('button', { name: 'Before' }))
      await userEvent.tab()
      await userEvent.keyboard('{ArrowRight}')
      const ali = row(/Ali Connors/)
      const room = rect(ali)
      const handle = within(ali).getByRole('button')
      expect(handle).toHaveFocus()
      expect(getComputedStyle(handle).outlineStyle).toBe('solid')
      await userEvent.keyboard('{Enter}')
      await waitFor(() => expect(ali).toHaveAttribute('data-dragging'))
      await waitFor(() => expect(placeholder()).not.toBeNull())
      await settle()
      const style = getComputedStyle(ali)
      expect(rect(ali).top).toBe(room.top)
      expect(rect(ali).height).toBe(room.height)
      expect(style.opacity).toBe('1')
      expect(style.backgroundColor).toBe(role('tertiary-container', ali))
      expect(style.boxShadow).toContain(elevation(4, ali))
      expect(style.borderRadius).toBe('16px')
      expect(rect(placeholder()!).top).toBe(room.bottom + 2)
      expect(rect(placeholder()!).height).toBe(room.height)
      expect(rect(grid).height).toBe(height + room.height + 2)
      const flights = movesOf(ali)
      await userEvent.keyboard('{ArrowDown}')
      await waitFor(() => expect(placeholder()?.previousElementSibling).toBe(row(/Jennifer Lopez/)))
      await userEvent.keyboard('{ArrowDown}{Enter}')
      await waitFor(() =>
        expect(names()).toEqual(['Jennifer Lopez', 'Sandra Adams', 'Ali Connors', 'Trevor Hansen']),
      )
      await waitFor(() => expect(row(/Ali Connors/)).toHaveAttribute('data-focus-visible'))
      expect(flights()).toEqual([
        {
          translate: ['0px -116px', '0px'],
          duration: parseFloat(springDuration('fast-spatial')) * 1000,
          easing: easingOf('spring-fast-spatial-easing', ali),
          composite: 'add',
        },
      ])
      await settle()
      expect(rect(grid).height).toBe(height)
    })

    it.each(leaving)(
      'opens the placeholder of an item a pointer drags in from another list in the room of that item, takes the item there, and gives the next drag a room of its own, the item leaving its list %s',
      async (leaves) => {
        await withKeyboardDrag(async () => {
          render(<Boards leaves={leaves} />)
          const [favorites, others] = screen.getAllByRole('grid') as [HTMLElement, HTMLElement]
          const ali = row(/Ali Connors/)
          const room = rect(ali)
          const height = rect(others).height
          onTestFinished(() => commands.releasePress())
          await pointAt(150, 36, 'down')
          await pointAt(150, 42)
          await commands.pointer('[aria-label="Others"]', 150, 20)
          await commands.pointer('[aria-label="Others"]', 150, 20)
          await waitFor(() => expect(placeholder()?.parentElement).toBe(others))
          await settle()
          expect(rect(placeholder()!).height).toBe(room.height)
          expect(rect(placeholder()!).width).toBe(room.width)
          expect(rect(others).height).toBe(height + room.height)
          expect(rect(ali).height).toBe(room.height)
          await commands.pointer('[aria-label="Others"]', 150, 20, 'up')
          await waitFor(() =>
            expect(
              within(others)
                .getAllByRole('row')
                .map((item) => item.textContent),
            ).toEqual(['Ali Connors', 'Sandra Adams', 'Trevor Hansen']),
          )
          await settle()
          expect(within(favorites).getAllByRole('row')).toHaveLength(1)
          expect(rect(others).height).toBe(height + 56)
          // The item the pointer took has left its list, which never heard that drag end.
          await userEvent.click(screen.getByRole('button', { name: 'Before' }))
          await userEvent.tab()
          await userEvent.keyboard('{ArrowRight}{Enter}')
          await waitFor(() => expect(row(/Jennifer Lopez/)).toHaveAttribute('data-dragging'))
          await waitFor(() => expect(placeholder()?.parentElement).toBe(others))
          await settle()
          expect(rect(placeholder()!).height).toBe(72)
        })
      },
    )

    it.each(leaving)(
      'opens the placeholder of an item a keyboard drags in from another list in the room of that item, and takes the item there, the item leaving its list %s',
      async (leaves) => {
        await withKeyboardDrag(async () => {
          render(<Boards leaves={leaves} />)
          const [favorites, others] = screen.getAllByRole('grid') as [HTMLElement, HTMLElement]
          const ali = row(/Ali Connors/)
          const room = rect(ali)
          const height = rect(others).height
          expect(room.height).toBe(72)
          expect(rect(row('Sandra Adams')).height).toBe(56)
          await userEvent.click(screen.getByRole('button', { name: 'Before' }))
          await userEvent.tab()
          await userEvent.keyboard('{ArrowRight}')
          expect(within(ali).getByRole('button')).toHaveFocus()
          await userEvent.keyboard('{Enter}')
          await waitFor(() => expect(ali).toHaveAttribute('data-dragging'))
          await waitFor(() => expect(placeholder()).not.toBeNull())
          await settle()
          const spot = placeholder()!
          expect(spot.parentElement).toBe(others)
          expect(rect(spot).height).toBe(room.height)
          expect(rect(spot).width).toBe(room.width)
          expect(rect(others).height).toBe(height + room.height)
          expect(rect(favorites).height).toBe(2 * room.height)
          await userEvent.keyboard('{Enter}')
          await waitFor(() =>
            expect(
              within(others)
                .getAllByRole('row')
                .map((item) => item.textContent),
            ).toEqual(['Ali Connors', 'Sandra Adams', 'Trevor Hansen']),
          )
          await settle()
          expect(within(favorites).getAllByRole('row')).toHaveLength(1)
          expect(rect(others).height).toBe(height + 56)
        })
      },
    )

    it.each(leaving)(
      'keeps the items under an item dropped in from another list where its placeholder held them, but for what the item is shorter by, the item leaving its list %s',
      async (leaves) => {
        render(<Boards leaves={leaves} />)
        const others = screen.getByRole('grid', { name: 'Others' })
        const sandra = row('Sandra Adams')
        const under = () => rect(sandra).top - rect(others).top
        onTestFinished(() => commands.releasePress())
        await pointAt(150, 36, 'down')
        await pointAt(150, 42)
        await commands.pointer('[aria-label="Others"]', 150, 20)
        await commands.pointer('[aria-label="Others"]', 150, 20)
        await waitFor(() => expect(placeholder()?.parentElement).toBe(others))
        await settle()
        // Under the 72dp of the placeholder, where the 56dp item it takes will stand.
        expect(under()).toBe(72)
        const frames = topsOf(sandra, others)
        await commands.pointer('[aria-label="Others"]', 150, 20, 'up')
        await waitFor(() => expect(within(others).getAllByRole('row')).toHaveLength(3))
        await settle()
        frames.stop()
        expect(under()).toBe(56)
        expect(frames.tops.length).toBeGreaterThan(1)
        expect(Math.max(...frames.tops)).toBeLessThanOrEqual(72.5)
      },
    )

    it('gives the placeholder its room in a list too short for it, which scrolls, and leaves the items their height', async () => {
      await withKeyboardDrag(async () => {
        render(
          <Scheme>
            <button>Before</button>
            <Reorderable className="h-40 w-80 overflow-y-auto" />
          </Scheme>,
        )
        await userEvent.click(screen.getByRole('button', { name: 'Before' }))
        await userEvent.tab()
        await userEvent.keyboard('{ArrowRight}{Enter}')
        await waitFor(() => expect(placeholder()).not.toBeNull())
        await settle()
        expect(rect(placeholder()!).height).toBe(56)
        const items = [...screen.getByRole('grid').querySelectorAll('.list-item-container')]
        expect(items.map((item) => rect(item).height)).toEqual([56, 56, 56, 56])
      })
    })

    it('measures the room for each drag anew: a drag the list refused leaves none for the next', async () => {
      await withKeyboardDrag(async () => {
        render(<Uneven />)
        onTestFinished(() => commands.releasePress())
        const jennifer = row(/Jennifer Lopez/)
        expect(rect(row('Ali Connors')).height).toBe(56)
        expect(rect(jennifer).height).toBe(72)
        // A thing of the page's own, dragged over the list and let go of where it came from.
        const entered = vi.fn()
        screen.getByRole('grid').addEventListener('dragenter', entered)
        await commands.pointer('#stranger', 10, 10, 'down')
        await commands.pointer('#stranger', 20, 20)
        await commands.pointer('#stranger', 30, 30)
        await pointAt(150, 28)
        await commands.pointer('#stranger', 10, 10)
        await commands.pointer('#stranger', 10, 10, 'up')
        expect(entered).toHaveBeenCalled()
        expect(placeholder()).toBeNull()
        await userEvent.click(screen.getByRole('button', { name: 'Before' }))
        await userEvent.tab()
        await userEvent.keyboard('{ArrowDown}{ArrowRight}')
        expect(within(jennifer).getByRole('button')).toHaveFocus()
        await userEvent.keyboard('{Enter}')
        await waitFor(() => expect(jennifer).toHaveAttribute('data-dragging'))
        await waitFor(() => expect(placeholder()).not.toBeNull())
        await settle()
        expect(rect(placeholder()!).height).toBe(72)
      })
    })

    it('gives the placeholder the room of the item the pointer took, of the selected items it drags with it', async () => {
      render(
        <Uneven selectionMode="multiple" defaultSelectedKeys={['Ali Connors', 'Sandra Adams']} />,
      )
      onTestFinished(() => commands.releasePress())
      const ali = row(/Ali Connors/)
      const sandra = row(/Sandra Adams/)
      const room = rect(sandra)
      expect(rect(ali).height).toBe(56)
      expect(room.height).toBe(72)
      // Sandra Adams, the third item, under the first of one line and the second of two.
      await pointAt(150, 164, 'down')
      await pointAt(150, 170)
      await pointAt(150, 176)
      await waitFor(() => expect(sandra).toHaveAttribute('data-dragging'))
      await waitFor(() => expect(placeholder()).not.toBeNull())
      await settle()
      expect(ali).toHaveAttribute('data-dragging')
      expect(rect(placeholder()!).height).toBe(room.height)
      await pointAt(150, 176, 'up')
      await waitFor(() => expect(sandra).not.toHaveAttribute('data-dragging'))
    })

    it.each([
      ['alone', undefined],
      ['with the selected item above it, which is shorter', ['Ali Connors', 'Sandra Adams']],
    ])(
      'gives the placeholder in another list the room of the item the pointer took out of a list that reorders its own, %s',
      async (_, selected) => {
        render(
          <Uneven selectionMode="multiple" defaultSelectedKeys={selected}>
            <Taker />
          </Uneven>,
        )
        onTestFinished(() => commands.releasePress())
        const others = screen.getByRole('grid', { name: 'Others' })
        const sandra = row(/Sandra Adams/)
        const room = rect(sandra)
        expect(rect(row(/Ali Connors/)).height).toBe(56)
        expect(room.height).toBe(72)
        // Sandra Adams, the third item, over her own list first, which opens her placeholder there.
        await pointAt(150, 164, 'down')
        await pointAt(150, 170)
        await pointAt(150, 176)
        await waitFor(() => expect(placeholder()?.parentElement).toBe(sandra.parentElement))
        await commands.pointer('[aria-label="Others"]', 150, 20)
        await commands.pointer('[aria-label="Others"]', 150, 20)
        await waitFor(() => expect(placeholder()?.parentElement).toBe(others))
        await settle()
        expect(rect(placeholder()!).height).toBe(room.height)
        expect(rect(placeholder()!).width).toBe(room.width)
        await commands.pointer('[aria-label="Others"]', 150, 20, 'up')
        await waitFor(() => expect(sandra).not.toHaveAttribute('data-dragging'))
      },
    )

    it.each(['vertical', 'horizontal'] as const)(
      'draws the drop indicator of React Aria’s own useDragAndDrop as a 2dp line of primary in the gap where the drop would land, the dragged item left in its place and the others in theirs, in a %s list',
      async (orientation) => {
        render(<Plain orientation={orientation} />)
        const grid = screen.getByRole('grid')
        const items = screen.getAllByRole('row')
        const [ali, jennifer] = items as [HTMLElement, HTMLElement]
        const places = () => items.map((item) => [rect(item).left, rect(item).top])
        const before = places()
        // The second item's far half, from the list's corner: a drop after it.
        const far = {
          x: rect(jennifer).left - rect(grid).left + rect(jennifer).width * 0.75,
          y: rect(jennifer).top - rect(grid).top + rect(jennifer).height * 0.75,
        }
        const setDragImage = vi.spyOn(DataTransfer.prototype, 'setDragImage')
        onTestFinished(() => setDragImage.mockRestore())
        onTestFinished(() => commands.releasePress())
        await pointAt(40, 28, 'down')
        await pointAt(46, 28)
        await pointAt(far.x, far.y)
        await waitFor(() => expect(ali).toHaveAttribute('data-dragging'))
        const indicator = () =>
          document.querySelector<HTMLElement>('[role="row"][data-drop-target]')
        await waitFor(() => expect(indicator()).not.toBeNull())
        await settle()
        const line = getComputedStyle(indicator()!)
        expect([line.outlineStyle, line.outlineWidth, line.outlineColor, line.opacity]).toEqual([
          'solid',
          '1px',
          role('primary', ali),
          '1',
        ])
        // No thicker than nothing, its outline a line of 2dp, in the middle of the 2dp gap after the second item.
        const { left, top, width, height } = rect(indicator()!)
        expect(orientation === 'vertical' ? [top, height, width] : [left, width, height]).toEqual(
          orientation === 'vertical'
            ? [rect(jennifer).bottom + 1, 0, rect(jennifer).width]
            : [rect(jennifer).right + 1, 0, rect(jennifer).height],
        )
        expect(places()).toEqual(before)
        expect(rect(ali).height).toBe(56)
        expect(getComputedStyle(ali).backgroundColor).toBe(role('tertiary-container', ali))
        expect(placeholder()).toBeNull()
        expect(setDragImage).not.toHaveBeenCalled()
        await pointAt(far.x, far.y, 'up')
        await waitFor(() =>
          expect(names()).toEqual(['Jennifer Lopez', 'Ali Connors', 'Sandra Adams']),
        )
      },
    )

    it('leaves the keyboard its ring when a key is pressed right after a pointer’s drop', async () => {
      render(
        <>
          <Reorderable />
          <Modality />
        </>,
      )
      const grid = screen.getByRole('grid')
      await drag(150, 100)
      await settle()
      // A key as the drop lands, and what is in use 80ms on, React Aria's own 50ms wait over.
      let modality: string | null | undefined
      grid.addEventListener('drop', () => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
        setTimeout(() => (modality = screen.getByRole('status').textContent), 80)
      })
      await pointAt(150, 100, 'up')
      await waitFor(() => expect(modality).toBeDefined())
      expect(modality).toBe('keyboard')
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('moves the items to their new places at once', async () => {
        render(<Reorderable />)
        const jennifer = row(/Jennifer Lopez/)
        await drag()
        const slides = movesOf(jennifer)
        await pointAt(150, 100)
        await waitFor(() => expect(placeholder()?.previousElementSibling).toBe(jennifer))
        expect(slides().map((slide) => slide.duration)).toEqual([0.01])
        expect(getComputedStyle(placeholder()!).transitionDuration).toBe('1e-05s')
        await pointAt(150, 100, 'up')
      })
    })
  })

  describe('targets', () => {
    it('is a 48dp target at least, and its icon buttons are each one of their own', () => {
      render(
        <Scheme>
          <List aria-label="Contacts" className="w-80">
            <ListItem id="ali" textValue="Ali Connors" onAction={() => {}}>
              <Text slot="label">Ali Connors</Text>
              <IconButton slot="trailing" aria-label="More options">
                <Icon name="more_vert" />
              </IconButton>
            </ListItem>
          </List>
        </Scheme>,
      )
      expectHitArea(row('Ali Connors'))
      expectHitArea(screen.getByRole('button', { name: 'More options' }))
    })

    it('is a 48dp target of its own at the highest density, each of the items one above the other', () => {
      render(
        <Scheme density="-3">
          <List aria-label="Contacts" className="w-80" selectionMode="single">
            <ListItem id="ali">Ali Connors</ListItem>
            <ListItem id="jennifer">Jennifer Lopez</ListItem>
            <ListItem id="sandra">Sandra Adams</ListItem>
          </List>
        </Scheme>,
      )
      for (const item of screen.getAllByRole('row')) {
        expect(rect(item).height).toBe(48)
        expectHitArea(item)
      }
    })

    it('presses an icon button in it on its own, not the item', async () => {
      const presses: string[] = []
      render(
        <Scheme>
          <List aria-label="Contacts" className="w-80" onAction={() => presses.push('item')}>
            <ListItem id="ali" textValue="Ali Connors">
              <Text slot="label">Ali Connors</Text>
              <IconButton
                slot="trailing"
                aria-label="More options"
                onPress={() => presses.push('button')}
              >
                <Icon name="more_vert" />
              </IconButton>
            </ListItem>
          </List>
        </Scheme>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'More options' }))
      expect(presses).toEqual(['button'])
      await userEvent.click(screen.getByText('Ali Connors'))
      expect(presses).toEqual(['button', 'item'])
    })

    it('gives a selection checkbox its own target in the leading or trailing slot, which toggles the item', async () => {
      render(
        <Scheme>
          <List aria-label="Contacts" className="w-80" selectionMode="multiple">
            <ListItem id="ali" textValue="Ali Connors">
              <Checkbox slot="selection" />
              <Text slot="label">Ali Connors</Text>
            </ListItem>
            <ListItem id="jennifer" textValue="Jennifer Lopez">
              <Text slot="label">Jennifer Lopez</Text>
              <Checkbox slot="trailing" />
            </ListItem>
          </List>
        </Scheme>,
      )
      const [leading, trailing] = screen.getAllByRole('checkbox') as [HTMLElement, HTMLElement]
      expect(rect(leading).left - rect(row(/Ali Connors/)).left).toBeGreaterThanOrEqual(16)
      expect(rect(row(/Jennifer Lopez/)).right - rect(trailing).right).toBeGreaterThanOrEqual(16)
      await userEvent.click(trailing.closest('label')!)
      await waitFor(() => expect(row(/Jennifer Lopez/)).toHaveAttribute('aria-selected', 'true'))
      expect(trailing).toBeChecked()
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('draws a segmented item with a border, a selected item in the highlight fill and a disabled one in gray text', () => {
      render(
        <Scheme>
          <Contacts
            variant="segmented"
            defaultSelectedKeys={['jennifer']}
            disabledKeys={['sandra']}
          />
        </Scheme>,
      )
      const ali = row(/Ali Connors/)
      expect(getComputedStyle(ali).borderTopWidth).toBe('1px')
      expect(getComputedStyle(ali).borderTopStyle).toBe('solid')
      const jennifer = row(/Jennifer Lopez/)
      expect(getComputedStyle(jennifer).backgroundColor).toBe(computedColor('Highlight', jennifer))
      expect(getComputedStyle(jennifer).color).toBe(computedColor('HighlightText', jennifer))
      const sandra = row(/Sandra Adams/)
      expect(getComputedStyle(sandra).color).toBe(computedColor('GrayText', sandra))
    })
  })

  describe('motion', () => {
    it('morphs its corners and shadow on the fast spatial spring and its colors on the default effects one, and is let down among its neighbours only when that spring is over', () => {
      render(
        <Scheme>
          <Contacts />
        </Scheme>,
      )
      const style = getComputedStyle(row(/Ali Connors/))
      expect(style.transitionProperty).toBe(
        'border-radius, background-color, color, box-shadow, --list-item-lift',
      )
      expect(style.transitionDuration.split(', ')).toEqual([
        springDuration('fast-spatial'),
        springDuration('default-effects'),
        springDuration('default-effects'),
        springDuration('fast-spatial'),
        '0s',
      ])
      expect(style.transitionTimingFunction.split(/, (?=linear|cubic)/)).toEqual([
        springEasing('fast-spatial'),
        springEasing('default-effects'),
        springEasing('default-effects'),
        springEasing('fast-spatial'),
        'linear',
      ])
      expect(style.transitionDelay.split(', ')).toEqual([
        '0s',
        '0s',
        '0s',
        '0s',
        springDuration('fast-spatial'),
      ])
    })
  })
})

/** The trailing text of a two-line item. */
function trailingOf(item: HTMLElement) {
  return within(item).getByText('100+')
}
