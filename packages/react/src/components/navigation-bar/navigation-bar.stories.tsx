import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Text } from 'react-aria-components'
import { Icon } from '../icon'
import { NavigationBar, NavigationBarItem, type NavigationBarProps } from '.'

const meta = {
  title: 'Components/NavigationBar',
  component: NavigationBar,
  subcomponents: { NavigationBarItem },
  parameters: { layout: 'padded' },
  args: { layout: 'vertical', arrangement: 'equal-weight' },
  argTypes: {
    layout: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal'],
      table: { category: 'M3' },
    },
    arrangement: {
      control: 'inline-radio',
      options: ['equal-weight', 'centered'],
      table: { category: 'M3' },
    },
    children: { control: false, table: { category: 'Parts' } },
    // React Aria's Toolbar's: the docgen reads none of them from the imported types.
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof NavigationBar>

export default meta
type Story = StoryObj<typeof meta>

const destinations = [
  ['Home', 'home'],
  ['Browse', 'explore'],
  ['Radio', 'radio'],
  ['Library', 'library_music'],
] as const

/** A bar in a navigation landmark that keeps which of its destinations is selected, the first at the start. */
function Destinations({
  items = destinations,
  disabled,
  ...props
}: NavigationBarProps & { items?: readonly (readonly [string, string])[]; disabled?: string }) {
  const [selected, setSelected] = useState(items[0]?.[0])
  return (
    <nav aria-label="Main">
      <NavigationBar {...props}>
        {items.map(([name, icon]) => (
          <NavigationBarItem
            key={name}
            isSelected={name === selected}
            isDisabled={name === disabled}
            onChange={() => setSelected(name)}
          >
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationBarItem>
        ))}
      </NavigationBar>
    </nav>
  )
}

/** Four destinations across the window: click one, or Tab to the bar, move with the arrow keys and press Space or Enter, and the active indicator grows out from the middle of its icon, which fills. */
export const Playground: Story = {
  render: (args) => <Destinations {...args} />,
}

/** Horizontal items, centered, for a medium window: the icon and the label side by side inside the indicator, the items together in the middle of the bar and the space left over at its ends. */
export const Horizontal: Story = {
  args: { layout: 'horizontal', arrangement: 'centered' },
  render: (args) => <Destinations {...args} />,
}

/** Three, four and five destinations: vertical items divide the bar equally, whatever their number. */
export const Counts: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <Destinations {...args} items={destinations.slice(0, 3)} />
      <Destinations {...args} />
      <Destinations {...args} items={[...destinations, ['Settings', 'settings']]} />
    </div>
  ),
}

/** Centered items take 60% of the bar between them when there are three, 70% when four and 80% when five. */
export const HorizontalCounts: Story = {
  args: { layout: 'horizontal', arrangement: 'centered' },
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <Destinations {...args} items={destinations.slice(0, 3)} />
      <Destinations {...args} />
      <Destinations {...args} items={[...destinations, ['Settings', 'settings']]} />
    </div>
  ),
}

/** The arrangement is apart from the layout: horizontal items given equal weight divide the bar equally, and vertical items centered sit together in its middle. */
export const Arrangements: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-300">
      <Destinations {...args} layout="horizontal" arrangement="equal-weight" />
      <Destinations {...args} layout="vertical" arrangement="centered" />
    </div>
  ),
}

/** A disabled destination, which takes no pointer and which the arrow keys pass by: its icon and label at 38%. */
export const Disabled: Story = {
  render: (args) => <Destinations {...args} disabled="Radio" />,
}

/** Children as a function of the item's state, here to draw another glyph when it is selected. */
export const FunctionChildren: Story = {
  render: (args) => {
    const Example = () => {
      const [selected, setSelected] = useState('Saved')
      return (
        <nav aria-label="Main">
          <NavigationBar {...args}>
            {(['Explore', 'Saved', 'Updates'] as const).map((name) => (
              <NavigationBarItem
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
              </NavigationBarItem>
            ))}
          </NavigationBar>
        </nav>
      )
    }
    return <Example />
  },
}

/** At the bottom of a window, under content that scrolls: the bar is in the flow, so what holds it places it. */
export const InAWindow: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex h-dvh flex-col">
      <div className="flex-1 overflow-y-auto p-space-200 text-body-md text-on-surface">
        {Array.from({ length: 24 }, (_, index) => (
          <p key={index} className="py-space-100">
            Row {index + 1}
          </p>
        ))}
      </div>
      <Destinations {...args} />
    </div>
  ),
}
