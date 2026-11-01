import { createRef, useState } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Header,
  I18nProvider,
  Keyboard,
  MenuSection,
  MenuTrigger,
  Separator,
  SubmenuTrigger,
  Text,
  type Key,
  type MenuTriggerProps,
  type PopoverRenderProps,
  type Selection,
} from 'react-aria-components'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import * as exported from '.'
import {
  Menu,
  MenuItem,
  MenuPopover,
  type MenuItemRenderProps,
  type MenuPopoverProps,
  type MenuProps,
} from '.'

/*
 * Behavior and markup that jsdom can check without a stylesheet: attributes,
 * accessible names, DOM structure, keyboard and pointer handling. What a class
 * resolves to visually - colors, size, shape, motion - needs the real stylesheet,
 * so it is checked in menu.browser.test.tsx instead.
 */

type OverflowProps = Partial<MenuProps> & {
  triggerProps?: Partial<MenuTriggerProps>
  popoverProps?: Partial<MenuPopoverProps>
}

/** A menu opened from an icon button named "More", with Preview, Share and Remove items; `props` go on its Menu. */
function Overflow({ triggerProps, popoverProps, ...props }: OverflowProps) {
  return (
    <MenuTrigger {...triggerProps}>
      <IconButton aria-label="More">
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover {...popoverProps}>
        <Menu {...props}>
          <MenuItem id="preview" textValue="Preview">
            <Icon slot="leading" name="visibility" />
            Preview
          </MenuItem>
          <MenuItem id="share" textValue="Share">
            <Icon slot="leading" name="person_add" />
            Share
          </MenuItem>
          <MenuItem id="remove">Remove</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}

/** A menu whose Share item opens a submenu of Email, Copy link and Message, which opens one of Text and Chat; `props` go on the Share submenu's Menu. */
function Nested(props: Partial<MenuProps>) {
  return (
    <MenuTrigger>
      <IconButton aria-label="More">
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover>
        <Menu>
          <MenuItem>Preview</MenuItem>
          <SubmenuTrigger>
            <MenuItem>Share</MenuItem>
            <MenuPopover>
              <Menu {...props}>
                <MenuItem id="email">Email</MenuItem>
                <MenuItem id="copy">Copy link</MenuItem>
                <SubmenuTrigger>
                  <MenuItem id="message">Message</MenuItem>
                  <MenuPopover>
                    <Menu>
                      <MenuItem>Text</MenuItem>
                      <MenuItem>Chat</MenuItem>
                    </Menu>
                  </MenuPopover>
                </SubmenuTrigger>
              </Menu>
            </MenuPopover>
          </SubmenuTrigger>
          <MenuItem>Remove</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}

/** A single-select menu of Name, Date and Size, from a "Sort" icon button, Date selected unless given; `props` go on its Menu. */
function Sort(props: Partial<MenuProps>) {
  return (
    <MenuTrigger>
      <IconButton aria-label="Sort">
        <Icon name="sort" />
      </IconButton>
      <MenuPopover>
        <Menu selectionMode="single" defaultSelectedKeys={['date']} {...props}>
          <MenuItem id="name">Name</MenuItem>
          <MenuItem id="date">Date</MenuItem>
          <MenuItem id="size">Size</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}

/** The trigger, which the menu hides from assistive technology with the rest of the page while it is open. */
const trigger = (name = 'More') => screen.getByRole('button', { name, hidden: true })
const menuItem = (name: string | RegExp) => screen.getByRole('menuitem', { name })

/* The fake clock a test may have put the submenu's delay on, back to the real one. Testing Library
 * waits a turn of the clock after each event, and turns a fake one only when it is Jest's: a `jest`
 * of Vitest's turns it. */
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
const radio = (name: string | RegExp) => screen.getByRole('menuitemradio', { name })
const checkbox = (name: string | RegExp) => screen.getByRole('menuitemcheckbox', { name })
const isOpen = (name = 'More') => trigger(name).getAttribute('aria-expanded') === 'true'
/** The keys a mock `onAction` or `onSelectionChange` was called with, in order, a selection as an array. */
const calls = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.map(([key]) => (key instanceof Set ? [...key] : key))
/** Waits out the second in which React Aria takes letters typed in a menu as one search. */
const pause = () => new Promise((resolve) => setTimeout(resolve, 1000))
/** The panel, the MenuPopover around the list in the menu role. */
const panelOf = (menu: HTMLElement) => menu.parentElement!

describe('Menu', () => {
  describe('trigger', () => {
    it('gives the menu to the button in the MenuTrigger, as it is, with aria-haspopup and aria-expanded, and has no element of its own', () => {
      const { container } = render(<Overflow />)
      expect(trigger()).toHaveAttribute('aria-haspopup', 'true')
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      expect(trigger()).toHaveAttribute('type', 'button')
      expect(trigger().parentElement).toBe(container)
    })

    it('renders no panel while closed', () => {
      render(<Overflow />)
      expect(screen.queryByRole('menu', { hidden: true })).not.toBeInTheDocument()
      expect(screen.queryByRole('dialog', { hidden: true })).not.toBeInTheDocument()
    })

    it('opens from any React Aria button, such as a Button with a label', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <Button variant="tonal">Options</Button>
          <MenuPopover>
            <Menu>
              <MenuItem>Preview</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger('Options'))
      expect(screen.getByRole('menu', { name: 'Options' })).toBeInTheDocument()
    })

    it('still calls the trigger’s own onPress as it opens the menu', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More" onPress={onPress}>
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem>Preview</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      expect(onPress).toHaveBeenCalledTimes(1)
      expect(isOpen()).toBe(true)
    })

    it('reports the trigger pressed while the menu is open', async () => {
      const user = userEvent.setup()
      render(<Overflow />)
      await user.click(trigger())
      expect(trigger()).toHaveAttribute('data-pressed')
      await user.keyboard('{Escape}')
      expect(trigger()).not.toHaveAttribute('data-pressed')
    })

    it('cannot open the menu from a disabled trigger, which takes no focus', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More" isDisabled>
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem>Preview</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      expect(trigger()).toBeDisabled()
      await user.click(trigger())
      await user.tab()
      expect(trigger()).not.toHaveFocus()
      expect(isOpen()).toBe(false)
    })
  })

  describe('open', () => {
    it('opens on a click as a menu named by its trigger, which controls it, with the focus on the menu and on no item', async () => {
      const user = userEvent.setup()
      render(<Overflow />)
      await user.click(trigger())
      expect(isOpen()).toBe(true)
      const menu = screen.getByRole('menu', { name: 'More' })
      expect(trigger()).toHaveAttribute('aria-controls', menu.id)
      expect(menu).toHaveFocus()
      expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
        'visibilityPreview',
        'person_addShare',
        'Remove',
      ])
      for (const item of screen.getAllByRole('menuitem'))
        expect(item).not.toHaveAttribute('data-focused')
    })

    it('renders its panel as React Aria’s Popover, a dialog named by the trigger, out of the trigger’s own tree', async () => {
      const user = userEvent.setup()
      const { container } = render(<Overflow />)
      await user.click(trigger())
      const panel = panelOf(screen.getByRole('menu'))
      expect(panel).toBe(screen.getByRole('dialog', { name: 'More' }))
      expect(panel).toHaveAttribute('data-trigger', 'MenuTrigger')
      expect(panel).toHaveAttribute('data-placement', 'bottom')
      expect(container).not.toContainElement(panel)
    })

    it('is modal: hides the rest of the page from assistive technology while it is open, and shows it again once closed', async () => {
      const user = userEvent.setup()
      const { container } = render(<Overflow />)
      await user.click(trigger())
      expect(container).toHaveAttribute('aria-hidden', 'true')
      expect(screen.queryByRole('button', { name: 'More' })).not.toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(container).not.toHaveAttribute('aria-hidden')
    })

    it('focuses the item under the pointer, with no keyboard focus on it', async () => {
      const user = userEvent.setup()
      render(<Overflow />)
      await user.click(trigger())
      await user.hover(menuItem('Share'))
      expect(menuItem('Share')).toHaveFocus()
      expect(menuItem('Share')).toHaveAttribute('data-hovered')
      expect(menuItem('Share')).toHaveAttribute('data-focused')
      expect(menuItem('Share')).not.toHaveAttribute('data-focus-visible')
    })

    it('closes once an item is pressed, calling its onAction and the Menu’s with its id, with the focus back on the trigger', async () => {
      const onAction = vi.fn()
      const onItemAction = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu onAction={onAction}>
              <MenuItem id="preview">Preview</MenuItem>
              <MenuItem id="share" onAction={onItemAction}>
                Share
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      await user.click(menuItem('Share'))
      expect(onItemAction).toHaveBeenCalledTimes(1)
      expect(calls(onAction)).toEqual(['share'])
      expect(isOpen()).toBe(false)
      await waitFor(() => expect(trigger()).toHaveFocus())
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('closes on a click outside', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Overflow />
          <button>Elsewhere</button>
        </>,
      )
      await user.click(trigger())
      await user.click(screen.getByRole('button', { name: 'Elsewhere', hidden: true }))
      expect(isOpen()).toBe(false)
    })

    it('leaves whether it is open to isOpen, telling onOpenChange', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(<Overflow triggerProps={{ isOpen: false, onOpenChange }} />)
      await user.click(trigger())
      expect(onOpenChange).toHaveBeenLastCalledWith(true)
      expect(isOpen()).toBe(false)
      rerender(<Overflow triggerProps={{ isOpen: true, onOpenChange }} />)
      expect(screen.getByRole('menu')).toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(onOpenChange).toHaveBeenLastCalledWith(false)
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('opens at first given defaultOpen', () => {
      render(<Overflow triggerProps={{ defaultOpen: true }} />)
      expect(screen.getByRole('menu', { name: 'More' })).toBeInTheDocument()
    })

    it('opens on a long press alone given trigger="longPress", or Alt with an arrow key', async () => {
      const user = userEvent.setup()
      render(<Overflow triggerProps={{ trigger: 'longPress' }} />)
      await user.click(trigger())
      expect(isOpen()).toBe(false)
      await user.keyboard('{Enter}')
      expect(isOpen()).toBe(false)
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
      expect(isOpen()).toBe(true)
      expect(menuItem('Preview')).toHaveFocus()
    })
  })

  describe('keyboard', () => {
    it.each([
      ['{Enter}', 'Preview'],
      [' ', 'Preview'],
      ['{ArrowDown}', 'Preview'],
      ['{ArrowUp}', 'Remove'],
    ])('opens with %s from the trigger, with %s focused', async (key, name) => {
      const user = userEvent.setup()
      render(<Overflow />)
      await user.tab()
      expect(trigger()).toHaveFocus()
      await user.keyboard(key)
      expect(isOpen()).toBe(true)
      expect(menuItem(name)).toHaveFocus()
      expect(menuItem(name)).toHaveAttribute('data-focus-visible')
    })

    it('moves the focus with the arrow keys, round from either end, and with Home, End and the page keys', async () => {
      const user = userEvent.setup()
      render(<Overflow />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(menuItem('Preview')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(menuItem('Share')).toHaveFocus()
      await user.keyboard('{ArrowUp}{ArrowUp}')
      expect(menuItem('Remove')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(menuItem('Preview')).toHaveFocus()
      await user.keyboard('{End}')
      expect(menuItem('Remove')).toHaveFocus()
      await user.keyboard('{Home}')
      expect(menuItem('Preview')).toHaveFocus()
      await user.keyboard('{PageDown}')
      expect(menuItem('Remove')).toHaveFocus()
      await user.keyboard('{PageUp}')
      expect(menuItem('Preview')).toHaveFocus()
    })

    it('moves the focus from the menu itself, opened by a click, to the first item with Arrow Down and the last with Arrow Up', async () => {
      const user = userEvent.setup()
      render(<Overflow />)
      await user.click(trigger())
      await user.keyboard('{ArrowDown}')
      expect(menuItem('Preview')).toHaveFocus()
      await user.keyboard('{Escape}')
      await user.click(trigger())
      await user.keyboard('{ArrowUp}')
      expect(menuItem('Remove')).toHaveFocus()
    })

    it('finds an item by the letters typed: its textValue, or its children when they are text alone', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem>Preview</MenuItem>
              <MenuItem textValue="Copy">
                <Icon slot="leading" name="content_copy" />
                <Text slot="label">Copy</Text>
                <Text slot="description">To the clipboard</Text>
                <Keyboard>⌘C</Keyboard>
              </MenuItem>
              <MenuItem textValue="Download">
                {({ isDisabled }) => (isDisabled ? 'Unavailable' : 'Download')}
              </MenuItem>
              <MenuItem aria-label="Settings" textValue="Settings">
                <Icon slot="leading" name="settings" />
              </MenuItem>
              <MenuItem>Delete</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.tab()
      await user.keyboard('{Enter}c')
      expect(menuItem('Copy')).toHaveFocus()
      await pause()
      await user.keyboard('do')
      expect(menuItem('Download')).toHaveFocus()
      await pause()
      await user.keyboard('se')
      expect(menuItem('Settings')).toHaveFocus()
      await pause()
      await user.keyboard('de')
      expect(menuItem('Delete')).toHaveFocus()
      await pause()
      await user.keyboard('p')
      expect(menuItem('Preview')).toHaveFocus()
    })

    it('finds no item by the letters typed whose children are not text alone and that has no textValue, which its types then require: a label with an icon or a keyboard command, or a function', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              {/* @ts-expect-error an item with an icon beside its text needs a textValue */}
              <MenuItem>
                <Icon slot="leading" name="visibility" />
                Preview
              </MenuItem>
              {/* @ts-expect-error an item of parts needs a textValue */}
              <MenuItem>
                <Text slot="label">Copy</Text>
                <Keyboard>⌘C</Keyboard>
              </MenuItem>
              {/* @ts-expect-error an item whose children are a function needs a textValue */}
              <MenuItem>{() => 'Download'}</MenuItem>
              <MenuItem>Delete</MenuItem>
              <MenuItem>Remove</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.tab()
      await user.keyboard('{ArrowUp}')
      expect(menuItem('Remove')).toHaveFocus()
      await user.keyboard('p')
      expect(menuItem('Remove')).toHaveFocus()
      await pause()
      await user.keyboard('c')
      expect(menuItem('Remove')).toHaveFocus()
      // Past Download, to the item whose children are text alone.
      await pause()
      await user.keyboard('d')
      expect(menuItem('Delete')).toHaveFocus()
    })

    it('selects the focused item with Enter or Space, calling its onAction and closing, with the focus back on the trigger', async () => {
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(<Overflow onAction={onAction} />)
      await user.tab()
      await user.keyboard('{Enter}{ArrowDown}{Enter}')
      expect(calls(onAction)).toEqual(['share'])
      expect(isOpen()).toBe(false)
      await waitFor(() => expect(trigger()).toHaveFocus())
      await user.keyboard('{Enter}{End} ')
      expect(calls(onAction)).toEqual(['share', 'remove'])
      expect(isOpen()).toBe(false)
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('closes with Escape, with the focus back on the trigger', async () => {
      const user = userEvent.setup()
      render(<Overflow />)
      await user.tab()
      await user.keyboard('{Enter}{Escape}')
      expect(isOpen()).toBe(false)
      // React Aria gives the focus back a frame later.
      await waitFor(() => expect(trigger()).toHaveFocus())
    })
  })

  describe('disabled items', () => {
    it('disables an item with aria-disabled, skipped by the keyboard and deaf to presses', async () => {
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem isDisabled onAction={onAction}>
                Redo
              </MenuItem>
              <MenuItem>Undo</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.tab()
      await user.keyboard('{Enter}')
      const redo = menuItem('Redo')
      expect(redo).toHaveAttribute('aria-disabled', 'true')
      expect(redo).toHaveAttribute('data-disabled')
      expect(menuItem('Undo')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(menuItem('Undo')).toHaveFocus()
      await user.click(redo)
      expect(onAction).not.toHaveBeenCalled()
      expect(isOpen()).toBe(true)
    })

    it('disables the items whose ids the Menu’s disabledKeys holds', async () => {
      const user = userEvent.setup()
      render(<Overflow disabledKeys={['share']} />)
      await user.click(trigger())
      expect(menuItem('Share')).toHaveAttribute('aria-disabled', 'true')
      expect(menuItem('Preview')).not.toHaveAttribute('aria-disabled')
    })
  })

  describe('selection', () => {
    it('puts the items of a single-select menu in the menuitemradio role, the selected one checked', async () => {
      const user = userEvent.setup()
      render(<Sort />)
      await user.click(trigger('Sort'))
      expect(radio('Date')).toHaveAttribute('aria-checked', 'true')
      expect(radio('Date')).toHaveAttribute('data-selected')
      for (const name of ['Name', 'Size']) {
        expect(radio(name)).toHaveAttribute('aria-checked', 'false')
        expect(radio(name)).not.toHaveAttribute('data-selected')
      }
    })

    it('puts the items of a multi-select menu in the menuitemcheckbox role', async () => {
      const user = userEvent.setup()
      render(<Sort selectionMode="multiple" defaultSelectedKeys={['name', 'size']} />)
      await user.click(trigger('Sort'))
      expect(checkbox('Name')).toHaveAttribute('aria-checked', 'true')
      expect(checkbox('Date')).toHaveAttribute('aria-checked', 'false')
      expect(checkbox('Size')).toHaveAttribute('aria-checked', 'true')
    })

    it('opens a select menu with the focus on its selected item, the first of its selected keys as given, not as the items are', async () => {
      const user = userEvent.setup()
      render(<Sort selectionMode="multiple" defaultSelectedKeys={['size', 'date']} />)
      await user.click(trigger('Sort'))
      expect(checkbox('Size')).toHaveFocus()
      expect(checkbox('Size')).not.toHaveAttribute('data-focus-visible')
    })

    it('selects an item of a single-select menu on a click, telling onSelectionChange, and closes', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      render(<Sort onSelectionChange={onSelectionChange} />)
      await user.click(trigger('Sort'))
      await user.click(radio('Size'))
      expect(calls(onSelectionChange)).toEqual([['size']])
      expect(isOpen('Sort')).toBe(false)
    })

    it('opens with its defaultSelectedKeys each time: the panel is rendered afresh, so a selection it keeps itself lasts while it is open', async () => {
      const user = userEvent.setup()
      render(<Sort selectionMode="multiple" />)
      await user.click(trigger('Sort'))
      await user.click(checkbox('Size'))
      expect(checkbox('Size')).toHaveAttribute('aria-checked', 'true')
      await user.keyboard('{Escape}')
      await user.click(trigger('Sort'))
      expect(checkbox('Size')).toHaveAttribute('aria-checked', 'false')
      expect(checkbox('Date')).toHaveAttribute('aria-checked', 'true')
    })

    it('selects with Space and stays open, and selects with Enter and closes', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      render(<Sort onSelectionChange={onSelectionChange} />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(radio('Date')).toHaveFocus()
      await user.keyboard('{ArrowDown} ')
      expect(radio('Size')).toHaveAttribute('aria-checked', 'true')
      expect(isOpen('Sort')).toBe(true)
      await user.keyboard('{Home}{Enter}')
      expect(calls(onSelectionChange)).toEqual([['size'], ['name']])
      expect(isOpen('Sort')).toBe(false)
    })

    it('keeps a multi-select menu open while its items are clicked, each toggled', async () => {
      const user = userEvent.setup()
      render(<Sort selectionMode="multiple" defaultSelectedKeys={['date']} />)
      await user.click(trigger('Sort'))
      await user.click(checkbox('Name'))
      await user.click(checkbox('Date'))
      expect(isOpen('Sort')).toBe(true)
      expect(checkbox('Name')).toHaveAttribute('aria-checked', 'true')
      expect(checkbox('Date')).toHaveAttribute('aria-checked', 'false')
    })

    it('follows selectedKeys, the selection kept by the caller', async () => {
      function Controlled() {
        const [selected, setSelected] = useState<Selection>(new Set<Key>(['name']))
        return <Sort selectedKeys={selected} onSelectionChange={setSelected} />
      }
      const user = userEvent.setup()
      render(<Controlled />)
      await user.click(trigger('Sort'))
      expect(radio('Name')).toHaveAttribute('aria-checked', 'true')
      await user.click(radio('Size'))
      await user.click(trigger('Sort'))
      expect(radio('Size')).toHaveAttribute('aria-checked', 'true')
      expect(radio('Name')).toHaveAttribute('aria-checked', 'false')
    })

    it('lets a section select its own items apart from the menu’s, or none of them', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="Format">
            <Icon name="format_size" />
          </IconButton>
          <MenuPopover>
            <Menu selectionMode="single" defaultSelectedKeys={['single']}>
              <MenuSection>
                <MenuItem id="single">Single</MenuItem>
                <MenuItem id="double">Double</MenuItem>
              </MenuSection>
              <MenuSection selectionMode="none">
                <MenuItem id="custom">Custom spacing</MenuItem>
              </MenuSection>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger('Format'))
      expect(radio('Single')).toHaveAttribute('aria-checked', 'true')
      expect(radio('Double')).toHaveAttribute('aria-checked', 'false')
      expect(menuItem('Custom spacing')).not.toHaveAttribute('aria-checked')
    })

    it('draws a checkmark of its own first in every item, to trace once it is selected, out of the accessible name', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="Sort">
            <Icon name="sort" />
          </IconButton>
          <MenuPopover>
            <Menu selectionMode="single" defaultSelectedKeys={['name']}>
              <MenuItem id="name">Name</MenuItem>
              <MenuItem id="date" textValue="Date">
                <Icon slot="leading" name="schedule" />
                Date
                <Icon slot="trailing" name="expand_more" />
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger('Sort'))
      expect(radio('Name')).toHaveAccessibleName('Name')
      for (const name of ['Name', 'Date']) {
        const marks = radio(name).querySelectorAll('svg')
        expect(marks).toHaveLength(1)
        expect(marks[0]).toHaveAttribute('aria-hidden', 'true')
      }
      // In a box of its own before what is written in the item, which it holds none of: the
      // stylesheet draws it over what is written before the label.
      const box = radio('Date').querySelector('svg')!.parentElement!
      expect(box.parentElement).toBe(radio('Date'))
      expect(box.children).toHaveLength(1)
      expect(box.nextElementSibling).toBe(screen.getByText('schedule'))
    })
  })

  describe('parts', () => {
    it('draws its label and its parts in the slots they are given as they are written, named by its label and described by its description and keyboard command', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem textValue="Copy">
                <Icon slot="leading" name="content_copy" />
                <Text slot="label">Copy</Text>
                <Text slot="description">To the clipboard</Text>
                <Keyboard>⌘C</Keyboard>
                <Icon slot="trailing" name="open_in_new" />
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      const copy = menuItem('Copy')
      expect(copy).toHaveTextContent('content_copyCopyTo the clipboard⌘Copen_in_new')
      expect(copy).toHaveAccessibleName('Copy')
      expect(copy).toHaveAccessibleDescription('To the clipboard ⌘C')
      const written = [
        screen.getByText('content_copy'),
        screen.getByText('Copy'),
        screen.getByText('To the clipboard'),
        screen.getByText('⌘C'),
        screen.getByText('open_in_new'),
      ]
      // Each its own child of the item, after the item's own checkmark, in the order written.
      const box = copy.querySelector('svg')!.parentElement!
      expect([...copy.children].slice([...copy.children].indexOf(box) + 1)).toEqual(written)
      expect(written[1]).toHaveAttribute('slot', 'label')
      expect(written[2]).toHaveAttribute('slot', 'description')
      expect(written[3]!.tagName).toBe('KBD')
      for (const icon of [written[0], written[4]])
        expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('takes React Aria’s Text in the leading and trailing slots too, and its Keyboard in the trailing slot, which describes it as one in none does', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem textValue="Paste">
                <Text slot="leading">P</Text>
                <Text slot="label">Paste</Text>
                <Keyboard slot="trailing">⌘V</Keyboard>
                <Text slot="trailing">
                  <Icon name="new_releases" />
                  New
                </Text>
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      const paste = menuItem('Paste')
      expect(paste).toHaveAccessibleName('Paste')
      expect(paste).toHaveAccessibleDescription('⌘V')
      expect(screen.getByText('P')).toHaveAttribute('slot', 'leading')
      expect(screen.getByText('⌘V')).toHaveAttribute('slot', 'trailing')
      expect(screen.getByText('New')).toHaveAttribute('slot', 'trailing')
    })

    it.each([
      ['a Text', <Text slot="trailng">New</Text>],
      ['a Keyboard', <Keyboard slot="trailng">⌘V</Keyboard>],
      ['an Icon', <Icon slot="trailng" name="open_in_new" />],
    ])('throws React Aria’s error for %s in a slot neither it nor the item has', (_, part) => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() =>
        render(
          <Menu aria-label="Edit">
            <MenuItem textValue="Paste">{part}</MenuItem>
          </Menu>,
        ),
      ).toThrow('Invalid slot "trailng".')
      error.mockRestore()
    })

    it('draws its children as written, with no label of its own: text alone, or by an icon, names it', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem>Remove</MenuItem>
              <MenuItem textValue="Bold">
                <Icon slot="leading" name="format_bold" />
                Bold
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      for (const name of ['Remove', 'Bold']) {
        const item = menuItem(name)
        expect(item.querySelector('[slot="label"]')).not.toBeInTheDocument()
        expect(item).not.toHaveAttribute('aria-labelledby')
        expect(item.lastChild).toHaveProperty('nodeType', Node.TEXT_NODE)
        expect(item.lastChild).toHaveProperty('textContent', name)
      }
    })

    it('draws no label in an item of parts alone, which its aria-label names', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem aria-label="Settings" textValue="Settings">
                <Icon slot="leading" name="settings" />
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      expect(menuItem('Settings').querySelector('[slot="label"]')).not.toBeInTheDocument()
      expect(menuItem('Settings')).not.toHaveAttribute('aria-labelledby')
    })

    it('takes its parts as a function too, called with the state React Aria reports of it alone', async () => {
      const user = userEvent.setup()
      const parts = ({ isSelected, isDisabled }: MenuItemRenderProps) => (
        <>
          <Text slot="label">{isDisabled ? 'Unavailable' : 'Available'}</Text>
          <span slot="trailing">{isSelected ? 'On' : 'Off'}</span>
        </>
      )
      const more = vi.fn(({ hasSubmenu }: MenuItemRenderProps) => (hasSubmenu ? 'More' : 'Less'))
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu selectionMode="multiple" defaultSelectedKeys={['second', 'docs']}>
              <MenuItem id="first" textValue="Available">
                {parts}
              </MenuItem>
              <MenuItem id="second" textValue="Unavailable" isDisabled>
                {parts}
              </MenuItem>
              <SubmenuTrigger>
                <MenuItem id="more" textValue="More">
                  {more}
                </MenuItem>
                <MenuPopover>
                  <Menu>
                    <MenuItem>Inner</MenuItem>
                  </Menu>
                </MenuPopover>
              </SubmenuTrigger>
              <MenuItem id="docs" textValue="Docs" href="#docs">
                {({ isSelected }) => `Docs ${isSelected}`}
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      expect(checkbox('Available')).toHaveTextContent('AvailableOff')
      const second = checkbox('Unavailable')
      // What the function returns is drawn in the item as it is.
      expect(screen.getByText('On')).toBe(second.lastElementChild)
      // In a SubmenuTrigger, each call is told the item has a submenu: none is made at rest.
      expect(menuItem('More')).toHaveAttribute('aria-haspopup', 'menu')
      expect(more).toHaveBeenCalled()
      for (const [state] of more.mock.calls) expect(state).toMatchObject({ hasSubmenu: true })
      // Text returned is drawn as it is, the item's own. A link, it is passed the same.
      expect(screen.getByText('More')).toBe(menuItem('More'))
      const link = checkbox('Docs true')
      expect(link.tagName).toBe('A')
    })

    it('calls that function again as its state changes: the keyboard focuses it visibly, and the pointer hovers it', async () => {
      const user = userEvent.setup()
      const state = ({ isFocused, isFocusVisible, isHovered, isSelected }: MenuItemRenderProps) =>
        `${isHovered ? ' hovered' : ''}${isFocused ? ' focused' : ''}${isFocusVisible ? ' visible' : ''}${isSelected ? ' selected' : ''}`
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu selectionMode="single" defaultSelectedKeys={['share']}>
              <MenuItem id="preview" textValue="Preview">
                {(props) => `Preview${state(props)}`}
              </MenuItem>
              <MenuItem id="share" textValue="Share">
                {(props) => (
                  <>
                    <Icon slot="leading" name="person_add" />
                    {`Share${state(props)}`}
                  </>
                )}
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.tab()
      await user.keyboard('{Enter}')
      const [preview, share] = screen.getAllByRole('menuitemradio')
      expect(preview).toHaveAccessibleName('Preview')
      expect(share).toHaveAccessibleName('Share focused visible selected')
      await user.keyboard('{ArrowUp}')
      expect(preview).toHaveAccessibleName('Preview focused visible')
      expect(share).toHaveAccessibleName('Share selected')
      // The pointer does not take the focus from the keyboard in use.
      await user.hover(share!)
      expect(preview).toHaveAccessibleName('Preview focused visible')
      expect(share).toHaveAccessibleName('Share hovered selected')
      // What the function returns is drawn as plain children are, after the item's own.
      expect(share!.querySelector(':scope > .state-layer')).toBeInTheDocument()
      expect(share!.querySelector('svg')!.parentElement!.nextElementSibling).toBe(
        screen.getByText('person_add'),
      )
    })
  })

  describe('sections', () => {
    it('groups items in React Aria’s MenuSection, named by its Header, which is otherwise presentational', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="Format">
            <Icon name="format_bold" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuSection>
                <Header>Style</Header>
                <MenuItem>Bold</MenuItem>
                <MenuItem>Italic</MenuItem>
              </MenuSection>
              <MenuSection aria-label="Alignment">
                <MenuItem>Left</MenuItem>
              </MenuSection>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger('Format'))
      const style = screen.getByRole('group', { name: 'Style' })
      expect(style).toContainElement(menuItem('Bold'))
      expect(style).toContainElement(menuItem('Italic'))
      expect(screen.getByText('Style')).toHaveAttribute('role', 'presentation')
      expect(screen.getByRole('group', { name: 'Alignment' })).toContainElement(menuItem('Left'))
    })

    it('draws React Aria’s Separator as a separator the keyboard skips', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem>Undo</MenuItem>
              <Separator />
              <MenuItem>Cut</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.tab()
      await user.keyboard('{Enter}{ArrowDown}')
      expect(menuItem('Cut')).toHaveFocus()
      const separator = screen.getByRole('separator')
      expect(separator.tagName).toBe('DIV')
      expect(separator).toBeEmptyDOMElement()
    })
  })

  describe('submenus', () => {
    it('marks the MenuItem of a SubmenuTrigger as opening a menu, collapsed, with an arrow at its end, and renders no submenu yet', async () => {
      const user = userEvent.setup()
      render(<Nested />)
      await user.click(trigger())
      const share = menuItem('Share')
      expect(share).toHaveAttribute('aria-haspopup', 'menu')
      expect(share).toHaveAttribute('aria-expanded', 'false')
      expect(share).toHaveAttribute('data-has-submenu')
      expect(share.lastElementChild).toHaveTextContent('arrow_right')
      expect(share.lastElementChild).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getAllByRole('menu')).toHaveLength(1)
      expect(screen.queryByText('Email')).not.toBeInTheDocument()
      // Any other item has no arrow.
      expect(menuItem('Preview')).not.toHaveTextContent('arrow_right')
    })

    it('ends an item that has a submenu with the arrow, after an icon of its own too', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <SubmenuTrigger>
                <MenuItem textValue="Share">
                  Share
                  <Icon slot="trailing" name="share" />
                </MenuItem>
                <MenuPopover>
                  <Menu>
                    <MenuItem>Email</MenuItem>
                  </Menu>
                </MenuPopover>
              </SubmenuTrigger>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      const icons = [...menuItem('Share').querySelectorAll('.font-icon')].map(
        (icon) => icon.textContent,
      )
      expect(icons).toEqual(['share', 'arrow_right'])
    })

    it('opens the submenu on a click, as a menu named by its item, which controls it, leaving the menu open', async () => {
      const user = userEvent.setup()
      render(<Nested />)
      await user.click(trigger())
      await user.click(menuItem('Share'))
      const submenu = screen.getByRole('menu', { name: 'Share' })
      expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'true')
      expect(menuItem('Share')).toHaveAttribute('data-open')
      expect(menuItem('Share')).toHaveAttribute('aria-controls', submenu.id)
      expect(panelOf(submenu)).toHaveAttribute('data-trigger', 'SubmenuTrigger')
      expect(screen.getByRole('menu', { name: 'More' })).toBeInTheDocument()
      expect(isOpen()).toBe(true)
      // A second click leaves it open.
      await user.click(menuItem('Share'))
      expect(screen.getByRole('menu', { name: 'Share' })).toBeInTheDocument()
    })

    it.each(['{ArrowRight}', '{Enter}', ' '])(
      'opens the submenu of the focused item with %s, with the focus on its first item',
      async (key) => {
        const user = userEvent.setup()
        render(<Nested />)
        await user.tab()
        await user.keyboard(`{Enter}{ArrowDown}${key}`)
        expect(screen.getByRole('menu', { name: 'Share' })).toBeInTheDocument()
        expect(menuItem('Email')).toHaveFocus()
        expect(menuItem('Email')).toHaveAttribute('data-focus-visible')
      },
    )

    it('moves through the submenu’s own items with the arrow keys, Home and End, and finds them by typed letters', async () => {
      const user = userEvent.setup()
      render(<Nested />)
      await user.tab()
      await user.keyboard('{Enter}{ArrowDown}{ArrowRight}{ArrowDown}')
      expect(menuItem('Copy link')).toHaveFocus()
      await user.keyboard('{End}')
      expect(menuItem('Message')).toHaveFocus()
      await user.keyboard('{Home}')
      expect(menuItem('Email')).toHaveFocus()
      // Remove is the menu's, not the submenu's.
      await user.keyboard('r')
      expect(menuItem('Email')).toHaveFocus()
      await pause()
      await user.keyboard('c')
      expect(menuItem('Copy link')).toHaveFocus()
    })

    it.each(['{ArrowLeft}', '{Escape}'])(
      'closes the submenu alone with %s, back to its item, which has the focus again',
      async (key) => {
        const user = userEvent.setup()
        render(<Nested />)
        await user.tab()
        await user.keyboard(`{Enter}{ArrowDown}{ArrowRight}${key}`)
        expect(screen.queryByRole('menu', { name: 'Share' })).not.toBeInTheDocument()
        expect(menuItem('Share')).toHaveFocus()
        expect(menuItem('Share')).toHaveAttribute('aria-expanded', 'false')
        expect(isOpen()).toBe(true)
      },
    )

    it('opens and closes the submenu with the arrow keys the other way round in a right-to-left layout', async () => {
      const user = userEvent.setup()
      render(
        <I18nProvider locale="he-IL">
          <Nested />
        </I18nProvider>,
      )
      await user.tab()
      await user.keyboard('{Enter}{ArrowDown}{ArrowRight}')
      expect(screen.queryByRole('menu', { name: 'Share' })).not.toBeInTheDocument()
      await user.keyboard('{ArrowLeft}')
      expect(menuItem('Email')).toHaveFocus()
      await user.keyboard('{ArrowRight}')
      expect(menuItem('Share')).toHaveFocus()
      expect(screen.queryByRole('menu', { name: 'Share' })).not.toBeInTheDocument()
    })

    it('closes the whole menu once an item of a submenu is clicked, calling the submenu’s onAction, with the focus back on the trigger', async () => {
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(<Nested onAction={onAction} />)
      await user.click(trigger())
      await user.click(menuItem('Share'))
      await user.click(menuItem('Copy link'))
      expect(calls(onAction)).toEqual(['copy'])
      expect(isOpen()).toBe(false)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('closes the whole menu once an item of a submenu is selected with Enter', async () => {
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(<Nested onAction={onAction} />)
      await user.tab()
      await user.keyboard('{Enter}{ArrowDown}{ArrowRight}{Enter}')
      expect(calls(onAction)).toEqual(['email'])
      expect(isOpen()).toBe(false)
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('opens a submenu of a submenu, and closes one level at a time', async () => {
      const user = userEvent.setup()
      render(<Nested />)
      await user.tab()
      await user.keyboard('{Enter}{ArrowDown}{ArrowRight}{End}{ArrowRight}')
      expect(screen.getByRole('menu', { name: 'Message' })).toBeInTheDocument()
      expect(menuItem('Text')).toHaveFocus()
      expect(screen.getAllByRole('menu')).toHaveLength(3)
      await user.keyboard('{Escape}')
      expect(screen.getAllByRole('menu')).toHaveLength(2)
      expect(menuItem('Message')).toHaveFocus()
      await user.keyboard('{ArrowLeft}')
      expect(screen.getAllByRole('menu')).toHaveLength(1)
      expect(menuItem('Share')).toHaveFocus()
      await user.keyboard('{Escape}')
      expect(isOpen()).toBe(false)
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('closes every level once the menu closes on a click outside', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Nested />
          <button>Elsewhere</button>
        </>,
      )
      await user.click(trigger())
      await user.click(menuItem('Share'))
      await user.click(screen.getByRole('button', { name: 'Elsewhere', hidden: true }))
      expect(isOpen()).toBe(false)
      expect(screen.queryByRole('menu', { hidden: true })).not.toBeInTheDocument()
      await user.click(trigger())
      expect(screen.getAllByRole('menu')).toHaveLength(1)
    })

    it('has one submenu open in a menu at a time', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <SubmenuTrigger>
                <MenuItem>Share</MenuItem>
                <MenuPopover>
                  <Menu>
                    <MenuItem>Email</MenuItem>
                  </Menu>
                </MenuPopover>
              </SubmenuTrigger>
              <SubmenuTrigger>
                <MenuItem>Move</MenuItem>
                <MenuPopover>
                  <Menu>
                    <MenuItem>Archive</MenuItem>
                  </Menu>
                </MenuPopover>
              </SubmenuTrigger>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      await user.click(menuItem('Share'))
      await user.click(menuItem('Move'))
      await waitFor(() =>
        expect(screen.queryByRole('menu', { name: 'Share' })).not.toBeInTheDocument(),
      )
      expect(screen.getByRole('menu', { name: 'Move' })).toBeInTheDocument()
    })

    it('never opens the submenu of a disabled item, which the keyboard skips', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <MenuPopover>
            <Menu>
              <MenuItem>Preview</MenuItem>
              <SubmenuTrigger>
                <MenuItem isDisabled>Share</MenuItem>
                <MenuPopover>
                  <Menu>
                    <MenuItem>Email</MenuItem>
                  </Menu>
                </MenuPopover>
              </SubmenuTrigger>
            </Menu>
          </MenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      await user.click(menuItem('Share'))
      await user.hover(menuItem('Share'))
      await new Promise((resolve) => setTimeout(resolve, 300))
      expect(screen.queryByRole('menu', { name: 'Share' })).not.toBeInTheDocument()
      await user.keyboard('{Home}{ArrowDown}')
      expect(menuItem('Preview')).toHaveFocus()
    })

    it('opens the submenu once the pointer has rested on its item for a moment, not at once', async () => {
      // On a fake clock: on the real one, a worker stalled for React Aria's 200ms has it open.
      vi.useFakeTimers()
      vi.stubGlobal('jest', { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) })
      const user = userEvent.setup({ delay: null })
      render(<Nested />)
      await user.click(trigger())
      await user.hover(menuItem('Share'))
      expect(screen.queryByRole('menu', { name: 'Share' })).not.toBeInTheDocument()
      act(() => vi.advanceTimersByTime(200))
      expect(screen.getByRole('menu', { name: 'Share' })).toBeInTheDocument()
      // The focus stays on the item until the pointer goes into the submenu.
      expect(menuItem('Share')).toHaveFocus()
    })

    it('selects a submenu’s items by its own selectionMode, apart from the menu', async () => {
      const user = userEvent.setup()
      render(<Nested selectionMode="single" defaultSelectedKeys={['copy']} />)
      await user.click(trigger())
      await user.click(menuItem('Share'))
      expect(radio('Copy link')).toHaveAttribute('aria-checked', 'true')
      expect(radio('Email')).toHaveAttribute('aria-checked', 'false')
      expect(menuItem('Preview')).not.toHaveAttribute('aria-checked')
    })
  })

  it('makes an item a link given an href, still in the menuitem role, which closes the menu', async () => {
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
        <MenuPopover>
          <Menu>
            <MenuItem href="#docs">Docs</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    const link = menuItem('Docs')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '#docs')
    await user.click(link)
    expect(isOpen()).toBe(false)
  })

  it('draws the state layer on every item', async () => {
    const user = userEvent.setup()
    render(<Overflow />)
    await user.click(trigger())
    for (const item of screen.getAllByRole('menuitem')) {
      expect(item.querySelector(':scope > .state-layer')).toBeInTheDocument()
    }
  })

  it('forwards a custom class, the style, the ref and the rest to the list in the menu role, inside the panel', async () => {
    const ref = createRef<HTMLDivElement>()
    const user = userEvent.setup()
    render(
      <Overflow
        ref={ref}
        className="custom"
        style={{ maxHeight: 200 }}
        aria-label="Options"
        data-testid="list"
      />,
    )
    await user.click(trigger())
    const menu = screen.getByRole('menu')
    expect(ref.current).toBe(menu)
    expect(menu).toHaveClass('custom', 'menu-list')
    expect(menu).toHaveStyle({ maxHeight: '200px' })
    expect(menu).toBe(screen.getByTestId('list'))
    // The trigger names it still: aria-labelledby is read before aria-label.
    expect(menu).toHaveAttribute('aria-label', 'Options')
    expect(menu).toHaveAccessibleName('More')
    const panel = panelOf(menu)
    expect(panel).toBe(screen.getByRole('dialog'))
    expect(panel).not.toHaveClass('custom')
  })

  it('takes className as a function of the state React Aria reports of its list, with its default class', async () => {
    const className = vi.fn(
      ({ isEmpty, defaultClassName }: { isEmpty: boolean; defaultClassName?: string }) =>
        `${defaultClassName} ${isEmpty ? 'empty' : 'full'}`,
    )
    const user = userEvent.setup()
    render(<Overflow className={className} />)
    await user.click(trigger())
    expect(screen.getByRole('menu')).toHaveClass('react-aria-Menu', 'full', 'menu-list')
    expect(className).toHaveBeenCalledWith(expect.objectContaining({ isEmpty: false }))
  })
})

