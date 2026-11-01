import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { Key } from 'react-aria-components'
import { Button } from '../button'
import { Icon } from '../icon'
import { ButtonGroup } from './button-group'

// Every prop of ButtonGroup, its own variant, size and shape and React Aria's ToggleButtonGroup's:
// the docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Button group',
  component: ButtonGroup,
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'View' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['standard', 'connected'],
      table: { category: 'M3' },
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 's', 'm', 'l', 'xl'],
      table: { category: 'M3' },
    },
    shape: { control: 'inline-radio', options: ['round', 'square'], table: { category: 'M3' } },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { category: 'M3' },
    },
    children: { control: false, table: { category: 'Parts' } },
    // Of the buttons given an id: controlled by selectedKeys, or starting from defaultSelectedKeys.
    selectionMode: {
      control: 'inline-radio',
      options: ['single', 'multiple'],
      table: { category: 'Selection' },
    },
    disallowEmptySelection: { control: 'boolean', table: { category: 'Selection' } },
    selectedKeys: { control: 'object', table: { category: 'Selection' } },
    defaultSelectedKeys: { control: 'object', table: { category: 'Selection' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

const sizes = ['xs', 's', 'm', 'l', 'xl'] as const
const views = ['Day', 'Week', 'Month', 'Year']

// Our Button is React Aria's ToggleButton only given `isSelectable`; in a group, with an `id`, it
// shows the group's selection.

/** Single select, React Aria's default: a click, Space or Enter picks a view, and the arrow keys move between them. */
export const Playground: Story = {
  args: { variant: 'standard', size: 's', shape: 'round', defaultSelectedKeys: ['Week'] },
  render: (args) => (
    <ButtonGroup key={JSON.stringify(args.defaultSelectedKeys)} {...args}>
      {views.slice(0, 3).map((view) => (
        <Button key={view} id={view} size={args.size} variant="tonal" isSelectable>
          {view}
        </Button>
      ))}
    </ButtonGroup>
  ),
}

/** The buttons sit apart by the group's size: 18dp on `xs`, 12dp on `s` and 8dp on `m`, `l` and `xl`. */
export const Standard: Story = {
  args: { defaultSelectedKeys: ['Week'] },
  render: (args) => (
    <ButtonGroup {...args} variant="standard">
      {views.slice(0, 3).map((view) => (
        <Button key={view} id={view} variant="outlined" isSelectable>
          {view}
        </Button>
      ))}
    </ButtonGroup>
  ),
}

/**
 * The group spans its container and the buttons grow to fill it; here the container is 480dp
 * wide. The buttons sit 2dp apart and the sides that touch are squarer: 8dp on `xs`, `s` and
 * `m`, 16dp on `l` and 20dp on `xl`, and smaller while pressed. The selected one is fully round.
 */
export const Connected: Story = {
  args: { defaultSelectedKeys: ['Week'] },
  render: (args) => (
    <div className="w-120">
      <ButtonGroup {...args} variant="connected">
        {views.map((view) => (
          <Button key={view} id={view} variant="tonal" isSelectable>
            {view}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  ),
}

/** In a square group every corner is squarer, not just the inner ones. */
export const ConnectedSquare: Story = {
  args: { defaultSelectedKeys: ['Week'] },
  render: (args) => (
    <div className="w-120">
      <ButtonGroup {...args} variant="connected" shape="square">
        {views.map((view) => (
          <Button key={view} id={view} variant="tonal" isSelectable>
            {view}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  ),
}

/**
 * `size` on the group sets the space between a standard group's buttons and a connected group's
 * corners; each button takes its own `size`. Extra small and small connected buttons are at
 * least 48dp wide. The connected groups here hug their buttons (`w-auto`).
 */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-space-300">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col items-start gap-space-100">
          <span className="text-label-md text-on-surface-variant">{size}</span>
          <div className="flex flex-wrap items-center gap-space-300">
            {(['standard', 'connected'] as const).map((variant) => (
              <ButtonGroup
                key={variant}
                {...args}
                variant={variant}
                size={size}
                defaultSelectedKeys={['Two']}
                className="w-auto"
              >
                {['One', 'Two', 'Three'].map((label) => (
                  <Button key={label} id={label} size={size} variant="tonal" isSelectable>
                    {label}
                  </Button>
                ))}
              </ButtonGroup>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
}

/** Controlled single select with icon buttons, each named by its `aria-label`. */
export const TextAlignment: Story = {
  args: { variant: 'connected', size: 'm', 'aria-label': 'Text alignment' },
  render: function Render(args) {
    const [selected, setSelected] = useState<Set<Key>>(new Set(['left']))
    return (
      <ButtonGroup
        {...args}
        className="w-auto"
        disallowEmptySelection
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        {(
          [
            ['left', 'format_align_left', 'Align left'],
            ['center', 'format_align_center', 'Align center'],
            ['right', 'format_align_right', 'Align right'],
          ] as const
        ).map(([id, icon, label]) => (
          <Button key={id} id={id} size="m" variant="outlined" aria-label={label} isSelectable>
            <Icon name={icon} className={selected.has(id) ? 'icon-filled' : undefined} />
          </Button>
        ))}
      </ButtonGroup>
    )
  },
}

/** Multi select: each button toggles on its own, and the group is a toolbar. */
export const MultiSelect: Story = {
  args: {
    variant: 'connected',
    selectionMode: 'multiple',
    defaultSelectedKeys: ['open'],
    'aria-label': 'Filters',
  },
  render: (args) => (
    <ButtonGroup {...args} className="w-auto">
      {[
        ['open', 'Open'],
        ['assigned', 'Assigned to me'],
        ['mentioned', 'Mentioned'],
      ].map(([id, label]) => (
        <Button key={id} id={id} variant="tonal" isSelectable>
          {label}
        </Button>
      ))}
    </ButtonGroup>
  ),
}

/** Plain buttons, not toggles, are actions; with multiple selection the group is a toolbar of them. */
export const Actions: Story = {
  args: { selectionMode: 'multiple', 'aria-label': 'Actions' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outlined">Cancel</Button>
      <Button variant="tonal">Save draft</Button>
      <Button>Publish</Button>
    </ButtonGroup>
  ),
}

/**
 * A pending button keeps its place and its selection, and pressing it selects nothing; the others
 * can still be selected. Here Month is pending.
 */
export const Pending: Story = {
  args: { variant: 'connected', defaultSelectedKeys: ['Week'] },
  render: (args) => (
    <ButtonGroup {...args} className="w-auto">
      {views.map((view) => (
        <Button key={view} id={view} variant="outlined" isSelectable isPending={view === 'Month'}>
          {view}
        </Button>
      ))}
    </ButtonGroup>
  ),
}

/** A disabled group disables every button in it; a disabled button keeps its place and is skipped. */
export const Disabled: Story = {
  args: { variant: 'connected', defaultSelectedKeys: ['Week'] },
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <ButtonGroup {...args} isDisabled className="w-auto">
        {views.map((view) => (
          <Button key={view} id={view} variant="outlined" isSelectable>
            {view}
          </Button>
        ))}
      </ButtonGroup>
      <ButtonGroup {...args} className="w-auto">
        {views.map((view) => (
          <Button
            key={view}
            id={view}
            variant="outlined"
            isSelectable
            isDisabled={view === 'Month'}
          >
            {view}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  ),
}
