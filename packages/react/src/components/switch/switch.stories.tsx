import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useState, type ComponentProps } from 'react'
import { twMerge } from '../../lib/tv'
import { Switch } from './switch'

// Every prop of Switch, its own icons and React Aria's SwitchField's (and its SwitchButton's
// children): the docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: {
    'aria-label': 'Dark mode',
  },
  argTypes: {
    // The icons the handle holds.
    icons: {
      control: 'inline-radio',
      options: ['none', 'selected', 'both'],
      table: { category: 'M3' },
    },
    // The label text, after the switch.
    children: { control: 'text', table: { category: 'Parts' } },
    // Controlled by isSelected, or starting from defaultSelected.
    isSelected: { control: 'boolean', table: { category: 'Selection' } },
    defaultSelected: { control: 'boolean', table: { category: 'Selection' } },
    // M3 has no error switch, so isInvalid draws nothing of its own.
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
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

/** Uncontrolled: a click, Space or Enter toggles it; the control sets the state it starts in. */
export const Playground: Story = {
  render: (args) => <Switch key={String(args.defaultSelected)} {...args} />,
}

/** Every state: unselected and selected, each enabled and disabled. Hover, focus and press the enabled ones to see the handle darken and grow inside its state layer. */
export const States: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(2,auto)] items-center justify-items-center gap-x-space-300 gap-y-space-200">
      <span />
      {['Enabled', 'Disabled'].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {(
        [
          ['Unselected', {}],
          ['Selected', { defaultSelected: true }],
        ] as const
      ).map(([row, state]) => (
        <Fragment key={row}>
          <span className={twMerge(label, 'justify-self-start')}>{row}</span>
          <Switch {...args} {...state} aria-label={row} />
          <Switch {...args} {...state} aria-label={`${row}, disabled`} isDisabled />
        </Fragment>
      ))}
    </div>
  ),
}

/** The three configurations: without icons, with an icon on the selected switch, and with one on both. An unselected handle that holds an icon is 24dp, not 16dp. */
export const Icons: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(2,auto)] items-center justify-items-center gap-x-space-300 gap-y-space-200">
      <span />
      {['Unselected', 'Selected'].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {(
        [
          ['Without icons', 'none'],
          ['Icon on selected switch', 'selected'],
          ['Icon on selected and unselected switch', 'both'],
        ] as const
      ).map(([row, icons]) => (
        <Fragment key={row}>
          <span className={twMerge(label, 'justify-self-start')}>{row}</span>
          <Switch {...args} icons={icons} aria-label={`${row}, unselected`} />
          <Switch {...args} icons={icons} aria-label={`${row}, selected`} defaultSelected />
        </Fragment>
      ))}
    </div>
  ),
}

/** A switch is named by its label text, its children, drawn after it in the label that is pressed: clicking the text toggles it too. A disabled switch greys its text with it. */
export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-space-200 text-body-lg">
      <Switch {...args} aria-label={undefined} defaultSelected>
        <span className="ps-space-300">Dark mode</span>
      </Switch>
      <Switch {...args} aria-label={undefined} isDisabled>
        <span className="ps-space-300">Wi-Fi</span>
      </Switch>
    </div>
  ),
}

const settings = [
  ['Wi-Fi', 'Public Campus Wi-Fi'],
  ['Bluetooth', 'Visible to nearby devices'],
  ['Airplane mode', ''],
] as const

const list = 'w-80 rounded-shape-lg bg-surface-container-lowest py-space-100'
const row = 'flex min-h-14 items-center px-space-200 py-space-100'

function Network(props: ComponentProps<typeof Switch>) {
  const [on, setOn] = useState<Record<string, boolean>>({ 'Wi-Fi': true })
  return (
    <div className={list}>
      {settings.map(([name, supporting]) => (
        <Switch
          key={name}
          {...props}
          aria-label={undefined}
          className={row}
          isSelected={on[name] ?? false}
          onChange={(isSelected) => setOn({ ...on, [name]: isSelected })}
        >
          {({ isSelected }) => (
            <span className="flex flex-col ps-space-300">
              <span className="text-body-lg">{name}</span>
              {supporting && (
                <span className="text-body-md text-on-surface-variant">
                  {isSelected ? supporting : 'Off'}
                </span>
              )}
            </span>
          )}
        </Switch>
      ))}
    </div>
  )
}

/**
 * Controlled, in a stacked settings list: each switch is `isSelected` from the list's state
 * and `onChange` sets it, taking effect at once. Its children are a function of its state,
 * which draws the supporting text of the state it is in.
 */
export const Controlled: Story = {
  args: { icons: 'selected' },
  render: (args) => <Network {...args} />,
}

export const Disabled: Story = {
  args: { isDisabled: true, icons: 'both' },
  render: (args) => (
    <div className="flex items-center gap-space-300">
      <Switch {...args} aria-label="Unselected" />
      <Switch {...args} aria-label="Selected" defaultSelected />
    </div>
  ),
}
