import { parseDate, type CalendarDate } from '@internationalized/date'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { computedColor, computedRadius, expectHitArea, rgba, settle } from '../../test-browser'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { DateField, type DateFieldProps } from '.'

/* What needs a real browser and the real stylesheet: the field's measurements, to the spec's
 * text field, its colors in each state, the trailing icon's place and target, and a date drawn by
 * `input` as its own is. Markup and behavior: date-field.test.tsx. */

const august17 = parseDate('2025-08-17')

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
const style = (el: Element) => getComputedStyle(el)
/** React Aria's DateInput, the group of the segments, which the label names. */
const group = () => screen.getByRole('group', { name: /^Date/ })
/** The container around it. */
const container = () => group().parentElement!
const outline = () => container().querySelector<HTMLElement>('[aria-hidden] > :first-child')!
/** The label text on the outline, the span that names the field. */
const label = () =>
  document.getElementById(group().getAttribute('aria-labelledby')!.split(' ')[0]!)!

function Field(props: Partial<DateFieldProps<CalendarDate>>) {
  return (
    <div style={{ padding: 24 }}>
      <DateField label="Date" defaultValue={august17} className="w-90" {...props} />
    </div>
  )
}

describe('DateField in a browser', () => {
  it('is a 56dp outlined container, its label on the outline and the format 4dp under it', () => {
    render(<Field />)
    const field = rect(container())
    expect([field.width, field.height]).toEqual([360, 56])
    expect(style(container()).borderRadius).toBe(computedRadius('rounded-shape-xs'))
    expect(rect(label()).left - field.left).toBe(16)
    expect(rect(label()).top + rect(label()).height / 2).toBeCloseTo(field.top, 0)
    expect(rect(screen.getAllByRole('spinbutton')[0]!).left - field.left).toBeCloseTo(16, 0)
    const supporting = screen.getByText('MM/DD/YYYY')
    expect(rect(supporting).top - field.bottom).toBe(4)
    expect(rect(supporting).left - field.left).toBe(16)
  })

  it('centers a trailing icon button on the 24dp icon box 12dp from the end, its 48dp target in the field', () => {
    render(
      <Field
        trailing={
          <IconButton aria-label="Calendar">
            <Icon name="calendar_today" />
          </IconButton>
        }
      />,
    )
    const field = rect(container())
    const button = screen.getByRole('button', { name: 'Calendar' })
    const box = rect(button)
    expect([box.width, box.height]).toEqual([40, 40])
    expect(field.right - box.right).toBe(4)
    expect(box.top + box.height / 2).toBe(field.top + field.height / 2)
    // 16dp after the date's room, the end of React Aria's DateInput but its padding.
    const room = rect(group()).right - parseFloat(style(group()).paddingInlineEnd)
    expect(rect(button.parentElement!).left - room).toBe(16)
    expectHitArea(button)
  })

  it('focuses the date on a press anywhere in the container but the trailing icon, as React Aria does on the date', async () => {
    render(<Field defaultValue={undefined} />)
    const field = rect(container())
    // In the 16dp before the date, over its line: React Aria's first segment, nothing typed.
    await userEvent.click(container(), { position: { x: 4, y: 4 } })
    expect(screen.getAllByRole('spinbutton')[0]).toHaveFocus()
    ;(document.activeElement as HTMLElement).blur()
    // And in the 16dp after it, under its line.
    await userEvent.click(container(), { position: { x: field.width - 4, y: field.height - 4 } })
    expect(screen.getAllByRole('spinbutton')[0]).toHaveFocus()
  })

  it('rests its label on the date’s line while empty and without the focus, raising it as the focus comes', async () => {
    render(<Field defaultValue={undefined} />)
    const field = rect(container())
    const edge = () => style(outline().parentElement!).getPropertyValue('--text-field-notch-edge')
    expect(style(label()).fontSize).toBe('16px')
    expect([rect(label()).left - field.left, rect(label()).top - field.top]).toEqual([16, 16])
    expect(style(group()).opacity).toBe('0')
    expect(edge()).toBe('50%')
    await userEvent.tab()
    await settle()
    expect(style(label()).fontSize).toBe('12px')
    expect(rect(label()).top + rect(label()).height / 2).toBeCloseTo(field.top, 0)
    expect(style(group()).opacity).toBe('1')
    expect(edge()).toBe('0%')
    // The format shown meanwhile is Compose's placeholder, on-surface-variant, slashes too, until
    // a part is typed.
    expectRole(style(screen.getAllByRole('spinbutton')[1]!).color, 'on-surface-variant')
    const slash = group().querySelector('[data-type="literal"]')!
    expectRole(style(slash).color, 'on-surface-variant')
    await userEvent.keyboard('08')
    expectRole(style(slash).color, 'on-surface')
    ;(document.activeElement as HTMLElement).blur()
    await settle()
    expect(style(label()).fontSize).toBe('12px')
    expect(style(group()).opacity).toBe('1')
  })

  it('colors the field as Compose’s date input, the outline primary and 2dp while the focus is in it', async () => {
    render(<Field />)
    expectRole(style(outline()).borderLeftColor, 'outline')
    expect(style(outline()).borderLeftWidth).toBe('1px')
    expectRole(style(label()).color, 'on-surface-variant')
    await userEvent.hover(container())
    await settle()
    expectRole(style(outline()).borderLeftColor, 'on-surface')
    await userEvent.click(screen.getAllByRole('spinbutton')[0]!)
    await settle()
    expectRole(style(outline()).borderLeftColor, 'primary')
    expect(style(outline()).borderLeftWidth).toBe('2px')
    expectRole(style(label()).color, 'primary')
    const segment = screen.getAllByRole('spinbutton')[0]!
    expectRole(style(segment).backgroundColor, 'primary')
    expectRole(style(segment).color, 'on-primary')
  })

  it('draws an invalid field in the error color, and a disabled one at the spec’s opacities', async () => {
    const { rerender } = render(<Field isInvalid trailing={<Icon name="error" />} />)
    expectRole(style(outline()).borderLeftColor, 'error')
    expectRole(style(screen.getByText('MM/DD/YYYY')).color, 'error')
    expectRole(style(container().querySelector('.font-icon')!.parentElement!).color, 'error')
    rerender(<Field isDisabled />)
    // Its parts recolor over a short-4, as a text field's do.
    await settle()
    expectRole(style(outline()).borderLeftColor, 'on-surface', 0.12)
    expectRole(style(screen.getAllByRole('spinbutton')[0]!).color, 'on-surface', 0.38)
  })

  describe('input', () => {
    /** Where a field's date, its first segment and its label are in the container, and their look:
     * the first field's, its own, or the second's, drawn by `input`. */
    const look = (which: 'own' | 'given') => {
      const date = screen.getAllByRole('group', { name: 'Date' })[which === 'own' ? 0 : 1]!
      const field = rect(date.parentElement!)
      const at = (el: Element) => {
        const box = rect(el)
        return [box.left - field.left, box.top - field.top, box.width, box.height]
      }
      const segment = within(date).getAllByRole('spinbutton')[0]!
      const text = document.getElementById(date.getAttribute('aria-labelledby')!.split(' ')[0]!)!
      return {
        date: at(date),
        opacity: style(date).opacity,
        segment: at(segment),
        segmentColor: style(segment).color,
        segmentBackground: style(segment).backgroundColor,
        label: at(text),
        labelFont: style(text).font,
        labelColor: style(text).color,
      }
    }

    it("draws a date that looks as the field's own does, empty, focused and populated", async () => {
      render(
        <div style={{ padding: 24 }}>
          <DateField label="Date" className="w-90" />
          <DateField label="Date" className="w-90" input={(props) => <div {...props} />} />
        </div>,
      )
      expect(look('given')).toEqual(look('own'))
      await userEvent.tab()
      await settle()
      const focused = look('own')
      await userEvent.keyboard('08172025')
      await userEvent.tab()
      await settle()
      expect(look('given')).toEqual(focused)
      await userEvent.keyboard('08172025')
      ;(document.activeElement as HTMLElement).blur()
      await settle()
      expect(look('given')).toEqual(look('own'))
    })
  })
})
