import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuTrigger } from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Icon } from '../icon'
import {
  FabMenu,
  FabMenuButton,
  FabMenuItem,
  FabMenuPopover,
  type FabMenuButtonProps,
  type FabMenuButtonRenderProps,
  type FabMenuItemRenderProps,
} from '.'

/*
 * Behavior and markup that jsdom can check without a stylesheet: attributes,
 * accessible names, DOM structure, keyboard and pointer handling. What a class
 * resolves to visually - colors, size, shape, motion - needs the real stylesheet,
 * so it is checked in fab-menu.browser.test.tsx instead. MenuTrigger is React
 * Aria's own, which the menu exports too.
 */

/** A FAB menu named "Create" with Email and Message items; `props` go on its FAB. */
function Create(props: Partial<FabMenuButtonProps>) {
  return (
    <MenuTrigger>
      <FabMenuButton aria-label="Create" {...props}>
        <Icon name="add" />
      </FabMenuButton>
      <FabMenuPopover>
        <FabMenu>
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

// While the menu is open, React Aria hides the rest of the page from assistive technology, the
// FAB with it: `aria-hidden` here, where jsdom has no `inert`.
const trigger = (name = 'Create') => screen.getByRole('button', { name, hidden: true })
const menuItem = (name: string) => screen.getByRole('menuitem', { name })

describe('FabMenu', () => {
  it('renders a trigger named by aria-label, closed, with aria-haspopup and aria-expanded', () => {
    render(<Create />)
    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('type', 'button')
    expect(trigger()).toHaveAttribute('aria-haspopup', 'true')
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).not.toHaveAttribute('aria-controls')
  })

  it('can be named by aria-labelledby instead', () => {
    render(
      <>
        <span id="name">Create</span>
        <MenuTrigger>
          <FabMenuButton aria-labelledby="name">
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu>
              <FabMenuItem>Email</FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('renders no item stack while closed', () => {
    render(<Create />)
    expect(screen.queryByRole('menu', { hidden: true })).not.toBeInTheDocument()
  })

  it('renders no element of its own: React Aria’s MenuTrigger puts the FAB where it is written', () => {
    const { container } = render(<Create />)
    expect(trigger().parentElement).toBe(container)
  })

  describe('open', () => {
    it('opens from the trigger as a menu named by it, with its items in the menuitem role, and takes the focus', async () => {
      const user = userEvent.setup()
      render(<Create />)
      await user.click(trigger())
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      // React Aria reports the trigger pressed while the menu it opened is open.
      expect(trigger()).toHaveAttribute('data-pressed')
      const menu = screen.getByRole('menu', { name: 'Create' })
      expect(trigger()).toHaveAttribute('aria-controls', menu.id)
      expect(menu).toHaveFocus()
      expect(menuItem('Email')).toBeInTheDocument()
      expect(menuItem('Message')).toBeInTheDocument()
    })

    it('renders the stack at the end of the page, outside the FAB’s own tree', async () => {
      const user = userEvent.setup()
      const { container } = render(<Create />)
      await user.click(trigger())
      expect(container.contains(screen.getByRole('menu'))).toBe(false)
      expect(screen.getByRole('menu').closest('body')).toBe(document.body)
    })

    it('hides the rest of the page from assistive technology while open, the FAB with it', async () => {
      const user = userEvent.setup()
      render(<Create />)
      await user.click(trigger())
      expect(screen.queryByRole('button', { name: 'Create' })).toBeNull()
      expect(trigger()).toBeInTheDocument()
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.getByRole('button', { name: 'Create' })).toBeVisible())
    })

    it('focuses no item when opened with a pointer', async () => {
      const user = userEvent.setup()
      render(<Create />)
      await user.click(trigger())
      expect(menuItem('Email')).not.toHaveAttribute('data-focused')
      expect(menuItem('Email')).not.toHaveFocus()
    })

    it('focuses the item the pointer hovers, as React Aria does, without the keyboard’s focus-visible', async () => {
      const user = userEvent.setup()
      render(<Create />)
      await user.click(trigger())
      await user.hover(menuItem('Email'))
      expect(menuItem('Email')).toHaveAttribute('data-hovered')
      expect(menuItem('Email')).toHaveAttribute('data-focused')
      expect(menuItem('Email')).toHaveFocus()
      expect(menuItem('Email')).not.toHaveAttribute('data-focus-visible')
      await user.hover(menuItem('Message'))
      expect(menuItem('Message')).toHaveAttribute('data-focused')
      expect(menuItem('Email')).not.toHaveAttribute('data-focused')
    })

    it('calls onPress on the trigger when clicked', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(<Create onPress={onPress} />)
      await user.click(trigger())
      expect(onPress).toHaveBeenCalledTimes(1)
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    })

    it('closes from the trigger again, with the focus back on it, and the item stack gone once it has left', async () => {
      const user = userEvent.setup()
      render(<Create />)
      await user.click(trigger())
      await user.click(trigger())
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      // React Aria keeps the leaving stack for its exit transition, which jsdom runs none of.
      await waitFor(() => expect(screen.queryByRole('menu', { hidden: true })).toBeNull())
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('closes on a click outside', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Create />
          <button>Elsewhere</button>
        </>,
      )
      await user.click(trigger())
      await user.click(trigger('Elsewhere'))
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes once an item is selected, calling its onAction and the list’s with its id, not the trigger’s onPress, with the focus back on the trigger', async () => {
      const onTriggerPress = vi.fn()
      const onItemAction = vi.fn()
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <FabMenuButton aria-label="Create" onPress={onTriggerPress}>
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu onAction={onAction}>
              <FabMenuItem id="email" onAction={onItemAction}>
                Email
              </FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      onTriggerPress.mockClear()
      await user.click(menuItem('Email'))
      expect(onItemAction).toHaveBeenCalledTimes(1)
      expect(onAction).toHaveBeenCalledTimes(1)
      expect(onAction.mock.calls[0]?.[0]).toBe('email')
      expect(onTriggerPress).not.toHaveBeenCalled()
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      // React Aria puts the focus back once the stack has left.
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('is held open by the MenuTrigger’s isOpen, which reports what would change it to onOpenChange', async () => {
      const onOpenChange = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger isOpen onOpenChange={onOpenChange}>
          <FabMenuButton aria-label="Create">
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu>
              <FabMenuItem>Email</FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>,
      )
      expect(screen.getByRole('menu')).toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
      expect(screen.getByRole('menu')).toBeInTheDocument()
    })

    it('opens at first given the MenuTrigger’s defaultOpen, as its own state from then on', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger defaultOpen>
          <FabMenuButton aria-label="Create">
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu>
              <FabMenuItem>Email</FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>,
      )
      expect(screen.getByRole('menu')).toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('keyboard', () => {
    it.each([
      ['{Enter}', 'Email'],
      [' ', 'Email'],
      ['{ArrowDown}', 'Email'],
      ['{ArrowUp}', 'Message'],
    ])('opens with %s from the trigger, with %s focused', async (key, name) => {
      const user = userEvent.setup()
      render(<Create />)
      await user.tab()
      expect(trigger()).toHaveFocus()
      await user.keyboard(key)
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      // The focus is on the item itself, as React Aria has it, not an aria-activedescendant.
      expect(menuItem(name)).toHaveFocus()
      expect(menuItem(name)).toHaveAttribute('data-focused')
      expect(menuItem(name)).toHaveAttribute('data-focus-visible')
      expect(screen.getByRole('menu')).not.toHaveAttribute('aria-activedescendant')
    })

    it('still calls the trigger’s own onKeyDown', async () => {
      const onKeyDown = vi.fn()
      const user = userEvent.setup()
      render(<Create onKeyDown={onKeyDown} />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(onKeyDown).toHaveBeenCalledTimes(1)
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    })

    it('moves the focus with the arrow keys, Home and End, and by typing a letter of an item’s textValue', async () => {
      const user = userEvent.setup()
      render(<Create />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(menuItem('Email')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(menuItem('Message')).toHaveFocus()
      await user.keyboard('{ArrowUp}')
      expect(menuItem('Email')).toHaveFocus()
      await user.keyboard('{End}')
      expect(menuItem('Message')).toHaveFocus()
      await user.keyboard('{Home}')
      expect(menuItem('Email')).toHaveFocus()
      await user.keyboard('m')
      expect(menuItem('Message')).toHaveFocus()
    })

    it('selects the focused item with Enter, calling its onAction and closing', async () => {
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <FabMenuButton aria-label="Create">
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu>
              <FabMenuItem>Email</FabMenuItem>
              <FabMenuItem onAction={onAction}>Message</FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>,
      )
      await user.tab()
      await user.keyboard('{Enter}{ArrowDown}{Enter}')
      expect(onAction).toHaveBeenCalledTimes(1)
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('closes with Escape, with the focus back on the trigger', async () => {
      const user = userEvent.setup()
      render(<Create />)
      await user.tab()
      await user.keyboard('{Enter}{Escape}')
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      await waitFor(() => expect(trigger()).toHaveFocus())
    })

    it('keeps the focus in the stack on Tab, as React Aria keeps it in a modal popover', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Create />
          <button>After</button>
        </>,
      )
      await user.tab()
      await user.keyboard('{Enter}')
      await user.tab()
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement)
      await user.tab({ shift: true })
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement)
    })
  })

  describe('disabled', () => {
    it('disables the trigger, which then cannot open the menu or be focused', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(<Create onPress={onPress} isDisabled />)
      expect(trigger()).toBeDisabled()
      await user.click(trigger())
      await user.tab()
      expect(onPress).not.toHaveBeenCalled()
      expect(trigger()).not.toHaveFocus()
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    })

    it('disables an item with aria-disabled, skipped by the keyboard and deaf to clicks, not natively', async () => {
      const onAction = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <FabMenuButton aria-label="Create">
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu>
              <FabMenuItem isDisabled onAction={onAction}>
                Email
              </FabMenuItem>
              <FabMenuItem>Message</FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>,
      )
      await user.tab()
      await user.keyboard('{Enter}')
      const email = menuItem('Email')
      expect(email).toHaveAttribute('aria-disabled', 'true')
      expect(email).toHaveAttribute('data-disabled')
      expect(email).not.toBeDisabled()
      expect(menuItem('Message')).toHaveFocus()
      await user.click(email)
      expect(onAction).not.toHaveBeenCalled()
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    })

    it('disables the items the list’s disabledKeys name, by their id', async () => {
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <FabMenuButton aria-label="Create">
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu disabledKeys={['email']}>
              <FabMenuItem id="email">Email</FabMenuItem>
              <FabMenuItem id="message">Message</FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      expect(menuItem('Email')).toHaveAttribute('aria-disabled', 'true')
      expect(menuItem('Message')).not.toHaveAttribute('aria-disabled')
    })
  })

  describe('children as a function', () => {
    /** A FAB menu whose FAB and items are each a function of the state React Aria reports of it. */
    const Stated = () => (
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          {({ isPressed, isHovered }) => (
            <Icon name={`add${isPressed ? ' pressed' : ''}${isHovered ? ' hover' : ''}`} />
          )}
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem textValue="Email">
              {({ isFocused, isFocusVisible }) =>
                `Email${isFocused ? ' focus' : ''}${isFocusVisible ? ' ring' : ''}`
              }
            </FabMenuItem>
            <FabMenuItem textValue="Message" isDisabled>
              {({ isDisabled }) => (
                <>
                  <Icon name="chat" />
                  {`Message${isDisabled ? ' disabled' : ''}`}
                </>
              )}
            </FabMenuItem>
            <FabMenuItem textValue="Done">
              {({ isPressed }) => `Done${isPressed ? ' pressed' : ''}`}
            </FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>
    )

    it('calls the FAB’s with the state React Aria reports of it, pressed while the menu is open', async () => {
      const user = userEvent.setup()
      render(<Stated />)
      expect(trigger()).toHaveTextContent('add')
      await user.hover(trigger())
      expect(trigger()).toHaveTextContent('add hover')
      await user.click(trigger())
      expect(trigger()).toHaveTextContent('add pressed hover')
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      // The close icon and the ripple are the FAB's own still.
      expect(screen.getByText('close')).toHaveAttribute('aria-hidden', 'true')
      expect(trigger().querySelector('.state-layer')).toBeInTheDocument()
    })

    it('calls each item’s with the state React Aria reports of its MenuItem', async () => {
      const user = userEvent.setup()
      render(<Stated />)
      await user.tab()
      await user.keyboard('{Enter}')
      const [email, message, done] = screen.getAllByRole('menuitem')
      expect(email).toHaveAccessibleName('Email focus ring')
      expect(message).toHaveAccessibleName('Message disabled')
      expect(message).toHaveAttribute('aria-disabled', 'true')
      expect(done).toHaveAccessibleName('Done')
      // The keyboard moves on, past the disabled item.
      await user.keyboard('{ArrowDown}')
      expect(email).toHaveAccessibleName('Email')
      expect(done).toHaveFocus()
    })

    it('calls the stack’s with the state React Aria reports of its Popover', async () => {
      const stackState = vi.fn()
      const user = userEvent.setup()
      render(
        <MenuTrigger>
          <FabMenuButton aria-label="Create">
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            {(state) => {
              stackState(state)
              return (
                <FabMenu>
                  <FabMenuItem>Email</FabMenuItem>
                </FabMenu>
              )
            }}
          </FabMenuPopover>
        </MenuTrigger>,
      )
      await user.click(trigger())
      expect(stackState).toHaveBeenLastCalledWith(
        expect.objectContaining({ trigger: 'MenuTrigger', isExiting: false }),
      )
      expect(stackState.mock.lastCall?.[0]).toHaveProperty('placement')
      expect(stackState.mock.lastCall?.[0]).toHaveProperty('isEntering')
      expect(menuItem('Email')).toBeInTheDocument()
    })

    it('types what the FAB’s class and an item are passed', () => {
      expectTypeOf<keyof FabMenuButtonRenderProps>().toEqualTypeOf<
        'isHovered' | 'isPressed' | 'isFocused' | 'isFocusVisible' | 'isDisabled' | 'isPending'
      >()
      expectTypeOf<FabMenuItemRenderProps>().toHaveProperty('isFocused')
      expectTypeOf<FabMenuItemRenderProps>().toHaveProperty('isFocusVisible')
      expectTypeOf<FabMenuItemRenderProps>().toHaveProperty('isDisabled')
    })
  })

  it('draws its items for its `items`, as React Aria’s Menu draws a dynamic collection', async () => {
    const actions = [
      { id: 'email', name: 'Email' },
      { id: 'message', name: 'Message' },
    ]
    const onAction = vi.fn()
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu items={actions} onAction={onAction}>
            {(action) => <FabMenuItem>{action.name}</FabMenuItem>}
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Email',
      'Message',
    ])
    await user.click(menuItem('Message'))
    expect(onAction.mock.calls[0]?.[0]).toBe('message')
  })

  it('hides the icon children of the trigger and items from assistive technology', async () => {
    const user = userEvent.setup()
    render(<Create />)
    await user.click(trigger())
    expect(screen.getByText('add')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('close')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('mail')).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws the state layer and ripple on the trigger and every item', async () => {
    const user = userEvent.setup()
    render(<Create />)
    await user.click(trigger())
    for (const el of [trigger(), ...screen.getAllByRole('menuitem')]) {
      expect(el.querySelector('.state-layer')).toBeInTheDocument()
    }
  })

  it('lets an item have a label with no icon', async () => {
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    expect(menuItem('Email').querySelector('.font-icon')).not.toBeInTheDocument()
  })
})

