import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type FormEvent } from 'react'
import { FieldError, Label, Text } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './checkbox'
import { CheckboxGroup, type CheckboxGroupProps } from './checkbox-group'

/* Behavior and markup that jsdom can check without a stylesheet: React Aria's group around the
 * hidden checkbox inputs, its labelling, its value, the states it gives each checkbox, keys,
 * forms and validation. What a checkbox looks like in it: checkbox-group.browser.test.tsx. */

const extras = ['Pickles', 'Tomato', 'Lettuce'] as const

/** A group of three checkboxes, each named by its label text and valued by it in lower case. */
function Extras(props: Omit<CheckboxGroupProps, 'children'>) {
  return (
    <CheckboxGroup aria-label="Extras" {...props}>
      {extras.map((name) => (
        <Checkbox key={name} value={name.toLowerCase()}>
          {name}
        </Checkbox>
      ))}
    </CheckboxGroup>
  )
}

/** The hidden `<input>` in the checkbox role, which has the name, the state and the focus. */
const input = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name })

/** The `<label>` around it, React Aria's CheckboxButton: what is pressed, and what reports the states. */
const pressed = (name: string) => input(name).closest('label')!

const group = () => screen.getByRole('group')

describe('CheckboxGroup', () => {
  it('renders a <div> in the group role around its checkboxes, each with its value, none selected by default', () => {
    render(<Extras />)
    const el = screen.getByRole('group', { name: 'Extras' })
    expect(el.tagName).toBe('DIV')
    for (const name of extras) {
      expect(el).toContainElement(input(name))
      expect(input(name)).toHaveAttribute('value', name.toLowerCase())
      expect(input(name)).not.toBeChecked()
    }
  })

  it('names the group by a Label in it, and describes it and each checkbox by a Text in the description slot', () => {
    render(
      <CheckboxGroup>
        <Label>Extras</Label>
        <Checkbox value="pickles">Pickles</Checkbox>
        <Checkbox value="tomato">Tomato</Checkbox>
        <Text slot="description">Free of charge</Text>
      </CheckboxGroup>,
    )
    const el = screen.getByRole('group', { name: 'Extras' })
    expect(el).toHaveAccessibleDescription('Free of charge')
    expect(input('Pickles')).toHaveAccessibleDescription('Free of charge')
    expect(input('Tomato')).toHaveAccessibleDescription('Free of charge')
  })

  describe('uncontrolled', () => {
    it('starts from defaultValue, and toggles each checkbox on its own, reporting the values selected', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Extras defaultValue={['tomato']} onChange={onChange} />)
      expect(input('Tomato')).toBeChecked()
      await user.click(pressed('Pickles'))
      expect(onChange).toHaveBeenLastCalledWith(['tomato', 'pickles'])
      expect(input('Pickles')).toBeChecked()
      expect(input('Tomato')).toBeChecked()
      await user.click(pressed('Tomato'))
      expect(onChange).toHaveBeenLastCalledWith(['pickles'])
      expect(input('Tomato')).not.toBeChecked()
      expect(input('Pickles')).toBeChecked()
      expect(onChange).toHaveBeenCalledTimes(2)
    })

    it("calls a checkbox's own onChange too, with whether it is selected", async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <CheckboxGroup aria-label="Extras">
          <Checkbox value="pickles" onChange={onChange}>
            Pickles
          </Checkbox>
        </CheckboxGroup>,
      )
      await user.click(pressed('Pickles'))
      expect(onChange).toHaveBeenLastCalledWith(true)
      await user.click(pressed('Pickles'))
      expect(onChange).toHaveBeenLastCalledWith(false)
    })

    it('goes back to its default when the form it is a field of resets', async () => {
      const user = userEvent.setup()
      render(
        <form>
          <Extras name="extras" defaultValue={['pickles', 'tomato']} />
          <button type="reset">Reset</button>
        </form>,
      )
      const reset = screen.getByRole('button', { name: 'Reset' })
      await user.click(pressed('Pickles'))
      await user.click(pressed('Tomato'))
      await user.click(reset)
      expect(input('Pickles')).toBeChecked()
      expect(input('Tomato')).toBeChecked()
      await user.click(pressed('Lettuce'))
      await user.click(reset)
      expect(input('Lettuce')).not.toBeChecked()
      expect(input('Pickles')).toBeChecked()
    })

    it('loses, as React Aria has it, what a reset changes before the last checkbox it unselects', async () => {
      // React Aria unselects a value from the group's value as last rendered, so it drops the
      // values put back before it by the same reset, which go over the checkboxes in order.
      const user = userEvent.setup()
      render(
        <form>
          <Extras name="extras" defaultValue={['pickles']} />
          <button type="reset">Reset</button>
        </form>,
      )
      await user.click(pressed('Pickles'))
      await user.click(pressed('Lettuce'))
      await user.click(screen.getByRole('button', { name: 'Reset' }))
      expect(input('Lettuce')).not.toBeChecked()
      expect(input('Pickles')).not.toBeChecked()
    })
  })

  describe('controlled', () => {
    it('shows what value says and reports a click without changing on its own', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(<Extras value={['pickles']} onChange={onChange} />)
      await user.click(pressed('Tomato'))
      expect(onChange).toHaveBeenCalledExactlyOnceWith(['pickles', 'tomato'])
      expect(input('Pickles')).toBeChecked()
      expect(input('Tomato')).not.toBeChecked()
      rerender(<Extras value={['tomato']} onChange={onChange} />)
      expect(input('Pickles')).not.toBeChecked()
      expect(input('Tomato')).toBeChecked()
    })

    it('lets a parent checkbox outside it select all, none, or show that only some are', async () => {
      const values = extras.map((name) => name.toLowerCase())
      function Parent() {
        const [value, setValue] = useState<string[]>([])
        return (
          <>
            <Checkbox
              isSelected={value.length === values.length}
              isIndeterminate={value.length > 0 && value.length < values.length}
              onChange={(isSelected) => setValue(isSelected ? values : [])}
            >
              All
            </Checkbox>
            <Extras value={value} onChange={setValue} />
          </>
        )
      }
      const user = userEvent.setup()
      render(<Parent />)
      await user.click(pressed('Tomato'))
      expect(input('All')).toBePartiallyChecked()
      await user.click(pressed('All'))
      for (const name of ['All', ...extras]) expect(input(name)).toBeChecked()
      await user.click(pressed('All'))
      for (const name of ['All', ...extras]) expect(input(name)).not.toBeChecked()
    })
  })

  it('disables every checkbox with isDisabled, which nothing then selects', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Extras isDisabled defaultValue={['pickles']} onChange={onChange} />)
    expect(group()).toHaveAttribute('aria-disabled', 'true')
    expect(group()).toHaveAttribute('data-disabled')
    for (const name of extras) {
      expect(input(name)).toBeDisabled()
      expect(pressed(name)).toHaveAttribute('data-disabled')
    }
    await user.click(pressed('Tomato'))
    expect(input('Tomato')).not.toBeChecked()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps every checkbox as it is with isReadOnly, still focusable', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Extras isReadOnly defaultValue={['pickles']} onChange={onChange} />)
    expect(group()).toHaveAttribute('data-readonly')
    await user.click(pressed('Tomato'))
    await user.click(pressed('Pickles'))
    expect(input('Tomato')).not.toBeChecked()
    expect(input('Pickles')).toBeChecked()
    expect(onChange).not.toHaveBeenCalled()
    for (const name of extras) {
      expect(input(name)).not.toBeDisabled()
      expect(pressed(name)).toHaveAttribute('data-readonly')
    }
  })

  it('makes each checkbox required with isRequired while none is selected, as React Aria has it', async () => {
    const user = userEvent.setup()
    render(<Extras isRequired />)
    expect(group()).toHaveAttribute('data-required')
    for (const name of extras) expect(input(name)).toBeRequired()
    await user.click(pressed('Tomato'))
    for (const name of extras) expect(input(name)).not.toBeRequired()
  })

  it('marks the group and each checkbox invalid with isInvalid', () => {
    render(<Extras isInvalid />)
    expect(group()).toHaveAttribute('data-invalid')
    for (const name of extras) {
      expect(input(name)).toHaveAttribute('aria-invalid', 'true')
      expect(pressed(name)).toHaveAttribute('data-invalid')
    }
  })

  it("submits the group's name with each selected value, and nothing unselected", () => {
    render(
      <form data-testid="form">
        <Extras name="extras" defaultValue={['pickles', 'lettuce']} />
      </form>,
    )
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement)
    expect([...data.entries()]).toEqual([
      ['extras', 'pickles'],
      ['extras', 'lettuce'],
    ])
  })

  it('draws the error its form finds when sent, in a FieldError, until a checkbox is selected', async () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    const user = userEvent.setup()
    render(
      <form onSubmit={onSubmit}>
        <CheckboxGroup isRequired name="extras">
          <Label>Extras</Label>
          {extras.map((name) => (
            <Checkbox key={name} value={name.toLowerCase()}>
              {name}
            </Checkbox>
          ))}
          <FieldError>Pick at least one</FieldError>
        </CheckboxGroup>
        <button type="submit">Send</button>
      </form>,
    )
    expect(screen.queryByText('Pick at least one')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(group()).toHaveAttribute('data-invalid')
    expect(group()).toHaveAccessibleDescription('Pick at least one')
    for (const name of extras) expect(pressed(name)).toHaveAttribute('data-invalid')

    await user.click(pressed('Lettuce'))
    expect(group()).not.toHaveAttribute('data-invalid')
    expect(screen.queryByText('Pick at least one')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('leaves each checkbox a tab stop of its own, toggled by Space', async () => {
    const user = userEvent.setup()
    render(<Extras />)
    await user.tab()
    expect(input('Pickles')).toHaveFocus()
    await user.keyboard(' ')
    expect(input('Pickles')).toBeChecked()
    await user.tab()
    expect(input('Tomato')).toHaveFocus()
    await user.tab()
    expect(input('Lettuce')).toHaveFocus()
    await user.tab({ shift: true })
    await user.tab({ shift: true })
    expect(input('Pickles')).toHaveFocus()
  })

  it("is React Aria's CheckboxGroup, with the class, the style, the rest of the props and the ref, and takes a class from its state", () => {
    let ref: HTMLDivElement | null = null
    render(
      <Extras
        isInvalid
        className={({ isInvalid, defaultClassName }) =>
          `${defaultClassName} flex ${isInvalid ? 'wrong' : 'fine'}`
        }
        style={{ marginTop: 3 }}
        data-testid="g"
        ref={(node) => {
          ref = node
        }}
      />,
    )
    const el = screen.getByTestId('g')
    expect(el).toBe(group())
    // React Aria's own className: the function is given its default class too.
    expect(el).toHaveClass('react-aria-CheckboxGroup', 'flex', 'wrong')
    expect(el).toHaveStyle({ marginTop: '3px' })
    expect(ref).toBe(el)
  })

  it("takes React Aria's render prop as its children, called with the group's state", async () => {
    const user = userEvent.setup()
    render(
      <CheckboxGroup aria-label="Extras" defaultValue={['tomato']}>
        {({ state }) => (
          <>
            <Checkbox value="pickles">Pickles</Checkbox>
            <Checkbox value="tomato">Tomato</Checkbox>
            <output>{state.value.join(', ')}</output>
          </>
        )}
      </CheckboxGroup>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('tomato')
    await user.click(pressed('Pickles'))
    expect(screen.getByRole('status')).toHaveTextContent('tomato, pickles')
  })

  it("takes React Aria's names", () => {
    render(
      <>
        {/* @ts-expect-error isDisabled replaces disabled */}
        <CheckboxGroup aria-label="A" disabled />
        {/* @ts-expect-error the value is the selected checkboxes' values, a list */}
        <CheckboxGroup aria-label="B" value="pickles" />
        {/* @ts-expect-error defaultValue replaces defaultSelected */}
        <CheckboxGroup aria-label="C" defaultSelected={['pickles']} />
      </>,
    )
    expect(screen.getAllByRole('group')).toHaveLength(3)
  })
})
