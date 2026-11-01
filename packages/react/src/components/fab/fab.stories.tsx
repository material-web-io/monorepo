import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState, type ComponentProps, type UIEvent } from 'react'
import { Text } from 'react-aria-components'
import { Icon } from '../icon'
import { Fab } from './fab'

const meta = {
  title: 'Components/FAB',
  component: Fab,
  parameters: { layout: 'centered' },
  args: { children: <Icon name="stars_filled" />, 'aria-label': 'Create' },
  argTypes: {
    color: {
      control: 'select',
      options: [
        'primary-container',
        'secondary-container',
        'tertiary-container',
        'primary',
        'secondary',
        'tertiary',
      ],
      table: { category: 'M3' },
    },
    size: {
      control: 'inline-radio',
      options: ['baseline', 'medium', 'large'],
      table: { category: 'M3' },
    },
    isExtended: { table: { category: 'M3' } },
    children: { table: { category: 'Parts' } },
    isPending: { table: { category: 'State' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    'aria-label': { table: { category: 'Accessibility' } },
    className: { table: { category: 'Styling' } },
    style: { table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Fab>

export default meta
type Story = StoryObj<typeof meta>

const colors = [
  'primary-container',
  'secondary-container',
  'tertiary-container',
  'primary',
  'secondary',
  'tertiary',
] as const
const sizes = ['baseline', 'medium', 'large'] as const

export const Playground: Story = {}

export const Colors: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-300">
      {colors.map((color) => (
        <Fab key={color} {...args} color={color} />
      ))}
    </div>
  ),
}

/** Baseline is 56dp, medium 80dp and large 96dp; the corner and the icon grow with them. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-300">
      {sizes.map((size) => (
        <Fab key={size} {...args} size={size} />
      ))}
    </div>
  ),
}

/**
 * Pending, a FAB shows its loading indicator alone, in its icon's color, and keeps its size and
 * colors, an extended FAB its width too; it ignores presses but keeps the focus. Every size.
 */
export const Pending: Story = {
  args: { isPending: true },
  render: (args) => (
    <div className="flex flex-col items-start gap-space-300">
      <div className="flex flex-wrap items-center gap-space-300">
        {sizes.map((size) => (
          <Fab key={size} {...args} size={size} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-space-300">
        {sizes.map((size) => (
          <Fab key={size} {...args} size={size}>
            <Icon name="stars_filled" />
            <Text slot="label">Compose</Text>
          </Fab>
        ))}
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  args: { isDisabled: true },
}

/** Give it a label, React Aria's `Text` in the `label` slot, and it becomes an extended FAB, named by its label. */
export const Extended: Story = {
  render: (args) => (
    <Fab {...args}>
      <Icon name="stars_filled" />
      <Text slot="label">Compose</Text>
    </Fab>
  ),
}

export const ExtendedColors: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-300">
      {colors.map((color) => (
        <Fab key={color} {...args} color={color}>
          <Icon name="stars_filled" />
          <Text slot="label">Compose</Text>
        </Fab>
      ))}
    </div>
  ),
}

/** The size sets the height; the width follows the label. `baseline` is the small extended FAB. */
export const ExtendedSizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-300">
      {sizes.map((size) => (
        <Fab key={size} {...args} size={size}>
          <Icon name="stars_filled" />
          <Text slot="label">Compose</Text>
        </Fab>
      ))}
    </div>
  ),
}

/** The icon is optional on an extended FAB; a label alone is enough to make it one. */
export const ExtendedWithoutIcon: Story = {
  args: { children: <Text slot="label">Compose</Text> },
}

export const ExtendedDisabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <Fab {...args}>
      <Icon name="stars_filled" />
      <Text slot="label">Compose</Text>
    </Fab>
  ),
}

type Props = ComponentProps<typeof Fab>

// The guidelines' "Scrolling" behavior: collapse on scrolling down, extend on
// scrolling up. Under 8px of travel is ignored so a trackpad's jitter around a
// turning point doesn't flap it, and a bounce past either end is clamped away.
function Collapsing(props: Pick<Props, 'color' | 'size' | 'isDisabled'>) {
  const [extended, setExtended] = useState(true)
  const anchor = useRef(0)
  const onScroll = (event: UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const top = Math.max(0, Math.min(scrollTop, scrollHeight - clientHeight))
    const travel = top - anchor.current
    if (Math.abs(travel) < 8) return
    anchor.current = top
    setExtended(travel < 0)
  }
  return (
    <>
      <ul className="m-0 h-dvh list-none overflow-y-auto p-0" onScroll={onScroll}>
        {Array.from({ length: 48 }, (_, i) => (
          <li key={i} className="flex items-center gap-space-200 px-space-200 py-space-150">
            <span className="size-space-500 shrink-0 rounded-shape-full bg-secondary-container" />
            <span className="flex min-w-0 grow flex-col gap-space-100">
              <span className="h-space-150 w-3/5 rounded-shape-full bg-surface-container-highest" />
              <span className="h-space-150 w-4/5 rounded-shape-full bg-surface-container-high" />
            </span>
          </li>
        ))}
      </ul>
      <Fab
        {...props}
        isExtended={extended}
        aria-label="Compose"
        className="fixed right-space-200 bottom-space-200 z-fab"
      >
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
    </>
  )
}

/**
 * Scroll the list: the extended FAB collapses to a FAB while it scrolls down
 * and extends again once it scrolls back up. The same icon-and-label children
 * stay mounted and only `extended` flips. Collapsing, the label slides under the
 * trailing edge, the icon holding its inset; extending, it slides back out.
 * Either way the label fades as the shape starts to change, as Compose's does.
 */
export const CollapseOnScroll: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => <Collapsing color={args.color} size={args.size} isDisabled={args.isDisabled} />,
}
