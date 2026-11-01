import { CalendarDateTime, Time } from '@internationalized/date'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState, type FormEvent } from 'react'
import {
  DialogTrigger,
  FieldError,
  Heading,
  I18nProvider,
  Text,
  type TimeValue,
} from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../button'
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
  type TimePickerProps,
  type TimePickerRenderProps,
} from '.'

/* What jsdom can check without a stylesheet: what the picker holds and reports, and when, its
 * segments, selector and dial, their keys and names, the modes and its dialog. Geometry, colors
 * and motion: time-picker.browser.test.tsx. */

const seven = new Time(7, 0)

/** The mode toggle's name, in English, for the display mode it swaps from. */
const toggleLabel = (displayMode: TimePickerDisplayMode) =>
  displayMode === 'picker' ? 'Switch to text input mode' : 'Switch to touch input mode'

/** A time picker's parts, as the README writes them, their text in English. */
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

function Picker(props: Partial<TimePickerProps<TimeValue>>) {
  return (
    <TimePicker aria-label="Time" defaultValue={seven} {...props}>
      {props.children ?? parts}
    </TimePicker>
  )
}

/** The segments of the time, by the field's name. */
const segments = (name = 'Time') =>
  within(screen.getByRole('group', { name })).getAllByRole('spinbutton')
/** The hour and the minute as the segments show them, e.g. `07:00`, with the period. */
const shown = () =>
  segments()
    .map((segment) => segment.textContent)
    .join(':')
const segment = (type: 'hour' | 'minute') =>
  segments().find((it) => it.getAttribute('data-type') === type)!
/** The dial's numbers, by the group's name. */
const numbers = (name: string) =>
  within(screen.getByRole('radiogroup', { name })).getAllByRole('radio')
const periods = () => within(screen.getByRole('radiogroup', { name: 'Select AM or PM' }))
const selectedBox = () => document.querySelector('.time-picker-input-segment-selected')!
/** The box of a segment, which is filled while it is the selection. */
const box = (type: 'hour' | 'minute') => segment(type).parentElement!
/** The hour and the minute inputs of the input mode, named by the labels. */
const inputs = () => ({
  hour: screen.getByRole('textbox', { name: 'Hour' }) as HTMLInputElement,
  minute: screen.getByRole('textbox', { name: 'Minute' }) as HTMLInputElement,
})

