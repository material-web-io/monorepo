import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Label, Text } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Radio } from './radio'
import { RadioGroup, type RadioGroupProps } from './radio-group'

/* Behavior and markup that jsdom can check without a stylesheet: the hidden radio inputs
 * React Aria renders in their labels, in their group, their states and attributes, labelling,
 * keys, forms and events. What the states look like is checked in radio.browser.test.tsx. */

const addresses = ['Home', 'Office', 'Other'] as const

/** A group of three radio buttons, each named by its label text and valued by it in lower case. */
function ShipTo(props: Omit<RadioGroupProps, 'children'>) {
  return (
    <RadioGroup aria-label="Ship to" {...props}>
      {addresses.map((name) => (
        <Radio key={name} value={name.toLowerCase()}>
          {name}
        </Radio>
      ))}
    </RadioGroup>
  )
}

/** The hidden `<input>` in the radio role, which has the name, the state and the focus. */
const input = (name?: string) =>
  screen.getByRole<HTMLInputElement>('radio', name === undefined ? undefined : { name })

/** The `<label>` around it, React Aria's RadioButton: what is pressed, and what reports the states. */
const pressed = (name?: string) => input(name).closest('label')!

/** The 40dp round host, the label's child after the hidden input's span. */
const host = (name?: string) => input(name).parentElement!.nextElementSibling!

