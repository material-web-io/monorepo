import { CalendarDate, parseDate } from '@internationalized/date'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ReactNode } from 'react'
import { Text } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarMenuButton,
  CalendarMonthPicker,
  CalendarMonths,
  CalendarPage,
  CalendarWeekdays,
  CalendarYearPicker,
  RangeCalendar,
  type CalendarProps,
  type RangeCalendarProps,
} from '.'

/* Markup and behavior of the calendar's parts that jsdom can check without a stylesheet: what they
 * draw, their menus and keys. The date pickers pieced from them: date-picker.test.tsx. */

const august17 = parseDate('2025-08-17')
const range = { start: august17, end: parseDate('2025-08-23') }

/** The day cell named by its date, as React Aria names one: the one in its own month, where a
 * range shows the months around too. */
const day = (name: RegExp, scope: HTMLElement = document.body) => {
  const cells = within(scope).getAllByRole('button', { name })
  return cells.find((cell) => !cell.hasAttribute('aria-disabled')) ?? cells[0]!
}
/** What is away, under a picker open over it: inert. */
const away = (el: HTMLElement) => el.closest('[inert]')

/** The years the pickers show, ten each side of 2025: the 201 of the component's own window
 * are React Aria options each, and the whole list is drawn again on every press. */
const years = 21

/** A calendar pieced from the parts, as a caller pieces one: two menu buttons, the arrows, the
 * page and both pickers. */
function Pieced(props: Partial<CalendarProps<CalendarDate>>) {
  return (
    <Calendar aria-label="Event date" defaultValue={august17} {...props}>
      <CalendarMenuButton picker="month">Month</CalendarMenuButton>
      <CalendarMenuButton>Year</CalendarMenuButton>
      <IconButton slot="previous" aria-label="Back">
        <Icon name="chevron_left" />
      </IconButton>
      <IconButton slot="next" aria-label="Forward">
        <Icon name="chevron_right" />
      </IconButton>
      <CalendarPage>
        <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
      </CalendarPage>
      <CalendarMonthPicker />
      <CalendarYearPicker visibleYears={years} />
    </Calendar>
  )
}

