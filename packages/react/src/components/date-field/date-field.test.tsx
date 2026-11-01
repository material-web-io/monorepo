import { CalendarDate, parseDate } from '@internationalized/date'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState, type ComponentProps } from 'react'
import {
  DialogTrigger,
  Heading,
  type DateInputRenderProps,
  type DateValue,
} from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Button } from '../button'
import {
  DatePicker,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerDialog,
  DatePickerHeader,
  DatePickerHeadline,
} from '../date-picker'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { DateField, type DateFieldProps } from '.'

/* Markup and behavior that jsdom can check without a stylesheet: the React Aria DateField the
 * field is, its label, supporting and error texts, its trailing icon, the date's `<div>` drawn by
 * `input`, and the date picker it opens. Geometry and colors: date-field.browser.test.tsx. */

const august17 = parseDate('2025-08-17')

const segments = () => screen.getAllByRole('spinbutton')
/** The date the field shows, segment by segment. */
const typed = () =>
  segments()
    .map((segment) => segment.textContent)
    .join('/')
/** React Aria's DateInput, the group of the segments, which the label names. */
const group = (name: string) => screen.getByRole('group', { name })

function Field(props: Partial<DateFieldProps<CalendarDate>>) {
  return <DateField label="Date" defaultValue={august17} {...props} />
}

