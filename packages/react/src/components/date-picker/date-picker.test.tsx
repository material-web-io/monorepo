import { CalendarDate, isWeekend, parseDate } from '@internationalized/date'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import {
  DialogTrigger,
  Heading,
  I18nProvider,
  type DateValue,
  type RangeValue,
} from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
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
  DateRangePicker,
  DateRangePickerCalendar,
  DateRangePickerHeadline,
  DateRangePickerInput,
  type DatePickerDialogProps,
  type DatePickerProps,
  type DatePickerRenderProps,
  type DateRangePickerProps,
} from '.'

/* What jsdom can check without a stylesheet: what the pickers hold and report, and when, their
 * menus, keys and input, and their dialog. The calendar's parts: calendar.test.tsx. Geometry,
 * colors and motion: date-picker.browser.test.tsx. */

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

/** The day cell named by its date, as React Aria names one: the one in its own month, where a
 * range shows the months around too. */
const day = (name: RegExp, scope: HTMLElement = document.body) => {
  const cells = within(scope).getAllByRole('button', { name })
  return cells.find((cell) => !cell.hasAttribute('aria-disabled')) ?? cells[0]!
}
/** The arrow named `name`: React Aria's own visually hidden Previous and Next buttons follow. */
const arrow = (name: string) => screen.getAllByRole('button', { name })[0]!
/** The input's segments, by the field's label. */
const segments = (name: string) =>
  within(screen.getByRole('group', { name, hidden: true })).getAllByRole('spinbutton', {
    hidden: true,
  })
const typed = (name: string) =>
  segments(name)
    .map((segment) => segment.textContent)
    .join('/')
/** The pane, calendar or input, that is away: inert. */
const away = (el: HTMLElement) => el.closest('[inert]')

function Picker(props: Partial<DatePickerProps<CalendarDate>>) {
  return (
    <DatePicker defaultValue={august17} {...props}>
      {props.children ?? dateParts}
    </DatePicker>
  )
}

