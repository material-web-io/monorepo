import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { MenuTrigger } from 'react-aria-components'
import { Icon } from '../icon'
import {
  FabMenu,
  FabMenuButton,
  FabMenuItem,
  FabMenuPopover,
  type FabMenuColor,
  type FabMenuSize,
} from '.'

/** The items of every story but those that change them. */
const items = (
  <>
    <FabMenuItem textValue="Email">
      <Icon name="mail" />
      Email
    </FabMenuItem>
    <FabMenuItem textValue="Message">
      <Icon name="chat" />
      Message
    </FabMenuItem>
    <FabMenuItem textValue="Folder">
      <Icon name="folder" />
      Folder
    </FabMenuItem>
  </>
)

/**
 * A FAB menu as React Aria composes a menu: React Aria's `MenuTrigger` around the
 * `FabMenuButton` and the `FabMenuPopover`, which holds the `FabMenu`, the list of
 * `FabMenuItem`s.
 */
function Example({
  label = 'Create',
  color,
  size,
  isDisabled,
  className,
  children = items,
}: {
  label?: string
  color?: FabMenuColor
  size?: FabMenuSize
  isDisabled?: boolean
  className?: string
  children?: ReactNode
}) {
  return (
    <MenuTrigger>
      <FabMenuButton
        aria-label={label}
        color={color}
        size={size}
        isDisabled={isDisabled}
        className={className}
      >
        <Icon name="add" />
      </FabMenuButton>
      <FabMenuPopover>
        <FabMenu color={color}>{children}</FabMenu>
      </FabMenuPopover>
    </MenuTrigger>
  )
}

