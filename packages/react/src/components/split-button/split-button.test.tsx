import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../icon'
import { Menu, MenuItem, MenuPopover } from '../menu'
import { SplitButton, SplitButtonLeading, SplitButtonTrailing } from './split-button'

/*
 * Behavior and markup that jsdom can check without a stylesheet: attributes,
 * accessible names, DOM structure and event handling. What a class resolves
 * to visually - colors, corners, size, ring width - needs the real
 * stylesheet, so it is checked in split-button.browser.test.tsx instead.
 */

describe('SplitButton', () => {
  it('renders a leading button named by its label and a trailing button named by its aria-label', () => {
    render(
      <SplitButton>
        <SplitButtonLeading>Reply</SplitButtonLeading>
        <SplitButtonTrailing aria-label="More reply options" />
      </SplitButton>,
    )
    const leading = screen.getByRole('button', { name: 'Reply' })
    const trailing = screen.getByRole('button', { name: 'More reply options' })
    expect(leading).toHaveAttribute('type', 'button')
    expect(trailing).toHaveAttribute('type', 'button')
  })

  it('types the trailing button as needing a name', () => {
    const misuse = () => [
      // @ts-expect-error it has no visible text, so nothing else names it
      <SplitButtonTrailing key="unnamed" />,
    ]
    expect(misuse).toBeTypeOf('function')
  })

  it('takes no children on the trailing button, whose icon is its own', () => {
    const misuse = () => [
      // @ts-expect-error the menu icon is drawn by the button
      <SplitButtonTrailing key="children" aria-label="More" children="More" />,
    ]
    expect(misuse).toBeTypeOf('function')
  })

  it('lets an icon-only leading button be named by aria-label or aria-labelledby', () => {
    const { rerender } = render(
      <SplitButton>
        <SplitButtonLeading aria-label="Favorite">
          <Icon name="favorite" />
        </SplitButtonLeading>
        <SplitButtonTrailing aria-label="More options" />
      </SplitButton>,
    )
    expect(screen.getByRole('button', { name: 'Favorite' })).toBeInTheDocument()

    rerender(
      <>
        <span id="name">Favorite</span>
        <SplitButton>
          <SplitButtonLeading aria-labelledby="name">
            <Icon name="favorite" />
          </SplitButtonLeading>
          <SplitButtonTrailing aria-label="More options" />
        </SplitButton>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Favorite' })).toBeInTheDocument()
  })

  it('hides the leading icon from assistive technology, next to the accessible label', () => {
    render(
      <SplitButton>
        <SplitButtonLeading>
          <Icon name="reply" />
          Reply
        </SplitButtonLeading>
      </SplitButton>,
    )
    expect(screen.getByText('reply')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'Reply' })).toBeInTheDocument()
  })

  it('passes the trailing button’s aria props as they are', () => {
    const { rerender } = render(
      <SplitButtonTrailing
        aria-label="More options"
        aria-expanded={false}
        aria-haspopup="menu"
        aria-controls="reply-menu"
      />,
    )
    const trailing = screen.getByRole('button', { name: 'More options' })
    expect(trailing).toHaveAttribute('aria-expanded', 'false')
    expect(trailing).toHaveAttribute('aria-haspopup', 'menu')
    expect(trailing).toHaveAttribute('aria-controls', 'reply-menu')

    rerender(<SplitButtonTrailing aria-label="More options" />)
    expect(trailing).not.toHaveAttribute('aria-expanded')
    expect(trailing).not.toHaveAttribute('aria-haspopup')
    expect(trailing).not.toHaveAttribute('aria-controls')
  })

  it('draws the state layer and ripple on both buttons', () => {
    render(
      <SplitButton>
        <SplitButtonLeading>Reply</SplitButtonLeading>
        <SplitButtonTrailing aria-label="More options" />
      </SplitButton>,
    )
    for (const button of screen.getAllByRole('button')) {
      expect(button.querySelector('.state-layer')).toBeInTheDocument()
    }
  })

  describe('in React Aria’s MenuTrigger', () => {
    const Reply = () => (
      <SplitButton>
        <SplitButtonLeading>Reply</SplitButtonLeading>
        <MenuTrigger>
          <SplitButtonTrailing aria-label="More options" />
          <MenuPopover>
            <Menu>
              <MenuItem>Forward</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </SplitButton>
    )

    it('opens the menu from the trailing button, which says so, points at it and names it', async () => {
      const user = userEvent.setup()
      render(<Reply />)
      const trailing = screen.getByRole('button', { name: 'More options' })
      expect(trailing).toHaveAttribute('aria-haspopup', 'true')
      expect(trailing).toHaveAttribute('aria-expanded', 'false')

      await user.click(trailing)
      const menu = await screen.findByRole('menu', { name: 'More options' })
      expect(trailing).toHaveAttribute('aria-expanded', 'true')
      expect(trailing).toHaveAttribute('aria-controls', menu.id)
    })

    it('leaves the leading button out of it', async () => {
      const user = userEvent.setup()
      render(<Reply />)
      const leading = screen.getByRole('button', { name: 'Reply' })
      await user.click(leading)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(leading).not.toHaveAttribute('aria-expanded')
      expect(leading).not.toHaveAttribute('aria-haspopup')
      expect(leading).not.toHaveAttribute('aria-pressed')
    })
  })

  describe('interaction', () => {
    it('calls each button’s onPress alone', async () => {
      const onReply = vi.fn()
      const onMore = vi.fn()
      const user = userEvent.setup()
      render(
        <SplitButton>
          <SplitButtonLeading onPress={onReply}>Reply</SplitButtonLeading>
          <SplitButtonTrailing aria-label="More options" onPress={onMore} />
        </SplitButton>,
      )
      await user.click(screen.getByRole('button', { name: 'Reply' }))
      expect(onReply).toHaveBeenCalledTimes(1)
      expect(onMore).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'More options' }))
      expect(onMore).toHaveBeenCalledTimes(1)
      expect(onReply).toHaveBeenCalledTimes(1)
    })

    it('lets the caller flip aria-expanded from onPress', async () => {
      function Expandable() {
        const [expanded, setExpanded] = useState(false)
        return (
          <SplitButtonTrailing
            aria-label="More options"
            aria-expanded={expanded}
            onPress={() => setExpanded(!expanded)}
          />
        )
      }
      const user = userEvent.setup()
      render(<Expandable />)
      const trailing = screen.getByRole('button', { name: 'More options' })
      expect(trailing).toHaveAttribute('aria-expanded', 'false')
      await user.click(trailing)
      expect(trailing).toHaveAttribute('aria-expanded', 'true')
      await user.click(trailing)
      expect(trailing).toHaveAttribute('aria-expanded', 'false')
    })

    it('reaches the leading button then the trailing button with Tab', async () => {
      const user = userEvent.setup()
      render(
        <SplitButton>
          <SplitButtonLeading>Reply</SplitButtonLeading>
          <SplitButtonTrailing aria-label="More options" />
        </SplitButton>,
      )
      await user.tab()
      expect(screen.getByRole('button', { name: 'Reply' })).toHaveFocus()
      await user.tab()
      expect(screen.getByRole('button', { name: 'More options' })).toHaveFocus()
    })

    it('is activated by both Space and Enter', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(<SplitButtonLeading onPress={onPress}>Reply</SplitButtonLeading>)
      await user.tab()
      await user.keyboard(' ')
      expect(onPress).toHaveBeenCalledTimes(1)
      await user.keyboard('{Enter}')
      expect(onPress).toHaveBeenCalledTimes(2)
    })

    it('disables each button by its own isDisabled, which then cannot be focused or clicked', async () => {
      const onReply = vi.fn()
      const onMore = vi.fn()
      const user = userEvent.setup()
      render(
        <SplitButton>
          <SplitButtonLeading isDisabled onPress={onReply}>
            Reply
          </SplitButtonLeading>
          <SplitButtonTrailing aria-label="More options" isDisabled onPress={onMore} />
        </SplitButton>,
      )
      const leading = screen.getByRole('button', { name: 'Reply' })
      const trailing = screen.getByRole('button', { name: 'More options' })
      expect(leading).toBeDisabled()
      expect(trailing).toBeDisabled()

      await user.click(leading)
      await user.click(trailing)
      await user.tab()
      expect(onReply).not.toHaveBeenCalled()
      expect(onMore).not.toHaveBeenCalled()
      expect(leading).not.toHaveFocus()
      expect(trailing).not.toHaveFocus()
    })
  })

  describe('children as a function', () => {
    it('is called with the state React Aria reports of the leading button, not the trailing one’s', async () => {
      const user = userEvent.setup()
      render(
        <SplitButton>
          <SplitButtonLeading>
            {({ isHovered, isFocusVisible }) =>
              `Send${isHovered ? ' hover' : ''}${isFocusVisible ? ' focus' : ''}`
            }
          </SplitButtonLeading>
          <SplitButtonTrailing aria-label="More send options" />
        </SplitButton>,
      )
      const [leading, trailing] = screen.getAllByRole('button')
      expect(leading).toHaveAccessibleName('Send')
      await user.hover(leading!)
      expect(leading).toHaveAccessibleName('Send hover')
      await user.click(trailing!)
      expect(leading).toHaveAccessibleName('Send')
      await user.tab({ shift: true })
      expect(leading).toHaveAccessibleName('Send focus')
      expect(leading!.querySelector('.state-layer')).toBeInTheDocument()
    })

    it('draws an icon and a label the function returns together, as an <a> too', () => {
      render(
        <SplitButtonLeading elementType="a" href="#reply">
          {({ isHovered }) => (
            <>
              <Icon name="reply" />
              {isHovered ? 'Reply to' : 'Reply'}
            </>
          )}
        </SplitButtonLeading>,
      )
      const leading = screen.getByRole('button', { name: 'Reply' })
      expect(leading).toHaveAttribute('href', '#reply')
      expect(screen.getByText('reply')).toHaveAttribute('aria-hidden', 'true')
    })

    it('types what the function is passed', () => {
      const misuse = () => [
        <SplitButtonLeading key="state">
          {/* @ts-expect-error it is passed the state React Aria reports of the leading button alone */}
          {({ isExpanded }) => String(isExpanded)}
        </SplitButtonLeading>,
      ]
      expect(misuse).toBeTypeOf('function')
    })
  })

  it('puts the props of a <div> and the ref on the element that holds the two', () => {
    let ref: Element | null = null
    render(
      <SplitButton
        data-testid="split"
        className="max-w-full"
        ref={(node) => {
          ref = node
        }}
      >
        <SplitButtonLeading>Reply</SplitButtonLeading>
      </SplitButton>,
    )
    const split = screen.getByTestId('split')
    expect(ref).toBe(split)
    expect(split).toHaveClass('max-w-full')
    expect(screen.getByRole('button', { name: 'Reply' })).not.toHaveClass('max-w-full')
  })

  it('forwards a custom class to each button, as a function of its state too', () => {
    render(
      <SplitButton>
        <SplitButtonLeading className="max-w-full">Reply</SplitButtonLeading>
        <SplitButtonTrailing
          aria-label="More options"
          isDisabled
          className={({ isDisabled }) => (isDisabled ? 'off' : 'on')}
        />
      </SplitButton>,
    )
    expect(screen.getByRole('button', { name: 'Reply' })).toHaveClass('max-w-full')
    expect(screen.getByRole('button', { name: 'More options' })).toHaveClass('off')
  })

  it('forwards other native props and the ref to each button', () => {
    let leadingRef: Element | null = null
    let trailingRef: Element | null = null
    render(
      <SplitButton>
        <SplitButtonLeading
          data-testid="reply"
          ref={(node) => {
            leadingRef = node
          }}
        >
          Reply
        </SplitButtonLeading>
        <SplitButtonTrailing
          aria-label="More options"
          data-testid="more"
          ref={(node) => {
            trailingRef = node
          }}
        />
      </SplitButton>,
    )
    expect(leadingRef).toBe(screen.getByTestId('reply'))
    expect(trailingRef).toBe(screen.getByTestId('more'))
  })

  it('renders the leading button as its elementType, an <a> in the button role with the props of a link given "a", as React Aria has it', () => {
    render(
      <SplitButton>
        <SplitButtonLeading elementType="a" href="#reply" target="_blank">
          Reply
        </SplitButtonLeading>
        <SplitButtonTrailing aria-label="More options" />
      </SplitButton>,
    )
    const leading = screen.getByRole('button', { name: 'Reply' })
    expect(leading.tagName).toBe('A')
    expect(leading).toHaveAttribute('href', '#reply')
    expect(leading).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('button', { name: 'More options' }).tagName).toBe('BUTTON')
  })
})
