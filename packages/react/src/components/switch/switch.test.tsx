import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './switch'

/* Behavior and markup that jsdom can check without a stylesheet: the hidden input in the
 * switch role React Aria renders in a label, its states and attributes, labelling, keys,
 * forms and events. What the states look like is checked in switch.browser.test.tsx instead. */

/** The hidden `<input>` in the switch role, which has the name, the state and the focus. */
const input = (name?: string) =>
  screen.getByRole<HTMLInputElement>('switch', name === undefined ? undefined : { name })

/** The `<label>` around it, React Aria's SwitchButton: what is pressed, and what reports the states. */
const pressed = (name?: string) => input(name).closest('label')!

/** The 52x32dp switch itself, the label's child after the hidden input's span. */
const host = (name?: string) => input(name).parentElement!.nextElementSibling!

describe('Switch', () => {
  it('renders a hidden checkbox input in the switch role, unselected by default, in the label that is pressed', () => {
    render(<Switch aria-label="Wi-Fi" />)
    const el = input('Wi-Fi')
    expect(el.tagName).toBe('INPUT')
    expect(el).toHaveAttribute('type', 'checkbox')
    expect(el).not.toBeChecked()
    expect(pressed('Wi-Fi').tagName).toBe('LABEL')
    // Both in the field, a <div>, which is the outermost element.
    expect(pressed('Wi-Fi').parentElement?.tagName).toBe('DIV')
  })

  it('is named by its label text, its children, which toggles and focuses it when clicked', async () => {
    const user = userEvent.setup()
    render(<Switch>Wi-Fi</Switch>)
    const el = input('Wi-Fi')
    await user.click(screen.getByText('Wi-Fi'))
    expect(el).toBeChecked()
    expect(el).toHaveFocus()
    await user.click(screen.getByText('Wi-Fi'))
    expect(el).not.toBeChecked()
  })

  it('is described through aria-describedby, and disabled by isDisabled, its label with it', () => {
    render(
      <>
        <Switch aria-label="Wi-Fi" aria-describedby="hint" isDisabled />
        <span id="hint">Public Campus Wi-Fi</span>
      </>,
    )
    const el = input('Wi-Fi')
    expect(el).toHaveAccessibleDescription('Public Campus Wi-Fi')
    expect(el).toBeDisabled()
    expect(pressed('Wi-Fi')).toHaveAttribute('data-disabled')
  })

  describe('uncontrolled', () => {
    it('starts from defaultSelected, and each click toggles it and reports the new state', async () => {
      const states: boolean[] = []
      const user = userEvent.setup()
      render(
        <Switch
          aria-label="Wi-Fi"
          defaultSelected
          onChange={(isSelected) => states.push(isSelected)}
        />,
      )
      const el = input('Wi-Fi')
      expect(el).toBeChecked()
      await user.click(pressed('Wi-Fi'))
      expect(el).not.toBeChecked()
      await user.click(pressed('Wi-Fi'))
      expect(el).toBeChecked()
      expect(states).toEqual([false, true])
    })

    it('goes back to its default when the form it is a field of resets', async () => {
      const user = userEvent.setup()
      render(
        <form>
          <Switch aria-label="Wi-Fi" name="wifi" defaultSelected />
          <Switch aria-label="Bluetooth" name="bluetooth" />
          <button type="reset">Reset</button>
        </form>,
      )
      await user.click(pressed('Wi-Fi'))
      await user.click(pressed('Bluetooth'))
      expect(input('Wi-Fi')).not.toBeChecked()
      expect(input('Bluetooth')).toBeChecked()
      await user.click(screen.getByRole('button', { name: 'Reset' }))
      expect(input('Wi-Fi')).toBeChecked()
      expect(input('Bluetooth')).not.toBeChecked()
    })
  })

  describe('controlled', () => {
    it('shows what isSelected says and reports a click without changing on its own', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <Switch aria-label="Wi-Fi" isSelected={false} onChange={onChange} />,
      )
      const el = input('Wi-Fi')
      await user.click(pressed('Wi-Fi'))
      expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(el).not.toBeChecked()
      rerender(<Switch aria-label="Wi-Fi" isSelected onChange={onChange} />)
      expect(el).toBeChecked()
    })

    it('follows a caller that sets its state from onChange', async () => {
      function Setting() {
        const [on, setOn] = useState(false)
        return (
          <>
            <Switch aria-label="Wi-Fi" isSelected={on} onChange={setOn} />
            <output>{on ? 'On' : 'Off'}</output>
          </>
        )
      }
      const user = userEvent.setup()
      render(<Setting />)
      const el = input('Wi-Fi')
      await user.click(pressed('Wi-Fi'))
      expect(el).toBeChecked()
      expect(screen.getByText('On')).toBeInTheDocument()
      await user.click(pressed('Wi-Fi'))
      expect(el).not.toBeChecked()
      expect(screen.getByText('Off')).toBeInTheDocument()
    })
  })

  describe('keyboard', () => {
    it('is reached with Tab and toggled by Space', async () => {
      const user = userEvent.setup()
      render(<Switch aria-label="Wi-Fi" />)
      await user.tab()
      const el = input('Wi-Fi')
      expect(el).toHaveFocus()
      await user.keyboard(' ')
      expect(el).toBeChecked()
      await user.keyboard(' ')
      expect(el).not.toBeChecked()
    })

    it('is toggled by Enter, which reports the change and does not submit its form', async () => {
      const onChange = vi.fn()
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
      const user = userEvent.setup()
      render(
        <form onSubmit={onSubmit}>
          <Switch aria-label="Wi-Fi" onChange={onChange} />
          <button>Save</button>
        </form>,
      )
      await user.tab()
      const el = input('Wi-Fi')
      await user.keyboard('{Enter}')
      expect(el).toBeChecked()
      await user.keyboard('{Enter}')
      expect(el).not.toBeChecked()
      expect(onChange).toHaveBeenCalledTimes(2)
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('leaves Enter to a caller that prevents its default in onKeyDown', async () => {
      const user = userEvent.setup()
      render(<Switch aria-label="Wi-Fi" onKeyDown={(event) => event.preventDefault()} />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(input('Wi-Fi')).not.toBeChecked()
    })

    it('controlled, reports Enter without changing on its own', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Switch aria-label="Wi-Fi" isSelected={false} onChange={onChange} />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(input('Wi-Fi')).not.toBeChecked()
    })
  })

  it('does nothing when disabled, and cannot be focused', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch aria-label="Wi-Fi" isDisabled onChange={onChange} />)
    const el = input('Wi-Fi')
    await user.click(pressed('Wi-Fi'))
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(el).toBeDisabled()
    expect(el).not.toBeChecked()
    expect(el).not.toHaveFocus()
  })

  it('says it is read-only with isReadOnly, and keeps its state on a click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch aria-label="Wi-Fi" isReadOnly onChange={onChange} />)
    const el = input('Wi-Fi')
    expect(el).toHaveAttribute('aria-readonly', 'true')
    await user.click(pressed('Wi-Fi'))
    expect(el).not.toBeChecked()
    expect(onChange).not.toHaveBeenCalled()
    // Still a tab stop.
    await user.tab()
    expect(el).toHaveFocus()
  })

  it('is reached in order with Tab, skipping a disabled one', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Switch aria-label="Wi-Fi" />
        <Switch aria-label="Bluetooth" isDisabled />
        <Switch aria-label="Airplane mode" />
      </>,
    )
    await user.tab()
    expect(input('Wi-Fi')).toHaveFocus()
    await user.tab()
    expect(input('Airplane mode')).toHaveFocus()
  })

  it('submits its name and value with a form when selected only', () => {
    render(
      <form data-testid="form">
        <Switch aria-label="Wi-Fi" name="wifi" defaultSelected />
        <Switch aria-label="Bluetooth" name="bluetooth" value="yes" defaultSelected />
        <Switch aria-label="Airplane mode" name="airplane" />
      </form>,
    )
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect([...data.entries()]).toEqual([
      ['wifi', 'on'],
      ['bluetooth', 'yes'],
    ])
  })

  it('takes isSelected and defaultSelected, as React Aria does, and not checked', () => {
    render(
      <>
        {/* @ts-expect-error isSelected replaces checked */}
        <Switch aria-label="A" checked />
        {/* @ts-expect-error defaultSelected replaces defaultChecked */}
        <Switch aria-label="B" defaultChecked />
      </>,
    )
  })

  it("is React Aria's SwitchField, the outermost element, with the class, the style, the rest of the props and the ref, and takes a class from its state", async () => {
    let ref: HTMLDivElement | null = null
    let inputRef: HTMLInputElement | null = null
    const user = userEvent.setup()
    const { container } = render(
      <Switch
        aria-label="Wi-Fi"
        className={({ isSelected, defaultClassName }) =>
          `${defaultClassName} m-space-100 ${isSelected ? 'on' : 'off'}`
        }
        style={{ marginTop: 3 }}
        data-testid="s"
        ref={(node) => {
          ref = node
        }}
        inputRef={(node) => {
          inputRef = node
        }}
      />,
    )
    const field = screen.getByTestId('s')
    expect(container.firstElementChild).toBe(field)
    expect(field.tagName).toBe('DIV')
    expect(field).toContainElement(pressed('Wi-Fi'))
    // React Aria's own className: the function is given its default class too.
    expect(field).toHaveClass('react-aria-SwitchField', 'm-space-100', 'off')
    expect(field).toHaveStyle({ marginTop: '3px' })
    expect(ref).toBe(field)
    expect(inputRef).toBe(input('Wi-Fi'))
    await user.click(pressed('Wi-Fi'))
    expect(field).toHaveClass('on')
    expect(field).not.toHaveClass('off')
    expect(field).toHaveAttribute('data-selected')
  })

  describe('children as a function', () => {
    it('is called with the state React Aria reports of the label that is pressed, as it changes, and draws what it returns', async () => {
      const user = userEvent.setup()
      render(
        <Switch>
          {({ isSelected, isHovered, isFocusVisible, isPressed }) =>
            [
              'Wi-Fi',
              isSelected && 'on',
              isHovered && 'hover',
              isFocusVisible && 'focus',
              isPressed && 'press',
            ]
              .filter(Boolean)
              .join(' ')
          }
        </Switch>,
      )
      const el = input()
      expect(el).toHaveAccessibleName('Wi-Fi')
      await user.hover(pressed())
      expect(el).toHaveAccessibleName('Wi-Fi hover')
      await user.pointer({ keys: '[MouseLeft>]', target: pressed() })
      expect(el).toHaveAccessibleName('Wi-Fi hover press')
      await user.pointer({ keys: '[/MouseLeft]' })
      expect(el).toHaveAccessibleName('Wi-Fi on hover')
      // The press focused it, from the pointer: the keyboard's focus is reported apart.
      expect(el).toHaveFocus()
      await user.unhover(pressed())
      el.blur()
      await user.tab()
      expect(el).toHaveAccessibleName('Wi-Fi on focus')
    })

    it('is told that it is disabled', () => {
      render(
        <Switch isDisabled>
          {({ isDisabled }) => (isDisabled ? 'Wi-Fi, unavailable' : 'Wi-Fi')}
        </Switch>,
      )
      expect(input('Wi-Fi, unavailable')).toBeDisabled()
    })

    it('types what the function is passed, and lets it return anything', () => {
      const misuse = () => [
        <Switch key="pair">
          {({ isSelected }) => [<b key="b">{isSelected ? 'On' : 'Off'}</b>]}
        </Switch>,
        <Switch key="number">{() => 12}</Switch>,
        // @ts-expect-error it is passed no such state
        <Switch key="state">{({ checked }) => String(checked)}</Switch>,
      ]
      expect(misuse).toBeTypeOf('function')
    })
  })

  describe('icons', () => {
    const icons = (container: HTMLElement) => container.querySelectorAll('svg')

    it('draws none by default', () => {
      const { container } = render(<Switch aria-label="Wi-Fi" defaultSelected />)
      expect(icons(container)).toHaveLength(0)
    })

    it('draws one for the selected state, or one for each state', () => {
      const selected = render(<Switch aria-label="Wi-Fi" icons="selected" />)
      expect(icons(selected.container)).toHaveLength(1)
      const both = render(<Switch aria-label="Bluetooth" icons="both" />)
      expect(icons(both.container)).toHaveLength(2)
    })

    it('keeps them out of the accessible name and hidden from assistive technology', () => {
      const { container } = render(<Switch aria-label="Wi-Fi" icons="both" defaultSelected />)
      for (const svg of icons(container)) {
        expect(svg.closest('[aria-hidden="true"]')).not.toBeNull()
      }
      expect(input('Wi-Fi')).toHaveAccessibleName('Wi-Fi')
    })
  })

  it('draws the state layer and hides the track and handle from assistive technology', () => {
    render(<Switch aria-label="Wi-Fi" defaultSelected />)
    expect(host('Wi-Fi').querySelector('.state-layer')).toBeInTheDocument()
    // The track, the state layer, the ripple's surface and the handle are all inside the switch.
    for (const part of host('Wi-Fi').children) expect(part).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('switch')).toHaveLength(1)
    expect(input('Wi-Fi')).toHaveAccessibleName('Wi-Fi')
  })
})
