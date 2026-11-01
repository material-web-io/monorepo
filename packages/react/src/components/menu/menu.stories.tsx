import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import {
  Header,
  Keyboard,
  MenuSection,
  MenuTrigger,
  Separator,
  SubmenuTrigger,
  Text,
  type Key,
  type Selection,
} from 'react-aria-components'
import { twMerge } from '../../lib/tv'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { Menu, MenuItem, MenuPopover, type MenuPopoverProps, type MenuProps } from '.'

const meta = {
  title: 'Components/Menu',
  component: Menu,
  subcomponents: { MenuPopover, MenuItem },
  parameters: { layout: 'centered' },
  args: {
    color: 'standard',
    children: [
      <MenuItem key="preview" textValue="Preview">
        <Icon slot="leading" name="visibility" />
        Preview
      </MenuItem>,
      <MenuItem key="share" textValue="Share">
        <Icon slot="leading" name="person_add" />
        Share
      </MenuItem>,
      <MenuItem key="link" textValue="Get link">
        <Icon slot="leading" name="link" />
        Get link
      </MenuItem>,
      <Separator key="separator" />,
      <MenuItem key="remove" textValue="Remove">
        <Icon slot="leading" name="delete" />
        Remove
      </MenuItem>,
      <MenuItem key="download" textValue="Download">
        <Icon slot="leading" name="download" />
        Download
      </MenuItem>,
    ],
  },
  // Every prop of the Menu, its own and React Aria's, but its event handlers: the docgen reads
  // none of them from the imported types.
  argTypes: {
    color: { control: 'inline-radio', options: ['standard', 'vibrant'], table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    items: { control: false, table: { category: 'Parts' } },
    dependencies: { control: false, table: { category: 'Parts' } },
    renderEmptyState: { control: false, table: { category: 'Parts' } },
    selectionMode: {
      control: 'inline-radio',
      options: ['none', 'single', 'multiple'],
      table: { category: 'Selection' },
    },
    selectedKeys: { control: 'object', table: { category: 'Selection' } },
    defaultSelectedKeys: { control: 'object', table: { category: 'Selection' } },
    disabledKeys: { control: 'object', table: { category: 'Selection' } },
    disallowEmptySelection: { control: 'boolean', table: { category: 'Selection' } },
    escapeKeyBehavior: {
      control: 'inline-radio',
      options: ['clearSelection', 'none'],
      table: { category: 'Selection' },
    },
    shouldFocusWrap: { control: 'boolean', table: { category: 'Behavior' } },
    shouldCloseOnSelect: { control: 'boolean', table: { category: 'Behavior' } },
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
    suppressHydrationWarning: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
  // The args are the Menu's, the list of items, which a MenuTrigger opens in a MenuPopover.
  render: (args) => (
    <MenuTrigger>
      <IconButton aria-label="More options">
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover>
        <Menu {...args} />
      </MenuPopover>
    </MenuTrigger>
  ),
} satisfies Meta<typeof Menu>

export default meta
type Story = StoryObj<typeof meta>

/** The panel of the stories that compose their own menu, its items the default `children`'s: `args` go on its `Menu`, `props` on its `MenuPopover`. */
const items = (args: MenuProps, props: Partial<MenuPopoverProps> = {}) => (
  <MenuPopover {...props}>
    <Menu {...args}>
      <MenuItem textValue="Preview">
        <Icon slot="leading" name="visibility" />
        Preview
      </MenuItem>
      <MenuItem textValue="Share">
        <Icon slot="leading" name="person_add" />
        Share
      </MenuItem>
      <MenuItem textValue="Get link">
        <Icon slot="leading" name="link" />
        Get link
      </MenuItem>
      <Separator />
      <MenuItem textValue="Remove">
        <Icon slot="leading" name="delete" />
        Remove
      </MenuItem>
    </Menu>
  </MenuPopover>
)

/** The one key a single-select menu's `onSelectionChange` is called with, or none. */
const only = (keys: Selection): Key | undefined => (keys === 'all' ? undefined : [...keys][0])

/**
 * Opens the menu from its trigger, as a click does, for a story that shows it
 * open. Whether it is open is the menu's own state, as with any React Aria
 * menu: Escape, a selection or a click outside close it.
 */
const open =
  (name = 'More options'): Story['play'] =>
  async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name }))
  }