describe('DatePicker', () => {
  it('is a div holding the header, its title a heading, over the calendar of the month’s six weeks', () => {
    const { container } = render(<Picker />)
    const root = container.firstElementChild!
    expect(root.tagName).toBe('DIV')
    expect(screen.getByRole('heading', { name: 'Select date' })).toBeInTheDocument()
    expect(screen.getByText('Aug 17, 2025')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch to text input mode' })).toBeInTheDocument()
    expect(screen.getByRole('application')).toBeInTheDocument()
    expect(screen.getByRole('grid', { name: /August 2025/ })).toBeInTheDocument()
    expect(screen.getAllByRole('gridcell')).toHaveLength(42)
    expect(day(/September 6, 2025/)).toHaveAttribute('data-outside-month')
    // The input is there too, away.
    expect(away(screen.getByRole('group', { name: 'Date', hidden: true }))).not.toBeNull()
  })

  it('draws as many weeks as the month has, as React Aria counts them', () => {
    const { rerender } = render(<Picker defaultValue={parseDate('2025-07-17')} />)
    expect(screen.getAllByRole('gridcell')).toHaveLength(5 * 7)
    rerender(<Picker key="february" defaultValue={parseDate('2026-02-10')} />)
    expect(screen.getAllByRole('gridcell')).toHaveLength(4 * 7)
  })

  it('gives its outermost element its class, style and ref', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<Picker className="w-90" style={{ margin: 1 }} ref={ref} />)
    expect(ref.current).toBe(container.firstElementChild)
    expect(ref.current).toHaveClass('w-90')
    expect(ref.current).toHaveStyle({ margin: '1px' })
  })

  it('names the day picked in the headline and reports it, or shows Selected date with none', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Picker onChange={onChange} />)
    await user.click(day(/August 20, 2025/))
    expect(screen.getByText('Aug 20, 2025')).toBeInTheDocument()
    expect(String(onChange.mock.lastCall![0])).toBe('2025-08-20')
    rerender(<Picker value={null} />)
    expect(screen.getByText('Selected date')).toBeInTheDocument()
  })

  it('takes a controlled value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker defaultValue={undefined} value={august17} onChange={onChange} />)
    await user.click(day(/August 20, 2025/))
    expect(String(onChange.mock.lastCall![0])).toBe('2025-08-20')
    expect(screen.getByText('Aug 17, 2025')).toBeInTheDocument()
  })

  it('pages the months with its arrows, which stop at the bounds', async () => {
    const user = userEvent.setup()
    render(<Picker minValue={parseDate('2025-07-01')} maxValue={parseDate('2025-09-30')} />)
    const grid = (name: RegExp) => screen.getByRole('grid', { name })
    await user.click(arrow('Next'))
    expect(grid(/September 2025/)).toBeInTheDocument()
    expect(arrow('Next')).toBeDisabled()
    await user.click(arrow('Previous'))
    await user.click(arrow('Previous'))
    expect(grid(/July 2025/)).toBeInTheDocument()
    expect(arrow('Previous')).toBeDisabled()
  })

  it('names its arrows as React Aria names them, in its locale', () => {
    render(
      <I18nProvider locale="de-DE">
        <Picker />
      </I18nProvider>,
    )
    // React Aria's own visually hidden Next button follows them.
    const [previous, next] = screen.getAllByRole('button', { name: /^(Zurück|Weiter)$/ })
    expect(previous).toHaveAccessibleName('Zurück')
    expect(next).toHaveAccessibleName('Weiter')
    expect(next).toHaveAttribute('tabindex', '0')
  })

  it('focuses the day given autoFocus, and takes React Aria’s keys: Page Up and Down a month, with Shift a year, Home and End the ends', async () => {
    const user = userEvent.setup()
    render(<Picker autoFocus />)
    expect(day(/August 17, 2025/)).toHaveFocus()
    await user.keyboard('{PageDown}')
    expect(day(/September 17, 2025/)).toHaveFocus()
    await user.keyboard('{Shift>}{PageDown}{/Shift}')
    expect(day(/September 17, 2026/)).toHaveFocus()
    await user.keyboard('{Home}')
    expect(day(/September 1, 2026/)).toHaveFocus()
    await user.keyboard('{End}')
    expect(day(/September 30, 2026/)).toHaveFocus()
  })

  it('heads the weekdays once over the page, from the first day of the week given', () => {
    render(<Picker firstDayOfWeek="mon" />)
    const rows = [...document.querySelectorAll<HTMLElement>('table[aria-hidden]')]
    expect(rows.map((row) => row.textContent)).toEqual(['MTWTFSS'])
    // The grid's own would slide with its days.
    expect(screen.getByRole('grid').querySelector('thead')).toBeNull()
  })

  it('opens the years as a grid from the month and year button, and shows the one chosen', async () => {
    const user = userEvent.setup()
    render(<Picker />)
    const menu = screen.getByRole('button', { name: 'August 2025' })
    expect(menu).toHaveAttribute('aria-haspopup', 'listbox')
    await user.click(menu)
    const list = screen.getByRole('listbox')
    // About a hundred years each side, from 1924, which starts a row of Compose's 1900–2100.
    const options = within(list).getAllByRole('option')
    expect([options.length, options[0]!.textContent]).toEqual([203, '1924'])
    expect(within(list).getByRole('option', { name: '2025' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.click(within(list).getByRole('option', { name: '2027' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'August 2027' })).toHaveFocus())
    expect(screen.getByRole('grid', { name: /August 2027/ })).toBeInTheDocument()
  })

  it('takes the focus back to the years left open as the calendar swaps back in with no date', async () => {
    const user = userEvent.setup()
    render(<Picker defaultValue={undefined} defaultFocusedValue={august17} />)
    await user.click(screen.getByRole('button', { name: 'August 2025' }))
    await waitFor(() => expect(screen.getByRole('option', { name: '2025' })).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Switch to text input mode' }))
    await waitFor(() => expect(segments('Date')[0]).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Switch to calendar mode' }))
    await waitFor(() => expect(screen.getByRole('option', { name: '2025' })).toHaveFocus())
  })

  it('closes the years alone on Escape, back to their button, which Shift+M and Shift+Y reach', async () => {
    const user = userEvent.setup()
    const onKeyDown = vi.fn()
    render(
      <div onKeyDown={(event) => event.key === 'Escape' && onKeyDown()}>
        <Picker autoFocus />
      </div>,
    )
    const menu = () => screen.getByRole('button', { name: 'August 2025' })
    await user.keyboard('{Shift>}M{/Shift}')
    expect(menu()).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(onKeyDown).not.toHaveBeenCalled()
    await waitFor(() => expect(menu()).toHaveFocus())
    expect(menu()).toHaveAttribute('aria-expanded', 'false')
    day(/August 17, 2025/).focus()
    await user.keyboard('{Shift>}Y{/Shift}')
    expect(menu()).toHaveFocus()
  })

  it('leaves the years once they have gone', async () => {
    const user = userEvent.setup()
    render(<Picker />)
    await user.click(screen.getByRole('button', { name: 'August 2025' }))
    await user.keyboard('{Escape}')
    fireEvent.transitionEnd(screen.getByRole('listbox').parentElement!)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('swaps to the date input and back, the focus going along, and reports the date typed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onDisplayModeChange = vi.fn()
    render(<Picker onChange={onChange} onDisplayModeChange={onDisplayModeChange} />)
    await user.click(screen.getByRole('button', { name: 'Switch to text input mode' }))
    expect(onDisplayModeChange).toHaveBeenLastCalledWith('input')
    await waitFor(() => expect(segments('Date')[0]).toHaveFocus())
    expect(away(screen.getByRole('grid', { hidden: true }))).not.toBeNull()
    expect(typed('Date')).toBe('08/17/2025')
    await user.keyboard('09012025')
    expect(screen.getByText('Sep 1, 2025')).toBeInTheDocument()
    expect(String(onChange.mock.lastCall![0])).toBe('2025-09-01')
    await user.click(screen.getByRole('button', { name: 'Switch to calendar mode' }))
    expect(onDisplayModeChange).toHaveBeenLastCalledWith('picker')
    // The calendar shows the month of the date typed.
    await waitFor(() => expect(day(/September 1, 2025/)).toHaveFocus())
  })

  it('reports null for a date typed past the bounds, which the input shows still, invalid, as Compose does', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Picker
        defaultValue={undefined}
        defaultDisplayMode="input"
        autoFocus
        // React Aria's field takes each year as it is typed, 0002 to 2025: bounded, none is valid.
        minValue={parseDate('1900-01-01')}
        maxValue={august17}
        onChange={onChange}
      />,
    )
    expect(screen.getByText('Entered date')).toBeInTheDocument()
    expect(segments('Date')[0]).toHaveFocus()
    await user.keyboard('09012025')
    expect(typed('Date')).toBe('09/01/2025')
    expect(onChange).not.toHaveBeenCalledWith(expect.anything())
    expect(screen.getByText('Entered date')).toBeInTheDocument()
    for (const segment of segments('Date')) expect(segment).toHaveAttribute('aria-invalid', 'true')
    await user.click(segments('Date')[1]!)
    await user.keyboard('01')
    expect(typed('Date')).toBe('09/01/2025')
    await user.click(segments('Date')[0]!)
    await user.keyboard('08')
    expect(String(onChange.mock.lastCall![0])).toBe('2025-08-01')
  })

  it('drops a date typed that it could not take once a date is given in its place, cleared after', async () => {
    const user = userEvent.setup()
    const picker = (value: CalendarDate | null) => (
      <Picker
        defaultValue={undefined}
        value={value}
        defaultDisplayMode="input"
        minValue={parseDate('1900-01-01')}
        maxValue={august17}
      />
    )
    const { rerender } = render(picker(null))
    await user.click(segments('Date')[0]!)
    await user.keyboard('09012025')
    expect(typed('Date')).toBe('09/01/2025')
    rerender(picker(parseDate('2025-08-10')))
    expect(typed('Date')).toBe('08/10/2025')
    expect(segments('Date')[0]).not.toHaveAttribute('aria-invalid', 'true')
    rerender(picker(null))
    expect(typed('Date')).toBe('mm/dd/yyyy')
  })

  it('empties the input of what it could not take, typed or half typed, as the calendar swaps in, as Compose does', async () => {
    const user = userEvent.setup()
    render(
      <Picker
        defaultValue={undefined}
        defaultDisplayMode="input"
        minValue={parseDate('1900-01-01')}
        maxValue={parseDate('2025-09-30')}
      />,
    )
    const swap = (to: 'picker' | 'input') =>
      user.click(
        screen.getByRole('button', { name: toggleLabel(to === 'picker' ? 'input' : 'picker') }),
      )
    await user.click(segments('Date')[0]!)
    await user.keyboard('12252025')
    expect(typed('Date')).toBe('12/25/2025')
    await swap('picker')
    await swap('input')
    expect(typed('Date')).toBe('mm/dd/yyyy')
    expect(segments('Date')[0]).not.toHaveAttribute('aria-invalid', 'true')
    await user.click(segments('Date')[0]!)
    await user.keyboard('0812')
    expect(typed('Date')).toBe('08/12/yyyy')
    await swap('picker')
    await swap('input')
    expect(typed('Date')).toBe('mm/dd/yyyy')
  })

  it('shows the month of the date as the calendar swaps in, and stays where it was with none, as Compose does', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Picker />)
    const swap = async () => {
      await user.click(screen.getByRole('button', { name: toggleLabel('picker') }))
      await user.click(screen.getByRole('button', { name: toggleLabel('input') }))
    }
    await user.click(arrow('Next'))
    await user.click(arrow('Next'))
    expect(screen.getByRole('grid', { name: /October 2025/ })).toBeInTheDocument()
    await swap()
    expect(screen.getByRole('grid', { name: /August 2025/ })).toBeInTheDocument()
    await waitFor(() => expect(day(/August 17, 2025/)).toHaveFocus())
    unmount()
    render(<Picker defaultValue={undefined} defaultFocusedValue={august17} />)
    await user.click(arrow('Next'))
    await user.click(arrow('Next'))
    await swap()
    expect(screen.getByRole('grid', { name: /October 2025/ })).toBeInTheDocument()
  })

  it('shows the month of a date typed as the calendar swaps in, past the defaultFocusedValue given', async () => {
    const user = userEvent.setup()
    render(
      <Picker defaultValue={undefined} defaultFocusedValue={august17} defaultDisplayMode="input" />,
    )
    await user.click(segments('Date')[0]!)
    await user.keyboard('11032025')
    await user.click(screen.getByRole('button', { name: toggleLabel('input') }))
    await waitFor(() => expect(day(/November 3, 2025/)).toHaveFocus())
  })

  it('opens on the input given defaultDisplayMode, and follows a displayMode given', () => {
    const { rerender } = render(<Picker defaultDisplayMode="input" />)
    expect(away(screen.getByRole('grid', { hidden: true }))).not.toBeNull()
    expect(away(screen.getByRole('group', { name: 'Date' }))).toBeNull()
    rerender(<Picker displayMode="picker" />)
    expect(away(screen.getByRole('grid'))).toBeNull()
  })

  it('draws no text of its own: the title, the headline with no date and the field’s label are the caller’s', () => {
    const { container } = render(
      <Picker defaultValue={undefined}>
        <DatePickerHeader>
          <DatePickerHeadline />
          <DatePickerModeToggle aria-label="Eingabe" />
        </DatePickerHeader>
        <DatePickerContent>
          <DatePickerCalendar />
          <DatePickerInput />
        </DatePickerContent>
      </Picker>,
    )
    const header = container.querySelector<HTMLElement>('.date-picker-header')!
    expect(within(header).queryByRole('heading')).toBeNull()
    expect(header.querySelector('.date-picker-headline')!.textContent).toBe('')
    expect(screen.getByRole('group', { hidden: true })).toHaveAccessibleName('')
  })

  it('draws only the parts written in it: no mode toggle without a DatePickerModeToggle', () => {
    render(
      <Picker>
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </Picker>,
    )
    expect(screen.queryByRole('button', { name: /Switch to/ })).toBeNull()
    expect(screen.queryByRole('group', { hidden: true })).toBeNull()
    expect(screen.getByRole('grid', { name: /August 2025/ })).toBeInTheDocument()
  })

  it('is disabled or read-only as React Aria has it, the menu button and the input too', () => {
    const { rerender } = render(<Picker isDisabled />)
    expect(day(/August 17, 2025/)).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'August 2025' })).toBeDisabled()
    for (const segment of segments('Date')) expect(segment).toHaveAttribute('aria-disabled', 'true')
    rerender(<Picker isReadOnly />)
    for (const segment of segments('Date')) expect(segment).toHaveAttribute('aria-readonly', 'true')
  })
})