describe('MenuPopover', () => {
  it('forwards a custom class, the style and the ref to the panel, React Aria’s Popover around the list', async () => {
    const ref = createRef<HTMLElement>()
    const user = userEvent.setup()
    render(<Overflow popoverProps={{ ref, className: 'custom', style: { width: 200 } }} />)
    await user.click(trigger())
    const panel = panelOf(screen.getByRole('menu'))
    expect(ref.current).toBe(panel)
    expect(panel).toBe(screen.getByRole('dialog'))
    expect(panel).toHaveClass('custom', 'menu-panel')
    expect(panel).toHaveStyle({ width: '200px' })
    expect(screen.getByRole('menu')).not.toHaveClass('custom')
  })

  it('takes className as a function of the state React Aria reports of its Popover', async () => {
    const className = vi.fn(
      ({
        placement,
        trigger,
        defaultClassName,
      }: PopoverRenderProps & { defaultClassName?: string }) =>
        `${defaultClassName} at-${placement} from-${trigger}`,
    )
    const user = userEvent.setup()
    render(<Overflow popoverProps={{ className }} />)
    await user.click(trigger())
    const panel = panelOf(screen.getByRole('menu'))
    expect(panel).toHaveClass('react-aria-Popover', 'at-bottom', 'from-MenuTrigger', 'menu-panel')
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ isEntering: expect.any(Boolean), isExiting: false }),
    )
  })

  it('places the panel where placement says, React Aria’s data-placement', async () => {
    const user = userEvent.setup()
    render(<Overflow popoverProps={{ placement: 'top start' }} />)
    await user.click(trigger())
    expect(panelOf(screen.getByRole('menu'))).toHaveAttribute('data-placement', 'top')
  })

  it('places a submenu’s panel at the end of its item, as React Aria does in a SubmenuTrigger, the other side in a right-to-left layout', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Nested />)
    await user.click(trigger())
    await user.click(menuItem('Share'))
    expect(panelOf(screen.getByRole('menu', { name: 'Share' }))).toHaveAttribute(
      'data-placement',
      'right',
    )
    unmount()
    render(
      <I18nProvider locale="he-IL">
        <Nested />
      </I18nProvider>,
    )
    await user.click(trigger())
    await user.click(menuItem('Share'))
    expect(panelOf(screen.getByRole('menu', { name: 'Share' }))).toHaveAttribute(
      'data-placement',
      'left',
    )
  })

  it('opens and closes instantly given shouldSkipAnimation, with no data-entering', async () => {
    const user = userEvent.setup()
    render(<Overflow popoverProps={{ shouldSkipAnimation: true }} />)
    await user.click(trigger())
    expect(panelOf(screen.getByRole('menu'))).not.toHaveAttribute('data-entering')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('MenuItem', () => {
  it('forwards a custom class, other props and the ref to the item, keyed by its id', async () => {
    const ref = createRef<HTMLDivElement>()
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
        <MenuPopover>
          <Menu>
            <MenuItem ref={ref} id="preview" className="custom" aria-label="Show a preview">
              Preview
            </MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    // Its aria-label names it: it draws no label for React Aria to point aria-labelledby at.
    const item = menuItem('Show a preview')
    expect(item).not.toHaveAttribute('aria-labelledby')
    expect(ref.current).toBe(item)
    expect(item).toHaveClass('custom', 'group/md-menu-item')
    expect(item).toHaveAttribute('data-key', 'preview')
    expect(item.tagName).toBe('DIV')
  })

  it('takes className as a function of the state React Aria reports of it, with its default class', async () => {
    const user = userEvent.setup()
    const className = ({
      isSelected,
      defaultClassName,
    }: MenuItemRenderProps & { defaultClassName?: string }) =>
      `${defaultClassName} ${isSelected ? 'is-on' : 'is-off'}`
    render(
      <MenuTrigger>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
        <MenuPopover>
          <Menu selectionMode="single" defaultSelectedKeys={['on']}>
            <MenuItem id="on" className={className}>
              On
            </MenuItem>
            <MenuItem id="off" className={className}>
              Off
            </MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    expect(radio('On')).toHaveClass('react-aria-MenuItem', 'is-on', 'group/md-menu-item')
    expect(radio('Off')).toHaveClass('react-aria-MenuItem', 'is-off')
  })
})

describe('the menu’s exports', () => {
  it('are the MenuPopover, the Menu and the MenuItem alone: the rest of a menu is React Aria’s own', () => {
    expect(Object.keys(exported).sort()).toEqual(['Menu', 'MenuItem', 'MenuPopover'])
  })
})