describe('FabMenuButton', () => {
  it('forwards a custom class, other native props and the ref to the trigger', () => {
    let ref: Element | null = null
    render(
      <MenuTrigger>
        <FabMenuButton
          aria-label="Create"
          className="fixed"
          data-testid="trigger"
          ref={(node) => {
            ref = node
          }}
        >
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    expect(ref).toBe(screen.getByTestId('trigger'))
    expect(trigger()).toHaveClass('fixed')
  })

  it('takes className as a function of the state React Aria reports, pressed while the menu is open, as a React Aria Button', async () => {
    const user = userEvent.setup()
    render(<Create className={({ isPressed }) => (isPressed ? 'pressed' : 'released')} />)
    expect(trigger()).toHaveClass('released')
    await user.click(trigger())
    expect(trigger()).toHaveClass('pressed')
    expect(trigger()).not.toHaveClass('released')
    const misuse = () => (
      // @ts-expect-error it is passed the state React Aria reports of its Button alone
      <Create className={({ isOpen }) => String(isOpen)} />
    )
    expect(misuse).toBeTypeOf('function')
  })

  it('renders its elementType, as every button here does, with an href for an "a"', () => {
    expectTypeOf<FabMenuButtonProps>().toHaveProperty('elementType')
    expectTypeOf<FabMenuButtonProps<'a'>>().toHaveProperty('href')
  })
})

describe('FabMenuPopover', () => {
  it('forwards a custom class, other props and the ref to the stack, the popover around the list', async () => {
    let ref: HTMLElement | null = null
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover
          className="max-w-full"
          data-testid="stack"
          ref={(node) => {
            ref = node
          }}
        >
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    const stack = screen.getByTestId('stack')
    expect(ref).toBe(stack)
    expect(stack).toHaveClass('max-w-full')
    expect(stack).toContainElement(screen.getByRole('menu'))
  })

  it('takes className as a function of its state, as a React Aria Popover', async () => {
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover
          data-testid="stack"
          className={({ isExiting }) => (isExiting ? 'leaving' : 'shown')}
        >
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    expect(screen.getByTestId('stack')).toHaveClass('shown')
  })
})

describe('FabMenu (the list)', () => {
  it('forwards a custom class, other props and the ref to the list, the element in the menu role', async () => {
    let ref: HTMLDivElement | null = null
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu
            className="max-w-full"
            data-testid="list"
            ref={(node) => {
              ref = node
            }}
          >
            <FabMenuItem>Email</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    const list = screen.getByRole('menu')
    expect(ref).toBe(list)
    expect(list).toBe(screen.getByTestId('list'))
    expect(list).toHaveClass('max-w-full')
  })

  it('takes className as a function of its state, as a React Aria Menu', async () => {
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu className={({ isEmpty }) => (isEmpty ? 'empty' : 'filled')}>
            <FabMenuItem>Email</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    expect(screen.getByRole('menu')).toHaveClass('filled')
  })
})

describe('FabMenuItem', () => {
  it('forwards a custom class, other props and the ref', async () => {
    let ref: HTMLDivElement | null = null
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem
              className="max-w-full"
              data-testid="item"
              ref={(node) => {
                ref = node
              }}
            >
              Email
            </FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    const item = screen.getByTestId('item')
    expect(ref).toBe(item)
    expect(item).toHaveClass('max-w-full')
    expect(item).toHaveAttribute('role', 'menuitem')
  })

  it('is a link given an href, and takes className as a function of its state, as a React Aria MenuItem', async () => {
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem href="#email" className={({ isHovered }) => (isHovered ? 'over' : 'off')}>
              Email
            </FabMenuItem>
            <FabMenuItem>Chat</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.click(trigger())
    const link = menuItem('Email')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '#email')
    expect(link).toHaveClass('off')
    await user.hover(link)
    expect(link).toHaveClass('over')
  })

  it('is found by typing its text when that is all it holds, as React Aria has it', async () => {
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
            <FabMenuItem>Message</FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.tab()
    await user.keyboard('{Enter}m')
    expect(menuItem('Message')).toHaveFocus()
  })

  it('is found by its textValue otherwise, which its types then require, and not by the text beside its icon', async () => {
    const user = userEvent.setup()
    render(
      <MenuTrigger>
        <FabMenuButton aria-label="Create">
          <Icon name="add" />
        </FabMenuButton>
        <FabMenuPopover>
          <FabMenu>
            <FabMenuItem>Email</FabMenuItem>
            <FabMenuItem textValue="Share">
              <Icon name="share" />
              Share
            </FabMenuItem>
            {/* @ts-expect-error an item with an icon beside its text needs a textValue */}
            <FabMenuItem>
              <Icon name="folder" />
              Folder
            </FabMenuItem>
          </FabMenu>
        </FabMenuPopover>
      </MenuTrigger>,
    )
    await user.tab()
    await user.keyboard('{Enter}s')
    expect(menuItem('Share')).toHaveFocus()
    // The search lapses after a second: the next letter starts one of its own.
    await new Promise((resolve) => setTimeout(resolve, 1100))
    await user.keyboard('f')
    expect(menuItem('Share')).toHaveFocus()
  })
})
