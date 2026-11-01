import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useEffect, useState } from 'react'
import { Button } from '../button'
import { CircularProgressIndicator } from './circular-progress-indicator'

const meta = {
  title: 'Components/Progress indicator/Circular',
  component: CircularProgressIndicator,
  args: { 'aria-label': 'Loading news article', value: 40 },
  argTypes: {
    shape: { control: 'radio', options: ['flat', 'wavy'], table: { category: 'M3' } },
    thickness: { control: { type: 'range', min: 2, max: 16, step: 1 }, table: { category: 'M3' } },
    size: { control: { type: 'range', min: 24, max: 240, step: 1 }, table: { category: 'M3' } },
    amplitude: { control: { type: 'range', min: 0, max: 8, step: 0.5 }, table: { category: 'M3' } },
    wavelength: { control: { type: 'range', min: 8, max: 40, step: 1 }, table: { category: 'M3' } },
    showTrack: { control: 'boolean', table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    // React Aria's ProgressBar; the docgen reads none of them from the imported types.
    value: { control: { type: 'range', min: 0, max: 100, step: 1 }, table: { category: 'Value' } },
    minValue: { control: 'number', table: { category: 'Value' } },
    maxValue: { control: 'number', table: { category: 'Value' } },
    isIndeterminate: { control: 'boolean', table: { category: 'Value' } },
    formatOptions: { control: 'object', table: { category: 'Value' } },
    valueLabel: { control: 'text', table: { category: 'Value' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    id: { control: 'text', table: { category: 'DOM' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof CircularProgressIndicator>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

/** The value, from 0 to 100 unless `minValue` and `maxValue` say otherwise, is the progress made; `isIndeterminate` makes the indicator indeterminate. */
export const Playground: Story = {
  render: (args) => <CircularProgressIndicator {...args} />,
}

/** Both shapes, at the same 48dp. */
export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-space-400">
      <CircularProgressIndicator {...args} shape="flat" />
      <CircularProgressIndicator {...args} shape="wavy" />
    </div>
  ),
}

/** Indeterminate, the arc turns, growing and shrinking, without end. */
export const Indeterminate: Story = {
  args: { isIndeterminate: true },
  render: (args) => (
    <div className="flex items-center gap-space-400">
      <CircularProgressIndicator {...args} shape="flat" />
      <CircularProgressIndicator {...args} shape="wavy" />
    </div>
  ),
}

function Fill(props: React.ComponentProps<typeof CircularProgressIndicator>) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = () => {
      const t = ((performance.now() - start) % 6000) / 6000
      // Fills over four seconds, rests two, then again.
      setValue(Math.min(100, t * 150))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <CircularProgressIndicator {...props} value={value} />
}

/** A determinate indicator filling from 0% to 100%: it starts as a dot, the wave is drawn in and, near the end, flattened out again. */
export const Filling: Story = {
  render: (args) => (
    <div className="flex items-center gap-space-400">
      <Fill {...args} shape="flat" />
      <Fill {...args} shape="wavy" />
    </div>
  ),
}

function Loading(props: React.ComponentProps<typeof CircularProgressIndicator>) {
  const [isIndeterminate, setIndeterminate] = useState(true)
  useEffect(() => {
    const start = performance.now()
    let frame = 0
    const tick = () => {
      const t = (performance.now() - start) % 7000
      // Indeterminate for four seconds, then loaded, then again.
      setIndeterminate(t < 4000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])
  return <CircularProgressIndicator {...props} isIndeterminate={isIndeterminate} value={100} />
}

/** Given a value while indeterminate, the arc first shrinks away into its tail, then the value fills from the top. */
export const ChangingToDeterminate: Story = {
  args: { 'aria-label': 'Loading episodes' },
  render: (args) => (
    <div className="flex items-center gap-space-400">
      <Loading {...args} shape="flat" />
      <Loading {...args} shape="wavy" />
    </div>
  ),
}

/** The 4dp default and the 8dp sample the spec gives, flat and wavy. */
export const Thickness: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-space-600 gap-y-space-400">
      {[4, 8].flatMap((thickness) =>
        (['flat', 'wavy'] as const).map((shape) => (
          <Fragment key={`${thickness}${shape}`}>
            <CircularProgressIndicator {...args} shape={shape} thickness={thickness} />
            <span className={label}>
              {thickness}dp {shape}
            </span>
          </Fragment>
        )),
      )}
    </div>
  ),
}

/** From 24dp to 240dp: the indicator is drawn at each size, with the stroke and the wave in proportion. */
export const Sizes: Story = {
  args: { shape: 'wavy' },
  render: (args) => (
    <div className="flex items-end gap-space-400">
      {[24, 48, 96, 240].map((size) => (
        <div key={size} className="flex flex-col items-center gap-space-100">
          <CircularProgressIndicator {...args} size={size} aria-label={`Loading, ${size}dp`} />
          <span className={label}>{size}</span>
        </div>
      ))}
    </div>
  ),
}

/** In a button, the indicator takes the color of the label and loses its track, and the label says what is going on: the indicator is hidden from assistive technology in a span, as React Aria passes no `aria-hidden` on, and named so that React Aria asks for no label. */
export const InButton: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-space-200">
      <Button variant="filled">
        <span aria-hidden className="flex">
          <CircularProgressIndicator
            aria-label="Checking for updates"
            isIndeterminate
            size={24}
            showTrack={false}
            className="text-current"
          />
        </span>
        Checking for updates
      </Button>
      <Button variant="tonal">
        <span aria-hidden className="flex">
          <CircularProgressIndicator
            aria-label="Validating"
            isIndeterminate
            size={24}
            showTrack={false}
            className="text-current"
          />
        </span>
        Validating
      </Button>
      <Button variant="outlined">
        <span aria-hidden className="flex">
          <CircularProgressIndicator
            aria-label="Saving"
            isIndeterminate
            size={24}
            showTrack={false}
            className="text-current"
          />
        </span>
        Saving
      </Button>
    </div>
  ),
}

/** In right-to-left text the arc still goes clockwise. */
export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <CircularProgressIndicator {...args} shape="wavy" />
    </div>
  ),
}
