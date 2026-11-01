import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../button'
import { Icon } from '../icon'
import { Divider } from './divider'

const meta = {
  title: 'Components/Divider',
  component: Divider,
  // Every prop, the docgen reads none of them from the imported types; event handlers left out.
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['full-width', 'inset', 'middle-inset'],
      table: { category: 'M3' },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { category: 'M3' },
    },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    elementType: { control: 'text', table: { category: 'DOM' } },
    id: { control: 'text', table: { category: 'DOM' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    suppressHydrationWarning: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

/** A divider is only as long as what it sits in: a horizontal one fills its container's width, a vertical one stretches to a flex row's height. */
export const Playground: Story = {
  render: (args) => (
    <div className={args.orientation === 'vertical' ? 'flex h-40 w-80' : 'w-80'}>
      <Divider {...args} />
    </div>
  ),
}

const messages = [
  ['Cumpleaños de mamá', 'Hola, en mi casa if you all help with the food. Should we…'],
  ['Graduación de Inés', 'Hola hija mía, aquí tienes unas fotos preciosas de Inés en…'],
  ['Pre-sale concert tickets', 'Just saw there are a couple good shows lined up next m…'],
] as const

function Message({ title, preview, avatar }: { title: string; preview: string; avatar?: boolean }) {
  return (
    <div className="flex items-center gap-space-200 px-space-200 py-space-150">
      {avatar && <div className="size-10 shrink-0 rounded-shape-full bg-primary-container" />}
      <div className="min-w-0">
        <div className="truncate text-body-lg text-on-surface">{title}</div>
        <div className="truncate text-body-md text-on-surface-variant">{preview}</div>
      </div>
    </div>
  )
}

/** Full-width dividers separate larger sections of unrelated content, here the messages in an inbox. */
export const FullWidth: Story = {
  render: (args) => (
    <div className="w-80 rounded-shape-lg bg-surface-container-lowest py-space-100">
      {messages.map(([title, preview], i) => (
        <div key={title}>
          {i > 0 && <Divider {...args} />}
          <Message title={title} preview={preview} />
        </div>
      ))}
    </div>
  ),
}

/** Inset dividers separate related items and align with the leading edge, next to an anchoring element such as an avatar. */
export const Inset: Story = {
  args: { variant: 'inset' },
  render: (args) => (
    <div className="w-80 rounded-shape-lg bg-surface-container-lowest py-space-100">
      {messages.map(([title, preview], i) => (
        <div key={title}>
          {i > 0 && <Divider {...args} />}
          <Message title={title} preview={preview} avatar />
        </div>
      ))}
    </div>
  ),
}

/** A middle-inset divider is indented on both sides, to separate elements such as body text from a row of actions. */
export const MiddleInset: Story = {
  args: { variant: 'middle-inset' },
  render: (args) => (
    <div className="w-80 rounded-shape-lg bg-surface-container-lowest">
      <p className="m-0 px-space-200 py-space-200 text-body-md text-on-surface">
        Dividers are one way to visually group components and create hierarchy. They can also be
        used to imply nested parent/child relationships.
      </p>
      <Divider {...args} />
      <div className="flex gap-space-100 px-space-200 py-space-200">
        <Button variant="tonal" size="xs">
          Lists
        </Button>
        <Button variant="tonal" size="xs">
          Cards
        </Button>
        <Button variant="tonal" size="xs">
          Menus
        </Button>
      </div>
    </div>
  ),
}

/** A full-width divider separates the non-interactive content of a card from its actions. */
export const InCard: Story = {
  render: (args) => (
    <div className="w-80 rounded-shape-md bg-surface-container-low">
      <div className="px-space-200 py-space-200">
        <div className="text-title-md text-on-surface">Glass & Grace</div>
        <div className="text-body-md text-on-surface-variant">
          Sound Check: Making of Eye Rhymes
        </div>
      </div>
      <Divider {...args} />
      <div className="flex justify-end px-space-100 py-space-100">
        <Button variant="text">Read more</Button>
      </div>
    </div>
  ),
}

/** Used both ways: full-width dividers between sections of different content, inset dividers between the nested items of a section. */
export const Hierarchy: Story = {
  render: () => (
    <div className="w-80 rounded-shape-lg bg-surface-container-lowest py-space-100">
      <div className="px-space-200 py-space-100 text-label-lg text-on-surface-variant">Today</div>
      {messages.slice(0, 2).map(([title, preview], i) => (
        <div key={title}>
          {i > 0 && <Divider variant="inset" />}
          <Message title={title} preview={preview} avatar />
        </div>
      ))}
      <Divider />
      <div className="px-space-200 py-space-100 text-label-lg text-on-surface-variant">
        Yesterday
      </div>
      {messages.slice(2).map(([title, preview]) => (
        <Message key={title} title={title} preview={preview} avatar />
      ))}
    </div>
  ),
}

/** A vertical divider arranges content side by side on a larger screen, stretching to the height of the flex row it is in. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="flex w-160 gap-space-300 rounded-shape-lg bg-surface-container-lowest p-space-300">
      <div className="flex flex-1 items-center justify-center rounded-shape-md bg-primary-container text-on-primary-container">
        <Icon name="image" className="icon-48" />
      </div>
      <Divider {...args} />
      <div className="flex-1">
        <div className="text-label-md text-on-surface-variant">by Selen Zeynep</div>
        <div className="text-title-md text-on-surface">
          What buttons are artists pushing when they perform live
        </div>
        <p className="m-0 mt-space-100 text-body-md text-on-surface-variant">
          A vertical divider can be used to arrange content on a larger screen, such as separating
          paragraph text from video or imagery media.
        </p>
      </div>
    </div>
  ),
}
