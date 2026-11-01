import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useEffect, useState } from 'react'
import { LinearProgressIndicator } from './linear-progress-indicator'

const meta = {
  title: 'Components/Progress indicator/Linear',
  component: LinearProgressIndicator,
  args: { 'aria-label': 'Loading news article', value: 40 },
  argTypes: {
    shape: { control: 'radio', options: ['flat', 'wavy'], table: { category: 'M3' } },
    thickness: { control: { type: 'range', min: 2, max: 16, step: 1 }, table: { category: 'M3' } },
    amplitude: { control: { type: 'range', min: 0, max: 8, step: 0.5 }, table: { category: 'M3' } },
    wavelength: { control: { type: 'range', min: 8, max: 80, step: 1 }, table: { category: 'M3' } },
    showStopIndicator: { control: 'boolean', table: { category: 'M3' } },
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
} satisfies Meta<typeof LinearProgressIndicator>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

/** The value, from 0 to 100 unless `minValue` and `maxValue` say otherwise, is the progress made; `isIndeterminate` makes the indicator indeterminate. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-96">
      <LinearProgressIndicator {...args} />
    </div>
  ),
}

/** Both shapes: the indicator spans what it is in, and the wave adds its height. */
export const Shapes: Story = {
  render: (args) => (
    <div className="grid w-96 gap-space-400">
      <LinearProgressIndicator {...args} shape="flat" />
      <LinearProgressIndicator {...args} shape="wavy" />
    </div>
  ),
}

/** Indeterminate, two lines move along the track without end. */
export const Indeterminate: Story = {
  args: { isIndeterminate: true },
  render: (args) => (
    <div className="grid w-96 gap-space-400">
      <LinearProgressIndicator {...args} shape="flat" />
      <LinearProgressIndicator {...args} shape="wavy" />
    </div>
  ),
}

function Fill(props: React.ComponentProps<typeof LinearProgressIndicator>) {
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
  return <LinearProgressIndicator {...props} value={value} />
}

/** A determinate indicator filling from 0% to 100%: it starts as a dot, the wave is drawn in and, near the end, flattened out again. */
export const Filling: Story = {
  render: (args) => (
    <div className="grid w-96 gap-space-400">
      <Fill {...args} shape="flat" />
      <Fill {...args} shape="wavy" />
    </div>
  ),
}

function Loading(props: React.ComponentProps<typeof LinearProgressIndicator>) {
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
  return <LinearProgressIndicator {...props} isIndeterminate={isIndeterminate} value={100} />
}

/** Given a value while indeterminate, the lines first run off the end, then the stop indicator pops in and the value fills from 0, as in the guideline video. */
export const ChangingToDeterminate: Story = {
  args: { 'aria-label': 'Loading episodes' },
  render: (args) => (
    <div className="grid w-96 gap-space-400">
      <Loading {...args} shape="flat" />
      <Loading {...args} shape="wavy" />
    </div>
  ),
}

/** The 4dp default and the 8dp sample the spec gives, flat and wavy; the stop indicator stays 4dp. */
export const Thickness: Story = {
  render: (args) => (
    <div className="grid w-[36rem] grid-cols-[1fr_auto] items-center gap-x-space-600 gap-y-space-400">
      {[4, 8].flatMap((thickness) =>
        (['flat', 'wavy'] as const).map((shape) => (
          <Fragment key={`${thickness}${shape}`}>
            <LinearProgressIndicator {...args} shape={shape} thickness={thickness} />
            <span className={label}>
              {thickness}dp {shape}
            </span>
          </Fragment>
        )),
      )}
    </div>
  ),
}

/** Along the top edge of a container that is loading, inset 4dp from its sides. */
export const OnAContainer: Story = {
  args: { shape: 'wavy', value: 35, 'aria-label': 'Loading my episodes' },
  render: (args) => (
    <div className="w-96 rounded-shape-lg bg-surface-container-low">
      <div className="px-space-50 pt-space-50">
        <LinearProgressIndicator {...args} />
      </div>
      <div className="px-space-200 py-space-200 text-title-lg text-on-surface">My episodes</div>
    </div>
  ),
}

/** In right-to-left text the indicator fills from the right. */
export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl" className="w-96">
      <LinearProgressIndicator {...args} shape="wavy" />
    </div>
  ),
}
