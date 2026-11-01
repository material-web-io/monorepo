import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Text, useListData, type Selection } from 'react-aria-components'
import { Checkbox } from '../checkbox'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { Switch } from '../switch'
import { List, ListItem, useDragAndDrop, type ListProps } from '.'

/** A 56dp square image, as a leading image would be, as a data URL. */
const image = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112"><rect width="112" height="112" fill="${color}"/><circle cx="56" cy="56" r="28" fill="white" fill-opacity="0.6"/></svg>`,
  )}`

/** A 100 by 56dp video thumbnail, as a data URL. */
const thumbnail = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="112"><rect width="200" height="112" fill="${color}"/><path d="M88 36l32 20-32 20z" fill="white"/></svg>`,
  )}`

/** A leading avatar: an initial, 40dp and round on primary container, in the title medium type. */
const Avatar = ({ initial }: { initial: string }) => (
  <span
    slot="leading"
    aria-hidden
    className="grid size-10 place-items-center rounded-full bg-primary-container text-title-md text-on-primary-container"
  >
    {initial}
  </span>
)

const contacts = [
  ['Ali Connors', 'Brunch this weekend?', 'A', 'teal'],
  ['Jennifer Lopez', 'Summer BBQ', 'J', 'tomato'],
  ['Sandra Adams', 'Oui oui', 'S', 'slateblue'],
  ['Trevor Hansen', 'Birthday gift', 'T', 'goldenrod'],
] as const

// Every prop of the List, its own and React Aria's GridList's, but its event handlers: the docgen
// reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/List',
  component: List,
  subcomponents: { ListItem },
  parameters: { layout: 'centered' },
  args: {
    variant: 'standard',
    hasDivider: false,
    'aria-label': 'Contacts',
    className: 'w-90',
    children: contacts.map(([name, message, , color]) => (
      <ListItem key={name} id={name} textValue={name}>
        <img slot="leading" src={image(color)} alt="" className="size-10 rounded-full" />
        <Text slot="label">{name}</Text>
        <Text slot="description">{message}</Text>
      </ListItem>
    )),
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['standard', 'segmented'],
      table: { category: 'M3' },
    },
    hasDivider: { control: 'boolean', table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    items: { control: false, table: { category: 'Parts' } },
    dependencies: { control: false, table: { category: 'Parts' } },
    renderEmptyState: { control: false, table: { category: 'Parts' } },
    selectionMode: {
      control: 'inline-radio',
      options: ['none', 'single', 'multiple'],
      table: { category: 'Selection' },
    },
    selectionBehavior: {
      control: 'inline-radio',
      options: ['toggle', 'replace'],
      table: { category: 'Selection' },
    },
    selectedKeys: { control: 'object', table: { category: 'Selection' } },
    defaultSelectedKeys: { control: 'object', table: { category: 'Selection' } },
    disabledKeys: { control: 'object', table: { category: 'Selection' } },
    disabledBehavior: {
      control: 'inline-radio',
      options: ['all', 'selection'],
      table: { category: 'Selection' },
    },
    disallowEmptySelection: { control: 'boolean', table: { category: 'Selection' } },
    escapeKeyBehavior: {
      control: 'inline-radio',
      options: ['clearSelection', 'none'],
      table: { category: 'Selection' },
    },
    shouldSelectOnPressUp: { control: 'boolean', table: { category: 'Behavior' } },
    keyboardNavigationBehavior: {
      control: 'inline-radio',
      options: ['arrow', 'tab'],
      table: { category: 'Behavior' },
    },
    disallowTypeAhead: { control: 'boolean', table: { category: 'Behavior' } },
    layout: { control: 'inline-radio', options: ['stack', 'grid'], table: { category: 'Layout' } },
    orientation: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal'],
      table: { category: 'Layout' },
    },
    dragAndDropHooks: { control: false, table: { category: 'Drag and drop' } },
    autoFocus: {
      control: 'select',
      options: [false, true, 'first', 'last'],
      table: { category: 'State' },
    },
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
  },
} satisfies Meta<typeof List>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** The two styles side by side: standard, and segmented with 2dp between the items. */
export const Styles: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-space-600">
      {(['standard', 'segmented'] as const).map((variant) => (
        <List key={variant} {...args} variant={variant} aria-label={`${variant} contacts`} />
      ))}
    </div>
  ),
}

/** Dividers between the items of an uncontained list. */
export const Dividers: Story = { args: { hasDivider: true } }

/** One, two and three lines of text: the label, with supporting text, and with an overline too. */
export const Lines: Story = {
  args: {
    'aria-label': 'Inbox',
    variant: 'segmented',
    children: [
      <ListItem key="one" id="one" textValue="Label text">
        <Icon slot="leading" name="mail" />
        <Text slot="label">Label text</Text>
        <Text slot="trailing">100+</Text>
      </ListItem>,
      <ListItem key="two" id="two" textValue="Label text">
        <Icon slot="leading" name="mail" />
        <Text slot="label">Label text</Text>
        <Text slot="description">Supporting text that is long enough to fill up</Text>
        <Text slot="trailing">100+</Text>
      </ListItem>,
      <ListItem key="three" id="three" textValue="Label text">
        <Avatar initial="A" />
        <Text slot="overline">Overline</Text>
        <Text slot="label">Label text</Text>
        <Text slot="description">Supporting text that is long enough to fill up two lines</Text>
        <Icon slot="trailing" name="arrow_right" className="rtl:icon-mirrored" />
      </ListItem>,
    ],
  },
}

/** What leads an item: an icon, an avatar, a 56dp image or a 100 by 56dp video thumbnail. */
export const Leading: Story = {
  args: {
    'aria-label': 'Media',
    variant: 'segmented',
    children: [
      <ListItem key="icon" id="icon" textValue="Leading icon">
        <Icon slot="leading" name="star" />
        <Text slot="label">Leading icon</Text>
        <Text slot="description">Supporting text</Text>
      </ListItem>,
      <ListItem key="avatar" id="avatar" textValue="Leading avatar">
        <Avatar initial="A" />
        <Text slot="label">Leading avatar</Text>
        <Text slot="description">Supporting text</Text>
      </ListItem>,
      <ListItem key="image" id="image" textValue="Leading image">
        <img slot="leading" src={image('teal')} alt="" className="size-14 rounded-shape-sm" />
        <Text slot="label">Leading image</Text>
        <Text slot="description">Supporting text</Text>
      </ListItem>,
      <ListItem key="video" id="video" textValue="Leading video">
        <img
          slot="leading"
          src={thumbnail('slateblue')}
          alt=""
          className="h-14 w-25 rounded-shape-sm"
        />
        <Text slot="label">Leading video</Text>
        <Text slot="description">Supporting text</Text>
      </ListItem>,
    ],
  },
}

/** A single-action list: each item is one action, here a link. */
export const SingleAction: Story = {
  args: {
    'aria-label': 'Settings',
    variant: 'segmented',
    children: (
      [
        ['wifi', 'Wi-Fi', 'Home network'],
        ['bluetooth', 'Bluetooth', 'On'],
        ['notifications', 'Notifications', 'Allowed'],
      ] as const
    ).map(([icon, label, description]) => (
      <ListItem key={label} id={label} textValue={label} href={`#${icon}`}>
        <Icon slot="leading" name={icon} />
        <Text slot="label">{label}</Text>
        <Text slot="description">{description}</Text>
        <Icon slot="trailing" name="chevron_right" className="rtl:icon-mirrored" />
      </ListItem>
    )),
  },
}

