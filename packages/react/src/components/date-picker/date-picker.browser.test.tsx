import { parseDate, type CalendarDate } from '@internationalized/date'
import { render, screen, waitFor, within } from '@testing-library/react'
import { useState, type ReactElement } from 'react'
import { DialogTrigger, Heading, I18nProvider, type RangeValue } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  computedColor,
  computedRadius,
  contrastRatio,
  expectHitArea,
  press,
  pressAsViewTransitionStarts,
  rgba,
  schemes,
  settle,
  springDuration,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { AppBar } from '../app-bar'
import { Button } from '../button'
import { Dialog } from '../dialog'
import { IconButton } from '../icon-button'
import { Icon } from '../icon'
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
  type DatePickerProps,
  type DatePickerRenderProps,
  type DateRangePickerProps,
} from '.'

/* Everything that needs a real browser and the real stylesheet: the pickers' measurements in
 * their dialog, to the spec's diagrams, their colors and contrast, hit areas, the focus ring,
 * motion and forced colors. Markup, naming and behavior: date-picker.test.tsx. */

const august17 = parseDate('2025-08-17')

/** The mode toggle's name, in English, for the display mode it swaps from. */
const toggleLabel = (displayMode: DatePickerRenderProps['displayMode']) =>
  displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to calendar mode'

/** A date picker's parts, as the README writes them, their text in English. */
const dateParts = ({ displayMode }: DatePickerRenderProps) => (
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
      <DatePickerInput label="Date" />
    </DatePickerContent>
  </>
)

/** A range picker's parts, as the README writes them, their text in English. */
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

/* React Aria portals the dialog to the body, outside any wrapper, so a scheme is put on the
 * document itself here, and the page's surface painted on the body. */
function themeDocument(theme: 'light' | 'dark', contrast: 'standard' | 'medium' | 'high') {
  document.documentElement.dataset.theme = theme
  if (contrast !== 'standard') document.documentElement.dataset.contrast = contrast
}

