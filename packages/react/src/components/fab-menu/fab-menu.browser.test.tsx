import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from 'vitest/browser'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import {
  button,
  computedColor,
  computedStyleOf,
  contrastOf,
  expectNoNativeStyling,
  expectOnlyPendingIndicator,
  Scheme,
  schemeOf,
  schemes,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
  whilePressed,
} from '../../test-browser'
import { Icon } from '../icon'
import { MenuTrigger } from 'react-aria-components'
import {
  FabMenu,
  FabMenuButton,
  FabMenuItem,
  FabMenuPopover,
  type FabMenuColor,
  type FabMenuSize,
} from '.'

/*
 * Everything that needs a real browser and the real stylesheet: colors, size,
 * shape, contrast, keyboard use, the focus outline, motion and forced colors.
 * Behavior jsdom can check without a stylesheet - attributes, accessible
 * names, DOM structure, events - is in fab-menu.test.tsx instead.
 */

const colors = ['primary', 'secondary', 'tertiary'] as const
const sizes = ['baseline', 'medium', 'large'] as const

/**
 * A FAB menu named "Create", with Email and Message items, unless overridden, composed as React
 * Aria composes a menu: `size`, `isDisabled`, `isPending` and `className` are its FAB's, `color`
 * its FAB's and its list's. MenuTrigger is React Aria's own, which the menu exports too.
 */
function Create({
  label = 'Create',
  color,
  size,
  isDisabled,
  isPending,
  className,
}: {
  label?: string
  color?: FabMenuColor
  size?: FabMenuSize
  isDisabled?: boolean
  isPending?: boolean
  className?: string
}) {
  return (
    <MenuTrigger>
      <FabMenuButton
        aria-label={label}
        color={color}
        size={size}
        isDisabled={isDisabled}
        isPending={isPending}
        className={className}
      >
        <Icon name="add" />
      </FabMenuButton>
      <FabMenuPopover>
        <FabMenu color={color}>
          <FabMenuItem textValue="Email">
            <Icon name="mail" />
            Email
          </FabMenuItem>
          <FabMenuItem textValue="Message">
            <Icon name="chat" />
            Message
          </FabMenuItem>
        </FabMenu>
      </FabMenuPopover>
    </MenuTrigger>
  )
}

/** The rendered menu item with this accessible name: only an open menu's are exposed. */
const menuItem = (name: string) => screen.getByRole('menuitem', { name })

/** Opens the menu named `label` from its trigger, as a click does: no item is focused yet. */
const open = (label = 'Create') => userEvent.click(button(label))

/** Waits for the transitions an element is in the middle of, its own only, to run out. */
const settled = (el: Element) =>
  waitFor(() => expect(el.getAnimations()).toHaveLength(0), { timeout: 3000 })

/**
 * Runs `check` at points through the transitions an element has started, each paused there in
 * turn, so the frames of a spring's overshoot are checked too, then lets them finish.
 */
async function throughTransitions(el: Element, check: () => void) {
  await waitFor(() => expect(el.getAnimations().length).toBeGreaterThan(0))
  const animations = el.getAnimations()
  const end = Math.max(...animations.map((a) => Number(a.effect?.getComputedTiming().endTime)))
  for (const animation of animations) animation.pause()
  for (let step = 0; step <= 24; step++) {
    for (const animation of animations) animation.currentTime = (end * step) / 24
    check()
  }
  for (const animation of animations) animation.finish()
}

/** The stack an item is in: React Aria's Popover, around the Menu that is the list of items. */
const stackOf = (item: Element) => item.parentElement!.parentElement!

/*
 * React Aria renders the stack at the end of the page, outside any wrapper, so for its items a
 * scheme is put on the document itself, and the page's surface painted on it, where Scheme would
 * do both for what is inside it.
 */
function themeDocument(theme: 'light' | 'dark', contrast: 'standard' | 'medium' | 'high') {
  document.documentElement.dataset.theme = theme
  if (contrast !== 'standard') document.documentElement.dataset.contrast = contrast
  document.documentElement.style.background = 'var(--md-sys-color-surface)'
}

afterEach(() => {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.contrast
  document.documentElement.style.background = ''
})

