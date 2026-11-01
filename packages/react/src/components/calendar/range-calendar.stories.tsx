import {
  CalendarDate,
  getLocalTimeZone,
  GregorianCalendar,
  parseDate,
  startOfWeek,
  today,
  type AnyCalendarDate,
  type Calendar as ICalendar,
} from '@internationalized/date'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { useDateFormatter } from 'react-aria'
import {
  ButtonContext,
  I18nProvider,
  Text,
  useSlottedContext,
  type DateValue,
  type RangeValue,
} from 'react-aria-components'
import { Button } from '../button'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarMenuButton,
  CalendarMonthPicker,
  CalendarMonths,
  CalendarPage,
  CalendarWeekdays,
  CalendarYearPicker,
  RangeCalendar,
} from '.'

/* The stories of React Aria's RangeCalendar page (https://react-aria.adobe.com/RangeCalendar),
 * each pieced from the M3 parts: the same values, bounds and display options, drawn as the M3
 * date pickers draw a calendar. */

// Every prop of RangeCalendar, React Aria's RangeCalendar's, but its event handlers: the docgen
// reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/RangeCalendar',
  component: RangeCalendar,
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
    CalendarMonths,
  },
  parameters: { layout: 'centered' },
  args: {
    'aria-label': 'Trip dates',
    defaultValue: { start: parseDate('2025-02-03'), end: parseDate('2025-02-12') },
    className: 'w-90',
  },
  argTypes: {
    children: { control: false, table: { category: 'Parts' } },
    value: { control: false, table: { category: 'Value' } },
    defaultValue: { control: false, table: { category: 'Value' } },
    minValue: { control: false, table: { category: 'Value' } },
    maxValue: { control: false, table: { category: 'Value' } },
    isDateUnavailable: { control: false, table: { category: 'Value' } },
    allowsNonContiguousRanges: { control: 'boolean', table: { category: 'Value' } },
    commitBehavior: {
      control: 'inline-radio',
      options: ['select', 'clear', 'reset'],
      table: { category: 'Value' },
    },
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
    weeksInMonth: { control: 'number', table: { category: 'Calendar' } },
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
} satisfies Meta<typeof RangeCalendar>

export default meta
type Story = StoryObj<typeof meta>

/** React Aria's previous or next button in its 48dp slot, named as React Aria names it. */
function Arrow({ slot }: { slot: 'previous' | 'next' }) {
  const ariaLabel = useSlottedContext(ButtonContext, slot)?.['aria-label'] ?? ''
  return (
    <span className="calendar-arrow-slot">
      <IconButton slot={slot} aria-label={ariaLabel}>
        <Icon
          name={slot === 'previous' ? 'chevron_left' : 'chevron_right'}
          className="rtl:icon-mirrored"
        />
      </IconButton>
    </span>
  )
}

/** The arrows at the end of the navigation row. */
function Arrows() {
  return (
    <div className="calendar-nav-arrows">
      <Arrow slot="previous" />
      <Arrow slot="next" />
    </div>
  )
}

