import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useState, type ComponentProps } from 'react'
import { Label, Text } from 'react-aria-components'
import { twMerge } from '../../lib/tv'
import { Button } from '../button'
import { Radio } from './radio'
import { RadioGroup } from './radio-group'

// Every prop of Radio, which are React Aria's RadioField's (and its RadioButton's children): the
// docgen reads none of them from the imported types, so each is listed here. Which one is
// selected, and onChange, are its RadioGroup's.
const meta = {
  title: 'Components/Radio button',
  component: Radio,
  args: {
    'aria-label': 'Home',
    value: 'home',
  },
  argTypes: {
    // The label text, after the ring.
    children: { control: 'text', table: { category: 'Parts' } },
    // What its RadioGroup selects it by.
    value: { control: 'text', table: { category: 'Value' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    autoFocus: { control: 'boolean', table: { category: 'State' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
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
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

/** A radio button is one option of a `RadioGroup`, which selects it by its `value`. Uncontrolled, a click or Space selects it and nothing deselects it. */
export const Playground: Story = {
  render: (args) => (
    <RadioGroup aria-label="Ship to">
      <Radio {...args} />
    </RadioGroup>
  ),
}

/** Every state: unselected and selected, each enabled and disabled, each in a group of its own whose `defaultValue` selects it or not. Hover, focus and press the enabled ones to see their state layer. */
export const States: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(2,auto)] items-center justify-items-center gap-x-space-300 gap-y-space-100">
      <span />
      {['Enabled', 'Disabled'].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {(
        [
          ['Unselected', null],
          ['Selected', args.value],
        ] as const
      ).map(([row, value]) => (
        <Fragment key={row}>
          <span className={twMerge(label, 'justify-self-start')}>{row}</span>
          <RadioGroup aria-label={row} defaultValue={value}>
            <Radio {...args} aria-label={row} />
          </RadioGroup>
          <RadioGroup aria-label={`${row}, disabled`} defaultValue={value}>
            <Radio {...args} aria-label={`${row}, disabled`} isDisabled />
          </RadioGroup>
        </Fragment>
      ))}
    </div>
  ),
}

const addresses = ['Home', 'Office', 'Other'] as const

/** A radio button is named by its label text, its children, drawn after the ring in the label that is pressed: clicking the text selects the option too. A disabled radio button greys its text with it. */
export const WithLabel: Story = {
  render: (args) => (
    <RadioGroup
      aria-label="Ship to"
      defaultValue="home"
      className="flex flex-col items-start text-body-lg"
    >
      {addresses.map((name) => (
        <Radio
          key={name}
          {...args}
          aria-label={undefined}
          value={name.toLowerCase()}
          isDisabled={name === 'Other'}
        >
          {name}
        </Radio>
      ))}
    </RadioGroup>
  ),
}

const group = 'w-80 rounded-shape-lg bg-surface-container-lowest py-space-100'
const title = 'block px-space-200 py-space-100 text-label-lg text-on-surface-variant'
const row = 'flex h-14 items-center px-space-100 text-body-lg'

/** The radio buttons of a `RadioGroup` are one group: selecting one deselects the others, Tab enters the group at the selected one and the arrow keys move between them. A `Label` in the group is its title and its name, and a `Text` in the `description` slot describes it. */
export const Group: Story = {
  render: (args) => (
    <RadioGroup defaultValue="home" className={group}>
      <Label className={title}>Ship to</Label>
      {addresses.map((name) => (
        <Radio
          key={name}
          {...args}
          aria-label={undefined}
          className={row}
          value={name.toLowerCase()}
        >
          <span className="ps-space-200">{name}</span>
        </Radio>
      ))}
      <Text slot="description" className={title}>
        Weekdays only
      </Text>
    </RadioGroup>
  ),
}

function ShipTo(props: ComponentProps<typeof Radio>) {
  const [address, setAddress] = useState<string | null>('home')
  return (
    <RadioGroup value={address} onChange={setAddress} className={group}>
      <Label className={title}>Ship to</Label>
      {addresses.map((name) => (
        <Radio
          key={name}
          {...props}
          aria-label={undefined}
          className={row}
          value={name.toLowerCase()}
        >
          <span className="ps-space-200">{name}</span>
        </Radio>
      ))}
      <div className="flex justify-end px-space-200 pt-space-100">
        <Button variant="text" isDisabled={address === null} onPress={() => setAddress(null)}>
          Clear selection
        </Button>
      </div>
    </RadioGroup>
  )
}

/**
 * Controlled: the group's `value` is the selected radio button's, and
 * `onChange` reports the one that becomes selected. A group cannot be
 * deselected from its radio buttons, so a separate button clears it.
 */
export const Controlled: Story = {
  render: (args) => <ShipTo {...args} />,
}

/** A disabled `RadioGroup` disables every radio button in it. */
export const Disabled: Story = {
  render: (args) => (
    <RadioGroup
      aria-label="Ship to"
      defaultValue="office"
      isDisabled
      className="flex gap-space-200"
    >
      <Radio {...args} aria-label="Unselected" value="home" />
      <Radio {...args} aria-label="Selected" value="office" />
    </RadioGroup>
  ),
}
