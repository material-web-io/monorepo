import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Form, Input } from 'react-aria-components'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { SearchField, type SearchFieldProps } from '.'

// Every prop of SearchField, React Aria's SearchField's: the docgen reads none of them from the
// imported types, so each is listed here. Event handlers are left out. What it holds is written
// in each story: React Aria's Input and what leads and trails it.
const meta = {
  title: 'Components/Search/SearchField',
  component: SearchField,
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Search your messages' },
  argTypes: {
    children: { control: false, table: { category: 'Parts' } },
    value: { control: 'text', table: { category: 'Value' } },
    defaultValue: { control: 'text', table: { category: 'Value' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    isReadOnly: { control: 'boolean', table: { category: 'State' } },
    isRequired: { control: 'boolean', table: { category: 'State' } },
    isInvalid: { control: 'boolean', table: { category: 'State' } },
    autoFocus: { control: 'boolean', table: { category: 'State' } },
    excludeFromTabOrder: { control: 'boolean', table: { category: 'State' } },
    validate: { control: false, table: { category: 'Validation' } },
    validationBehavior: {
      control: 'inline-radio',
      options: ['native', 'aria'],
      table: { category: 'Validation' },
    },
    type: {
      control: 'select',
      options: ['search', 'text', 'url', 'tel', 'email', 'password'],
      table: { category: 'Form' },
    },
    name: { control: 'text', table: { category: 'Form' } },
    form: { control: 'text', table: { category: 'Form' } },
    autoComplete: { control: 'text', table: { category: 'Form' } },
    autoCorrect: { control: 'text', table: { category: 'Form' } },
    spellCheck: { control: 'text', table: { category: 'Form' } },
    maxLength: { control: 'number', table: { category: 'Form' } },
    minLength: { control: 'number', table: { category: 'Form' } },
    pattern: { control: 'text', table: { category: 'Form' } },
    inputMode: {
      control: 'select',
      options: ['none', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search'],
      table: { category: 'Form' },
    },
    enterKeyHint: {
      control: 'select',
      options: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
      table: { category: 'Form' },
    },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    'aria-errormessage': { control: 'text', table: { category: 'Accessibility' } },
    'aria-activedescendant': { control: 'text', table: { category: 'Accessibility' } },
    'aria-autocomplete': {
      control: 'inline-radio',
      options: ['none', 'inline', 'list', 'both'],
      table: { category: 'Accessibility' },
    },
    'aria-haspopup': {
      control: 'select',
      options: [false, true, 'menu', 'listbox', 'tree', 'grid', 'dialog'],
      table: { category: 'Accessibility' },
    },
    'aria-controls': { control: 'text', table: { category: 'Accessibility' } },
    id: { control: 'text', table: { category: 'DOM' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: {
      control: 'inline-radio',
      options: ['ltr', 'rtl', 'auto'],
      table: { category: 'DOM' },
    },
    lang: { control: 'text', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof SearchField>

export default meta
type Story = StoryObj<typeof meta>

// An avatar: a 30dp round image, here a drawn one.
const avatar = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><rect width="30" height="30" fill="#6750a4"/><text x="15" y="20" font-family="Roboto, sans-serif" font-size="14" fill="#fff" text-anchor="middle">A</text></svg>',
)}`

const Menu = () => (
  <IconButton slot="leading" aria-label="Menu">
    <Icon name="menu" />
  </IconButton>
)

// The clear button: React Aria names it Clear search too, but IconButton's type asks for a name.
const Clear = () => (
  <IconButton aria-label="Clear search">
    <Icon name="close" />
  </IconButton>
)

const Voice = () => (
  <IconButton slot="trailing" aria-label="Voice search">
    <Icon name="mic" />
  </IconButton>
)

const Account = () => (
  <IconButton slot="trailing" aria-label="Account">
    <img src={avatar} alt="" />
  </IconButton>
)

/** A search bar: React Aria's `Input` with the hinted search text as its `placeholder`, a non-functional search icon before it, and the clear button, an `IconButton` with no slot, which React Aria makes clear the text, after it. Type, then press Escape to clear. */
export const Playground: Story = {
  render: (args) => (
    <SearchField {...args}>
      <Icon slot="leading" name="search" />
      <Input placeholder="Search your messages" />
      <Clear />
    </SearchField>
  ),
}

/** The specs page's examples: with avatar, with one trailing icon button, with two trailing icon buttons, and with a trailing icon button and avatar. A navigational icon button leads each. */
export const Examples: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <SearchField {...args}>
        <Menu />
        <Input placeholder="Hinted search text" />
        <Account />
      </SearchField>
      <SearchField {...args}>
        <Menu />
        <Input placeholder="Hinted search text" />
        <Voice />
      </SearchField>
      <SearchField {...args}>
        <Menu />
        <Input placeholder="Hinted search text" />
        <Voice />
        <IconButton slot="trailing" aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </SearchField>
      <SearchField {...args}>
        <Menu />
        <Input placeholder="Hinted search text" />
        <Voice />
        <Account />
      </SearchField>
    </div>
  ),
}

/** Nothing leading or trailing: the text is 16dp from either end. */
export const TextOnly: Story = {
  render: (args) => (
    <SearchField {...args}>
      <Input placeholder="Search your messages" />
    </SearchField>
  ),
}

/** Enabled, and with a query, the clear button showing. Hover one, press one, or Tab to one for its focus ring. */
export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <SearchField {...args}>
        <Menu />
        <Input placeholder="Hinted search text" />
        <Clear />
      </SearchField>
      <SearchField {...args} defaultValue="Search query">
        <Menu />
        <Input placeholder="Hinted search text" />
        <Clear />
      </SearchField>
    </div>
  ),
}

/** Controlled: `value` and `onChange`, and `onSubmit` as Enter is pressed. */
export const Controlled: Story = {
  render: function Controlled(args) {
    const [value, setValue] = useState('')
    const [submitted, setSubmitted] = useState('')
    return (
      <div className="flex flex-col gap-space-200 text-body-md text-on-surface">
        <SearchField {...args} value={value} onChange={setValue} onSubmit={setSubmitted}>
          <Icon slot="leading" name="search" />
          <Input placeholder="Search your messages" />
          <Clear />
        </SearchField>
        <span>Value: {value}</span>
        <span>Submitted: {submitted}</span>
      </div>
    )
  },
}

/** In a form, submitted by its `name`; `isRequired` holds the form back while it is empty. */
export const InAForm: Story = {
  render: (args: SearchFieldProps) => (
    <Form className="flex items-center gap-space-200" onSubmit={(event) => event.preventDefault()}>
      <SearchField {...args} name="q" isRequired>
        <Icon slot="leading" name="search" />
        <Input placeholder="Search your messages" />
        <Clear />
      </SearchField>
      <Button type="submit">Search</Button>
    </Form>
  ),
}

/** Disabled: its text and icons at 38%, and its buttons with it. */
export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: 'Search query' },
  render: (args) => (
    <SearchField {...args}>
      <Menu />
      <Input placeholder="Search your messages" />
      <Clear />
      <Voice />
    </SearchField>
  ),
}