describe('FabMenu accessibility in a browser', () => {
  describe('contrast', () => {
    // WCAG 1.4.11: the trigger's icon is a graphical object, needing 3:1.
    it.each(schemes)(
      'keeps the trigger icon at 3:1 or more, %s scheme, %s contrast',
      (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            {colors.map((color) => (
              <Create key={color} label={color} color={color} />
            ))}
          </Scheme>,
        )
        for (const color of colors) {
          expect(contrastOf(button(color)), color).toBeGreaterThanOrEqual(3)
        }
      },
    )

    // WCAG 1.4.3: an item's label is text at 14px or larger, needing 4.5:1.
    it.each(schemes)(
      'keeps an item label at 4.5:1 or more, %s scheme, %s contrast',
      async (theme, contrast) => {
        themeDocument(theme, contrast)
        render(
          <Scheme theme={theme} contrast={contrast}>
            {colors.map((color) => (
              <MenuTrigger key={color}>
                <FabMenuButton aria-label={`${color} trigger`} color={color}>
                  <Icon name="add" />
                </FabMenuButton>
                <FabMenuPopover>
                  <FabMenu color={color}>
                    <FabMenuItem>{color}</FabMenuItem>
                  </FabMenu>
                </FabMenuPopover>
              </MenuTrigger>
            ))}
          </Scheme>,
        )
        // The rest of the page is inert while a menu is open, the next trigger with it: each
        // is closed, and its stack gone, before the next opens.
        for (const color of colors) {
          await open(`${color} trigger`)
          expect(contrastOf(menuItem(color)), color).toBeGreaterThanOrEqual(4.5)
          await userEvent.keyboard('{Escape}')
          await waitFor(() => expect(screen.queryByRole('menu')).toBeNull(), { timeout: 3000 })
        }
      },
    )
  })

  describe('colors', () => {
    it.each([
      ['primary', '--md-sys-color-primary-container', '--md-sys-color-on-primary-container'],
      ['secondary', '--md-sys-color-secondary-container', '--md-sys-color-on-secondary-container'],
      ['tertiary', '--md-sys-color-tertiary-container', '--md-sys-color-on-tertiary-container'],
    ] as const)(
      'fills a closed %s trigger with its FAB container and icon colors',
      (color, bg, fg) => {
        render(
          <Scheme>
            <Create color={color} />
          </Scheme>,
        )
        const el = button('Create')
        const style = getComputedStyle(el)
        expect(style.backgroundColor).toBe(computedColor(`var(${bg})`, el))
        expect(style.color).toBe(computedColor(`var(${fg})`, el))
      },
    )

    it.each([
      ['primary', '--md-sys-color-primary', '--md-sys-color-on-primary'],
      ['secondary', '--md-sys-color-secondary', '--md-sys-color-on-secondary'],
      ['tertiary', '--md-sys-color-tertiary', '--md-sys-color-on-tertiary'],
    ] as const)(
      'fills an open %s close button with the solid color, not the container',
      async (color, bg, fg) => {
        render(
          <Scheme>
            <Create color={color} />
          </Scheme>,
        )
        await open()
        const el = button('Create')
        await settled(el)
        const style = getComputedStyle(el)
        expect(style.backgroundColor).toBe(computedColor(`var(${bg})`, el))
        expect(style.color).toBe(computedColor(`var(${fg})`, el))
      },
    )

    it.each([
      ['primary', '--md-sys-color-primary-container', '--md-sys-color-on-primary-container'],
      ['secondary', '--md-sys-color-secondary-container', '--md-sys-color-on-secondary-container'],
      ['tertiary', '--md-sys-color-tertiary-container', '--md-sys-color-on-tertiary-container'],
    ] as const)(
      'fills a %s item with the container color, matching the FAB menu',
      async (color, bg, fg) => {
        render(
          <Scheme>
            <Create color={color} />
          </Scheme>,
        )
        await open()
        const el = menuItem('Email')
        const style = getComputedStyle(el)
        expect(style.backgroundColor).toBe(computedColor(`var(${bg})`, el))
        expect(style.color).toBe(computedColor(`var(${fg})`, el))
      },
    )

    it('greys out a disabled item, which keeps the default cursor, like a disabled Button', async () => {
      render(
        <Scheme>
          <MenuTrigger>
            <FabMenuButton aria-label="Create">
              <Icon name="add" />
            </FabMenuButton>
            <FabMenuPopover>
              <FabMenu>
                <FabMenuItem isDisabled>Email</FabMenuItem>
                <FabMenuItem>Message</FabMenuItem>
              </FabMenu>
            </FabMenuPopover>
          </MenuTrigger>
        </Scheme>,
      )
      await open()
      const disabled = getComputedStyle(menuItem('Email'))
      const enabled = getComputedStyle(menuItem('Message'))
      expect(disabled.backgroundColor).not.toBe(enabled.backgroundColor)
      expect(disabled.color).not.toBe(enabled.color)
      expect(disabled.cursor).toBe('default')
      expect(enabled.cursor).toBe('pointer')
    })
  })

  describe('sizing', () => {
    it.each([
      ['baseline', 56],
      ['medium', 80],
      ['large', 96],
    ] as const)('gives a closed %s trigger a %ipx square', (size, px) => {
      render(
        <Scheme>
          <Create size={size} />
        </Scheme>,
      )
      const rect = button('Create').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })

    it.each(sizes)(
      'always gives the open close button a 56px square, from a %s trigger',
      async (size) => {
        render(
          <Scheme>
            <Create size={size} />
          </Scheme>,
        )
        await open()
        await settled(button('Create'))
        const rect = button('Create').getBoundingClientRect()
        expect([rect.width, rect.height]).toEqual([56, 56])
      },
    )

    it.each(['medium', 'large'] as const)(
      'shrinks a %s trigger to the close button from its top end corner, which stays put',
      async (size) => {
        render(
          <Scheme>
            <Create size={size} />
          </Scheme>,
        )
        const fab = button('Create').getBoundingClientRect()
        await open()
        await settled(button('Create'))
        const close = button('Create').getBoundingClientRect()
        expect([close.top, close.right]).toEqual([fab.top, fab.right])
        expect(close.bottom).toBeLessThan(fab.bottom)
      },
    )

    it.each(['medium', 'large'] as const)(
      'keeps a %s FAB’s footprint and top end corner through each frame of its spring, opening and closing, so what is beside it never moves',
      async (size) => {
        render(
          <Scheme>
            <Create size={size} />
            <span data-testid="beside">Beside</span>
          </Scheme>,
        )
        const corner = () => {
          const rect = button('Create').getBoundingClientRect()
          return [rect.top, rect.right]
        }
        const beside = () => screen.getByTestId('beside').getBoundingClientRect().left
        const [shut, besideShut] = [corner(), beside()]
        await open()
        await throughTransitions(button('Create'), () => {
          expect(corner()).toEqual(shut)
          expect(beside()).toBe(besideShut)
        })
        // Closed with Escape, from the list that has the focus: the FAB grows back past its size
        // on the spring, toward its bottom and start sides.
        await userEvent.keyboard('{Escape}')
        await throughTransitions(button('Create'), () => {
          expect(corner()).toEqual(shut)
          expect(beside()).toBe(besideShut)
        })
      },
    )

    it.each(['medium', 'large'] as const)(
      'shrinks a %s FAB placed by its bottom end, as a FAB menu is, from its top end corner too',
      async (size) => {
        render(
          <Scheme>
            <Create size={size} className="fixed right-space-200 bottom-space-200" />
          </Scheme>,
        )
        const corner = () => {
          const rect = button('Create').getBoundingClientRect()
          return [rect.top, rect.right]
        }
        const shut = corner()
        await open()
        await throughTransitions(button('Create'), () => expect(corner()).toEqual(shut))
        expect(button('Create').getBoundingClientRect().height).toBe(56)
      },
    )

    it('gives every item a 56px height, matching the close button', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      expect(menuItem('Email').getBoundingClientRect().height).toBe(56)
      expect(menuItem('Message').getBoundingClientRect().height).toBe(56)
    })
  })

  describe('shape', () => {
    it('rounds the open close button fully, half its own height', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const el = button('Create')
      await settled(el)
      const half = `${el.getBoundingClientRect().height / 2}px`
      expect(getComputedStyle(el).borderRadius).toBe(half)
    })

    it('rounds every item fully, half its own height', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const el = menuItem('Email')
      const half = `${el.getBoundingClientRect().height / 2}px`
      expect(getComputedStyle(el).borderRadius).toBe(half)
    })
  })

  describe('icon size', () => {
    it.each([
      ['baseline', 24],
      ['medium', 28],
      ['large', 36],
    ] as const)('draws the closed %s trigger icon at %ipx', (size, px) => {
      render(
        <Scheme>
          <Create size={size} />
        </Scheme>,
      )
      const rect = screen.getByText('add').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([px, px])
    })

    it('draws the close icon at 20px, whatever the trigger size', async () => {
      render(
        <Scheme>
          <Create size="large" />
        </Scheme>,
      )
      await open()
      const rect = screen.getByText('close').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([20, 20])
    })

    it('centers the close icon in the button even when the trigger icon it fades against is bigger', async () => {
      render(
        <Scheme>
          <Create size="large" />
        </Scheme>,
      )
      await open()
      const close = button('Create').getBoundingClientRect()
      const icon = screen.getByText('close').getBoundingClientRect()
      const center = (rect: DOMRect) => [rect.left + rect.width / 2, rect.top + rect.height / 2]
      expect(center(icon)).toEqual(center(close))
    })

    it('draws an item icon at 24px', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const rect = screen.getByText('mail').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([24, 24])
    })
  })

  describe('spacing', () => {
    it('leaves 24px before an item’s icon and after its label, the medium button’s, and no more', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const item = menuItem('Email')
      await waitFor(() => expect(stackOf(item)).not.toHaveAttribute('data-entering'))
      await settled(item)
      const box = item.getBoundingClientRect()
      const content = screen.getByText('Email').getBoundingClientRect()
      expect(box.right - content.right).toBe(24)
      expect(content.left - box.left).toBe(24)
    })

    it('opens an item to its content’s laid-out width when the stack is scaled, as one scaling in', async () => {
      render(
        <Scheme>
          <MenuTrigger>
            <FabMenuButton aria-label="Create">
              <Icon name="add" />
            </FabMenuButton>
            <FabMenuPopover style={{ scale: 0.5 }}>
              <FabMenu>
                <FabMenuItem textValue="Email">
                  <Icon name="mail" />
                  Email
                </FabMenuItem>
              </FabMenu>
            </FabMenuPopover>
          </MenuTrigger>
        </Scheme>,
      )
      await open()
      const item = menuItem('Email')
      await waitFor(() => expect(stackOf(item)).not.toHaveAttribute('data-entering'))
      await settled(item)
      const box = item.getBoundingClientRect()
      const content = screen.getByText('Email').getBoundingClientRect()
      expect(box.right - content.right).toBeCloseTo(12, 1)
      expect(content.left - box.left).toBeCloseTo(12, 1)
    })

    it('leaves a 4px gap between items', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const email = menuItem('Email').getBoundingClientRect()
      const message = menuItem('Message').getBoundingClientRect()
      // Email is above Message: the stack keeps document order, and only the
      // trigger is reordered visually (see fab-menu-popover.tsx).
      expect(message.top - email.bottom).toBe(4)
    })

    it.each(sizes)(
      'leaves an 8px gap between the last item and the close button at %s',
      async (size) => {
        render(
          <Scheme>
            {/* Bottom-anchored, as FabMenuButton's placement advice has it:
              React Aria caps the stack at the room above the FAB, which an
              unpositioned menu near the top of the test page has barely any of. */}
            <Create size={size} className="fixed right-space-200 bottom-space-200" />
          </Scheme>,
        )
        await open()
        const message = menuItem('Message').getBoundingClientRect()
        const close = button('Create').getBoundingClientRect()
        // The open button is always the fixed 56dp close-button size (see
        // fab-menu-button.tsx), regardless of the closed trigger's own size, so this
        // must hold at medium/large too, not just baseline - a regression
        // here previously left items rendered behind the button by default.
        expect(close.top - message.bottom).toBe(8)
      },
    )
  })

  describe('scrolling', () => {
    /**
     * Far more than the guidelines' 2-6 items, at the window's bottom end as a FAB menu is
     * placed, so the stack overflows the room above the FAB, most of the window's height.
     */
    function Long({ size }: { size?: FabMenuSize }) {
      return (
        <Scheme>
          <MenuTrigger>
            <FabMenuButton
              aria-label="Create"
              size={size}
              className="fixed right-space-200 bottom-space-200"
            >
              <Icon name="add" />
            </FabMenuButton>
            <FabMenuPopover>
              <FabMenu>
                {Array.from({ length: 30 }, (_, i) => (
                  <FabMenuItem key={i}>{`Item ${i}`}</FabMenuItem>
                ))}
              </FabMenu>
            </FabMenuPopover>
          </MenuTrigger>
        </Scheme>
      )
    }

    /** How far the list is scrolled from its end, the item nearest the FAB, in px. */
    const fromEnd = (list: Element) => list.scrollHeight - list.clientHeight - list.scrollTop

    /** Whether the item is in the visible part of the list it scrolls in. */
    const inView = (item: Element, list: Element) => {
      const [box, row] = [list.getBoundingClientRect(), item.getBoundingClientRect()]
      return row.top >= box.top - 0.5 && row.bottom <= box.bottom + 0.5
    }

    it.each(sizes)(
      'opens a %s FAB’s stack scrolled to its end, the item nearest the FAB, not the browser’s default top, and keeps it there as it opens',
      async (size) => {
        render(<Long size={size} />)
        await open()
        const list = menuItem('Item 0').parentElement!
        // Sanity check: the scenario actually overflows, or a scrollTop of 0 would be the end too.
        expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
        // "Make sure the items scroll behind the close button" (accessibility page).
        expect(Math.abs(fromEnd(list))).toBeLessThan(1)
        // React Aria places the stack again each time it or the FAB resizes, as both do opening.
        await settled(menuItem('Item 0'))
        await settled(button('Create'))
        expect(Math.abs(fromEnd(list))).toBeLessThan(1)
      },
    )

    it('lets the items scroll behind the close button and 16px below it, drawn over them, where a press closes the menu and reaches no item', async () => {
      const onAction = vi.fn()
      render(
        <Scheme>
          <MenuTrigger>
            <FabMenuButton aria-label="Create" className="fixed right-space-200 bottom-space-200">
              <Icon name="add" />
            </FabMenuButton>
            <FabMenuPopover>
              <FabMenu onAction={onAction}>
                {Array.from({ length: 30 }, (_, i) => (
                  <FabMenuItem key={i} id={i}>{`Item ${i}`}</FabMenuItem>
                ))}
              </FabMenu>
            </FabMenuPopover>
          </MenuTrigger>
        </Scheme>,
      )
      await open()
      const list = menuItem('Item 0').parentElement!
      await settled(button('Create'))
      // The accessibility page: "When the FAB menu can scroll, make sure the items scroll behind the
      // close button. The close button should always be easy to access and unobstructed." The list
      // reaches 16px below the button, as Compose's column does, with its items 8px above it at rest.
      const close = button('Create').getBoundingClientRect()
      expect(list.getBoundingClientRect().bottom).toBe(close.bottom + 16)
      expect(close.top - menuItem('Item 29').getBoundingClientRect().bottom).toBe(8)
      list.scrollTop = 0
      const behind = Array.from(list.children).filter((item) => {
        const box = item.getBoundingClientRect()
        return box.bottom > close.top && box.top < close.bottom
      })
      expect(behind.length).toBeGreaterThan(0)
      // The button is drawn over them, inert with the page, and a press through it lands on the
      // stack's own hit area for it, not on the item behind.
      const [x, y] = [close.left + close.width / 2, close.top + close.height / 2]
      expect(document.elementFromPoint(x, y)!.closest('[role="menuitem"]')).toBeNull()
      await userEvent.click(button('Create'), { force: true })
      expect(button('Create')).toHaveAttribute('aria-expanded', 'false')
      expect(onAction).not.toHaveBeenCalled()
    })

    it('scrolls the first item into view instead when the keyboard opens the menu, which focuses it, and keeps it there as it opens', async () => {
      render(<Long />)
      await userEvent.tab()
      await userEvent.keyboard('{Enter}')
      const list = menuItem('Item 0').parentElement!
      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
      expect(menuItem('Item 0')).toHaveFocus()
      expect(menuItem('Item 0')).toHaveAttribute('data-focus-visible')
      // React Aria scrolls the item it focuses into view.
      await waitFor(() => expect(inView(menuItem('Item 0'), list)).toBe(true))
      await settled(menuItem('Item 0'))
      expect(inView(menuItem('Item 0'), list)).toBe(true)
      expect(fromEnd(list)).toBeGreaterThan(0)
    })
  })

  describe('room', () => {
    it('caps the stack at the room above the menu, so it never leaves the viewport, and scrolls instead', async () => {
      render(
        <Scheme>
          <MenuTrigger>
            <FabMenuButton aria-label="Create">
              <Icon name="add" />
            </FabMenuButton>
            <FabMenuPopover>
              <FabMenu>
                {Array.from({ length: 30 }, (_, i) => (
                  <FabMenuItem key={i}>{`Item ${i}`}</FabMenuItem>
                ))}
              </FabMenu>
            </FabMenuPopover>
          </MenuTrigger>
        </Scheme>,
      )
      await open()
      const stack = menuItem('Item 0').parentElement!
      const menu = stack.parentElement!
      expect(stack.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
      expect(stack.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        menu.getBoundingClientRect().bottom,
      )
      expect(stack.scrollHeight).toBeGreaterThan(stack.clientHeight)
      expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight)
    })
  })

  describe('keyboard', () => {
    it('opens from the trigger with Enter, the first item focused, and moves the focus with the arrow keys and a typed letter', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Create'))
      await userEvent.keyboard('{Enter}')
      // The focus is on the item itself, as React Aria has it, not an aria-activedescendant.
      expect(document.activeElement).toBe(menuItem('Email'))
      expect(screen.getByRole('menu')).not.toHaveAttribute('aria-activedescendant')
      await userEvent.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(menuItem('Message'))
      await userEvent.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(menuItem('Email'))
      // The item's label alone, not its icon's hidden ligature text ("chat").
      await userEvent.keyboard('m')
      expect(document.activeElement).toBe(menuItem('Message'))
    })

    it('closes with Escape, with the focus back on the trigger once the stack has left', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{Enter}{Escape}')
      expect(button('Create')).toHaveAttribute('aria-expanded', 'false')
      // React Aria gives the focus back as it removes the stack, at the end of its exit transition.
      expect(document.activeElement).toBe(menuItem('Email'))
      await waitFor(() => expect(document.activeElement).toBe(button('Create')), { timeout: 3000 })
      expect(screen.queryByRole('menu')).toBeNull()
    })

    it('keeps the focus in the stack on Tab, as React Aria keeps it in a modal popover', async () => {
      render(
        <Scheme>
          <Create />
          <button>After</button>
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{Enter}')
      await userEvent.tab()
      expect(button('Create')).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement)
      await userEvent.tab({ shift: true })
      expect(button('Create')).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement)
    })

    it('closes from the FAB, the close button, which is inert with the rest of the page while the menu is open: a click on it falls through to the stack’s own hit area for it', async () => {
      const onPress = vi.fn()
      render(
        <Scheme>
          <MenuTrigger>
            <FabMenuButton aria-label="Create" onPress={onPress}>
              <Icon name="add" />
            </FabMenuButton>
            <FabMenuPopover>
              <FabMenu>
                <FabMenuItem>Email</FabMenuItem>
              </FabMenu>
            </FabMenuPopover>
          </MenuTrigger>
        </Scheme>,
      )
      await open()
      onPress.mockClear()
      expect(button('Create').closest('[inert]')).not.toBeNull()
      // Forced: Playwright refuses to click what the page does not hit-test.
      await userEvent.click(button('Create'), { force: true })
      expect(button('Create')).toHaveAttribute('aria-expanded', 'false')
      expect(onPress).not.toHaveBeenCalled()
      expect(button('Create').closest('[inert]')).toBeNull()
    })

    it('skips the items while closed', async () => {
      render(
        <Scheme>
          <Create />
          <button>After</button>
        </Scheme>,
      )
      await userEvent.tab()
      expect(document.activeElement).toBe(button('Create'))
      await userEvent.tab()
      expect(document.activeElement).toBe(button('After'))
    })

    it('puts the focus back on the trigger once an item is clicked', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      await userEvent.click(menuItem('Email'))
      expect(button('Create')).toHaveAttribute('aria-expanded', 'false')
      await waitFor(() => expect(document.activeElement).toBe(button('Create')), { timeout: 3000 })
    })
  })

  describe('focus ring', () => {
    it('is drawn on the trigger, then on the item the keyboard makes active, never on the menu itself', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await userEvent.tab()
      expect(getComputedStyle(button('Create')).outlineStyle).toBe('solid')
      await userEvent.keyboard('{Enter}')
      expect(getComputedStyle(screen.getByRole('menu')).outlineStyle).toBe('none')
      expect(getComputedStyle(button('Create')).outlineStyle).toBe('none')
      expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('solid')
      expect(getComputedStyle(menuItem('Message')).outlineStyle).toBe('none')
      await userEvent.keyboard('{ArrowDown}')
      expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('none')
      expect(getComputedStyle(menuItem('Message')).outlineStyle).toBe('solid')
    })

    it('is not drawn on a hovered item, which the pointer focuses, as React Aria has it, without the keyboard’s focus-visible: it gets the hover state layer only', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      await userEvent.hover(menuItem('Email'))
      await userEvent.hover(menuItem('Email'), { position: { x: 12, y: 12 } })
      await waitFor(() => expect(menuItem('Email')).toHaveAttribute('data-hovered'))
      expect(menuItem('Email')).toHaveFocus()
      expect(menuItem('Email')).toHaveAttribute('data-focused')
      expect(menuItem('Email')).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('none')
      const layer = menuItem('Email').firstElementChild!
      await settled(layer)
      expect(getComputedStyle(layer).opacity).toBe(
        computedStyleOf('opacity-state-hover', (s) => s.opacity),
      )
    })

    it('stays on the item the keyboard focused while the pointer hovers another, until the arrow keys move it', async () => {
      render(
        <Scheme>
          {/* Away from the left edge, where the stack, hanging left of the trigger, would be cut off. */}
          <div style={{ paddingInlineStart: 320 }}>
            <Create />
          </div>
        </Scheme>,
      )
      await userEvent.tab()
      await userEvent.keyboard('{Enter}')
      expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('solid')
      await userEvent.hover(menuItem('Message'))
      await userEvent.hover(menuItem('Message'), { position: { x: 12, y: 12 } })
      await waitFor(() => expect(menuItem('Message')).toHaveAttribute('data-hovered'))
      // React Aria moves the focus to a hovered item only while the keyboard is not in use.
      expect(menuItem('Email')).toHaveFocus()
      expect(menuItem('Message')).not.toHaveAttribute('data-focused')
      expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('solid')
      expect(getComputedStyle(menuItem('Message')).outlineStyle).toBe('none')
      await userEvent.keyboard('{ArrowDown}')
      expect(menuItem('Message')).toHaveFocus()
      expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('none')
      expect(getComputedStyle(menuItem('Message')).outlineStyle).toBe('solid')
    })

    it('is not drawn on the trigger, nor its focus state layer, when a click outside closes the menu and the focus returns to it', async () => {
      render(
        <Scheme>
          <Create />
          <p>Elsewhere</p>
        </Scheme>,
      )
      await open()
      // Forced: the page is inert while the menu is open, so Playwright finds nothing to hit.
      await userEvent.click(screen.getByText('Elsewhere'), { force: true })
      await waitFor(() => expect(button('Create')).toHaveAttribute('aria-expanded', 'false'))
      // React Aria puts the focus back on the trigger once the stack has left. A pointer did
      // all of it, so the focus is not visible: React Aria reports none (data-focus-visible),
      // whatever the browser's :focus-visible makes of a script focus.
      await waitFor(() => expect(button('Create')).toHaveFocus(), { timeout: 3000 })
      expect(button('Create')).not.toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(button('Create')).outlineStyle).toBe('none')
      const layer = button('Create').firstElementChild!
      await settled(layer)
      expect(getComputedStyle(layer).opacity).toBe('0')
      // The pointer back on it, the layer is the hover one, as on a trigger without the focus.
      await userEvent.hover(button('Create'))
      await waitFor(() => expect(button('Create')).toHaveAttribute('data-hovered'))
      await settled(layer)
      expect(getComputedStyle(layer).opacity).toBe(
        computedStyleOf('opacity-state-hover', (s) => s.opacity),
      )
    })

    it('is drawn on the trigger when Escape closes the menu, the keyboard having returned the focus', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      await userEvent.keyboard('{Escape}')
      await waitFor(() => expect(button('Create')).toHaveAttribute('aria-expanded', 'false'))
      await waitFor(() => expect(button('Create')).toHaveFocus(), { timeout: 3000 })
      expect(button('Create')).toHaveAttribute('data-focus-visible')
      expect(getComputedStyle(button('Create')).outlineStyle).toBe('solid')
    })

    it('is not drawn on an item while the pointer presses it', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      await whilePressed(
        'Email',
        async () => {
          await waitFor(() => expect(menuItem('Email')).toHaveAttribute('data-pressed'))
          // The press focuses it, as the pointer does, without the keyboard's focus-visible.
          expect(menuItem('Email')).toHaveAttribute('data-focused')
          expect(menuItem('Email')).not.toHaveAttribute('data-focus-visible')
          expect(getComputedStyle(menuItem('Email')).outlineStyle).toBe('none')
        },
        'menuitem',
      )
    })
  })

  describe('motion', () => {
    it('spring-transitions the trigger shape, size, color and shadow together', () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      const style = getComputedStyle(button('Create'))
      const springs = [
        'fast-spatial',
        'fast-spatial',
        'fast-effects',
        'fast-effects',
        'fast-effects',
      ]
      // The size is padding around the close button's box, which --fab-menu-open takes away
      // and gives back as margin (fab-menu.css), so the spring moves both as one.
      expect(style.transitionProperty).toBe(
        'border-radius, --fab-menu-open, background-color, color, box-shadow',
      )
      expect(style.transitionDuration).toBe(springs.map(springDuration).join(', '))
      expect(style.transitionTimingFunction).toBe(springs.map(springEasing).join(', '))
    })

    it('keeps the item stack at its full size while its items reveal', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const stack = menuItem('Email').parentElement!
      const openingHeight = stack.getBoundingClientRect().height
      await settled(menuItem('Email'))
      // The stack never resizes itself - only its items reveal (see the
      // stack's own comment in fab-menu-popover.tsx) - so opening and open report the same box.
      // A prior attempt animated the stack's own height instead, which read
      // as the items sliding around rather than a clean fade.
      expect(stack.getBoundingClientRect().height).toBe(openingHeight)
    })

    it('keeps every item’s trailing edge, and the list’s, at the FAB’s end while the items reveal and collapse', async () => {
      // Springs slow enough to be caught however late this comes to them, then scrubbed through.
      const root = document.documentElement
      for (const spring of ['fast-spatial', 'fast-effects']) {
        const token = `--md-sys-motion-spring-${spring}-duration`
        root.style.setProperty(token, '2000ms')
        onTestFinished(() => void root.style.removeProperty(token))
      }
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const stack = stackOf(menuItem('Email'))
      const [email, message] = [menuItem('Email'), menuItem('Message')]
      const list = email.parentElement!
      const ends = () => [list, email, message].map((el) => el.getBoundingClientRect().right)
      // React Aria places the stack by its start edge, and the list hangs from the stack's end
      // (fab-menu.tsx), so the items' widths, growing or corrected, move nothing at that edge:
      // placed by its own width, the stack slid away from the FAB as the items collapsed.
      await waitFor(() => expect(stack).not.toHaveAttribute('data-entering'))
      const atRest = ends()
      expect(atRest[1]).toBe(button('Create').getBoundingClientRect().right)
      await throughTransitions(email, () => expect(ends()).toEqual(atRest))
      await settled(message)
      expect(ends()).toEqual(atRest)
      // Forced: the FAB is inert while the menu is open, and the click lands on the page beneath.
      await userEvent.click(button('Create'), { force: true })
      await waitFor(() => expect(stack).toHaveAttribute('data-exiting'))
      await throughTransitions(message, () => expect(ends()).toEqual(atRest))
    })

    it('grows and fades in each item on its own, on the spatial and effects springs', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const item = menuItem('Email')
      const springs = [
        'fast-spatial',
        'fast-effects',
        'fast-effects',
        'fast-effects',
        'fast-effects',
      ]
      // Fully open: the item's own box is wide enough that neither the icon
      // nor the label is cropped by it (see transition-width-fade-color-shadow
      // for why `width`, not `grid-template-columns` or `clip-path`, is what
      // grows here).
      await waitFor(() => {
        const itemRect = item.getBoundingClientRect()
        expect(screen.getByText('mail').getBoundingClientRect().left).toBeGreaterThanOrEqual(
          itemRect.left,
        )
        expect(screen.getByText('Email').getBoundingClientRect().right).toBeLessThanOrEqual(
          itemRect.right,
        )
        expect(getComputedStyle(item).opacity).toBe('1')
      })
      const style = getComputedStyle(item)
      expect(style.transitionProperty).toBe('width, opacity, background-color, color, box-shadow')
      expect(style.transitionDuration).toBe(springs.map(springDuration).join(', '))
      expect(style.transitionTimingFunction).toBe(springs.map(springEasing).join(', '))
    })

    it('collapses a closed item to nothing from its trailing edge, not scaled or hidden outright', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      // The trailing edge - where the item meets the close button - is the
      // one edge that never moves, open or closed (see the stack's own
      // `items-end`, fab-menu-popover.tsx, and the item's own `justify-end`,
      // fab-menu-item.tsx).
      const stack = stackOf(menuItem('Email'))
      // Fully open first: closed while still entering, at no width, there is nothing to collapse.
      await waitFor(() => expect(stack).not.toHaveAttribute('data-entering'))
      await settled(menuItem('Email'))
      const trailingEdge = menuItem('Email').getBoundingClientRect().right
      // Forced: the FAB is inert while the menu is open, and the click lands on the page beneath.
      await userEvent.click(button('Create'), { force: true })
      const item = screen.getByText('Email').closest('[role="menuitem"]')!
      const style = getComputedStyle(item)
      // `width: 0px` itself can't render smaller than the item's own
      // constant padding, the item being `border-box` -
      // that padding floor, with no content area left inside it, is what
      // "collapsed to nothing" actually looks like here.
      const collapsedWidth = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
      // React Aria marks the stack exiting, and removes it once its own transition has ended,
      // with the items' (see fab-menu-items-closed): so the item is read at the end of its own,
      // finished early.
      await waitFor(() => expect(stack).toHaveAttribute('data-exiting'))
      await waitFor(() => expect(item.getAnimations().length).toBeGreaterThan(0))
      for (const animation of item.getAnimations()) animation.finish()
      expect(item.getBoundingClientRect().width).toBe(collapsedWidth)
      expect(style.transform).toBe('none')
      expect(style.opacity).toBe('0')
      expect(item.getBoundingClientRect().right).toBe(trailingEdge)
    })

    it.each(sizes)(
      'keeps the closing stack until its last item has collapsed, while the close button grows back into a %s FAB, then removes it',
      async (size) => {
        render(
          <Scheme>
            <Create size={size} />
          </Scheme>,
        )
        await open()
        const stack = stackOf(menuItem('Email'))
        // Fully open first: React Aria reveals the items a frame after the stack mounts.
        await waitFor(() => expect(stack).not.toHaveAttribute('data-entering'))
        await settled(menuItem('Email'))
        // Forced: the FAB is inert while the menu is open, and the click lands on the page beneath.
        await userEvent.click(button('Create'), { force: true })
        expect(button('Create')).toHaveAttribute('aria-expanded', 'false')
        const email = screen.getByText('Email').closest('[role="menuitem"]')!
        await waitFor(() => expect(stack).toHaveAttribute('data-exiting'))
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(stack).toBeInTheDocument()
        expect(email.getAnimations().some((animation) => animation.playState === 'running')).toBe(
          true,
        )
        expect(button('Create').getAnimations().length).toBeGreaterThan(0)
        // The farthest item from the close button is the last to collapse, after its stagger.
        await settled(email)
        await waitFor(() => expect(stack).not.toBeInTheDocument())
      },
    )

    it('stalls each item a little longer than the one nearest the close button', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      // Message is last in the stack, closest to the button (see fab-menu.tsx's
      // own item order) - the accessibility page's "focus moves from the top
      // menu item to the bottom" - so it should be first to reveal, not last.
      expect(getComputedStyle(menuItem('Message')).transitionDelay).toBe('0s')
      expect(getComputedStyle(menuItem('Email')).transitionDelay).toBe('0.03s')
    })

    it('cross-fades the trigger icon and the close icon on the effects spring', () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      const [triggerIcon, closeIcon] = [
        ...document.querySelectorAll<HTMLElement>('.transition-fade'),
      ].filter((el) => el.closest('button') === button('Create'))
      expect(getComputedStyle(triggerIcon!).opacity).toBe('1')
      expect(getComputedStyle(closeIcon!).opacity).toBe('0')
      expect(getComputedStyle(triggerIcon!).transitionProperty).toBe('opacity')
      expect(getComputedStyle(triggerIcon!).transitionDuration).toBe(springDuration('fast-effects'))
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('settles every spring instantly on the trigger', () => {
        render(
          <Scheme>
            <Create />
          </Scheme>,
        )
        const durations = getComputedStyle(button('Create')).transitionDuration.split(', ')
        expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
      })
    })
  })

  describe('elevation', () => {
    const visible = (el: Element) => /[1-9]\d*px/.test(getComputedStyle(el).boxShadow)

    it('has a shadow on the trigger at rest, and none when disabled', () => {
      render(
        <Scheme>
          <Create />
          <Create label="Disabled" isDisabled />
        </Scheme>,
      )
      expect(visible(button('Create'))).toBe(true)
      expect(visible(button('Disabled'))).toBe(false)
    })
  })

  describe('pending', () => {
    it.each(colors)('keeps the colors of a %s trigger and shows the progress cursor', (color) => {
      render(
        <Scheme>
          <Create color={color} />
          <Create label="Creating" color={color} isPending />
        </Scheme>,
      )
      const enabled = getComputedStyle(button('Create'))
      const pending = getComputedStyle(button('Creating'))
      expect(pending.backgroundColor).toBe(enabled.backgroundColor)
      expect(pending.color).toBe(enabled.color)
      expect(pending.boxShadow).toBe(enabled.boxShadow)
      expect(enabled.cursor).toBe('pointer')
      expect(pending.cursor).toBe('progress')
    })

    // 1.5 times its icon.
    it.each([
      ['baseline', 36],
      ['medium', 42],
      ['large', 54],
    ] as const)('shows its loading indicator alone at size %s, %idp across', (size, px) => {
      render(
        <Scheme>
          <Create size={size} />
          <Create label="Creating" size={size} isPending />
        </Scheme>,
      )
      expectOnlyPendingIndicator(button('Creating'), button('Create'), px)
    })
  })

  describe('browser defaults', () => {
    it('leaves none of the native button styling on the trigger or an item', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      expectNoNativeStyling(button('Create'))
      // An item is a medium button, with that button's padding: 16dp above and below its label.
      expectNoNativeStyling(menuItem('Email'), 16)
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('gives the trigger and every item a ButtonText border', async () => {
      render(
        <Scheme>
          <Create />
        </Scheme>,
      )
      await open()
      const buttonText = computedColor('ButtonText', schemeOf(button('Create')))
      for (const el of [button('Create'), menuItem('Email'), menuItem('Message')]) {
        const style = getComputedStyle(el)
        expect(style.borderTopWidth).toBe('1px')
        expect(style.borderTopStyle).toBe('solid')
        expect(style.borderTopColor).toBe(buttonText)
      }
    })

    it('greys out a disabled trigger', () => {
      render(
        <Scheme>
          <Create isDisabled />
        </Scheme>,
      )
      const grayText = computedColor('GrayText', schemeOf(button('Create')))
      expect(getComputedStyle(button('Create')).borderTopColor).toBe(grayText)
    })
  })
})
