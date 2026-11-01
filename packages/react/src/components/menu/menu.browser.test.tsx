import { act, render, screen, waitFor, within } from '@testing-library/react'
import { useState } from 'react'
import {
  Header,
  I18nProvider,
  Keyboard,
  MenuSection,
  MenuTrigger,
  Separator,
  SubmenuTrigger,
  Text,
} from 'react-aria-components'
import { userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, onTestFinished } from 'vitest'
import {
  catchTransitions,
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  expectHitArea,
  press,
  pressAt,
  pressEscape,
  pressKey,
  rgba,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
  whilePressed,
} from '../../test-browser'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  Menu,
  MenuItem,
  MenuPopover,
  type MenuItemProps,
  type MenuPopoverProps,
  type MenuProps,
} from '.'

/*
 * Everything that needs a real browser and the real stylesheet: colors, size,
 * shape, contrast, placement, keyboard use, the focus outline, motion and
 * forced colors. Behavior jsdom can check without a stylesheet - attributes,
 * accessible names, DOM structure, events - is in menu.test.tsx instead.
 */

const colors = ['standard', 'vibrant'] as const

/*
 * React Aria portals the panel to the body, outside any wrapper, so a scheme is put on the
 * document itself here, and the page's surface painted on the body, where Scheme would do
 * both for what is inside it.
 */
function themeDocument(theme: 'light' | 'dark', contrast: 'standard' | 'medium' | 'high') {
  document.documentElement.dataset.theme = theme
  if (contrast !== 'standard') document.documentElement.dataset.contrast = contrast
}

beforeEach(() => {
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(() => {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.contrast
  document.documentElement.classList.remove('density-2')
  document.documentElement.removeAttribute('dir')
  document.body.style.background = ''
})

/** A padded page, away from the window's edges, for a trigger to open from. */
function Page({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: 64, display: 'flex', gap: 96, ...style }}>{children}</div>
}

/** A menu opened from an icon button named "More", with Preview, Share and Remove items; its color and selection go on its list, the rest on its panel. */
function Overflow({
  label = 'More',
  color,
  selectionMode,
  defaultSelectedKeys,
  content,
  ...panel
}: Pick<MenuProps, 'color' | 'selectionMode' | 'defaultSelectedKeys'> &
  Partial<MenuPopoverProps> & {
    label?: string
    content?: React.ReactNode
  }) {
  return (
    <MenuTrigger>
      <IconButton aria-label={label}>
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover {...panel}>
        <Menu color={color} selectionMode={selectionMode} defaultSelectedKeys={defaultSelectedKeys}>
          {content ?? (
            <>
              <MenuItem textValue="Preview">
                <Icon slot="leading" name="visibility" />
                Preview
              </MenuItem>
              <MenuItem textValue="Share">
                <Icon slot="leading" name="person_add" />
                <Text slot="label">Share</Text>
                <Keyboard>⌘S</Keyboard>
              </MenuItem>
              <MenuItem>Remove</MenuItem>
            </>
          )}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}

/** The trigger, which the menu hides from assistive technology with the rest of the page while it is open. */
const trigger = (name = 'More') => screen.getByRole('button', { name, hidden: true })

/** The rendered menu item with this accessible name, in any role: only an open menu's are exposed. */
const menuItem = (name: string | RegExp) =>
  screen.queryByRole('menuitem', { name }) ??
  screen.queryByRole('menuitemradio', { name }) ??
  screen.getByRole('menuitemcheckbox', { name })

/** The open list of the menu named `name`, React Aria's Menu, which scrolls. */
const list = (name = 'More') => screen.getByRole('menu', { name })

/** The panel around that list, React Aria's Popover: the surface, its shape, place and motion. */
const panel = (name = 'More') => list(name).parentElement!

/** Opens the menu named `label` from its trigger, as a click does, and lets it finish opening. */
async function open(label = 'More') {
  await userEvent.click(trigger(label))
  await settle()
}

/** Contrast of an element's text against the nearest fill behind it: its own, its item's or the panel's. */
function contrastIn(el: Element) {
  let behind: Element | null = el
  while (behind && rgba(getComputedStyle(behind).backgroundColor)[3] === 0) {
    behind = behind.parentElement
  }
  return contrastRatio(getComputedStyle(el).color, getComputedStyle(behind!).backgroundColor)
}

/** This many one-line items, 48px a row: ten make a panel 484px tall, with its 4px of padding. */
const rows = (count: number, props: (i: number) => Partial<MenuItemProps> = () => ({})) =>
  Array.from({ length: count }, (_, i) => (
    <MenuItem key={i} id={i} {...props(i)}>{`Item ${i}`}</MenuItem>
  ))

/** The Share item, named by its label and described by its keyboard command. */
const share = () => menuItem('Share')

/** The checkmark an item draws while it is selected, its one stroke, and the box it is in. */
const checkOf = (item: Element) => item.querySelector<SVGElement>('svg')!
const strokeOf = (item: Element) => checkOf(item).querySelector('path')!
const leadingOf = (item: Element) => checkOf(item).parentElement!

/** An item's text as it is drawn, written straight in the item with no element of its own: a range over it, to measure. */
function labelOf(text: string) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue !== text) continue
    const range = document.createRange()
    range.selectNodeContents(walker.currentNode)
    return range
  }
  throw new Error(`No text "${text}" is drawn`)
}

/** Whether the item is in the visible part of the list it scrolls in. */
function inView(item: Element, scroller: Element) {
  const [box, row] = [scroller.getBoundingClientRect(), item.getBoundingClientRect()]
  return row.top >= box.top - 0.5 && row.bottom <= box.bottom + 0.5
}

