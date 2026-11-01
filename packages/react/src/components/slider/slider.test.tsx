import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { I18nProvider, Label, SliderOutput } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../icon'
import { Slider } from './slider'

/* Behavior and markup that jsdom can check without a stylesheet: the group React Aria renders,
 * a hidden range input in the slider role per value, labelling, values, keys and events, and what
 * the track holds. Where the parts are and what they look like: slider.browser.test.tsx. */

/** The hidden `<input type="range">` of each handle, in the slider role: the value and the focus. */
const inputs = () => screen.getAllByRole<HTMLInputElement>('slider')
const input = (name?: string) =>
  screen.getByRole<HTMLInputElement>('slider', name === undefined ? undefined : { name })
/** The slider itself, React Aria's Slider: the `<div>` in the group role. */
const group = (name?: string) =>
  screen.getByRole('group', name === undefined ? undefined : { name })
/** React Aria's SliderTrack, the group's last child: its thumbs first, then the stretches of track. */
const track = (name?: string) => group(name).lastElementChild as HTMLElement
const segments = (name?: string) => [...track(name).children].filter((el) => el.tagName === 'SPAN')
const stopsIn = (el: Element) => el.querySelectorAll(':scope > .slider-stop').length

describe('Slider', () => {
  it('renders a group with a hidden range input in the slider role, at 0 of 0-100 by default', () => {
    render(<Slider aria-label="Volume" />)
    expect(group('Volume').tagName).toBe('DIV')
    const el = input('Volume')
    expect(el.tagName).toBe('INPUT')
    expect(el).toHaveAttribute('type', 'range')
    expect(el).toHaveValue('0')
    expect(el).toHaveAttribute('min', '0')
    expect(el).toHaveAttribute('max', '100')
    expect(el).toHaveAttribute('step', '1')
    expect(el).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('is named by a Label child, and shows its value in a SliderOutput child, both before the track', () => {
    render(
      <Slider defaultValue={30}>
        <Label>Volume</Label>
        <SliderOutput />
      </Slider>,
    )
    expect(input('Volume')).toHaveValue('30')
    expect(group('Volume').firstElementChild).toHaveTextContent('Volume')
    expect(screen.getByText('30').tagName).toBe('OUTPUT')
    expect(group('Volume').lastElementChild).toBe(track('Volume'))
  })

  it('takes its minimum, maximum and step, and formats its value text with formatOptions', () => {
    render(
      <Slider
        aria-label="Price"
        minValue={10}
        maxValue={500}
        step={10}
        defaultValue={250}
        formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      />,
    )
    const el = input('Price')
    expect(el).toHaveAttribute('min', '10')
    expect(el).toHaveAttribute('max', '500')
    expect(el).toHaveAttribute('step', '10')
    expect(el).toHaveAttribute('aria-valuetext', '$250')
  })

  it('passes className and ref to its <div>, a className function given the state and React Aria’s class', () => {
    const ref = createRef<HTMLDivElement>()
    const { rerender } = render(<Slider aria-label="Volume" ref={ref} className="w-64" />)
    expect(ref.current).toBe(group('Volume'))
    expect(group('Volume')).toHaveClass('w-64', 'slider')
    rerender(
      <Slider
        aria-label="Volume"
        isDisabled
        className={({ defaultClassName, isDisabled }) =>
          `${defaultClassName} ${isDisabled ? 'off' : 'on'}`
        }
      />,
    )
    expect(group('Volume')).toHaveClass('react-aria-Slider', 'off', 'slider')
  })

  describe('values', () => {
    it('starts from defaultValue, and reports each change and the end of it', async () => {
      const onChange = vi.fn()
      const onChangeEnd = vi.fn()
      const user = userEvent.setup()
      render(
        <Slider
          aria-label="Volume"
          defaultValue={40}
          onChange={onChange}
          onChangeEnd={onChangeEnd}
        />,
      )
      await user.tab()
      expect(input('Volume')).toHaveFocus()
      await user.keyboard('{ArrowRight}')
      expect(input('Volume')).toHaveValue('41')
      expect(onChange).toHaveBeenLastCalledWith(41)
      expect(onChangeEnd).toHaveBeenLastCalledWith(41)
    })

    it('follows value when controlled', async () => {
      const user = userEvent.setup()
      function Controlled() {
        const [value, setValue] = useState(10)
        return (
          <>
            <Slider aria-label="Volume" value={value} onChange={setValue} />
            <button onClick={() => setValue(90)}>Max out</button>
          </>
        )
      }
      render(<Controlled />)
      await user.click(screen.getByRole('button', { name: 'Max out' }))
      expect(input('Volume')).toHaveValue('90')
      await user.tab({ shift: true })
      await user.keyboard('{ArrowLeft}')
      expect(input('Volume')).toHaveValue('89')
    })

    it('stays put when a controlled value is not changed', async () => {
      const user = userEvent.setup()
      render(<Slider aria-label="Volume" value={50} />)
      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(input('Volume')).toHaveValue('50')
    })
  })

  describe('keyboard', () => {
    it('steps on the arrows, a page of a tenth on Page Up and Down or Shift and an arrow, and goes to the ends on Home and End', async () => {
      const user = userEvent.setup()
      render(<Slider aria-label="Volume" defaultValue={50} />)
      await user.tab()
      const el = input('Volume')
      await user.keyboard('{ArrowUp}')
      expect(el).toHaveValue('51')
      await user.keyboard('{ArrowDown}{ArrowDown}')
      expect(el).toHaveValue('49')
      await user.keyboard('{PageUp}')
      expect(el).toHaveValue('59')
      await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
      expect(el).toHaveValue('49')
      await user.keyboard('{End}')
      expect(el).toHaveValue('100')
      await user.keyboard('{Home}')
      expect(el).toHaveValue('0')
    })

    it('takes a page at a time on an arrow while Space is held, and steps again once it is let go', async () => {
      const onChangeEnd = vi.fn()
      const user = userEvent.setup()
      render(<Slider aria-label="Volume" defaultValue={50} onChangeEnd={onChangeEnd} />)
      await user.tab()
      const el = input('Volume')
      await user.keyboard('[Space>]{ArrowRight}{ArrowRight}')
      expect(el).toHaveValue('70')
      expect(onChangeEnd).toHaveBeenLastCalledWith(70)
      await user.keyboard('{ArrowDown}[/Space]')
      expect(el).toHaveValue('60')
      await user.keyboard('{ArrowRight}')
      expect(el).toHaveValue('61')
    })

    it('takes Space and an arrow in steps of the stops, a page being at least one', async () => {
      const user = userEvent.setup()
      render(<Slider aria-label="Volume" step={25} defaultValue={50} />)
      await user.tab()
      await user.keyboard('[Space>]{ArrowLeft}[/Space]')
      expect(input('Volume')).toHaveValue('25')
    })

    it('reverses the horizontal arrows right to left, with Space as without', async () => {
      const user = userEvent.setup()
      render(
        <I18nProvider locale="ar-EG">
          <Slider aria-label="Volume" defaultValue={50} />
        </I18nProvider>,
      )
      await user.tab()
      const el = input('Volume')
      await user.keyboard('{ArrowLeft}')
      expect(el).toHaveValue('51')
      await user.keyboard('[Space>]{ArrowLeft}[/Space]')
      expect(el).toHaveValue('61')
      await user.keyboard('[Space>]{ArrowRight}[/Space]')
      expect(el).toHaveValue('51')
    })

    it('forgets a held Space once the handle loses the focus', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Slider aria-label="Volume" defaultValue={50} />
          <button>Next</button>
        </>,
      )
      await user.tab()
      await user.keyboard('[Space>]')
      await user.tab()
      await user.tab({ shift: true })
      await user.keyboard('{ArrowRight}')
      expect(input('Volume')).toHaveValue('51')
    })
  })

  describe('variants', () => {
    it('draws a standard slider as an active stretch then an inactive one, with an end stop', () => {
      render(<Slider aria-label="Volume" defaultValue={40} />)
      const [active, inactive, more] = segments('Volume')
      expect(active).toHaveClass('slider-active-track')
      expect(inactive).toHaveClass('slider-inactive-track')
      expect(more).toBeUndefined()
      expect(stopsIn(active!)).toBe(0)
      expect(stopsIn(inactive!)).toBe(1)
    })

    it('draws a centered slider as inactive, active, inactive, with a stop at either end', () => {
      render(
        <Slider aria-label="Balance" minValue={-50} maxValue={50} defaultValue={-20} isCentered />,
      )
      const parts = segments('Balance')
      expect(parts.map((el) => el.classList.contains('slider-active-track'))).toEqual([
        false,
        true,
        false,
      ])
      expect(parts.map(stopsIn)).toEqual([2, 0, 2])
    })

    it('makes a range slider of an array of two values: two inputs, each its own value, that cannot cross', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Slider aria-label="Price" defaultValue={[20, 22]} onChange={onChange} />)
      const [start, end] = inputs()
      expect(start).toHaveValue('20')
      expect(end).toHaveValue('22')
      expect(start).toHaveAccessibleName('Price')
      expect(end).toHaveAccessibleName('Price')
      expect(segments('Price').map((el) => el.classList.contains('slider-active-track'))).toEqual([
        false,
        true,
        false,
      ])
      await user.tab()
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
      expect(start).toHaveValue('22')
      expect(onChange).toHaveBeenLastCalledWith([22, 22])
      await user.tab()
      await user.keyboard('{End}')
      expect(onChange).toHaveBeenLastCalledWith([22, 100])
    })

    it('draws a stop at every step on both tracks when stops is set, and one at the track’s end besides', () => {
      render(<Slider aria-label="Volume" step={30} defaultValue={30} showStops />)
      // 0, 30, 60 and 90, and 100 at the end.
      expect(segments('Volume').map(stopsIn)).toEqual([5, 5])
    })

    it('draws an inset icon only on a standard slider, a copy on each stretch', () => {
      render(
        <>
          <Slider aria-label="Standard" size="m" icon={<Icon name="volume_up" />} />
          <Slider aria-label="Centered" size="m" isCentered icon={<Icon name="volume_up" />} />
          <Slider
            aria-label="Range"
            size="m"
            defaultValue={[10, 20]}
            icon={<Icon name="volume_up" />}
          />
        </>,
      )
      const icons = (name: string) => within(track(name)).queryAllByText('volume_up')
      expect(screen.getAllByText('volume_up')).toHaveLength(2)
      expect(icons('Standard')).toHaveLength(2)
      expect(icons('Centered')).toHaveLength(0)
      expect(icons('Range')).toHaveLength(0)
    })

    it('hides the track from assistive technology, with its stops and icon', () => {
      render(<Slider aria-label="Volume" size="m" icon={<Icon name="volume_up" />} />)
      for (const el of segments('Volume')) expect(el).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('value indicator', () => {
    it('shows each handle’s value text with valueIndicator, hidden from assistive technology, and follows it', async () => {
      const user = userEvent.setup()
      render(
        <Slider
          aria-label="Price"
          defaultValue={[100, 300]}
          maxValue={500}
          formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
          showValueIndicator
        />,
      )
      expect(screen.getByText('$100')).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByText('$300')).toBeInTheDocument()
      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(screen.getByText('$101')).toBeInTheDocument()
    })

    it('draws none without valueIndicator', () => {
      render(<Slider aria-label="Volume" defaultValue={40} />)
      expect(screen.queryByText('40')).not.toBeInTheDocument()
    })
  })

  describe('vertical', () => {
    it('reports its orientation, and its up and down arrows step it', async () => {
      const user = userEvent.setup()
      render(<Slider aria-label="Volume" orientation="vertical" defaultValue={50} />)
      expect(input('Volume')).toHaveAttribute('aria-orientation', 'vertical')
      expect(group('Volume')).toHaveAttribute('data-orientation', 'vertical')
      await user.tab()
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}')
      expect(input('Volume')).toHaveValue('51')
    })
  })

  describe('forms', () => {
    const submitted = (form: HTMLFormElement) => [...new FormData(form)]

    it('submits its value under name, and a form reset restores defaultValue', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <form>
          <Slider aria-label="Volume" name="volume" defaultValue={40} />
        </form>,
      )
      const form = container.querySelector('form')!
      expect(submitted(form)).toEqual([['volume', '40']])
      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(submitted(form)).toEqual([['volume', '41']])
      form.reset()
      await waitFor(() => expect(input('Volume')).toHaveValue('40'))
      expect(submitted(form)).toEqual([['volume', '40']])
    })

    it('submits both values of a range slider under its name, the start first', () => {
      const { container } = render(
        <form>
          <Slider aria-label="Price" name="price" defaultValue={[20, 80]} />
        </form>,
      )
      expect(submitted(container.querySelector('form')!)).toEqual([
        ['price', '20'],
        ['price', '80'],
      ])
    })

    it('joins the form whose id is its form, outside it', () => {
      const { container } = render(
        <>
          <form id="settings" />
          <Slider aria-label="Volume" name="volume" form="settings" defaultValue={60} />
        </>,
      )
      expect(submitted(container.querySelector('form')!)).toEqual([['volume', '60']])
    })

    it('submits nothing while disabled', () => {
      const { container } = render(
        <form>
          <Slider aria-label="Volume" name="volume" defaultValue={60} isDisabled />
        </form>,
      )
      expect(submitted(container.querySelector('form')!)).toEqual([])
    })
  })

  describe('disabled', () => {
    it('disables every input and takes no keys', async () => {
      const user = userEvent.setup()
      render(<Slider aria-label="Price" defaultValue={[20, 80]} isDisabled />)
      for (const el of inputs()) expect(el).toBeDisabled()
      expect(group('Price')).toHaveAttribute('data-disabled')
      await user.tab()
      expect(document.body).toHaveFocus()
    })
  })
})