describe('TimePicker', () => {
  it('is React Aria’s TimeField holding the header, its title a heading, the time’s segments, the period selector and the dial', () => {
    const { container } = render(<Picker />)
    expect(container.firstElementChild).toHaveClass('time-picker')
    expect(container.firstElementChild).toContainElement(
      screen.getByRole('group', { name: 'Time' }),
    )
    expect(screen.getByRole('heading', { name: 'Select time' })).toBeInTheDocument()
    expect(segments().map((it) => it.getAttribute('data-type'))).toEqual([
      'hour',
      'minute',
      'dayPeriod',
    ])
    expect(shown()).toBe('07:00:AM')
    expect(periods().getByRole('radio', { name: 'AM' })).toBeChecked()
    expect(periods().getByRole('radio', { name: 'PM' })).not.toBeChecked()
    expect(numbers('Select hour').map((it) => it.textContent)).toEqual([
      '12',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
    ])
    expect(screen.getByRole('radio', { name: '7 hours' })).toBeChecked()
  })

  it('names the numbers as the locale counts hours and minutes, and writes zero as 00', () => {
    render(
      <I18nProvider locale="fr-FR">
        <Picker defaultValue={new Time(7, 0)} defaultSelection="minute" />
      </I18nProvider>,
    )
    expect(numbers('Select minute').map((it) => it.textContent)).toEqual([
      '00',
      '5',
      '10',
      '15',
      '20',
      '25',
      '30',
      '35',
      '40',
      '45',
      '50',
      '55',
    ])
    expect(screen.getByRole('radio', { name: '0 minute' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '30 minutes' })).toBeInTheDocument()
  })

  it('gives its outermost element its class, style and ref', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<Picker className="w-90" style={{ margin: 1 }} ref={ref} />)
    expect(container.firstElementChild).toBe(ref.current)
    expect(ref.current).toHaveClass('time-picker', 'w-90')
    expect(ref.current).toHaveStyle({ margin: '1px' })
  })

  it('selects the hour, which the dial sets, until a segment focused or an hour picked selects the minute', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(<Picker onSelectionChange={onSelectionChange} />)
    expect(selectedBox()).toBe(box('hour'))
    expect(screen.getByRole('radiogroup', { name: 'Select hour' })).toBeInTheDocument()
    await user.click(segment('minute'))
    expect(onSelectionChange).toHaveBeenLastCalledWith('minute')
    expect(selectedBox()).toBe(box('minute'))
    expect(screen.getByRole('radiogroup', { name: 'Select minute' })).toBeInTheDocument()
    await user.click(segment('hour'))
    expect(selectedBox()).toBe(box('hour'))
  })

  it('follows a selection given, and opens on the one given as default', () => {
    const { rerender } = render(<Picker defaultSelection="minute" />)
    expect(selectedBox()).toBe(box('minute'))
    rerender(<Picker key="given" selection="hour" />)
    expect(selectedBox()).toBe(box('hour'))
  })

  it('reports a number picked on the dial by the keys, in the period the time is in, and stays on the hours', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker defaultValue={new Time(19, 0)} onChange={onChange} />)
    expect(shown()).toBe('07:00:PM')
    const nine = screen.getByRole('radio', { name: '9 hours' })
    nine.focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(21, 0))
    expect(shown()).toBe('09:00:PM')
    expect(nine).toBeChecked()
    expect(screen.getByRole('radiogroup', { name: 'Select hour' })).toBeInTheDocument()
  })

  it('leaves the arrow keys to the numbers: none turns the hand or passes the dial on', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onSelectionChange = vi.fn()
    render(<Picker onChange={onChange} onSelectionChange={onSelectionChange} />)
    screen.getByRole('radio', { name: '7 hours' }).focus()
    await user.keyboard('{ArrowRight}{ArrowDown>10/}')
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: '8 hours' }))
    expect(onChange).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(onSelectionChange).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: '7 hours' })).toBeChecked()
  })

  it('shows an hour typed while the minute is unset, and keeps it as the dial fills the rest from the placeholder', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker defaultValue={undefined} onChange={onChange} />)
    segment('hour').focus()
    await user.keyboard('7')
    expect(onChange).not.toHaveBeenCalled()
    await user.click(segment('hour'))
    expect(screen.getByRole('radio', { name: '7 hours' })).toBeChecked()
    await user.click(segment('minute'))
    expect(screen.getByRole('radio', { name: '0 minutes' })).toBeChecked()
    screen.getByRole('radio', { name: '30 minutes' }).focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(7, 30))
    expect(shown()).toBe('07:30:AM')
  })

  it('reports a minute picked on the dial', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} defaultSelection="minute" />)
    screen.getByRole('radio', { name: '45 minutes' }).focus()
    await user.keyboard(' ')
    expect(onChange).toHaveBeenLastCalledWith(new Time(7, 45))
    expect(shown()).toBe('07:45:AM')
  })

  it('takes the number already selected picked by the keys: with no time it sets one from the placeholder, and it fills a cleared segment back', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker defaultValue={undefined} onChange={onChange} />)
    const twelve = screen.getByRole('radio', { name: '12 hours' })
    expect(twelve).toBeChecked()
    twelve.focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(0, 0))
    expect(shown()).toBe('12:00:AM')
    segment('minute').focus()
    await user.keyboard('{Backspace}')
    expect(segment('minute')).toHaveAttribute('data-placeholder')
    const zero = screen.getByRole('radio', { name: '0 minutes' })
    expect(zero).toBeChecked()
    zero.focus()
    await user.keyboard(' ')
    expect(segment('minute')).not.toHaveAttribute('data-placeholder')
    expect(shown()).toBe('12:00:AM')
  })

  it('reports the period picked, the hour going forward or back twelve, and shows it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} />)
    await user.click(periods().getByRole('radio', { name: 'PM' }))
    expect(onChange).toHaveBeenLastCalledWith(new Time(19, 0))
    expect(periods().getByRole('radio', { name: 'PM' })).toBeChecked()
    expect(shown()).toBe('07:00:PM')
    await user.click(periods().getByRole('radio', { name: 'AM' }))
    expect(onChange).toHaveBeenLastCalledWith(new Time(7, 0))
  })

  it('takes a time typed into the segments over the dial, as React Aria does, moving along as each is full', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} />)
    segment('hour').focus()
    await user.keyboard('1130')
    expect(onChange).toHaveBeenLastCalledWith(new Time(11, 30))
    expect(shown()).toBe('11:30:AM')
  })

  it('holds a text input in each box in input mode, named by the labels, typed as Compose’s: the hour handing on to the minute as two digits fill it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} displayMode="input" />)
    const { hour, minute } = inputs()
    expect([hour.value, minute.value]).toEqual(['07', '00'])
    expect(document.querySelector('[data-type="hour"], [data-type="minute"]')).toBeNull()
    expect(hour).toHaveAttribute('inputmode', 'numeric')
    await user.click(hour)
    expect(selectedBox()).toBe(hour.parentElement)
    hour.setSelectionRange(0, 2)
    await user.keyboard('11')
    expect(onChange).toHaveBeenLastCalledWith(new Time(11, 0))
    expect(document.activeElement).toBe(minute)
    expect(selectedBox()).toBe(minute.parentElement)
    minute.setSelectionRange(0, 2)
    await user.keyboard('30')
    expect(onChange).toHaveBeenLastCalledWith(new Time(11, 30))
    expect([hour.value, minute.value]).toEqual(['11', '30'])
  })

  it('starts a full input over with the digit typed into it, hands on at once from 2 to 9 on a 12-hour clock, and refuses what is no digit', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} displayMode="input" />)
    const { hour, minute } = inputs()
    // A digit typed between the two of 07 starts the hour over with it: 1, which may go on.
    await user.click(hour)
    hour.setSelectionRange(1, 1)
    await user.keyboard('1')
    expect(hour.value).toBe('1')
    expect(onChange).toHaveBeenLastCalledWith(new Time(1, 0))
    expect(document.activeElement).toBe(hour)
    await user.keyboard('a')
    expect(hour.value).toBe('1')
    await user.keyboard('2')
    expect(hour.value).toBe('12')
    expect(onChange).toHaveBeenLastCalledWith(new Time(0, 0))
    expect(document.activeElement).toBe(minute)
    // A 9 typed after the two of 12 starts it over too, and hands on at once.
    await user.click(hour)
    hour.setSelectionRange(2, 2)
    await user.keyboard('9')
    expect(hour.value).toBe('9')
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 0))
    expect(document.activeElement).toBe(minute)
  })

  it('takes a paste whole, refused where it would overfill the input, where a digit typed into a full one starts it over', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} displayMode="input" />)
    const { hour } = inputs()
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.paste('123')
    expect([hour.value, hour.selectionStart]).toEqual(['07', 2])
    expect(onChange).not.toHaveBeenCalled()
    // Pasted over all of it, 079 reads as 07 with a 9 typed after: refused all the same, a paste.
    hour.setSelectionRange(0, 2)
    await user.paste('079')
    expect(hour.value).toBe('07')
    expect(onChange).not.toHaveBeenCalled()
    hour.setSelectionRange(1, 2)
    await user.paste('30')
    expect(hour.value).toBe('07')
    expect(onChange).not.toHaveBeenCalled()
    hour.setSelectionRange(0, 2)
    await user.paste('11')
    expect(hour.value).toBe('11')
    expect(onChange).toHaveBeenLastCalledWith(new Time(11, 0))
    await user.click(hour)
    hour.setSelectionRange(2, 2)
    await user.keyboard('9')
    expect(hour.value).toBe('9')
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 0))
  })

  it('takes typing from the event: a composition’s text as well, but a script’s text of more than a character not', () => {
    const onChange = vi.fn()
    render(<Picker onChange={onChange} displayMode="input" />)
    const { hour } = inputs()
    hour.focus()
    fireEvent.input(hour, { target: { value: '079' }, inputType: 'insertText', data: '079' })
    expect(hour.value).toBe('07')
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.input(hour, {
      target: { value: '079' },
      inputType: 'insertCompositionText',
      data: '079',
    })
    expect(hour.value).toBe('9')
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 0))
    const { minute } = inputs()
    fireEvent.input(minute, {
      target: { value: '003' },
      inputType: 'insertFromComposition',
      data: '3',
    })
    expect(minute.value).toBe('3')
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 3))
  })

  it('refuses a digit that takes the number past the clock, the text and the caret as they were, and takes an empty input as midnight, or noon, and zero minutes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} displayMode="input" />)
    const { hour, minute } = inputs()
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('13')
    expect([hour.value, hour.selectionStart]).toEqual(['1', 1])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(new Time(1, 0))
    expect(document.activeElement).toBe(hour)
    // A 5 typed before the 1 would make 51: refused too, the caret left before the 1.
    hour.setSelectionRange(0, 0)
    await user.keyboard('5')
    expect([hour.value, hour.selectionStart]).toEqual(['1', 0])
    expect(onChange).toHaveBeenCalledTimes(1)
    await user.keyboard('{Delete}')
    expect(hour.value).toBe('')
    expect(onChange).toHaveBeenLastCalledWith(new Time(0, 0))
    await user.click(minute)
    minute.setSelectionRange(0, 2)
    await user.keyboard('75')
    expect(minute.value).toBe('7')
    expect(onChange).toHaveBeenLastCalledWith(new Time(0, 7))
    await user.keyboard('{Backspace}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(0, 0))
  })

  it('moves the caret on the arrow keys in an input, which React Aria’s group would take for its segments', async () => {
    const user = userEvent.setup()
    render(<Picker displayMode="input" />)
    const { hour, minute } = inputs()
    await user.click(hour)
    hour.setSelectionRange(2, 2)
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(hour)
    expect(hour.selectionStart).toBe(1)
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(document.activeElement).toBe(hour)
    expect(hour.selectionStart).toBe(2)
    await user.click(minute)
    minute.setSelectionRange(0, 0)
    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(minute)
  })

  it('takes an empty hour in the afternoon as noon', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker defaultValue={new Time(19, 0)} onChange={onChange} displayMode="input" />)
    const { hour } = inputs()
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('{Backspace}')
    expect(hour.value).toBe('')
    expect(onChange).toHaveBeenLastCalledWith(new Time(12, 0))
  })

  it('counts the hour to 11 where the locale does with a 12-hour clock, as Japanese: 12 is refused, and an empty hour is noon in the afternoon', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <I18nProvider locale="ja-JP">
        <Picker
          hourCycle={12}
          defaultValue={new Time(19, 0)}
          onChange={onChange}
          displayMode="input"
        />
      </I18nProvider>,
    )
    const { hour } = inputs()
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('12')
    expect(hour.value).toBe('1')
    expect(onChange).toHaveBeenLastCalledWith(new Time(13, 0))
    await user.keyboard('{Backspace}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(12, 0))
  })

  it('types the locale’s digits, Arabic-Indic ones as Egypt writes them', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <I18nProvider locale="ar-EG">
        <Picker hourCycle={12} onChange={onChange} displayMode="input" />
      </I18nProvider>,
    )
    const { hour } = inputs()
    expect(hour.value).toBe('٠٧')
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('٩')
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 0))
    expect(hour.value).toBe('٩')
  })

  it('rewrites the inputs as the locale writes the same number anew, or its zero, and keeps what is typed otherwise', async () => {
    const user = userEvent.setup()
    const picker = (locale: string, zeros = true) => (
      <I18nProvider locale={locale}>
        <Picker hourCycle={12} displayMode="input" shouldForceLeadingZeros={zeros} />
      </I18nProvider>
    )
    const { rerender } = render(picker('en-US'))
    const { hour, minute } = inputs()
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('7')
    expect(hour.value).toBe('7')
    rerender(picker('en-US'))
    expect(hour.value).toBe('7')
    rerender(picker('ar-EG'))
    expect([hour.value, minute.value]).toEqual(['٠٧', '٠٠'])
    rerender(picker('ar-EG', false))
    expect([hour.value, minute.value]).toEqual(['٧', '٠٠'])
  })

  it('puts the text back as a controlled owner holds its time', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker value={new Time(5, 0)} onChange={onChange} displayMode="input" />)
    const { hour } = inputs()
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('7')
    expect(onChange).toHaveBeenLastCalledWith(new Time(7, 0))
    expect(hour.value).toBe('05')
  })

  it('reads a digit by its place in its script’s run of ten, where runs adjoin as the mathematical digits’ do, and counts digits beyond the first plane as one each', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <I18nProvider locale="en-u-nu-mathdbl">
        <Picker hourCycle={12} onChange={onChange} displayMode="input" />
      </I18nProvider>,
    )
    const { hour, minute } = inputs()
    expect(hour.value).toBe('𝟘𝟟')
    // A character beyond the first plane is two keys to the keyboard: pasted instead.
    await user.click(hour)
    hour.setSelectionRange(0, 4)
    await user.paste('𝟙')
    expect(hour.value).toBe('𝟙')
    expect(onChange).toHaveBeenLastCalledWith(new Time(1, 0))
    expect(document.activeElement).toBe(hour)
    await user.paste('𝟚')
    expect(hour.value).toBe('𝟙𝟚')
    expect(onChange).toHaveBeenLastCalledWith(new Time(0, 0))
    expect(document.activeElement).toBe(minute)
    // A third digit typed starts the full hour over with it, the caret after it: as the browser
    // reports typing, the caret after the text set, since the keyboard cannot send one character
    // beyond the first plane.
    await user.click(hour)
    fireEvent.input(hour, { target: { value: '𝟙𝟚𝟡' }, inputType: 'insertText' })
    expect([hour.value, hour.selectionStart]).toEqual(['𝟡', 2])
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 0))
    expect(document.activeElement).toBe(minute)
    minute.setSelectionRange(0, 4)
    await user.paste('𝟛𝟘')
    expect(minute.value).toBe('𝟛𝟘')
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 30))
  })

  it('writes and takes the digits of a locale beyond the first plane, Fula in Adlam, two to a number', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <I18nProvider locale="ff-Adlm">
        <Picker defaultValue={new Time(10, 5)} onChange={onChange} displayMode="input" />
      </I18nProvider>,
    )
    const { hour, minute } = inputs()
    expect([hour.value, minute.value]).toEqual(['𞥑𞥐', '𞥐𞥕'])
    await user.click(minute)
    minute.setSelectionRange(0, 4)
    await user.paste('𞥑𞥐')
    expect(minute.value).toBe('𞥑𞥐')
    expect(onChange).toHaveBeenLastCalledWith(new Time(10, 10))
  })

  it('takes the Han numerals of hanidec, which the field writes though Unicode counts them no digits', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <I18nProvider locale="zh-CN-u-nu-hanidec">
        <Picker defaultValue={new Time(7, 30)} onChange={onChange} displayMode="input" />
      </I18nProvider>,
    )
    const { hour, minute } = inputs()
    expect([hour.value, minute.value]).toEqual(['〇七', '三〇'])
    await user.click(minute)
    minute.setSelectionRange(2, 2)
    await user.keyboard('{Backspace}')
    expect(minute.value).toBe('三')
    expect(onChange).toHaveBeenLastCalledWith(new Time(7, 3))
    await user.keyboard('五')
    expect(minute.value).toBe('三五')
    expect(onChange).toHaveBeenLastCalledWith(new Time(7, 35))
  })

  it('names an input given no label as the locale calls the field', () => {
    render(
      <I18nProvider locale="fr-FR">
        <Picker hourCycle={12} displayMode="input">
          <TimePickerContent>
            <TimePickerInput />
          </TimePickerContent>
        </Picker>
      </I18nProvider>,
    )
    expect(screen.getByRole('textbox', { name: 'heure' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'minute' })).toBeInTheDocument()
  })

  it('tells the field required or invalid in input mode, as React Aria’s segments tell it', () => {
    const { rerender } = render(<Picker isRequired isInvalid displayMode="input" />)
    const told = (el: HTMLElement) => [
      el.getAttribute('aria-required'),
      el.getAttribute('aria-invalid'),
    ]
    expect([told(inputs().hour), told(inputs().minute)]).toEqual([
      ['true', 'true'],
      ['true', 'true'],
    ])
    rerender(<Picker isRequired isInvalid displayMode="picker" />)
    expect(told(segment('hour'))).toEqual(['true', 'true'])
    rerender(<Picker displayMode="input" />)
    expect(told(inputs().hour)).toEqual([null, null])
  })

  it('describes the inputs as the field is described, the hour always and the minute while the field is invalid, as React Aria’s segments are', () => {
    const picker = (invalid: boolean) => (
      <Picker displayMode="input" isInvalid={invalid}>
        {(props) => (
          <>
            {parts(props)}
            <Text slot="description">Office hours</Text>
            <FieldError>Too early</FieldError>
          </>
        )}
      </Picker>
    )
    const { rerender } = render(picker(false))
    expect(inputs().hour).toHaveAccessibleDescription(/Office hours/)
    expect(inputs().minute).not.toHaveAccessibleDescription()
    rerender(picker(true))
    expect(inputs().hour).toHaveAccessibleDescription(/Too early/)
    expect(inputs().minute).toHaveAccessibleDescription(/Too early/)
  })

  it('shows only the literal between the hour and the minute as the separator, hiding the locale’s other words, as Dzongkha writes the time', () => {
    render(
      <I18nProvider locale="dz-BT">
        <Picker hourCycle={12} displayMode="input" />
      </I18nProvider>,
    )
    const group = screen.getByRole('group', { name: 'Time' })
    const texts = (selector: string) =>
      [...group.querySelectorAll(selector)].map((it) => it.textContent)
    expect(texts('.time-picker-input-separator')).toEqual([' སྐར་མ་ '])
    expect(texts('.time-picker-input-hidden')).toContain('ཆུ་ཚོད་ ')
  })

  it('focuses the hour on autoFocus, over the dial and in input mode', () => {
    const { unmount } = render(<Picker autoFocus />)
    expect(document.activeElement).toBe(segment('hour'))
    unmount()
    render(<Picker autoFocus displayMode="input" />)
    expect(document.activeElement).toBe(inputs().hour)
  })

  it('moves on to the minute on Enter in the hour, and rewrites the inputs as the time is set elsewhere', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Picker value={seven} displayMode="input" />)
    const { hour, minute } = inputs()
    await user.click(hour)
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(minute)
    rerender(<Picker value={new Time(9, 30)} displayMode="input" />)
    expect([hour.value, minute.value]).toEqual(['09', '30'])
    await user.click(periods().getByRole('radio', { name: 'PM' }))
    expect(hour.value).toBe('09')
  })

  it('submits no form around the picker on Enter in the hour, which moves on, and leaves Enter in the minute to the browser, which does', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Picker displayMode="input" />
        <button type="submit">Save</button>
      </form>,
    )
    const { hour, minute } = inputs()
    await user.click(hour)
    // React Aria's group takes Enter in an input as a press and holds it back, except on a Mac,
    // where the browser would submit: the hour is checked there, the minute where it is held back.
    const platform = vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel')
    await user.keyboard('{Enter}')
    expect(document.activeElement).toBe(minute)
    expect(onSubmit).not.toHaveBeenCalled()
    platform.mockRestore()
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('takes 0 to 23 on a 24-hour clock, handing on to the minute only once two digits are typed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker hourCycle={24} onChange={onChange} displayMode="input" />)
    const { hour, minute } = inputs()
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('8')
    expect(onChange).toHaveBeenLastCalledWith(new Time(8, 0))
    expect(document.activeElement).toBe(hour)
    await user.keyboard('{Backspace}20')
    expect(onChange).toHaveBeenLastCalledWith(new Time(20, 0))
    expect(document.activeElement).toBe(minute)
    await user.click(hour)
    hour.setSelectionRange(0, 2)
    await user.keyboard('24')
    expect(hour.value).toBe('2')
    expect(onChange).toHaveBeenLastCalledWith(new Time(2, 0))
  })

  it('keeps the time while a segment is cleared, as React Aria does, the dial on it still, and a pick fills the segment back', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} />)
    segment('minute').focus()
    await user.keyboard('{Backspace}')
    expect(onChange).not.toHaveBeenCalled()
    expect(segment('minute')).toHaveAttribute('data-placeholder')
    // The minute segment focused, the dial is on the minutes, at the time's.
    expect(screen.getByRole('radio', { name: '0 minutes' })).toBeChecked()
    screen.getByRole('radio', { name: '15 minutes' }).focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(7, 15))
    expect(shown()).toBe('07:15:AM')
  })

  it('keeps an hour typed while the minute is cleared, which React Aria holds over the time, as the dial fills the minute', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Picker onChange={onChange} />)
    segment('minute').focus()
    await user.keyboard('{Backspace}')
    segment('hour').focus()
    await user.keyboard('9')
    // Nothing is reported until the minute is set; 9 fills the hour, and React Aria moves on.
    expect(onChange).not.toHaveBeenCalled()
    expect(segment('hour')).toHaveTextContent('09')
    expect(document.activeElement).toBe(segment('minute'))
    screen.getByRole('radio', { name: '30 minutes' }).focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(9, 30))
    expect(shown()).toBe('09:30:AM')
  })

  it('starts from the placeholder given with no time, and reports a whole time from it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Picker defaultValue={undefined} placeholderValue={new Time(14, 30)} onChange={onChange} />,
    )
    expect(segment('hour')).toHaveAttribute('data-placeholder')
    expect(periods().getByRole('radio', { name: 'PM' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '2 hours' })).toBeChecked()
    screen.getByRole('radio', { name: '5 hours' }).focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(17, 30))
  })

  it('takes a controlled value, and keeps the date of a date-time', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Controlled() {
      const [value, setValue] = useState<TimeValue | null>(new CalendarDateTime(2025, 8, 17, 7, 0))
      return (
        <Picker
          value={value}
          onChange={(next) => {
            onChange(next)
            setValue(next)
          }}
        />
      )
    }
    render(<Controlled />)
    expect(shown()).toBe('07:00:AM')
    screen.getByRole('radio', { name: '4 hours' }).focus()
    await user.keyboard('{Enter}')
    expect(shown()).toBe('04:00:AM')
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDateTime(2025, 8, 17, 4, 0))
  })

  it('draws a 24-hour clock with no period selector, its hours 0 to 11 then 12 to 23, zero as 00', () => {
    render(<Picker hourCycle={24} defaultValue={new Time(20, 0)} />)
    expect(screen.queryByRole('radiogroup', { name: 'Select AM or PM' })).not.toBeInTheDocument()
    expect(segments().map((it) => it.getAttribute('data-type'))).toEqual(['hour', 'minute'])
    const texts = numbers('Select hour').map((it) => it.textContent)
    expect(texts.slice(0, 12)).toEqual([
      '00',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
    ])
    expect(texts.slice(12)).toEqual([
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
    ])
    expect(screen.getByRole('radio', { name: '20 hours' })).toBeChecked()
  })

  it('follows the locale’s hour cycle, as React Aria does', () => {
    render(
      <I18nProvider locale="de-DE">
        <Picker defaultValue={new Time(20, 0)} />
      </I18nProvider>,
    )
    expect(screen.queryByRole('radiogroup', { name: 'Select AM or PM' })).not.toBeInTheDocument()
    expect(shown()).toBe('20:00')
  })

  it('names the periods as the locale writes them', () => {
    render(
      <I18nProvider locale="ja-JP">
        <Picker hourCycle={12} />
      </I18nProvider>,
    )
    expect(periods().getByRole('radio', { name: '午前' })).toBeChecked()
    expect(periods().getByRole('radio', { name: '午後' })).toBeInTheDocument()
  })

  it('counts a 12-hour dial from 0 where the locale does, as Japanese: 00 at the top for midnight and noon, as the field writes them', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <I18nProvider locale="ja-JP">
        <Picker hourCycle={12} defaultValue={new Time(12, 30)} onChange={onChange} />
      </I18nProvider>,
    )
    expect(segment('hour')).toHaveTextContent('00')
    expect(numbers('Select hour').map((it) => it.textContent)).toEqual([
      '00',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
    ])
    expect(screen.getByRole('radio', { name: '0 時間' })).toBeChecked()
    screen.getByRole('radio', { name: '5 時間' }).focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(17, 30))
    screen.getByRole('radio', { name: '0 時間' }).focus()
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(new Time(12, 30))
    expect(segment('hour')).toHaveTextContent('00')
  })

  it('shows the time input given the display mode, the labels under the boxes, and folds the dial away, inert', () => {
    render(<Picker displayMode="input" />)
    expect(screen.getByRole('heading', { name: 'Enter time' })).toBeInTheDocument()
    expect(screen.getByText('Hour')).toBeInTheDocument()
    expect(screen.getByText('Minute')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: 'Select hour' }).closest('[inert]')).toBe(
      document.querySelector('.time-picker-dial-pane'),
    )
  })

  it('takes the focus into the selected segment as it swaps to the input, and not as it swaps back', () => {
    const { rerender } = render(<Picker displayMode="picker" defaultSelection="minute" />)
    expect(document.activeElement).toBe(document.body)
    rerender(<Picker displayMode="input" defaultSelection="minute" />)
    expect(document.activeElement).toBe(inputs().minute)
    inputs().minute.blur()
    rerender(<Picker displayMode="picker" defaultSelection="minute" />)
    expect(document.activeElement).toBe(document.body)
  })

  it('draws no text of its own: the title and the labels are the caller’s, the periods and the numbers the locale’s', () => {
    render(
      <Picker displayMode="input">
        <TimePickerContent>
          <TimePickerInput />
          <TimePickerPeriodSelector aria-label="Period" />
          <TimePickerDial aria-label="Dial" />
        </TimePickerContent>
      </Picker>,
    )
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(document.querySelector('.time-picker-input-labels')).toHaveTextContent('')
  })

  it('draws only the parts written in it: no dial without a TimePickerDial', () => {
    render(
      <Picker>
        <TimePickerContent>
          <TimePickerInput />
        </TimePickerContent>
      </Picker>,
    )
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(segments()).toHaveLength(3)
  })

  it('is disabled or read-only as React Aria has it, the selector and the dial too', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Picker isDisabled onChange={onChange} />)
    expect(segment('hour')).toHaveAttribute('aria-disabled', 'true')
    expect(periods().getByRole('radio', { name: 'PM' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: '9 hours' })).toBeDisabled()
    rerender(<Picker key="read-only" isReadOnly onChange={onChange} />)
    expect(segment('hour')).toHaveAttribute('aria-readonly', 'true')
    await user.click(periods().getByRole('radio', { name: 'PM' }))
    screen.getByRole('radio', { name: '9 hours' }).focus()
    await user.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('gives its function children the display mode and the selection', () => {
    const children = vi.fn(parts)
    render(<Picker displayMode="input" defaultSelection="minute" children={children} />)
    expect(children).toHaveBeenCalledWith({ displayMode: 'input', selection: 'minute' })
  })
})

