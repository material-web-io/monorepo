import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'
import { Divider } from '../divider'
import { Fab } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { Toolbar, type ToolbarProps } from './toolbar'

// Every prop of Toolbar, its own variant and color and React Aria's Toolbar's: the docgen reads
// none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  parameters: { layout: 'centered' },
  args: { variant: 'floating', color: 'standard', 'aria-label': 'Formatting' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['docked', 'floating'],
      table: { category: 'M3' },
    },
    color: { control: 'inline-radio', options: ['standard', 'vibrant'], table: { category: 'M3' } },
    // The layout, and the arrow keys that move the focus: left and right, or up and down.
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { category: 'M3' },
    },
    children: { control: false, table: { category: 'Parts' } },
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
    suppressHydrationWarning: { control: false, table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

const colors = ['standard', 'vibrant'] as const

const formats = [
  ['bold', 'Bold', 'format_bold'],
  ['italic', 'Italic', 'format_italic'],
  ['underline', 'Underline', 'format_underlined'],
] as const

// A toggle is React Aria's ToggleButton, an IconButton or a Button given `isSelectable`; in a
// ButtonGroup, with an `id`, it shows the group's selection.

/** Text formats, toggles in a ButtonGroup of multiple selection with bold on at the start, and two actions. */
function Formatting(props: ToolbarProps) {
  return (
    <Toolbar {...props}>
      <ButtonGroup
        aria-label="Text style"
        selectionMode="multiple"
        defaultSelectedKeys={['bold']}
        orientation={props.orientation}
        className={props.orientation === 'vertical' ? 'flex-col' : undefined}
      >
        {formats.map(([id, label, icon]) => (
          <IconButton key={id} id={id} aria-label={label} isSelectable>
            {({ isSelected }) => (
              <Icon name={icon} className={isSelected ? 'icon-filled' : undefined} />
            )}
          </IconButton>
        ))}
      </ButtonGroup>
      <IconButton aria-label="Text color">
        <Icon name="format_color_text" />
      </IconButton>
      <IconButton aria-label="More">
        <Icon name="more_vert" />
      </IconButton>
    </Toolbar>
  )
}

const actions = [
  ['Archive', 'archive'],
  ['Delete', 'delete'],
  ['Mark as unread', 'mark_email_unread'],
  ['Snooze', 'snooze'],
] as const

/** A docked toolbar of a message's actions, the last a toggle, its icon filled while it is on. */
function Message(props: ToolbarProps) {
  return (
    <Toolbar {...props} variant="docked">
      {actions.map(([label, icon]) => (
        <IconButton key={label} aria-label={label}>
          <Icon name={icon} />
        </IconButton>
      ))}
      <IconButton aria-label="Star" isSelectable>
        {({ isSelected }) => (
          <Icon name="star" className={isSelected ? 'icon-filled' : undefined} />
        )}
      </IconButton>
    </Toolbar>
  )
}

const pages = ['Photos', 'Memories', 'Library'] as const

/** Pages as tabs: tonal toggles in a ButtonGroup of single selection, which always has one, 4dp apart. */
function Pages(props: ToolbarProps) {
  return (
    <Toolbar {...props} variant="floating" aria-label="Pages">
      <ButtonGroup
        aria-label="Page"
        defaultSelectedKeys={['Photos']}
        disallowEmptySelection
        className="gap-space-50"
      >
        {pages.map((name) => (
          <Button key={name} id={name} variant="tonal" isSelectable>
            {({ isSelected }) => (
              <>
                {name === 'Photos' && (
                  <Icon name="image" className={isSelected ? 'icon-filled' : undefined} />
                )}
                {name}
              </>
            )}
          </Button>
        ))}
      </ButtonGroup>
    </Toolbar>
  )
}

const calls = [
  ['Turn camera on', 'videocam_off'],
  ['Mute', 'mic'],
  ['More', 'more_vert'],
] as const

/** Floating, a pill around its actions, each in a 48dp target 4dp from the next. The arrow keys move between them, and Tab leaves the toolbar; a selected toggle has a container of its own. */
export const Playground: Story = {
  render: (args) => <Formatting {...args} />,
}

/** Docked, across its container: evenly spaced, the first and the last 16dp from the ends. */
export const Docked: Story = {
  args: { variant: 'docked', 'aria-label': 'Message' },
  parameters: { layout: 'fullscreen' },
  render: (args) => <Message {...args} />,
}

/** Standard, on surface-container, its toggles flat in on-surface-variant and selected on secondary-container, and vibrant, on primary-container, its toggles flat in on-primary-container and selected on surface-container. A standard icon button that is no toggle keeps its own on-surface-variant in both. */
export const Colors: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-col items-center gap-space-300">
      {colors.map((color) => (
        <Formatting key={color} {...args} color={color} />
      ))}
      {colors.map((color) => (
        <Message key={color} {...args} color={color} aria-label="Message" />
      ))}
    </div>
  ),
}

