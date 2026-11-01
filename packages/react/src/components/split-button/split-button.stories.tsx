import type { Meta, StoryObj } from '@storybook/react-vite'
import { MenuTrigger } from 'react-aria-components'
import { Icon } from '../icon'
import { Menu, MenuItem, MenuPopover } from '../menu'
import {
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
  type SplitButtonLeadingProps,
} from './split-button'

const meta = {
  title: 'Components/Split button',
  component: SplitButton,
  subcomponents: { SplitButtonLeading, SplitButtonTrailing },
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'filled', 'tonal', 'outlined'],
      table: { category: 'M3' },
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 's', 'm', 'l', 'xl'],
      table: { category: 'M3' },
    },
    children: { control: false, table: { category: 'Parts' } },
    className: { table: { category: 'Styling' } },
    style: { table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof SplitButton>

export default meta
type Story = StoryObj<typeof meta>

const variants = ['elevated', 'filled', 'tonal', 'outlined'] as const
const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

/**
 * The two buttons, the trailing one in React Aria's `MenuTrigger`, which opens the menu and gives
 * it `aria-expanded`, as it does any button. Its props are the leading button's.
 */
function Reply({ children = 'Reply', ...props }: SplitButtonLeadingProps) {
  return (
    <>
      <SplitButtonLeading {...props}>{children}</SplitButtonLeading>
      <MenuTrigger>
        <SplitButtonTrailing aria-label="More reply options" isDisabled={props.isDisabled} />
        <MenuPopover>
          <Menu>
            <MenuItem>Reply all</MenuItem>
            <MenuItem>Forward</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </>
  )
}

export const Playground: Story = {
  render: (args) => (
    <SplitButton {...args}>
      <Reply />
    </SplitButton>
  ),
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-300">
      {variants.map((variant) => (
        <SplitButton key={variant} {...args} variant={variant}>
          <Reply>{variant}</Reply>
        </SplitButton>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-space-200">
      {sizes.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-space-300">
          <span className="w-space-400 text-label-md text-on-surface-variant">{size}</span>
          <SplitButton {...args} size={size}>
            <Reply />
          </SplitButton>
        </div>
      ))}
    </div>
  ),
}

/** A leading icon before the label, sized to match the button automatically. */
export const WithIcon: Story = {
  render: (args) => (
    <SplitButton {...args}>
      <Reply>
        <Icon name="reply" />
        Reply
      </Reply>
    </SplitButton>
  ),
}

/**
 * The leading button can be icon-only too, unlike a plain Button - name it
 * with `aria-label` since it then has no visible text.
 */
export const IconOnly: Story = {
  render: (args) => (
    <SplitButton {...args}>
      <Reply aria-label="Reply">
        <Icon name="reply" />
      </Reply>
    </SplitButton>
  ),
}

/**
 * `aria-expanded` on the trailing button rotates its icon 180° and rounds its inner corner to
 * match the outer one - its color never changes, only this shape. `MenuTrigger` gives it while
 * the menu is open; written here by hand, for anything else the button opens.
 */
export const Expanded: Story = {
  render: (args) => (
    <SplitButton {...args}>
      <SplitButtonLeading>Reply</SplitButtonLeading>
      <SplitButtonTrailing aria-label="More reply options" aria-expanded />
    </SplitButton>
  ),
}

/**
 * Pending, the leading button shows its loading indicator alone and keeps its size and colors; it
 * ignores presses but keeps the focus, and the trailing button still opens the menu.
 */
export const Pending: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-300">
      {variants.map((variant) => (
        <SplitButton key={variant} {...args} variant={variant}>
          <Reply isPending>{variant}</Reply>
        </SplitButton>
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-300">
      {variants.map((variant) => (
        <SplitButton key={variant} {...args} variant={variant}>
          <Reply isDisabled>{variant}</Reply>
        </SplitButton>
      ))}
    </div>
  ),
}