const meta = {
  title: 'Components/FAB menu',
  component: FabMenuButton,
  subcomponents: { FabMenuPopover, FabMenu, FabMenuItem },
  parameters: { layout: 'centered' },
  args: {
    'aria-label': 'Create',
    children: <Icon name="add" />,
    color: 'primary',
    size: 'baseline',
  },
  argTypes: {
    color: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary'],
      table: { category: 'M3' },
    },
    size: {
      control: 'inline-radio',
      options: ['baseline', 'medium', 'large'],
      table: { category: 'M3' },
    },
    children: { table: { category: 'Parts' } },
    isPending: { table: { category: 'State' } },
    // Off in the stories with no args: taking them would turn on every inferred control too.
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    'aria-label': { table: { category: 'Accessibility' } },
    className: { table: { category: 'Styling' } },
    style: { table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
  // The FAB takes the controls, and the list the same color set.
  render: (args) => (
    <MenuTrigger>
      <FabMenuButton {...args} />
      <FabMenuPopover>
        <FabMenu color={args.color}>{items}</FabMenu>
      </FabMenuPopover>
    </MenuTrigger>
  ),
} satisfies Meta<typeof FabMenuButton>

export default meta
type Story = StoryObj<typeof meta>

const colors = ['primary', 'secondary', 'tertiary'] as const
const sizes = ['baseline', 'medium', 'large'] as const

/**
 * Opens the menu from its FAB, as a click does, for a story that shows it
 * open. Whether it is open is the menu's own state, as with any React Aria
 * menu: the FAB, Escape, a selection or a click outside close it.
 */
const open: Story['play'] = async ({ canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Create' }))
}

/**
 * A FAB menu is composed as React Aria composes a menu: its `MenuTrigger`
 * around the `FabMenuButton`, the FAB, and the `FabMenuPopover`, the stack,
 * which holds the `FabMenu`, the list of `FabMenuItem`s. Click the FAB to open
 * the menu, and anywhere outside it to close it.
 */
export const Playground: Story = {}

export const Colors: Story = {
  argTypes: { isDisabled: { control: false } },
  render: () => (
    <div className="flex flex-wrap items-end gap-space-600">
      {colors.map((color) => (
        <Example key={color} label={`Create, ${color}`} color={color} />
      ))}
    </div>
  ),
}

/** The FAB is `baseline`, `medium` or `large`, same as `Fab`; the item stack and close button stay one size. */
export const Sizes: Story = {
  argTypes: { isDisabled: { control: false } },
  render: () => (
    <div className="flex flex-wrap items-end gap-space-600">
      {sizes.map((size) => (
        <Example key={size} label={`Create, ${size}`} size={size} />
      ))}
    </div>
  ),
}

/**
 * The FAB morphs into a circular close button and the items appear above it.
 * Opened here by a click on the FAB; the arrow keys move through the items,
 * Enter or Space selects one, and Escape closes it again.
 */
export const Open: Story = {
  play: open,
  // One menu is open at a time, so only this story opens on the docs page.
  parameters: { docs: { story: { autoplay: true } } },
}

/** Only the label is required on an item; the icon can be left off if necessary. */
export const ItemWithoutIcon: Story = {
  argTypes: { isDisabled: { control: false } },
  render: () => (
    <Example>
      <FabMenuItem>Email</FabMenuItem>
      <FabMenuItem>Message</FabMenuItem>
      <FabMenuItem>Folder</FabMenuItem>
    </Example>
  ),
  play: open,
}

/**
 * A pending FAB, `isPending` on the `FabMenuButton`, shows its loading indicator alone and cannot
 * open its menu, while an action chosen from it is in progress; it keeps the focus.
 */
export const Pending: Story = {
  args: { isPending: true },
}

/** A disabled FAB, `isDisabled` on the `FabMenuButton`, cannot open its menu. */
export const Disabled: Story = {
  args: { isDisabled: true },
}

/** A disabled item is skipped by the keyboard and ignores clicks, `aria-disabled` rather than disabled outright, as React Aria's menu items are. */
export const DisabledItem: Story = {
  argTypes: { isDisabled: { control: false } },
  render: () => (
    <Example>
      <FabMenuItem textValue="Email">
        <Icon name="mail" />
        Email
      </FabMenuItem>
      <FabMenuItem textValue="Message" isDisabled>
        <Icon name="chat" />
        Message
      </FabMenuItem>
      <FabMenuItem textValue="Folder">
        <Icon name="folder" />
        Folder
      </FabMenuItem>
    </Example>
  ),
  play: open,
}

// Deliberately many more than the guidelines' own "2-6 items" - a stress
// test of the scroll behavior, not a recommended real count.
const manyItems = [
  ['mail', 'Email'],
  ['chat', 'Message'],
  ['star', 'Star'],
  ['share', 'Share'],
  ['edit', 'Edit'],
  ['reply', 'Reply'],
  ['archive', 'Archive'],
  ['folder', 'Folder'],
  ['delete', 'Delete'],
  ['print', 'Print'],
  ['download', 'Download'],
  ['upload', 'Upload'],
  ['favorite', 'Favorite'],
  ['bookmark', 'Bookmark'],
  ['flag', 'Flag'],
  ['label', 'Label'],
  ['schedule', 'Schedule'],
  ['forward', 'Forward'],
  ['content_copy', 'Copy'],
  ['content_cut', 'Cut'],
] as const

/**
 * On a short screen, the item stack can run out of room before its items do.
 * The accessibility page: "When the FAB menu can scroll, make sure the items
 * scroll behind the close button. The close button should always be easy to
 * access and unobstructed." - so the stack takes no more than the room above
 * the FAB and scrolls internally instead, opening at the item nearest it.
 *
 * Twenty items, well past the guidelines' own recommended count, on a real
 * emulated 320x568 screen - the `viewport` global below, not a wrapping box,
 * since the room is measured against the window itself. The FAB places itself
 * at the window's bottom end, as a FAB menu is placed.
 */
export const Scrollable: Story = {
  argTypes: { isDisabled: { control: false } },
  parameters: { layout: 'fullscreen' },
  globals: { viewport: 'iphone14' },
  render: () => (
    <Example className="fixed right-space-200 bottom-space-200 z-fab">
      {manyItems.map(([icon, label]) => (
        <FabMenuItem key={label} textValue={label}>
          <Icon name={icon} />
          {label}
        </FabMenuItem>
      ))}
    </Example>
  ),
  play: open,
}