describe('Radio', () => {
  it('renders a hidden radio input, unselected by default, in the label that is pressed, in its group', () => {
    render(<ShipTo />)
    const home = input('Home')
    expect(home.tagName).toBe('INPUT')
    expect(home).toHaveAttribute('type', 'radio')
    expect(home).toHaveAttribute('value', 'home')
    expect(home).not.toBeChecked()
    expect(pressed('Home').tagName).toBe('LABEL')
    // Both in the field, a <div>, which is the outermost element.
    expect(pressed('Home').parentElement?.tagName).toBe('DIV')
    expect(screen.getByRole('radiogroup', { name: 'Ship to' })).toContainElement(home)
  })

  it('is named by its label text, its children, which selects and focuses it when clicked', async () => {
    const user = userEvent.setup()
    render(<ShipTo />)
    await user.click(screen.getByText('Office'))
    expect(input('Office')).toBeChecked()
    expect(input('Office')).toHaveFocus()
    expect(input('Home')).not.toBeChecked()
  })

  it('has no use alone: React Aria reads its group, and throws without one', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Radio aria-label="Home" value="home" />)).toThrow()
    error.mockRestore()
  })

  it('names the group by a Label in it, and describes it and each radio button by a Text in the description slot', () => {
    render(
      <RadioGroup>
        <Label>Ship to</Label>
        <Radio value="home" aria-describedby="hint">
          Home
        </Radio>
        <Radio value="office">Office</Radio>
        <Text slot="description">Weekdays only</Text>
      </RadioGroup>,
    )
    const group = screen.getByRole('radiogroup', { name: 'Ship to' })
    expect(group).toHaveAccessibleDescription('Weekdays only')
    expect(input('Office')).toHaveAccessibleDescription('Weekdays only')
    expect(input('Home')).toHaveAttribute('aria-describedby', expect.stringMatching(/^hint /))
  })

  describe('uncontrolled', () => {
    it('starts from the defaultValue, and a click selects one and reports its value once', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ShipTo defaultValue="home" onChange={onChange} />)
      expect(input('Home')).toBeChecked()
      await user.click(pressed('Office'))
      expect(input('Office')).toBeChecked()
      expect(input('Home')).not.toBeChecked()
      expect(onChange).toHaveBeenCalledExactlyOnceWith('office')
      await user.click(pressed('Office'))
      expect(input('Office')).toBeChecked()
      expect(onChange).toHaveBeenCalledTimes(1)
    })

    it('goes back to its default when the form it is a field of resets', async () => {
      const user = userEvent.setup()
      render(
        <form>
          <ShipTo name="ship" defaultValue="home" />
          <button type="reset">Reset</button>
        </form>,
      )
      await user.click(pressed('Office'))
      expect(input('Office')).toBeChecked()
      await user.click(screen.getByRole('button', { name: 'Reset' }))
      expect(input('Home')).toBeChecked()
      expect(input('Office')).not.toBeChecked()
    })
  })

  describe('controlled', () => {
    it('shows what value says and reports a click without changing on its own', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(<ShipTo value="home" onChange={onChange} />)
      await user.click(pressed('Office'))
      expect(onChange).toHaveBeenCalledExactlyOnceWith('office')
      expect(input('Home')).toBeChecked()
      expect(input('Office')).not.toBeChecked()
      rerender(<ShipTo value="office" onChange={onChange} />)
      expect(input('Office')).toBeChecked()
      expect(input('Home')).not.toBeChecked()
      rerender(<ShipTo value={null} onChange={onChange} />)
      for (const name of addresses) expect(input(name)).not.toBeChecked()
    })

    it('moves the selection of a group whose caller sets value from onChange', async () => {
      function Controlled() {
        const [address, setAddress] = useState<string | null>('home')
        return <ShipTo value={address} onChange={setAddress} />
      }
      const user = userEvent.setup()
      render(<Controlled />)
      await user.click(pressed('Office'))
      expect(input('Office')).toBeChecked()
      expect(input('Home')).not.toBeChecked()
      await user.click(pressed('Home'))
      expect(input('Home')).toBeChecked()
      expect(input('Office')).not.toBeChecked()
    })
  })

  describe('keyboard', () => {
    it('is selected by Space when focused, and stays selected', async () => {
      const user = userEvent.setup()
      render(<ShipTo />)
      await user.tab()
      expect(input('Home')).toHaveFocus()
      await user.keyboard(' ')
      expect(input('Home')).toBeChecked()
      await user.keyboard(' ')
      expect(input('Home')).toBeChecked()
    })

    it('moves the selection with the arrow keys, wrapping around the group', async () => {
      const user = userEvent.setup()
      render(<ShipTo defaultValue="home" />)
      await user.tab()
      expect(input('Home')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(input('Office')).toHaveFocus()
      expect(input('Office')).toBeChecked()
      await user.keyboard('{ArrowRight}')
      expect(input('Other')).toBeChecked()
      await user.keyboard('{ArrowDown}')
      expect(input('Home')).toBeChecked()
      await user.keyboard('{ArrowUp}')
      expect(input('Other')).toBeChecked()
      await user.keyboard('{ArrowLeft}')
      expect(input('Office')).toBeChecked()
      expect(input('Office')).toHaveFocus()
    })

    it('is one tab stop, entered at the selected radio button', async () => {
      const user = userEvent.setup()
      render(
        <>
          <ShipTo defaultValue="office" />
          <button>Continue</button>
        </>,
      )
      await user.tab()
      expect(input('Office')).toHaveFocus()
      await user.tab()
      expect(screen.getByRole('button')).toHaveFocus()
    })

    it('says which way the arrow keys run with orientation', () => {
      render(<ShipTo orientation="horizontal" />)
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal')
      expect(screen.getByRole('radiogroup')).toHaveAttribute('data-orientation', 'horizontal')
    })
  })

  describe('disabled', () => {
    it('does nothing when disabled, and cannot be focused, its label with it', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <RadioGroup aria-label="Ship to" onChange={onChange}>
          <Radio value="home" isDisabled>
            Home
          </Radio>
        </RadioGroup>,
      )
      const home = input('Home')
      await user.click(pressed('Home'))
      await user.tab()
      expect(onChange).not.toHaveBeenCalled()
      expect(home).toBeDisabled()
      expect(pressed('Home')).toHaveAttribute('data-disabled')
      expect(home).not.toBeChecked()
      expect(home).not.toHaveFocus()
    })

    it('is disabled by its group, every radio button in it', () => {
      render(<ShipTo isDisabled defaultValue="office" />)
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true')
      for (const name of addresses) expect(input(name)).toBeDisabled()
      expect(input('Office')).toBeChecked()
    })

    it('skips a disabled radio button with Tab and the arrow keys', async () => {
      const user = userEvent.setup()
      render(
        <RadioGroup aria-label="Ship to">
          <Radio aria-label="Home" value="home" isDisabled />
          <Radio aria-label="Office" value="office" />
          <Radio aria-label="Other" value="other" isDisabled />
          <Radio aria-label="Depot" value="depot" />
        </RadioGroup>,
      )
      await user.tab()
      expect(input('Office')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(input('Depot')).toHaveFocus()
      expect(input('Depot')).toBeChecked()
    })
  })

  it('says it is read-only with isReadOnly on its group, and keeps the selection on a click and the arrow keys', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<ShipTo isReadOnly defaultValue="home" onChange={onChange} />)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true')
    expect(pressed('Office')).toHaveAttribute('data-readonly')
    // Still a tab stop.
    await user.tab()
    expect(input('Home')).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(input('Home')).toBeChecked()
    await user.click(pressed('Office'))
    expect(input('Home')).toBeChecked()
    expect(input('Office')).not.toBeChecked()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('makes each input required with isRequired, and marks the group invalid with isInvalid', () => {
    render(<ShipTo isRequired isInvalid />)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
    for (const name of addresses) expect(input(name)).toBeRequired()
    expect(pressed('Home')).toHaveAttribute('data-required')
    expect(pressed('Home')).toHaveAttribute('data-invalid')
  })

  it("submits the group's name and the selected value with a form, and nothing unselected", () => {
    render(
      <form data-testid="form">
        <ShipTo name="ship" defaultValue="office" />
        <RadioGroup aria-label="Pay with" name="pay">
          <Radio aria-label="Card" value="card" />
        </RadioGroup>
      </form>,
    )
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect([...data.entries()]).toEqual([['ship', 'office']])
  })

  it("takes React Aria's names, and is selected by its group's value, not by a prop of its own", () => {
    render(
      <RadioGroup aria-label="Ship to">
        {/* @ts-expect-error the group's value selects it */}
        <Radio aria-label="A" value="a" isSelected />
        {/* @ts-expect-error the group's defaultValue selects it at first */}
        <Radio aria-label="B" value="b" defaultSelected />
        {/* @ts-expect-error the group's onChange reports the selection */}
        <Radio aria-label="C" value="c" onChange={() => {}} />
        {/* @ts-expect-error isDisabled replaces disabled */}
        <Radio aria-label="D" value="d" disabled />
        {/* @ts-expect-error a radio button needs the value its group selects it by */}
        <Radio aria-label="E" />
      </RadioGroup>,
    )
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked()
  })

  it("is React Aria's RadioField, the outermost element, with the class, the style, the rest of the props and the ref, and takes a class from its state", async () => {
    let ref: HTMLDivElement | null = null
    let inputRef: HTMLInputElement | null = null
    const user = userEvent.setup()
    render(
      <RadioGroup aria-label="Ship to">
        <Radio
          aria-label="Home"
          value="home"
          className={({ isSelected, defaultClassName }) =>
            `${defaultClassName} m-space-100 ${isSelected ? 'on' : 'off'}`
          }
          style={{ marginTop: 3 }}
          data-testid="r"
          ref={(node) => {
            ref = node
          }}
          inputRef={(node) => {
            inputRef = node
          }}
        />
      </RadioGroup>,
    )
    const field = screen.getByTestId('r')
    expect(screen.getByRole('radiogroup').firstElementChild).toBe(field)
    expect(field.tagName).toBe('DIV')
    expect(field).toContainElement(pressed('Home'))
    // React Aria's own className: the function is given its default class too.
    expect(field).toHaveClass('react-aria-RadioField', 'm-space-100', 'off')
    expect(field).toHaveStyle({ marginTop: '3px' })
    expect(ref).toBe(field)
    expect(inputRef).toBe(input('Home'))
    await user.click(pressed('Home'))
    expect(field).toHaveClass('on')
    expect(field).not.toHaveClass('off')
    expect(field).toHaveAttribute('data-selected')
  })

  it("is in React Aria's RadioGroup, which takes its own render prop, called with the group's state", async () => {
    const user = userEvent.setup()
    render(
      <RadioGroup aria-label="Ship to" defaultValue="home">
        {({ state }) => (
          <>
            <Radio value="home">Home</Radio>
            <Radio value="office">Office</Radio>
            <output>{state.selectedValue}</output>
          </>
        )}
      </RadioGroup>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('home')
    await user.click(pressed('Office'))
    expect(screen.getByRole('status')).toHaveTextContent('office')
  })

  describe('children as a function', () => {
    it('is called with the state React Aria reports of the label that is pressed, as it changes, and draws what it returns', async () => {
      const user = userEvent.setup()
      render(
        <RadioGroup aria-label="Ship to">
          <Radio value="home">
            {({ isSelected, isHovered, isFocusVisible, isPressed }) =>
              [
                'Home',
                isSelected && 'on',
                isHovered && 'hover',
                isFocusVisible && 'focus',
                isPressed && 'press',
              ]
                .filter(Boolean)
                .join(' ')
            }
          </Radio>
        </RadioGroup>,
      )
      const el = input()
      expect(el).toHaveAccessibleName('Home')
      await user.hover(pressed())
      expect(el).toHaveAccessibleName('Home hover')
      await user.pointer({ keys: '[MouseLeft>]', target: pressed() })
      expect(el).toHaveAccessibleName('Home hover press')
      await user.pointer({ keys: '[/MouseLeft]' })
      expect(el).toHaveAccessibleName('Home on hover')
      // The press focused it, from the pointer: the keyboard's focus is reported apart.
      expect(el).toHaveFocus()
      await user.unhover(pressed())
      el.blur()
      await user.tab()
      expect(el).toHaveAccessibleName('Home on focus')
    })

    it('is told that it is disabled, read-only, required or invalid', () => {
      render(
        <>
          <RadioGroup aria-label="Ship to">
            <Radio value="home" isDisabled>
              {({ isDisabled }) => (isDisabled ? 'Home, unavailable' : 'Home')}
            </Radio>
          </RadioGroup>
          <RadioGroup aria-label="Pay with" isReadOnly isRequired isInvalid>
            <Radio value="card">
              {({ isReadOnly, isRequired, isInvalid }) =>
                ['Card', isReadOnly && 'fixed', isRequired && 'required', isInvalid && 'invalid']
                  .filter(Boolean)
                  .join(' ')
              }
            </Radio>
          </RadioGroup>
        </>,
      )
      expect(input('Home, unavailable')).toBeDisabled()
      expect(input('Card fixed required invalid')).toBeRequired()
    })

    it('types what the function is passed, and lets it return anything', () => {
      const misuse = () => [
        <Radio key="pair" value="a">
          {({ isSelected }) => [<b key="b">{isSelected ? 'On' : 'Off'}</b>]}
        </Radio>,
        <Radio key="number" value="b">
          {() => 12}
        </Radio>,
        <Radio key="state" value="c">
          {
            // @ts-expect-error it is passed no such state
            ({ checked }) => String(checked)
          }
        </Radio>,
      ]
      expect(misuse).toBeTypeOf('function')
    })
  })

  it('draws the state layer in the host and hides the ring and dot from assistive technology', () => {
    render(<ShipTo defaultValue="home" />)
    expect(host('Home').querySelector('.state-layer')).toBeInTheDocument()
    for (const part of host('Home').children) expect(part).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(input('Home')).toHaveAccessibleName('Home')
  })
})
