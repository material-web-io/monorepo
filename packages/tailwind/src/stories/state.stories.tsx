import { Button as AriaButton } from 'react-aria-components'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ripple } from '../../../react/src/components'
import { twMerge } from '../../../react/src/lib/tv'

/* Reference page for the state layers, drawn in the content color at each state's opacity
 * (opacity-state-hover, ...), the disabled opacities, and the state variants, live on React Aria
 * buttons, which report their states as the components do. Class names are spelled out for Tailwind. */
const states = [
  { label: 'Enabled', value: '0', layer: 'opacity-0' },
  { label: 'Hovered', value: '8%', layer: 'opacity-state-hover' },
  { label: 'Focused', value: '10%', layer: 'opacity-state-focus' },
  { label: 'Pressed', value: '10%', layer: 'opacity-state-pressed' },
  { label: 'Dragged', value: '16%', layer: 'opacity-state-dragged' },
]

// One variant each, on a button that fills with primary in that state.
const variants = [
  { label: 'hover:', className: 'hover:bg-primary hover:text-on-primary' },
  { label: 'focus:', className: 'focus:bg-primary focus:text-on-primary' },
  { label: 'pressed:', className: 'pressed:bg-primary pressed:text-on-primary' },
  {
    label: 'disabled:',
    className:
      'disabled:bg-on-surface/disabled-container disabled:text-on-surface/disabled-content',
    disabled: true,
  },
]

function StateLayers() {
  return (
    <div className="box-border flex min-h-screen flex-col gap-space-500 bg-surface p-space-400 font-plain text-on-surface antialiased">
      <section>
        <h2 className="m-0 mb-space-200 text-title-md">State layers</h2>
        <div className="grid grid-cols-5 gap-space-200">
          {states.map(({ label, value, layer }) => (
            <div key={label}>
              <div className="relative h-[96px] overflow-hidden rounded-shape-md bg-primary-container">
                <div className={twMerge('absolute inset-0 bg-on-primary-container', layer)} />
              </div>
              <div className="mt-space-100 text-label-lg">{label}</div>
              <div className="text-body-sm text-on-surface-variant">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="m-0 mb-space-200 text-title-md">Disabled</h2>
        <div className="flex gap-space-200">
          <div>
            <div className="grid h-[96px] w-[160px] place-items-center rounded-shape-md bg-primary text-label-lg text-on-primary">
              Enabled
            </div>
          </div>
          <div>
            <div className="relative grid h-[96px] w-[160px] place-items-center overflow-hidden rounded-shape-md text-label-lg">
              <div className="absolute inset-0 bg-on-surface opacity-disabled-container" />
              <span className="relative opacity-disabled-content">Disabled</span>
            </div>
            <div className="mt-space-100 text-body-sm text-on-surface-variant">
              content 38%, container 12%
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="m-0 mb-space-200 text-title-md">Live</h2>
        <AriaButton className="relative focus-ring grid h-[96px] w-[160px] cursor-pointer place-items-center rounded-shape-md border-0 bg-primary-container text-label-lg text-on-primary-container outline-none">
          <Ripple />
          Hover, focus or press
        </AriaButton>
      </section>

      <section>
        <h2 className="m-0 mb-space-200 text-title-md">State variants</h2>
        <div className="flex gap-space-200">
          {variants.map(({ label, className, disabled }) => (
            <AriaButton
              key={label}
              isDisabled={disabled}
              className={twMerge(
                'focus-ring h-[40px] rounded-shape-md border-0 bg-surface-container-highest px-space-300 text-label-lg text-on-surface outline-none not-disabled:cursor-pointer',
                className,
              )}
            >
              {label}
            </AriaButton>
          ))}
        </div>
        <p className="mt-space-200 mb-0 text-body-md text-on-surface-variant">
          React Aria's Tailwind plugin, which @material-web/react loads: hover, focus, focus-within,
          focus-visible, disabled, indeterminate, invalid and open read the attribute a React Aria
          component reports, and the pseudo-class on any other element; pressed, selected, dragging,
          entering and exiting the attribute alone, with their group, peer, not and has forms.
        </p>
      </section>
    </div>
  )
}

const meta = {
  title: 'Styles/State',
  component: StateLayers,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StateLayers>

export default meta
type Story = StoryObj<typeof meta>

export const Layers: Story = { name: 'State layers' }
