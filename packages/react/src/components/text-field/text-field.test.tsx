import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState, type ComponentProps, type FormEvent } from 'react'
import type { InputRenderProps } from 'react-aria-components'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { TextField, type TextFieldProps, type TextFieldRenderProps } from '.'

/* Behavior and markup that jsdom can check without a stylesheet: the React Aria TextField the
 * text field is, its Input or TextArea, the label and description it draws, its leading,
 * prefix, suffix and trailing, naming, counter, error text, validation, forms and events. Its
 * look:
 * text-field.browser.test.tsx. */

const textbox = (name?: string) => screen.getByRole<HTMLInputElement>('textbox', { name })
/** The container, React Aria's Group, which holds the control first. */
const container = (name?: string) => textbox(name).parentElement!
/** The text field's outermost element, React Aria's TextField, which holds the container first. */
const root = (name?: string) => container(name).parentElement!
const label = (text: string) => screen.getByText(text, { selector: 'label' })
/** The four ends, the last spans in the container: the leading icon, prefix, suffix and trailing icon, each empty when given nothing. */
const ends = (name?: string) =>
  [...container(name).children].filter((el) => el.tagName === 'SPAN').slice(-4) as HTMLElement[]

describe('TextField', () => {
  it('is a div holding its container, a presentation div that holds the input first', () => {
    render(<TextField aria-label="Email" />)
    const input = textbox('Email')
    expect(input.tagName).toBe('INPUT')
    expect(container().tagName).toBe('DIV')
    expect(container()).toHaveAttribute('role', 'presentation')
    expect(container().firstElementChild).toBe(input)
    expect(root().tagName).toBe('DIV')
    expect(root().children).toHaveLength(1)
    expect(root().firstElementChild).toBe(container())
    expect(document.querySelector('label')).toBeNull()
    expect(input).not.toHaveAttribute('aria-labelledby')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  describe('label', () => {
    it('is drawn in the container, the label element that names the control', () => {
      render(<TextField label="Email" />)
      expect(screen.getAllByText('Email', { selector: 'label' })).toHaveLength(1)
      expect(container()).toContainElement(label('Email'))
      expect(label('Email')).toHaveAttribute('for', textbox().id)
      expect(textbox()).toHaveAttribute('aria-labelledby', label('Email').id)
      expect(textbox()).toHaveAccessibleName('Email')
    })

    it('takes any node', () => {
      render(<TextField label={<em>Email</em>} />)
      expect(container().querySelector('label > em')).toHaveTextContent('Email')
      expect(textbox()).toHaveAccessibleName('Email')
    })

    it('is in the markup the server sends, with no second render', () => {
      const html = renderToString(<TextField variant="outlined" label="Email" />)
      const page = document.createElement('div')
      page.innerHTML = html
      expect(page.querySelectorAll('label')).toHaveLength(1)
      expect(page.querySelector('input')!.parentElement).toContainElement(
        page.querySelector('label'),
      )
    })

    it('is taken up from that markup as it is, the same label element', async () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      const field = <TextField variant="outlined" label="Email" description="Used to sign in" />
      const page = document.body.appendChild(document.createElement('div'))
      page.innerHTML = renderToString(field)
      const sent = page.querySelector('label')
      const app = await act(() => hydrateRoot(page, field))
      expect(error).not.toHaveBeenCalled()
      expect(label('Email')).toBe(sent)
      expect(textbox('Email')).toHaveAccessibleDescription('Used to sign in')
      act(() => app.unmount())
      page.remove()
      error.mockRestore()
    })

    it('points at the id the text field is given', () => {
      render(<TextField label="Email" id="email" />)
      expect(textbox('Email')).toHaveAttribute('id', 'email')
      expect(label('Email')).toHaveAttribute('for', 'email')
    })

    it('ends with an asterisk on a required field, which is part of its name', () => {
      render(<TextField label="Username" isRequired />)
      expect(textbox()).toHaveAccessibleName('Username*')
      expect(textbox()).toBeRequired()
      expect(root()).toHaveAttribute('data-required')
    })

    it('is not drawn without one, so that an adjacent label names the control, over its placeholder', () => {
      render(
        <>
          <span id="name-label">Full name</span>
          <TextField aria-labelledby="name-label" placeholder="Ada Lovelace" />
        </>,
      )
      expect(document.querySelector('label')).toBeNull()
      expect(textbox('Full name')).toHaveAttribute('placeholder', 'Ada Lovelace')
    })
  })

  it('takes aria-label in place of a label', () => {
    render(<TextField aria-label="Full name" />)
    expect(textbox('Full name')).toBeInTheDocument()
    expect(document.querySelector('label')).toBeNull()
    expect(textbox()).not.toHaveAttribute('aria-labelledby')
  })

  it("gives the control the input's props, and reports each value typed", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        inputMode="email"
        onChange={onChange}
      />,
    )
    const input = textbox()
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('autocomplete', 'email')
    expect(input).toHaveAttribute('autocapitalize', 'none')
    expect(input).toHaveAttribute('inputmode', 'email')
    await user.type(input, 'a@b.c')
    expect(onChange).toHaveBeenCalledTimes(5)
    expect(onChange).toHaveBeenLastCalledWith('a@b.c')
    expect(input).toHaveValue('a@b.c')
  })

  it('gives its outermost element its class, style, ref and the rest, and the control its inputRef', () => {
    const ref = createRef<HTMLDivElement>()
    const inputRef = createRef<HTMLInputElement>()
    render(
      <TextField
        label="Email"
        ref={ref}
        inputRef={inputRef}
        className="w-full"
        style={{ maxWidth: 320 }}
        data-testid="field"
      />,
    )
    expect(ref.current).toBe(root())
    expect(inputRef.current).toBe(textbox())
    expect(root()).toHaveClass('w-full')
    expect(root()).toHaveStyle({ maxWidth: '320px' })
    expect(root()).toHaveAttribute('data-testid', 'field')
    expect(textbox()).not.toHaveClass('w-full')
  })

  it('takes its class as a function of the state React Aria reports of it', () => {
    render(
      <TextField
        aria-label="Email"
        isInvalid
        isReadOnly
        className={({ isInvalid, isReadOnly, isDisabled, isRequired }) =>
          [isInvalid && 'wrong', isReadOnly && 'fixed', isDisabled && 'off', isRequired && 'must']
            .filter(Boolean)
            .join(' ')
        }
      />,
    )
    expect(root()).toHaveClass('wrong', 'fixed', 'inline-flex')
    expect(root()).not.toHaveClass('off')
    expect(root()).not.toHaveClass('must')
  })

  it('carries the state React Aria reports on the control and on its container', async () => {
    const user = userEvent.setup()
    render(
      <>
        <TextField label="Email" isInvalid />
        <button>Elsewhere</button>
      </>,
    )
    const input = textbox()
    expect(input).toBeInvalid()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    for (const el of [input, container(), root()]) expect(el).toHaveAttribute('data-invalid')
    expect(input).not.toHaveAttribute('data-hovered')
    expect(input).not.toHaveAttribute('data-focused')

    await user.hover(input)
    expect(input).toHaveAttribute('data-hovered')
    expect(container()).toHaveAttribute('data-hovered')
    // The pointer's focus is focus, not the keyboard's.
    await user.click(input)
    expect(input).toHaveAttribute('data-focused')
    expect(input).not.toHaveAttribute('data-focus-visible')
    expect(container()).toHaveAttribute('data-focus-within')
    expect(container()).not.toHaveAttribute('data-focus-visible')

    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
    expect(input).not.toHaveAttribute('data-focused')
    expect(container()).not.toHaveAttribute('data-focus-within')
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(input).toHaveAttribute('data-focused')
    expect(input).toHaveAttribute('data-focus-visible')
    expect(container()).toHaveAttribute('data-focus-visible')
  })

  describe('placeholder', () => {
    it('always has one with a label, a space when given none, to tell empty from populated', () => {
      const { rerender } = render(<TextField label="Email" />)
      expect(textbox()).toHaveAttribute('placeholder', ' ')
      rerender(<TextField label="Email" placeholder="name@example.com" />)
      expect(textbox()).toHaveAttribute('placeholder', 'name@example.com')
    })

    it('has none without a label, unless given one', () => {
      const { rerender } = render(<TextField aria-label="Email" />)
      expect(textbox()).not.toHaveAttribute('placeholder')
      rerender(<TextField aria-label="Email" placeholder="name@example.com" />)
      expect(textbox()).toHaveAttribute('placeholder', 'name@example.com')
    })

    it('has none on an input type that shows a format of its own, whose label stays up', () => {
      render(<TextField label="Date" type="date" />)
      expect(screen.getByLabelText('Date')).not.toHaveAttribute('placeholder')
    })
  })

  describe('validation', () => {
    const submit = () => vi.fn((event: FormEvent) => event.preventDefault())

    it('is the native one, as React Aria has it: an invalid field holds its form back', () => {
      const onSubmit = submit()
      render(
        <form onSubmit={onSubmit}>
          <TextField label="Email" isInvalid />
        </form>,
      )
      expect(textbox().validity.valid).toBe(false)
      expect(textbox().form!.checkValidity()).toBe(false)
    })

    it('draws the error state its form finds when sent, until the field is changed or the form resets', async () => {
      const user = userEvent.setup()
      const onSubmit = submit()
      render(
        <form onSubmit={onSubmit}>
          <TextField
            label="Name"
            isRequired
            description="Required"
            suffix={({ isInvalid }) => (isInvalid ? 'wrong' : 'fine')}
          />
          <button type="submit">Send</button>
          <button type="reset">Reset</button>
        </form>,
      )
      const send = screen.getByRole('button', { name: 'Send' })
      expect(root()).not.toHaveAttribute('data-invalid')
      expect(container()).toHaveTextContent('fine')
      expect(screen.queryByRole('alert')).toBeNull()

      await user.click(send)
      expect(onSubmit).not.toHaveBeenCalled()
      expect(textbox()).toHaveAttribute('aria-invalid', 'true')
      for (const el of [textbox(), container(), root()]) expect(el).toHaveAttribute('data-invalid')
      expect(container()).toHaveTextContent('wrong')
      // The browser's message, in place of the supporting text.
      expect(textbox().validationMessage).not.toBe('')
      expect(screen.getByRole('alert')).toHaveTextContent(textbox().validationMessage)
      expect(screen.queryByText('Required')).toBeNull()

      await user.type(textbox(), 'Ada')
      await user.tab()
      expect(root()).not.toHaveAttribute('data-invalid')
      expect(screen.queryByRole('alert')).toBeNull()
      await user.click(send)
      expect(onSubmit).toHaveBeenCalledOnce()

      await user.clear(textbox())
      await user.click(send)
      expect(root()).toHaveAttribute('data-invalid')
      await user.click(screen.getByRole('button', { name: 'Reset' }))
      expect(root()).not.toHaveAttribute('data-invalid')
      expect(onSubmit).toHaveBeenCalledOnce()
    })

    it('is the aria one when validationBehavior says so, which holds nothing back', () => {
      render(<TextField label="Email" isInvalid isRequired validationBehavior="aria" />)
      expect(textbox()).toHaveAttribute('aria-invalid', 'true')
      expect(textbox()).toHaveAttribute('aria-required', 'true')
      expect(textbox()).not.toHaveAttribute('required')
      expect(textbox().validity.valid).toBe(true)
      expect(root()).toHaveAttribute('data-invalid')
    })

    it("draws React Aria's messages as the error text, in place of the supporting text, an alert that describes the input", async () => {
      const user = userEvent.setup()
      render(
        <TextField
          label="Email"
          description="Used to sign in"
          validationBehavior="aria"
          validate={(text) => [
            ...(text.includes('@') ? [] : ['Enter an @.']),
            ...(text.length < 6 ? ['Enter 6 characters.'] : []),
          ]}
        />,
      )
      await user.type(textbox(), 'a')
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Enter an @. Enter 6 characters.')
      expect(root().lastElementChild).toContainElement(alert)
      expect(screen.queryByText('Used to sign in')).toBeNull()
      expect(textbox()).toHaveAccessibleDescription('Enter an @. Enter 6 characters.')
      await user.type(textbox(), '@b')
      expect(screen.getByRole('alert').textContent).toBe('Enter 6 characters.')
      await user.type(textbox(), '.com')
      expect(screen.queryByRole('alert')).toBeNull()
      expect(textbox()).toHaveAccessibleDescription('Used to sign in')
    })
  })

  describe('disabled', () => {
    const clear = (isDisabled?: boolean) => (
      <IconButton aria-label="Clear" isDisabled={isDisabled}>
        <Icon name="cancel" />
      </IconButton>
    )

    it('is disabled by isDisabled, the control, its container and an icon button in it', () => {
      render(
        <TextField label="Search" isDisabled description="Supporting text" trailing={clear()} />,
      )
      expect(textbox()).toBeDisabled()
      for (const el of [textbox(), container(), root()]) expect(el).toHaveAttribute('data-disabled')
      expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
    })

    it('leaves an icon button that says it is enabled itself enabled', () => {
      render(<TextField label="Search" isDisabled trailing={clear(false)} />)
      expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
    })

    it('is read-only by isReadOnly, which disables nothing', () => {
      render(<TextField label="Order" isReadOnly defaultValue="42" trailing={clear()} />)
      expect(textbox()).toHaveAttribute('readonly')
      expect(root()).toHaveAttribute('data-readonly')
      expect(textbox()).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled()
    })

    it('is disabled by a disabled fieldset as any control is, which React Aria does not report', () => {
      render(
        <fieldset disabled>
          <TextField label="Email" />
        </fieldset>,
      )
      expect(textbox()).toBeDisabled()
      expect(root()).not.toHaveAttribute('data-disabled')
    })
  })

  describe('leading, prefix, suffix and trailing', () => {
    it('draws the leading icon, prefix, suffix and trailing icon in that order, however they are written, and the label after them', () => {
      render(
        <TextField
          label="Amount"
          trailing={<Icon name="cancel" data-testid="trailing" />}
          suffix="per month"
          prefix="€"
          leading={<Icon name="payments" data-testid="leading" />}
        />,
      )
      const parts = [...container().children]
      const leading = screen.getByTestId('leading').parentElement!
      const trailing = screen.getByTestId('trailing').parentElement!
      expect(parts[0]).toBe(textbox())
      expect(parts.slice(parts.indexOf(leading))).toEqual([
        leading,
        screen.getByText('€'),
        screen.getByText('per month'),
        trailing,
        label('Amount'),
      ])
      expect(ends()).toEqual(parts.slice(-5, -1))
      expect(screen.getByText('€').tagName).toBe('SPAN')
      expect(textbox()).toHaveAccessibleName('Amount')
    })

    it('draws a prefix and suffix as written, which do not describe the input', () => {
      const unit = 'month'
      render(<TextField aria-label="Amount" prefix="$" suffix={<>per {unit}</>} />)
      expect(screen.getByText('$').parentElement).toBe(container())
      expect(screen.getByText('per month').parentElement).toBe(container())
      expect(textbox()).not.toHaveAttribute('aria-describedby')
    })

    it('draws each end as given, and empty for nothing, as a condition leaves it', () => {
      const { rerender } = render(<TextField aria-label="Email" />)
      const empty = () => ends().map((el) => el.childNodes.length === 0)
      expect(ends()).toHaveLength(4)
      expect(empty()).toEqual([true, true, true, true])
      rerender(
        <TextField
          aria-label="Email"
          leading={false}
          prefix=""
          suffix={undefined}
          trailing={null}
        />,
      )
      expect(empty()).toEqual([true, true, true, true])
      rerender(<TextField aria-label="Email" prefix={false} trailing={<Icon name="mail" />} />)
      expect(empty()).toEqual([true, true, true, false])
      expect(ends()[3]).toContainElement(screen.getByText('mail'))
    })

    it('gives none of them to an element as an attribute', () => {
      render(
        <TextField
          aria-label="Phone"
          leading={<Icon name="call" />}
          prefix="+1"
          suffix="ext."
          trailing={<Icon name="cancel" />}
        />,
      )
      for (const el of [textbox(), container(), root()]) {
        for (const name of ['leading', 'trailing', 'prefix', 'suffix']) {
          expect(el).not.toHaveAttribute(name)
        }
      }
    })

    it('takes each as a function too, called with the state React Aria reports of the container, as it changes', async () => {
      const user = userEvent.setup()
      render(
        <>
          <TextField
            aria-label="Email"
            leading={({ isFocusWithin }) => (
              <Icon name={isFocusWithin ? 'edit' : 'mail'} data-testid="icon" />
            )}
            suffix={({ isHovered, isFocusWithin }) =>
              `${isHovered ? 'hover' : 'rest'} ${isFocusWithin ? 'focus' : 'blur'}`
            }
          />
          <button>Elsewhere</button>
        </>,
      )
      const suffix = () => ends()[2]!
      expect(suffix()).toHaveTextContent('rest blur')
      expect(screen.getByTestId('icon')).toHaveTextContent('mail')

      await user.hover(textbox())
      expect(suffix()).toHaveTextContent('hover blur')
      await user.click(textbox())
      expect(suffix()).toHaveTextContent('hover focus')
      expect(screen.getByTestId('icon')).toHaveTextContent('edit')

      await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
      expect(suffix()).toHaveTextContent('rest blur')
      expect(screen.getByTestId('icon')).toHaveTextContent('mail')
    })

    it("passes a function isInvalid and isDisabled as React Aria reports them, and isFocusVisible, the keyboard's focus", async () => {
      const user = userEvent.setup()
      const state = ({ isInvalid, isDisabled, isFocusVisible }: TextFieldRenderProps) =>
        `${isInvalid} ${isDisabled} ${isFocusVisible}`
      const { rerender } = render(<TextField label="Email" isInvalid isDisabled suffix={state} />)
      expect(container()).toHaveTextContent('true true false')
      rerender(<TextField label="Email" suffix={state} />)
      expect(container()).toHaveTextContent('false false false')
      await user.tab()
      expect(container()).toHaveTextContent('false false true')
      expectTypeOf<keyof TextFieldRenderProps>().toEqualTypeOf<
        'isHovered' | 'isFocusWithin' | 'isFocusVisible' | 'isDisabled' | 'isInvalid'
      >()
    })

    it('draws what a function returns, nothing for nothing, and a textarea’s too', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<TextField aria-label="Notes" lines="multi" />)
      rerender(
        <TextField
          aria-label="Notes"
          lines="multi"
          leading={() => null}
          trailing={({ isFocusWithin }) => isFocusWithin && <Icon name="edit" data-testid="icon" />}
        />,
      )
      for (const end of ends()) expect(end).toBeEmptyDOMElement()
      await user.click(textbox())
      expect(textbox().tagName).toBe('TEXTAREA')
      expect(screen.getByTestId('icon').parentElement).toBe(ends()[3])
      expect(ends()[0]).toBeEmptyDOMElement()
    })

    it('takes no children in its types, an input holding none', () => {
      // @ts-expect-error what goes around the input is its `leading`, `prefix`, `suffix` and `trailing`
      const field = <TextField aria-label="Email">@</TextField>
      expect(field.type).toBe(TextField)
    })

    it('keeps an icon button a control of its own, a tab stop after the input', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <TextField
          label="Password"
          trailing={
            <IconButton aria-label="Show password" onPress={onPress}>
              <Icon name="visibility" />
            </IconButton>
          }
        />,
      )
      await user.tab()
      expect(textbox()).toHaveFocus()
      await user.tab()
      const button = screen.getByRole('button', { name: 'Show password' })
      expect(button).toHaveFocus()
      await user.click(button)
      expect(onPress).toHaveBeenCalledOnce()
      expect(button).toHaveFocus()
    })
  })

  describe('supporting text', () => {
    it('is the description, drawn under the container, by which the control is described', () => {
      render(<TextField label="Email" description="Used to sign in" />)
      const supporting = screen.getByText('Used to sign in')
      expect(supporting.tagName).toBe('SPAN')
      expect(root().lastElementChild).toContainElement(supporting)
      expect(root().lastElementChild).not.toBe(container())
      expect(textbox()).toHaveAccessibleDescription('Used to sign in')
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('is the error text of a field invalid with no message, an alert that still describes the input', () => {
      const field = (isInvalid: boolean, text: string) => (
        <TextField label="ZIP code" isInvalid={isInvalid} description={text} />
      )
      const { rerender } = render(field(false, 'Five digits'))
      const supporting = screen.getByText('Five digits')
      rerender(field(true, 'Not a valid ZIP code'))
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('Not a valid ZIP code')
      // A new element, so that assistive technology announces it.
      expect(alert).not.toBe(supporting)
      expect(textbox()).toHaveAccessibleDescription('Not a valid ZIP code')
    })

    it('takes any node, found at first or as the error state changes, as React Aria looks for it', () => {
      const { rerender } = render(<TextField label="Email" />)
      expect(textbox()).not.toHaveAttribute('aria-describedby')
      // React Aria looks for the description once at first and again as the error state
      // changes: given later on its own, it is drawn but not found, and taken away on its own,
      // aria-describedby still points where it was, at nothing, which is passed over.
      rerender(<TextField label="Email" description={<a href="#help">Why we ask</a>} />)
      expect(root().lastElementChild).toContainElement(screen.getByRole('link'))
      expect(textbox()).not.toHaveAttribute('aria-describedby')
      rerender(<TextField label="Email" isInvalid description="Not an address" />)
      expect(textbox()).toHaveAccessibleDescription('Not an address')
      rerender(<TextField label="Email" isInvalid description={false} />)
      expect(root().lastElementChild).toBeEmptyDOMElement()
      expect(textbox()).toHaveAttribute('aria-describedby')
      expect(textbox()).toHaveAccessibleDescription('')
      rerender(<TextField label="Email" description={false} />)
      expect(textbox()).not.toHaveAttribute('aria-describedby')
    })

    it('comes before what aria-describedby adds', () => {
      render(
        <>
          <span id="never">Never shared</span>
          <TextField label="Email" description="Used to sign in" aria-describedby="never" />
        </>,
      )
      expect(textbox()).toHaveAccessibleDescription('Used to sign in Never shared')
    })
  })

  describe('character counter', () => {
    const counter = () => screen.getByText(/\/\d+$/)

    it('is drawn for a maxLength, and not without one', () => {
      const { rerender } = render(<TextField label="Name" />)
      expect(screen.queryByText(/\/\d+$/)).toBeNull()
      rerender(<TextField label="Name" maxLength={20} />)
      expect(counter()).toHaveTextContent('0/20')
      expect(textbox()).toHaveAttribute('maxlength', '20')
    })

    it('counts what an uncontrolled field starts with and what is typed into it', async () => {
      const user = userEvent.setup()
      render(<TextField label="Name" maxLength={20} defaultValue="Hello" />)
      expect(counter()).toHaveTextContent('5/20')
      await user.type(textbox(), ' you')
      expect(counter()).toHaveTextContent('9/20')
    })

    it('counts the value of a controlled field', async () => {
      function Controlled() {
        const [value, setValue] = useState('Hi')
        return (
          <TextField
            label="Name"
            maxLength={10}
            value={value}
            onChange={(value) => setValue(value.toUpperCase())}
          />
        )
      }
      const user = userEvent.setup()
      render(<Controlled />)
      expect(counter()).toHaveTextContent('2/10')
      await user.type(textbox(), 'ya')
      expect(textbox()).toHaveValue('HIYA')
      expect(counter()).toHaveTextContent('4/10')
    })

    it('goes back with the field when its form resets', async () => {
      const user = userEvent.setup()
      render(
        <form>
          <TextField label="Name" name="name" maxLength={20} defaultValue="Hello" />
          <button type="reset">Reset</button>
        </form>,
      )
      await user.type(textbox(), ' you')
      expect(counter()).toHaveTextContent('9/20')
      await user.click(screen.getByRole('button', { name: 'Reset' }))
      expect(textbox()).toHaveValue('Hello')
      await waitFor(() => expect(counter()).toHaveTextContent('5/20'))
    })

    it('is part of the description, after the supporting text, under the name it is given', () => {
      const { rerender } = render(
        <TextField
          label="Name"
          maxLength={20}
          defaultValue="Hello"
          description="As on your passport"
        />,
      )
      expect(textbox()).toHaveAccessibleDescription('As on your passport Character count, 5/20')
      rerender(
        <TextField label="Name" maxLength={20} defaultValue="Hello" counterLabel="Zeichen" />,
      )
      expect(textbox()).toHaveAccessibleDescription('Zeichen, 5/20')
    })
  })

  describe('lines', () => {
    it('is a textarea of one row that grows when multi-line, with its own inputRef', () => {
      const inputRef = createRef<HTMLTextAreaElement>()
      render(<TextField label="Notes" lines="multi" inputRef={inputRef} name="notes" />)
      const area = textbox('Notes')
      expect(area.tagName).toBe('TEXTAREA')
      expect(area).toHaveAttribute('rows', '1')
      expect(area).toHaveAttribute('name', 'notes')
      expect(inputRef.current).toBe(area)
      expect(container().firstElementChild).toBe(area)
    })

    it('starts a multi-line field at the rows it is given', () => {
      render(<TextField label="Notes" lines="multi" rows={3} />)
      expect(textbox('Notes')).toHaveAttribute('rows', '3')
    })

    it('is a textarea of the rows it is given when a text area', () => {
      render(<TextField label="Message" lines="area" rows={4} />)
      expect(textbox('Message').tagName).toBe('TEXTAREA')
      expect(textbox()).toHaveAttribute('rows', '4')
    })
  })

  describe('input', () => {
    it("draws the input it returns in React Aria's Input's place, the control of the field", async () => {
      const onChange = vi.fn()
      const inputRef = createRef<HTMLInputElement>()
      const user = userEvent.setup()
      render(
        <TextField
          label="Code"
          description="Sent to your phone"
          name="code"
          maxLength={6}
          inputRef={inputRef}
          onChange={onChange}
          input={(props) => <input {...props} inputMode="numeric" data-testid="code" />}
        />,
      )
      const input = screen.getByTestId('code')
      expect(textbox('Code')).toBe(input)
      expect(container().firstElementChild).toBe(input)
      expect(container().querySelectorAll('input')).toHaveLength(1)
      expect(inputRef.current).toBe(input)
      expect(input).toHaveAttribute('inputmode', 'numeric')
      expect(input).toHaveAttribute('name', 'code')
      expect(input).toHaveAttribute('placeholder', ' ')
      expect(input).toHaveAccessibleDescription('Sent to your phone Character count, 0/6')
      await user.type(input, '123')
      expect(onChange).toHaveBeenLastCalledWith('123')
      expect(screen.getByText(/\/6$/)).toHaveTextContent('3/6')
      await user.click(container())
      expect(input).toHaveFocus()
    })

    it("is called with the Input's render props", async () => {
      const user = userEvent.setup()
      render(
        <TextField
          aria-label="Code"
          isInvalid
          input={(props, { isFocused, isInvalid }) => (
            <input {...props} data-state={`${isFocused ? 'focused' : 'resting'} ${isInvalid}`} />
          )}
        />,
      )
      expect(textbox()).toHaveAttribute('data-state', 'resting true')
      await user.click(textbox())
      expect(textbox()).toHaveAttribute('data-state', 'focused true')
    })

    it('draws the textarea of a multi-line field, of its rows and with its inputRef', () => {
      const inputRef = createRef<HTMLTextAreaElement>()
      render(
        <TextField
          label="Notes"
          lines="multi"
          inputRef={inputRef}
          input={(props) => <textarea {...props} data-testid="notes" />}
        />,
      )
      const area = screen.getByTestId('notes')
      expect(textbox('Notes')).toBe(area)
      expect(area).toHaveAttribute('rows', '1')
      expect(inputRef.current).toBe(area)
    })

    it("is typed by the lines, an input's render or a textarea's", () => {
      type Single = NonNullable<Extract<TextFieldProps, { lines?: 'single' }>['input']>
      type Multi = NonNullable<Extract<TextFieldProps, { lines: 'multi' | 'area' }>['input']>
      expectTypeOf<Single>().parameter(0).toEqualTypeOf<ComponentProps<'input'>>()
      expectTypeOf<Multi>().parameter(0).toEqualTypeOf<ComponentProps<'textarea'>>()
      expectTypeOf<Single>().parameter(1).toEqualTypeOf<InputRenderProps>()
    })
  })

  describe('a click in the container', () => {
    const search = (isDisabled = false) => (
      <TextField
        label="Search"
        isDisabled={isDisabled}
        leading={<Icon name="search" data-testid="icon" />}
      />
    )

    it('goes to the input when it is on no control, and leaves the focus where it is', async () => {
      const user = userEvent.setup()
      render(search())
      await user.click(screen.getByTestId('icon'))
      expect(textbox()).toHaveFocus()
      const onBlur = vi.fn()
      textbox().addEventListener('blur', onBlur)
      await user.click(container())
      expect(textbox()).toHaveFocus()
      expect(onBlur).not.toHaveBeenCalled()
    })

    it('does not reach a disabled input', async () => {
      const user = userEvent.setup()
      render(search(true))
      await user.click(screen.getByTestId('icon'))
      expect(textbox()).not.toHaveFocus()
    })
  })
})