beforeEach(() => {
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(async () => {
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.contrast
  document.documentElement.removeAttribute('dir')
  document.body.style.background = ''
  await page.viewport(1280, 896)
})

const color = (role: string) => computedColor(`var(--md-sys-color-${role})`, document.body)

/** Checks that a computed color is a role's, at an opacity: one below 1 is rounded on the way. */
function expectRole(actual: string, role: string, opacity = 1) {
  const [r, g, b, a] = rgba(actual)
  const expected = rgba(color(role))
  expect(a / 255, `${role} opacity`).toBeCloseTo(opacity, 2)
  ;[r, g, b].forEach((channel, i) =>
    expect(Math.abs(channel - expected[i]!), `${role} channel ${i}`).toBeLessThanOrEqual(
      opacity === 1 ? 0 : 12,
    ),
  )
}

const rect = (el: Element) => el.getBoundingClientRect()
const style = (el: Element, pseudo?: string) => getComputedStyle(el, pseudo)

/** The picker in its dialog, as the stories piece them, opened by a button. */
function Composed({ children }: { children: ReactElement }) {
  return (
    <DialogTrigger>
      <Button>Open</Button>
      <DatePickerDialog
        clearButton={<Button variant="text">Clear</Button>}
        dismissButton={
          <Button variant="text" slot="close">
            Cancel
          </Button>
        }
        confirmButton={
          <Button variant="text" slot="close">
            OK
          </Button>
        }
      >
        {children}
      </DatePickerDialog>
    </DialogTrigger>
  )
}

type HeldProps = Partial<DatePickerProps<CalendarDate>> & { initial?: CalendarDate | null }

/** The picker, holding the date picked, August 17 unless given, as a caller does until OK. */
function Held({ initial = august17, ...props }: HeldProps) {
  const [value, setValue] = useState<CalendarDate | null>(initial)
  return (
    <DatePicker value={value} onChange={setValue} autoFocus {...props}>
      {props.children ?? dateParts}
    </DatePicker>
  )
}

function Picker(props: HeldProps) {
  return (
    <Composed>
      <Held {...props} />
    </Composed>
  )
}

const dialog = () => screen.getByRole('dialog')
const container = () => dialog().parentElement!
/** The buttons in the open picker by their label, hidden ones too, whose names the queries leave
 * empty. */
const buttons = (name: RegExp) =>
  [...dialog().querySelectorAll<HTMLElement>('[role="button"], button')].filter((it) =>
    name.test(it.getAttribute('aria-label') ?? ''),
  )
/** The day cell named by its date, as React Aria names one, in the open picker: the one in its own
 * month, where a range shows the months around too. */
const day = (name: RegExp) => {
  const cells = buttons(name)
  return cells.find((cell) => !cell.hasAttribute('aria-disabled')) ?? cells[0]!
}
/** A button in the open picker by its label, hidden or not, the first, as React Aria's own visually
 * hidden Next button follows ours; else by its name, from its content. */
const button = (name: string) =>
  buttons(new RegExp(`^${name}$`))[0] ??
  within(dialog()).getByRole('button', { name, hidden: true })
const grid = (name: RegExp = /August 2025/) => within(dialog()).getByRole('grid', { name })
/** The animation of `property`, the one of it in the document. */
const animationOf = (property: string) =>
  document
    .getAnimations()
    .find((it) => property in ((it.effect as KeyframeEffect).getKeyframes()[0] ?? {}))!
/** The resize of the picker's room as it swaps modes, the one animation of a height. */
const resize = () => animationOf('height')
/** The open dialog's heights through a swap's `resize`, paused at each twentieth of its duration
 * with the lift of the dialog's height cap, which runs alongside it for as long. */
function heightsThrough(resize: Animation) {
  const animations = [resize, animationOf('maxHeight')]
  const duration = Number(resize.effect!.getComputedTiming().duration)
  animations.forEach((it) => it.pause())
  return Array.from({ length: 21 }, (_, i) => {
    animations.forEach((it) => (it.currentTime = (duration * i) / 20))
    return rect(container()).height
  })
}

/**
 * Presses a month arrow from inside the page and waits for the browser to have started the slide,
 * once it has captured the page, for a test that reads the slide before it is over.
 */
async function pressToSlide(arrow: HTMLElement) {
  const start = vi.spyOn(document, 'startViewTransition')
  press(arrow)
  await start.mock.results[0]!.value.ready
  start.mockRestore()
}

async function open(element: ReactElement) {
  render(element)
  await userEvent.click(screen.getByRole('button', { name: 'Open' }))
  await settle()
}

describe('DatePicker in a browser', () => {
  it('hides the pane shown with an ancestor hidden', async () => {
    render(
      <div data-testid="ancestor">
        <Held />
      </div>,
    )
    await settle()
    const month = screen.getByRole('grid', { name: /August 2025/ })
    expect(style(month).visibility).toBe('visible')
    screen.getByTestId('ancestor').style.visibility = 'hidden'
    expect(style(month).visibility).toBe('hidden')
  })

  describe('in its dialog', () => {
    it('is a 360dp dialog laid out as Compose’s, as tall as six weeks whatever the month', async () => {
      await open(<Picker initial={parseDate('2025-07-17')} />)
      const panel = rect(container())
      expect(panel.width).toBe(360)
      expect(panel.height).toBe(124 + 56 + 48 + 6 * 48 + 56)
      expect(style(container()).borderRadius).toBe(computedRadius('rounded-shape-xl'))
      const title = rect(within(dialog()).getByText('Select date'))
      expect(title.top - panel.top).toBe(16)
      expect(title.left - panel.left).toBe(24)
      // The headline and the toggle 36dp under the title, centered on each other: the headline's
      // 40dp line and the toggle's 40dp box both 72dp from the top, 12dp above the header's end.
      const text = within(dialog()).getByText('Jul 17, 2025')
      const headline = rect(text)
      expect(headline.top - title.bottom).toBe(36)
      expect([headline.top - panel.top, headline.left - panel.left]).toEqual([72, 24])
      expect(style(text).lineHeight).toBe('40px')
      expectRole(style(text).color, 'on-surface-variant')
      const header = dialog().querySelector('.date-picker-header')!
      expect(rect(header).height).toBe(16 + 20 + 36 + 40 + 12)
      expect(rect(header).bottom - (headline.top + 40)).toBe(12)
      expect(style(header, '::after').borderBottomWidth).toBe('1px')
      expect(style(header, '::after').bottom).toBe('0px')
      expectRole(style(header, '::after').borderBottomColor, 'outline-variant')
      const toggle = rect(button('Switch to text input mode'))
      expect([panel.right - toggle.right, toggle.top - panel.top]).toEqual([16, 72])
      // The menu button, the kit's: a 40dp pill 16dp in, 8dp before its text, which is on the
      // title's line, 8dp to the 18dp arrow and 4dp after, all on-surface-variant.
      const menuButton = button('July 2025')
      const menu = rect(menuButton)
      expect([menu.left - panel.left, menu.top - panel.top, menu.height]).toEqual([16, 124 + 8, 40])
      expect(style(menuButton).paddingLeft).toBe('8px')
      expect(style(menuButton).columnGap).toBe('8px')
      expect(style(menuButton).paddingRight).toBe('4px')
      const arrow = menuButton.querySelector('.font-icon')!
      expect([rect(arrow).width, menu.right - rect(arrow).right]).toEqual([18, 4])
      expectRole(style(menuButton).color, 'on-surface-variant')
      expectRole(style(arrow).color, 'on-surface-variant')
      const next = rect(button('Next'))
      expect(panel.right - next.right).toBe(16)
      const table = rect(grid(/July 2025/))
      expect(table.top - panel.top).toBe(124 + 56 + 48)
      expect(table.height).toBe(5 * 48)
      // The month that slides as the months page is the seven columns, 12dp in.
      const month = rect(grid(/July 2025/).closest('.calendar-page')!)
      expect([month.left - panel.left, month.width]).toEqual([12, 7 * 48])
      const circle = rect(day(/July 17, 2025/))
      expect([circle.width, circle.height]).toEqual([40, 40])
      // The actions as Compose's: 4dp under six weeks' rows and 12dp above the bottom, OK's text
      // where Compose's 58dp button puts it, 10dp from the end.
      const ok = rect(button('OK'))
      expect(ok.top - panel.top).toBe(124 + 56 + 48 + 6 * 48 + 4)
      expect(panel.bottom - ok.bottom).toBe(12)
      expect(panel.right - ok.right).toBe(10)
      expect(ok.left - rect(button('Cancel')).right).toBe(8)
      const clear = rect(button('Clear'))
      expect([clear.left - panel.left, clear.top]).toEqual([12, ok.top])
    })

    it('keeps the room of six weeks for a month of six or four, as Compose’s does', async () => {
      await open(<Picker initial={parseDate('2025-07-17')} />)
      await userEvent.click(button('Next'))
      await settle()
      expect(rect(grid()).height).toBe(6 * 48)
      expect(style(day(/September 6, 2025/)).display).toBe('none')
      expect(rect(container()).height).toBe(124 + 56 + 48 + 6 * 48 + 56)
      await userEvent.keyboard('{Escape}')
      await settle()
      document.body.innerHTML = ''
      await open(<Picker initial={parseDate('2026-02-10')} />)
      expect(rect(grid(/February 2026/)).height).toBe(4 * 48)
      // The page that slides is six weeks tall too, so that the months slide at one size.
      expect(rect(grid(/February 2026/).closest('.calendar-page')!).height).toBe(6 * 48)
      expect(rect(container()).height).toBe(124 + 56 + 48 + 6 * 48 + 56)
    })

    it('keeps its 360dp on a phone, past the layer’s padding, in the middle', async () => {
      await page.viewport(390, 844)
      await open(<Picker />)
      const panel = rect(container())
      expect(panel.width).toBe(360)
      expect(panel.left).toBe(15)
    })

    it('draws the picker on no background of its own, over the dialog’s surface-container-high fill', async () => {
      await open(<Picker />)
      const picker = grid().closest('.date-picker')!
      expect(rgba(style(picker).backgroundColor)[3]).toBe(0)
      expectRole(style(container(), '::before').backgroundColor, 'surface-container-high')
    })

    it('draws the years on no background either, letting none of the days under them through', async () => {
      await open(<Picker />)
      const days = grid().closest('.calendar-days')!
      expect(style(days).maskImage).toBe('none')
      await userEvent.click(button('August 2025'))
      await settle()
      const room = within(dialog()).getByRole('listbox').parentElement!
      expect(rgba(style(room).backgroundColor)[3]).toBe(0)
      expect(style(days).maskImage).toBe(
        'linear-gradient(rgba(0, 0, 0, 0) 100%, rgb(0, 0, 0) 100%)',
      )
      await userEvent.click(button('August 2025'))
      await settle()
      expect(style(days).maskImage).toBe('none')
    })

    it('draws today ringed in primary, the selected day filled with it in the days’ body-large, and the days past the bounds at 38%', async () => {
      await open(<Picker minValue={parseDate('2025-08-10')} />)
      const selected = day(/August 17, 2025/)
      expectRole(style(selected).backgroundColor, 'primary')
      expectRole(style(selected).color, 'on-primary')
      expect(style(selected).borderRadius).toBe(computedRadius('rounded-shape-full'))
      expectRole(style(day(/August 5, 2025/)).color, 'on-surface', 0.38)
      const other = day(/August 20, 2025/)
      expectRole(style(other).color, 'on-surface')
      expect([style(other).fontSize, style(other).fontWeight]).toEqual(['16px', '400'])
      for (const property of ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'] as const)
        expect(style(selected)[property], property).toBe(style(other)[property])
      expect(style(other).borderTopColor).toMatch(/rgba\(0, 0, 0, 0\)/)
      const today = document.querySelector<HTMLElement>('[data-today]')
      if (today) {
        expectRole(style(today).borderTopColor, 'primary')
        expect(style(today).borderTopWidth).toBe('1px')
      }
    })

    it('keeps 4.5:1 between its dates and the container in every scheme', async () => {
      for (const [theme, contrast] of schemes) {
        themeDocument(theme, contrast)
        await open(<Picker />)
        const fill = style(container(), '::before').backgroundColor
        for (const name of [/August 20, 2025/, /August 17, 2025/]) {
          const cell = day(name)
          const behind =
            rgba(style(cell).backgroundColor)[3] === 0 ? fill : style(cell).backgroundColor
          expect(
            contrastRatio(style(cell).color, behind),
            `${theme} ${contrast}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
        await userEvent.keyboard('{Escape}')
        await settle()
        document.body.innerHTML = ''
      }
    })

    it('draws the menu button on-surface-variant at 38% while the calendar is disabled', async () => {
      await open(<Picker isDisabled />)
      expectRole(style(button('August 2025')).color, 'on-surface-variant', 0.38)
    })

    it('gives each day, the menu button and the arrows a 48dp target', async () => {
      await open(<Picker />)
      for (const el of [
        day(/August 20, 2025/),
        button('Previous'),
        button('Next'),
        button('August 2025'),
      ])
        expectHitArea(el)
    })

    it('rings the day the keyboard is on, 3dp in secondary, and not one the pointer picks', async () => {
      await open(<Picker />)
      await userEvent.keyboard('{ArrowRight}')
      const focused = day(/August 18, 2025/)
      expect(focused).toHaveFocus()
      expect(style(focused).outlineWidth).toBe('3px')
      expectRole(style(focused).outlineColor, 'secondary')
      expect(style(focused).outlineOffset).toBe('2px')
      await userEvent.click(day(/August 20, 2025/))
      expect(style(day(/August 20, 2025/)).outlineStyle).toBe('none')
    })

    it('opens the years over the month as 72x36dp pills, three to a row, the one chosen filled and this year ringed', async () => {
      await open(<Picker />)
      await userEvent.click(button('August 2025'))
      await settle()
      const list = within(dialog()).getByRole('listbox')
      const room = list.parentElement!
      const panel = rect(container())
      expect(rect(room).top).toBe(panel.top + 124 + 56)
      expect(rect(room).height).toBe(7 * 48)
      const chosen = within(list).getByRole('option', { name: '2025' })
      expect([rect(chosen).width, rect(chosen).height]).toEqual([72, 36])
      expectRole(style(chosen).backgroundColor, 'primary')
      expectRole(style(chosen).color, 'on-primary')
      const row = within(list)
        .getAllByRole('option')
        .filter((it) => rect(it).top === rect(chosen).top)
      expect(row).toHaveLength(3)
      // Three columns over the 336dp between the 12dp sides, 2025 in the third, as in Compose's
      // grid of 1900–2100; the row before at the top edge.
      const middles = row.map((it) => rect(it).left + rect(it).width / 2 - panel.left)
      ;[12 + 336 / 6, 180, 360 - 12 - 336 / 6].forEach((middle, i) =>
        expect(middles[i]).toBeCloseTo(middle, 0),
      )
      expect(row[2]).toBe(chosen)
      expect(rect(chosen).top - rect(list).top).toBe(36 + 16)
      expect(style(button('Next').parentElement!).visibility).toBe('hidden')
      // The month stays as it is under them, as Compose's.
      expect(style(dialog().querySelector('.calendar-page')!).opacity).toBe('1')
      expectHitArea(chosen)
    })

    it('swaps the calendar for the date input in the same 360dp dialog under the same header, and back', async () => {
      await open(<Picker />)
      const modes = grid().closest('.date-picker-modes, .date-picker-modes-input')!
      expect(rect(modes).height).toBe(56 + 48 + 6 * 48)
      await userEvent.click(button('Switch to text input mode'))
      await settle()
      const panel = rect(container())
      expect([panel.width, panel.height]).toEqual([360, 124 + 106 + 56])
      expect(rect(modes).height).toBe(106)
      const headline = rect(within(dialog()).getByText('Aug 17, 2025'))
      const toggle = rect(button('Switch to calendar mode'))
      expect([headline.top - panel.top, toggle.top - panel.top]).toEqual([72, 72])
      expect(panel.right - toggle.right).toBe(16)
      // The field's container, around React Aria's own group of the segments, with Compose's 32dp
      // under it, where its error text goes, and 4dp more above the actions.
      const field = within(dialog()).getByRole('group', { name: 'Date' }).parentElement!
      expect([rect(field).width, rect(field).height]).toEqual([312, 56])
      expect(rect(field).left - panel.left).toBe(24)
      expect(rect(field).top - rect(modes).top).toBe(18)
      expect(rect(button('OK')).top - rect(field).bottom).toBe(32 + 4)
      await userEvent.click(button('Switch to calendar mode'))
      await settle()
      expect(rect(container()).width).toBe(360)
      expect(rect(modes).height).toBe(56 + 48 + 6 * 48)
    })

    it('keeps the headline 36dp under the title without the mode toggle', async () => {
      await open(
        <Picker defaultDisplayMode="input">
          <DatePickerHeader>
            <Heading slot="title">Select date</Heading>
            <DatePickerHeadline />
          </DatePickerHeader>
          <DatePickerContent>
            <DatePickerInput label="Date" />
          </DatePickerContent>
        </Picker>,
      )
      const title = rect(within(dialog()).getByText('Select date'))
      const headline = rect(within(dialog()).getByText('Aug 17, 2025'))
      expect(headline.top - title.bottom).toBe(36)
      expect(headline.top - rect(container()).top).toBe(72)
    })

    it('writes the empty input’s placeholder as Compose’s pattern, in capitals, on-surface-variant', async () => {
      await open(<Picker initial={null} defaultDisplayMode="input" />)
      const group = within(dialog()).getByRole('group', { name: 'Date' })
      const [month, dayPart] = within(group).getAllByRole('spinbutton')
      await waitFor(() => expect(month).toHaveFocus())
      expect(style(dayPart!).textTransform).toBe('uppercase')
      expectRole(style(dayPart!).color, 'on-surface-variant')
      const slash = month!.nextElementSibling!
      expectRole(style(slash).color, 'on-surface-variant')
      expectRole(style(month!).color, 'on-primary')
      await userEvent.keyboard('10')
      expectRole(style(slash).color, 'on-surface')
      expectRole(style(dayPart!).color, 'on-primary')
    })

    it('shows the input’s label on its line while the field is empty, Entered date over it', async () => {
      await open(<Picker initial={null} defaultDisplayMode="input" autoFocus={false} />)
      expect(within(dialog()).getByText('Entered date')).toBeInTheDocument()
      const group = within(dialog()).getByRole('group', { name: 'Date' })
      const label = document.getElementById(group.getAttribute('aria-labelledby')!.split(' ')[0]!)!
      expect(style(label).fontSize).toBe('16px')
      expect(rect(label).top - rect(group.parentElement!).top).toBe(16)
      expect(style(group).opacity).toBe('0')
    })

    it('colors the input’s field as Compose does, primary and 2dp while the focus is in it, error while invalid', async () => {
      await open(<Picker defaultDisplayMode="input" autoFocus={false} />)
      const group = within(dialog()).getByRole('group', { name: 'Date' })
      const outline = group.parentElement!.querySelector<HTMLElement>(
        '[aria-hidden] > :first-child',
      )!
      const label = document.getElementById(group.getAttribute('aria-labelledby')!.split(' ')[0]!)!
      expectRole(style(outline).borderLeftColor, 'outline')
      expect(style(outline).borderLeftWidth).toBe('1px')
      expectRole(style(label).color, 'on-surface-variant')
      await userEvent.click(within(group).getAllByRole('spinbutton')[0]!)
      await settle()
      expectRole(style(outline).borderLeftColor, 'primary')
      expect(style(outline).borderLeftWidth).toBe('2px')
      expectRole(style(label).color, 'primary')
      const segment = within(group).getAllByRole('spinbutton')[0]!
      expectRole(style(segment).backgroundColor, 'primary')
      expectRole(style(segment).color, 'on-primary')
    })

    it('draws an invalid input in the error color', async () => {
      await open(<Picker defaultDisplayMode="input" autoFocus={false} isInvalid />)
      const group = within(dialog()).getByRole('group', { name: 'Date' })
      const outline = group.parentElement!.querySelector<HTMLElement>(
        '[aria-hidden] > :first-child',
      )!
      expectRole(style(outline).borderLeftColor, 'error')
    })

    it('is inert as it closes, so nothing in it is pressed again', async () => {
      await open(<Picker />)
      const modal = container()
      expect(modal.inert).toBe(false)
      // Its exit held long enough to be caught leaving, then finished.
      const slow = document.createElement('style')
      slow.textContent = '* { transition-duration: 60s !important }'
      document.head.append(slow)
      await userEvent.click(button('Cancel'))
      expect(modal).toHaveAttribute('data-exiting')
      expect(modal.inert).toBe(true)
      slow.remove()
      document.getAnimations().forEach((it) => it.finish())
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })
  })

  describe('range picker', () => {
    const range = { start: august17, end: parseDate('2025-08-23') }

    type HeldRangeProps = Partial<DateRangePickerProps<CalendarDate>> & {
      initial?: RangeValue<CalendarDate>
    }

    /** The range picker, holding the range picked, August 17 to 23 unless given, as a caller does
     * until OK. */
    function HeldRange({ initial = range, ...props }: HeldRangeProps) {
      const [value, setValue] = useState<RangeValue<CalendarDate> | null>(initial)
      return (
        <DateRangePicker value={value} onChange={setValue} {...props}>
          {props.children ?? rangeParts}
        </DateRangePicker>
      )
    }

    function Range(props: HeldRangeProps) {
      return (
        <Composed>
          <HeldRange {...props} />
        </Composed>
      )
    }

    /** A range across a new year, which Intl writes whole at both ends, too long for one line. */
    const newYear = { start: parseDate('2025-12-17'), end: parseDate('2026-01-23') }

    it('fills a 360dp dialog to the layer’s height, its months scrolled to the range, a divider over the actions', async () => {
      await open(<Range />)
      const panel = rect(container())
      expect(panel.width).toBe(360)
      expect(panel.top).toBe(56)
      expect(panel.bottom).toBe(896 - 56)
      const scroller = dialog().querySelector<HTMLElement>('.calendar-months')!
      const august = within(dialog())
        .getAllByRole('heading', { hidden: true })
        .find((it) => it.textContent === 'August 2025')!
      expect(rect(august).top).toBe(rect(scroller).top)
      expect([style(august).paddingTop, style(august).paddingBottom]).toEqual(['20px', '8px'])
      // In line with the two-digit days of its first column, 16dp into their 48dp cell, 12dp in.
      expect(rect(august).left + parseFloat(style(august).paddingLeft) - panel.left).toBe(12 + 16)
      // Each month takes its own weeks' rows: August 2025 has six, September five.
      const subheads = within(dialog()).getAllByRole('heading', { hidden: true })
      const at = (name: string) => rect(subheads.find((it) => it.textContent === name)!).top
      expect(rect(grid(/August 2025/)).height).toBe(6 * 48)
      expect(rect(grid(/September 2025/)).height).toBe(5 * 48)
      expect(at('September 2025') - at('August 2025')).toBe(48 + 6 * 48)
      expect(at('October 2025') - at('September 2025')).toBe(48 + 5 * 48)
      const actions = button('OK').parentElement!
      expect(style(actions).borderTopWidth).toBe('1px')
      expectRole(style(actions).borderTopColor, 'outline-variant')
      expect(rect(scroller).bottom).toBe(rect(actions).top)
      expect(rect(actions).bottom).toBe(panel.bottom)
    })

    // Paused along the way, the dialog is as tall as its room each step: past the inputs' height
    // as the spring overshoots, and past the layer's, which the months fill, as its cap is lifted.
    it('shrinks to its inputs and grows back into the layer, following its room on the default spatial spring', async () => {
      await open(<Range />)
      const duration = parseFloat(springDuration('default-spatial')) * 1000
      // The layer's height; and the header on one line (`Aug 17 – 23, 2025`), the inputs' 90dp and
      // the actions.
      const [months, inputs] = [896 - 2 * 56, 112 + 90 + 56]
      press(button('Switch to text input mode'))
      const shrink = resize()
      expect(shrink.effect?.getComputedTiming().duration).toBe(duration)
      expect(Math.min(...heightsThrough(shrink))).toBeLessThan(inputs)
      shrink.finish()
      await settle()
      expect(rect(container()).height).toBe(inputs)
      press(button('Switch to calendar mode'))
      const grow = resize()
      const heights = heightsThrough(grow)
      expect(heights[5]).toBeGreaterThan(inputs)
      expect(heights[5]).toBeLessThan(months)
      expect(Math.max(...heights)).toBeGreaterThan(months)
      expect(heights.at(-1)).toBe(months)
      grow.finish()
      await settle()
      expect(rect(container()).height).toBe(months)
    })

    // Played as it runs, frame by frame, the room's resize and the lift of the dialog's height cap
    // end in the same frame: the dialog never takes its months' whole column, thousands of dp.
    it('caps the dialog again as its room lets go, growing back into the layer as it plays', async () => {
      await open(<Range />)
      const months = 896 - 2 * 56
      await userEvent.click(button('Switch to text input mode'))
      await settle()
      press(button('Switch to calendar mode'))
      const grow = resize()
      const heights: number[] = []
      while (grow.playState !== 'finished') {
        heights.push(rect(container()).height)
        await new Promise(requestAnimationFrame)
      }
      heights.push(rect(container()).height)
      expect(Math.max(...heights)).toBeLessThan(2 * months)
      expect(heights.at(-1)).toBe(months)
    })

    it('shows its inputs under its own header, as Compose’s does, 24dp in and 8dp apart, no divider over the actions', async () => {
      await open(<Range initial={newYear} defaultDisplayMode="input" />)
      const panel = rect(container())
      // The start and Intl's dash, which the text query takes trimmed.
      const start = within(dialog()).getByText('Dec 17, 2025 –')
      expect(style(start).fontSize).toBe('22px')
      expectRole(style(start).color, 'on-surface-variant')
      const toggle = screen.getByRole('button', { name: 'Switch to calendar mode' })
      expect(within(toggle).getByText('date_range')).toBeTruthy()
      // 24dp in, 36dp under the title, as the single's; with no room for both dates on a line, the
      // end goes whole onto the next, the dash staying after the start, and the toggle in the
      // middle of the two lines.
      const title = rect(within(dialog()).getByText('Select dates'))
      expect([title.left - panel.left, title.top - panel.top]).toEqual([24, 16])
      const first = rect(start)
      expect(first.top - title.bottom).toBe(36)
      const end = rect(within(dialog()).getByText('Jan 23, 2026'))
      expect([first.left - panel.left, first.height]).toEqual([24, 28])
      expect([end.left, end.top, end.height]).toEqual([first.left, first.bottom, 28])
      const box = rect(toggle)
      expect(box.top + box.height / 2).toBe((first.top + end.bottom) / 2)
      expect(rect(start.closest('.date-picker-header')!).bottom - end.bottom).toBe(12)
      const [from, to] = ['Start date', 'End date'].map(
        (name) => within(dialog()).getByRole('group', { name }).parentElement!,
      )
      expect(rect(from!).left - panel.left).toBe(24)
      expect(panel.right - rect(to!).right).toBe(24)
      expect(rect(from!).width).toBe(rect(to!).width)
      expect(rect(to!).left - rect(from!).right).toBe(8)
      expect(style(button('OK').parentElement!).borderTopWidth).toBe('0px')
    })

    it('grows over its inputs by an error text as it wraps, which takes the 16dp under its field, as Compose’s does', async () => {
      // React Aria's three months around the range's start: July to September 2025.
      await open(<Range defaultDisplayMode="input" visibleDuration={{ months: 3 }} />)
      const height = rect(container()).height
      const end = within(dialog()).getByRole('group', { name: 'End date' })
      await userEvent.click(within(end).getAllByRole('spinbutton')[0]!)
      await userEvent.keyboard('10012025')
      const error = rect(within(dialog()).getByText('Value must be 09/30/2025 or earlier.'))
      expect(error.height).toBeGreaterThan(16)
      // 4dp under the outline, and whole in the room, which ends where the actions begin.
      expect(error.top - rect(end.parentElement!).bottom).toBe(4)
      expect(error.bottom).toBe(rect(button('OK').parentElement!).top)
      expect(rect(container()).height).toBe(height - 16 + 4 + error.height)
    })

    it('shows the range typed as its months swap back in, scrolled to its start, as Compose shows its month', async () => {
      await open(<Range defaultDisplayMode="input" />)
      for (const [name, date] of [
        ['Start date', '11032025'],
        ['End date', '11072025'],
      ] as const) {
        const field = within(dialog()).getByRole('group', { name })
        await userEvent.click(within(field).getAllByRole('spinbutton')[0]!)
        await userEvent.keyboard(date)
      }
      await userEvent.click(button('Switch to calendar mode'))
      await settle()
      const scroller = rect(dialog().querySelector('.calendar-months')!)
      const start = day(/November 3, 2025/)
      expect(start).toHaveFocus()
      expect(rect(start).top).toBeGreaterThanOrEqual(scroller.top)
      expect(rect(start).bottom).toBeLessThanOrEqual(scroller.bottom)
    })

    /** The range picker in a 412dp full-screen dialog under the caller's app bar, as the stories
     * piece it. */
    async function openFullScreen(value: RangeValue<CalendarDate>) {
      await page.viewport(412, 800)
      render(
        <DialogTrigger>
          <Button>Open</Button>
          <Dialog isFullScreen className="bg-surface-container-high pb-0">
            {({ state }) => (
              <>
                <AppBar className="bg-surface-container-high">
                  <IconButton slot="leading" aria-label="Close" onPress={() => state.close()}>
                    <Icon name="close" />
                  </IconButton>
                  <Button slot="trailing" variant="text" onPress={() => state.close()}>
                    Save
                  </Button>
                </AppBar>
                <DateRangePicker defaultValue={value} className="w-full">
                  {rangeParts}
                </DateRangePicker>
              </>
            )}
          </Dialog>
        </DialogTrigger>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Open' }))
      await settle()
    }

    it('fills a full-screen dialog under the caller’s app bar, laid out as Compose’s is', async () => {
      await openFullScreen({ start: parseDate('2025-06-01'), end: parseDate('2025-06-07') })
      const panel = rect(container())
      expect([panel.left, panel.top, panel.width, panel.height]).toEqual([0, 0, 412, 800])
      expect(dialog()).toHaveAccessibleName('Select dates')
      // The small app bar, 64dp, drawn in the dialog's fill.
      const bar = dialog().querySelector('header')!
      expect(rect(bar).height).toBe(64)
      expect(style(bar).backgroundColor).toBe(style(container()).backgroundColor)
      const title = rect(within(dialog()).getByText('Select dates'))
      expect([title.left, title.top]).toEqual([24, 64 + 16])
      // The headline 36dp under the title, as Intl writes the range, the month and year once, split
      // before its end: the dash and its spaces with the start, and the end straight after.
      const start = within(dialog()).getByText('Jun 1 –')
      const headline = rect(start)
      expect([headline.top - title.bottom, headline.height]).toEqual([36, 28])
      expect(start.parentElement!.textContent!.replace(/\s/g, ' ')).toBe('Jun 1 – 7, 2025')
      expect(rect(within(dialog()).getByText('7, 2025')).left).toBe(headline.right)
      expectRole(style(start).color, 'on-surface-variant')
      // The divider in the header's last pixel, and the toggle centered on the headline's line, 6dp
      // past it into the 12dp of header under the line.
      const header = start.closest('.date-picker-header')!
      expect([rect(header).top, rect(header).height]).toEqual([64, 16 + 20 + 36 + 28 + 12])
      expect(style(header, '::after').borderBottomWidth).toBe('1px')
      expectRole(style(header, '::after').borderBottomColor, 'outline-variant')
      const toggle = screen.getByRole('button', { name: 'Switch to text input mode' })
      const icon = within(toggle).getByText('edit')
      expect(style(icon).fontVariationSettings).toBe('"FILL" 1, "GRAD" 0')
      const box = rect(toggle)
      expect(412 - box.right).toBe(16)
      expect(box.top + box.height / 2).toBe(headline.top + headline.height / 2)
      expect(rect(header).bottom - box.bottom).toBe(12 - 6)
      // The dates at the start, 24dp in, as the title.
      expect(headline.left).toBe(24)
      // Seven 48dp columns spaced evenly 12dp in, the day of week labels over the days.
      // React Aria's labels of the ends name the range first: the day's own name follows a comma.
      const sunday = rect(day(/, Sunday, June 1, 2025/).closest('td')!)
      const saturday = rect(day(/, Saturday, June 7, 2025/).closest('td')!)
      const space = (412 - 24 - 7 * 48) / 8
      expect(sunday.left + sunday.width / 2).toBe(12 + space + 24)
      expect(saturday.left + saturday.width / 2).toBe(412 - 12 - space - 24)
      // The month's name in line with the two-digit days of its first column, 16dp into their cell.
      const june = within(dialog())
        .getAllByRole('heading', { hidden: true })
        .find((it) => it.textContent === 'June 2025')!
      expect(rect(june).left + parseFloat(style(june).paddingLeft)).toBe(12 + space + 16)
      const labels = [...within(dialog()).getAllByText('S')[0]!.parentElement!.children]
      expect([labels[0]!, labels[6]!].map((it) => rect(it).left + rect(it).width / 2)).toEqual([
        sunday.left + sunday.width / 2,
        saturday.left + saturday.width / 2,
      ])
      const scroller = dialog().querySelector<HTMLElement>('.calendar-months')!
      expect(rect(scroller).top).toBe(rect(header).bottom + 48)
      expect(rect(scroller).bottom).toBe(800)
      expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
    })

    it('draws the band of the range on secondary-container, 40dp tall, 12dp from the container’s edge past a row’s end', async () => {
      await open(<Range />)
      const panel = rect(container())
      const between = day(/August 20, 2025/)
      expectRole(style(between).color, 'on-secondary-container')
      expect(rgba(style(between).backgroundColor)[3]).toBe(0)
      const band = style(between.closest('td')!, '::before')
      expectRole(band.backgroundColor, 'secondary-container')
      expect(band.height).toBe('40px')
      for (const name of [/August 17, 2025/, /August 23, 2025/]) {
        expectRole(style(day(name)).backgroundColor, 'primary')
        expectRole(style(day(name)).color, 'on-primary')
        expect(style(day(name)).fontSize).toBe('16px')
      }
      // A range over a row's end stops at the grid's, 12dp in, where the cells fill the 360dp.
      await userEvent.click(day(/September 10, 2025/))
      await userEvent.click(day(/September 17, 2025/))
      await settle()
      const last = day(/September 13, 2025/).closest('td')!
      const first = day(/September 14, 2025/).closest('td')!
      expect(style(last, '::before').right).toBe('0px')
      expect(style(first, '::before').left).toBe('0px')
      expect(rect(last).right + 12).toBe(panel.right)
      expect(rect(first).left - 12).toBe(panel.left)
    })

    it('draws the band from the start to the day hovered while a start alone is picked', async () => {
      await open(<Range />)
      await userEvent.click(day(/September 10, 2025/))
      await userEvent.hover(day(/September 17, 2025/))
      await settle()
      // React Aria highlights the days from the start to the one hovered, drawn as a range's.
      const between = day(/September 13, 2025/)
      expectRole(style(between.closest('td')!, '::before').backgroundColor, 'secondary-container')
      expectRole(style(between).color, 'on-secondary-container')
      expect(rgba(style(between).backgroundColor)[3]).toBe(0)
      for (const name of [/September 10, 2025/, /September 17, 2025/])
        expectRole(style(day(name)).backgroundColor, 'primary')
      // The band follows the pointer, off the days it leaves.
      await userEvent.hover(day(/September 12, 2025/))
      await settle()
      expect(style(between.closest('td')!, '::before').content).toBe('none')
      expectRole(style(between).color, 'on-surface')
    })

    it('keeps the days in place as the header takes a line less or more with an end picked', async () => {
      await open(
        <Range initial={{ start: parseDate('2025-12-17'), end: parseDate('2025-12-23') }} />,
      )
      const header = dialog().querySelector('.date-picker-header')!
      expect(rect(header).height).toBe(112)
      // A range across the new year, too long for a line by 14dp: the header 28dp taller, the days
      // as they were. The ends are held, as React Aria's labels of a range's ends name both.
      await userEvent.click(day(/December 28, 2025/))
      const end = day(/January 10, 2026/)
      const top = rect(end).top
      await userEvent.click(end)
      await settle()
      expect(rect(header).height).toBe(140)
      expect(rect(end).top).toBe(top)
      // And back onto one line.
      await userEvent.click(day(/December 4, 2025/))
      const back = day(/December 13, 2025/)
      const backTop = rect(back).top
      await userEvent.click(back)
      await settle()
      expect(rect(header).height).toBe(112)
      expect(rect(back).top).toBe(backTop)
    })

    it('draws the band across the spacing to 12dp in past a row’s end, but to the cell past a month’s first or last day', async () => {
      await openFullScreen({ start: parseDate('2025-05-21'), end: parseDate('2025-06-10') })
      const cell = (name: RegExp) => day(name).closest('td')!
      // 412dp wide: 3.25dp of spacing past a row's first and last cells.
      const rowEnd = cell(/May 24, 2025/)
      expect(style(rowEnd, '::before').right).toBe('-3.25px')
      expect(rect(rowEnd).right + 3.25).toBe(412 - 12)
      expect(style(cell(/May 25, 2025/), '::before').left).toBe('-3.25px')
      expect(style(cell(/June 7, 2025/), '::before').right).toBe('-3.25px')
      // May's last day and June's first, the range going on past them.
      expect(style(cell(/May 31, 2025/), '::before').right).toBe('0px')
      expect(style(cell(/June 1, 2025/), '::before').left).toBe('0px')
    })

    it('draws no band under the days of the months around, which it leaves out', async () => {
      await open(<Range initial={{ start: august17, end: parseDate('2025-09-05') }} />)
      // August's last row ends on September 6: September's first days, in the range, are in it,
      // which React Aria marks unselected there, the range's end too.
      const around = [...grid().querySelectorAll('[data-outside-month]')].slice(-6)
      expect(around.map((cell) => cell.textContent)).toEqual(['1', '2', '3', '4', '5', '6'])
      for (const cell of around) expect(style(cell.closest('td')!, '::before').content).toBe('none')
      expect(style(day(/August 30, 2025/).closest('td')!, '::before').content).not.toBe('none')
    })
  })

  describe('motion', () => {
    // Paused along the way, the dialog is as tall as its room each step, past each end's height
    // as the spring overshoots.
    it('follows its room as it swaps modes, on the default spatial spring, overshoot and all', async () => {
      await open(<Picker />)
      const duration = parseFloat(springDuration('default-spatial')) * 1000
      const [calendar, input] = [124 + 392 + 56, 124 + 106 + 56]
      press(button('Switch to text input mode'))
      const shrink = resize()
      expect(shrink.effect?.getComputedTiming().duration).toBe(duration)
      expect(Math.min(...heightsThrough(shrink))).toBeLessThan(input)
      shrink.finish()
      await settle()
      expect(rect(container()).height).toBe(input)
      press(button('Switch to calendar mode'))
      const grow = resize()
      expect(Math.max(...heightsThrough(grow))).toBeGreaterThan(calendar)
      grow.finish()
      await settle()
      expect(rect(container()).height).toBe(calendar)
    })

    // Cut away, a part takes no pointer either: what the point hits tells.
    it('draws none of the picker past its fill as the fill grows, as a dialog does', async () => {
      render(<Picker />)
      press(screen.getByRole('button', { name: 'Open' }))
      await waitFor(() =>
        expect(
          container()
            .getAnimations()
            .some((it) => it instanceof CSSTransition),
        ).toBe(true),
      )
      const transitions = document.getAnimations().filter((it) => it instanceof CSSTransition)
      transitions.forEach((it) => it.pause())
      const modal = container()
      const ok = button('OK')
      let below = 0
      for (const time of [0, 50, 100, 150, 200, 250, 300, 400]) {
        transitions.forEach((it) => (it.currentTime = time))
        const edge = rect(modal).top + parseFloat(style(modal, '::before').height)
        const box = rect(ok)
        if (box.bottom <= edge + 1) continue
        below++
        const point = document.elementFromPoint(
          box.left + box.width / 2,
          Math.max(edge + 1, box.top + box.height / 2),
        )
        expect(dialog().contains(point), `${time}ms`).toBe(false)
      }
      expect(below).toBeGreaterThan(0)
      transitions.forEach((it) => it.finish())
      await settle()
    })

    it('slides the months on Compose’s scroll spring over the default effects time', async () => {
      await open(<Picker />)
      await pressToSlide(button('Next'))
      const animations = document.getAnimations() as CSSAnimation[]
      const slide = animations.find((it) => it.animationName === 'calendar-page-in-from-end')
      expect(slide?.effect?.getComputedTiming().duration).toBe(
        parseFloat(springDuration('default-effects')) * 1000,
      )
      await settle()
    })

    // Its page is named for the view transition only while it slides, which the browser runs for
    // the whole document.
    it('slides only the months paged, not another calendar’s on the page', async () => {
      render(
        <>
          <Held autoFocus={false} />
          <Held autoFocus={false} initial={parseDate('2025-03-10')} />
        </>,
      )
      const names = () =>
        [...document.querySelectorAll('.calendar-page')].map((it) => style(it).viewTransitionName)
      expect(names()).toEqual(['none', 'none'])
      // Ours, before React Aria's own hidden Next.
      await pressToSlide(screen.getAllByRole('button', { name: 'Next' })[0]!)
      const slides = () =>
        (document.getAnimations() as CSSAnimation[]).filter(
          (it) => it.animationName === 'calendar-page-in-from-end',
        )
      expect(slides()).toHaveLength(1)
      await settle()
      // Un-named as the page is drawn again once its slide has ended.
      await waitFor(() => expect(names()).toEqual(['none', 'none']))
      expect(screen.getByRole('grid', { name: /September 2025/ })).toBeInTheDocument()
    })

    // Held mid-slide: the rest of the page out of the view transition, the arrow is still there to
    // press, not the document under a press outside, which would close the dialog.
    it('pages on as an arrow is pressed again while the months slide', async () => {
      await open(<Picker />)
      await pressToSlide(button('Next'))
      const slides = document
        .getAnimations()
        .filter((it) => (it as CSSAnimation).animationName?.startsWith('calendar-page'))
      expect(slides.length).toBeGreaterThan(0)
      slides.forEach((it) => it.pause())
      await userEvent.click(button('Next'))
      await settle()
      expect(grid(/October 2025/)).toBeInTheDocument()
    })

    // As an arrow's slide starts, a press goes to the document itself, wherever the pointer is.
    it('stays open on a press made as the months start to slide, which the browser gives the document', async () => {
      await open(<Picker />)
      const next = rect(button('Next'))
      expect(
        await pressAsViewTransitionStarts(next.left + next.width / 2, next.top + next.height / 2),
      ).toEqual([document.documentElement])
      await settle()
      // Inert as it leaves.
      expect(container()).not.toHaveAttribute('inert')
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('opens and pages at once', async () => {
        await open(<Picker />)
        const modal = container()
        const times = (it: CSSStyleDeclaration) =>
          [it.transitionDuration, it.transitionDelay].flatMap((time) => time.split(', '))
        for (const it of [modal.parentElement!, modal, ...dialog().children].map((el) => style(el)))
          for (const time of times(it)) expect(parseFloat(time)).toBeLessThan(0.001)
        await userEvent.click(button('Next'))
        expect(
          document
            .getAnimations()
            .some((it) => (it as CSSAnimation).animationName?.startsWith('calendar-page')),
        ).toBe(false)
        expect(grid(/September 2025/)).toBeInTheDocument()
      })
    })
  })

  // By React Aria's locale alone, which its keys follow: the page here is left to right, and the
  // dialog is portaled out of any wrapper that would set its `dir`.
  describe('in a right-to-left locale', () => {
    const hebrew = (element: ReactElement) => <I18nProvider locale="he-IL">{element}</I18nProvider>

    it('lays the dialog out right to left: the arrows, and the days the arrow keys move along', async () => {
      await open(hebrew(<Picker />))
      expect(style(container()).direction).toBe('rtl')
      expect(rect(button('הבא')).right).toBeLessThan(rect(button('הקודם')).left)
      const seventeenth = document.activeElement!
      expect(seventeenth).toHaveTextContent('17')
      await userEvent.keyboard('{ArrowLeft}')
      const eighteenth = document.activeElement!
      expect(eighteenth).toHaveTextContent('18')
      expect(rect(eighteenth).right).toBeLessThan(rect(seventeenth).left)
    })

    it('slides the next month in from the left', async () => {
      await open(hebrew(<Picker />))
      await pressToSlide(button('הבא'))
      const names = (document.getAnimations() as CSSAnimation[]).map((it) => it.animationName)
      expect(names).toContain('calendar-page-out-end')
      expect(names).toContain('calendar-page-in-from-start')
      await settle()
    })
  })

  describe('in forced colors', () => {
    useForcedColors()

    it('fills the selected day with the highlight, grays the days past the bounds, and borders the container', async () => {
      await open(<Picker minValue={parseDate('2025-08-10')} />)
      const selected = day(/August 17, 2025/)
      expect(style(selected).backgroundColor).toBe(computedColor('Highlight', document.body))
      expect(style(selected).color).toBe(computedColor('HighlightText', document.body))
      expect(style(container()).borderTopWidth).toBe('1px')
      const past = day(/August 5, 2025/)
      expect(style(past).color).toBe(computedColor('GrayText', document.body))
    })
  })
})
