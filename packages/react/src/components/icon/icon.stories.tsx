import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon } from './icon'

const meta = {
  title: 'Components/Icon',
  component: Icon,
  args: { name: 'stars_filled', className: 'icon-24' },
  argTypes: {
    name: { table: { category: 'M3' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    className: {
      control: 'inline-radio',
      options: [
        'icon-18',
        'icon-20',
        'icon-24',
        'icon-28',
        'icon-32',
        'icon-36',
        'icon-40',
        'icon-48',
      ],
      table: { category: 'Styling' },
    },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = { args: { className: 'icon-48' } }

/** An icon is the size of its font: the one it inherits, or one a class gives it. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-space-300 text-on-surface">
      {['icon-18', 'icon-20', 'icon-24', 'icon-28', 'icon-32', 'icon-36', 'icon-40', 'icon-48'].map(
        (size) => (
          <Icon key={size} {...args} className={size} />
        ),
      )}
    </div>
  ),
}

/** Outlined, and filled with icon-filled, as selected states in M3 are. */
export const Filled: Story = {
  render: (args) => (
    <div className="flex gap-space-300 text-primary icon-40">
      <Icon {...args} className={undefined} />
      <Icon {...args} className="icon-filled" />
    </div>
  ),
}

/** Low emphasis (-icon-grade-25), the default 0, and high emphasis (icon-grade-200). */
export const Grades: Story = {
  render: (args) => (
    <div className="text-on-surface icon-40">
      <Icon {...args} className="-icon-grade-25" />
      <Icon {...args} className={undefined} />
      <Icon {...args} className="icon-grade-200" />
    </div>
  ),
}

/** The stroke weight is the font weight's. */
export const Weights: Story = {
  render: (args) => (
    <div className="text-on-surface icon-40">
      {[
        'font-thin',
        'font-extralight',
        'font-light',
        'font-normal',
        'font-medium',
        'font-semibold',
        'font-bold',
      ].map((weight) => (
        <Icon key={weight} {...args} className={weight} />
      ))}
    </div>
  ),
}

/** Icons are decorative unless labelled; a labelled icon is exposed as an image. */
export const Labelled: Story = {
  args: { name: 'stars_filled', 'aria-label': 'Home', className: 'icon-40' },
}

/** A glyph that implies a direction flips in right-to-left layouts with `rtl:icon-mirrored`; a symbol such as a checkmark keeps its meaning without it. Use the Direction toolbar to compare. */
export const Mirrored: Story = {
  render: (args) => (
    <div className="text-on-surface icon-40">
      <Icon {...args} className="rtl:icon-mirrored" name="arrow_back" />
      <Icon {...args} className={undefined} name="arrow_back" />
      <Icon {...args} className={undefined} name="check" />
    </div>
  ),
}

export const Gallery: Story = {
  argTypes: { 'aria-label': { control: false } },
  render: () => (
    <div className="grid grid-cols-6 gap-space-200 text-on-surface">
      {[
        'home',
        'search',
        'settings',
        'menu',
        'close',
        'arrow_back',
        'add',
        'check',
        'delete',
        'edit',
        'star',
        'share',
      ].map((name) => (
        <div key={name} className="flex w-24 flex-col items-center gap-space-100">
          <Icon name={name} className="icon-24" />
          <span className="text-label-sm text-on-surface-variant">{name}</span>
        </div>
      ))}
    </div>
  ),
}