/** The picker in its dialog, as the stories piece them: OK saves the date picked, Cancel drops it. */
function Composed({
  onSave,
  dialog,
}: {
  onSave?: (value: DateValue | null) => void
  dialog?: Partial<DatePickerDialogProps>
}) {
  const [date, setDate] = useState<DateValue | null>(august17)
  const [picked, setPicked] = useState(date)
  return (
    <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(date)}>
      <Button>{date ? date.toString() : 'None'}</Button>
      <DatePickerDialog
        {...dialog}
        dismissButton={
          <Button variant="text" slot="close">
            Cancel
          </Button>
        }
        confirmButton={
          <Button
            variant="text"
            slot="close"
            onPress={() => {
              setDate(picked)
              onSave?.(picked)
            }}
          >
            OK
          </Button>
        }
      >
        <DatePicker value={picked} onChange={setPicked} autoFocus>
          {dateParts}
        </DatePicker>
      </DatePickerDialog>
    </DialogTrigger>
  )
}

const dialog = () => screen.getByRole('dialog')
const gone = () => waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

async function opened(props: Parameters<typeof Composed>[0] = {}) {
  const user = userEvent.setup()
  const result = render(<Composed {...props} />)
  await user.click(screen.getByRole('button', { name: '2025-08-17' }))
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
  return { user, ...result }
}