/** Vertical, for either side of a larger window: 64dp wide, and the up and down arrow keys move between its actions. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="flex gap-space-600">
      {colors.map((color) => (
        <Formatting key={color} {...args} color={color} />
      ))}
    </div>
  ),
}

/** One action emphasized over the others: a filled icon button, wide, among standard ones; in a docked toolbar, in the middle. */
export const Emphasis: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-col items-center gap-space-300">
      {(['floating', 'docked'] as const).map((variant) => (
        <Toolbar key={variant} {...args} variant={variant} aria-label="Browser">
          <IconButton aria-label="Back">
            <Icon name="arrow_back" className="rtl:icon-mirrored" />
          </IconButton>
          <IconButton aria-label="Forward">
            <Icon name="arrow_forward" className="rtl:icon-mirrored" />
          </IconButton>
          <IconButton aria-label="New tab" variant="filled" width="wide">
            <Icon name="add" />
          </IconButton>
          <IconButton aria-label="Tabs">
            <Icon name="tab" />
          </IconButton>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
        </Toolbar>
      ))}
    </div>
  ),
}

/** Buttons with labels, as tabs between related pages: tonal toggles, flat until selected. A group in a toolbar is set 4dp in, so they are 12dp from the pill at its ends as they are from its sides. */
export const Labels: Story = {
  render: (args) => (
    <div className="flex flex-col items-center gap-space-300">
      {colors.map((color) => (
        <Pages key={color} {...args} color={color} />
      ))}
    </div>
  ),
}

/** Two buttons of a docked toolbar, one at each end: what is left of the row is between them. */
export const LeftAndRight: Story = {
  args: { variant: 'docked', 'aria-label': 'Steps' },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <Toolbar {...args}>
      <Button variant="text">Back</Button>
      <Button>Next</Button>
    </Toolbar>
  ),
}

/** In a medium window or larger a docked toolbar's spacing is its `className`'s: centered and 32dp apart, the default padding between items, or 8dp apart. */
export const Centered: Story = {
  args: { variant: 'docked' },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <Message {...args} aria-label="Message" className="justify-center gap-x-space-400" />
      <Toolbar {...args} aria-label="Reply" className="justify-center gap-x-space-100">
        <Button variant="filled">
          <Icon name="videocam" />
          Yes
        </Button>
        <Button variant="outlined">Next</Button>
        <Button variant="outlined">Maybe</Button>
        <IconButton aria-label="More replies" variant="outlined">
          <Icon name="keyboard_arrow_down" />
        </IconButton>
      </Toolbar>
    </div>
  ),
}

/** On web and other large screens a docked toolbar can be rounded, with dividers between groups of actions; both are the caller's, a `className` and `Divider`s. Laid out as a flex row here, 12dp between its elements, so a divider takes no 48dp target of its own. The formats are toggles on their own, each keeping whether it is on. */
export const LargeScreen: Story = {
  args: { variant: 'docked' },
  render: (args) => (
    <Toolbar {...args} className="flex w-fit gap-x-space-150 rounded-shape-full px-space-150">
      <IconButton aria-label="Undo">
        <Icon name="undo" className="rtl:icon-mirrored" />
      </IconButton>
      <IconButton aria-label="Redo">
        <Icon name="redo" className="rtl:icon-mirrored" />
      </IconButton>
      <Divider orientation="vertical" className="h-6 self-center" />
      {formats.map(([id, label, icon]) => (
        <IconButton key={id} aria-label={label} isSelectable defaultSelected={id === 'bold'}>
          {({ isSelected }) => (
            <Icon name={icon} className={isSelected ? 'icon-filled' : undefined} />
          )}
        </IconButton>
      ))}
      <Divider orientation="vertical" className="h-6 self-center" />
      <IconButton aria-label="Insert link">
        <Icon name="link" />
      </IconButton>
      <IconButton aria-label="Insert image">
        <Icon name="image" />
      </IconButton>
      <IconButton aria-label="More">
        <Icon name="more_vert" />
      </IconButton>
    </Toolbar>
  ),
}

/** A FAB beside a floating toolbar, 8dp from it: each is added on its own, the FAB here on tertiary-container. */
export const WithFab: Story = {
  render: (args) => (
    <div className="flex flex-col items-center gap-space-300">
      {colors.map((color) => (
        <div key={color} className="flex items-center gap-space-100">
          <Toolbar {...args} color={color} aria-label="Call">
            {calls.map(([label, icon]) => (
              <IconButton key={label} aria-label={label}>
                <Icon name={icon} />
              </IconButton>
            ))}
          </Toolbar>
          <Fab aria-label="Reply" color="tertiary-container">
            <Icon name="reply" className="rtl:icon-mirrored" />
          </Fab>
        </div>
      ))}
    </div>
  ),
}

/** Over content that is visually distinct a floating toolbar's elevation can be removed, with `className="shadow-none"`. */
export const NoElevation: Story = {
  render: (args) => (
    <div className="bg-surface-container-highest p-space-400">
      <Formatting {...args} color="vibrant" className="shadow-none" />
    </div>
  ),
}

/** A disabled action, on-surface at 38%, and a disabled toggle, the toolbar's icon color at 38%; neither has a container, and the arrow keys pass over both. */
export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-col items-center gap-space-300">
      {colors.map((color) => (
        <Toolbar key={color} {...args} color={color} aria-label="Call">
          {calls.map(([label, icon], index) => (
            <IconButton key={label} aria-label={label} isDisabled={index === 1}>
              <Icon name={icon} />
            </IconButton>
          ))}
          <IconButton aria-label="Captions" isSelectable defaultSelected isDisabled>
            {({ isSelected }) => (
              <Icon name="closed_caption" className={isSelected ? 'icon-filled' : undefined} />
            )}
          </IconButton>
        </Toolbar>
      ))}
    </div>
  ),
}
