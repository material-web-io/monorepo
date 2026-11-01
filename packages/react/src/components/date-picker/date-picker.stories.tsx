import { getLocalTimeZone, isWeekend, parseDate, today } from '@internationalized/date'
import type { Meta, StoryContext, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { useLocale } from 'react-aria'
import { Heading, type DateValue, type RangeValue } from 'react-aria-components'
import { AppBar } from '../app-bar'
import { Button } from '../button'
import { Dialog, DialogTrigger } from '../dialog'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerDialog,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerHeadline,
  DateRangePickerInput,
  type DatePickerDisplayMode,
  type DatePickerRenderProps,
  type DateRangePickerProps,
} from '.'

/* The parts the stories' pickers are written of, as the README writes them: the text is the
 * caller's, in English here, the mode toggle's name following the display mode. */

const toggleLabel = (displayMode: DatePickerDisplayMode) =>
  displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to calendar mode'

/** A date picker's parts, the input's field labelled `label`. */
const dateParts =
  (label = 'Date') =>
  ({ displayMode }: DatePickerRenderProps) => (
    <>
      <DatePickerHeader>
        <Heading slot="title">Select date</Heading>
        <DatePickerHeadline>
          {displayMode === 'picker' ? 'Selected date' : 'Entered date'}
        </DatePickerHeadline>
        <DatePickerModeToggle aria-label={toggleLabel(displayMode)} />
      </DatePickerHeader>
      <DatePickerContent>
        <DatePickerCalendar />
        <DatePickerInput label={label} />
      </DatePickerContent>
    </>
  )

/** A range picker's parts. */
const rangeParts = ({ displayMode }: DatePickerRenderProps) => (
  <>
    <DatePickerHeader>
      <Heading slot="title">Select dates</Heading>
      <DateRangePickerHeadline>
        {displayMode === 'picker' ? 'Start date – End date' : 'Enter dates'}
      </DateRangePickerHeadline>
      <DatePickerModeToggle aria-label={toggleLabel(displayMode)} />
    </DatePickerHeader>
    <DatePickerContent>
      <DateRangePickerCalendar />
      <DateRangePickerInput startLabel="Start date" endLabel="End date" />
    </DatePickerContent>
  </>
)

