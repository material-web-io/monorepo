import { Time } from '@internationalized/date'
import type { Meta, StoryContext, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { Heading, type TimeValue } from 'react-aria-components'
import { Button } from '../button'
import { DialogTrigger } from '../dialog'
import {
  TimePicker,
  TimePickerContent,
  TimePickerDial,
  TimePickerDialog,
  TimePickerHeader,
  TimePickerInput,
  TimePickerModeToggle,
  TimePickerPeriodSelector,
  type TimePickerDisplayMode,
  type TimePickerRenderProps,
  type TimePickerSelection,
} from '.'

/* The parts the stories' pickers are written of, as the README writes them: the text is the
 * caller's, in English here, Compose's strings, the title following the display mode. */

/** The mode toggle's name, for the display mode it swaps from. */
const toggleLabel = (displayMode: TimePickerDisplayMode) =>
  displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to touch input mode'

/** A time picker's parts. */
const parts = ({ displayMode, selection }: TimePickerRenderProps) => (
  <>
    <TimePickerHeader>
      <Heading slot="title">{displayMode === 'picker' ? 'Select time' : 'Enter time'}</Heading>
    </TimePickerHeader>
    <TimePickerContent>
      <TimePickerInput hourLabel="Hour" minuteLabel="Minute" />
      <TimePickerPeriodSelector aria-label="Select AM or PM" />
      <TimePickerDial aria-label={selection === 'hour' ? 'Select hour' : 'Select minute'} />
    </TimePickerContent>
  </>
)

// Every prop of TimePicker, its own and React Aria's TimeField's, but its event handlers: the
// docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/TimePicker',
  component: TimePicker,
  subcomponents: {
    TimePickerHeader,
    TimePickerContent,
    TimePickerInput,
    TimePickerPeriodSelector,
    TimePickerDial,
    TimePickerModeToggle,
    TimePickerDialog,
  },
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Time', defaultValue: new Time(7, 0), children: parts },
  argTypes: {
    displayMode: {
      control: 'inline-radio',
      options: ['picker', 'input'],
      table: { category: 'M3' },
    },
    layout: {
      control: 'inline-radio',
      options: ['vertical', 'horizontal'],
      table: { category: 'M3' },
    },
    selection: {
      control: 'inline-radio',
      options: [undefined, 'hour', 'minute'],
      table: { category: 'M3' },
    },
    defaultSelection: {
      control: 'inline-radio',
      options: ['hour', 'minute'],
      table: { category: 'M3' },
    },
    onSelectionChange: { table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    value: { control: false, table: { category: 'Value' } },
    defaultValue: { control: false, table: { category: 'Value' } },
    placeholderValue: { control: false, table: { category: 'Value' } },
    hourCycle: {
      control: 'inline-radio',
      options: [undefined, 12, 24],
      table: { category: 'Value' },
    },
    shouldForceLeadingZeros: { control: 'boolean', table: { category: 'Value' } },
    hideTimeZone: { control: 'boolean', table: { category: 'Value' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    isReadOnly: { control: 'boolean', table: { category: 'State' } },
    isRequired: { control: 'boolean', table: { category: 'State' } },
    isInvalid: { control: 'boolean', table: { category: 'State' } },
    autoFocus: { control: 'boolean', table: { category: 'State' } },
    validate: { control: false, table: { category: 'Validation' } },
    validationBehavior: {
      control: 'inline-radio',
      options: ['native', 'aria'],
      table: { category: 'Validation' },
    },
    name: { control: 'text', table: { category: 'Form' } },
    form: { control: 'text', table: { category: 'Form' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    id: { control: 'text', table: { category: 'DOM' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: {
      control: 'inline-radio',
      options: ['ltr', 'rtl', 'auto'],
      table: { category: 'DOM' },
    },
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
} satisfies Meta<typeof TimePicker>

export default meta
type Story = StoryObj<typeof meta>

/** Opens the dialog from the button that opens it, as a click does, for a story that shows it open. */
const open = async ({ canvas, userEvent }: Pick<StoryContext, 'canvas' | 'userEvent'>) => {
  await userEvent.click(canvas.getByRole('button'))
}

/** What a story's picker is given in its dialog: the time picked and the display mode, which the
 * dialog's mode toggle swaps. */
type Draft = {
  value: TimeValue | null
  onChange: (value: TimeValue | null) => void
  displayMode: TimePickerDisplayMode
  toggle: () => void
}

type DialogStoryProps = {
  /** The story's args the dialog starts from. */
  args: { defaultValue?: TimeValue | null; displayMode?: TimePickerDisplayMode }
  /** The text of the button that opens the dialog, for the time saved. */
  describe: (value: TimeValue | null) => string
  /** The picker, given the time picked and the display mode. */
  children: (draft: Draft) => ReactNode
}

/* The time saved, and the one picked apart from it until `save`, with the display mode, the
 * caller's state as in Compose's TimePickerDialog sample: the one picked and the mode start again
 * as the dialog opens. */
function useDraft({ defaultValue, displayMode = 'picker' }: DialogStoryProps['args']) {
  const [saved, setSaved] = useState<TimeValue | null>(defaultValue ?? null)
  const [picked, setPicked] = useState(saved)
  const [mode, setMode] = useState(displayMode)
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) return
    setPicked(saved)
    setMode(displayMode)
  }
  const draft: Draft = {
    value: picked,
    onChange: setPicked,
    displayMode: mode,
    toggle: () => setMode(mode === 'picker' ? 'input' : 'picker'),
  }
  return { saved, save: () => setSaved(picked), onOpenChange, draft }
}

/* A button that opens the picker in a `TimePickerDialog`, as Compose's sample pieces it: the mode
 * toggle at the start of the actions, Cancel, and OK, which saves the time picked and waits for
 * one. */
function ModalPicker({ args, describe, children }: DialogStoryProps) {
  const { saved, save, onOpenChange, draft } = useDraft(args)
  return (
    <DialogTrigger onOpenChange={onOpenChange}>
      <Button variant="outlined">{describe(saved)}</Button>
      <TimePickerDialog
        modeToggle={
          <TimePickerModeToggle
            displayMode={draft.displayMode}
            onPress={draft.toggle}
            aria-label={toggleLabel(draft.displayMode)}
          />
        }
        dismissButton={
          <Button variant="text" slot="close">
            Cancel
          </Button>
        }
        confirmButton={
          <Button variant="text" slot="close" isDisabled={!draft.value} onPress={save}>
            OK
          </Button>
        }
      >
        {children(draft)}
      </TimePickerDialog>
    </DialogTrigger>
  )
}

const describeTime = (time: TimeValue | null) => (time ? time.toString() : 'Pick a time')

/**
 * A time picker is Compose's, of the parts written in it: the `TimePickerHeader`, with the title,
 * over the `TimePickerContent`, which lays out the `TimePickerInput`, the hour and the minute,
 * the `TimePickerPeriodSelector`, AM and PM, and the `TimePickerDial`. The time is React Aria's
 * TimeField's, which the segments type into and the dial and the selector set. The text is the
 * caller's: the picker draws none of its own. On its own here; a `TimePickerDialog` holds it in a
 * dialog, with the mode toggle that swaps the dial and the input.
 */
export const Playground: Story = {}

/**
 * The modal time picker, pieced as Compose's sample is: a button opens the `TimePickerDialog`,
 * which holds the `TimePicker` and its own buttons, the `TimePickerModeToggle` at the start of the
 * actions, wired to the display mode the caller holds, as Compose's is. The time picked is kept
 * apart from the one saved until OK saves it; Cancel, Escape and a press outside drop it.
 */
export const Modal: Story = {
  render: (args) => (
    <ModalPicker args={args} describe={describeTime}>
      {(draft) => (
        <TimePicker
          {...args}
          defaultValue={undefined}
          value={draft.value}
          onChange={draft.onChange}
          displayMode={draft.displayMode}
        />
      )}
    </ModalPicker>
  ),
  play: open,
}

/**
 * The modal time input: the same dialog, its picker showing the input first. The hour and the
 * minute are text inputs typed as Compose's text fields are, each number setting the time at once
 * and the hour handing the focus on to the minute as it fills; from no time, one is reported once
 * both are typed, and OK waits for it.
 */
export const ModalInput: Story = {
  ...Modal,
  args: { displayMode: 'input' },
}

/**
 * The dial beside the time, `layout="horizontal"`, for a window wider than tall, as the spec lays
 * out the time picker on a phone turned landscape, in the dialog. The `viewport` global below
 * turns an Android phone's window.
 */
export const Horizontal: Story = {
  ...Modal,
  globals: { viewport: { value: 'nexus6p', isRotated: true } },
  args: { layout: 'horizontal' },
}

/**
 * A 24-hour clock, `hourCycle={24}`, which React Aria's locale may choose on its own: no period
 * selector, and the dial's hours 0 to 11 on the outer ring with 12 to 23 inside, picked by how far
 * from the center a press is.
 */
export const TwentyFourHour: Story = {
  args: { hourCycle: 24, defaultValue: new Time(20, 0) },
}

/**
 * Controlled by `value` and `onChange`, called with a `Time` from `@internationalized/date` as the
 * dial is turned or a time typed, or `null` while the input holds none; and by `selection` and
 * `onSelectionChange`, the part of the time the dial sets.
 */
export const Controlled: Story = {
  render: function Controlled(args) {
    const [value, setValue] = useState<TimeValue | null>(new Time(7, 0))
    const [selection, setSelection] = useState<TimePickerSelection>('hour')
    return (
      <div className="flex flex-col items-start gap-space-200">
        <TimePicker
          {...args}
          value={value}
          onChange={setValue}
          selection={selection}
          onSelectionChange={setSelection}
        />
        <span className="text-body-md text-on-surface-variant">
          {value ? value.toString() : 'No time'}, {selection}
        </span>
      </div>
    )
  },
}

/** With no time: the dial on React Aria's placeholder, midnight unless `placeholderValue` is given,
 * which the first pick fills the rest of the time from; the segments showing their placeholders. */
export const Empty: Story = {
  args: { defaultValue: undefined, placeholderValue: new Time(12, 0) },
}

/** Disabled, as React Aria has it: nothing in it is pressed, typed or turned. */
export const Disabled: Story = {
  args: { isDisabled: true },
}
