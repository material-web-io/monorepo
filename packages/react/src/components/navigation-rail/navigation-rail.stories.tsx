import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { composeRenderProps, Text } from 'react-aria-components'
import { Button } from '../button'
import { Fab } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
  NavigationRailSection,
  type NavigationRailProps,
} from '.'

const meta = {
  title: 'Components/NavigationRail',
  component: NavigationRail,
  subcomponents: { NavigationRailHeader, NavigationRailItem, NavigationRailSection },
  parameters: { layout: 'fullscreen' },
  args: { isExpanded: false, isHiddenOnCollapse: false, arrangement: 'top', 'aria-label': 'Main' },
  // Every prop the rail takes: the docgen reads none of them from the imported types. Its
  // event handlers are left out.
  argTypes: {
    isExpanded: { control: 'boolean', table: { category: 'M3' } },
    isHiddenOnCollapse: { control: 'boolean', table: { category: 'M3' } },
    arrangement: { control: 'inline-radio', options: ['top', 'center'], table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    // React Aria's Toolbar, always vertical
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof NavigationRail>

export default meta
type Story = StoryObj<typeof meta>

const destinations = [
  ['Alarm', 'alarm'],
  ['Clock', 'schedule'],
  ['Timer', 'hourglass_empty'],
  ['Stopwatch', 'timer'],
] as const

const Page = ({ children }: { children?: ReactNode }) => (
  <div className="m-space-200 min-w-0 flex-1 rounded-shape-xl bg-primary-container p-space-300 text-title-lg text-on-primary-container">
    {children ?? '10 minutes'}
  </div>
)

/** The items of a rail that keeps which of its destinations is selected, the third at the start. */
function Items({ items = destinations }: { items?: readonly (readonly [string, string])[] }) {
  const [selected, setSelected] = useState(items[2]?.[0] ?? items[0]?.[0])
  return items.map(([name, icon]) => (
    <NavigationRailItem
      key={name}
      isSelected={name === selected}
      onChange={() => setSelected(name)}
    >
      <Icon name={icon} />
      <Text slot="label">{name}</Text>
    </NavigationRailItem>
  ))
}

/** Whether a rail is expanded, as a story keeps it: the control in the toolbar turns it too. */
function useExpanded(initially = false) {
  const [expanded, setExpanded] = useState(initially)
  const [was, setWas] = useState(initially)
  if (was !== initially) {
    setWas(initially)
    setExpanded(initially)
  }
  return [expanded, setExpanded] as const
}

/** A rail that keeps whether it is expanded, unless `onTurn` says what does: its menu button turns it, and its FAB extends with it. */
function Rail({
  isExpanded: given = false,
  onTurn,
  menu = true,
  fab = true,
  children,
  ...props
}: NavigationRailProps & {
  menu?: boolean
  fab?: boolean
  onTurn?: (expanded: boolean) => void
}) {
  const [own, setOwn] = useExpanded(given)
  const expanded = onTurn ? given : own
  const turn = onTurn ?? setOwn
  const header = (menu || fab) && (
    <NavigationRailHeader>
      {menu && (
        <IconButton
          aria-label={expanded ? 'Collapse' : 'Expand'}
          aria-expanded={expanded}
          onPress={() => turn(!expanded)}
        >
          <Icon name={expanded ? 'menu_open' : 'menu'} className="rtl:icon-mirrored" />
        </IconButton>
      )}
      {fab && (
        <Fab isExtended={expanded} aria-label="Add timer">
          <Icon name="hourglass_top" className="icon-filled" />
          <Text slot="label">Add timer</Text>
        </Fab>
      )}
    </NavigationRailHeader>
  )
  return (
    <NavigationRail aria-label="Main" {...props} isExpanded={expanded}>
      {composeRenderProps(children, (children) => (
        <>
          {header}
          {children ?? <Items />}
        </>
      ))}
    </NavigationRail>
  )
}

/** Click the menu button and the rail expands beside the page: the items turn, each indicator around its icon and label, and the FAB extends. Click an item, or move to it with Tab and the arrow keys and press Space or Enter, to select it. */
export const Playground: Story = {
  render: (args) => (
    <div className="flex h-dvh">
      <Rail {...args} />
      <Page />
    </div>
  ),
}

/** An expanded rail shows its secondary destinations, grouped under section headers, which a collapsed one does not. */
export const Sections: Story = {
  args: { isExpanded: true },
  render: (args) => (
    <div className="flex h-dvh">
      <Rail {...args}>
        <Items />
        <NavigationRailSection aria-label="More">
          <NavigationRailItem>
            <Icon name="bed" />
            <Text slot="label">Bedtime</Text>
          </NavigationRailItem>
        </NavigationRailSection>
        <NavigationRailSection aria-labelledby="sleep-well">
          <Text slot="header" id="sleep-well">
            Sleep well
          </Text>
          <NavigationRailItem>
            <Icon name="music_note" />
            <Text slot="label">Sounds</Text>
          </NavigationRailItem>
          <NavigationRailItem>
            <Icon name="self_improvement" />
            <Text slot="label">Wind down</Text>
          </NavigationRailItem>
        </NavigationRailSection>
      </Rail>
      <Page />
    </div>
  ),
}

const layouts = [
  [false, false],
  [true, false],
  [false, true],
  [true, true],
] as const

/** The four common layouts in a row, turned together: by the button over them, which the two with no menu button need, or by a menu button of their own. */
function LayoutRow({ isExpanded: initially = false, ...props }: NavigationRailProps) {
  const [expanded, setExpanded] = useExpanded(initially)
  return (
    <div className="flex flex-col items-start gap-space-200">
      <Button variant="tonal" onPress={() => setExpanded(!expanded)}>
        {expanded ? 'Collapse' : 'Expand'}
      </Button>
      <div className="flex h-[480px] gap-space-300">
        {layouts.map(([menu, fab]) => (
          <Rail
            key={`${menu}${fab}`}
            {...props}
            isExpanded={expanded}
            onTurn={setExpanded}
            menu={menu}
            fab={fab}
            className="bg-surface-container"
          >
            <Items items={destinations.slice(0, 3)} />
          </Rail>
        ))}
      </div>
    </div>
  )
}

/** The four common layouts, collapsed and expanded: the items alone, under a menu button, under a FAB, and under both. The button over a row, or a menu button in it, turns its four rails together. */
export const Layouts: Story = {
  parameters: { layout: 'padded' },
  render: ({ isExpanded = false, ...args }) => (
    <div className="flex flex-col gap-space-300">
      <LayoutRow {...args} isExpanded={isExpanded} />
      <LayoutRow {...args} isExpanded={!isExpanded} />
    </div>
  ),
}

/** An immersive page that takes the whole window: its menu button is where the rail's own will be, and each takes the keyboard focus from the other. */
function Immersive({ isExpanded: initially = false, ...props }: NavigationRailProps) {
  const [expanded, setExpanded] = useExpanded(initially)
  const expandRef = useRef<HTMLButtonElement>(null)
  const collapseRef = useRef<HTMLButtonElement>(null)
  const turn = (next: boolean) => {
    flushSync(() => setExpanded(next))
    ;(next ? collapseRef : expandRef).current?.focus()
  }
  return (
    <div className="flex h-dvh">
      <NavigationRail aria-label="Main" {...props} isExpanded={expanded}>
        <NavigationRailHeader>
          <IconButton
            ref={collapseRef}
            aria-label="Hide navigation"
            aria-expanded
            onPress={() => turn(false)}
          >
            <Icon name="menu_open" className="rtl:icon-mirrored" />
          </IconButton>
          <Fab isExtended aria-label="Add timer">
            <Icon name="hourglass_top" className="icon-filled" />
            <Text slot="label">Add timer</Text>
          </Fab>
        </NavigationRailHeader>
        <Items items={destinations.slice(0, 3)} />
      </NavigationRail>
      <div className="relative flex min-w-0 flex-1 items-center justify-center rounded-ss-shape-xl bg-primary-container text-display-lg text-on-primary-container">
        {!expanded && (
          <IconButton
            ref={expandRef}
            aria-label="Show navigation"
            aria-expanded={false}
            className="absolute start-7 top-13"
            onPress={() => turn(true)}
          >
            <Icon name="menu" />
          </IconButton>
        )}
        8:30
      </div>
    </div>
  )
}

/** The guidelines' immersive example: the expanded rail is hidden until the page's menu button is selected, and then comes in from the window's edge beside the page, which makes room for it. The rail's own menu button hides it again. */
export const HideOnCollapse: Story = {
  args: { isHiddenOnCollapse: true },
  render: (args) => <Immersive {...args} />,
}

/** Centered, the items are in the middle of the rail, and the menu button and FAB still at its top. */
export const Center: Story = {
  args: { arrangement: 'center' },
  render: (args) => (
    <div className="flex h-dvh">
      <Rail {...args} />
      <Page />
    </div>
  ),
}

/** A rail on the page's own surface, with a divider at the edge next to the content: classes of yours on the rail. */
export const Divider: Story = {
  render: (args) => (
    <div className="flex h-dvh">
      <Rail {...args} className="border-e border-outline-variant" />
      <Page />
    </div>
  ),
}

/** A disabled destination, which takes no pointer or focus: its icon and label at 38%, over its indicator when it is the selected one. */
export const Disabled: Story = {
  render: (args) => (
    <div className="flex h-dvh">
      <Rail {...args} fab={false}>
        {destinations.map(([name, icon], index) => (
          <NavigationRailItem key={name} isSelected={index === 0} isDisabled={index % 2 === 0}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationRailItem>
        ))}
      </Rail>
      <Page />
    </div>
  ),
}

/** Items given their children as a function, which keep which of them is selected. */
function MarkedItems() {
  const [selected, setSelected] = useState('Saved')
  return (['Explore', 'Saved', 'Updates'] as const).map((name) => (
    <NavigationRailItem
      key={name}
      isSelected={name === selected}
      onChange={() => setSelected(name)}
    >
      {({ isSelected }) => (
        <>
          <Icon name={isSelected ? 'check_circle' : 'circle'} />
          <Text slot="label">{name}</Text>
        </>
      )}
    </NavigationRailItem>
  ))
}

/** Children as a function of the item's state, here to draw another glyph when it is selected. */
export const FunctionChildren: Story = {
  render: (args) => (
    <div className="flex h-dvh">
      <Rail {...args} fab={false}>
        <MarkedItems />
      </Rail>
      <Page />
    </div>
  ),
}
