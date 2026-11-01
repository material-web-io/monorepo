import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import type { Key } from 'react-aria-components'
import { Icon } from '../icon'
import { Tab, TabList, TabPanel, Tabs, type TabsProps } from '.'

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabPanel },
  parameters: { layout: 'padded' },
  args: {
    variant: 'primary',
    orientation: 'horizontal',
    keyboardActivation: 'manual',
    isDisabled: false,
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary'],
      table: { category: 'M3' },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { category: 'M3' },
    },
    keyboardActivation: {
      control: 'inline-radio',
      options: ['manual', 'automatic'],
      table: { category: 'Behavior' },
    },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const panel = 'px-space-200 py-space-300 text-body-md text-on-surface'

const destinations = [
  ['Flights', 'flight', 'Flights are listed here.'],
  ['Trips', 'luggage', 'Trips are listed here.'],
  ['Explore', 'explore', 'Places to explore are listed here.'],
] as const

/** Three fixed primary tabs, each a label, dividing the row equally: click one, or focus one and press Space or Enter, and the indicator slides to it. A tab and its panel share an `id`. */
export const Playground: Story = {
  render: (args) => (
    <Tabs {...args} className="w-120">
      <TabList>
        {destinations.map(([name]) => (
          <Tab key={name} id={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      {destinations.map(([name, , text]) => (
        <TabPanel key={name} id={name} className={panel}>
          {text}
        </TabPanel>
      ))}
    </Tabs>
  ),
}

/** Secondary tabs: the label in on-surface and a 2dp indicator across the whole tab. They go below primary tabs, to divide one destination's content further. */
export const Secondary: Story = {
  args: { variant: 'secondary' },
  render: (args) => (
    <Tabs {...args} className="w-120">
      <TabList>
        <Tab id="overview">Overview</Tab>
        <Tab id="specifications">Specifications</Tab>
      </TabList>
      <TabPanel id="overview" className={panel}>
        An overview of the product.
      </TabPanel>
      <TabPanel id="specifications" className={panel}>
        Every specification of the product.
      </TabPanel>
    </Tabs>
  ),
}

/** The label is the tab's text: in a tab too narrow for it, it wraps, and the row grows to hold it. To let it wrap once and then cut it, as the guidelines allow, put it in an element of your own with `line-clamp-2`, as the second row does. */
export const LongLabels: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-600">
      <Tabs {...args} className="w-80">
        <TabList>
          <Tab id="flights">Flights</Tab>
          <Tab id="trips">Trips and itineraries you have planned</Tab>
          <Tab id="explore">Explore</Tab>
        </TabList>
        <TabPanel id="flights" className={panel}>
          Flights are listed here.
        </TabPanel>
        <TabPanel id="trips" className={panel}>
          Trips are listed here.
        </TabPanel>
        <TabPanel id="explore" className={panel}>
          Places to explore are listed here.
        </TabPanel>
      </Tabs>
      <Tabs {...args} className="w-80">
        <TabList>
          <Tab id="flights">
            <span className="line-clamp-2">Flights</span>
          </Tab>
          <Tab id="trips">
            <span className="line-clamp-2">Trips and itineraries you have planned</span>
          </Tab>
          <Tab id="explore">
            <span className="line-clamp-2">Explore</span>
          </Tab>
        </TabList>
        <TabPanel id="flights" className={panel}>
          Flights are listed here.
        </TabPanel>
        <TabPanel id="trips" className={panel}>
          Trips are listed here.
        </TabPanel>
        <TabPanel id="explore" className={panel}>
          Places to explore are listed here.
        </TabPanel>
      </Tabs>
    </div>
  ),
}

/** A tab draws its children as written: an `Icon` among them is its icon, which a primary tab stacks over the label in a 64dp row and a secondary tab puts before the label in the 48dp row. An icon alone needs an `aria-label`. */
export const WithIcons: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-600">
      <Tabs {...args} className="w-120">
        <TabList>
          {destinations.map(([name, icon]) => (
            <Tab key={name} id={name}>
              <Icon name={icon} />
              {name}
            </Tab>
          ))}
        </TabList>
        {destinations.map(([name, , text]) => (
          <TabPanel key={name} id={name} className={panel}>
            {text}
          </TabPanel>
        ))}
      </Tabs>
      <Tabs {...args} variant="secondary" className="w-120">
        <TabList>
          <Tab id="overview">
            <Icon name="summarize" />
            Overview
          </Tab>
          <Tab id="specifications">
            <Icon name="list_alt" />
            Specifications
          </Tab>
        </TabList>
        <TabPanel id="overview" className={panel}>
          An overview of the product.
        </TabPanel>
        <TabPanel id="specifications" className={panel}>
          Every specification of the product.
        </TabPanel>
      </Tabs>
      <Tabs {...args} className="w-60">
        <TabList>
          <Tab id="favorites" aria-label="Favorites">
            <Icon name="favorite" />
          </Tab>
          <Tab id="nearby" aria-label="Nearby">
            <Icon name="location_on" />
          </Tab>
        </TabList>
        <TabPanel id="favorites" className={panel}>
          Your favorites.
        </TabPanel>
        <TabPanel id="nearby" className={panel}>
          What is nearby.
        </TabPanel>
      </Tabs>
    </div>
  ),
}