describe('Menu accessibility in a browser', () => {
  describe('contrast', () => {
    // WCAG 1.4.3: an item's label is 14px text, needing 4.5:1, as are a heading and the
    // supporting text; 1.4.11: an icon needs 3:1.
    it.each(schemes)(
      'keeps every text of a standard and a vibrant menu at 4.5:1 or more and icons at 3:1, %s scheme, %s contrast',
      async (theme, contrast) => {
        themeDocument(theme, contrast)
        render(
          <Page>
            {colors.map((color) => (
              <MenuTrigger key={color}>
                <IconButton aria-label={color}>
                  <Icon name="more_vert" />
                </IconButton>
                <MenuPopover>
                  <Menu color={color} selectionMode="single" defaultSelectedKeys={['selected']}>
                    <MenuSection selectionMode="none">
                      <Header>Edit</Header>
                      <MenuItem textValue="Copy">
                        <Icon slot="leading" name="content_copy" />
                        <Text slot="label">Copy</Text>
                        <Text slot="description">To the clipboard</Text>
                        <Keyboard>⌘C</Keyboard>
                      </MenuItem>
                    </MenuSection>
                    <MenuItem id="selected">Selected</MenuItem>
                  </Menu>
                </MenuPopover>
              </MenuTrigger>
            ))}
          </Page>,
        )
        // One menu is open at a time, and a click outside one only closes it.
        for (const color of colors) {
          await open(color)
          expect(contrastIn(screen.getByText('Copy')), `${color} label`).toBeGreaterThanOrEqual(4.5)
          expect(
            contrastIn(screen.getByText('To the clipboard')),
            `${color} supporting`,
          ).toBeGreaterThanOrEqual(4.5)
          expect(contrastIn(screen.getByText('⌘C')), `${color} keyboard`).toBeGreaterThanOrEqual(
            4.5,
          )
          expect(contrastIn(screen.getByText('Edit')), `${color} heading`).toBeGreaterThanOrEqual(
            4.5,
          )
          expect(
            contrastIn(screen.getByText('content_copy')),
            `${color} icon`,
          ).toBeGreaterThanOrEqual(3)
          expect(contrastIn(menuItem('Selected')), `${color} selected`).toBeGreaterThanOrEqual(4.5)
          expect(
            contrastIn(checkOf(menuItem('Selected'))),
            `${color} checkmark`,
          ).toBeGreaterThanOrEqual(3)
          await userEvent.keyboard('{Escape}')
          await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
        }
      },
    )
  })

  describe('colors', () => {
    it.each([
      [
        'standard',
        '--md-sys-color-surface-container-low',
        '--md-sys-color-on-surface',
        '--md-sys-color-on-surface-variant',
      ],
      [
        'vibrant',
        '--md-sys-color-tertiary-container',
        '--md-sys-color-on-tertiary-container',
        '--md-sys-color-on-tertiary-container',
      ],
    ] as const)(
      'fills a %s menu’s list, which fills its panel, with its container color, and its items with the label and icon colors',
      async (color, bg, label, icon) => {
        render(
          <Page>
            <Overflow
              color={color}
              content={
                <MenuItem textValue="Preview">
                  <Icon slot="leading" name="visibility" />
                  <Text slot="label">Preview</Text>
                  <Text slot="description">In a new tab</Text>
                  <Keyboard>⌘P</Keyboard>
                  <span slot="trailing">New</span>
                  <Icon slot="trailing" name="open_in_new" />
                </MenuItem>
              }
            />
          </Page>,
        )
        await open()
        const item = screen.getByRole('menuitem')
        expect(getComputedStyle(list()).backgroundColor).toBe(computedColor(`var(${bg})`, panel()))
        expect(getComputedStyle(list()).color).toBe(computedColor(`var(${label})`, panel()))
        expect(getComputedStyle(panel()).backgroundColor).toBe('rgba(0, 0, 0, 0)')
        expect(getComputedStyle(item).backgroundColor).toBe('rgba(0, 0, 0, 0)')
        expect(getComputedStyle(item).color).toBe(computedColor(`var(${label})`, panel()))
        expect(getComputedStyle(screen.getByText('Preview')).color).toBe(
          getComputedStyle(item).color,
        )
        // Its icons, on either side of the label, its description and its keyboard command; what
        // else is written in it, such as a badge, is the caller's and takes the item's color.
        for (const part of ['visibility', 'open_in_new', 'In a new tab', '⌘P'])
          expect(getComputedStyle(screen.getByText(part)).color, part).toBe(
            computedColor(`var(${icon})`, panel()),
          )
        expect(getComputedStyle(screen.getByText('New')).color).toBe(getComputedStyle(item).color)
      },
    )

    it.each([
      ['standard', '--md-sys-color-tertiary-container', '--md-sys-color-on-tertiary-container'],
      ['vibrant', '--md-sys-color-tertiary', '--md-sys-color-on-tertiary'],
    ] as const)(
      'fills a selected item of a %s menu with its selected colors, its checkmark and icon included',
      async (color, bg, fg) => {
        render(
          <Page>
            <Overflow
              color={color}
              selectionMode="single"
              defaultSelectedKeys={['name']}
              content={
                <MenuItem id="name" textValue="Name">
                  Name
                  <Icon slot="trailing" name="sort_by_alpha" />
                </MenuItem>
              }
            />
          </Page>,
        )
        await open()
        expect(getComputedStyle(menuItem('Name')).backgroundColor).toBe(
          computedColor(`var(${bg})`, panel()),
        )
        expect(getComputedStyle(menuItem('Name')).color).toBe(computedColor(`var(${fg})`, panel()))
        expect(getComputedStyle(strokeOf(menuItem('Name'))).stroke).toBe(
          computedColor(`var(${fg})`, panel()),
        )
        expect(getComputedStyle(screen.getByText('sort_by_alpha')).color).toBe(
          computedColor(`var(${fg})`, panel()),
        )
      },
    )

    it.each([
      ['standard', '--md-sys-color-on-surface-variant'],
      ['vibrant', '--md-sys-color-on-tertiary-container'],
    ] as const)(
      'colors the Header of a section of a %s menu with its header color',
      async (color, header) => {
        render(
          <Page>
            <Overflow
              color={color}
              content={
                <MenuSection>
                  <Header>Edit</Header>
                  <MenuItem>Copy</MenuItem>
                </MenuSection>
              }
            />
          </Page>,
        )
        await open()
        expect(getComputedStyle(screen.getByText('Edit')).color).toBe(
          computedColor(`var(${header})`, panel()),
        )
      },
    )

    it('keeps the checkmark of an item that is not selected undrawn, in the item’s own color', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['name']}
            content={
              <>
                <MenuItem id="name">Name</MenuItem>
                <MenuItem id="date">Date</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      const [drawn, undrawn] = [menuItem('Name'), menuItem('Date')].map(strokeOf)
      expect(getComputedStyle(drawn!).opacity).toBe('1')
      expect(parseFloat(getComputedStyle(drawn!).strokeDashoffset)).toBe(0)
      expect(getComputedStyle(undrawn!).opacity).toBe('0')
      expect(parseFloat(getComputedStyle(undrawn!).strokeDashoffset)).toBe(1)
      expect(getComputedStyle(undrawn!).stroke).toBe(getComputedStyle(menuItem('Date')).color)
    })

    it('greys out a disabled item at 38%, which keeps the default cursor', async () => {
      render(
        <Page>
          <Overflow
            content={
              <>
                <MenuItem isDisabled textValue="Redo">
                  <Icon slot="leading" name="redo" />
                  Redo
                </MenuItem>
                <MenuItem>Undo</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      const disabled = getComputedStyle(menuItem('Redo'))
      expect(disabled.color).toBe(
        computedStyleOf('text-on-surface/disabled-content', (s) => s.color),
      )
      expect(getComputedStyle(screen.getByText('redo')).color).toBe(disabled.color)
      expect(disabled.cursor).toBe('default')
      expect(getComputedStyle(menuItem('Undo')).cursor).toBe('pointer')
    })

    it('turns a vibrant item’s icons tertiary while it is hovered, and its text not', async () => {
      render(
        <Page>
          <Overflow color="vibrant" />
        </Page>,
      )
      await open()
      const tertiary = computedColor('var(--md-sys-color-tertiary)', panel())
      const onContainer = computedColor('var(--md-sys-color-on-tertiary-container)', panel())
      expect(getComputedStyle(screen.getByText('visibility')).color).toBe(onContainer)
      await userEvent.hover(menuItem('Preview'))
      expect(getComputedStyle(screen.getByText('visibility')).color).toBe(tertiary)
      expect(getComputedStyle(menuItem('Preview')).color).toBe(onContainer)
      await userEvent.hover(share())
      expect(getComputedStyle(screen.getByText('visibility')).color).toBe(onContainer)
      expect(getComputedStyle(screen.getByText('⌘S')).color).toBe(onContainer)
    })

    it('shows the hover state layer on the hovered item alone, which the pointer focuses, and the focus layer on the item the keyboard is on', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const layer = (el: Element) => el.querySelector<HTMLElement>('.state-layer')!
      const [hover, focus] = [
        computedStyleOf('opacity-state-hover', (s) => s.opacity),
        computedStyleOf('opacity-state-focus', (s) => s.opacity),
      ]
      await userEvent.hover(menuItem('Preview'))
      await settle()
      expect(document.activeElement).toBe(menuItem('Preview'))
      expect(getComputedStyle(layer(menuItem('Preview'))).opacity).toBe(hover)
      await userEvent.keyboard('{ArrowDown}')
      await settle()
      expect(getComputedStyle(layer(share())).opacity).toBe(focus)
      expect(getComputedStyle(layer(menuItem('Preview'))).opacity).toBe(hover)
    })

    it('keeps the pressed state layer on the trigger while the menu is open, and drops it once closed', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      const layer = trigger().querySelector<HTMLElement>('.state-layer')!
      await open()
      expect(getComputedStyle(layer).opacity).toBe(
        computedStyleOf('opacity-state-pressed', (s) => s.opacity),
      )
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(document.activeElement).toBe(trigger()))
      await userEvent.unhover(trigger())
      await settle()
      // The keyboard closed it, so the trigger has the focus layer, not the pressed one.
      expect(getComputedStyle(layer).opacity).toBe(
        computedStyleOf('opacity-state-focus', (s) => s.opacity),
      )
    })
  })

  describe('sizing', () => {
    it('gives every item 44px of a 48px row, 36px of 40px at density -2, and a 20px icon 16px in from the panel edge with 8px to the text', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const item = menuItem('Preview').getBoundingClientRect()
      const icon = screen.getByText('visibility').getBoundingClientRect()
      const label = labelOf('Preview').getBoundingClientRect()
      const box = panel().getBoundingClientRect()
      expect(item.height).toBe(44)
      expect(menuItem('Remove').getBoundingClientRect().height).toBe(44)
      // The row is the item and the 2px above and below it.
      expect(share().getBoundingClientRect().top - item.top).toBe(48)
      expect([icon.width, icon.height]).toEqual([20, 20])
      expect(icon.left - box.left).toBe(16)
      expect(label.left - icon.right).toBe(8)
      expect(
        labelOf('Remove').getBoundingClientRect().left -
          menuItem('Remove').getBoundingClientRect().left,
      ).toBe(12)
      expect(
        share().getBoundingClientRect().right -
          screen.getByText('⌘S').getBoundingClientRect().right,
      ).toBe(12)
      document.documentElement.classList.add('density-2')
      expect(menuItem('Preview').getBoundingClientRect().height).toBe(36)
      expect(
        share().getBoundingClientRect().top - menuItem('Preview').getBoundingClientRect().top,
      ).toBe(40)
    })

    it('draws a selected item’s 20px checkmark 12px in, in the middle of the item, with 8px to the text, and makes no room for it in an item that is not selected', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['name']}
            content={
              <>
                <MenuItem id="name">Name</MenuItem>
                <MenuItem id="date">Date</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      const item = menuItem('Name').getBoundingClientRect()
      const check = checkOf(menuItem('Name')).getBoundingClientRect()
      const label = labelOf('Name').getBoundingClientRect()
      expect([check.width, check.height]).toEqual([20, 20])
      expect(check.left - item.left).toBe(12)
      expect(check.top - item.top).toBe(12)
      expect(label.left - check.right).toBe(8)
      const other = menuItem('Date')
      expect(leadingOf(other).getBoundingClientRect().width).toBe(0)
      expect(
        labelOf('Date').getBoundingClientRect().left - other.getBoundingClientRect().left,
      ).toBe(12)
      // Shut, the box shows nothing of the checkmark it holds.
      expect(getComputedStyle(leadingOf(other)).overflow).toBe('clip')
    })

    it('draws the checkmark of a selected item over its own leading icon, which gives way to it, at the icon’s size', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['mobile']}
            content={
              <>
                <MenuItem id="mobile" textValue="Mobile">
                  <Icon slot="leading" name="call" />
                  Mobile
                </MenuItem>
                <MenuItem id="home" textValue="Home">
                  <Icon slot="leading" name="home" />
                  Home
                </MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      const place = (el: Element) =>
        (({ left, top, width, height }) => ({ left, top, width, height }))(
          el.getBoundingClientRect(),
        )
      expect(place(checkOf(menuItem('Mobile')))).toEqual(place(screen.getByText('call')))
      expect(getComputedStyle(screen.getByText('call')).opacity).toBe('0')
      expect(getComputedStyle(strokeOf(menuItem('Mobile'))).opacity).toBe('1')
      expect(place(checkOf(menuItem('Home')))).toEqual(place(screen.getByText('home')))
      expect(getComputedStyle(screen.getByText('home')).opacity).toBe('1')
      expect(getComputedStyle(strokeOf(menuItem('Home'))).opacity).toBe('0')
      // The text of both starts after the same 12px, 20px of icon and 8px.
      for (const name of ['Mobile', 'Home'])
        expect(
          labelOf(name).getBoundingClientRect().left - menuItem(name).getBoundingClientRect().left,
        ).toBe(40)
    })

    it('opens the checkmark’s box before the label of a selected item whose icon is written after it, and leaves that icon at the item’s end', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['mobile']}
            content={
              <MenuItem id="mobile" textValue="Mobile">
                Mobile
                <Icon slot="trailing" name="call" />
              </MenuItem>
            }
          />
        </Page>,
      )
      await open()
      const item = menuItem('Mobile')
      const check = checkOf(item).getBoundingClientRect()
      const label = labelOf('Mobile').getBoundingClientRect()
      const icon = screen.getByText('call')
      expect(check.left - item.getBoundingClientRect().left).toBe(12)
      expect(label.left - check.right).toBe(8)
      // Drawn after the label, 12px in from the item's end.
      expect(item.getBoundingClientRect().right - icon.getBoundingClientRect().right).toBe(12)
      expect(getComputedStyle(icon).opacity).toBe('1')
      expect(getComputedStyle(strokeOf(item)).opacity).toBe('1')
    })

    it('makes an item with a description 60px tall, its two lines 12px from its top and bottom', async () => {
      render(
        <Page>
          <Overflow
            content={
              <>
                <MenuItem>Preview</MenuItem>
                <MenuItem textValue="Copy">
                  <Text slot="label">Copy</Text>
                  <Text slot="description">Copies the selection</Text>
                </MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      const item = menuItem('Copy').getBoundingClientRect()
      const label = screen.getByText('Copy').getBoundingClientRect()
      const supporting = screen.getByText('Copies the selection').getBoundingClientRect()
      expect(item.height).toBe(60)
      expect(label.top - item.top).toBe(12)
      expect(item.bottom - supporting.bottom).toBe(12)
      expect(item.top - menuItem('Preview').getBoundingClientRect().bottom).toBe(4)
    })

    it('lays out React Aria’s parts as its starter does: the description under the label, and what follows them at the end, 8px apart, in the middle of both lines', async () => {
      render(
        <Page>
          <Overflow
            content={
              <MenuItem textValue="Copy">
                <Icon slot="leading" name="content_copy" />
                <Text slot="label">Copy</Text>
                <Text slot="description">Copies the selection</Text>
                <Keyboard>⌘C</Keyboard>
                <Icon slot="trailing" name="open_in_new" />
              </MenuItem>
            }
          />
        </Page>,
      )
      await open()
      const item = menuItem('Copy').getBoundingClientRect()
      const [icon, label, description, keyboard, trailing] = [
        'content_copy',
        'Copy',
        'Copies the selection',
        '⌘C',
        'open_in_new',
      ].map((text) => screen.getByText(text).getBoundingClientRect())
      expect(icon!.left - item.left).toBe(12)
      expect(label!.left - icon!.right).toBe(8)
      expect(description!.left).toBe(label!.left)
      expect(description!.top).toBe(label!.bottom)
      expect(item.right - trailing!.right).toBe(12)
      expect(trailing!.left - keyboard!.right).toBe(8)
      expect(keyboard!.left - label!.right).toBeGreaterThanOrEqual(8)
      const middle = item.top + item.height / 2
      for (const part of [icon!, keyboard!, trailing!])
        expect(part.top + part.height / 2).toBeCloseTo(middle, 0)
    })

    it('draws a keyboard command in the item’s own type, not the browser’s monospace, and the description in body-small', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const label = getComputedStyle(screen.getByText('Share'))
      const keyboard = getComputedStyle(screen.getByText('⌘S'))
      expect(keyboard.fontFamily).toBe(label.fontFamily)
      expect([keyboard.fontSize, keyboard.lineHeight, keyboard.fontWeight]).toEqual([
        label.fontSize,
        label.lineHeight,
        label.fontWeight,
      ])
      expect(label.fontSize).toBe(computedStyleOf('text-label-lg', (s) => s.fontSize))
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    })

    it('puts what else is written before the label in the checkmark’s place, the checkmark drawn over it in its middle', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['red']}
            content={
              <>
                <MenuItem id="red" textValue="Red">
                  <span slot="leading" data-testid="red" className="size-6 rounded-full bg-error" />
                  Red
                </MenuItem>
                <MenuItem id="blue" textValue="Blue">
                  <span
                    slot="leading"
                    data-testid="blue"
                    className="size-6 rounded-full bg-primary"
                  />
                  Blue
                </MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      for (const name of ['Red', 'Blue']) {
        const item = menuItem(name).getBoundingClientRect()
        const swatch = screen.getByTestId(name.toLowerCase()).getBoundingClientRect()
        expect(swatch.left - item.left, name).toBe(12)
        expect(labelOf(name).getBoundingClientRect().left - swatch.right, name).toBe(8)
      }
      const swatch = screen.getByTestId('red').getBoundingClientRect()
      const check = checkOf(menuItem('Red')).getBoundingClientRect()
      expect(check.left + check.width / 2).toBeCloseTo(swatch.left + swatch.width / 2, 1)
      expect(check.top + check.height / 2).toBeCloseTo(swatch.top + swatch.height / 2, 1)
      expect(getComputedStyle(screen.getByTestId('red')).opacity).toBe('0')
      expect(getComputedStyle(screen.getByTestId('blue')).opacity).toBe('1')
    })

    it('insets the items 4px from the panel’s sides, 4px from its top and bottom, and 4px apart', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      const first = menuItem('Preview').getBoundingClientRect()
      const last = menuItem('Remove').getBoundingClientRect()
      expect(first.left - box.left).toBe(4)
      expect(box.right - first.right).toBe(4)
      // The list's 2px and the item's own 2px.
      expect(first.top - box.top).toBe(4)
      expect(box.bottom - last.bottom).toBe(4)
      expect(share().getBoundingClientRect().top - first.bottom).toBe(4)
      // The list fills the panel.
      expect(list().getBoundingClientRect().toJSON()).toEqual(box.toJSON())
    })

    it('is at least 112px wide, and at most 280px, wrapping a longer label', async () => {
      render(
        <Page>
          <Overflow label="Short" content={<MenuItem>Hi</MenuItem>} />
          <Overflow
            label="Long"
            content={
              <MenuItem>
                A menu item whose label runs on far past the width a menu may have
              </MenuItem>
            }
          />
        </Page>,
      )
      await open('Short')
      expect(panel('Short').getBoundingClientRect().width).toBe(112)
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
      await open('Long')
      expect(panel('Long').getBoundingClientRect().width).toBe(280)
      expect(screen.getByRole('menuitem').getBoundingClientRect().height).toBeGreaterThan(48)
    })

    it('gives a Header a 32px row in the items’ type and a Separator an 8px row with its line across its middle, 12px in from the panel edges', async () => {
      render(
        <Page>
          <Overflow
            content={
              <>
                <MenuSection>
                  <Header>Edit</Header>
                  <MenuItem>Copy</MenuItem>
                </MenuSection>
                <Separator />
                <MenuItem>Remove</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      const heading = screen.getByText('Edit').getBoundingClientRect()
      const separator = screen.getByRole('separator')
      const row = separator.getBoundingClientRect()
      const line = getComputedStyle(separator, '::before')
      const text = document.createRange()
      text.selectNodeContents(screen.getByText('Edit'))
      expect(heading.height).toBe(32)
      expect(heading.left - box.left).toBe(4)
      // In an item's own type, label-large in the plain typeface.
      const header = getComputedStyle(screen.getByText('Edit'))
      const item = getComputedStyle(menuItem('Remove'))
      expect([header.fontFamily, header.fontSize, header.lineHeight]).toEqual([
        item.fontFamily,
        item.fontSize,
        item.lineHeight,
      ])
      expect(text.getBoundingClientRect().left - heading.left).toBe(12)
      expect(row.height).toBe(8)
      expect(line.borderTopWidth).toBe('1px')
      expect(line.borderTopColor).toBe(
        computedColor('var(--md-sys-color-outline-variant)', panel()),
      )
      expect(line.top).toBe('4px')
      expect([row.left + parseFloat(line.left), row.right - parseFloat(line.right)]).toEqual([
        box.left + 12,
        box.right - 12,
      ])
    })

    // An item is 44px tall, and the 2px above and below it are its to press, and no other's.
    it('has a hit area of at least 48px on every item', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      expectHitArea(menuItem('Preview'))
      expectHitArea(share())
      expectHitArea(menuItem('Remove'))
    })
  })

  describe('shape', () => {
    it('rounds the panel 16px, its first and last items 12px at the panel’s corners, and the rest 4px', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      expect(getComputedStyle(panel()).borderRadius).toBe(computedRadius('rounded-shape-lg'))
      expect(getComputedStyle(list()).borderRadius).toBe(computedRadius('rounded-shape-lg'))
      const first = getComputedStyle(menuItem('Preview'))
      const middle = getComputedStyle(share())
      const last = getComputedStyle(menuItem('Remove'))
      expect([
        first.borderTopLeftRadius,
        first.borderTopRightRadius,
        first.borderBottomLeftRadius,
      ]).toEqual(['12px', '12px', '4px'])
      expect(middle.borderRadius).toBe('4px')
      expect([
        last.borderBottomLeftRadius,
        last.borderBottomRightRadius,
        last.borderTopLeftRadius,
      ]).toEqual(['12px', '12px', '4px'])
    })

    it('rounds a selected item 12px all around, wherever it is', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['name']}
            content={
              <>
                <MenuItem id="date">Date</MenuItem>
                <MenuItem id="name">Name</MenuItem>
                <MenuItem id="size">Size</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      expect(getComputedStyle(menuItem('Name')).borderRadius).toBe('12px')
    })

    it('rounds the first item of the first section like the panel’s own first item', async () => {
      render(
        <Page>
          <Overflow
            content={
              <>
                <MenuSection>
                  <MenuItem>Copy</MenuItem>
                  <MenuItem>Paste</MenuItem>
                </MenuSection>
                <Separator />
                <MenuItem>Remove</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      expect(getComputedStyle(menuItem('Copy')).borderTopLeftRadius).toBe('12px')
      expect(getComputedStyle(menuItem('Paste')).borderTopLeftRadius).toBe('4px')
      expect(getComputedStyle(menuItem('Remove')).borderBottomLeftRadius).toBe('12px')
    })

    it.each([
      [
        'its own',
        <>
          <MenuItem className="rounded-none">First</MenuItem>
          <MenuItem className="rounded-none">Last</MenuItem>
        </>,
      ],
      [
        'a section’s',
        <>
          <MenuSection>
            <MenuItem className="rounded-none">First</MenuItem>
            <MenuItem>Middle</MenuItem>
          </MenuSection>
          <MenuSection>
            <MenuItem className="rounded-none">Last</MenuItem>
          </MenuSection>
        </>,
      ],
    ])('keeps a radius class given to the first and last items, %s', async (_, content) => {
      render(
        <Page>
          <Overflow content={content} />
        </Page>,
      )
      await open()
      expect(getComputedStyle(menuItem('First')).borderRadius).toBe('0px')
      expect(getComputedStyle(menuItem('Last')).borderRadius).toBe('0px')
    })

    it('keeps a radius class given to a selected item', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['name']}
            content={
              <>
                <MenuItem id="date">Date</MenuItem>
                <MenuItem id="name" className="rounded-none">
                  Name
                </MenuItem>
                <MenuItem id="size">Size</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      expect(getComputedStyle(menuItem('Name')).borderRadius).toBe('0px')
    })
  })

  describe('placement', () => {
    it('opens below the trigger, aligned to its start, with no gap', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      const at = trigger().getBoundingClientRect()
      expect(panel()).toHaveAttribute('data-placement', 'bottom')
      expect(box.top).toBeCloseTo(at.bottom, 0)
      expect(box.left).toBeCloseTo(at.left, 0)
      // It grows out of its top edge.
      const [, originY] = getComputedStyle(panel()).transformOrigin.split(' ').map(parseFloat)
      expect(originY).toBe(0)
    })

    it('opens aligned to the trigger’s end given placement="bottom end"', async () => {
      render(
        // Far enough from the window's start edge that the panel, hanging back from the
        // trigger's end, is not pushed back into view.
        <Page style={{ paddingInlineStart: 400 }}>
          <Overflow placement="bottom end" />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      const at = trigger().getBoundingClientRect()
      expect(box.top).toBeCloseTo(at.bottom, 0)
      expect(box.right).toBeCloseTo(at.right, 0)
    })

    it('opens above a trigger at the bottom of the window instead, growing upward', async () => {
      render(
        <Page style={{ position: 'fixed', bottom: 0, left: 0, padding: 16 }}>
          <Overflow />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      const at = trigger().getBoundingClientRect()
      expect(panel()).toHaveAttribute('data-placement', 'top')
      expect(box.bottom).toBeCloseTo(at.top, 0)
      const [originX, originY] = getComputedStyle(panel())
        .transformOrigin.split(' ')
        .map(parseFloat)
      expect(originX).toBeCloseTo(box.width / 2, 1)
      expect(originY).toBeCloseTo(box.height, 1)
    })

    it('opens beside the trigger given placement="end top", growing from that side', async () => {
      render(
        <Page>
          <Overflow placement="end top" />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      const at = trigger().getBoundingClientRect()
      expect(panel()).toHaveAttribute('data-placement', 'right')
      expect(box.left).toBeCloseTo(at.right, 0)
      expect(box.top).toBeCloseTo(at.top, 0)
      const [originX] = getComputedStyle(panel()).transformOrigin.split(' ').map(parseFloat)
      expect(originX).toBe(0)
    })

    it('keeps 8px from the window’s bottom, on the side with more room, and scrolls the list when its items do not fit', async () => {
      render(
        <Page>
          <Overflow content={rows(40)} />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      expect(box.top).toBeCloseTo(trigger().getBoundingClientRect().bottom, 0)
      expect(box.bottom).toBeCloseTo(innerHeight - 8, 0)
      expect(list().scrollHeight).toBeGreaterThan(list().clientHeight)
      expect(getComputedStyle(list()).overflowY).toBe('auto')
      expect(list().getBoundingClientRect().height).toBeCloseTo(box.height, 0)
    })

    it.each([
      ['left', { left: 0, top: 64 }],
      ['right', { right: 0, top: 64 }],
    ] as const)('keeps 8px from the window’s %s side', async (side, place) => {
      render(
        <Page style={{ position: 'fixed', padding: 0, ...place }}>
          <Overflow />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      expect(side === 'left' ? box.left : innerWidth - box.right).toBeCloseTo(8, 0)
    })

    it('keeps the containerPadding it is given from the window’s edges instead', async () => {
      render(
        <Page style={{ position: 'fixed', left: 0, top: 64, padding: 0 }}>
          <Overflow containerPadding={24} content={rows(40)} />
        </Page>,
      )
      await open()
      const box = panel().getBoundingClientRect()
      expect(box.left).toBeCloseTo(24, 0)
      expect(box.bottom).toBeCloseTo(innerHeight - 24, 0)
    })

    it('tells the panel the width of its trigger, for a panel to match', async () => {
      render(
        <Page>
          <Overflow className="w-(--trigger-width) min-w-0" content={<MenuItem>Hi</MenuItem>} />
        </Page>,
      )
      await open()
      expect(panel().getBoundingClientRect().width).toBe(trigger().getBoundingClientRect().width)
    })
  })

  describe('a selected item', () => {
    it.each([
      ['a click', () => open()],
      [
        'the keyboard',
        async () => {
          await userEvent.tab()
          await userEvent.keyboard('{Enter}')
          await settle()
        },
      ],
    ])(
      'opens a menu that scrolls on its selected item, focused and in view, from %s',
      async (_, opening) => {
        render(
          <Page>
            <Overflow selectionMode="single" defaultSelectedKeys={[25]} content={rows(40)} />
          </Page>,
        )
        await opening()
        await waitFor(() => expect(document.activeElement).toBe(menuItem('Item 25')))
        await settle()
        expect(list().scrollTop).toBeGreaterThan(0)
        expect(inView(menuItem('Item 25'), list())).toBe(true)
        await userEvent.keyboard('{ArrowDown}')
        expect(document.activeElement).toBe(menuItem('Item 26'))
      },
    )

    it('opens a menu that scrolls with none selected at its top', async () => {
      render(
        <Page>
          <Overflow selectionMode="single" content={rows(40)} />
        </Page>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{Enter}')
      await settle()
      expect(document.activeElement).toBe(menuItem('Item 0'))
      expect(list().scrollTop).toBe(0)
    })

    it('stays where it is scrolled to while it is open, as another item is selected', async () => {
      render(
        <Page>
          <Overflow selectionMode="multiple" defaultSelectedKeys={[25]} content={rows(40)} />
        </Page>,
      )
      await open()
      expect(list().scrollTop).toBeGreaterThan(0)
      list().scrollTop = 96
      await userEvent.click(menuItem('Item 4'))
      await waitFor(() => expect(menuItem('Item 4')).toHaveAttribute('data-selected'))
      await settle()
      expect(list().scrollTop).toBe(96)
    })

    it('fills its icons, as Icon draws a selected container’s', async () => {
      render(
        <MenuTrigger>
          <IconButton aria-label="Sort">
            <Icon name="sort" />
          </IconButton>
          <MenuPopover>
            <Menu selectionMode="multiple" defaultSelectedKeys={['starred']}>
              <MenuItem id="starred" textValue="Starred">
                Starred
                <Icon slot="trailing" name="star" />
              </MenuItem>
              <MenuItem id="labelled" textValue="Labelled">
                <Icon slot="leading" name="label" />
                Labelled
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Sort' }))
      const axes = (name: string) => getComputedStyle(screen.getByText(name)).fontVariationSettings
      expect(axes('star')).toContain('"FILL" 1')
      expect(axes('label')).toContain('"FILL" 0')
      await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Labelled' }))
      await waitFor(() => expect(axes('label')).toContain('"FILL" 1'))
    })
  })

  describe('keyboard', () => {
    it('opens from the trigger with Enter, the first item focused, and moves it with the arrow keys and a typed letter', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(trigger())
      await userEvent.keyboard('{Enter}')
      expect(document.activeElement).toBe(menuItem('Preview'))
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(share())
      await userEvent.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(menuItem('Preview'))
      // React Aria finds an item by its textValue, or by its children when they are text alone.
      await userEvent.keyboard('r')
      expect(document.activeElement).toBe(menuItem('Remove'))
    })

    it('closes with Escape, with the focus back on the trigger', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{Enter}{Escape}')
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      await waitFor(() => expect(document.activeElement).toBe(trigger()))
    })

    it('leaves the focus on the item it is on at Tab and Shift+Tab, as a modal keeps it: the page behind is out of reach', async () => {
      render(
        <Page>
          <Overflow />
          <button>After</button>
        </Page>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{Enter}{ArrowDown}')
      await userEvent.tab()
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      expect(document.activeElement).toBe(share())
      await userEvent.tab({ shift: true })
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      expect(document.activeElement).toBe(share())
    })

    it('puts the focus back on the trigger once an item is clicked', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      await userEvent.click(menuItem('Preview'))
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      await waitFor(() => expect(document.activeElement).toBe(trigger()))
    })

    it('closes on a click outside, which reaches nothing behind the panel', async () => {
      let clicked = 0
      render(
        <Page>
          <Overflow />
          <button onClick={() => (clicked += 1)}>Elsewhere</button>
        </Page>,
      )
      await open()
      // On the button, as a pointer would be: React Aria's underlay, in front of the page, takes it.
      await userEvent.click(screen.getByRole('button', { name: 'Elsewhere', hidden: true }), {
        force: true,
      })
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      expect(clicked).toBe(0)
    })
  })

  describe('focus ring', () => {
    it('is drawn 3px inside the item the keyboard is on, never on the panel or the list', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await userEvent.tab()
      expect(getComputedStyle(trigger()).outlineStyle).toBe('solid')
      await userEvent.keyboard('{Enter}')
      expect(getComputedStyle(panel()).outlineStyle).toBe('none')
      expect(getComputedStyle(list()).outlineStyle).toBe('none')
      expect(getComputedStyle(trigger()).outlineStyle).toBe('none')
      const ring = getComputedStyle(menuItem('Preview'))
      expect(ring.outlineStyle).toBe('solid')
      expect(ring.outlineWidth).toBe('3px')
      expect(ring.outlineOffset).toBe('-3px')
      expect(ring.outlineColor).toBe(computedColor('var(--md-sys-color-secondary)', panel()))
      expect(getComputedStyle(share()).outlineStyle).toBe('none')
      await userEvent.keyboard('{ArrowDown}')
      expect(getComputedStyle(menuItem('Preview')).outlineStyle).toBe('none')
      expect(getComputedStyle(share()).outlineStyle).toBe('solid')
    })

    it('is not drawn on a hovered item, which the pointer focuses all the same', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      await userEvent.hover(menuItem('Preview'))
      expect(document.activeElement).toBe(menuItem('Preview'))
      expect(menuItem('Preview')).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(menuItem('Preview')).outlineStyle).toBe('none')
    })

    it('is not drawn on an item while the pointer presses it', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      await whilePressed(
        'Preview',
        async () => {
          expect(menuItem('Preview')).toHaveAttribute('data-pressed')
          expect(menuItem('Preview')).not.toHaveAttribute('data-focus-visible')
          expect(getComputedStyle(menuItem('Preview')).outlineStyle).toBe('none')
        },
        'menuitem',
      )
    })
  })

  describe('motion', () => {
    it('grows the panel open on the default spatial spring as it fades in on the fast effects one', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      // What the panel transitions as it opens is taken from the events of it: how far open
      // it is once the click has been answered is up to how fast the machine is. React Aria
      // cancels what starts before it has placed the panel, and its own entering starts again.
      const ran: [EventTarget | null, string][] = []
      const record = (event: TransitionEvent) => ran.push([event.target, event.propertyName])
      document.addEventListener('transitionend', record)
      onTestFinished(() => document.removeEventListener('transitionend', record))
      await userEvent.click(trigger())
      await settle()
      const opening = ran.filter(([target]) => target === panel()).map(([, property]) => property)
      expect(opening.sort()).toEqual(['--menu-open', 'opacity'])
      // Open, its corners, which only a submenu changes, are on the fast spatial spring.
      const style = getComputedStyle(panel())
      expect(style.transitionProperty).toBe('--menu-open, opacity, border-radius')
      expect(style.transitionDuration).toBe(
        ['default-spatial', 'fast-effects', 'fast-spatial'].map(springDuration).join(', '),
      )
      expect(style.transitionTimingFunction).toBe(
        ['default-spatial', 'fast-effects', 'fast-spatial'].map(springEasing).join(', '),
      )
    })

    it('squeezes the panel toward the trigger as it opens, its rows stretched back to full size, then rests unscaled', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      // In the page: a real click's answer can come after the fade, on a busy machine.
      press(trigger())
      await waitFor(() => expect(panel().getAnimations().length).toBeGreaterThan(0))
      for (const animation of panel().getAnimations()) animation.pause()
      for (const animation of panel().getAnimations()) animation.currentTime = 40
      const box = panel().getBoundingClientRect()
      const at = trigger().getBoundingClientRect()
      const row = menuItem('Preview').getBoundingClientRect()
      expect(box.top).toBeCloseTo(at.bottom, 0)
      expect(box.height).toBeLessThan(100)
      expect(row.height).toBeCloseTo(44, 0)
      expect(parseFloat(getComputedStyle(panel()).opacity)).toBeLessThan(1)
      for (const animation of panel().getAnimations()) animation.finish()
      await settle()
      expect(['1', '1 1']).toContain(getComputedStyle(panel()).scale)
      expect(['1', '1 1']).toContain(getComputedStyle(menuItem('Preview')).scale)
      expect(getComputedStyle(panel()).opacity).toBe('1')
    })

    /** Opens the menu and steps its panel through its growing, 60 frames a second: its box at each, and whether the page could scroll at any. */
    async function grow() {
      await userEvent.click(trigger())
      await waitFor(() => expect(panel().getAnimations().length).toBeGreaterThan(0))
      const growing = panel().getAnimations()
      for (const animation of growing) animation.pause()
      // Paused, the panel still hears that it has started to grow, a frame later.
      await settle()
      const page = document.documentElement
      const end = Math.max(
        ...growing.map(({ effect }) => Number(effect!.getComputedTiming().endTime)),
      )
      const boxes: DOMRect[] = []
      let scrolls = false
      for (let time = 0; time <= end; time += 1000 / 60) {
        for (const animation of growing) animation.currentTime = time
        boxes.push(panel().getBoundingClientRect())
        scrolls ||= page.scrollHeight > page.clientHeight || page.scrollWidth > page.clientWidth
      }
      for (const animation of growing) animation.finish()
      await settle()
      return { boxes, scrolls, rest: panel().getBoundingClientRect() }
    }

    it('takes the panel past its size before it settles there, on its spring, where the window has room', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      const { boxes, scrolls, rest } = await grow()
      // By 1.5% of its height on the expressive default spatial spring.
      const furthest = Math.max(...boxes.map((box) => box.bottom))
      expect(furthest - rest.bottom).toBeGreaterThan(rest.height * 0.01)
      expect(scrolls).toBe(false)
    })

    // With no containerPadding, a panel can rest on the window's edge, or 3px short of it:
    // ten rows are 484px tall, and a label that wraps makes one 280px wide, which its spring
    // would take 4px or more past its size.
    const wide = (
      <MenuItem>An item whose label is long enough to make the panel as wide as one gets</MenuItem>
    )

    it.each([
      {
        side: 'bottom',
        room: 3,
        dir: 'ltr',
        place: { left: 0, bottom: 487 },
        placement: 'bottom start',
        content: rows(10),
      },
      {
        side: 'top',
        room: 3,
        dir: 'ltr',
        place: { left: 0, top: 487 },
        placement: 'top start',
        content: rows(10),
      },
      {
        side: 'right',
        room: 3,
        dir: 'ltr',
        place: { top: 0, right: 283 },
        placement: 'right top',
        content: wide,
      },
      // To its left, a page that reads from the right would scroll.
      {
        side: 'left',
        room: 3,
        dir: 'rtl',
        place: { top: 0, left: 283 },
        placement: 'left top',
        content: wide,
      },
      // More rows than fit: the panel takes the whole window below its trigger.
      {
        side: 'bottom',
        room: 0,
        dir: 'ltr',
        place: { left: 0, top: 0 },
        placement: 'bottom start',
        content: rows(40),
      },
    ] as const)(
      'stops a panel with no containerPadding that opens to the $side, $room px from the window’s edge, at that edge on its spring, and never scrolls the page',
      async ({ side, room, dir, place, placement, content }) => {
        document.documentElement.dir = dir
        render(
          <Page style={{ position: 'fixed', padding: 0, ...place }}>
            <Overflow placement={placement} containerPadding={0} content={content} />
          </Page>,
        )
        const { boxes, scrolls, rest } = await grow()
        const { clientWidth, clientHeight } = document.documentElement
        const edge = { top: 0, left: 0, bottom: clientHeight, right: clientWidth }[side]
        // How far short of the window's edge a box is, on the side the panel grows toward.
        const short = (box: DOMRect) => (edge ? edge - box[side] : box[side])
        expect(panel()).toHaveAttribute('data-placement', side)
        expect(short(rest)).toBeCloseTo(room, 0)
        expect(Math.min(...boxes.map(short))).toBeCloseTo(0, 1)
        expect(scrolls).toBe(false)
      },
    )

    it('grows a section with the panel as it opens, its rows stretched back to full size and clipped to it', async () => {
      render(
        <Page>
          <Overflow
            content={
              <>
                <MenuSection>
                  <MenuItem>Preview</MenuItem>
                  <MenuItem>Share</MenuItem>
                </MenuSection>
                <MenuSection>
                  <MenuItem>Remove</MenuItem>
                </MenuSection>
              </>
            }
          />
        </Page>,
      )
      await userEvent.click(trigger())
      await waitFor(() => expect(panel().getAnimations().length).toBeGreaterThan(0))
      for (const animation of panel().getAnimations()) animation.pause()
      for (const animation of panel().getAnimations()) animation.currentTime = 40
      const [first, second] = screen.getAllByRole('group') as [HTMLElement, HTMLElement]
      const box = panel().getBoundingClientRect()
      const squeezed = first.getBoundingClientRect()
      // The sections are squeezed with the panel, one after the other, as the guideline video
      // of a grouped menu has them; only their rows are stretched back.
      expect(squeezed.top - box.top).toBeLessThan(1)
      expect(second.getBoundingClientRect().top).toBeCloseTo(squeezed.bottom, 0)
      expect(box.bottom - second.getBoundingClientRect().bottom).toBeLessThan(1)
      expect(getComputedStyle(first).scale).toBe('none')
      expect(menuItem('Preview').getBoundingClientRect().height).toBeCloseTo(44, 0)
      expect(getComputedStyle(first).overflow).toBe('clip')
      for (const animation of panel().getAnimations()) animation.finish()
      await settle()
      expect(first.getBoundingClientRect().height).toBeCloseTo(96, 0)
      expect(squeezed.height).toBeLessThan(48)
    })

    /** Opens the menu named `label` and holds its panel 40ms into its growing, its rows still stretched back. */
    async function hold(label = 'More') {
      // In the page: a real click's answer can come after the fade, on a busy machine.
      press(trigger(label))
      await waitFor(() => expect(panel(label).getAnimations().length).toBeGreaterThan(0))
      for (const animation of panel(label).getAnimations()) animation.pause()
      for (const animation of panel(label).getAnimations()) animation.currentTime = 40
      // Told a frame on that it grows: React Aria's data-entering is gone by then.
      await waitFor(() => expect(panel(label)).toHaveAttribute('data-growing'))
      expect(panel(label)).not.toHaveAttribute('data-entering')
    }

    /** Lets a panel held as it grows finish, and stop opening. */
    async function release(label = 'More') {
      for (const animation of panel(label).getAnimations()) animation.finish()
      await settle()
      await waitFor(() => expect(panel(label)).not.toHaveAttribute('data-growing'))
    }

    it('shows no scrollbar while a panel whose items fit grows, its rows stretched past its end, nor once it is open', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await hold()
      // The stretched rows are overflow the list would scroll to, and show a scrollbar for.
      expect(list().scrollHeight).toBeGreaterThan(list().clientHeight)
      expect(getComputedStyle(list()).overflowY).toBe('hidden')
      await release()
      expect(list().scrollHeight).toBe(list().clientHeight)
      expect(getComputedStyle(list()).overflowY).toBe('auto')
    })

    it('shows the scrollbar of a menu whose items do not fit from the start, while it grows, as once it is open', async () => {
      render(
        <Page>
          <Overflow content={rows(40)} />
        </Page>,
      )
      await hold()
      expect(getComputedStyle(list()).overflowY).toBe('auto')
      expect(getComputedStyle(list()).scrollbarWidth).toBe('auto')
      expect(getComputedStyle(list(), '::-webkit-scrollbar').display).not.toBe('none')
      // Across it, where nothing is stretched, its rows fit.
      expect(getComputedStyle(list()).overflowX).toBe('hidden')
      await release()
      expect(list().scrollHeight).toBeGreaterThan(list().clientHeight)
      expect(getComputedStyle(list()).overflowY).toBe('auto')
    })

    it.each([
      { content: undefined, fit: 'fit', down: 'hidden' },
      { content: rows(40), fit: 'do not fit', down: 'auto' },
    ])(
      'scrolls a panel that opens to the side only down, and only items that do not fit, while its rows are stretched across it: $down for ones that $fit',
      async ({ content, down }) => {
        render(
          <Page>
            <Overflow placement="end top" content={content} />
          </Page>,
        )
        await hold()
        expect(panel()).toHaveAttribute('data-placement', 'right')
        expect(list().scrollWidth).toBeGreaterThan(list().clientWidth)
        expect(getComputedStyle(list()).overflowX).toBe('hidden')
        expect(getComputedStyle(list()).overflowY).toBe(down)
        await release()
        expect(list().scrollWidth).toBe(list().clientWidth)
        expect(getComputedStyle(list()).overflow).toBe('auto')
      },
    )

    it('scrolls a panel whose items come not to fit once it is open, having had no scrollbar as it opened', async () => {
      function Loaded() {
        const [count, setCount] = useState(2)
        return (
          <Page>
            <Overflow
              content={
                <>
                  <MenuItem shouldCloseOnSelect={false} onAction={() => setCount(40)}>
                    Load more
                  </MenuItem>
                  {rows(count)}
                </>
              }
            />
          </Page>
        )
      }
      render(<Loaded />)
      await hold()
      expect(getComputedStyle(list()).overflowY).toBe('hidden')
      await release()
      await userEvent.click(menuItem('Load more'))
      await waitFor(() => expect(list().scrollHeight).toBeGreaterThan(list().clientHeight))
      expect(getComputedStyle(list()).overflowY).toBe('auto')
    })

    it('keeps the scrollbar of a menu whose items do not fit while it closes', async () => {
      render(
        <Page>
          <Overflow content={rows(40)} />
        </Page>,
      )
      await open()
      const [leaving, scroller] = [panel(), list()]
      await waitFor(() => expect(getComputedStyle(scroller).overflowY).toBe('auto'))
      pressEscape()
      await waitFor(() => expect(leaving).toHaveAttribute('data-exiting'))
      expect(getComputedStyle(scroller).overflowY).toBe('auto')
      expect(getComputedStyle(scroller).scrollbarWidth).toBe('auto')
    })

    it('fades the panel out at its full size when it closes, then removes it', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const height = panel().getBoundingClientRect().height
      const leaving = panel()
      pressEscape()
      await waitFor(() => expect(leaving).toHaveAttribute('data-exiting'))
      await waitFor(() => expect(leaving.getAnimations().length).toBeGreaterThan(0))
      const transitions = leaving.getAnimations() as CSSTransition[]
      expect(transitions.map((t) => t.transitionProperty)).toEqual(['opacity'])
      expect(leaving.getBoundingClientRect().height).toBe(height)
      await waitFor(() => expect(leaving).not.toBeInTheDocument())
    })

    it('grows the panel open again on every opening, after a selection that moved its trigger too', async () => {
      // A trigger that names what is selected, centered: a longer name moves its start.
      function Sorting() {
        const [sorting, setSorting] = useState('Name')
        return (
          <Page style={{ justifyContent: 'center' }}>
            <MenuTrigger>
              <IconButton aria-label={sorting}>
                <Icon name="sort" />
              </IconButton>
              <MenuPopover>
                <Menu onAction={(key) => setSorting(String(key))}>
                  <MenuItem id="Name">Name</MenuItem>
                  <MenuItem id="Date modified">Date modified</MenuItem>
                </Menu>
              </MenuPopover>
            </MenuTrigger>
          </Page>
        )
      }
      render(<Sorting />)
      await open('Name')
      const { height } = panel('Name').getBoundingClientRect()
      await userEvent.click(menuItem('Date modified'))
      await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
      await hold('Date modified')
      expect(panel('Date modified').getBoundingClientRect().height).toBeLessThan(height / 2)
      expect(parseFloat(getComputedStyle(panel('Date modified')).opacity)).toBeLessThan(1)
      await release('Date modified')
      expect(panel('Date modified').getBoundingClientRect().height).toBe(height)
      expect(getComputedStyle(panel('Date modified')).opacity).toBe('1')
    })

    it('opens and closes instantly given shouldSkipAnimation', async () => {
      render(
        <Page>
          <Overflow shouldSkipAnimation />
        </Page>,
      )
      await userEvent.click(trigger())
      expect(panel()).not.toHaveAttribute('data-entering')
      expect(panel().getAnimations()).toHaveLength(0)
      expect(getComputedStyle(panel()).opacity).toBe('1')
      expect(['1', '1 1']).toContain(getComputedStyle(panel()).scale)
      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('springs an item’s shape and colors, the shape on the fast spatial spring and the colors on the fast effects one', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const style = getComputedStyle(menuItem('Preview'))
      expect(style.transitionProperty).toBe('border-radius, background-color, color')
      expect(style.transitionDuration).toBe(
        [
          springDuration('fast-spatial'),
          springDuration('fast-effects'),
          springDuration('fast-effects'),
        ].join(', '),
      )
    })

    describe('the checkmark', () => {
      const standard = () => computedStyleOf('ease-standard', (s) => s.transitionTimingFunction)
      const linear = () => computedStyleOf('ease-linear', (s) => s.transitionTimingFunction)

      /** A multi-select menu of diets, which stays open as each is selected, these to begin with. */
      function Diets({
        chosen = [],
        disabled = false,
        icons = false,
      }: {
        chosen?: string[]
        disabled?: boolean
        icons?: boolean
      }) {
        return (
          <MenuTrigger>
            <IconButton aria-label="More">
              <Icon name="more_vert" />
            </IconButton>
            <MenuPopover>
              <Menu selectionMode="multiple" defaultSelectedKeys={chosen}>
                {['Kosher', 'Vegan'].map((diet) => (
                  <MenuItem key={diet} id={diet} textValue={diet} isDisabled={disabled}>
                    {icons && <Icon slot="leading" name="restaurant" />}
                    {diet}
                  </MenuItem>
                ))}
              </Menu>
            </MenuPopover>
          </MenuTrigger>
        )
      }

      /** Holds the transitions an item has just started, and steps them to a time in ms. */
      function stepped(item: Element) {
        const parts = [item, ...item.querySelectorAll('*')]
        // Reading a computed style starts the transitions of the change just made.
        parts.forEach((part) => getComputedStyle(part).width)
        const animations = parts.flatMap((part) => part.getAnimations())
        animations.forEach((animation) => animation.pause())
        return (ms: number) => animations.forEach((animation) => (animation.currentTime = ms))
      }

      /** How far in from the start of its item an element begins. */
      const startOf = (el: Element | Range, item: Element) =>
        el.getBoundingClientRect().left - item.getBoundingClientRect().left

      it('opens the checkmark’s box in a newly selected item over a medium-1 on the standard easing, the text 8px after it, with no overshoot', async () => {
        render(
          <Page>
            <Diets />
          </Page>,
        )
        await open()
        const item = menuItem('Vegan')
        const box = leadingOf(item)
        expect(startOf(labelOf('Vegan'), item)).toBe(12)

        act(() => (item as HTMLElement).click())
        const style = getComputedStyle(box)
        expect(style.transitionProperty).toBe('width, margin-inline-end')
        expect(style.transitionDuration).toBe('0.25s')
        expect(style.transitionTimingFunction).toBe(standard())

        const at = stepped(item)
        const starts = [0, 50, 100, 150, 250, 400].map((ms) => {
          at(ms)
          const width = box.getBoundingClientRect().width
          // The 8px to the text open in step with the 20px of the box, to the layout's 1/64px.
          expect(startOf(labelOf('Vegan'), item), `${ms}ms`).toBeCloseTo(12 + width * 1.4, 1)
          return width
        })
        expect(starts[0]).toBe(0)
        expect(starts.at(-1)).toBe(20)
        // It only opens, and never past where it rests: the standard easing, not a spring.
        expect([...starts].sort((a, b) => a - b)).toEqual(starts)
        // Most of the way in its first 100ms, as a filter chip's is.
        expect(starts[2]! / 20).toBeGreaterThan(0.75)
        expect(startOf(labelOf('Vegan'), item)).toBe(40)
      })

      it('keeps the checkmark in the middle of its box as it opens', async () => {
        render(
          <Page>
            <Diets />
          </Page>,
        )
        await open()
        const item = menuItem('Vegan')
        act(() => (item as HTMLElement).click())
        const at = stepped(item)
        for (const ms of [0, 50, 100, 250]) {
          at(ms)
          const box = leadingOf(item).getBoundingClientRect()
          const check = checkOf(item).getBoundingClientRect()
          expect(check.left + 10, `${ms}ms`).toBeCloseTo(box.left + box.width / 2, 3)
          expect(startOf(leadingOf(item), item), `${ms}ms`).toBe(12)
        }
      })

      it('traces the checkmark from its start over a medium-4, a short-1 after its box starts to open', async () => {
        render(
          <Page>
            <Diets />
          </Page>,
        )
        await open()
        const item = menuItem('Vegan')
        const path = strokeOf(item)
        const offset = () => parseFloat(getComputedStyle(path).strokeDashoffset)
        expect(getComputedStyle(path).opacity).toBe('0')
        expect(offset()).toBe(1)
        expect(path.getAttribute('pathLength')).toBe('1')

        act(() => (item as HTMLElement).click())
        const style = getComputedStyle(path)
        expect(style.transitionProperty).toBe('opacity, stroke-dashoffset')
        expect(style.transitionDuration).toBe('0s, 0.4s')
        expect(style.transitionDelay).toBe('0s, 0.05s')
        expect(style.transitionTimingFunction).toBe(standard())

        const at = stepped(item)
        const drawn = (ms: number) => {
          at(ms)
          return 1 - offset()
        }
        expect(getComputedStyle(path).opacity).toBe('1')
        expect(drawn(0)).toBe(0)
        expect(drawn(50)).toBe(0)
        expect(drawn(150)).toBeGreaterThan(0.4)
        expect(drawn(150)).toBeLessThan(0.7)
        expect(drawn(450)).toBe(1)
      })

      it('fades the checkmark of an item no longer selected over a short-1, whole, and shuts its box', async () => {
        render(
          <Page>
            <Diets chosen={['Vegan']} />
          </Page>,
        )
        await open()
        const item = menuItem('Vegan')
        const path = strokeOf(item)
        expect(startOf(labelOf('Vegan'), item)).toBe(40)

        act(() => (item as HTMLElement).click())
        const style = getComputedStyle(path)
        expect(style.transitionDuration).toBe('0.05s, 0s')
        expect(style.transitionDelay).toBe('0s, 0.05s')
        expect(style.transitionTimingFunction).toBe(linear())

        const at = stepped(item)
        const offset = () => parseFloat(getComputedStyle(path).strokeDashoffset)
        at(25)
        expect(Number(getComputedStyle(path).opacity)).toBeCloseTo(0.5, 5)
        expect(offset()).toBe(0)
        expect(startOf(labelOf('Vegan'), item)).toBeLessThan(40)
        at(250)
        expect(getComputedStyle(path).opacity).toBe('0')
        expect(offset()).toBe(1)
        expect(leadingOf(item).getBoundingClientRect().width).toBe(0)
        expect(startOf(labelOf('Vegan'), item)).toBe(12)
      })

      it('swaps an item’s own leading icon for the checkmark over a short-1, with its text where it was', async () => {
        render(
          <Page>
            <Diets icons />
          </Page>,
        )
        await open()
        const item = menuItem('Vegan')
        const icon = within(item).getByText('restaurant')
        expect(getComputedStyle(icon).opacity).toBe('1')
        expect(getComputedStyle(strokeOf(item)).opacity).toBe('0')
        expect(startOf(labelOf('Vegan'), item)).toBe(40)

        act(() => (item as HTMLElement).click())
        expect(getComputedStyle(icon).transitionProperty).toBe('opacity')
        expect(getComputedStyle(icon).transitionDuration).toBe('0.05s')
        expect(getComputedStyle(icon).transitionTimingFunction).toBe(linear())
        const at = stepped(item)
        for (const ms of [0, 25, 250]) {
          at(ms)
          expect(startOf(labelOf('Vegan'), item), `${ms}ms`).toBe(40)
        }
        expect(getComputedStyle(icon).opacity).toBe('0')
        expect(getComputedStyle(strokeOf(item)).opacity).toBe('1')
      })

      it('animates nothing of the checkmark or the leading icon of a disabled item', async () => {
        render(
          <Page>
            <Diets disabled chosen={['Vegan']} icons />
            <Overflow label="Plain" content={<MenuItem isDisabled>Kosher</MenuItem>} />
          </Page>,
        )
        await open()
        const item = menuItem('Vegan')
        const icon = within(item).getByText('restaurant')
        for (const part of [icon, strokeOf(item)])
          expect(getComputedStyle(part).transitionProperty).toBe('none')
        await userEvent.keyboard('{Escape}')
        await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
        await open('Plain')
        expect(getComputedStyle(leadingOf(menuItem('Kosher'))).transitionProperty).toBe('none')
      })
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('opens the checkmark’s box and draws the checkmark of a newly selected item at once', async () => {
        render(
          <Page>
            <Overflow
              selectionMode="single"
              defaultSelectedKeys={['vegan']}
              content={<MenuItem id="vegan">Vegan</MenuItem>}
            />
          </Page>,
        )
        await open()
        for (const part of [leadingOf(menuItem('Vegan')), strokeOf(menuItem('Vegan'))])
          for (const time of [
            ...getComputedStyle(part).transitionDuration.split(', '),
            ...getComputedStyle(part).transitionDelay.split(', '),
          ])
            expect(parseFloat(time)).toBeLessThan(0.001)
      })

      it('settles every spring instantly on the panel', async () => {
        render(
          <Page>
            <Overflow />
          </Page>,
        )
        await open()
        const durations = getComputedStyle(panel()).transitionDuration.split(', ')
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe('elevation', () => {
    it('raises the panel to level 2', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      expect(getComputedStyle(panel()).boxShadow).toBe(
        computedStyleOf('shadow-elevation-2', (s) => s.boxShadow),
      )
    })
  })

  describe('browser defaults', () => {
    // An item keeps a padding and margin of its own, the spec's 12dp above and below its
    // text and the 2dp above and below it.
    it('leaves none of the browser’s own styling on an item', async () => {
      render(
        <Page>
          <Overflow />
        </Page>,
      )
      await open()
      const style = getComputedStyle(menuItem('Preview'))
      expect(style.appearance).toBe('none')
      expect(style.getPropertyValue('-webkit-tap-highlight-color')).toBe('rgba(0, 0, 0, 0)')
      expect(style.touchAction).toBe('manipulation')
      expect(style.borderTopWidth).toBe('0px')
      expect(style.marginTop).toBe('2px')
      expect(style.userSelect).toBe('none')
      expect(style.paddingTop).toBe('12px')
    })
  })

  describe('submenus', () => {
    /** The Overflow menu with a submenu on Share, its panel and its list given these: Email, a separator, Copy link, and Message, with one of its own. */
    function Nested({
      color,
      share,
      popover,
      submenu,
      children,
    }: Pick<MenuProps, 'color'> & {
      share?: Partial<MenuItemProps>
      popover?: Partial<MenuPopoverProps>
      submenu?: Partial<MenuProps>
      children?: React.ReactNode
    }) {
      return (
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu color={color}>
              <MenuItem>Preview</MenuItem>
              <SubmenuTrigger>
                <MenuItem {...share}>Share</MenuItem>
                <MenuPopover {...popover}>
                  <Menu {...submenu}>
                    {children ?? (
                      <>
                        <MenuItem shouldCloseOnSelect={false}>Email</MenuItem>
                        <Separator />
                        <MenuItem>Copy link</MenuItem>
                        <SubmenuTrigger>
                          <MenuItem>Message</MenuItem>
                          <MenuPopover>
                            <Menu>
                              <MenuItem>Text</MenuItem>
                              <MenuItem>Chat</MenuItem>
                            </Menu>
                          </MenuPopover>
                        </SubmenuTrigger>
                      </>
                    )}
                  </Menu>
                </MenuPopover>
              </SubmenuTrigger>
              <MenuItem>Remove</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      )
    }

    const rect = (el: Element) => el.getBoundingClientRect()
    const radius = (el: Element) => getComputedStyle(el).borderRadius
    const layer = (name: string) => menuItem(name).querySelector<HTMLElement>('.state-layer')!
    // The corners of a menu's first and last items: [top left, top right, bottom right, bottom left].
    const corners = (name: string) => {
      const style = getComputedStyle(menuItem(name))
      return [
        style.borderTopLeftRadius,
        style.borderTopRightRadius,
        style.borderBottomRightRadius,
        style.borderBottomLeftRadius,
      ]
    }
    const [atTop, atBottom, plain] = [
      ['12px', '12px', '4px', '4px'],
      ['4px', '4px', '12px', '12px'],
      ['4px', '4px', '4px', '4px'],
    ]
    // The pointer brought onto an item and moved on within it.
    async function point(name: string) {
      await userEvent.hover(menuItem(name))
      await userEvent.hover(menuItem(name), { position: { x: 12, y: 12 } })
    }

    /** Opens the menu with the keyboard and, once it has grown, the submenu of Share, then lets both settle. */
    async function enter() {
      await userEvent.tab()
      await userEvent.keyboard('{Enter}')
      await settle()
      await userEvent.keyboard('{ArrowDown}{ArrowRight}')
      await screen.findByRole('menu', { name: 'Share' })
      await waitFor(() =>
        expect(list('Share')).toContainElement(document.activeElement as HTMLElement),
      )
      await settle()
    }

    /** Opens the menu with the pointer and rests it on Share until its submenu has opened. */
    async function rest() {
      await open()
      await point('Share')
      await screen.findByRole('menu', { name: 'Share' }, { timeout: 2000 })
      await settle()
    }

    describe('placement', () => {
      it('opens beside its item, at the item’s end edge and top, over the 4px of padding of the menu, in front of it', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await enter()
        const item = rect(menuItem('Share'))
        const box = rect(panel('Share'))
        expect(panel('Share')).toHaveAttribute('data-placement', 'right')
        expect(box.left).toBeCloseTo(item.right, 0)
        expect(box.top).toBeCloseTo(item.top, 0)
        expect(rect(panel()).right - box.left).toBeCloseTo(4, 0)
        expect(document.elementFromPoint(box.left + 2, box.top + 24)).toBe(list('Share'))
      })

      it('is not clipped by a menu that scrolls', async () => {
        render(
          <Page>
            <Overflow
              content={
                <>
                  <SubmenuTrigger>
                    <MenuItem>Share</MenuItem>
                    <MenuPopover>
                      <Menu>
                        <MenuItem>Email</MenuItem>
                      </Menu>
                    </MenuPopover>
                  </SubmenuTrigger>
                  {rows(40)}
                </>
              }
            />
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}')
        await settle()
        await userEvent.keyboard('{ArrowRight}')
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        expect(list().scrollHeight).toBeGreaterThan(list().clientHeight)
        const email = rect(menuItem('Email'))
        expect(email.left).toBeGreaterThanOrEqual(rect(panel()).right - 4)
        expect(document.elementFromPoint(email.left + 20, email.top + 20)).toBe(menuItem('Email'))
      })

      it('stays flush to its item whatever offset the menu itself is given from its trigger', async () => {
        render(
          <Page>
            <Overflow
              offset={12}
              content={
                <SubmenuTrigger>
                  <MenuItem>Share</MenuItem>
                  <MenuPopover>
                    <Menu>
                      <MenuItem>Email</MenuItem>
                    </Menu>
                  </MenuPopover>
                </SubmenuTrigger>
              }
            />
          </Page>,
        )
        await open()
        expect(rect(panel()).top - rect(trigger()).bottom).toBeCloseTo(12, 0)
        await userEvent.click(menuItem('Share'))
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        expect(rect(panel('Share')).left).toBeCloseTo(rect(menuItem('Share')).right, 0)
        expect(rect(panel('Share')).top).toBeCloseTo(rect(menuItem('Share')).top, 0)
      })

      it('turns to the other side of its item where the window has no room, and a submenu of it to whichever side has room', async () => {
        render(
          <Page style={{ justifyContent: 'flex-end' }}>
            <Nested />
          </Page>,
        )
        await enter()
        expect(panel('Share')).toHaveAttribute('data-placement', 'left')
        expect(rect(panel('Share')).right).toBeCloseTo(rect(menuItem('Share')).left, 0)
        await userEvent.keyboard('{End}{ArrowRight}')
        await screen.findByRole('menu', { name: 'Message' })
        await settle()
        // React Aria places each submenu by the room there is, not by the side its menu turned
        // to: back at its item's end edge here, where it fits, over the menu.
        expect(panel('Message')).toHaveAttribute('data-placement', 'right')
        expect(rect(panel('Message')).left).toBeCloseTo(rect(menuItem('Message')).right, 0)
        expect(rect(panel('Message')).right).toBeLessThanOrEqual(innerWidth - 8)
      })

      it('opens to the left in a right-to-left layout, with its arrow mirrored and the arrow keys the other way round', async () => {
        document.documentElement.dir = 'rtl'
        render(
          <I18nProvider locale="he-IL">
            <Page>
              <Nested />
            </Page>
          </I18nProvider>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}')
        await settle()
        await userEvent.keyboard('{ArrowDown}{ArrowRight}')
        expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'false')
        await userEvent.keyboard('{ArrowLeft}')
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        expect(panel('Share')).toHaveAttribute('data-placement', 'left')
        expect(rect(panel('Share')).right).toBeCloseTo(rect(menuItem('Share')).left, 0)
        expect(rect(panel('Share')).top).toBeCloseTo(rect(menuItem('Share')).top, 0)
        const arrow = menuItem('Share').querySelector('.font-icon')!
        expect(getComputedStyle(arrow).scale).toBe('-1 1')
        await userEvent.keyboard('{ArrowRight}')
        expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'false')
        expect(document.activeElement).toBe(menuItem('Share'))
      })

      it('opens where its own placement says', async () => {
        render(
          <Page>
            <Nested popover={{ placement: 'bottom start' }} />
          </Page>,
        )
        await enter()
        expect(panel('Share')).toHaveAttribute('data-placement', 'bottom')
        expect(rect(panel('Share')).top).toBeCloseTo(rect(menuItem('Share')).bottom, 0)
        expect(rect(panel('Share')).left).toBeCloseTo(rect(menuItem('Share')).left, 0)
      })

      it('keeps a long submenu in the window, scrolling', async () => {
        render(
          <Page>
            <Nested>{rows(40)}</Nested>
          </Page>,
        )
        await enter()
        const box = rect(panel('Share'))
        expect(box.top).toBeGreaterThanOrEqual(0)
        expect(box.bottom).toBeLessThanOrEqual(innerHeight)
        expect(list('Share').scrollHeight).toBeGreaterThan(list('Share').clientHeight)
        expect(getComputedStyle(list('Share')).overflowY).toBe('auto')
      })

      it('opens a submenu that scrolls on its selected item, as the menu itself does', async () => {
        render(
          <Page>
            <Nested submenu={{ selectionMode: 'single', defaultSelectedKeys: [25] }}>
              {rows(40)}
            </Nested>
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}{ArrowDown}{ArrowRight}')
        await waitFor(() => expect(document.activeElement).toBe(menuItem('Item 25')))
        await settle()
        expect(inView(menuItem('Item 25'), list('Share'))).toBe(true)
      })

      it.each([
        { count: 40, fit: 'do not fit', scrollbar: true },
        { count: 3, fit: 'fit', scrollbar: false },
      ])(
        'shows a scrollbar on a submenu whose $count items $fit as it fades in as once it is open: $scrollbar',
        async ({ count, scrollbar }) => {
          render(
            <Page>
              <Nested>{rows(count)}</Nested>
            </Page>,
          )
          await userEvent.tab()
          await userEvent.keyboard('{Enter}{ArrowDown}')
          // In the page: a real key's answer can come after the fade, on a busy machine.
          pressKey('ArrowRight')
          await screen.findByRole('menu', { name: 'Share' })
          await waitFor(() => expect(panel('Share').getAnimations().length).toBeGreaterThan(0))
          for (const transition of panel('Share').getAnimations()) transition.pause()
          // A submenu only fades in, its rows never stretched: it scrolls what does not fit it.
          const shown = () =>
            getComputedStyle(list('Share')).overflowY === 'auto' &&
            list('Share').scrollHeight > list('Share').clientHeight
          expect(parseFloat(getComputedStyle(panel('Share')).opacity)).toBeLessThan(1)
          expect(shown()).toBe(scrollbar)
          for (const transition of panel('Share').getAnimations()) transition.finish()
          await settle()
          expect(shown()).toBe(scrollbar)
          expect(getComputedStyle(list('Share')).overflowY).toBe('auto')
        },
      )
    })

    describe('shape', () => {
      it('rounds the menu the pointer is in 16px and the other 8px, swapping as the pointer moves between them', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        expect([radius(panel()), radius(panel('Share'))]).toEqual(['16px', '8px'])
        await point('Email')
        await settle()
        expect([radius(panel()), radius(panel('Share'))]).toEqual(['8px', '16px'])
        // Back on the item whose submenu is open, the pointer leaves the focus in the submenu,
        // as React Aria has it; on another item of the menu, it brings the focus back.
        await point('Share')
        await settle()
        expect([radius(panel()), radius(panel('Share'))]).toEqual(['8px', '16px'])
        await point('Preview')
        await settle()
        expect(radius(panel())).toBe('16px')
      })

      it('rounds the submenu the keyboard is in 16px, and every menu above it 8px', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await enter()
        expect([radius(panel()), radius(panel('Share'))]).toEqual(['8px', '16px'])
        await userEvent.keyboard('{End}{ArrowRight}')
        await screen.findByRole('menu', { name: 'Message' })
        await settle()
        expect([radius(panel()), radius(panel('Share')), radius(panel('Message'))]).toEqual([
          '8px',
          '8px',
          '16px',
        ])
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
        await settle()
        expect(radius(panel())).toBe('16px')
      })

      it('keeps a radius class given to a panel whether the focus is in it or not', async () => {
        render(
          <Page>
            <Nested popover={{ className: 'rounded-shape-xl' }} />
          </Page>,
        )
        const xl = computedRadius('rounded-shape-xl')
        await rest()
        expect([radius(panel()), radius(panel('Share'))]).toEqual(['16px', xl])
        await point('Email')
        await settle()
        expect([radius(panel()), radius(panel('Share'))]).toEqual(['8px', xl])
      })

      it('swaps the corners on the fast spatial spring, past the corner they go to and back', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        // Caught as they start, in the page: the hover's answer can come after they are over.
        const held = catchTransitions(panel())
        await point('Email')
        const springs = (held.caught as CSSTransition[]).filter((transition) =>
          transition.transitionProperty.endsWith('-radius'),
        )
        expect(springs).toHaveLength(4)
        const timing = springs[0]!.effect!.getComputedTiming()
        expect(`${Number(timing.duration) / 1000}s`).toBe(springDuration('fast-spatial'))
        // 16px to 8px: under 8px on the spring's overshoot, 40% of the way through.
        for (const transition of springs) transition.currentTime = 0.4 * Number(timing.duration)
        expect(parseFloat(radius(panel()))).toBeLessThan(8)
        held.release()
      })

      it('keeps the 12px bottom corners of the menu’s last item, and the menu’s height, while a submenu is open', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await open()
        const height = rect(panel()).height
        await userEvent.click(menuItem('Share'))
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        expect(corners('Remove')).toEqual(atBottom)
        expect(rect(panel()).height).toBe(height)
        // And the submenu has its own first and last items, once the pointer is in it.
        await point('Email')
        await settle()
        expect(corners('Email')).toEqual(atTop)
        expect(corners('Message')).toEqual(atBottom)
      })

      it('rounds the first and last items of the menu the pointer is in 12px at its ends, and those of the other 4px, swapping with the menus’ corners', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await open()
        expect([corners('Preview'), corners('Remove')]).toEqual([atTop, atBottom])
        await point('Share')
        await screen.findByRole('menu', { name: 'Share' }, { timeout: 2000 })
        await settle()
        expect([corners('Preview'), corners('Remove')]).toEqual([atTop, atBottom])
        expect([corners('Email'), corners('Message')]).toEqual([plain, plain])
        await point('Email')
        await settle()
        expect([corners('Preview'), corners('Remove')]).toEqual([plain, plain])
        expect([corners('Email'), corners('Message')]).toEqual([atTop, atBottom])
        await point('Preview')
        await settle()
        expect([corners('Preview'), corners('Remove')]).toEqual([atTop, atBottom])
      })

      it('rounds the first and last items of the submenu the keyboard is in 12px at its ends, and those of every menu above it 4px', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await enter()
        expect([corners('Preview'), corners('Remove')]).toEqual([plain, plain])
        expect([corners('Email'), corners('Message')]).toEqual([atTop, atBottom])
        await userEvent.keyboard('{End}{ArrowRight}')
        await screen.findByRole('menu', { name: 'Message' })
        await settle()
        expect([corners('Preview'), corners('Remove')]).toEqual([plain, plain])
        expect([corners('Email'), corners('Message')]).toEqual([plain, plain])
        expect([corners('Text'), corners('Chat')]).toEqual([atTop, atBottom])
        await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
        await settle()
        expect([corners('Preview'), corners('Remove')]).toEqual([atTop, atBottom])
      })

      it('rounds the state layer of a first item whose submenu the focus is in 4px, with the item', async () => {
        render(
          <Page>
            <Overflow
              content={
                <>
                  <SubmenuTrigger>
                    <MenuItem>Share</MenuItem>
                    <MenuPopover>
                      <Menu>
                        <MenuItem>Email</MenuItem>
                      </Menu>
                    </MenuPopover>
                  </SubmenuTrigger>
                  <MenuItem>Remove</MenuItem>
                </>
              }
            />
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}')
        await settle()
        expect(getComputedStyle(layer('Share')).borderTopLeftRadius).toBe('12px')
        await userEvent.keyboard('{ArrowRight}')
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        // The item keeps its state layer while its submenu is open: what shows its corners.
        expect(parseFloat(getComputedStyle(layer('Share')).opacity)).toBeGreaterThan(0)
        expect(corners('Share')).toEqual(plain)
        expect(getComputedStyle(layer('Share')).borderTopLeftRadius).toBe('4px')
        // The submenu's only item is its first and its last.
        expect(radius(menuItem('Email'))).toBe('12px')
      })

      it('moves the corners of the end items in step with their menu’s, 4px inside them all the way', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        // The focus is moved into the submenu, as the pointer moving into it does, and the
        // springs held before a frame has passed: how far along they are is not up to the machine.
        act(() => menuItem('Email').focus())
        const springs = (el: Element) => {
          void getComputedStyle(el).borderRadius
          return (el.getAnimations() as CSSTransition[]).filter((transition) =>
            transition.transitionProperty.endsWith('-radius'),
          )
        }
        const ends = ['Preview', 'Remove', 'Email', 'Message'].map((name) =>
          springs(menuItem(name)),
        )
        expect(ends.map((end) => end.map((spring) => spring.transitionProperty).sort())).toEqual([
          ['border-top-left-radius', 'border-top-right-radius'],
          ['border-bottom-left-radius', 'border-bottom-right-radius'],
          ['border-top-left-radius', 'border-top-right-radius'],
          ['border-bottom-left-radius', 'border-bottom-right-radius'],
        ])
        const all = [...springs(panel()), ...springs(panel('Share')), ...ends.flat()]
        expect(all).toHaveLength(16)
        const duration = Number(all[0]!.effect!.getComputedTiming().duration)
        expect(`${duration / 1000}s`).toBe(springDuration('fast-spatial'))
        for (const spring of all) spring.pause()
        const px = (value: string) => parseFloat(value)
        for (const progress of [0.05, 0.2, 0.4, 0.6, 0.9]) {
          for (const spring of all) spring.currentTime = progress * duration
          // The menu the focus has left goes from 16px to 8px, and the one it is in from 8px to 16px.
          const [left, entered] = [px(radius(panel())), px(radius(panel('Share')))]
          expect(px(corners('Preview')[0]!)).toBeCloseTo(left - 4, 3)
          expect(px(corners('Remove')[2]!)).toBeCloseTo(left - 4, 3)
          expect(px(corners('Email')[0]!)).toBeCloseTo(entered - 4, 3)
          expect(px(corners('Message')[2]!)).toBeCloseTo(entered - 4, 3)
        }
        // 40% of the way through, both are past the corner they go to, on the spring's overshoot.
        for (const spring of all) spring.currentTime = 0.4 * duration
        expect(px(radius(panel()))).toBeLessThan(8)
        expect(px(corners('Preview')[0]!)).toBeLessThan(4)
        for (const spring of all) spring.finish()
        await settle()
        expect([radius(panel()), radius(panel('Share'))]).toEqual(['8px', '16px'])
        expect([corners('Preview'), corners('Email')]).toEqual([plain, atTop])
      })

      it('keeps a selected item 12px all around, at the end of a menu or within it, whichever menu the focus is in', async () => {
        render(
          <Page>
            <Nested
              submenu={{
                selectionMode: 'multiple',
                defaultSelectedKeys: ['email', 'copy', 'text'],
              }}
            >
              <MenuItem id="email">Email</MenuItem>
              <MenuItem id="copy">Copy link</MenuItem>
              <MenuItem id="text">Message</MenuItem>
            </Nested>
          </Page>,
        )
        await rest()
        const selected = ['Email', 'Copy link', 'Message']
        const springs = (el: Element) => {
          void getComputedStyle(el).borderRadius
          return (el.getAnimations() as CSSTransition[]).filter((transition) =>
            transition.transitionProperty.endsWith('-radius'),
          )
        }
        expect(radius(panel('Share'))).toBe('8px')
        expect(selected.map((name) => radius(menuItem(name)))).toEqual(['12px', '12px', '12px'])
        // The focus comes into the submenu, whose corners go to 16px: none of the items' move.
        act(() => menuItem('Email').focus())
        expect(springs(panel('Share'))).toHaveLength(4)
        expect(selected.flatMap((name) => springs(menuItem(name)))).toEqual([])
        await settle()
        expect(radius(panel('Share'))).toBe('16px')
        expect(selected.map((name) => radius(menuItem(name)))).toEqual(['12px', '12px', '12px'])
      })

      it('keeps the 12px of a selected first and last item of the menu the focus has left', async () => {
        render(
          <Page>
            <Overflow
              selectionMode="multiple"
              defaultSelectedKeys={['preview', 'remove']}
              content={
                <>
                  <MenuItem id="preview">Preview</MenuItem>
                  <MenuSection selectionMode="none">
                    <SubmenuTrigger>
                      <MenuItem>Share</MenuItem>
                      <MenuPopover>
                        <Menu>
                          <MenuItem>Email</MenuItem>
                        </Menu>
                      </MenuPopover>
                    </SubmenuTrigger>
                  </MenuSection>
                  <MenuItem id="remove">Remove</MenuItem>
                </>
              }
            />
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}{ArrowDown}{ArrowRight}')
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        expect(radius(panel())).toBe('8px')
        expect([radius(menuItem('Preview')), radius(menuItem('Remove'))]).toEqual(['12px', '12px'])
      })

      it('rounds the first item of the first section and the last of the last with their menu’s corners too', async () => {
        render(
          <Page>
            <Nested>
              <MenuSection>
                <MenuItem>Email</MenuItem>
                <MenuItem>Copy link</MenuItem>
              </MenuSection>
              <Separator />
              <MenuSection>
                <MenuItem>Message</MenuItem>
                <MenuItem>Print</MenuItem>
              </MenuSection>
            </Nested>
          </Page>,
        )
        await rest()
        expect(['Email', 'Copy link', 'Message', 'Print'].map(corners)).toEqual([
          plain,
          plain,
          plain,
          plain,
        ])
        await point('Email')
        await settle()
        expect(['Email', 'Copy link', 'Message', 'Print'].map(corners)).toEqual([
          atTop,
          plain,
          plain,
          atBottom,
        ])
      })

      it('gives a submenu’s panel the menu’s own box: its padding, fill and elevation', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await enter()
        const style = getComputedStyle(panel('Share'))
        const own = getComputedStyle(panel())
        expect(style.position).toBe('absolute')
        expect(style.borderTopWidth).toBe('0px')
        expect(style.margin).toBe('0px')
        expect(getComputedStyle(list('Share')).padding).toBe(getComputedStyle(list()).padding)
        // The fill is the list's, which fills the panel.
        expect(getComputedStyle(list('Share')).backgroundColor).toBe(
          computedColor('var(--md-sys-color-surface-container-low)', panel()),
        )
        expect(getComputedStyle(list('Share')).color).toBe(getComputedStyle(list()).color)
        expect(rect(list('Share')).toJSON()).toEqual(rect(panel('Share')).toJSON())
        expect(style.boxShadow).toBe(own.boxShadow)
        expect(rect(menuItem('Email')).left - rect(panel('Share')).left).toBe(4)
        expect(rect(menuItem('Email')).top - rect(panel('Share')).top).toBe(4)
      })
    })

    describe('color', () => {
      const fill = (name: string) => getComputedStyle(list(name)).backgroundColor

      /** Opens the submenu of Share and, from its last item, the submenu of Message. */
      async function enterMessage() {
        await enter()
        await userEvent.keyboard('{End}{ArrowRight}')
        await screen.findByRole('menu', { name: 'Message' })
        await settle()
      }

      it('fills a submenu, and a submenu of it, with the vibrant color of the menu it opens from', async () => {
        render(
          <Page>
            <Nested color="vibrant" />
          </Page>,
        )
        await enterMessage()
        const vibrant = computedColor('var(--md-sys-color-tertiary-container)', panel())
        expect([fill('More'), fill('Share'), fill('Message')]).toEqual([vibrant, vibrant, vibrant])
        expect(getComputedStyle(menuItem('Email')).color).toBe(
          computedColor('var(--md-sys-color-on-tertiary-container)', panel()),
        )
      })

      it('fills a submenu given a color of its own with that, and a submenu of it too', async () => {
        render(
          <Page>
            <Nested color="vibrant" submenu={{ color: 'standard' }} />
          </Page>,
        )
        await enterMessage()
        const [vibrant, standard] = [
          computedColor('var(--md-sys-color-tertiary-container)', panel()),
          computedColor('var(--md-sys-color-surface-container-low)', panel()),
        ]
        expect([fill('More'), fill('Share'), fill('Message')]).toEqual([
          vibrant,
          standard,
          standard,
        ])
        expect(getComputedStyle(menuItem('Email')).color).toBe(
          computedColor('var(--md-sys-color-on-surface)', panel()),
        )
      })
    })

    describe('the item', () => {
      it.each([
        ['standard', '--md-sys-color-on-surface-variant'],
        ['vibrant', '--md-sys-color-on-tertiary-container'],
      ] as const)(
        'draws the arrow of a %s menu’s item 20px, in its trailing icon color, 12px from the item’s end',
        async (color, role) => {
          render(
            <Page>
              <Nested color={color} />
            </Page>,
          )
          await open()
          const arrow = menuItem('Share').querySelector('.font-icon')!
          const box = rect(arrow)
          expect([box.width, box.height]).toEqual([20, 20])
          expect(rect(menuItem('Share')).right - box.right).toBe(12)
          expect(getComputedStyle(arrow).color).toBe(computedColor(`var(${role})`, panel()))
          expect(contrastIn(arrow)).toBeGreaterThanOrEqual(3)
        },
      )

      it('keeps the hover state layer while its submenu is open and the pointer is in the submenu', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        await point('Email')
        await settle()
        expect(menuItem('Share')).toHaveAttribute('data-open')
        expect(getComputedStyle(layer('Share')).opacity).toBe(
          computedStyleOf('opacity-state-hover', (s) => s.opacity),
        )
        expect(getComputedStyle(layer('Preview')).opacity).toBe('0')
      })

      it('greys out the arrow of a disabled item, which opens nothing', async () => {
        render(
          <Page>
            <Nested share={{ isDisabled: true }} />
          </Page>,
        )
        await open()
        const arrow = menuItem('Share').querySelector('.font-icon')!
        expect(getComputedStyle(arrow).color).toBe(
          computedStyleOf('text-on-surface/disabled-content', (s) => s.color),
        )
        await userEvent.click(menuItem('Share'), { force: true })
        await new Promise((resolve) => setTimeout(resolve, 400))
        await settle()
        expect(screen.getAllByRole('menu')).toHaveLength(1)
        expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      })
    })

    describe('focus', () => {
      it('draws the ring on the submenu’s focused item alone, and on the item it opened from once it closes', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await enter()
        const ringed = () =>
          screen
            .getAllByRole('menuitem')
            .filter((el) => getComputedStyle(el).outlineStyle !== 'none')
            .map((el) => el.textContent)
        expect(ringed()).toEqual(['Email'])
        await userEvent.keyboard('{ArrowLeft}')
        await settle()
        expect(document.activeElement).toBe(menuItem('Share'))
        expect(ringed()).toEqual(['Sharearrow_right'])
      })

      it('follows the pointer from menu to submenu and back, with no ring from it', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        expect(document.activeElement).toBe(menuItem('Share'))
        await point('Email')
        expect(document.activeElement).toBe(menuItem('Email'))
        expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('none')
        await point('Preview')
        expect(document.activeElement).toBe(menuItem('Preview'))
        // The keyboard goes on in the menu the pointer is in.
        await userEvent.keyboard('{ArrowDown}')
        expect(document.activeElement).toBe(menuItem('Share'))
      })

      it('leaves the menu open on a click in the submenu that is on no item', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        await userEvent.click(within(list('Share')).getByRole('separator'))
        await userEvent.click(menuItem('Email'))
        await settle()
        expect(trigger()).toHaveAttribute('aria-expanded', 'true')
        expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'true')
      })

      it('searches the submenu’s own items by a typed letter, not the menu’s', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await enter()
        await userEvent.keyboard('m')
        expect(document.activeElement).toBe(menuItem('Message'))
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await userEvent.keyboard('r')
        expect(document.activeElement).toBe(menuItem('Message'))
      })

      it('leaves the focus on the submenu’s item at Tab, as in the menu itself', async () => {
        render(
          <Page>
            <Nested />
            <button>After</button>
          </Page>,
        )
        await enter()
        await userEvent.tab()
        expect(trigger()).toHaveAttribute('aria-expanded', 'true')
        expect(document.activeElement).toBe(menuItem('Email'))
      })

      it('selects nothing in a submenu while the key that opened it is held down', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}{ArrowDown}')
        // Pressed, and repeating as a held key does, before it is let go.
        await userEvent.keyboard('{Enter>5}')
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        await userEvent.keyboard('{/Enter}')
        expect(trigger()).toHaveAttribute('aria-expanded', 'true')
        expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'true')
        expect(document.activeElement).toBe(menuItem('Email'))
      })

      it('takes a space typed in a search for an item as part of it, not as the key that opens the submenu of the item found', async () => {
        render(
          <Page>
            <Overflow
              content={
                <>
                  <MenuItem>Remove</MenuItem>
                  <SubmenuTrigger>
                    <MenuItem>Add space</MenuItem>
                    <MenuPopover>
                      <Menu>
                        <MenuItem>Small</MenuItem>
                      </Menu>
                    </MenuPopover>
                  </SubmenuTrigger>
                  <MenuItem>Add space after</MenuItem>
                </>
              }
            />
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}add')
        // The search is on the item with the submenu when the space comes.
        expect(document.activeElement).toBe(menuItem('Add space'))
        await userEvent.keyboard(' space a')
        expect(document.activeElement).toBe(menuItem('Add space after'))
        expect(menuItem('Add space')).toHaveAttribute('aria-expanded', 'false')
        expect(trigger()).toHaveAttribute('aria-expanded', 'true')
        // Once the search has lapsed, the space is the key again.
        await new Promise((resolve) => setTimeout(resolve, 1000))
        await userEvent.keyboard('{ArrowUp} ')
        expect(menuItem('Add space')).toHaveAttribute('aria-expanded', 'true')
      })

      it('puts the focus back on the trigger once an item of a submenu is clicked', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        await userEvent.click(menuItem('Copy link'))
        expect(trigger()).toHaveAttribute('aria-expanded', 'false')
        await waitFor(() => expect(document.activeElement).toBe(trigger()))
      })
    })

    describe('the pointer', () => {
      it('opens the submenu once it has rested on the item for a moment, React Aria’s 200ms', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await open()
        // Timed in the page, from the pointer's entry into the item, where React Aria starts its
        // delay, to the submenu's appearance: the moves on the item after it, each answered a
        // round trip later, don't restart it, and the answers' lateness counts for nothing.
        let entered = 0
        let opened = 0
        menuItem('Share').addEventListener('pointerenter', () => (entered = performance.now()))
        const observer = new MutationObserver(() => {
          if (!opened && screen.queryAllByRole('menu').length > 1) opened = performance.now()
        })
        observer.observe(document.body, { childList: true, subtree: true })
        await point('Share')
        await screen.findByRole('menu', { name: 'Share' }, { timeout: 2000 })
        observer.disconnect()
        expect(opened - entered).toBeGreaterThanOrEqual(150)
        expect(opened - entered).toBeLessThan(600)
      })

      it('keeps it open while the pointer goes from the item into it, and closes it once the pointer rests on another item of the menu', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        await point('Email')
        await point('Share')
        await point('Copy link')
        await new Promise((resolve) => setTimeout(resolve, 600))
        expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'true')
        await point('Remove')
        await waitFor(() => expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'false'), {
          timeout: 2000,
        })
        await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1))
        expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      })

      it('keeps a submenu the keyboard opened while the rows of the opening menu pass under it at rest', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        // Left low on the first row, where the rows below it are as the menu grows.
        await open()
        await userEvent.hover(menuItem('Preview'), { position: { x: 60, y: 34 } })
        await userEvent.keyboard('{Escape}')
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
        await waitFor(() => expect(document.activeElement).toBe(trigger()))
        await userEvent.keyboard('{Enter}{ArrowDown}{ArrowRight}')
        await screen.findByRole('menu', { name: 'Share' })
        await settle()
        await new Promise((resolve) => setTimeout(resolve, 600))
        expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'true')
        expect(document.activeElement).toBe(menuItem('Email'))
      })
    })

    describe('motion', () => {
      it('fades the submenu in at its full size, on the fast effects spring', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}{ArrowDown}')
        // In the page: a real key's answer can come after the fade, on a busy machine.
        pressKey('ArrowRight')
        await screen.findByRole('menu', { name: 'Share' })
        await waitFor(() => expect(panel('Share').getAnimations().length).toBeGreaterThan(0))
        // Its corners go to the 16px of the menu the focus is in meanwhile; nothing else moves.
        const transitions = (panel('Share').getAnimations() as CSSTransition[]).filter(
          (transition) => !transition.transitionProperty.endsWith('-radius'),
        )
        expect(transitions.map((t) => t.transitionProperty)).toEqual(['opacity'])
        expect(`${Number(transitions[0]!.effect!.getComputedTiming().duration) / 1000}s`).toBe(
          springDuration('fast-effects'),
        )
        for (const transition of transitions) transition.pause()
        for (const transition of transitions) transition.currentTime = 40
        expect(parseFloat(getComputedStyle(panel('Share')).opacity)).toBeLessThan(1)
        const squeezed = rect(panel('Share'))
        for (const transition of transitions) transition.finish()
        await settle()
        expect(getComputedStyle(panel('Share')).opacity).toBe('1')
        expect([squeezed.width, squeezed.height]).toEqual([
          rect(panel('Share')).width,
          rect(panel('Share')).height,
        ])
      })

      it('fades it out at its full size when it closes, then removes it', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await enter()
        const leaving = panel('Share')
        const height = rect(leaving).height
        pressKey('ArrowLeft')
        await waitFor(() => expect(leaving).toHaveAttribute('data-exiting'))
        await waitFor(() => expect(leaving.getAnimations().length).toBeGreaterThan(0))
        // The fade alone, though its corners go back to 8px as the focus leaves it.
        const transitions = leaving.getAnimations() as CSSTransition[]
        expect(transitions.map((t) => t.transitionProperty)).toEqual(['opacity'])
        expect(rect(leaving).height).toBe(height)
        await waitFor(() => expect(leaving).not.toBeInTheDocument())
        expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      })

      it('fades it out with the menu when the menu closes', async () => {
        render(
          <Page>
            <Nested />
          </Page>,
        )
        await rest()
        const [parent, child] = [panel(), panel('Share')]
        pressAt(innerWidth - 10, innerHeight - 10)
        await waitFor(() => expect(parent).toHaveAttribute('data-exiting'))
        await waitFor(() => expect(child).toHaveAttribute('data-exiting'))
        const fading = (el: Element) =>
          (el.getAnimations() as CSSTransition[]).map((transition) => transition.transitionProperty)
        await waitFor(() => expect(fading(child)).toContain('opacity'))
        expect(fading(parent)).toContain('opacity')
        await waitFor(() => expect(parent).not.toBeInTheDocument())
        expect(child).not.toBeInTheDocument()
      })

      it('opens it instantly given shouldSkipAnimation', async () => {
        render(
          <Page>
            <Nested popover={{ shouldSkipAnimation: true }} />
          </Page>,
        )
        await userEvent.tab()
        await userEvent.keyboard('{Enter}{ArrowDown}{ArrowRight}')
        await screen.findByRole('menu', { name: 'Share' })
        expect(panel('Share')).not.toHaveAttribute('data-entering')
        expect(
          (panel('Share').getAnimations() as CSSTransition[]).map((t) => t.transitionProperty),
        ).not.toContain('opacity')
        expect(getComputedStyle(panel('Share')).opacity).toBe('1')
      })
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('gives the panel a ButtonText border and a selected item the highlight fill', async () => {
      render(
        <Page>
          <Overflow
            selectionMode="single"
            defaultSelectedKeys={['name']}
            content={
              <>
                <MenuItem id="name">Name</MenuItem>
                <MenuItem id="date">Date</MenuItem>
              </>
            }
          />
        </Page>,
      )
      await open()
      const style = getComputedStyle(panel())
      expect(style.borderTopWidth).toBe('1px')
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderTopColor).toBe(computedColor('ButtonText', panel()))
      expect(getComputedStyle(menuItem('Name')).backgroundColor).toBe(
        computedColor('Highlight', panel()),
      )
      expect(getComputedStyle(menuItem('Name')).color).toBe(computedColor('HighlightText', panel()))
      expect(getComputedStyle(strokeOf(menuItem('Name'))).stroke).toBe(
        computedColor('HighlightText', panel()),
      )
    })

    it.each(colors)(
      'greys out a disabled item of a %s menu in GrayText, a selected one filled with it',
      async (color) => {
        render(
          <Page>
            <Overflow
              color={color}
              selectionMode="single"
              defaultSelectedKeys={['name']}
              content={
                <>
                  <MenuItem id="name" isDisabled>
                    Name
                  </MenuItem>
                  <MenuItem id="date" isDisabled>
                    Date
                  </MenuItem>
                  <MenuItem id="size">Size</MenuItem>
                </>
              }
            />
          </Page>,
        )
        await open()
        expect(getComputedStyle(menuItem('Date')).color).toBe(computedColor('GrayText', panel()))
        expect(getComputedStyle(menuItem('Name')).backgroundColor).toBe(
          computedColor('GrayText', panel()),
        )
        expect(getComputedStyle(menuItem('Name')).color).toBe(computedColor('Canvas', panel()))
      },
    )

    it('gives a submenu’s panel the same ButtonText border', async () => {
      render(
        <Page>
          <Overflow
            content={
              <SubmenuTrigger>
                <MenuItem>Share</MenuItem>
                <MenuPopover>
                  <Menu>
                    <MenuItem>Email</MenuItem>
                  </Menu>
                </MenuPopover>
              </SubmenuTrigger>
            }
          />
        </Page>,
      )
      await open()
      await userEvent.click(menuItem('Share'))
      await screen.findByRole('menu', { name: 'Share' })
      await settle()
      const style = getComputedStyle(panel('Share'))
      expect(style.borderTopWidth).toBe('1px')
      expect(style.borderTopStyle).toBe('solid')
      expect(style.borderTopColor).toBe(computedColor('ButtonText', panel('Share')))
    })
  })
})
