import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../icon'
import { IconButton } from './icon-button'

/*
 * Behavior and markup that jsdom can check without a stylesheet: attributes,
 * accessible names, DOM structure and event handling. What a class resolves to
 * visually - colors, corners, size, ring width - needs the real stylesheet, so
 * it is checked in icon-button.browser.test.tsx instead.
 */

describe('IconButton', () => {
  it('renders a button named by its aria-label that does not submit forms by default', () => {
    render(
      <IconButton aria-label="Favorite">
        <Icon name="favorite" />
      </IconButton>,
    )
    const button = screen.getByRole('button', { name: 'Favorite' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).not.toHaveAttribute('aria-pressed')
  })

  it('can be named by aria-labelledby instead', () => {
    render(
      <>
        <span id="name">Settings</span>
        <IconButton aria-labelledby="name">
          <Icon name="settings" />
        </IconButton>
      </>,
    )
    expect(screen.getByRole('button')).toHaveAccessibleName('Settings')
  })

  it('requires a name, since it has no visible label', () => {
    render(
      // @ts-expect-error an icon button needs aria-label or aria-labelledby
      <IconButton>
        <Icon name="favorite" />
      </IconButton>,
    )
  })

  it('lets the type be overridden', () => {
    render(
      <IconButton aria-label="Done" type="submit">
        <Icon name="check" />
      </IconButton>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('draws the state layer and ripple, and hides the icon from assistive technology', () => {
    render(
      <IconButton aria-label="Favorite">
        <Icon name="favorite" />
      </IconButton>,
    )
    const button = screen.getByRole('button')
    expect(button.querySelector('.state-layer')).toBeInTheDocument()
    expect(screen.getByText('favorite')).toHaveAttribute('aria-hidden', 'true')
    expect(button).toHaveAccessibleName('Favorite')
  })

  describe('toggle', () => {
    it('is exposed as a toggle button through aria-pressed, given isSelectable', () => {
      const { rerender } = render(
        <IconButton aria-label="Favorite" isSelectable isSelected={false}>
          <Icon name="favorite" />
        </IconButton>,
      )
      expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument()
      rerender(
        <IconButton aria-label="Favorite" isSelectable isSelected>
          <Icon name="favorite" />
        </IconButton>,
      )
      expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument()
    })

    it('starts unselected given isSelectable alone, and toggles when pressed', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <IconButton aria-label="Favorite" isSelectable onChange={onChange}>
          <Icon name="favorite" />
        </IconButton>,
      )
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
      expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
    })

    it('keeps its own selection when uncontrolled, from defaultSelected, and reports it', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <IconButton aria-label="Favorite" isSelectable defaultSelected onChange={onChange}>
          <Icon name="favorite" />
        </IconButton>,
      )
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
      expect(onChange).toHaveBeenCalledExactlyOnceWith(false)
    })

    it('does not accept a selection without isSelectable, and ignores one passed anyway', () => {
      render(
        <>
          {/* @ts-expect-error only a selectable icon button takes isSelected */}
          <IconButton aria-label="Saved" isSelected>
            <Icon name="bookmark" />
          </IconButton>
          {/* @ts-expect-error only a selectable icon button takes defaultSelected */}
          <IconButton aria-label="Starred" isSelectable={false} defaultSelected>
            <Icon name="star" />
          </IconButton>
        </>,
      )
      expect(screen.getByRole('button', { name: 'Saved' })).not.toHaveAttribute('aria-pressed')
      expect(screen.getByRole('button', { name: 'Starred' })).not.toHaveAttribute('aria-pressed')
    })

    it('can be a toggle in every color style', () => {
      render(
        <>
          {(['filled', 'tonal', 'outlined', 'standard'] as const).map((variant) => (
            <IconButton key={variant} aria-label={variant} variant={variant} isSelectable>
              <Icon name="favorite" />
            </IconButton>
          ))}
        </>,
      )
      expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(4)
    })
  })

  describe('interaction', () => {
    it('calls onPress when clicked, and with Enter and Space', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <IconButton aria-label="Add" onPress={onPress}>
          <Icon name="add" />
        </IconButton>,
      )

      await user.click(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)

      // Clicking focused it, so the keyboard now acts on it.
      expect(screen.getByRole('button')).toHaveFocus()
      await user.keyboard('{Enter}')
      await user.keyboard(' ')
      expect(onPress).toHaveBeenCalledTimes(3)
    })

    it('toggles aria-pressed from the keyboard when the caller flips isSelected', async () => {
      function Favorite() {
        const [on, setOn] = useState(false)
        return (
          <IconButton aria-label="Favorite" isSelectable isSelected={on} onChange={setOn}>
            <Icon name="favorite" className={on ? 'icon-filled' : undefined} />
          </IconButton>
        )
      }
      const user = userEvent.setup()
      render(<Favorite />)

      await user.tab()
      const button = screen.getByRole('button', { name: 'Favorite', pressed: false })
      expect(button).toHaveFocus()
      await user.keyboard(' ')
      expect(screen.getByRole('button', { name: 'Favorite', pressed: true })).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(screen.getByRole('button', { name: 'Favorite', pressed: false })).toHaveFocus()
    })

    it('is reached in order with Tab, skipping a disabled one', async () => {
      const user = userEvent.setup()
      render(
        <>
          <IconButton aria-label="Undo">
            <Icon name="undo" />
          </IconButton>
          <IconButton aria-label="Redo" isDisabled>
            <Icon name="redo" />
          </IconButton>
          <IconButton aria-label="Save">
            <Icon name="save" />
          </IconButton>
        </>,
      )
      await user.tab()
      expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()
      await user.tab()
      expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
    })

    it('does nothing when disabled, and cannot be focused', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <IconButton aria-label="Add" isDisabled onPress={onPress}>
          <Icon name="add" />
        </IconButton>,
      )
      await user.click(screen.getByRole('button'))
      await user.tab()
      expect(onPress).not.toHaveBeenCalled()
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).not.toHaveFocus()
    })
  })

  describe('children as a function', () => {
    it('is called with the state React Aria reports of a toggle, as it changes, and draws what it returns', async () => {
      const user = userEvent.setup()
      render(
        <IconButton aria-label="Favorite" isSelectable>
          {({ isSelected, isHovered, isFocusVisible }) => (
            <Icon
              name={`favorite${isSelected ? ' selected' : ''}${isHovered ? ' hover' : ''}${isFocusVisible ? ' focus' : ''}`}
              className={isSelected ? 'icon-filled' : undefined}
            />
          )}
        </IconButton>,
      )
      const button = screen.getByRole('button', { name: 'Favorite' })
      expect(button).toHaveTextContent('favorite')
      await user.tab()
      expect(button).toHaveTextContent('favorite focus')
      await user.keyboard('{Enter}')
      expect(button).toHaveTextContent('favorite selected focus')
      await user.hover(button)
      expect(button).toHaveTextContent('favorite selected hover focus')
      // The state layer and ripple are the button's own still, and the icon is hidden as ever.
      expect(button.querySelector('.state-layer')).toBeInTheDocument()
      expect(screen.getByText(/^favorite/)).toHaveAttribute('aria-hidden', 'true')
    })

    it('is told that it is pressed', async () => {
      const user = userEvent.setup()
      render(
        <IconButton aria-label="Add">
          {({ isPressed }) => <Icon name={isPressed ? 'pressed' : 'resting'} />}
        </IconButton>,
      )
      await user.pointer({ keys: '[MouseLeft>]', target: screen.getByRole('button') })
      expect(screen.getByText('pressed')).toBeInTheDocument()
      await user.pointer({ keys: '[/MouseLeft]' })
      expect(screen.getByText('resting')).toBeInTheDocument()
    })

    it('is told that it is disabled', () => {
      render(
        <IconButton aria-label="Send" isDisabled>
          {({ isDisabled }) => <Icon name={isDisabled ? 'block' : 'send'} />}
        </IconButton>,
      )
      expect(screen.getByRole('button', { name: 'Send' })).toHaveTextContent('block')
      expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
    })

    it('types what the function is passed, and lets it return anything', () => {
      const misuse = () => [
        <IconButton key="text" aria-label="Add">
          {() => 'add'}
        </IconButton>,
        <IconButton key="state" aria-label="Add">
          {/* @ts-expect-error it is passed no such state */}
          {({ pressed }) => <Icon name={String(pressed)} />}
        </IconButton>,
        <IconButton key="selected" aria-label="Add">
          {/* @ts-expect-error only a toggle is told whether it is selected */}
          {({ isSelected }) => <Icon name={String(isSelected)} />}
        </IconButton>,
      ]
      expect(misuse).toBeTypeOf('function')
    })
  })

  it('forwards a custom class, other props and the ref', () => {
    let ref: Element | null = null
    render(
      <IconButton
        aria-label="Add"
        variant="filled"
        className="bg-tertiary"
        data-testid="b"
        ref={(node) => {
          ref = node
        }}
      >
        <Icon name="add" />
      </IconButton>,
    )
    const button = screen.getByTestId('b')
    expect(ref).toBe(button)
  })

  it("takes className as a function of the state React Aria reports, given React Aria's own class too", () => {
    render(
      <>
        <IconButton
          aria-label="Add"
          className={({ defaultClassName }) => `${defaultClassName} m-space-100`}
        >
          <Icon name="add" />
        </IconButton>
        <IconButton
          aria-label="Send"
          isDisabled
          className={({ isDisabled }) => (isDisabled ? 'off' : 'on')}
        >
          <Icon name="send" />
        </IconButton>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Add' })).toHaveClass(
      'react-aria-Button',
      'm-space-100',
    )
    expect(screen.getByRole('button', { name: 'Send' })).toHaveClass('off')
  })

  it("takes className as a function of a toggle's state too, given React Aria's ToggleButton class", () => {
    render(
      <IconButton
        aria-label="Star"
        isSelectable
        defaultSelected
        className={({ isSelected, defaultClassName }) =>
          `${defaultClassName} ${isSelected ? 'on' : 'off'}`
        }
      >
        <Icon name="star" />
      </IconButton>,
    )
    expect(screen.getByRole('button', { name: 'Star' })).toHaveClass(
      'react-aria-ToggleButton',
      'on',
    )
  })
})