describe('Calendar', () => {
  it('is React Aria’s Calendar, drawing its children as written: a grid given a function draws its weekdays and days', () => {
    render(
      <Calendar aria-label="Event date" defaultValue={august17}>
        <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
      </Calendar>,
    )
    const calendar = screen.getByRole('application', { name: /Event date/ })
    expect(calendar.tagName).toBe('DIV')
    const grid = screen.getByRole('grid', { name: /August 2025/ })
    expect(screen.getAllByRole('gridcell')).toHaveLength(42)
    // The column headers are React Aria's, hidden from assistive technology as it has them.
    expect(grid.querySelectorAll('thead th')).toHaveLength(7)
    expect(grid.querySelector('thead')).toHaveAttribute('aria-hidden', 'true')
    expect(grid.querySelector('thead')!.textContent).toBe('SMTWTFS')
    expect(day(/August 17, 2025/)).toHaveTextContent('17')
  })

  it('draws a day’s own children over its ripple', () => {
    render(
      <Calendar aria-label="Event date" defaultValue={august17}>
        <CalendarGrid>
          <CalendarGridBody>
            {(date) => (
              <CalendarCell date={date}>
                {({ formattedDate, isSelected }) =>
                  isSelected ? `${formattedDate}!` : formattedDate
                }
              </CalendarCell>
            )}
          </CalendarGridBody>
        </CalendarGrid>
      </Calendar>,
    )
    expect(day(/August 17, 2025/)).toHaveTextContent('17!')
    expect(screen.getByRole('grid').querySelector('thead')).toBeNull()
  })

  it('pages with the buttons in React Aria’s previous and next slots, which stop at the bounds', async () => {
    const user = userEvent.setup()
    render(<Pieced maxValue={parseDate('2025-09-30')} />)
    await user.click(screen.getByRole('button', { name: 'Forward' }))
    expect(screen.getByRole('grid', { name: /September 2025/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Forward' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('grid', { name: /August 2025/ })).toBeInTheDocument()
  })

  it('opens each picker from its menu button, the page out of reach meanwhile, and shows the month chosen', async () => {
    const user = userEvent.setup()
    render(<Pieced />)
    const month = screen.getByRole('button', { name: 'Month' })
    expect(month).toHaveAttribute('aria-haspopup', 'listbox')
    await user.click(month)
    expect(month).toHaveAttribute('aria-expanded', 'true')
    expect(away(screen.getByRole('grid', { hidden: true }))).not.toBeNull()
    const list = screen.getByRole('listbox', { name: 'month' })
    const options = within(list).getAllByRole('option')
    expect(options).toHaveLength(12)
    // Named by the month alone: the check is hidden from assistive technology.
    expect(options[0]).toHaveAccessibleName('January')
    expect(within(list).getByRole('option', { name: 'August' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(within(list).getByRole('option', { name: 'October' }))
    await waitFor(() => expect(month).toHaveFocus())
    expect(month).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('grid', { name: /October 2025/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Year' }))
    await user.click(
      within(screen.getByRole('listbox', { name: 'year' })).getByRole('option', { name: '2027' }),
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Year' })).toHaveFocus())
    expect(screen.getByRole('grid', { name: /October 2027/ })).toBeInTheDocument()
  })

  it('closes each picker on the month or year shown chosen again, by a press or Enter', async () => {
    const user = userEvent.setup()
    render(<Pieced />)
    const month = screen.getByRole('button', { name: 'Month' })
    await user.click(month)
    await user.click(screen.getByRole('option', { name: 'August' }))
    await waitFor(() => expect(month).toHaveFocus())
    expect(month).toHaveAttribute('aria-expanded', 'false')
    const year = screen.getByRole('button', { name: 'Year' })
    await user.click(year)
    // The list takes the focus on its chosen year as it opens.
    await waitFor(() => expect(screen.getByRole('option', { name: '2025' })).toHaveFocus())
    await user.keyboard('{Enter}')
    await waitFor(() => expect(year).toHaveFocus())
    expect(year).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('grid', { name: /August 2025/ })).toBeInTheDocument()
  })

  it('sends Shift+M to the months’ button and Shift+Y to the years’, or both to the one there is', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Pieced autoFocus />)
    await user.keyboard('{Shift>}Y{/Shift}')
    expect(screen.getByRole('button', { name: 'Year' })).toHaveFocus()
    await user.keyboard('{Shift>}M{/Shift}')
    expect(screen.getByRole('button', { name: 'Month' })).toHaveFocus()
    unmount()
    render(
      <Calendar aria-label="Event date" defaultValue={august17} autoFocus>
        <CalendarMenuButton />
        <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
      </Calendar>,
    )
    await user.keyboard('{Shift>}M{/Shift}')
    expect(screen.getByRole('button', { name: 'August 2025' })).toHaveFocus()
  })

  it('takes Shift+M and Shift+Y by the letter typed, or by the key’s place on a layout without Latin letters', () => {
    render(<Pieced autoFocus />)
    const shift = (key: string, code: string) =>
      fireEvent.keyDown(document.activeElement!, { key, code, shiftKey: true })
    // Russian: Н and Ь are where Y and M are on a US keyboard.
    shift('Н', 'KeyY')
    expect(screen.getByRole('button', { name: 'Year' })).toHaveFocus()
    shift('Ь', 'KeyM')
    expect(screen.getByRole('button', { name: 'Month' })).toHaveFocus()
    // German: Z is where Y is on a US keyboard, and Y where Z is.
    shift('Z', 'KeyY')
    expect(screen.getByRole('button', { name: 'Month' })).toHaveFocus()
    shift('Y', 'KeyZ')
    expect(screen.getByRole('button', { name: 'Year' })).toHaveFocus()
    // Caps Lock on: Shift types the letters in lower case.
    shift('m', 'KeyM')
    expect(screen.getByRole('button', { name: 'Month' })).toHaveFocus()
    shift('y', 'KeyY')
    expect(screen.getByRole('button', { name: 'Year' })).toHaveFocus()
  })

  it('heads its grids once with CalendarWeekdays, hidden from assistive technology', () => {
    render(
      <Calendar aria-label="Event date" defaultValue={august17} firstDayOfWeek="mon">
        <CalendarWeekdays weekdayStyle="short">
          {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
        </CalendarWeekdays>
        <CalendarGrid>
          <CalendarGridHeader>
            {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
          </CalendarGridHeader>
          <CalendarGridBody>{(date) => <CalendarCell date={date} />}</CalendarGridBody>
        </CalendarGrid>
      </Calendar>,
    )
    const row = document.querySelector('table[aria-hidden]')!
    expect([...row.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ])
    expect(screen.getByRole('grid').querySelector('thead')!.textContent).toBe('MTWTFSS')
  })
})

describe('RangeCalendar', () => {
  it('is React Aria’s RangeCalendar, its grids by offset, each under its CalendarHeading', () => {
    render(
      <RangeCalendar aria-label="Dates" defaultValue={range} visibleDuration={{ months: 3 }}>
        {[0, 1, 2].map((i) => (
          <section key={i}>
            <CalendarHeading offset={{ months: i }} />
            <CalendarGrid offset={{ months: i }}>
              {(date) => <CalendarCell date={date} />}
            </CalendarGrid>
          </section>
        ))}
      </RangeCalendar>,
    )
    expect(screen.getByRole('application', { name: /Dates/ })).toBeInTheDocument()
    expect(screen.getAllByRole('grid')).toHaveLength(3)
    // A heading names each month, over React Aria's own hidden one of the whole range.
    const headings = screen.getAllByRole('heading', { hidden: true }).map((it) => it.textContent)
    expect(headings.slice(1)).toEqual(['July 2025', 'August 2025', 'September 2025'])
  })

  it('draws the months of its visible range in CalendarMonths, each under its heading, in the column it takes the props of', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <RangeCalendar aria-label="Dates" defaultValue={range} visibleDuration={{ months: 3 }}>
        <CalendarMonths ref={ref} className="h-40" />
      </RangeCalendar>,
    )
    expect(months()).toEqual(['July 2025', 'August 2025', 'September 2025'])
    expect(screen.getAllByRole('grid')).toHaveLength(3)
    expect(ref.current).toHaveClass('calendar-months', 'h-40')
    for (const grid of screen.getAllByRole('grid')) expect(ref.current).toContainElement(grid)
  })

  it('turns its months side by side on one page, by all of them, or by one with pageBehavior single', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<PiecedRange months={2} />)
    expect(months()).toEqual(['August 2025', 'September 2025'])
    await user.click(screen.getByRole('button', { name: 'Forward' }))
    expect(months()).toEqual(['October 2025', 'November 2025'])
    unmount()
    render(<PiecedRange months={2} pageBehavior="single" />)
    await user.click(screen.getByRole('button', { name: 'Forward' }))
    expect(months()).toEqual(['September 2025', 'October 2025'])
  })

  it('opens the month and year pickers over its days, and shows the month or year chosen, the range kept', async () => {
    const user = userEvent.setup()
    render(<PiecedRange />)
    const month = screen.getByRole('button', { name: 'Month' })
    await user.click(month)
    expect(away(screen.getByRole('grid', { hidden: true }))).not.toBeNull()
    await user.click(
      within(screen.getByRole('listbox', { name: 'month' })).getByRole('option', {
        name: 'October',
      }),
    )
    await waitFor(() => expect(month).toHaveFocus())
    expect(months()).toEqual(['October 2025'])
    await user.click(screen.getByRole('button', { name: 'Year' }))
    await user.click(
      within(screen.getByRole('listbox', { name: 'year' })).getByRole('option', { name: '2024' }),
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Year' })).toHaveFocus())
    expect(months()).toEqual(['October 2024'])
    // Back to the range's month, its ends still selected.
    await user.click(screen.getByRole('button', { name: 'Year' }))
    await user.click(screen.getByRole('option', { name: '2025' }))
    await user.click(month)
    await user.click(screen.getByRole('option', { name: 'August' }))
    await waitFor(() => expect(month).toHaveFocus())
    for (const name of [/August 17, 2025/, /August 23, 2025/])
      expect(day(name).closest('td')).toHaveAttribute('aria-selected', 'true')
  })

  it('names the days of an invalid range invalid, described by React Aria’s Text in the errorMessage slot', () => {
    render(
      <PiecedRange isInvalid>
        <Text slot="errorMessage">Maximum stay duration is 1 week</Text>
      </PiecedRange>,
    )
    expect(screen.getByRole('application')).toHaveAttribute('data-invalid', 'true')
    for (const name of [/August 17, 2025/, /August 20, 2025/, /August 23, 2025/]) {
      expect(day(name)).toHaveAttribute('aria-invalid', 'true')
      expect(day(name)).toHaveAccessibleDescription(/Maximum stay duration is 1 week/)
    }
    expect(day(/August 24, 2025/)).not.toHaveAttribute('aria-invalid')
  })
})

/** A range calendar pieced as the RangeCalendar stories piece one: two menu buttons, the arrows,
 * the page of its `months` side by side under their headings, both pickers and `children`. */
function PiecedRange({
  months = 1,
  children,
  ...props
}: Partial<RangeCalendarProps<CalendarDate>> & { months?: number; children?: ReactNode }) {
  return (
    <RangeCalendar
      aria-label="Trip dates"
      defaultValue={range}
      visibleDuration={{ months }}
      {...props}
    >
      <CalendarMenuButton picker="month">Month</CalendarMenuButton>
      <CalendarMenuButton>Year</CalendarMenuButton>
      <IconButton slot="previous" aria-label="Back">
        <Icon name="chevron_left" />
      </IconButton>
      <IconButton slot="next" aria-label="Forward">
        <Icon name="chevron_right" />
      </IconButton>
      <CalendarPage>
        {Array.from({ length: months }, (_, i) => (
          <section key={i}>
            <CalendarHeading offset={{ months: i }} />
            <CalendarGrid offset={{ months: i }}>
              {(date) => <CalendarCell date={date} />}
            </CalendarGrid>
          </section>
        ))}
      </CalendarPage>
      <CalendarMonthPicker />
      <CalendarYearPicker visibleYears={years} />
      {children}
    </RangeCalendar>
  )
}

/** The months shown, by their headings, past React Aria's own hidden one of the whole range. */
const months = () =>
  screen
    .getAllByRole('heading', { hidden: true })
    .slice(1)
    .map((it) => it.textContent)