/**
 * A menu is composed as React Aria's is: React Aria's `MenuTrigger` holds the element that opens
 * it, here an `IconButton`, first, as it is, then the `MenuPopover`, the panel, with the `Menu` in
 * it, the list of its `MenuItem`s. Click the icon button to open it, and anywhere outside it, or
 * Escape, to close it.
 */
export const Playground: Story = {}

/**
 * The menu opens below its trigger, growing out of its top edge while its rows spread
 * apart, and the trigger keeps a pressed state layer while it is open. The arrow keys move
 * through the items, Enter or Space selects one, and Escape closes it again.
 */
export const Open: Story = {
  play: open(),
  // One menu is open at a time, so only this story opens on the docs page.
  parameters: { docs: { story: { autoplay: true } } },
}

/** Standard, on surface-container-low, is the lower-emphasis style; vibrant, on tertiary-container, the higher: `color` on the `Menu`. */
export const Colors: Story = {
  render: (args) => (
    <div className="flex gap-space-600">
      <MenuTrigger>
        <Button variant="tonal">Standard</Button>
        {items({ ...args, color: 'standard' })}
      </MenuTrigger>
      <MenuTrigger>
        <Button variant="tonal">Vibrant</Button>
        {items({ ...args, color: 'vibrant' })}
      </MenuTrigger>
    </div>
  ),
}

/**
 * The anatomy: an item's children are its label, which names it, but for its parts, each given
 * its slot. An `Icon` in the `leading` slot is its leading icon, 20dp, before the label; React
 * Aria's `Text` in the `description` slot is its supporting text, under the label, which describes
 * it; and at the item's end are React Aria's `Keyboard` for a keyboard command, which needs no
 * slot, and in the `trailing` slot a badge of yours or a trailing `Icon`. An item that holds more
 * than its text takes a `textValue`, the text typing finds it by, which its types then require.
 */
export const Anatomy: Story = {
  render: (args) => (
    <MenuTrigger>
      <IconButton aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <MenuPopover>
        <Menu {...args}>
          <MenuItem textValue="Undo">
            <Icon slot="leading" name="undo" className="rtl:icon-mirrored" />
            Undo
            <Keyboard>⌘Z</Keyboard>
          </MenuItem>
          <MenuItem textValue="Redo" isDisabled>
            <Icon slot="leading" name="redo" className="rtl:icon-mirrored" />
            Redo
            <Keyboard>⇧⌘Z</Keyboard>
          </MenuItem>
          <Separator />
          <MenuItem textValue="Cut">
            <Icon slot="leading" name="content_cut" />
            Cut
            <Keyboard>⌘X</Keyboard>
          </MenuItem>
          <MenuItem textValue="Copy">
            <Icon slot="leading" name="content_copy" />
            Copy
            <Text slot="description">Copies the selection</Text>
            <Keyboard>⌘C</Keyboard>
          </MenuItem>
          <MenuItem textValue="Paste">
            <Icon slot="leading" name="content_paste" />
            Paste
            <span
              slot="trailing"
              className="rounded-shape-sm bg-primary-container px-space-50 text-label-sm text-on-primary-container"
            >
              New
            </span>
          </MenuItem>
          <MenuItem textValue="Save to cloud">
            <Icon slot="leading" name="cloud" />
            Save to cloud
            <Icon slot="trailing" name="arrow_right" className="rtl:icon-mirrored" />
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  ),
  play: open('Edit'),
}

/** The rows of the two sections of the Sections story, the same in both of its menus. */
const styleRows = (
  <>
    <Header>Style</Header>
    <MenuItem textValue="Bold">
      <Icon slot="leading" name="format_bold" />
      Bold
    </MenuItem>
    <MenuItem textValue="Italic">
      <Icon slot="leading" name="format_italic" />
      Italic
    </MenuItem>
  </>
)

const alignmentRows = (
  <>
    <Header>Alignment</Header>
    <MenuItem textValue="Left">
      <Icon slot="leading" name="format_align_left" />
      Left
    </MenuItem>
    <MenuItem textValue="Center">
      <Icon slot="leading" name="format_align_center" />
      Center
    </MenuItem>
  </>
)

// A trigger as wide as the panel under it, so that an open panel stands clear of the other trigger.
const column = 'w-28'

