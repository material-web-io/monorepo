import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useState } from 'react'
import { I18nProvider, Label, SliderOutput } from 'react-aria-components'
import { Icon } from '../icon'
import { Slider, type SliderProps } from './slider'

// Every prop of Slider, its own and React Aria's Slider's: the docgen reads none of them from the
// imported types, so each is listed here.
const meta = {
  title: 'Components/Slider',
  component: Slider,
  args: {
    'aria-label': 'Volume',
    defaultValue: 40,
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['xs', 's', 'm', 'l', 'xl'],
      table: { category: 'M3' },
    },
    isCentered: { control: 'boolean', table: { category: 'M3' } },
    showStops: { control: 'boolean', table: { category: 'M3' } },
    showValueIndicator: { control: 'boolean', table: { category: 'M3' } },
    icon: { control: false, table: { category: 'M3' } },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { category: 'M3' },
    },
    // A Label, a SliderOutput.
    children: { control: false, table: { category: 'Parts' } },
    // Controlled by value, or starting from defaultValue; an array of two is a range.
    value: { control: 'object', table: { category: 'Value' } },
    defaultValue: { control: 'object', table: { category: 'Value' } },
    minValue: { control: 'number', table: { category: 'Value' } },
    maxValue: { control: 'number', table: { category: 'Value' } },
    step: { control: 'number', table: { category: 'Value' } },
    formatOptions: { control: 'object', table: { category: 'Value' } },
    // Every thumb's input, so a range slider submits its two values under the one name.
    name: { control: 'text', table: { category: 'Form' } },
    form: { control: 'text', table: { category: 'Form' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
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
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

const label = 'text-label-md text-on-surface-variant'

/** Uncontrolled: drag the handle, press the track or use the keys; the controls set the value it starts at. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-80">
      <Slider key={JSON.stringify(args.defaultValue)} {...args} />
    </div>
  ),
}

/** The three variants: standard, from the start to the value; centered, from the middle to it; range, between two values. */
export const Variants: Story = {
  render: (args) => (
    <div className="grid w-96 grid-cols-[auto_1fr] items-center gap-x-space-300 gap-y-space-400">
      <span className={label}>Standard</span>
      <Slider {...args} aria-label="Standard" defaultValue={40} />
      <span className={label}>Centered</span>
      <Slider
        {...args}
        aria-label="Centered"
        minValue={-50}
        maxValue={50}
        defaultValue={-20}
        isCentered
      />
      <span className={label}>Range</span>
      <Slider {...args} aria-label="Range" defaultValue={[30, 70]} />
    </div>
  ),
}

/** The five sizes, XS to XL, each with an inset icon from M up. Drag one low: the icon moves to the inactive track once the active track can no longer hold it. */
export const Sizes: Story = {
  render: (args) => (
    <div className="grid w-96 grid-cols-[auto_1fr] items-center gap-x-space-300 gap-y-space-400">
      {(['xs', 's', 'm', 'l', 'xl'] as const).map((size) => (
        <Fragment key={size}>
          <span className={label}>{size.toUpperCase()}</span>
          <Slider
            {...args}
            aria-label={`Volume, ${size.toUpperCase()}`}
            size={size}
            icon={size === 'xs' || size === 's' ? undefined : <Icon name="volume_up" />}
          />
        </Fragment>
      ))}
    </div>
  ),
}

/** Stop indicators at every step, here of 10: the handle snaps to the nearest one as it is dragged. Every slider has a stop at the end of its inactive track; a centered or range slider at its start too. */
export const Stops: Story = {
  render: (args) => (
    <div className="flex w-96 flex-col gap-space-400">
      <Slider {...args} aria-label="Standard" step={10} showStops />
      <Slider
        {...args}
        aria-label="Centered"
        minValue={-50}
        maxValue={50}
        step={10}
        defaultValue={20}
        isCentered
        showStops
      />
      <Slider {...args} aria-label="Range" step={10} defaultValue={[20, 60]} showStops />
    </div>
  ),
}

/** The value indicator shows the value above the handle while it is held or dragged, or has keyboard focus: a range slider shows it on that handle only. `formatOptions` formats it. */
export const ValueIndicator: Story = {
  render: (args) => (
    <div className="flex w-96 flex-col gap-space-800 pt-space-800">
      <Slider {...args} aria-label="Brightness" defaultValue={50} showValueIndicator />
      <Slider
        {...args}
        aria-label="Price"
        maxValue={500}
        step={10}
        defaultValue={[100, 350]}
        formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
        showValueIndicator
      />
    </div>
  ),
}

/** Enabled and disabled, of each variant. Press or tab to an enabled one: the handle narrows to 2dp and the track follows it, 6dp away. */
export const States: Story = {
  render: (args) => (
    <div className="grid w-[40rem] grid-cols-[auto_1fr_1fr] items-center gap-x-space-300 gap-y-space-400">
      <span />
      {['Enabled', 'Disabled'].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {(
        [
          ['Standard', { defaultValue: 40 }],
          ['Stops', { defaultValue: 40, step: 10, showStops: true }],
          ['Centered', { defaultValue: 70, isCentered: true }],
          ['Range', { defaultValue: [30, 70] }],
        ] satisfies [string, SliderProps][]
      ).map(([row, state]) => (
        <Fragment key={row}>
          <span className={label}>{row}</span>
          <Slider {...args} {...state} aria-label={row} showValueIndicator />
          <Slider {...args} {...state} aria-label={`${row}, disabled`} isDisabled />
        </Fragment>
      ))}
    </div>
  ),
}

/** Vertical, the value rising from the bottom: the slider takes its height from its class. The value indicator opens to the handle's inline start. */
export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-72 items-stretch gap-space-800 ps-space-800">
      <Slider {...args} aria-label="Standard" orientation="vertical" showValueIndicator />
      <Slider
        {...args}
        aria-label="Stops"
        orientation="vertical"
        step={10}
        showStops
        showValueIndicator
      />
      <Slider {...args} aria-label="Centered" orientation="vertical" defaultValue={30} isCentered />
      <Slider
        {...args}
        aria-label="Medium, with an icon"
        orientation="vertical"
        size="m"
        icon={<Icon name="light_mode" />}
      />
      <Slider {...args} aria-label="XL" orientation="vertical" size="xl" defaultValue={60} />
    </div>
  ),
}

/** A `Label` child names the slider and a `SliderOutput` child shows its value, both before the track; arrange them with the slider's class. */
export const WithLabel: Story = {
  render: (args) => (
    <Slider {...args} aria-label={undefined} className="w-80 gap-space-100">
      <div className="flex justify-between px-space-150 text-body-md text-on-surface">
        <Label>Volume</Label>
        <SliderOutput className="text-on-surface-variant" />
      </div>
    </Slider>
  ),
}

/** Controlled, with the icon swapped at zero: a volume icon becomes a mute icon. */
export const IconAtZero: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(30)
    return (
      <div className="w-96">
        <Slider
          {...args}
          defaultValue={undefined}
          size="l"
          value={value}
          onChange={setValue}
          icon={<Icon name={value === 0 ? 'volume_off' : 'volume_up'} />}
        />
      </div>
    )
  },
}

/** Right to left: React Aria places the handles from its locale, here an `I18nProvider`'s, so the value runs from the right; the page's `dir` lays out the rest. */
export const RightToLeft: Story = {
  render: (args) => (
    <I18nProvider locale="ar-EG">
      <div dir="rtl" className="flex w-96 flex-col gap-space-400">
        <Slider {...args} aria-label="Standard" size="m" icon={<Icon name="volume_up" />} />
        <Slider {...args} aria-label="Range" defaultValue={[30, 70]} showValueIndicator />
        <Slider
          {...args}
          aria-label="Vertical"
          orientation="vertical"
          className="h-48"
          showValueIndicator
        />
      </div>
    </I18nProvider>
  ),
}
