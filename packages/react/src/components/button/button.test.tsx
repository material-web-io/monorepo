import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../icon'
import { Button } from './button'

/*
 * Behavior and markup that jsdom can check without a stylesheet: attributes,
 * accessible names, DOM structure and event handling. What a class resolves to
 * visually - colors, corners, size, ring width - needs the real stylesheet, so
 * it is checked in button.browser.test.tsx instead.
 */

describe('Button', () => {
  it('renders a labelled button that does not submit forms by default', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).not.toHaveAttribute('aria-pressed')
  })

  it('lets the type be overridden', () => {
    render(<Button type="submit">Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('draws the state layer and ripple without polluting the accessible name', () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole('button')
    expect(button.querySelector('.state-layer')).toBeInTheDocument()
    expect(button).toHaveAccessibleName('Save')
  })

  it('hides its icon from assistive technology, next to the accessible label', () => {
    render(
      <Button>
        <Icon name="add" />
        Label
      </Button>,
    )
    expect(screen.getByText('add')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button')).toHaveAccessibleName('Label')
  })

  it('shows no icon unless given one', () => {
    render(<Button>Label</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Label')
  })

  it('takes anything as its children, and draws them in the order given', () => {
    const count = 3
    render(
      <Button>
        Save {count} files
        <Icon name="arrow_drop_down" />
        {false}
        <span>now</span>
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Save 3 filesnow' })
    expect(button).toHaveTextContent('Save 3 filesarrow_drop_downnow')
  })

  describe('toggle', () => {
    it('is exposed as a toggle button through aria-pressed, given isSelectable', () => {
      const { rerender } = render(
        <Button isSelectable isSelected={false}>
          Label
        </Button>,
      )
      expect(screen.getByRole('button', { pressed: false })).toBeInTheDocument()
      rerender(
        <Button isSelectable isSelected>
          Label
        </Button>,
      )
      expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument()
    })

    it('starts unselected given isSelectable alone, and toggles when pressed', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <Button isSelectable onChange={onChange}>
          Label
        </Button>,
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
        <Button isSelectable defaultSelected onChange={onChange}>
          Label
        </Button>,
      )
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
      await user.click(screen.getByRole('button'))
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
      expect(onChange).toHaveBeenCalledExactlyOnceWith(false)
    })

    it('does not accept a selection without isSelectable, and ignores one passed anyway', () => {
      render(
        <>
          {/* @ts-expect-error only a selectable button takes isSelected */}
          <Button isSelected>Saved</Button>
          {/* @ts-expect-error only a selectable button takes defaultSelected */}
          <Button isSelectable={false} defaultSelected>
            Starred
          </Button>
        </>,
      )
      expect(screen.getByRole('button', { name: 'Saved' })).not.toHaveAttribute('aria-pressed')
      expect(screen.getByRole('button', { name: 'Starred' })).not.toHaveAttribute('aria-pressed')
    })

    it('does not accept isSelectable on a text button, and ignores it if passed anyway', () => {
      render(
        // @ts-expect-error text buttons are not toggles
        <Button variant="text" isSelectable isSelected>
          Label
        </Button>,
      )
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-pressed')
    })
  })

  describe('interaction', () => {
    it('calls onPress when clicked, and with Enter and Space', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(<Button onPress={onPress}>Label</Button>)

      await user.click(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)

      // Clicking focused it, so the keyboard now acts on it.
      expect(screen.getByRole('button')).toHaveFocus()
      await user.keyboard('{Enter}')
      await user.keyboard(' ')
      expect(onPress).toHaveBeenCalledTimes(3)
    })

    it('does nothing when disabled, and cannot be focused', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <Button isDisabled onPress={onPress}>
          Label
        </Button>,
      )
      await user.click(screen.getByRole('button'))
      await user.tab()
      expect(onPress).not.toHaveBeenCalled()
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).not.toHaveFocus()
    })

    it('pending, takes no press but keeps the focus, says aria-disabled and carries data-pending, as React Aria has it', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <Button isPending type="submit" onPress={onPress}>
          Saving
        </Button>,
      )
      const button = screen.getByRole('button')
      await user.click(button)
      await user.keyboard('{Enter}')
      expect(onPress).not.toHaveBeenCalled()
      expect(button).toHaveFocus()
      expect(button).not.toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveAttribute('data-pending')
      // A pending submit button submits nothing.
      expect(button).toHaveAttribute('type', 'button')
    })

    it('pending, is still named by its children, and its loading indicator is hidden from assistive technology', () => {
      render(<Button isPending>Save</Button>)
      expect(screen.getByRole('button')).toHaveAccessibleName('Save')
      expect(screen.queryByRole('progressbar', { hidden: true })).toBeNull()
      expect(screen.getByRole('button').lastElementChild).toHaveAttribute('aria-hidden', 'true')
    })

    it('pending as a toggle, keeps its selection and the focus, says aria-disabled and shows its loading indicator', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <Button isSelectable isPending onChange={onChange}>
          Bold
        </Button>,
      )
      const button = screen.getByRole('button')
      await user.click(button)
      await user.keyboard('{Enter}')
      await user.keyboard(' ')
      expect(onChange).not.toHaveBeenCalled()
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(button).toHaveFocus()
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveAttribute('data-pending')
      expect(button).toHaveAccessibleName('Bold')
      expect(button.lastElementChild).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('children as a function', () => {
    it('is called with the state React Aria reports of the button, as it changes, and draws what it returns', async () => {
      const user = userEvent.setup()
      render(
        <Button>
          {({ isHovered, isFocusVisible, isPressed }) => (
            <>
              <Icon name={isPressed ? 'pressed' : 'resting'} />
              {`Save${isHovered ? ' hover' : ''}${isFocusVisible ? ' focus' : ''}`}
            </>
          )}
        </Button>,
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName('Save')
      await user.tab()
      expect(button).toHaveAccessibleName('Save focus')
      await user.hover(button)
      expect(button).toHaveAccessibleName('Save hover focus')
      await user.pointer({ keys: '[MouseLeft>]', target: button })
      expect(screen.getByText('pressed')).toBeInTheDocument()
      await user.pointer({ keys: '[/MouseLeft]' })
      expect(screen.getByText('resting')).toBeInTheDocument()
      // The state layer, ripple and icon are the button's own still.
      expect(button.querySelector('.state-layer')).toBeInTheDocument()
      expect(screen.getByText('resting')).toHaveAttribute('aria-hidden', 'true')
    })

    it("is told whether a toggle is selected, React Aria's ToggleButton's own state", () => {
      render(
        <>
          <Button isSelectable isSelected>
            {({ isSelected }) => (isSelected ? 'Saved' : 'Save')}
          </Button>
          <Button isSelectable isSelected={false}>
            {({ isSelected }) => (isSelected ? 'Starred' : 'Star')}
          </Button>
        </>,
      )
      expect(screen.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'Star' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('is told that it is disabled', () => {
      render(<Button isDisabled>{({ isDisabled }) => (isDisabled ? 'Sending' : 'Send')}</Button>)
      expect(screen.getByRole('button', { name: 'Sending' })).toBeDisabled()
    })

    it('types what the function is passed, and lets it return anything', () => {
      const misuse = () => [
        <Button key="pair">
          {({ isHovered }) => [<Icon key="icon" name={isHovered ? 'a' : 'b'} />, 'Save']}
        </Button>,
        <Button key="number">{() => 12}</Button>,
        <Button key="labels">{() => ['Save', 'all']}</Button>,
        // @ts-expect-error it is passed no such state
        <Button key="state">{({ pressed }) => String(pressed)}</Button>,
      ]
      expect(misuse).toBeTypeOf('function')
    })
  })

  it('forwards a custom class, other props and the ref', () => {
    let ref: Element | null = null
    render(
      <Button
        className="bg-tertiary"
        data-testid="b"
        ref={(node) => {
          ref = node
        }}
      >
        Label
      </Button>,
    )
    const button = screen.getByTestId('b')
    expect(ref).toBe(button)
  })

  it("takes className as a function of the state React Aria reports, given React Aria's own class too", () => {
    render(
      <>
        <Button className={({ defaultClassName }) => `${defaultClassName} m-space-100`}>
          Send
        </Button>
        <Button isDisabled className={({ isDisabled }) => (isDisabled ? 'off' : 'on')}>
          Save
        </Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Send' })).toHaveClass(
      'react-aria-Button',
      'm-space-100',
    )
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass('off')
  })

  it("takes className as a function of a toggle's state too, given React Aria's ToggleButton class", () => {
    render(
      <Button
        isSelectable
        defaultSelected
        className={({ isSelected, defaultClassName }) =>
          `${defaultClassName} ${isSelected ? 'on' : 'off'}`
        }
      >
        Star
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Star' })).toHaveClass(
      'react-aria-ToggleButton',
      'on',
    )
  })
})