/**
 * Items are grouped in React Aria's `MenuSection`, named by its `Header`, and the sections are
 * parted in one of the two ways the spec gives vertical menus, neither of which takes the
 * focus. A divider, React Aria's `Separator`, is the one the spec gives menus on the web. A gap
 * makes each `MenuSection` a panel of its own, 2dp from the next, with the panel's 16dp
 * corners at the outer ends and 8dp ones toward the gap, as the guideline diagrams draw it:
 * the `MenuPopover` gives up its shadow and corners, and the `Menu` in it, which fills it, its
 * surface and padding, to its sections, which it lays out with the gap; the `overflow` the
 * panel has for clipping and the list for scrolling would clip their shadows, so both are made
 * visible, as the spec says not to use gaps in a menu that scrolls.
 * The spec also notes gaps are not currently available on web.
 *
 * One menu is open at a time: the story opens the first, and a click outside closes it
 * before the other's trigger can open its own.
 */
export const Sections: Story = {
  render: (args) => {
    const surface = args.color === 'vibrant' ? 'bg-tertiary-container' : 'bg-surface-container-low'
    const group = twMerge(surface, 'rounded-shape-lg px-space-50 py-space-25 shadow-elevation-2')
    return (
      <div className="flex gap-space-600">
        <MenuTrigger>
          <Button variant="tonal" className={column}>
            Divider
          </Button>
          <MenuPopover>
            <Menu {...args}>
              <MenuSection>{styleRows}</MenuSection>
              <Separator />
              <MenuSection>{alignmentRows}</MenuSection>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
        <MenuTrigger>
          <Button variant="tonal" className={column}>
            Gap
          </Button>
          <MenuPopover className="overflow-visible! rounded-none shadow-none">
            <Menu {...args} className="gap-space-25 overflow-visible! bg-transparent p-0">
              <MenuSection className={twMerge(group, 'rounded-b-shape-sm')}>
                {styleRows}
              </MenuSection>
              <MenuSection className={twMerge(group, 'rounded-t-shape-sm')}>
                {alignmentRows}
              </MenuSection>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </div>
    )
  },
  play: open('Divider'),
}

const spacings = ['Single', '1.15', 'Double'] as const

/**
 * React Aria's `SubmenuTrigger` makes an item open a submenu: the `MenuItem` first, then a
 * `MenuPopover` with the submenu's `Menu`, which may hold submenus of its own and takes its menu's
 * `color` unless given its own. The item ends with an arrow and opens its submenu beside itself:
 * when the pointer rests on it, on a click, and with Space, Enter or the arrow key toward it, which
 * also moves into it; the arrow key back, or Escape, closes it again, and selecting one of its
 * items closes the whole menu. The menu the pointer or the keyboard is in has the rounder corners,
 * and the item whose submenu is open keeps its state layer. A submenu selects its own items: here
 * the line spacing, one of three.
 */
