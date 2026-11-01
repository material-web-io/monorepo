import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './checkbox'

/* Behavior and markup that jsdom can check without a stylesheet: the hidden checkbox input
 * React Aria renders in a label, its states and attributes, labelling, keys, forms and events.
 * What the states look like is checked in checkbox.browser.test.tsx instead. */

/** The hidden `<input>` in the checkbox role, which has the name, the state and the focus. */
const input = (name?: string) =>
  screen.getByRole<HTMLInputElement>('checkbox', name === undefined ? undefined : { name })

/** The `<label>` around it, React Aria's CheckboxButton: what is pressed, and what reports the states. */
const pressed = (name?: string) => input(name).closest('label')!

/** The 40dp round host, the label's child after the hidden input's span. */
const host = (name?: string) => input(name).parentElement!.nextElementSibling!

describe('Checkbox', () => {
  it('renders a hidden checkbox input, unselected by default, in the label that is pressed', () => {
    render(<Checkbox aria-label="Pickles" />)
    const el = input('Pickles')
    expect(el.tagName).toBe('INPUT')
    expect(el).toHaveAttribute('type', 'checkbox')
    expect(el).not.toBeChecked()
    expect(el).not.toBePartiallyChecked()
    expect(el).not.toHaveAttribute('aria-invalid')
    expect(pressed('Pickles').tagName).toBe('LABEL')
    // Both in the field, a <div>, which is the outermost element.
    expect(pressed('Pickles').parentElement?.tagName).toBe('DIV')
  })

  it('is named by its label text, its children, which toggles and focuses it when clicked', async () => {
    const user = userEvent.setup()
    render(<Checkbox>Pickles</Checkbox>)
    const el = input('Pickles')
    await user.click(screen.getByText('Pickles'))
    expect(el).toBeChecked()
    expect(el).toHaveFocus()
    await user.click(screen.getByText('Pickles'))
    expect(el).not.toBeChecked()
  })

  it('is described through aria-describedby, and disabled by isDisabled, its label with it', () => {
    render(
      <>
        <Checkbox aria-label="Pickles" aria-describedby="hint" isDisabled />
        <span id="hint">Sliced</span>
      </>,
    )
    const el = input('Pickles')
    expect(el).toHaveAccessibleDescription('Sliced')
    expect(el).toBeDisabled()
    expect(pressed('Pickles')).toHaveAttribute('data-disabled')
  })

  describe('uncontrolled', () => {
    it('starts from defaultSelected, and each click toggles it and reports the new state', async () => {
      const states: boolean[] = []
      const user = userEvent.setup()
      render(
        <Checkbox
          aria-label="Pickles"
          defaultSelected
          onChange={(isSelected) => states.push(isSelected)}
        />,
      )
      const el = input('Pickles')
      expect(el).toBeChecked()
      await user.click(pressed('Pickles'))
      expect(el).not.toBeChecked()
      await user.click(pressed('Pickles'))
      expect(el).toBeChecked()
      expect(states).toEqual([false, true])
    })

    it('goes back to its default when the form it is a field of resets', async () => {
      const user = userEvent.setup()
      render(
        <form>
          <Checkbox aria-label="Pickles" name="pickles" />
          <Checkbox aria-label="Tomato" name="tomato" defaultSelected />
          <button type="reset">Reset</button>
        </form>,
      )
      await user.click(pressed('Pickles'))
      await user.click(pressed('Tomato'))
      expect(input('Pickles')).toBeChecked()
      expect(input('Tomato')).not.toBeChecked()
      await user.click(screen.getByRole('button', { name: 'Reset' }))
      expect(input('Pickles')).not.toBeChecked()
      expect(input('Tomato')).toBeChecked()
    })
  })

  describe('controlled', () => {
    it('shows what isSelected says and reports a click without changing on its own', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <Checkbox aria-label="Pickles" isSelected={false} onChange={onChange} />,
      )
      const el = input('Pickles')
      await user.click(pressed('Pickles'))
      expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(el).not.toBeChecked()
      rerender(<Checkbox aria-label="Pickles" isSelected onChange={onChange} />)
      expect(el).toBeChecked()
    })

    it('follows a caller that sets its state from onChange', async () => {
      function Pickles() {
        const [on, setOn] = useState(false)
        return (
          <>
            <Checkbox aria-label="Pickles" isSelected={on} onChange={setOn} />
            <output>{on ? 'With pickles' : 'Without pickles'}</output>
          </>
        )
      }
      const user = userEvent.setup()
      render(<Pickles />)
      const el = input('Pickles')
      await user.click(pressed('Pickles'))
      expect(el).toBeChecked()
      expect(screen.getByText('With pickles')).toBeInTheDocument()
      await user.click(pressed('Pickles'))
      expect(el).not.toBeChecked()
      expect(screen.getByText('Without pickles')).toBeInTheDocument()
    })
  })

  describe('keyboard', () => {
    it('is reached with Tab and toggled by Space', async () => {
      const user = userEvent.setup()
      render(<Checkbox aria-label="Pickles" />)
      await user.tab()
      const el = input('Pickles')
      expect(el).toHaveFocus()
      await user.keyboard(' ')
      expect(el).toBeChecked()
      await user.keyboard(' ')
      expect(el).not.toBeChecked()
    })

    it('is not toggled by Enter', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Checkbox aria-label="Pickles" onChange={onChange} />)
      await user.tab()
      await user.keyboard('{Enter}')
      expect(input('Pickles')).not.toBeChecked()
      expect(onChange).not.toHaveBeenCalled()
    })

    it('controlled, reports Space without changing on its own', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Checkbox aria-label="Pickles" isSelected={false} onChange={onChange} />)
      await user.tab()
      await user.keyboard(' ')
      expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(input('Pickles')).not.toBeChecked()
    })
  })

  describe('indeterminate', () => {
    it('is exposed as partially checked, and reported on its label', () => {
      render(<Checkbox aria-label="Additions" isIndeterminate />)
      expect(input('Additions')).toBePartiallyChecked()
      expect(input('Additions').indeterminate).toBe(true)
      expect(pressed('Additions')).toHaveAttribute('data-indeterminate')
    })

    it('stays indeterminate after a click, which asks to select it, until the caller clears it', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <Checkbox aria-label="Additions" isSelected={false} isIndeterminate onChange={onChange} />,
      )
      const el = input('Additions')
      await user.click(pressed('Additions'))
      expect(onChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(el).toBePartiallyChecked()
      rerender(<Checkbox aria-label="Additions" isSelected onChange={onChange} />)
      expect(el).toBeChecked()
      expect(el).not.toBePartiallyChecked()
    })

    it('lets a parent follow its children', async () => {
      function Additions() {
        const [items, setItems] = useState([false, false, false])
        const all = items.every(Boolean)
        const some = items.some(Boolean)
        return (
          <>
            <Checkbox
              aria-label="Additions"
              isSelected={all}
              isIndeterminate={some && !all}
              onChange={(isSelected) => setItems(items.map(() => isSelected))}
            />
            {['Pickles', 'Tomato', 'Lettuce'].map((name, i) => (
              <Checkbox
                key={name}
                aria-label={name}
                isSelected={items[i]}
                onChange={(isSelected) =>
                  setItems(items.map((on, j) => (j === i ? isSelected : on)))
                }
              />
            ))}
          </>
        )
      }
      const user = userEvent.setup()
      render(<Additions />)
      const parent = input('Additions')
      await user.click(pressed('Pickles'))
      expect(parent).toBePartiallyChecked()
      await user.click(pressed('Additions'))
      expect(parent).toBeChecked()
      expect(parent).not.toBePartiallyChecked()
      expect(input('Lettuce')).toBeChecked()
      await user.click(pressed('Additions'))
      expect(parent).not.toBeChecked()
      expect(input('Pickles')).not.toBeChecked()
    })
  })

  it('marks the input invalid with isInvalid, and reports it on its label', () => {
    render(<Checkbox aria-label="Terms" isInvalid />)
    expect(input('Terms')).toHaveAttribute('aria-invalid', 'true')
    expect(pressed('Terms')).toHaveAttribute('data-invalid')
  })

  it('makes the input required with isRequired', () => {
    render(<Checkbox aria-label="Terms" isRequired />)
    expect(input('Terms')).toBeRequired()
    expect(pressed('Terms')).toHaveAttribute('data-required')
  })

  it('does nothing when disabled, and cannot be focused', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox aria-label="Pickles" isDisabled onChange={onChange} />)
    const el = input('Pickles')
    await user.click(pressed('Pickles'))
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(el).toBeDisabled()
    expect(el).not.toBeChecked()
    expect(el).not.toHaveFocus()
  })

  it('says it is read-only with isReadOnly, and keeps its state on a click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox aria-label="Pickles" isReadOnly onChange={onChange} />)
    const el = input('Pickles')
    expect(el).toHaveAttribute('aria-readonly', 'true')
    await user.click(pressed('Pickles'))
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
        <Checkbox aria-label="Pickles" />
        <Checkbox aria-label="Tomato" isDisabled />
        <Checkbox aria-label="Lettuce" />
      </>,
    )
    await user.tab()
    expect(input('Pickles')).toHaveFocus()
    await user.tab()
    expect(input('Lettuce')).toHaveFocus()
  })

  it('submits its name and value with a form when selected, as on if it has no value', () => {
    render(
      <form data-testid="form">
        <Checkbox aria-label="Pickles" name="extras" value="pickles" defaultSelected />
        <Checkbox aria-label="Tomato" name="extras" value="tomato" />
        <Checkbox aria-label="Lettuce" name="lettuce" defaultSelected />
      </form>,
    )
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect([...data.entries()]).toEqual([
      ['extras', 'pickles'],
      ['lettuce', 'on'],
    ])
  })

  it("takes React Aria's names, and not the input's", () => {
    render(
      <>
        {/* @ts-expect-error isSelected replaces checked */}
        <Checkbox aria-label="A" checked />
        {/* @ts-expect-error defaultSelected replaces defaultChecked */}
        <Checkbox aria-label="B" defaultChecked />
        {/* @ts-expect-error isIndeterminate replaces indeterminate */}
        <Checkbox aria-label="C" indeterminate />
        {/* @ts-expect-error isInvalid replaces error */}
        <Checkbox aria-label="D" error />
        {/* @ts-expect-error isDisabled replaces disabled */}
        <Checkbox aria-label="E" disabled />
      </>,
    )
  })

  it("is React Aria's CheckboxField, the outermost element, with the class, the style, the rest of the props and the ref, and takes a class from its state", async () => {
    let ref: HTMLDivElement | null = null
    let inputRef: HTMLInputElement | null = null
    const user = userEvent.setup()
    const { container } = render(
      <Checkbox
        aria-label="Pickles"
        className={({ isSelected, defaultClassName }) =>
          `${defaultClassName} m-space-100 ${isSelected ? 'on' : 'off'}`
        }
        style={{ marginTop: 3 }}
        data-testid="c"
        ref={(node) => {
          ref = node
        }}
        inputRef={(node) => {
          inputRef = node
        }}
      />,
    )
    const field = screen.getByTestId('c')
    expect(container.firstElementChild).toBe(field)
    expect(field.tagName).toBe('DIV')
    expect(field).toContainElement(pressed('Pickles'))
    // React Aria's own className: the function is given its default class too.
    expect(field).toHaveClass('react-aria-CheckboxField', 'm-space-100', 'off')
    expect(field).toHaveStyle({ marginTop: '3px' })
    expect(ref).toBe(field)
    expect(inputRef).toBe(input('Pickles'))
    await user.click(pressed('Pickles'))
    expect(field).toHaveClass('on')
    expect(field).not.toHaveClass('off')
    expect(field).toHaveAttribute('data-selected')
  })

  describe('children as a function', () => {
    it('is called with the state React Aria reports of the label that is pressed, as it changes, and draws what it returns', async () => {
      const user = userEvent.setup()
      render(
        <Checkbox>
          {({ isSelected, isHovered, isFocusVisible, isPressed }) =>
            [
              'Pickles',
              isSelected && 'on',
              isHovered && 'hover',
              isFocusVisible && 'focus',
              isPressed && 'press',
            ]
              .filter(Boolean)
              .join(' ')
          }
        </Checkbox>,
      )
      const el = input()
      expect(el).toHaveAccessibleName('Pickles')
      await user.hover(pressed())
      expect(el).toHaveAccessibleName('Pickles hover')
      await user.pointer({ keys: '[MouseLeft>]', target: pressed() })
      expect(el).toHaveAccessibleName('Pickles hover press')
      await user.pointer({ keys: '[/MouseLeft]' })
      expect(el).toHaveAccessibleName('Pickles on hover')
      // The press focused it, from the pointer: the keyboard's focus is reported apart.
      expect(el).toHaveFocus()
      await user.unhover(pressed())
      el.blur()
      await user.tab()
      expect(el).toHaveAccessibleName('Pickles on focus')
    })

    it('is told that it is indeterminate, invalid or disabled', () => {
      render(
        <>
          <Checkbox isIndeterminate>
            {({ isIndeterminate }) => (isIndeterminate ? 'Additions, some' : 'Additions')}
          </Checkbox>
          <Checkbox isInvalid>
            {({ isInvalid }) => (isInvalid ? 'Terms, required' : 'Terms')}
          </Checkbox>
          <Checkbox isDisabled>
            {({ isDisabled }) => (isDisabled ? 'Pickles, unavailable' : 'Pickles')}
          </Checkbox>
        </>,
      )
      expect(input('Additions, some')).toBePartiallyChecked()
      expect(input('Terms, required')).toHaveAttribute('aria-invalid', 'true')
      expect(input('Pickles, unavailable')).toBeDisabled()
    })

    it('types what the function is passed, and lets it return anything', () => {
      const misuse = () => [
        <Checkbox key="pair">
          {({ isSelected }) => [<b key="b">{isSelected ? 'On' : 'Off'}</b>]}
        </Checkbox>,
        <Checkbox key="number">{() => 12}</Checkbox>,
        // @ts-expect-error it is passed no such state
        <Checkbox key="state">{({ checked }) => String(checked)}</Checkbox>,
      ]
      expect(misuse).toBeTypeOf('function')
    })
  })

  it('draws the state layer in the host and hides the box and its marks from assistive technology', () => {
    render(<Checkbox aria-label="Pickles" defaultSelected />)
    expect(host('Pickles').querySelector('.state-layer')).toBeInTheDocument()
    // The state layer, the ripple's surface and the box are all inside the host.
    for (const part of host('Pickles').children) expect(part).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(input('Pickles')).toHaveAccessibleName('Pickles')
  })
})
