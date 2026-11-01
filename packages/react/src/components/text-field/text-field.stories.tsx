import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useState } from 'react'
import { twMerge } from '../../lib/tv'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { TextField, type TextFieldProps } from './text-field'

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: { variant: 'filled', className: 'w-70' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['filled', 'outlined'],
      table: { category: 'M3' },
    },
    lines: {
      control: 'inline-radio',
      options: ['single', 'multi', 'area'],
      table: { category: 'M3' },
    },
    label: { control: 'text', table: { category: 'M3' } },
    description: { control: 'text', table: { category: 'M3' } },
    leading: { control: false, table: { category: 'M3' } },
    trailing: { control: false, table: { category: 'M3' } },
    input: { control: false, table: { category: 'M3' } },
    prefix: { control: 'text', table: { category: 'M3' } },
    suffix: { control: 'text', table: { category: 'M3' } },
    counterLabel: { table: { category: 'M3' } },
    defaultValue: { control: false, table: { category: 'Value' } },
    isInvalid: { control: 'boolean', table: { category: 'State' } },
    isRequired: { control: 'boolean', table: { category: 'State' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    isReadOnly: { control: 'boolean', table: { category: 'State' } },
    placeholder: { control: 'text', table: { category: 'Form' } },
    maxLength: { control: 'number', table: { category: 'Form' } },
    className: { table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof TextField>

export default meta
type Story = StoryObj<typeof meta>

// The args a story passes on to a field whose `lines` or `type` it sets itself: those an
// `<input>` and a `<textarea>` both take.
type Args = Pick<
  TextFieldProps,
  | 'variant'
  | 'className'
  | 'label'
  | 'description'
  | 'placeholder'
  | 'isInvalid'
  | 'isRequired'
  | 'isDisabled'
  | 'isReadOnly'
  | 'maxLength'
  | 'defaultValue'
>

const variants = ['filled', 'outlined'] as const
const caption = 'text-label-md text-on-surface-variant'

/**
 * A text field draws its `label` in its container, on the input's line until it is typed in,
 * and its `description` under it as its supporting text.
 */
export const Playground: Story = {
  render: (args) => <TextField label="Label text" description="Supporting text" {...args} />,
}

/** The two variants. They do the same; which one to use can depend on style alone. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      {variants.map((variant) => (
        <TextField
          key={variant}
          {...args}
          variant={variant}
          label={variant === 'filled' ? 'Filled' : 'Outlined'}
          description="Supporting text"
        />
      ))}
    </div>
  ),
}

/** Empty and populated, each enabled, in error and disabled. Hover and focus the enabled ones for the other states. */
export const States: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(2,auto)] items-start gap-x-space-300 gap-y-space-400">
      {variants.map((variant) => (
        <Fragment key={variant}>
          <span />
          {['Empty', 'Populated'].map((column) => (
            <span key={column} className={caption}>
              {column}
            </span>
          ))}
          {(['Enabled', 'Error', 'Disabled'] as const).map((row) => (
            <Fragment key={row}>
              <span className={twMerge(caption, 'pt-space-250')}>{row}</span>
              {[undefined, 'Input text'].map((value) => (
                <TextField
                  key={value ?? 'empty'}
                  {...args}
                  variant={variant}
                  label="Label text"
                  description="Supporting text"
                  isInvalid={row === 'Error'}
                  isDisabled={row === 'Disabled'}
                  defaultValue={value}
                  leading={<Icon name="search" />}
                  trailing={
                    row === 'Error' ? (
                      <Icon name="error" className="icon-filled" aria-label="Error" />
                    ) : (
                      <Icon name="cancel" />
                    )
                  }
                />
              ))}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  ),
}

/** The configurations of the spec, empty and populated: supporting text, a trailing icon, a leading icon, both, a prefix, a suffix, and several lines. */
export const Configurations: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 items-start gap-x-space-300 gap-y-space-200">
      {[undefined, 'Input'].map((value) => (
        <div key={value ?? 'empty'} className="flex flex-col gap-space-200">
          <TextField {...args} label="Label" description="Supporting text" defaultValue={value} />
          <TextField
            {...args}
            label="Label"
            defaultValue={value}
            trailing={<Icon name="cancel" />}
          />
          <TextField
            {...args}
            label="Label"
            defaultValue={value}
            leading={<Icon name="search" />}
          />
          <TextField
            {...args}
            label="Label"
            defaultValue={value}
            leading={<Icon name="search" />}
            trailing={<Icon name="cancel" />}
          />
          <TextField
            {...args}
            label="Label"
            inputMode="decimal"
            defaultValue={value && '1.43'}
            prefix="$"
          />
          <TextField
            {...args}
            label="Label"
            inputMode="numeric"
            defaultValue={value && '25'}
            suffix="lbs"
          />
          <TextField
            {...(args as Args)}
            label="Label"
            lines="multi"
            defaultValue={
              value &&
              'This is a long input in a multi-line text field that wraps overflow text onto a new line'
            }
          />
        </div>
      ))}
    </div>
  ),
}

function Email(props: Args) {
  const [email, setEmail] = useState('name@')
  const invalid = email !== '' && !/^\S+@\S+\.\S+$/.test(email)
  return (
    <TextField
      {...props}
      label="Email"
      type="email"
      value={email}
      onChange={setEmail}
      isInvalid={invalid}
      description={invalid ? 'Enter an address such as name@example.com' : 'Used to sign in'}
      trailing={invalid && <Icon name="error" className="icon-filled" aria-label="Error" />}
    />
  )
}

/**
 * Controlled, and `isInvalid` while what it holds is not an address: the `description` is then
 * the error text, in place of the supporting text and announced as an alert, and an error icon
 * is the second cue.
 */
export const Error: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      {variants.map((variant) => (
        <Email key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
}

/** React Aria's validation messages, here those `validate` returns, replace the supporting text as the error text while the field is invalid, and are announced as an alert. */
export const Validate: Story = {
  args: { validationBehavior: 'aria' },
  render: (args) => (
    <TextField
      {...args}
      label="Username"
      description="At least 3 characters"
      defaultValue="ad"
      validate={(text) => (text.length < 3 ? 'Enter at least 3 characters' : null)}
    />
  ),
}

/** `isRequired` ends the label with an asterisk, which is part of the field's name; the supporting text says what it means. */
export const Required: Story = {
  args: { isRequired: true },
  render: (args) => <TextField {...args} label="Username" description="*required" />,
}

/** A `prefix` or `suffix` is drawn on the input's line, and shows once the label has left it. */
export const PrefixAndSuffix: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <TextField {...args} label="Amount" inputMode="decimal" defaultValue="12.50" prefix="€" />
      <TextField {...args} label="Grade" inputMode="numeric" suffix="/100" />
      <TextField {...args} label="Email" suffix="@gmail.com" />
    </div>
  ),
}

/** `maxLength` draws the character counter after the supporting text: the characters used over the limit. */
export const CharacterCounter: Story = {
  args: { maxLength: 20, defaultValue: 'Hello' },
  render: (args) => <TextField {...args} label="Label text" description="Supporting text" />,
}

const lorem =
  'This is a very long input that extends past the height of the text area which is masked at the top when the string gets too long.'

/** A multi-line field starts as one line and grows with its text; a text area keeps its `rows` and scrolls. */
export const MultiLineAndTextArea: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 items-start gap-space-300">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-col gap-space-300">
          <TextField
            {...(args as Args)}
            variant={variant}
            label="Multi-line"
            lines="multi"
            defaultValue={lorem}
          />
          <TextField
            {...(args as Args)}
            variant={variant}
            label="Text area"
            lines="area"
            rows={3}
            defaultValue={lorem}
          />
        </div>
      ))}
    </div>
  ),
}