describe('DateField', () => {
  it('is a div holding the container, its group named by the label, and the supporting text', () => {
    const { container } = render(<Field />)
    const root = container.firstElementChild!
    expect(root.tagName).toBe('DIV')
    expect(root).toContainElement(group('Date'))
    // Described by the format, after the date React Aria describes it with.
    expect(group('Date')).toHaveAccessibleDescription(/MM\/DD\/YYYY$/)
    expect(root.children).toHaveLength(2)
  })

  it('shows the date in segments, React Aria DateSegments with leading zeros', () => {
    render(<Field />)
    expect(segments()).toHaveLength(3)
    expect(typed()).toBe('08/17/2025')
    for (const segment of segments()) expect(segment).toHaveAttribute('tabindex', '0')
  })

  it("shows each segment's placeholder while empty, and the format under the field", () => {
    render(<Field defaultValue={undefined} />)
    expect(typed()).toBe('mm/dd/yyyy')
    expect(screen.getByText('MM/DD/YYYY')).toBeInTheDocument()
    expect(group('Date')).toHaveAccessibleDescription('MM/DD/YYYY')
  })

  it('takes its own supporting text, or none', () => {
    const { rerender } = render(<Field description="Month, day, year" />)
    expect(group('Date')).toHaveAccessibleDescription(/Month, day, year$/)
    expect(screen.queryByText('MM/DD/YYYY')).toBeNull()
    rerender(<Field description={null} />)
    expect(screen.queryByText('MM/DD/YYYY')).toBeNull()
    expect(group('Date')).not.toHaveAccessibleDescription(/MM\/DD\/YYYY/)
  })

  it('ends a required label with an asterisk, and takes aria-label in place of a label', () => {
    const { rerender } = render(<Field isRequired />)
    expect(group('Date*')).toBeInTheDocument()
    rerender(<DateField aria-label="Event date" />)
    expect(group('Event date')).toBeInTheDocument()
    expect(screen.queryByText('Event date')).toBeNull()
  })

  it('reports each date typed, as React Aria does', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Field defaultValue={undefined} onChange={onChange} />)
    await user.click(segments()[0]!)
    await user.keyboard('08172025')
    expect(typed()).toBe('08/17/2025')
    expect(String(onChange.mock.lastCall![0])).toBe('2025-08-17')
  })

  it('is disabled, read-only or invalid as React Aria has it', () => {
    const { rerender } = render(<Field isDisabled />)
    for (const segment of segments()) expect(segment).toHaveAttribute('aria-disabled', 'true')
    rerender(<Field isReadOnly />)
    for (const segment of segments()) expect(segment).toHaveAttribute('aria-readonly', 'true')
    rerender(<Field isInvalid />)
    for (const segment of segments()) expect(segment).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows the error text React Aria finds, such as a date past the bounds', async () => {
    const user = userEvent.setup()
    render(<Field defaultValue={undefined} maxValue={august17} validationBehavior="aria" />)
    await user.click(segments()[0]!)
    await user.keyboard('09012025')
    expect(screen.getByText(/after|before|greater|less|later|earlier/i)).toBeInTheDocument()
  })

  it('gives its outermost element its class, style and ref, and sends its date in a form', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(
      <form>
        <Field className="w-90" style={{ margin: 1 }} ref={ref} name="date" />
      </form>,
    )
    expect(ref.current).toBe(container.querySelector('form')!.firstElementChild)
    expect(ref.current).toHaveClass('w-90')
    expect(ref.current).toHaveStyle({ margin: '1px' })
    expect(new FormData(container.querySelector('form')!).get('date')).toBe('2025-08-17')
  })

  it('draws the trailing icon in the container, after the date, or a function of the state', () => {
    const { rerender } = render(
      <Field trailing={<IconButton aria-label="Calendar">{<Icon name="today" />}</IconButton>} />,
    )
    const button = screen.getByRole('button', { name: 'Calendar' })
    expect(group('Date').parentElement).toContainElement(button)
    expect(
      group('Date').compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    rerender(<Field isInvalid trailing={({ isInvalid }) => (isInvalid ? 'Error' : 'Fine')} />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('disables a trailing icon button with the field, unless it says it is enabled, as TextField does', () => {
    const calendar = (isDisabled?: boolean) => (
      <IconButton aria-label="Calendar" isDisabled={isDisabled}>
        <Icon name="today" />
      </IconButton>
    )
    const { rerender } = render(<Field isDisabled trailing={calendar()} />)
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeDisabled()
    rerender(<Field isDisabled trailing={calendar(false)} />)
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeEnabled()
    rerender(<Field trailing={calendar()} />)
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeEnabled()
  })

  describe('input', () => {
    it("draws the div it returns in React Aria's DateInput's place, the segments in it", async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(
        <Field
          description="Month, day, year"
          onChange={onChange}
          input={(props) => <div {...props} title="Event date" data-testid="date" />}
        />,
      )
      const input = screen.getByTestId('date')
      expect(group('Date')).toBe(input)
      expect(input).toHaveAttribute('title', 'Event date')
      expect(input).toHaveAccessibleDescription(/Month, day, year$/)
      expect(within(input).getAllByRole('spinbutton')).toHaveLength(3)
      expect(typed()).toBe('08/17/2025')
      await user.click(segments()[0]!)
      await user.keyboard('09')
      expect(String(onChange.mock.lastCall![0])).toBe('2025-09-17')
    })

    it("is called with the DateInput's render props", async () => {
      const user = userEvent.setup()
      render(
        <DateField
          aria-label="Date"
          isInvalid
          input={(props, { isFocusWithin, isInvalid }) => (
            <div {...props} data-state={`${isFocusWithin ? 'focused' : 'resting'} ${isInvalid}`} />
          )}
        />,
      )
      expect(group('Date')).toHaveAttribute('data-state', 'resting true')
      await user.click(segments()[0]!)
      expect(group('Date')).toHaveAttribute('data-state', 'focused true')
    })

    it("is typed as DateInput's render, of a div", () => {
      type Input = NonNullable<DateFieldProps<CalendarDate>['input']>
      expectTypeOf<Input>().parameter(0).toEqualTypeOf<ComponentProps<'div'>>()
      expectTypeOf<Input>().parameter(1).toEqualTypeOf<DateInputRenderProps>()
    })
  })
})

/** The field with the calendar button that opens a date picker, as the WithDatePicker story has
 * it: the picker's header with its title, over the calendar. */
function WithDatePicker() {
  const [date, setDate] = useState<DateValue | null>(august17)
  const [picked, setPicked] = useState(date)
  return (
    <DateField
      label="Date"
      value={date}
      onChange={setDate}
      trailing={
        <DialogTrigger onOpenChange={(isOpen) => isOpen && setPicked(date)}>
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
              <Button variant="text" slot="close" onPress={() => setDate(picked)}>
                OK
              </Button>
            }
          >
            <DatePicker value={picked} onChange={setPicked} autoFocus>
              <DatePickerHeader>
                <Heading slot="title">Select date</Heading>
                <DatePickerHeadline />
              </DatePickerHeader>
              <DatePickerContent>
                <DatePickerCalendar />
              </DatePickerContent>
            </DatePicker>
          </DatePickerDialog>
        </DialogTrigger>
      }
    />
  )
}

describe('DateField with a date picker', () => {
  it('opens the picker from its calendar button and takes the date OK saves', async () => {
    const user = userEvent.setup()
    render(<WithDatePicker />)
    await user.click(screen.getByRole('button', { name: 'Calendar' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('Select date')
    await user.click(within(dialog).getByRole('button', { name: /August 20, 2025/ }))
    await user.click(within(dialog).getByRole('button', { name: 'OK' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    const field = within(screen.getByRole('group', { name: 'Date' }))
    expect(
      field
        .getAllByRole('spinbutton')
        .map((it) => it.textContent)
        .join('/'),
    ).toBe('08/20/2025')
  })
})
