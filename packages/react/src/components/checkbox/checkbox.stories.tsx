import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useState, type ComponentProps } from 'react'
import { FieldError, Label, Text } from 'react-aria-components'
import { twMerge } from '../../lib/tv'
import { Button } from '../button'
import { Checkbox } from './checkbox'
import { CheckboxGroup } from './checkbox-group'

// Every prop of Checkbox, which are React Aria's CheckboxField's (and its CheckboxButton's
// children): the docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: {
    'aria-label': 'Pickles',
  },
  argTypes: {
    // The label text, after the box.
    children: { control: 'text', table: { category: 'Parts' } },
    // Controlled by isSelected, or starting from defaultSelected.
    isSelected: { control: 'boolean', table: { category: 'Selection' } },
    defaultSelected: { control: 'boolean', table: { category: 'Selection' } },
    isIndeterminate: { control: 'boolean', table: { category: 'Selection' } },
    isInvalid: { control: 'boolean', table: { category: 'State' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    isReadOnly: { control: 'boolean', table: { category: 'State' } },
    isRequired: { control: 'boolean', table: { category: 'State' } },
    autoFocus: { control: 'boolean', table: { category: 'State' } },
    excludeFromTabOrder: { control: 'boolean', table: { category: 'State' } },
    validationBehavior: {
      control: 'inline-radio',
      options: ['native', 'aria'],
      table: { category: 'Validation' },
    },
    validate: { control: false, table: { category: 'Validation' } },
    name: { control: 'text', table: { category: 'Form' } },
    value: { control: 'text', table: { category: 'Form' } },
    form: { control: 'text', table: { category: 'Form' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    'aria-errormessage': { control: 'text', table: { category: 'Accessibility' } },
    'aria-controls': { control: 'text', table: { category: 'Accessibility' } },
    id: { control: 'text', table: { category: 'DOM' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    suppressHydrationWarning: { control: false, table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
    inputRef: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

/** Uncontrolled: a click or Space toggles it; the controls set the state it starts in. */
export const Playground: Story = {
  render: (args) => <Checkbox key={String(args.defaultSelected)} {...args} />,
}

/** Every state: unselected, selected and indeterminate, each enabled, in error and disabled. Hover, focus and press the enabled ones to see their state layer. */
export const States: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(3,auto)] items-center justify-items-center gap-x-space-300 gap-y-space-100">
      <span />
      {['Enabled', 'Error', 'Disabled'].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {(
        [
          ['Unselected', {}],
          ['Selected', { defaultSelected: true }],
          ['Indeterminate', { isIndeterminate: true }],
        ] as const
      ).map(([row, state]) => (
        <Fragment key={row}>
          <span className={twMerge(label, 'justify-self-start')}>{row}</span>
          <Checkbox {...args} {...state} aria-label={row} />
          <Checkbox {...args} {...state} aria-label={`${row}, error`} isInvalid />
          <Checkbox {...args} {...state} aria-label={`${row}, disabled`} isDisabled />
        </Fragment>
      ))}
    </div>
  ),
}

/** A checkbox is named by its label text, its children, drawn after the box in the label that is pressed: clicking the text selects the option too. A disabled checkbox greys its text with it. */
export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col items-start text-body-lg">
      <Checkbox {...args} aria-label={undefined} defaultSelected>
        Pickles
      </Checkbox>
      <Checkbox {...args} aria-label={undefined} isDisabled>
        Tomato
      </Checkbox>
    </div>
  ),
}

const extras = ['Pickles', 'Tomato', 'Lettuce', 'Cheese'] as const

const list = 'w-80 rounded-shape-lg bg-surface-container-lowest py-space-100'
const row = 'flex h-14 items-center px-space-100 text-body-lg'

/** Checkboxes select multiple, related options: several items in a list can be selected. Each is a field of the form by its `name`. */
export const List: Story = {
  render: (args) => (
    <form className={list}>
      <div className="px-space-200 py-space-100 text-label-lg text-on-surface-variant">Extras</div>
      {extras.map((name) => (
        <Checkbox
          key={name}
          {...args}
          aria-label={undefined}
          className={row}
          name="extras"
          value={name.toLowerCase()}
        >
          <span className="ps-space-200">{name}</span>
        </Checkbox>
      ))}
    </form>
  ),
}

function Additions(props: ComponentProps<typeof Checkbox>) {
  const [items, setItems] = useState(extras.map(() => false))
  const all = items.every(Boolean)
  const some = items.some(Boolean)
  return (
    <div className={list}>
      <Checkbox
        {...props}
        aria-label={undefined}
        className={row}
        isSelected={all}
        isIndeterminate={some && !all}
        onChange={(isSelected) => setItems(items.map(() => isSelected))}
      >
        <span className="ps-space-200">Additions</span>
      </Checkbox>
      {extras.map((name, i) => (
        <Checkbox
          key={name}
          {...props}
          aria-label={undefined}
          className={twMerge(row, 'ps-space-700')}
          isSelected={items[i]}
          onChange={(isSelected) => setItems(items.map((on, j) => (j === i ? isSelected : on)))}
        >
          <span className="ps-space-200">{name}</span>
        </Checkbox>
      ))}
    </div>
  )
}

/**
 * A parent checkbox is `isIndeterminate` while only some of its children are
 * selected. Selecting the parent selects every child, and unselecting it
 * unselects them all.
 */
export const ParentChild: Story = {
  render: (args) => <Additions {...args} />,
}

const title = 'block px-space-200 py-space-100 text-label-lg text-on-surface-variant'

/** The checkboxes of a `CheckboxGroup` are one field: each is selected or not on its own, and the group's value is the `value`s of those selected, submitted under its `name`. A `Label` in the group is its title and its name, and a `Text` in the `description` slot describes it. */
export const Group: Story = {
  render: (args) => (
    <CheckboxGroup name="extras" defaultValue={['pickles', 'cheese']} className={list}>
      <Label className={title}>Extras</Label>
      {extras.map((name) => (
        <Checkbox
          key={name}
          {...args}
          aria-label={undefined}
          className={row}
          value={name.toLowerCase()}
        >
          <span className="ps-space-200">{name}</span>
        </Checkbox>
      ))}
      <Text slot="description" className={title}>
        Free of charge
      </Text>
    </CheckboxGroup>
  ),
}

const values = extras.map((name) => name.toLowerCase())

function ParentGroup(props: ComponentProps<typeof Checkbox>) {
  const [value, setValue] = useState<string[]>(['tomato'])
  return (
    <div className={list}>
      <Checkbox
        {...props}
        aria-label={undefined}
        className={row}
        isSelected={value.length === values.length}
        isIndeterminate={value.length > 0 && value.length < values.length}
        onChange={(isSelected) => setValue(isSelected ? values : [])}
      >
        <span className="ps-space-200">Additions</span>
      </Checkbox>
      <CheckboxGroup aria-label="Additions" value={value} onChange={setValue}>
        {extras.map((name) => (
          <Checkbox
            key={name}
            {...props}
            aria-label={undefined}
            className={twMerge(row, 'ps-space-700')}
            value={name.toLowerCase()}
          >
            <span className="ps-space-200">{name}</span>
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  )
}

/**
 * Controlled: the group's `value` is the selected checkboxes' `value`s, and
 * `onChange` reports them as they change. A parent checkbox outside the group
 * selects all of them or none, and is `isIndeterminate` while only some are.
 */
export const GroupWithParent: Story = {
  render: (args) => <ParentGroup {...args} />,
}

/** A group that `isRequired` keeps its form from being sent with none selected: once sent, each checkbox is drawn in the error role and a `FieldError` in the group shows, until one is selected. */
export const RequiredGroup: Story = {
  render: (args) => (
    <form onSubmit={(event) => event.preventDefault()} className={list}>
      <CheckboxGroup name="extras" isRequired>
        <Label className={title}>Extras</Label>
        {extras.map((name) => (
          <Checkbox
            key={name}
            {...args}
            aria-label={undefined}
            className={row}
            value={name.toLowerCase()}
          >
            <span className="ps-space-200">{name}</span>
          </Checkbox>
        ))}
        <FieldError className="block px-space-200 py-space-100 text-body-sm text-error">
          Pick at least one
        </FieldError>
      </CheckboxGroup>
      <div className="flex justify-end px-space-200 pt-space-100">
        <Button variant="text" type="submit">
          Order
        </Button>
      </div>
    </form>
  ),
}

/** `isInvalid` colors the outline, fill and state layer in the error role, and marks the checkbox invalid. */
export const Error: Story = {
  args: { isInvalid: true },
  render: (args) => (
    <div className="flex items-center gap-space-200">
      <Checkbox {...args} aria-label="Unselected" />
      <Checkbox {...args} aria-label="Selected" defaultSelected />
      <Checkbox {...args} aria-label="Indeterminate" isIndeterminate />
    </div>
  ),
}

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <div className="flex items-center gap-space-200">
      <Checkbox {...args} aria-label="Unselected" />
      <Checkbox {...args} aria-label="Selected" defaultSelected />
      <Checkbox {...args} aria-label="Indeterminate" isIndeterminate />
    </div>
  ),
}