describe('TimePickerModeToggle', () => {
  it('is an icon button showing the keyboard over the dial and the clock over the input, wired by the caller', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()
    const { rerender } = render(
      <TimePickerModeToggle
        displayMode="picker"
        onPress={onPress}
        aria-label={toggleLabel('picker')}
      />,
    )
    const button = screen.getByRole('button', { name: 'Switch to text input mode' })
    expect(button).toHaveTextContent('keyboard')
    await user.click(button)
    expect(onPress).toHaveBeenCalledTimes(1)
    rerender(
      <TimePickerModeToggle
        displayMode="input"
        onPress={onPress}
        aria-label={toggleLabel('input')}
      />,
    )
    expect(screen.getByRole('button', { name: 'Switch to touch input mode' })).toHaveTextContent(
      'schedule',
    )
  })
})

/** The picker in its dialog, as the stories piece them: the display mode the caller's, the toggle
 * in the actions, and OK saving the time picked. */
function Dialog({
  save = vi.fn(),
  ...props
}: { save?: (time: TimeValue | null) => void } & Partial<TimePickerDialogTestProps>) {
  const [mode, setMode] = useState<TimePickerDisplayMode>('picker')
  const [picked, setPicked] = useState<TimeValue | null>(seven)
  return (
    <DialogTrigger>
      <Button>Open</Button>
      <TimePickerDialog
        modeToggle={
          <TimePickerModeToggle
            displayMode={mode}
            onPress={() => setMode(mode === 'picker' ? 'input' : 'picker')}
            aria-label={toggleLabel(mode)}
          />
        }
        dismissButton={
          <Button variant="text" slot="close">
            Cancel
          </Button>
        }
        confirmButton={
          <Button variant="text" slot="close" onPress={() => save(picked)}>
            OK
          </Button>
        }
        {...props}
      >
        <TimePicker aria-label="Time" value={picked} onChange={setPicked} displayMode={mode}>
          {parts}
        </TimePicker>
      </TimePickerDialog>
    </DialogTrigger>
  )
}
type TimePickerDialogTestProps = Pick<
  Parameters<typeof TimePickerDialog>[0],
  'isDismissable' | 'aria-label' | 'className' | 'style' | 'ref' | 'inert'