function Password(props: Args) {
  const [shown, setShown] = useState(false)
  return (
    <TextField
      {...props}
      label="Password"
      type={shown ? 'text' : 'password'}
      autoComplete="current-password"
      trailing={
        <IconButton
          aria-label={shown ? 'Hide password' : 'Show password'}
          onPress={() => setShown(!shown)}
        >
          <Icon name={shown ? 'visibility_off' : 'visibility'} />
        </IconButton>
      }
    />
  )
}

function Search(props: Args) {
  const [query, setQuery] = useState('Material')
  return (
    <TextField
      {...props}
      label="Search"
      type="search"
      value={query}
      onChange={setQuery}
      leading={<Icon name="search" />}
      trailing={
        query !== '' && (
          <IconButton aria-label="Clear" onPress={() => setQuery('')}>
            <Icon name="cancel" />
          </IconButton>
        )
      }
    />
  )
}

/** An icon button given as `trailing` is a tab stop after the input, named by what it does, and disabled with the field. A clear icon appears only while there is text to clear. */
export const InteractiveIcons: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <Password {...args} />
      <Search {...args} />
    </div>
  ),
}

/** Read-only fields look the same as any other, and say that they are read-only. */
export const ReadOnly: Story = {
  args: { isReadOnly: true, defaultValue: 'CA-2026-10-0417' },
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      {variants.map((variant) => (
        <TextField
          key={variant}
          {...args}
          variant={variant}
          label="Order number"
          description="Read-only"
        />
      ))}
    </div>
  ),
}