// Every prop of DatePicker, its own and React Aria's Calendar's, but its event handlers: the
// docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  subcomponents: {
    DatePickerHeader,
    DatePickerHeadline,
    DatePickerModeToggle,
    DatePickerContent,
    DatePickerCalendar,
    DatePickerInput,
    DatePickerDialog,
    DateRangePicker,
    DateRangePickerHeadline,
    DateRangePickerCalendar,
    DateRangePickerInput,
  },
  parameters: { layout: 'centered' },
  args: { defaultValue: parseDate('2025-08-17'), children: dateParts() },
  argTypes: {
    displayMode: {
      control: 'inline-radio',
      options: [undefined, 'picker', 'input'],
      table: { category: 'M3' },
    },
    defaultDisplayMode: {
      control: 'inline-radio',
      options: ['picker', 'input'],
      table: { category: 'M3' },
    },
    onDisplayModeChange: { table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    value: { control: false, table: { category: 'Value' } },
    defaultValue: { control: false, table: { category: 'Value' } },
    minValue: { control: false, table: { category: 'Value' } },
    maxValue: { control: false, table: { category: 'Value' } },
    isDateUnavailable: { control: false, table: { category: 'Value' } },
    focusedValue: { control: false, table: { category: 'Value' } },
    defaultFocusedValue: { control: false, table: { category: 'Value' } },
    firstDayOfWeek: {
      control: 'inline-radio',
      options: [undefined, 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      table: { category: 'Calendar' },
    },
    pageBehavior: {
      control: 'inline-radio',
      options: ['visible', 'single'],
      table: { category: 'Calendar' },
    },
    selectionAlignment: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      table: { category: 'Calendar' },
    },
    createCalendar: { control: false, table: { category: 'Calendar' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    isReadOnly: { control: 'boolean', table: { category: 'State' } },
    isInvalid: { control: 'boolean', table: { category: 'State' } },
    autoFocus: { control: 'boolean', table: { category: 'State' } },
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
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

/** The spec's date, a Monday in August. */
const august17 = parseDate('2025-08-17')

/** Opens the dialog from the button that opens it, as a click does, for a story that shows it
 * open: a date's or a range's. */
const open = async ({ canvas, userEvent }: Pick<StoryContext, 'canvas' | 'userEvent'>) => {
  await userEvent.click(canvas.getByRole('button'))
}

/** What a story's picker is given in its dialog: the value picked and the display mode. */
type Draft<V> = {
  value: V | null
  onChange: (value: V | null) => void
  displayMode: DatePickerDisplayMode
  onDisplayModeChange: (displayMode: DatePickerDisplayMode) => void
}

type DialogStoryProps<V> = {
  /** The story's args the dialog starts from. */
  args: {
    defaultValue?: V | null
    displayMode?: DatePickerDisplayMode
    defaultDisplayMode?: DatePickerDisplayMode
  }
  /** The text of the button that opens the dialog, for the value saved. */
  describe: (value: V | null) => string
  /** The picker, given the value picked and the display mode. */
  children: (draft: Draft<V>) => ReactNode
}

/* The value saved, and the one picked apart from it until `save`, with the display mode: the one
 * picked and the mode start again as the dialog opens. */
function useDraft<V>({
  defaultValue,
  displayMode,
  defaultDisplayMode = 'picker',
}: DialogStoryProps<V>['args']) {
  const [saved, setSaved] = useState<V | null>(defaultValue ?? null)
  const [picked, setPicked] = useState(saved)
  const [mode, setMode] = useState(defaultDisplayMode)
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) return
    setPicked(saved)
    setMode(defaultDisplayMode)
  }
  const draft: Draft<V> = {
    value: picked,
    onChange: setPicked,
    displayMode: displayMode ?? mode,
    onDisplayModeChange: setMode,
  }
  return { saved, save: () => setSaved(picked), onOpenChange, draft }
}

/* A button that opens the picker in a `DatePickerDialog`, as Compose's sample pieces it: Cancel and
 * OK, which saves the value picked and waits for one, and Clear over the calendar, as the M3
 * design kit draws it. */
function ModalPicker<V>({ args, describe, children }: DialogStoryProps<V>) {
  const { saved, save, onOpenChange, draft } = useDraft(args)
  return (
    <DialogTrigger onOpenChange={onOpenChange}>
      <Button variant="outlined">{describe(saved)}</Button>
      <DatePickerDialog
        clearButton={
          draft.displayMode === 'picker' ? (
            <Button variant="text" onPress={() => draft.onChange(null)}>
              Clear
            </Button>
          ) : undefined
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
      </DatePickerDialog>
    </DialogTrigger>
  )
}

/* A button that opens the picker in a full-screen `Dialog`, headed by a small `AppBar` in the
 * dialog's fill with the close button, which drops the value picked, and Save, which saves it. */
function FullScreenPicker<V>({ args, describe, children }: DialogStoryProps<V>) {
  const { saved, save, onOpenChange, draft } = useDraft(args)
  return (
    <DialogTrigger onOpenChange={onOpenChange}>
      <Button variant="outlined">{describe(saved)}</Button>
      <Dialog isFullScreen className="bg-surface-container-high pb-0">
        {({ state }) => (
          <>
            <AppBar className="bg-surface-container-high">
              <IconButton slot="leading" aria-label="Close" onPress={() => state.close()}>
                <Icon name="close" />
              </IconButton>
              <Button
                slot="trailing"
                variant="text"
                isDisabled={!draft.value}
                onPress={() => {
                  save()
                  state.close()
                }}
              >
                Save
              </Button>
            </AppBar>
            {children(draft)}
          </>
        )}
      </Dialog>
    </DialogTrigger>
  )
}

const describeDate = (date: DateValue | null) => (date ? date.toString() : 'Pick a date')
const describeRange = (dates: RangeValue<DateValue> | null) =>
  dates ? `${dates.start} – ${dates.end}` : 'Pick the dates'

/**
 * A date picker is Compose's, of the parts written in it: the `DatePickerHeader`, with the title,
 * the `DatePickerHeadline` of the date and the `DatePickerModeToggle`, over the
 * `DatePickerContent`, which swaps the `DatePickerCalendar` and the `DatePickerInput`. The
 * calendar is React Aria's, with its month and year's menu, which opens the years; the input is
 * its DateField. The text is the caller's: the picker draws none of its own. On its own here; a
 * `DatePickerDialog` holds it in a dialog.
 */
export const Playground: Story = {}

/**
 * The modal date picker, pieced as Compose's sample is: a button opens the `DatePickerDialog`,
 * which holds the `DatePicker` and its own confirm and dismiss buttons, and a clear button over
 * the calendar, as the M3 design kit draws it. The date picked is kept apart from the one saved
 * until OK saves it; Cancel, Escape and a press outside drop it.
 */
export const Modal: Story = {
  render: (args) => (
    <ModalPicker args={args} describe={describeDate}>
      {(draft) => <DatePicker {...args} defaultValue={undefined} {...draft} autoFocus />}
    </ModalPicker>
  ),
  play: open,
}

/**
 * The modal date input: the same dialog, its picker showing the input first. A date typed past
 * the bounds, or unavailable, leaves the picker with none, so OK waits, as Compose's does, and is
 * gone once the calendar is swapped in.
 */
export const ModalInput: Story = {
  ...Modal,
  args: {
    defaultDisplayMode: 'input',
    minValue: parseDate('1900-01-01'),
    maxValue: today(getLocalTimeZone()),
    children: dateParts('Date of birth'),
  },
}

/**
 * The date picker full-screen on a phone, pieced as the range one is: a full-screen `Dialog`
 * headed by a small `AppBar` with the close button and Save, in the dialog's fill, over the
 * `DatePicker`, as wide as the window. The date picked is kept apart until Save saves it; the
 * close button drops it. The `viewport` global below makes the window an Android phone's.
 */
export const FullScreen: Story = {
  globals: { viewport: 'nexus6p' },
  render: (args) => (
    <FullScreenPicker args={args} describe={describeDate}>
      {(draft) => (
        <DatePicker {...args} defaultValue={undefined} {...draft} autoFocus className="w-full" />
      )}
    </FullScreenPicker>
  ),
  play: open,
}

/**
 * The dates that can be picked: `minValue` and `maxValue` bound them, the days past them dimmed
 * and the arrows and years stopping there, and `isDateUnavailable` strikes days out, which can
 * still be reached by the keys but not picked, as React Aria has it.
 */
export const Bounds: Story = {
  render: function Bounds(args) {
    const now = today(getLocalTimeZone())
    const { locale } = useLocale()
    return (
      <DatePicker
        {...args}
        defaultValue={now}
        minValue={now}
        maxValue={now.add({ months: 3 })}
        isDateUnavailable={(date) => isWeekend(date, locale)}
      />
    )
  },
}

/**
 * Controlled by `value` and `onChange`, called with a `CalendarDate` from
 * `@internationalized/date` as a day is picked or a date typed, or `null` while the input holds
 * none it can take; and by `displayMode` and `onDisplayModeChange`.
 */
export const Controlled: Story = {
  render: function Controlled(args) {
    const [value, setValue] = useState<DateValue | null>(august17)
    const [displayMode, setDisplayMode] = useState<DatePickerDisplayMode>('picker')
    return (
      <div className="flex flex-col items-start gap-space-200">
        <DatePicker
          {...args}
          value={value}
          onChange={setValue}
          displayMode={displayMode}
          onDisplayModeChange={setDisplayMode}
        />
        <span className="text-body-md text-on-surface-variant">
          {value ? value.toString() : 'No date'}, {displayMode}
        </span>
      </div>
    )
  },
}

type RangeStory = StoryObj<Meta<typeof DateRangePicker>>

const range = { start: august17, end: parseDate('2025-08-23') }

/**
 * A range picker is the date picker's parts with the range's: the `DateRangePickerHeadline` of the
 * range, the `DateRangePickerCalendar`, the months of a range in a column that scrolls, and the
 * `DateRangePickerInput`, the start and the end. It fills the height it is given: the window's
 * here, `h-dvh`. On its own here; a `DatePickerDialog` holds it in a dialog.
 */
export const RangePlayground: RangeStory = {
  parameters: { layout: 'fullscreen' },
  args: { defaultValue: range, children: rangeParts, className: 'mx-auto h-dvh' },
  render: (args: DateRangePickerProps<DateValue>) => <DateRangePicker {...args} />,
}

/**
 * The range picker in the dialog, as Compose's DatePickerDialog holds a DateRangePicker: the
 * months in a column that scrolls and fills the dialog's height, over the actions, with a clear
 * button over the months. OK waits for a range, which the picker reports once both ends are picked.
 */
export const Range: RangeStory = {
  args: { defaultValue: range, children: rangeParts },
  render: (args: DateRangePickerProps<DateValue>) => (
    <ModalPicker args={args} describe={describeRange}>
      {(draft) => <DateRangePicker {...args} defaultValue={undefined} {...draft} />}
    </ModalPicker>
  ),
  play: open,
}

/**
 * The range input: the start and the end typed side by side. An end typed that the months could
 * not pick, or on the wrong side of the other, is none, so OK waits, as Compose's does; swapped
 * back in, the months show the start's.
 */
export const RangeInput: RangeStory = {
  ...Range,
  args: { defaultValue: range, defaultDisplayMode: 'input', children: rangeParts },
}

/**
 * The full-screen range picker the spec recommends on a phone: a full-screen `Dialog` headed by a
 * small `AppBar` with the close button and Save, in the dialog's fill, over the `DateRangePicker`,
 * which fills the rest of it, its months scrolling to the bottom edge. The `viewport` global
 * below makes the window an Android phone's.
 */
export const RangeFullScreen: RangeStory = {
  ...Range,
  globals: { viewport: 'nexus6p' },
  render: (args: DateRangePickerProps<DateValue>) => (
    <FullScreenPicker args={args} describe={describeRange}>
      {(draft) => (
        <DateRangePicker {...args} defaultValue={undefined} {...draft} className="w-full" />
      )}
    </FullScreenPicker>
  ),
}