>

describe('TimePickerDialog', () => {
  it('is a dialog named by the picker’s title, holding the picker over the actions, the toggle first', async () => {
    const user = userEvent.setup()
    render(<Dialog />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog', { name: 'Select time' })
    const buttons = within(dialog).getAllByRole('button')
    expect(buttons.map((it) => it.getAttribute('aria-label') ?? it.textContent)).toEqual([
      'Switch to text input mode',
      'Cancel',
      'OK',
    ])
    // The toggle holds both icons, the keyboard shown over the dial and the clock faded out.
    expect(within(buttons[0]!).getByText('keyboard')).not.toHaveClass(
      'time-picker-mode-toggle-icon-away',
    )
    expect(within(buttons[0]!).getByText('schedule')).toHaveClass(
      'time-picker-mode-toggle-icon-away',
    )
    expect(within(dialog).getByRole('group', { name: 'Time' })).toBeInTheDocument()
  })

  it('swaps the dial and the input from its toggle, the title following once the last has faded', async () => {
    const user = userEvent.setup()
    render(<Dialog />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Switch to text input mode' }))
    expect(await screen.findByRole('dialog', { name: 'Enter time' })).toBeInTheDocument()
    expect(document.querySelector('.time-picker-dial-pane')).toHaveAttribute('inert')
    const toggle = screen.getByRole('button', { name: 'Switch to touch input mode' })
    expect(within(toggle).getByText('schedule')).not.toHaveClass(
      'time-picker-mode-toggle-icon-away',
    )
    expect(within(toggle).getByText('keyboard')).toHaveClass('time-picker-mode-toggle-icon-away')
    await user.click(toggle)
    expect(await screen.findByRole('dialog', { name: 'Select time' })).toBeInTheDocument()
    expect(document.querySelector('.time-picker-dial-pane')).not.toHaveAttribute('inert')
  })

  it('closes on its buttons in the close slot, OK saving the time picked and Cancel not', async () => {
    const user = userEvent.setup()
    const save = vi.fn()
    render(<Dialog save={save} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('radio', { name: 'PM' }))
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(save).toHaveBeenCalledWith(new Time(19, 0))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(save).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on Escape and on a press on the scrim, unless not dismissable', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Dialog />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('dialog').parentElement!.parentElement!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    unmount()
    render(<Dialog isDismissable={false} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('dialog').parentElement!.parentElement!)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('gives the container its class, style and ref, and the dialog its aria-label', async () => {
    const user = userEvent.setup()
    const ref = createRef<HTMLDivElement>()
    render(<Dialog className="m-1" style={{ padding: 1 }} ref={ref} aria-label="Pick a time" />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog', { name: 'Pick a time' })
    expect(dialog.parentElement).toBe(ref.current)
    expect(ref.current).toHaveClass('time-picker-modal', 'm-1')
    expect(ref.current).toHaveStyle({ padding: '1px' })
  })
})