/** A multi-action list: the item acts, and the icon buttons at its end act on their own. */
export const MultiAction: Story = {
  args: {
    'aria-label': 'Bookmarks',
    variant: 'segmented',
    children: contacts.map(([name, message, initial]) => (
      <ListItem key={name} id={name} textValue={name} onAction={() => alert(name)}>
        <Avatar initial={initial} />
        <Text slot="label">{name}</Text>
        <Text slot="description">{message}</Text>
        <IconButton
          slot="trailing"
          aria-label="Bookmark"
          onPress={() => alert(`Bookmarked ${name}`)}
        >
          <Icon name="bookmark" />
        </IconButton>
        <IconButton slot="trailing" aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </ListItem>
    )),
  },
}

/** A single-select list, its selected item marked by a checkmark in its leading slot. */
export const SingleSelect: Story = {
  args: {
    'aria-label': 'Color',
    variant: 'segmented',
    selectionMode: 'single',
    defaultSelectedKeys: ['Periwinkle'],
    children: (
      [
        ['Periwinkle', '#CCCCFF'],
        ['Mint', '#98FF98'],
        ['Peach', '#FFE5B4'],
        ['Lavender', '#E6E6FA'],
      ] as const
    ).map(([name, color]) => (
      <ListItem key={name} id={name} textValue={name}>
        {({ isSelected }) => (
          <>
            {isSelected ? (
              <Icon slot="leading" name="check" />
            ) : (
              <span slot="leading" className="size-5 rounded-full" style={{ background: color }} />
            )}
            <Text slot="label">{name}</Text>
          </>
        )}
      </ListItem>
    )),
  },
}