const breeds = [
  'Akita',
  'Alaskan',
  'Australian Shepherd',
  'Azawakh',
  'Barbet',
  'Basenji',
  'Beagle',
  'Border Collie',
]

/** A scrollable list: each tab as wide as its label, the first 52dp from the start, and the list opens on the selected tab and scrolls to the one selected, centered; a tab the keyboard focuses is scrolled into view. Swipe or scroll it sideways, or move through it with the arrow keys. */
export const Scrollable: Story = {
  render: (args) => (
    <Tabs {...args} defaultSelectedKey="Alaskan" className="w-96">
      <TabList isScrollable>
        {breeds.map((breed) => (
          <Tab key={breed} id={breed}>
            {breed}
          </Tab>
        ))}
      </TabList>
      {breeds.map((breed) => (
        <TabPanel key={breed} id={breed} className={panel}>
          About the {breed}.
        </TabPanel>
      ))}
    </Tabs>
  ),
}

/** Vertical tabs: a column beside the panels, each tab as tall as its content and the column as wide as the widest, the divider and the indicator at its inline end. The up and down arrow keys move between the tabs. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <Tabs {...args} className="w-120">
      <TabList>
        {destinations.map(([name]) => (
          <Tab key={name} id={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      {destinations.map(([name, , text]) => (
        <TabPanel key={name} id={name} className={panel}>
          {text}
        </TabPanel>
      ))}
    </Tabs>
  ),
}

function Controlled(props: TabsProps) {
  const [key, setKey] = useState<Key>('Flights')
  return (
    <div className="flex flex-col gap-space-300">
      <Tabs {...props} selectedKey={key} onSelectionChange={setKey} className="w-120">
        <TabList>
          {destinations.map(([name]) => (
            <Tab key={name} id={name}>
              {name}
            </Tab>
          ))}
        </TabList>
        {destinations.map(([name, , text]) => (
          <TabPanel key={name} id={name} className={panel}>
            {text}
          </TabPanel>
        ))}
      </Tabs>
      <p className="text-body-md text-on-surface-variant">Selected: {String(key)}</p>
    </div>
  )
}

/** Controlled: `selectedKey` is the `id` of the selected tab and `onSelectionChange` reports the one selected, as React Aria's Tabs have it; `defaultSelectedKey` picks the first one otherwise. */
export const ControlledTabs: Story = {
  render: (args) => <Controlled {...args} />,
}