export const Submenus: Story = {
  render: function Submenus(args) {
    const [spacing, setSpacing] = useState<Key>('1.15')
    return (
      <MenuTrigger>
        <Button variant="tonal">Format</Button>
        <MenuPopover>
          <Menu {...args}>
            <SubmenuTrigger>
              <MenuItem textValue="Text">
                <Icon slot="leading" name="format_bold" />
                Text
              </MenuItem>
              <MenuPopover>
                <Menu>
                  <MenuItem textValue="Bold">
                    Bold
                    <Keyboard>⌘B</Keyboard>
                  </MenuItem>
                  <MenuItem textValue="Italic">
                    Italic
                    <Keyboard>⌘I</Keyboard>
                  </MenuItem>
                  <MenuItem textValue="Underline">
                    Underline
                    <Keyboard>⌘U</Keyboard>
                  </MenuItem>
                </Menu>
              </MenuPopover>
            </SubmenuTrigger>
            <SubmenuTrigger>
              <MenuItem textValue="Align & indent">
                <Icon slot="leading" name="format_indent_increase" />
                Align & indent
              </MenuItem>
              <MenuPopover>
                <Menu>
                  <MenuItem>Left</MenuItem>
                  <MenuItem>Center</MenuItem>
                  <MenuItem>Right</MenuItem>
                </Menu>
              </MenuPopover>
            </SubmenuTrigger>
            <SubmenuTrigger>
              <MenuItem textValue="Line & paragraph spacing">
                <Icon slot="leading" name="format_line_spacing" />
                Line & paragraph spacing
              </MenuItem>
              <MenuPopover>
                <Menu
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={[spacing]}
                  onSelectionChange={(keys) => setSpacing(only(keys) ?? spacing)}
                >
                  <MenuSection>
                    {spacings.map((option) => (
                      <MenuItem key={option} id={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </MenuSection>
                  <Separator />
                  <MenuSection selectionMode="none">
                    <SubmenuTrigger>
                      <MenuItem>Add space before paragraph</MenuItem>
                      <MenuPopover>
                        <Menu>
                          <MenuItem>Small</MenuItem>
                          <MenuItem>Medium</MenuItem>
                          <MenuItem>Large</MenuItem>
                        </Menu>
                      </MenuPopover>
                    </SubmenuTrigger>
                    <SubmenuTrigger>
                      <MenuItem isDisabled>Add space after paragraph</MenuItem>
                      <MenuPopover>
                        <Menu>
                          <MenuItem>Small</MenuItem>
                        </Menu>
                      </MenuPopover>
                    </SubmenuTrigger>
                  </MenuSection>
                  <Separator />
                  <MenuSection selectionMode="none">
                    <MenuItem textValue="Custom spacing…">
                      Custom spacing…
                      <Keyboard>⌘/</Keyboard>
                    </MenuItem>
                  </MenuSection>
                </Menu>
              </MenuPopover>
            </SubmenuTrigger>
            <Separator />
            <MenuItem textValue="Clear formatting">
              <Icon slot="leading" name="format_clear" />
              Clear formatting
            </MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    )
  },
  // Opened, and its third item's submenu entered, as the keyboard does it.
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Format' }))
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowRight}')
  },
}

const sortings = ['Name', 'Date modified', 'Size'] as const

/**
 * A single-select menu, `selectionMode="single"` on the `Menu` with its `selectedKeys`:
 * the selected item, by its `id`, changes shape and color and, as the spec recommends, carries
 * a checkmark. A click or Enter on another item moves the selection to it and closes the menu;
 * Space moves it and leaves the menu open, as React Aria has it. `disallowEmptySelection` keeps
 * a click on the selected item from clearing it.
 */
export const SingleSelect: Story = {
  render: function SingleSelect(args) {
    const [sorting, setSorting] = useState<Key>('Name')
    return (
      <MenuTrigger>
        <Button variant="outlined">
          <Icon name="sort" />
          {`Sort by ${String(sorting).toLowerCase()}`}
        </Button>
        <MenuPopover>
          <Menu
            {...args}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[sorting]}
            onSelectionChange={(keys) => setSorting(only(keys) ?? sorting)}
          >
            {sortings.map((option) => (
              <MenuItem key={option} id={option}>
                {option}
              </MenuItem>
            ))}
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    )
  },
  play: open('Sort by name'),
}

const diets = ['Gluten-free', 'Kosher', 'Nut-free', 'Vegan', 'Vegetarian'] as const

/**
 * A multi-select menu, `selectionMode="multiple"` on the `Menu`, stays open while its items are
 * clicked, and selects with Space, as React Aria has it; Enter selects and closes it.
 */
export const MultiSelect: Story = {
  render: function MultiSelect(args) {
    const [chosen, setChosen] = useState<Selection>(new Set(['Nut-free']))
    const names = chosen === 'all' ? [...diets] : diets.filter((diet) => chosen.has(diet))
    return (
      <MenuTrigger>
        <Button variant="outlined">{names.length ? names.join(', ') : 'Diet'}</Button>
        <MenuPopover>
          <Menu
            {...args}
            selectionMode="multiple"
            selectedKeys={chosen}
            onSelectionChange={setChosen}
          >
            {diets.map((diet) => (
              <MenuItem key={diet} id={diet}>
                {diet}
              </MenuItem>
            ))}
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    )
  },
  play: open('Nut-free'),
}

/** A disabled item, `isDisabled`, is skipped by the keyboard and ignores clicks, `aria-disabled` rather than disabled outright, as React Aria's menu items are. */
export const DisabledItem: Story = {
  args: {
    children: [
      <MenuItem key="undo" textValue="Undo">
        <Icon slot="leading" name="undo" className="rtl:icon-mirrored" />
        Undo
      </MenuItem>,
      <MenuItem key="redo" textValue="Redo" isDisabled>
        <Icon slot="leading" name="redo" className="rtl:icon-mirrored" />
        Redo
      </MenuItem>,
      <MenuItem key="cut" textValue="Cut">
        <Icon slot="leading" name="content_cut" />
        Cut
      </MenuItem>,
    ],
  },
  render: (args) => (
    <MenuTrigger>
      <IconButton aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <MenuPopover>
        <Menu {...args} />
      </MenuPopover>
    </MenuTrigger>
  ),
  play: open('Edit'),
}

const placements = ['bottom start', 'bottom end', 'top start', 'end top', 'start top'] as const

/**
 * `placement` on the `MenuPopover` is the side of the trigger it opens to and its alignment,
 * `bottom start` unless given, with React Aria's other placements. The panel grows out of the
 * edge it is placed at, and turns to the other side when there is no room where it was asked
 * for (`shouldFlip`). It keeps 8dp from the window's edges (`containerPadding`).
 */
export const Placement: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-600 p-space-600">
      {placements.map((placement) => (
        <MenuTrigger key={placement}>
          <Button variant="tonal">{placement}</Button>
          {items(args, { placement })}
        </MenuTrigger>
      ))}
    </div>
  ),
}

