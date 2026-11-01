import { parseDate } from '@internationalized/date'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useDateFormatter } from 'react-aria'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarMenuButton,
  CalendarMonthPicker,
  CalendarPage,
  CalendarWeekdays,
  CalendarYearPicker,
} from '.'

// Every prop of Calendar, React Aria's Calendar's, but its event handlers: the docgen reads none
// of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  subcomponents: {
    CalendarGrid,
    CalendarGridBody,
    CalendarCell,
    CalendarWeekdays,
    CalendarHeaderCell,
    CalendarHeading,
    CalendarPage,
    CalendarMenuButton,
    CalendarYearPicker,
    CalendarMonthPicker,
  },
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Event date', defaultValue: parseDate('2025-08-17'), className: 'w-90' },
  argTypes: {
    children: { control: false, table: { category: 'Parts' } },
    value: { control: false, table: { category: 'Value' } },
    defaultValue: { control: false, table: { category: 'Value' } },
    minValue: { control: false, table: { category: 'Value' } },
    maxValue: { control: false, table: { category: 'Value' } },
    isDateUnavailable: { control: false, table: { category: 'Value' } },
    focusedValue: { control: false, table: { category: 'Value' } },
    defaultFocusedValue: { control: false, table: { category: 'Value' } },
    visibleDuration: { control: 'object', table: { category: 'Calendar' } },
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
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

/** The arrows, React Aria's previous and next buttons, each in its 48dp slot. */
function Arrows() {
  return (
    <div className="calendar-nav-arrows">
      <span className="calendar-arrow-slot">
        <IconButton slot="previous" aria-label="Previous month" aria-keyshortcuts="PageUp">
          <Icon name="chevron_left" className="rtl:icon-mirrored" />
        </IconButton>
      </span>
      <span className="calendar-arrow-slot">
        <IconButton slot="next" aria-label="Next month" aria-keyshortcuts="PageDown">
          <Icon name="chevron_right" className="rtl:icon-mirrored" />
        </IconButton>
      </span>
    </div>
  )
}

/**
 * The modal date picker's calendar, pieced from the parts as `DatePicker` pieces it: the month and
 * year's `CalendarMenuButton` and the arrows, over the `CalendarWeekdays`, the `CalendarPage` the
 * arrows slide, holding the `CalendarGrid` of the month, and the `CalendarYearPicker` the menu
 * button opens over them.
 */
export const Playground: Story = {
  render: (args) => (
    <Calendar {...args}>
      <div className="calendar-nav">
        <CalendarMenuButton />
        <Arrows />
      </div>
      <div className="calendar-body">
        <div className="calendar-days">
          <CalendarWeekdays>
            {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
          </CalendarWeekdays>
          <CalendarPage>
            <CalendarGrid>
              <CalendarGridBody>{(date) => <CalendarCell date={date} />}</CalendarGridBody>
            </CalendarGrid>
          </CalendarPage>
        </div>
        <CalendarYearPicker />
      </div>
    </Calendar>
  ),
}

/**
 * React Aria's own anatomy, drawn by the M3 parts: a `CalendarGrid` given a function draws its
 * `CalendarGridHeader` of `CalendarHeaderCell`s and its `CalendarGridBody` of `CalendarCell`s,
 * under a `CalendarHeading` between the arrows. The days of the months around show at 38%.
 */
export const Anatomy: Story = {
  render: (args) => (
    <Calendar {...args}>
      <div className="flex items-center justify-between px-space-150">
        <IconButton slot="previous" aria-label="Previous month">
          <Icon name="chevron_left" className="rtl:icon-mirrored" />
        </IconButton>
        <CalendarHeading className="p-0" />
        <IconButton slot="next" aria-label="Next month">
          <Icon name="chevron_right" className="rtl:icon-mirrored" />
        </IconButton>
      </div>
      <div className="px-space-150">
        <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
      </div>
    </Calendar>
  ),
}

/**
 * A menu button for each picker, as the docked date picker has them: the month's opens the
 * `CalendarMonthPicker`, the spec's month menu, and the year's the `CalendarYearPicker`. Their
 * labels are the caller's, from the state React Aria's Calendar hands its children.
 */
export const MonthAndYearMenus: Story = {
  render: function MonthAndYearMenus(args) {
    const month = useDateFormatter({ month: 'short' })
    const year = useDateFormatter({ year: 'numeric' })
    return (
      <Calendar {...args}>
        {({ state }) => {
          const shown = state.visibleRange.start.toDate(state.timeZone)
          return (
            <>
              <div className="calendar-nav gap-space-100">
                <CalendarMenuButton picker="month">{month.format(shown)}</CalendarMenuButton>
                <CalendarMenuButton picker="year">{year.format(shown)}</CalendarMenuButton>
                <Arrows />
              </div>
              <div className="calendar-body">
                <div className="calendar-days">
                  <CalendarWeekdays>
                    {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                  </CalendarWeekdays>
                  <CalendarPage>
                    <CalendarGrid>
                      <CalendarGridBody>{(date) => <CalendarCell date={date} />}</CalendarGridBody>
                    </CalendarGrid>
                  </CalendarPage>
                </div>
                <CalendarMonthPicker />
                <CalendarYearPicker />
              </div>
            </>
          )
        }}
      </Calendar>
    )
  },
}
