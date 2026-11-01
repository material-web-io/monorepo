import { parseDate } from '@internationalized/date'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { DialogTrigger, Form, Heading, type DateValue } from 'react-aria-components'
import { Button } from '../button'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerDialog,
  DatePickerHeader,
  DatePickerHeadline,
  DatePickerInput,
  DatePickerModeToggle,
} from '../date-picker'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { DateField } from '.'

// Every prop of DateField, its own and React Aria's DateField's, but its event handlers: the
// docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/DateField',
  component: DateField,
  parameters: { layout: 'centered' },
  args: { label: 'Date', className: 'w-90' },
  argTypes: {
    label: { control: 'text', table: { category: 'M3' } },
    description: { control: 'text', table: { category: 'M3' } },
    trailing: { control: false, table: { category: 'M3' } },
    input: { control: false, table: { category: 'M3' } },
    value: { control: false, table: { category: 'Value' } },
    defaultValue: { control: false, table: { category: 'Value' } },
    placeholderValue: { control: false, table: { category: 'Value' } },
    minValue: { control: false, table: { category: 'Value' } },
    maxValue: { control: false, table: { category: 'Value' } },
    isDateUnavailable: { control: false, table: { category: 'Value' } },
    granularity: {
      control: 'inline-radio',
      options: ['day', 'hour', 'minute', 'second'],
      table: { category: 'Value' },
    },
    hourCycle: { control: 'inline-radio', options: [12, 24], table: { category: 'Value' } },
    hideTimeZone: { control: 'boolean', table: { category: 'Value' } },
    shouldForceLeadingZeros: { control: 'boolean', table: { category: 'Value' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    isReadOnly: { control: 'boolean', table: { category: 'State' } },
    isRequired: { control: 'boolean', table: { category: 'State' } },
    isInvalid: { control: 'boolean', table: { category: 'State' } },
    validate: { control: false, table: { category: 'State' } },
    validationBehavior: {
      control: 'inline-radio',
      options: ['native', 'aria'],
      table: { category: 'State' },
    },
    autoFocus: { control: 'boolean', table: { category: 'State' } },
    name: { control: 'text', table: { category: 'Form' } },
    form: { control: 'text', table: { category: 'Form' } },
    autoComplete: { control: 'text', table: { category: 'Form' } },
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
} satisfies Meta<typeof DateField>

export default meta
type Story = StoryObj<typeof meta>

/** The spec's date, a Monday in August. */
const august17 = parseDate('2025-08-17')

/**
 * A date field is React Aria's DateField, drawn as an outlined text field: the date typed part
 * by part, each part a spinbutton, with the label on the outline and the date's format under it.
 */
export const Playground: Story = { args: { defaultValue: august17 } }

/**
 * Empty, with a date, required, invalid, read-only and disabled. The segments show the date's
 * format while empty, and the label stays on the outline, where the format would hide it.
 */
export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-400">
      <DateField {...args} label="Empty" />
      <DateField {...args} label="Populated" defaultValue={august17} />
      <DateField {...args} label="Required" isRequired />
      <DateField
        {...args}
        label="Invalid"
        defaultValue={august17}
        isInvalid
        description="Error text"
      />
      <DateField {...args} label="Read-only" defaultValue={august17} isReadOnly />
      <DateField {...args} label="Disabled" defaultValue={august17} isDisabled />
    </div>
  ),
}

/**
 * The field with the calendar button at its end, the spec's entry point for the date picker:
 * it opens a `DatePickerDialog`, whose OK puts the date picked in the field, as a modal date
 * picker with a text field does.
 */
export const WithDatePicker: Story = {
  render: function WithDatePicker(args) {
    const [date, setDate] = useState<DateValue | null>(august17)
    const [picked, setPicked] = useState(date)
    return (
      <DateField
        {...args}
        value={date}
        onChange={setDate}
        trailing={
          <DialogTrigger
            onOpenChange={(isOpen) => {
              if (isOpen) setPicked(date)
            }}
          >
            <IconButton aria-label="Calendar">
              <Icon name="calendar_today" />
            </IconButton>
            <DatePickerDialog
              dismissButton={
                <Button variant="text" slot="close">
                  Cancel
                </Button>
              }
              confirmButton={
                <Button
                  variant="text"
                  slot="close"
                  isDisabled={!picked}
                  onPress={() => setDate(picked)}
                >
                  OK
                </Button>
              }
            >
              <DatePicker value={picked} onChange={setPicked} autoFocus>
                {({ displayMode }) => (
                  <>
                    <DatePickerHeader>
                      <Heading slot="title">Select date</Heading>
                      <DatePickerHeadline>
                        {displayMode === 'picker' ? 'Selected date' : 'Entered date'}
                      </DatePickerHeadline>
                      <DatePickerModeToggle
                        aria-label={
                          displayMode === 'picker'
                            ? 'Switch to text input mode'
                            : 'Switch to calendar mode'
                        }
                      />
                    </DatePickerHeader>
                    <DatePickerContent>
                      <DatePickerCalendar />
                      <DatePickerInput label="Date" />
                    </DatePickerContent>
                  </>
                )}
              </DatePicker>
            </DatePickerDialog>
          </DialogTrigger>
        }
      />
    )
  },
}

/**
 * `input` draws the date's `<div>` of your own in the field's, given the props to spread on it:
 * here one with a title, which the browser shows over the date.
 */
export const CustomInput: Story = {
  args: { defaultValue: august17 },
  render: (args) => (
    <DateField {...args} input={(props) => <div {...props} title="Month, day and year" />} />
  ),
}

/**
 * In a form, as React Aria's: `name` sends the date as `YYYY-MM-DD`, `isRequired` blocks the
 * submit while it is empty with the browser's own message as the error text, and reset clears it.
 */
export const InForm: Story = {
  render: (args) => (
    <Form
      className="flex flex-col items-start gap-space-300"
      onSubmit={(event) => {
        event.preventDefault()
        alert(new FormData(event.currentTarget).get('date'))
      }}
    >
      <DateField {...args} name="date" isRequired />
      <div className="flex gap-space-100">
        <Button variant="text" type="reset">
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </Form>
  ),
}
