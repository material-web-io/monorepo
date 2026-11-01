import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../button'
import { LoadingIndicator } from './loading-indicator'

// Every prop of LoadingIndicator, its M3 configurations and React Aria's ProgressBar's but
// those of a value: the docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Loading indicator',
  component: LoadingIndicator,
  args: { 'aria-label': 'Loading news article' },
  argTypes: {
    isContained: { control: 'boolean', table: { category: 'M3' } },
    size: { control: { type: 'range', min: 24, max: 240, step: 1 }, table: { category: 'M3' } },
    // After the active indicator: a React Aria Label names it.
    children: { control: false, table: { category: 'Parts' } },
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
} satisfies Meta<typeof LoadingIndicator>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

/** The active indicator morphs through seven shapes, for as long as it is rendered: show it while the activity is in progress, and remove it when it ends. */
export const Playground: Story = {}

/** The two configurations: the active indicator alone, in primary, for a surface, and contained, in on-primary-container on a primary-container circle, for over other content. */
export const Configurations: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 justify-items-center gap-x-space-600 gap-y-space-200">
      <LoadingIndicator {...args} isContained={false} />
      <LoadingIndicator {...args} isContained />
      <span className={label}>Default</span>
      <span className={label}>Contained</span>
    </div>
  ),
}

/** The size in dp, from 24 to 240 and 48 by default. The container and the active indicator keep their ratio, and a size outside the range is brought back to its nearest end. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-center gap-space-400">
      {[false, true].map((contained) => (
        <div key={String(contained)} className="flex items-end gap-space-400">
          {[24, 48, 96, 240].map((size) => (
            <div key={size} className="flex flex-col items-center gap-space-100">
              <LoadingIndicator
                {...args}
                isContained={contained}
                size={size}
                aria-label={`Loading, ${size}dp`}
              />
              <span className={label}>{size}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}

/** While a page or a container loads, the indicator is centered on it. Directly on a surface, it needs no container. */
export const Centered: Story = {
  args: { 'aria-label': 'Loading my episodes' },
  render: (args) => (
    <div className="flex h-96 w-80 flex-col rounded-shape-lg bg-surface-container-low">
      <div className="px-space-200 py-space-200 text-title-lg text-on-surface">My episodes</div>
      <div className="flex flex-1 items-center justify-center">
        <LoadingIndicator {...args} />
      </div>
    </div>
  ),
}

const episodes = ['Pilot', 'The long way home', 'Static', 'Low tide', 'Signal and noise']

/** Over other content, as when content is refreshed, the container gives the indicator the contrast that the content behind it may not. */
export const OverContent: Story = {
  args: { isContained: true, 'aria-label': 'Refreshing my episodes' },
  render: (args) => (
    <div className="relative w-80 rounded-shape-lg bg-surface-container-low py-space-100">
      {episodes.map((episode, i) => (
        <div key={episode} className="flex items-center gap-space-200 px-space-200 py-space-100">
          <div className="size-14 shrink-0 rounded-shape-md bg-tertiary-container" />
          <div className="min-w-0">
            <div className="truncate text-body-lg text-on-surface">{episode}</div>
            <div className="text-body-md text-on-surface-variant">Episode {i + 1}</div>
          </div>
        </div>
      ))}
      <div className="absolute inset-x-0 top-space-300 flex justify-center">
        <LoadingIndicator {...args} />
      </div>
    </div>
  ),
}

/** In a button whose action takes a few seconds, the indicator takes the color of the label, which has the contrast with the button that the indicator needs, and the label says what is going on, so the indicator is hidden from assistive technology, in an element around it: React Aria passes no `aria-hidden` on, and warns of a progress bar without a label. */
export const InButton: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-space-200">
      <Button variant="filled">
        <span aria-hidden className="flex">
          <LoadingIndicator aria-label="Checking for updates" size={24} className="text-current" />
        </span>
        Checking for updates
      </Button>
      <Button variant="tonal">
        <span aria-hidden className="flex">
          <LoadingIndicator aria-label="Validating" size={24} className="text-current" />
        </span>
        Validating
      </Button>
      <Button variant="outlined">
        <span aria-hidden className="flex">
          <LoadingIndicator aria-label="Saving" size={24} className="text-current" />
        </span>
        Saving
      </Button>
    </div>
  ),
}