describe('DatePickerDialog', () => {
  it('is a dialog named by the picker’s title, holding the picker over the actions, Cancel first', async () => {
    await opened()
    expect(dialog()).toHaveAccessibleName('Select date')
    expect(day(/August 17, 2025/, dialog())).toHaveFocus()
    const actions = within(dialog()).getByRole('button', { name: 'OK' }).parentElement!
    expect(actions.parentElement).toBe(dialog())
    expect(actions.previousElementSibling).toContainElement(within(dialog()).getByRole('grid'))
    expect([...actions.children].map((it) => it.textContent)).toEqual(['Cancel', 'OK'])
  })

  it('puts a clear button given at the start of the actions', async () => {
    await opened({ dialog: { clearButton: <Button variant="text">Clear</Button> } })
    const actions = within(dialog()).getByRole('button', { name: 'OK' }).parentElement!
    expect([...actions.children].map((it) => it.textContent)).toEqual(['Clear', 'Cancel', 'OK'])
  })

  it('closes on its buttons in the close slot, OK saving the day picked and Cancel not', async () => {
    const onSave = vi.fn()
    const { user } = await opened({ onSave })
    await user.click(day(/August 20, 2025/, dialog()))
    await user.click(within(dialog()).getByRole('button', { name: 'Cancel' }))
    await gone()
    expect(onSave).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '2025-08-17' }))
    await user.click(day(/August 20, 2025/, dialog()))
    await user.click(within(dialog()).getByRole('button', { name: 'OK' }))
    await gone()
    expect(String(onSave.mock.lastCall![0])).toBe('2025-08-20')
    expect(screen.getByRole('button', { name: '2025-08-20' })).toBeInTheDocument()
  })

  it('closes on Escape and on a press on the scrim, unless not dismissable', async () => {
    const { user, unmount } = await opened()
    await user.keyboard('{Escape}')
    await gone()
    await user.click(screen.getByRole('button', { name: '2025-08-17' }))
    await user.click(dialog().parentElement!.parentElement!)
    await gone()
    unmount()
    const again = await opened({ dialog: { isDismissable: false } })
    await again.user.click(dialog().parentElement!.parentElement!)
    expect(dialog()).toBeInTheDocument()
  })

  it('leaves nothing where it is written while open, and gives the focus back to the button', async () => {
    const { user, container } = await opened()
    expect(container.contains(dialog())).toBe(false)
    await user.click(within(dialog()).getByRole('button', { name: 'OK' }))
    await gone()
    await waitFor(() => expect(screen.getByRole('button', { name: '2025-08-17' })).toHaveFocus())
  })

  it('gives the container its class, style and ref, and the dialog its aria-label', async () => {
    const ref = createRef<HTMLDivElement>()
    await opened({
      dialog: { className: 'm-0', style: { margin: 1 }, ref, 'aria-label': 'Departure' },
    })
    expect(ref.current).toBe(dialog().parentElement)
    expect(ref.current).toHaveClass('m-0')
    expect(ref.current).toHaveStyle({ margin: '1px' })
    expect(dialog()).toHaveAttribute('aria-label', 'Departure')
  })

  it('is inert while open given inert, as it is as it leaves', async () => {
    await opened({ dialog: { inert: true } })
    expect(dialog().parentElement).toHaveAttribute('inert')
  })
})

