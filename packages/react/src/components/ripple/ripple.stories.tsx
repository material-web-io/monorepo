import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ripple } from './ripple'

const meta = {
  title: 'Components/Ripple',
  component: Ripple,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Ripple>

export default meta
type Story = StoryObj<typeof meta>

/** Hover, focus with the keyboard, and press: the layer and ripple use the parent's text color. */
export const Filled: Story = {
  render: () => (
    <button
      type="button"
      className="relative focus-ring h-10 cursor-pointer rounded-shape-full border-0 bg-primary px-space-300 text-label-lg text-on-primary outline-none"
    >
      <Ripple />
      Label
    </button>
  ),
}

export const Tonal: Story = {
  render: () => (
    <button
      type="button"
      className="relative focus-ring h-10 cursor-pointer rounded-shape-full border-0 bg-secondary-container px-space-300 text-label-lg text-on-secondary-container outline-none"
    >
      <Ripple />
      Label
    </button>
  ),
}

export const Text: Story = {
  render: () => (
    <button
      type="button"
      className="relative focus-ring h-10 cursor-pointer rounded-shape-full border-0 bg-transparent px-space-200 text-label-lg text-primary outline-none"
    >
      <Ripple />
      Label
    </button>
  ),
}

/** A color role variant is the press circle's alone: the hover and focus layer keeps the host's text color. A selection control's unselected state does this, pressing in the color it is about to take. */
export const Primary: Story = {
  render: () => (
    <button
      type="button"
      className="relative focus-ring size-10 cursor-pointer rounded-shape-full border-0 bg-transparent text-on-surface outline-none"
    >
      <Ripple variant="primary" />
    </button>
  ),
}

/** The host decides the shape: the layer and ripple follow its corners. */
export const Card: Story = {
  render: () => (
    <div
      role="button"
      tabIndex={0}
      className="relative focus-ring h-30 w-60 cursor-pointer rounded-shape-md bg-surface-container-highest p-space-200 text-on-surface outline-none"
    >
      <Ripple />
      <div className="text-title-md">Card</div>
    </div>
  ),
}

/** A disabled host shows neither the state layer nor the ripple. */
export const Disabled: Story = {
  render: () => (
    <button
      type="button"
      disabled
      className="relative h-10 rounded-shape-full border-0 bg-on-surface/disabled-container px-space-300 text-label-lg text-on-surface/disabled-content"
    >
      <Ripple />
      Label
    </button>
  ),
}