/** Two multi-select lists of the same selection: a checkbox in each item, leading or trailing, shows and toggles it. */
function MultiSelectLists(args: ListProps) {
  const [selected, setSelected] = useState<Selection>(new Set(['Ali Connors']))
  return (
    <div className="flex flex-wrap gap-space-600">
      <List
        {...args}
        aria-label="Contacts to share with"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        {contacts.map(([name, message]) => (
          <ListItem key={name} id={name} textValue={name}>
            <Checkbox slot="selection" />
            <Text slot="label">{name}</Text>
            <Text slot="description">{message}</Text>
          </ListItem>
        ))}
      </List>
      <List
        {...args}
        aria-label="Contacts to invite"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        {contacts.map(([name, message, initial]) => (
          <ListItem key={name} id={name} textValue={name}>
            <Avatar initial={initial} />
            <Text slot="label">{name}</Text>
            <Text slot="description">{message}</Text>
            <Checkbox slot="trailing" />
          </ListItem>
        ))}
      </List>
    </div>
  )
}

/** A multi-select list: a checkbox in each item, leading or trailing, shows and toggles its selection. */
export const MultiSelect: Story = {
  render: (args) => <MultiSelectLists {...args} />,
  args: { variant: 'segmented' },
}

/** Settings with a switch in each item's trailing slot, each a control of its own. */
function Settings(args: ListProps) {
  const [on, setOn] = useState<Record<string, boolean>>({ 'Wi-Fi': true })
  return (
    <List {...args} aria-label="Settings" variant="segmented">
      {(
        [
          ['wifi', 'Wi-Fi', 'Home network'],
          ['bluetooth', 'Bluetooth', 'Available devices'],
          ['airplanemode_active', 'Airplane mode', 'Off'],
        ] as const
      ).map(([icon, label, description]) => (
        <ListItem key={label} id={label} textValue={label}>
          <Icon slot="leading" name={icon} />
          <Text slot="label">{label}</Text>
          <Text slot="description">{description}</Text>
          <Switch
            slot="trailing"
            aria-label={label}
            isSelected={on[label] ?? false}
            onChange={(isSelected) => setOn({ ...on, [label]: isSelected })}
          />
        </ListItem>
      ))}
    </List>
  )
}

export const Switches: Story = {
  render: (args) => <Settings {...args} />,
}

/** Disabled items, and a disabled selected one. */
export const Disabled: Story = {
  args: {
    'aria-label': 'Contacts',
    variant: 'segmented',
    selectionMode: 'single',
    defaultSelectedKeys: ['Jennifer Lopez'],
    disabledKeys: ['Jennifer Lopez', 'Sandra Adams'],
  },
}

/** A non-interactive list: nothing is selected or acted on, and a pointer draws no state or ripple. */
export const NonInteractive: Story = {
  args: {
    'aria-label': 'Details',
    children: (
      [
        ['Size', '2.4 MB'],
        ['Modified', 'Nov 6, 2026'],
        ['Owner', 'Ali Connors'],
      ] as const
    ).map(([label, value]) => (
      <ListItem key={label} id={label} textValue={label}>
        <Text slot="label">{label}</Text>
        <Text slot="trailing">{value}</Text>
      </ListItem>
    )),
  },
}

/** A list that reorders its items by drag and drop, with this package's `useDragAndDrop`: a drag handle in each item. */
function Reorderable(props: Pick<ListProps, 'variant' | 'hasDivider'>) {
  const list = useListData({
    initialItems: contacts.map(([name, message]) => ({ id: name, name, message })),
  })
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': list.getItem(key)!.name })),
    onReorder(e) {
      if (e.target.dropPosition === 'before') list.moveBefore(e.target.key, e.keys)
      else if (e.target.dropPosition === 'after') list.moveAfter(e.target.key, e.keys)
    },
  })
  return (
    <List
      aria-label="Favorites"
      variant="segmented"
      className="w-90"
      {...props}
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}
    >
      {(item) => (
        <ListItem textValue={item.name}>
          <Text slot="label">{item.name}</Text>
          <Text slot="description">{item.message}</Text>
        </ListItem>
      )}
    </List>
  )
}

export const DragAndDrop: Story = {
  render: ({ variant, hasDivider }) => <Reorderable variant={variant} hasDivider={hasDivider} />,
}

/** What a list shows while it has no items. */
export const Empty: Story = {
  args: {
    'aria-label': 'Results',
    children: [],
    renderEmptyState: () => (
      <Text className="block px-space-200 py-space-150 text-body-lg text-on-surface-variant">
        No results
      </Text>
    ),
  },
}

/** Each step of density takes 2dp off an item's top and bottom. */
export const Density: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-space-600">
      {['', 'density-1', 'density-2', 'density-3'].map((density) => (
        <div key={density} className={density}>
          <List {...args} aria-label={`Contacts, ${density || 'density-0'}`} />
        </div>
      ))}
    </div>
  ),
  args: { variant: 'segmented' },
}