const range = { start: august17, end: parseDate('2025-08-23') }

function Range(props: Partial<DateRangePickerProps<CalendarDate>>) {
  return (
    <DateRangePicker defaultValue={range} {...props}>
      {props.children ?? rangeParts}
    </DateRangePicker>
  )
}

/** The range's headline, split before its end, by the text the two make, its spaces plain: Node's
 * Intl writes thin ones around a range's dash. */
const headline = (text: string) =>
  screen.getByText(
    (_, el) =>
      el?.tagName === 'SPAN' &&
      el.childElementCount === 2 &&
      el.textContent!.replace(/\s/g, ' ') === text,
  )

describe('DateRangePicker', () => {
  it('holds the header and the months in a column, two years of them around the range, each named', () => {
    render(<Range />)
    expect(screen.getByRole('heading', { name: 'Select dates' })).toBeInTheDocument()
    expect(headline('Aug 17 – 23, 2025')).toBeInTheDocument()
    expect(screen.getAllByRole('grid')).toHaveLength(24)
    expect(screen.getByRole('grid', { name: /August 2025/ })).toBeInTheDocument()
  })

  it('heads the range as React Aria’s locale writes one, split before its end, a day as a date', () => {
    const { unmount } = render(
      <I18nProvider locale="ja-JP">
        <Range />
      </I18nProvider>,
    )
    const japanese = headline('2025/08/17～2025/08/23')
    expect([...japanese.children].map((part) => part.textContent)).toEqual([
      '2025/08/17～',
      '2025/08/23',
    ])
    unmount()
    render(<Range defaultValue={{ start: august17, end: august17 }} />)
    expect(headline('Aug 17, 2025')).toBeInTheDocument()
  })

  it('reports the range once both ends are picked, as React Aria does, the headline naming the first meanwhile', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Range onChange={onChange} />)
    await user.click(day(/September 1, 2025/))
    expect(onChange).not.toHaveBeenCalled()
    expect(headline('Sep 1, 2025')).toBeInTheDocument()
    // React Aria lets the first go on Escape, the range kept.
    await user.keyboard('{Escape}')
    expect(headline('Aug 17 – 23, 2025')).toBeInTheDocument()
    await user.click(day(/September 1, 2025/))
    await user.click(day(/September 5, 2025/))
    expect(onChange).toHaveBeenCalledOnce()
    expect(headline('Sep 1 – 5, 2025')).toBeInTheDocument()
    expect(String(onChange.mock.lastCall![0].start)).toBe('2025-09-01')
    expect(String(onChange.mock.lastCall![0].end)).toBe('2025-09-05')
  })

  it('swaps to the two inputs, reporting a range once both hold dates in order, null meanwhile', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    // The months two years around August 2025, which the inputs take dates within.
    render(<Range defaultValue={undefined} defaultFocusedValue={august17} onChange={onChange} />)
    expect(screen.getByText('Start date – End date')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Switch to text input mode' }))
    await waitFor(() => expect(segments('Start date')[0]).toHaveFocus())
    expect(screen.getByText('Enter dates')).toBeInTheDocument()
    await user.keyboard('08232025')
    expect(headline('Aug 23, 2025')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    await user.click(segments('End date')[0]!)
    await user.keyboard('08172025')
    // Before the start, it is no end, as Compose's input has it: drawn invalid, with no range.
    expect(onChange).not.toHaveBeenCalled()
    expect(typed('End date')).toBe('08/17/2025')
    for (const segment of segments('End date'))
      expect(segment).toHaveAttribute('aria-invalid', 'true')
    expect(headline('Aug 23, 2025')).toBeInTheDocument()
    // With the start moved before it, it is the end.
    await user.click(segments('Start date')[1]!)
    await user.keyboard('10')
    expect(String(onChange.mock.lastCall![0].start)).toBe('2025-08-10')
    expect(String(onChange.mock.lastCall![0].end)).toBe('2025-08-17')
    expect(segments('End date')[0]).not.toHaveAttribute('aria-invalid', 'true')
    expect(headline('Aug 10 – 17, 2025')).toBeInTheDocument()
    // React Aria's field keeps its date until each of its segments is cleared.
    await user.click(segments('End date')[2]!)
    await user.keyboard('{Backspace>12/}')
    expect(typed('End date')).toBe('mm/dd/yyyy')
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(typed('Start date')).toBe('08/10/2025')
  })

  it('opens on the inputs given defaultDisplayMode', () => {
    render(<Range defaultDisplayMode="input" />)
    expect(away(screen.getByRole('group', { name: 'Start date' }))).toBeNull()
    expect(away(screen.getAllByRole('grid', { hidden: true })[0]!)).not.toBeNull()
    expect(typed('Start date')).toBe('08/17/2025')
    expect(typed('End date')).toBe('08/23/2025')
  })

  it('empties its inputs as the caller clears the range', () => {
    const { rerender } = render(
      <Range defaultValue={undefined} value={range} defaultDisplayMode="input" />,
    )
    expect(typed('Start date')).toBe('08/17/2025')
    rerender(<Range defaultValue={undefined} value={null} defaultDisplayMode="input" />)
    expect(typed('Start date')).toBe('mm/dd/yyyy')
    expect(typed('End date')).toBe('mm/dd/yyyy')
    expect(screen.getByText('Enter dates')).toBeInTheDocument()
  })

  it('bounds its inputs by the months the calendar holds, as well as the bounds given, whichever are nearer', async () => {
    const user = userEvent.setup()
    // React Aria's three months around the range's start: July to September 2025.
    render(
      <Range
        defaultDisplayMode="input"
        visibleDuration={{ months: 3 }}
        maxValue={parseDate('2025-09-15')}
      />,
    )
    const invalid = (name: string) =>
      segments(name).every((segment) => segment.getAttribute('aria-invalid') === 'true')
    expect(invalid('Start date') || invalid('End date')).toBe(false)
    await user.click(segments('Start date')[0]!)
    await user.keyboard('06302025')
    expect(invalid('Start date')).toBe(true)
    expect(screen.getByText('Value must be 07/01/2025 or later.')).toBeInTheDocument()
    await user.click(segments('Start date')[0]!)
    await user.keyboard('07')
    expect(typed('Start date')).toBe('07/30/2025')
    expect(invalid('Start date')).toBe(false)
    await user.click(segments('End date')[0]!)
    await user.keyboard('10012025')
    expect(invalid('End date')).toBe(true)
    expect(screen.getByText('Value must be 09/15/2025 or earlier.')).toBeInTheDocument()
  })

  it('reports no range for an end the months could not pick, which its field shows until the months swap in, as Compose does', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Range
        defaultDisplayMode="input"
        visibleDuration={{ months: 3 }}
        maxValue={parseDate('2025-09-30')}
        onChange={onChange}
      />,
    )
    await user.click(segments('End date')[0]!)
    await user.keyboard('10052025')
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(typed('End date')).toBe('10/05/2025')
    expect(screen.getByText('Value must be 09/30/2025 or earlier.')).toBeInTheDocument()
    expect(headline('Aug 17, 2025')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: toggleLabel('input') }))
    // No band: the months hold no range.
    expect(document.querySelector('[data-selected]')).toBeNull()
    await waitFor(() => expect(day(/August 17, 2025/)).toHaveFocus())
    await user.click(screen.getByRole('button', { name: toggleLabel('picker') }))
    expect(typed('Start date')).toBe('08/17/2025')
    expect(typed('End date')).toBe('mm/dd/yyyy')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('drops an end typed that it could not take once a range is given in its place, cleared after', async () => {
    const user = userEvent.setup()
    const picker = (value: RangeValue<CalendarDate> | null) => (
      <Range
        defaultValue={undefined}
        value={value}
        defaultFocusedValue={august17}
        defaultDisplayMode="input"
        maxValue={parseDate('2025-09-30')}
      />
    )
    const { rerender } = render(picker(null))
    await user.click(segments('End date')[0]!)
    await user.keyboard('10052025')
    expect(typed('End date')).toBe('10/05/2025')
    rerender(picker(range))
    expect(typed('Start date')).toBe('08/17/2025')
    expect(typed('End date')).toBe('08/23/2025')
    expect(segments('End date')[0]).not.toHaveAttribute('aria-invalid', 'true')
    expect(headline('Aug 17 – 23, 2025')).toBeInTheDocument()
    rerender(picker(null))
    expect(typed('Start date')).toBe('mm/dd/yyyy')
    expect(typed('End date')).toBe('mm/dd/yyyy')
  })

  it('reports no range typed over an unavailable day, which the months could not pick, unless allowsNonContiguousRanges', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const picker = (props: Partial<DateRangePickerProps<CalendarDate>> = {}) => (
      <Range
        defaultValue={undefined}
        defaultFocusedValue={august17}
        defaultDisplayMode="input"
        isDateUnavailable={(date) => isWeekend(date, 'en-US')}
        onChange={onChange}
        {...props}
      />
    )
    // Friday to Monday, over the weekend.
    const enter = async () => {
      await user.click(segments('Start date')[0]!)
      await user.keyboard('08222025')
      await user.click(segments('End date')[0]!)
      await user.keyboard('08252025')
    }
    const { unmount } = render(picker())
    await enter()
    expect(onChange).not.toHaveBeenCalledWith(expect.anything())
    expect(typed('End date')).toBe('08/25/2025')
    expect(screen.getByText('Value must be 08/22/2025 or earlier.')).toBeInTheDocument()
    expect(headline('Aug 22, 2025')).toBeInTheDocument()
    unmount()
    render(picker({ allowsNonContiguousRanges: true }))
    await enter()
    expect(String(onChange.mock.lastCall![0].start)).toBe('2025-08-22')
    expect(String(onChange.mock.lastCall![0].end)).toBe('2025-08-25')
  })

  it('checks an end typed as the months check the day picked after the start: with the start as the anchor', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Range
        defaultValue={undefined}
        defaultFocusedValue={august17}
        defaultDisplayMode="input"
        // A week at most from the day picked first.
        isDateUnavailable={(date, anchor) => !!anchor && date.compare(anchor.add({ days: 7 })) > 0}
        allowsNonContiguousRanges
        onChange={onChange}
      />,
    )
    await user.click(segments('Start date')[0]!)
    await user.keyboard('08172025')
    await user.click(segments('End date')[0]!)
    await user.keyboard('08302025')
    expect(onChange).not.toHaveBeenCalledWith(expect.anything())
    expect(typed('End date')).toBe('08/30/2025')
    expect(screen.getByText('Selected date unavailable.')).toBeInTheDocument()
    await user.click(segments('End date')[1]!)
    await user.keyboard('24')
    expect(String(onChange.mock.lastCall![0].start)).toBe('2025-08-17')
    expect(String(onChange.mock.lastCall![0].end)).toBe('2025-08-24')
  })

  it('reports no range typed over an unavailable day however far it is, with no months to bound its inputs', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const newYear = parseDate('2028-01-01')
    render(
      <DateRangePicker
        defaultDisplayMode="input"
        isDateUnavailable={(date) => date.compare(newYear) === 0}
        onChange={onChange}
      >
        <DatePickerContent>
          <DateRangePickerInput startLabel="Start date" endLabel="End date" />
        </DatePickerContent>
      </DateRangePicker>,
    )
    // Three years, past the 24 months React Aria's would show.
    await user.click(segments('Start date')[0]!)
    await user.keyboard('08172025')
    await user.click(segments('End date')[0]!)
    await user.keyboard('08172028')
    expect(onChange).not.toHaveBeenCalledWith(expect.anything())
    expect(screen.getByText('Value must be 12/31/2027 or earlier.')).toBeInTheDocument()
  })

  it('looks for an unavailable day no further than the calendar’s last, which a day added stays at', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <DateRangePicker
        defaultDisplayMode="input"
        isDateUnavailable={() => false}
        onChange={onChange}
      >
        <DatePickerContent>
          <DateRangePickerInput startLabel="Start date" endLabel="End date" />
        </DatePickerContent>
      </DateRangePicker>,
    )
    await user.click(segments('Start date')[0]!)
    await user.keyboard('12309999')
    await user.click(segments('End date')[0]!)
    await user.keyboard('12319999')
    expect(String(onChange.mock.lastCall![0].start)).toBe('9999-12-30')
    expect(String(onChange.mock.lastCall![0].end)).toBe('9999-12-31')
  })

  it('draws as many months as its visibleDuration holds, given in years too', () => {
    render(<Range visibleDuration={{ years: 1 }} />)
    const grids = screen.getAllByRole('grid')
    expect(grids).toHaveLength(12)
    expect(grids[0]).toHaveAccessibleName(/January 2025/)
    expect(grids.at(-1)).toHaveAccessibleName(/December 2025/)
  })

  it('draws its months up to the calendar’s last, December 9999, which a month added stays at', () => {
    render(
      <Range defaultValue={{ start: parseDate('9999-12-01'), end: parseDate('9999-12-05') }} />,
    )
    expect(screen.getAllByRole('grid').at(-1)).toHaveAccessibleName(/December 9999/)
  })

  it('heads the range its inputs hold, not the day the months were picking from', async () => {
    const user = userEvent.setup()
    // Swapped by the caller: a press outside the months or the focus leaving them would end the
    // range React Aria's months were picking.
    const { rerender } = render(<Range displayMode="picker" />)
    await user.click(day(/September 1, 2025/))
    expect(headline('Sep 1, 2025')).toBeInTheDocument()
    rerender(<Range displayMode="input" />)
    expect(typed('Start date')).toBe('08/17/2025')
    expect(headline('Aug 17 – 23, 2025')).toBeInTheDocument()
  })

  it('shows the month of the start as the months swap in, the start typed alone too, as Compose does', async () => {
    const user = userEvent.setup()
    render(
      <Range defaultValue={undefined} defaultFocusedValue={august17} defaultDisplayMode="input" />,
    )
    await user.click(segments('Start date')[0]!)
    await user.keyboard('11032025')
    await user.click(screen.getByRole('button', { name: toggleLabel('input') }))
    await waitFor(() => expect(day(/November 3, 2025/)).toHaveFocus())
  })
})