/** A menu opens from any button: here a `Button`, which keeps the pressed state layer while the menu is open. */
export const FromButton: Story = {
  render: (args) => (
    <MenuTrigger>
      <Button variant="tonal">
        <Icon name="more_horiz" />
        Options
      </Button>
      {items(args)}
    </MenuTrigger>
  ),
}

/** `shouldSkipAnimation` on the `MenuPopover` opens and closes the menu instantly, for dense products such as on desktop. */
export const Instant: Story = {
  render: (args) => (
    <MenuTrigger>
      <IconButton aria-label="More options">
        <Icon name="more_vert" />
      </IconButton>
      {items(args, { shouldSkipAnimation: true })}
    </MenuTrigger>
  ),
}

const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
] as const

/**
 * When its items do not fit below its trigger, the panel opens on the side with more room,
 * takes the room there is up to 8dp from the window's edge and scrolls, with a persistent
 * scrollbar, as the spec has it. Each item's trailing text is a `<span>` of the story's own, in
 * the color it gives it. On a real emulated 320x568 screen - the `viewport` global below.
 */
export const Scrollable: Story = {
  render: (args) => (
    <MenuTrigger>
      <Button variant="outlined">State</Button>
      <MenuPopover>
        <Menu {...args}>
          {states.map((state) => (
            <MenuItem key={state} textValue={state}>
              {state}
              <span
                slot="trailing"
                className={args.color === 'vibrant' ? undefined : 'text-on-surface-variant'}
              >
                {state.slice(0, 2).toUpperCase()}
              </span>
            </MenuItem>
          ))}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  ),
  globals: { viewport: 'iphone14' },
  play: open('State'),
}

/**
 * A select menu that scrolls opens on its selected item: React Aria gives it the focus as the
 * menu opens and scrolls it into view, the first of them if several are selected.
 */
export const ScrollableSelect: Story = {
  render: function ScrollableSelect(args) {
    const [chosen, setChosen] = useState<Key>('Hawaii')
    return (
      <MenuTrigger>
        <Button variant="outlined">{String(chosen)}</Button>
        <MenuPopover>
          <Menu
            {...args}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[chosen]}
            onSelectionChange={(keys) => setChosen(only(keys) ?? chosen)}
          >
            {states.map((state) => (
              <MenuItem key={state} id={state}>
                {state}
              </MenuItem>
            ))}
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    )
  },
  globals: { viewport: 'iphone14' },
  play: open('Hawaii'),
}

/**
 * Density, `density-1` to `density-3` on an ancestor, takes 4dp a level off each item's
 * height. The panel is portaled to the body, so here it is on the document itself.
 */
export const Density: Story = {
  render: function Density(args) {
    useEffect(() => {
      document.documentElement.classList.add('density-2')
      return () => document.documentElement.classList.remove('density-2')
    }, [])
    return (
      <MenuTrigger>
        <IconButton aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
        {items(args)}
      </MenuTrigger>
    )
  },
  play: open(),
}