/**
 * A field with no `label` of its own, named by a separate, adjacent label through
 * `aria-labelledby`: with no label to make way for, the placeholder always shows.
 */
export const AdjacentLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-100">
      <span id="full-name" className="text-body-lg text-on-surface">
        Full name
      </span>
      <TextField
        {...args}
        variant="outlined"
        aria-labelledby="full-name"
        placeholder="Ada Lovelace"
      />
    </div>
  ),
}

/** With neither, name the field with an `aria-label`. */
export const Alone: Story = {
  render: (args) => (
    <TextField
      {...(args as Args)}
      type="search"
      aria-label="Search"
      placeholder="Search"
      leading={<Icon name="search" />}
    />
  ),
}

/** Date and time inputs show a format of their own while empty, so their label stays at the top. */
export const InputTypes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <TextField {...(args as Args)} label="Date" type="date" />
      <TextField {...(args as Args)} label="Time" type="time" />
      <TextField {...(args as Args)} label="Quantity" type="number" placeholder="0" />
    </div>
  ),
}

/**
 * `input` draws an `<input>` of your own in the field's, given the props to spread on it: here one
 * that suggests from a list.
 */
export const CustomInput: Story = {
  render: (args) => (
    <>
      <TextField
        {...(args as Args)}
        label="City"
        input={(props) => <input {...props} list="cities" />}
      />
      <datalist id="cities">
        <option value="Calgary" />
        <option value="Edmonton" />
        <option value="Vancouver" />
      </datalist>
    </>
  ),
}

// Class names are spelled out in full because Tailwind only generates utilities it finds as literal strings.
const densityClass = { '0': '', '-1': 'density-1', '-2': 'density-2', '-3': 'density-3' } as const

/** A denser field is 4dp shorter a step, taken evenly from above and below its text. Don't apply density by default. */
export const Density: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(2,auto)] items-center gap-x-space-300 gap-y-space-200">
      {(['0', '-1', '-2', '-3'] as const).map((density) => (
        // No box of its own, so its three children are cells of the grid; the density still inherits.
        <div key={density} className={twMerge('contents', densityClass[density])}>
          <span className={caption}>{density}</span>
          {variants.map((variant) => (
            <TextField
              key={variant}
              {...args}
              variant={variant}
              label="Label text"
              defaultValue="Input text"
            />
          ))}
        </div>
      ))}
    </div>
  ),
}

function ContactForm(props: Args) {
  const [sent, setSent] = useState<string>()
  return (
    <form
      className="flex w-90 flex-col gap-space-200"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
      }}
    >
      <span className="text-body-md text-on-surface-variant">*indicates a required field</span>
      <TextField
        {...props}
        label="Name"
        name="name"
        autoComplete="name"
        isRequired
        className="w-full"
      />
      <TextField
        {...props}
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        className="w-full"
      />
      <TextField
        {...props}
        label="Message"
        name="message"
        lines="area"
        rows={4}
        maxLength={200}
        className="w-full"
      />
      <div className="flex justify-end gap-space-100">
        <Button type="reset" variant="text" onPress={() => setSent(undefined)}>
          Reset
        </Button>
        <Button type="submit">Send</Button>
      </div>
      {sent && <output className="text-body-sm text-on-surface-variant">{sent}</output>}
    </form>
  )
}

/** Each field is a control of its form by its `name`: it submits with the form, is checked by it, a required one left empty drawing its error state when the form is sent, and empties, its counter with it, when the form resets. */
export const Form: Story = {
  args: { variant: 'outlined' },
  render: (args) => <ContactForm {...args} />,
}
