import { getLocalTimeZone, parseDate, today, type CalendarDate } from '@internationalized/date'
import { render, screen, within } from '@testing-library/react'
import { type ReactNode } from 'react'
import { Text } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  computedColor,
  contrastRatio,
  press,
  rgba,
  schemes,
  settle,
  useForcedColors,
} from '../../test-browser'
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
  RangeCalendar,
  type RangeCalendarProps,
} from '.'

/* What the calendar's parts draw beyond the date pickers' (date-picker.browser.test.tsx), with the
 * real stylesheet: React Aria's RangeCalendar invalid, its error text, and its months side by
 * side, and the month menu's check. Markup and behavior: calendar.test.tsx. */

const range = { start: parseDate('2025-08-17'), end: parseDate('2025-08-23') }

beforeEach(() => {
  document.documentElement.dataset.theme = 'light'
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(() => {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.contrast
  document.body.style.background = ''
})

const color = (role: string) => computedColor(`var(--md-sys-color-${role})`, document.body)

/** Checks that a computed color is a role's. */
function expectRole(actual: string, role: string) {
  expect(rgba(actual), role).toEqual(rgba(color(role)))
}

const rect = (el: Element) => el.getBoundingClientRect()
const style = (el: Element, pseudo?: string) => getComputedStyle(el, pseudo)
/** The day cell named by its date, as React Aria names one. */
const day = (name: RegExp) => screen.getAllByRole('button', { name })[0]!
/** What a band is drawn by: its day's cell's `::before`. */
const band = (name: RegExp) => style(day(name).closest('td')!, '::before')

type RangeProps = Partial<RangeCalendarProps<CalendarDate>> & { children?: ReactNode }

/** A month a page, 360dp wide, as the date picker's calendar lays it out, then `children`. */
function Range({ children, ...props }: RangeProps) {
  return (
    <RangeCalendar aria-label="Trip dates" defaultValue={range} className="w-90" {...props}>
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
      {children}
    </RangeCalendar>
  )
}

describe('RangeCalendar in a browser', () => {
  it('draws an invalid range in the error colors: its ends filled with error, the band error-container under on-error-container days', async () => {
    render(<Range isInvalid />)
    await settle()
    for (const name of [/August 17, 2025/, /August 23, 2025/]) {
      expectRole(style(day(name)).backgroundColor, 'error')
      expectRole(style(day(name)).color, 'on-error')
    }
    const between = day(/August 20, 2025/)
    expect(rgba(style(between).backgroundColor)[3]).toBe(0)
    expectRole(style(between).color, 'on-error-container')
    expectRole(band(/August 20, 2025/).backgroundColor, 'error-container')
    expectRole(band(/August 17, 2025/).backgroundColor, 'error-container')
    // Past the range, the days are as they are in a valid one.
    expectRole(style(day(/August 24, 2025/)).color, 'on-surface')
  })

  it('rings today in error at an end of an invalid range, and in primary at a valid one’s', async () => {
    const now = today(getLocalTimeZone())
    const { unmount } = render(
      <Range defaultValue={{ start: now, end: now.add({ days: 2 }) }} isInvalid />,
    )
    await settle()
    const ring = (cell: Element) => style(cell).borderTopColor
    expectRole(ring(screen.getByRole('button', { name: /Today/ })), 'error')
    unmount()
    render(<Range defaultValue={{ start: now, end: now.add({ days: 2 }) }} />)
    await settle()
    expectRole(ring(screen.getByRole('button', { name: /Today/ })), 'primary')
  })

  it('keeps 4.5:1 between an invalid range’s days and what they are drawn on in every scheme', async () => {
    render(<Range isInvalid />)
    for (const [theme, contrast] of schemes) {
      document.documentElement.dataset.theme = theme
      if (contrast === 'standard') delete document.documentElement.dataset.contrast
      else document.documentElement.dataset.contrast = contrast
      await settle()
      const end = day(/August 17, 2025/)
      const scheme = `${theme} ${contrast}`
      expect(
        contrastRatio(style(end).color, style(end).backgroundColor),
        `${scheme} end`,
      ).toBeGreaterThanOrEqual(4.5)
      const between = day(/August 20, 2025/)
      expect(
        contrastRatio(style(between).color, band(/August 20, 2025/).backgroundColor),
        `${scheme} between`,
      ).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('writes React Aria’s error text body-small in error, 24dp in and 4dp under the days', async () => {
    render(
      <Range isInvalid>
        <Text slot="errorMessage">Maximum stay duration is 1 week</Text>
      </Range>,
    )
    await settle()
    const text = screen.getByText('Maximum stay duration is 1 week')
    const calendar = screen.getByRole('application')
    expectRole(style(text).color, 'error')
    expect(style(text).fontSize).toBe('12px')
    expect(style(text).lineHeight).toBe('16px')
    expect(rect(text).left).toBe(rect(calendar).left)
    expect(style(text).paddingInlineStart).toBe('24px')
    expect(style(text).paddingTop).toBe('4px')
    expect(rect(text).top).toBe(rect(text.previousElementSibling!).bottom)
  })

  it('grows its page to hold its months side by side under their headings, six weeks tall at least', async () => {
    render(
      <RangeCalendar
        aria-label="Trip dates"
        defaultValue={range}
        visibleDuration={{ months: 2 }}
        className="w-180"
      >
        <div className="calendar-days">
          <CalendarPage className="flex">
            {[0, 1].map((i) => (
              <div key={i} className="min-w-0 flex-1">
                <CalendarHeading offset={{ months: i }} />
                <CalendarGrid offset={{ months: i }}>
                  {(date) => <CalendarCell date={date} />}
                </CalendarGrid>
              </div>
            ))}
          </CalendarPage>
        </div>
      </RangeCalendar>,
    )
    await settle()
    const [august, september] = screen.getAllByRole('grid')
    const page = august!.closest('.calendar-page')!
    // Side by side, each in half the page.
    expect(rect(august!).top).toBe(rect(september!).top)
    expect(rect(august!).right).toBeLessThanOrEqual(rect(september!).left)
    // A heading, the weekdays and August's six weeks, taller than six weeks' rows alone.
    expect(rect(page).height).toBe(48 + 48 + 6 * 48)
    expect(rect(page).bottom).toBe(rect(august!).bottom)
  })

  describe('in forced colors', () => {
    useForcedColors()

    it('fills an invalid range’s ends with the highlight, as a valid one’s', async () => {
      render(<Range isInvalid />)
      await settle()
      const end = day(/August 17, 2025/)
      expect(style(end).backgroundColor).toBe(computedColor('Highlight', document.body))
      expect(style(end).color).toBe(computedColor('HighlightText', document.body))
      expect(band(/August 20, 2025/).backgroundColor).toBe(
        computedColor('Highlight', document.body),
      )
    })
  })
})

describe('CalendarMonthPicker in a browser', () => {
  it('checks the chosen month alone, its check hidden with an ancestor hidden', async () => {
    render(
      <div data-testid="ancestor">
        <Calendar aria-label="Event date" defaultValue={parseDate('2025-08-17')} className="w-90">
          <div className="calendar-nav">
            <CalendarMenuButton picker="month">Months</CalendarMenuButton>
          </div>
          <div className="calendar-body">
            <div className="calendar-days">
              <CalendarPage>
                <CalendarGrid>{(date) => <CalendarCell date={date} />}</CalendarGrid>
              </CalendarPage>
            </div>
            <CalendarMonthPicker />
          </div>
        </Calendar>
      </div>,
    )
    press(screen.getByRole('button', { name: /^Months/ }))
    const months = await screen.findByRole('listbox')
    await settle()
    const check = (name: string) =>
      within(months).getByRole('option', { name }).querySelector('.font-icon')!
    const august = check('August')
    expect(style(august).visibility).toBe('visible')
    expect(style(check('July')).visibility).toBe('hidden')
    screen.getByTestId('ancestor').style.visibility = 'hidden'
    expect(style(august).visibility).toBe('hidden')
  })
})