/** With `keyboardActivation` set to `automatic`, the arrow keys select the tab they move the focus to, as React Aria has it by default; `manual`, the M3 way and the default here, they only move the focus and Space or Enter selects. */
export const AutomaticActivation: Story = {
  args: { keyboardActivation: 'automatic' },
  render: (args) => (
    <Tabs {...args} className="w-120">
      <TabList>
        {destinations.map(([name]) => (
          <Tab key={name} id={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      {destinations.map(([name, , text]) => (
        <TabPanel key={name} id={name} className={panel}>
          {text}
        </TabPanel>
      ))}
    </Tabs>
  ),
}

/** A disabled tab, by `isDisabled` on it or its `id` in the `disabledKeys` of the `Tabs`: it cannot be selected or focused, and the arrow keys skip it. `isDisabled` on the `Tabs` disables them all. */
export const Disabled: Story = {
  render: (args) => (
    <Tabs {...args} disabledKeys={['explore']} className="w-120">
      <TabList>
        <Tab id="flights">Flights</Tab>
        <Tab id="trips" isDisabled>
          Trips
        </Tab>
        <Tab id="explore">Explore</Tab>
        <Tab id="saved">Saved</Tab>
      </TabList>
      <TabPanel id="flights" className={panel}>
        Flights are listed here.
      </TabPanel>
      <TabPanel id="trips" className={panel}>
        Trips are listed here.
      </TabPanel>
      <TabPanel id="explore" className={panel}>
        Places to explore are listed here.
      </TabPanel>
      <TabPanel id="saved" className={panel}>
        Saved places are listed here.
      </TabPanel>
    </Tabs>
  ),
}

const hashes = destinations.map(([name]) => `#${name.toLowerCase()}`)

function Linked(props: TabsProps) {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const read = () => setHash(window.location.hash)
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])
  return (
    <Tabs {...props} selectedKey={hashes.includes(hash) ? hash : hashes[0]!} className="w-120">
      <TabList>
        {destinations.map(([name], i) => (
          <Tab key={name} id={hashes[i]!} href={hashes[i]!}>
            {name}
          </Tab>
        ))}
      </TabList>
      {destinations.map(([name, , text], i) => (
        <TabPanel key={name} id={hashes[i]!} className={panel}>
          {text}
        </TabPanel>
      ))}
    </Tabs>
  )
}

/** Link tabs: an `href` makes a tab an `<a>`, a React Aria link, that follows its link when pressed and leaves the selection to `selectedKey`, as React Aria has it, for the location to set; here each tab is the page's own hash. */
export const Links: Story = {
  render: (args) => <Linked {...args} />,
}

/** Children as a function: called with the state React Aria reports of the tab (`isSelected`, `isHovered`, `isPressed`, `isFocused`, `isFocusVisible`, `isDisabled`), here to fill the icon of the selected tab. */
export const FunctionChildren: Story = {
  render: (args) => (
    <Tabs {...args} className="w-120">
      <TabList>
        {destinations.map(([name, icon]) => (
          <Tab key={name} id={name}>
            {({ isSelected }) => (
              <>
                <Icon name={icon} className={isSelected ? 'icon-filled' : undefined} />
                {name}
              </>
            )}
          </Tab>
        ))}
      </TabList>
      {destinations.map(([name, , text]) => (
        <TabPanel key={name} id={name} className={panel}>
          {text}
        </TabPanel>
      ))}
    </Tabs>
  ),
}

/** Primary tabs with secondary tabs below them, as the guidelines place a second level. */
export const TwoLevels: Story = {
  render: (args) => (
    <Tabs {...args} className="w-120">
      <TabList>
        {destinations.map(([name]) => (
          <Tab key={name} id={name}>
            {name}
          </Tab>
        ))}
      </TabList>
      {destinations.map(([name, , text]) => (
        <TabPanel key={name} id={name}>
          <Tabs variant="secondary">
            <TabList>
              <Tab id="overview">Overview</Tab>
              <Tab id="specifications">Specifications</Tab>
            </TabList>
            <TabPanel id="overview" className={panel}>
              {text}
            </TabPanel>
            <TabPanel id="specifications" className={panel}>
              Every specification of {name.toLowerCase()}.
            </TabPanel>
          </Tabs>
        </TabPanel>
      ))}
    </Tabs>
  ),
}