/** The day of week labels over the page of the month the arrows turn. */
function Days() {
  return (
    <div className="calendar-days">
      <CalendarWeekdays>{(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}</CalendarWeekdays>
      <CalendarPage>
        <CalendarGrid>
          <CalendarGridBody>{(date) => <CalendarCell date={date} />}</CalendarGridBody>
        </CalendarGrid>
      </CalendarPage>
    </div>
  )
}

/** A month a page, as the modal date picker's calendar: the month and year's menu button and the
 * arrows over the days, and the years the button opens over them. */
function Paged() {
  return (
    <>
      <div className="calendar-nav">
        <CalendarMenuButton />
        <Arrows />
      </div>
      <div className="calendar-body">
        <Days />
        <CalendarYearPicker />
      </div>
    </>
  )
}

/**
 * React Aria's RangeCalendar, a month a page, pieced as the modal date picker's calendar is: the
 * first day pressed starts the range and the second ends it, and the band runs between them.
 * `commitBehavior` says what a range only started becomes as the focus leaves the calendar.
 */
export const Playground: Story = {
  render: (args) => (
    <RangeCalendar {...args}>
      <Paged />
    </RangeCalendar>
  ),
}

/**
 * React Aria's `value` and `onChange`: the range is a `{ start, end }` of `CalendarDate`s from
 * `@internationalized/date`, written out here by React Aria's `useDateFormatter`.
 */
export const Value: Story = {
  render: function Value(args) {
    const [range, setRange] = useState<RangeValue<DateValue>>({
      start: parseDate('2025-02-03'),
      end: parseDate('2025-02-12'),
    })
    const formatter = useDateFormatter({ dateStyle: 'long' })
    return (
      <div className="flex flex-col items-center gap-space-200">
        <RangeCalendar {...args} value={range} onChange={setRange}>
          <Paged />
        </RangeCalendar>
        <p className="m-0 text-body-md text-on-surface">
          Selected range:{' '}
          {formatter.formatRange(
            range.start.toDate(getLocalTimeZone()),
            range.end.toDate(getLocalTimeZone()),
          )}
        </p>
      </div>
    )
  },
}

/**
 * The calendar system is the locale's, here India's national calendar (`hi-IN-u-ca-indian`) by
 * React Aria's `I18nProvider`: its months, numbers and the days of its weeks. `onChange` is still
 * called with Gregorian dates, the calendar of the `value` or `defaultValue`.
 */
export const InternationalCalendars: Story = {
  render: (args) => (
    <I18nProvider locale="hi-IN-u-ca-indian">
      <RangeCalendar {...args}>
        <Paged />
      </RangeCalendar>
    </I18nProvider>
  ),
}

/**
 * React Aria's `createCalendar` with a calendar of your own: a 4-5-4 fiscal calendar, whose
 * months are four or five weeks from a Sunday, after `@internationalized/date`'s docs.
 */
export const CustomCalendarSystems: Story = {
  args: { firstDayOfWeek: 'sun', createCalendar: () => new Custom454() },
  render: (args) => (
    <RangeCalendar {...args}>
      <Paged />
    </RangeCalendar>
  ),
}

/** The 4-5-4 calendar, as `@internationalized/date`'s docs write it, but for its 53-week years:
 * the docs' compare with the next anchor, not its Sunday, and lose Jan 27 to Feb 2, 2013. */
class Custom454 extends GregorianCalendar {
  // The anchor date, in the Gregorian calendar: a date in the first week of the first month of
  // every fiscal year.
  anchorDate = new CalendarDate(2001, 2, 4)

  private getYear(year: number): [CalendarDate, number[]] {
    const anchor = this.anchorDate.set({ year })
    const startOfYear = startOfWeek(anchor, 'en', 'sun')
    // 53 weeks when the next year starts 53 weeks on, at its own anchor's Sunday.
    const nextYear = startOfWeek(anchor.add({ years: 1 }), 'en', 'sun')
    const isBigYear = !startOfYear.add({ weeks: 53 }).compare(nextYear)
    const weekPattern = [4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5, isBigYear ? 5 : 4]
    return [startOfYear, weekPattern]
  }

  getDaysInMonth(date: AnyCalendarDate): number {
    const [, weekPattern] = this.getYear(date.year)
    return weekPattern[date.month - 1]! * 7
  }

  fromJulianDay(jd: number): CalendarDate {
    const gregorian = super.fromJulianDay(jd)
    let year = gregorian.year
    let [monthStart, weekPattern] = this.getYear(year)
    if (gregorian.compare(monthStart) < 0) {
      year--
      ;[monthStart, weekPattern] = this.getYear(year)
    }
    for (let month = 1; month <= 12; month++) {
      const nextMonth = monthStart.add({ weeks: weekPattern[month - 1]! })
      if (nextMonth.compare(gregorian) > 0) {
        const days = gregorian.compare(monthStart)
        return new CalendarDate(this, year, month, days + 1)
      }
      monthStart = nextMonth
    }
    throw new Error('date not found')
  }

  toJulianDay(date: AnyCalendarDate): number {
    const [start, weekPattern] = this.getYear(date.year)
    let monthStart = start
    for (let month = 1; month < date.month; month++) {
      monthStart = monthStart.add({ weeks: weekPattern[month - 1]! })
    }
    return super.toJulianDay(monthStart.add({ days: date.day - 1 }))
  }

  getFormattableMonth(date: AnyCalendarDate): CalendarDate {
    const anchorMonth = this.anchorDate.month - 1
    const dateMonth = date.month - 1
    const month = ((anchorMonth + dateMonth) % 12) + 1
    const year = anchorMonth + dateMonth >= 12 ? date.year + 1 : date.year
    return new CalendarDate(year, month, 1)
  }

  isEqual(other: ICalendar): boolean {
    return other instanceof Custom454 && other.anchorDate.compare(this.anchorDate) === 0
  }
}

/**
 * The bounds and the days that can't be picked: none before today, the days `isDateUnavailable`
 * strikes out, and none more than a week from the day pressed first, its `anchorDate`. A range
 * over a struck out day needs `allowsNonContiguousRanges`, and the band breaks at it. A range
 * longer than a week is `isInvalid`, drawn in the error colors, and React Aria's `Text` in the
 * `errorMessage` slot says why.
 */
export const Validation: Story = {
  render: function Validation(args) {
    const now = today(getLocalTimeZone())
    const [range, setRange] = useState({ start: now.add({ days: 6 }), end: now.add({ days: 14 }) })
    const disabledRanges = [
      [now, now.add({ days: 5 })],
      [now.add({ days: 15 }), now.add({ days: 17 })],
      [now.add({ days: 23 }), now.add({ days: 24 })],
    ] as const
    const isInvalid = range.end.compare(range.start) > 7
    return (
      <RangeCalendar
        {...args}
        defaultValue={undefined}
        value={range}
        onChange={setRange}
        minValue={now}
        isDateUnavailable={(date, anchorDate) =>
          (!!anchorDate && Math.abs(date.compare(anchorDate)) > 7) ||
          disabledRanges.some(([start, end]) => date.compare(start) >= 0 && date.compare(end) <= 0)
        }
        isInvalid={isInvalid}
      >
        <Paged />
        {isInvalid && <Text slot="errorMessage">Maximum stay duration is 1 week</Text>}
      </RangeCalendar>
    )
  },
}

/**
 * Two months side by side, by React Aria's `visibleDuration`, each a `CalendarGrid` offset from
 * the first under its `CalendarHeading`, on one page the arrows turn: by both months unless
 * `pageBehavior` is `single`. `firstDayOfWeek` and `weeksInMonth` set what the locale would.
 */
export const DisplayOptions: Story = {
  args: { visibleDuration: { months: 2 }, className: 'w-180' },
  render: (args) => {
    const months = args.visibleDuration?.months ?? 1
    return (
      <RangeCalendar {...args}>
        <div className="calendar-nav">
          <Arrows />
        </div>
        <div className="calendar-days">
          <CalendarPage className="flex gap-space-300">
            {Array.from({ length: months }, (_, i) => (
              <div key={i} className="min-w-0 flex-1">
                <CalendarHeading offset={{ months: i }} />
                <CalendarGrid offset={{ months: i }}>
                  {(date) => <CalendarCell date={date} />}
                </CalendarGrid>
              </div>
            ))}
          </CalendarPage>
        </div>
      </RangeCalendar>
    )
  },
}

/**
 * React Aria's `focusedValue` and `onFocusChange`: the day focused, whose month is the one shown,
 * here moved to today by a button of the caller's.
 */
export const ControllingTheFocusedDate: Story = {
  render: function ControllingTheFocusedDate(args) {
    const [focusedDate, setFocusedDate] = useState(new CalendarDate(2021, 7, 1))
    return (
      <div className="flex flex-col items-center gap-space-200">
        <Button variant="outlined" onPress={() => setFocusedDate(today(getLocalTimeZone()))}>
          Today
        </Button>
        <RangeCalendar
          {...args}
          defaultValue={undefined}
          focusedValue={focusedDate}
          onFocusChange={setFocusedDate}
        >
          <Paged />
        </RangeCalendar>
      </div>
    )
  },
}

/**
 * A menu button for each of React Aria's pickers: the month's opens the `CalendarMonthPicker`, the
 * spec's month menu, and the year's the `CalendarYearPicker`, over the days. Their labels are the
 * caller's, from the state React Aria's RangeCalendar hands its children.
 */
export const MonthAndYearPickers: Story = {
  render: function MonthAndYearPickers(args) {
    const month = useDateFormatter({ month: 'short' })
    const year = useDateFormatter({ year: 'numeric' })
    return (
      <RangeCalendar {...args}>
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
                <Days />
                <CalendarMonthPicker />
                <CalendarYearPicker />
              </div>
            </>
          )
        }}
      </RangeCalendar>
    )
  },
}

/**
 * The range date picker's calendar, as Compose's: the `CalendarWeekdays` once over the
 * `CalendarMonths`, the 24 months of React Aria's `visibleDuration` in a column that scrolls,
 * each under its `CalendarHeading`, scrolled to the range as they mount.
 */
export const ScrollingMonths: Story = {
  args: {
    defaultValue: { start: parseDate('2025-08-17'), end: parseDate('2025-08-23') },
    visibleDuration: { months: 24 },
    className: 'h-140 w-90',
  },
  render: (args) => (
    <RangeCalendar {...args}>
      <CalendarWeekdays>{(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}</CalendarWeekdays>
      <CalendarMonths />
    </RangeCalendar>
  ),
}
