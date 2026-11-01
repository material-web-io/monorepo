import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  computedColor,
  contrastRatio,
  rgba,
  Scheme,
  schemeOf,
  schemes,
  settle,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { TextField, type TextFieldProps } from './text-field'

/* What needs a real browser and stylesheet: the 56dp container and what is in it, to the
 * spec's measurements, its field's label at rest and up, the notch, each state's colors,
 * contrast, motion, density and forced colors. Markup, naming and events: text-field.test.tsx. */

type Control = HTMLInputElement | HTMLTextAreaElement
const variants = ['filled', 'outlined'] as const

const textbox = (name: string) => screen.getByRole<Control>('textbox', { name })
/** The container holds the control first, then its layers, its label, and what is around the text. */
const container = (name: string) => textbox(name).parentElement!
/** The text field's outermost element: the container, and the supporting text's row after it. */
const root = (name: string) => container(name).parentElement!
const label = (name: string) => container(name).querySelector('label')!
/** The four ends, the last spans in the container: the leading icon, prefix, suffix and trailing icon, hidden while empty. */
const ends = (name: string) =>
  [...container(name).children].filter((el) => el.tagName === 'SPAN').slice(-4) as HTMLElement[]
const layers = (name: string) => [...container(name).children].slice(1) as HTMLElement[]
/** A filled field's fill, state layer and indicator come right after its control. */
const fill = (name: string) => layers(name)[0]!
const stateLayer = (name: string) => layers(name)[1]!
const indicator = (name: string) => layers(name)[2]!
/** An outlined field's outline comes right after its control: its start, notch and end. */
const outline = (name: string) => layers(name)[0]!
const outlineParts = (name: string) => [...outline(name).children] as HTMLElement[]
const notch = (name: string) => outlineParts(name)[1]!

/** An element's box in dp from its container's top left corner. */
const box = (el: Element, name: string) => {
  const origin = container(name).getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  return {
    left: rect.left - origin.left,
    top: rect.top - origin.top,
    right: origin.right - rect.right,
    bottom: origin.bottom - rect.bottom,
    width: rect.width,
    height: rect.height,
  }
}

/** Where the control's text is, in dp from its container's edges: its box less its padding. */
const textBox = (name: string) => {
  const style = getComputedStyle(textbox(name))
  const outer = box(textbox(name), name)
  return {
    left: outer.left + parseFloat(style.paddingLeft),
    right: outer.right + parseFloat(style.paddingRight),
    top: outer.top + parseFloat(style.paddingTop),
    bottom: outer.bottom + parseFloat(style.paddingBottom),
  }
}

const color = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)

/** Checks that a computed color is a role's, at an opacity: one below 1 is rounded on the way. */
function expectRole(actual: string, role: string, within: Element, opacity = 1) {
  const [r, g, b, a] = rgba(actual)
  const expected = rgba(color(role, schemeOf(within)))
  expect(a / 255, `${role} opacity`).toBeCloseTo(opacity, 2)
  ;[r, g, b].forEach((channel, i) =>
    expect(Math.abs(channel - expected[i]!), `${role} channel ${i}`).toBeLessThanOrEqual(
      opacity === 1 ? 0 : 12,
    ),
  )
}

const textColor = (el: Element) => getComputedStyle(el).color
const strokeColor = (el: Element) => getComputedStyle(el).borderBottomColor
const strokeWidth = (el: Element) => getComputedStyle(el).borderBottomWidth

/** A text field 280dp wide, with the label that names it. */
const Labelled = (props: TextFieldProps) => <TextField className="w-70" {...props} />

/** One with an icon at each end and supporting text, as the spec's states are drawn. */
function Full({ label, ...props }: TextFieldProps & { label: string }) {
  return (
    <TextField
      className="w-70"
      label={label}
      description="Supporting text"
      {...(props as TextFieldProps)}
      leading={<Icon name="search" data-testid={`${label} leading`} />}
      trailing={<Icon name="cancel" data-testid={`${label} trailing`} />}
    />
  )
}

const leading = (name: string) => screen.getByTestId(`${name} leading`).parentElement!
const trailing = (name: string) => screen.getByTestId(`${name} trailing`).parentElement!

describe('TextField in a browser', () => {
  describe('measurements', () => {
    it.each(variants)('is a 56dp container as wide as the field, %s', (variant) => {
      render(
        <Scheme>
          <Labelled label="Label" variant={variant} />
        </Scheme>,
      )
      const rect = container('Label').getBoundingClientRect()
      expect([rect.width, rect.height]).toEqual([280, 56])
      expect(root('Label').getBoundingClientRect().height).toBe(56)
    })

    it('is on a line of text of any height, which it makes no taller than itself', () => {
      render(
        <Scheme>
          <div data-testid="line" style={{ display: 'block', lineHeight: '40px', fontSize: 32 }}>
            <Labelled label="Label" />
          </div>
        </Scheme>,
      )
      expect(root('Label').getBoundingClientRect().height).toBe(56)
      expect(screen.getByTestId('line').getBoundingClientRect().height).toBe(56)
    })

    it('rounds the top corners of a filled container, and every corner of an outline, by 4dp', () => {
      render(
        <Scheme>
          <Labelled label="Filled" />
          <Labelled label="Outlined" variant="outlined" />
        </Scheme>,
      )
      const filled = getComputedStyle(fill('Filled'))
      expect([filled.borderTopLeftRadius, filled.borderTopRightRadius]).toEqual(['4px', '4px'])
      expect([filled.borderBottomLeftRadius, filled.borderBottomRightRadius]).toEqual([
        '0px',
        '0px',
      ])
      const [start, , end] = outlineParts('Outlined').map((part) => getComputedStyle(part))
      expect([start!.borderTopLeftRadius, start!.borderBottomLeftRadius]).toEqual(['4px', '4px'])
      expect([end!.borderTopRightRadius, end!.borderBottomRightRadius]).toEqual(['4px', '4px'])
    })

    it.each(variants)(
      'puts the text 16dp from each end, and a resting label on its line, %s',
      (variant) => {
        render(
          <Scheme>
            <Labelled label="Label" variant={variant} />
          </Scheme>,
        )
        const text = textBox('Label')
        expect([text.left, text.right]).toEqual([16, 16])
        // The control fills the container inside its 16dp ends, which hand it a click of theirs.
        expect(box(textbox('Label'), 'Label')).toMatchObject({ left: 16, right: 16, top: 0 })
        const resting = box(label('Label'), 'Label')
        expect([resting.left, resting.top, resting.height]).toEqual([16, 16, 24])
        expect(getComputedStyle(label('Label')).fontSize).toBe('16px')
      },
    )

    it.each(variants)(
      'puts an icon 12dp from its end and 16dp from the text, in the middle, %s',
      (variant) => {
        render(
          <Scheme>
            <Full variant={variant} label="Label" />
          </Scheme>,
        )
        expect(box(leading('Label'), 'Label')).toMatchObject({
          left: 12,
          top: 16,
          width: 24,
          height: 24,
        })
        expect(box(trailing('Label'), 'Label')).toMatchObject({
          right: 12,
          top: 16,
          width: 24,
          height: 24,
        })
        const text = textBox('Label')
        expect([text.left, text.right]).toEqual([52, 52])
        expect(box(label('Label'), 'Label').left).toBe(52)
      },
    )

    it('puts the label of a populated filled field 8dp from the top, over the text, 8dp from the bottom', async () => {
      render(
        <Scheme>
          <Labelled label="Plain" defaultValue="Input" />
          <Full label="Icons" defaultValue="Input" />
        </Scheme>,
      )
      await settle()
      for (const [name, start] of [
        ['Plain', 16],
        ['Icons', 52],
      ] as const) {
        const up = box(label(name), name)
        expect([up.left, up.top, up.height], name).toEqual([start, 8, 16])
        expect(getComputedStyle(label(name)).fontSize, name).toBe('12px')
        const text = textBox(name)
        expect([text.left, text.top, text.bottom], name).toEqual([start, 24, 8])
      }
    })

    it('puts the label of a populated outlined field on its outline, 16dp from the start whatever leads it', async () => {
      render(
        <Scheme>
          <Labelled label="Plain" variant="outlined" defaultValue="Input" />
          <Full variant="outlined" label="Icons" defaultValue="Input" />
        </Scheme>,
      )
      await settle()
      for (const name of ['Plain', 'Icons']) {
        const up = box(label(name), name)
        expect([up.left, up.top, up.height], name).toEqual([16, -8, 16])
        const text = textBox(name)
        expect([text.top, text.bottom], name).toEqual([16, 16])
      }
      expect(textBox('Icons').left).toBe(52)
    })

    it('opens a notch for that label, 4dp wider than it on each side, in the top of the outline only', async () => {
      render(
        <Scheme>
          <Labelled label="Label text" variant="outlined" defaultValue="Input" />
          <Labelled label="Empty" variant="outlined" />
        </Scheme>,
      )
      await settle()
      const text = document.createRange()
      text.selectNodeContents(label('Label text'))
      const ink = text.getBoundingClientRect()
      const gap = notch('Label text').getBoundingClientRect()
      expect(box(notch('Label text'), 'Label text').left).toBe(12)
      expect(ink.left - gap.left).toBeCloseTo(4, 0)
      expect(gap.right - ink.right).toBeCloseTo(4, 0)
      const open = getComputedStyle(notch('Label text'))
      expect([open.borderTopWidth, open.borderBottomWidth]).toEqual(['0px', '1px'])
      expect(getComputedStyle(notch('Label text'), '::before').width).toBe('0px')
      expect(getComputedStyle(notch('Label text'), '::after').width).toBe('0px')
      // Closed, its two halves meet in the middle and draw the whole top edge.
      const closed = notch('Empty').getBoundingClientRect().width / 2
      expect(parseFloat(getComputedStyle(notch('Empty'), '::before').width)).toBeCloseTo(closed, 1)
      expect(parseFloat(getComputedStyle(notch('Empty'), '::after').width)).toBeCloseTo(closed, 1)
      expect(getComputedStyle(notch('Empty'), '::before').borderTopWidth).toBe('1px')
    })

    it('draws one unbroken outline around a field with no label', () => {
      render(
        <Scheme>
          <TextField variant="outlined" className="w-70" aria-label="Name" />
        </Scheme>,
      )
      const [start, end] = outlineParts('Name')
      expect(outlineParts('Name')).toHaveLength(2)
      expect(start!.getBoundingClientRect().right).toBe(end!.getBoundingClientRect().left)
      expect(box(end!, 'Name').right).toBe(0)
      const text = textBox('Name')
      expect([text.top, text.bottom]).toEqual([16, 16])
    })

    it('puts the supporting text 4dp under the container and 16dp in, and the counter at its end', () => {
      render(
        <Scheme>
          <Labelled
            label="Label"
            description="Supporting text"
            maxLength={20}
            defaultValue="Hello"
          />
        </Scheme>,
      )
      const supporting = screen.getByText('Supporting text')
      const counter = screen.getByText(/5\/20/)
      const below = box(supporting, 'Label')
      expect([below.left, below.top - 56, below.height]).toEqual([16, 4, 16])
      expect(box(counter, 'Label').right).toBe(16)
      expect(getComputedStyle(supporting).fontSize).toBe('12px')
      expect(getComputedStyle(supporting.parentElement!).columnGap).toBe('16px')
      expect(root('Label').getBoundingClientRect().height).toBe(76)
    })

    it("puts React Aria's message in the supporting text's place, and leaves no room for nothing", () => {
      const validate = (text: string) => (text === '' ? 'Enter a name' : null)
      const { rerender } = render(
        <Scheme>
          <Labelled label="Label" description="Supporting text" />
        </Scheme>,
      )
      const at = box(screen.getByText('Supporting text'), 'Label')
      rerender(
        <Scheme>
          <Labelled
            label="Label"
            description="Supporting text"
            validationBehavior="aria"
            validate={validate}
          />
        </Scheme>,
      )
      const error = screen.getByText('Enter a name')
      expect(box(error, 'Label')).toEqual(at)
      expectRole(textColor(error), 'error', label('Label'))
      expect(root('Label').getBoundingClientRect().height).toBe(76)
      rerender(
        <Scheme>
          <Labelled label="Label" isInvalid />
        </Scheme>,
      )
      expect(root('Label').getBoundingClientRect().height).toBe(56)
    })

    it('centers an icon button on the icon box, its 48dp target inside the container', () => {
      render(
        <Scheme>
          <Labelled
            label="Password"
            trailing={
              <IconButton aria-label="Show password">
                <Icon name="visibility" />
              </IconButton>
            }
          />
        </Scheme>,
      )
      const button = screen.getByRole('button', { name: 'Show password' })
      const icon = box(button.parentElement!, 'Password')
      const inside = box(button, 'Password')
      expect([icon.right, icon.width]).toEqual([12, 24])
      expect([inside.right, inside.top, inside.width, inside.height]).toEqual([4, 8, 40, 40])
      const hit = document.elementFromPoint(
        container('Password').getBoundingClientRect().right - 1,
        button.getBoundingClientRect().top - 3,
      )
      expect(button.contains(hit)).toBe(true)
    })

    it('puts a prefix and suffix between the icons and the text', () => {
      render(
        <Scheme>
          <Labelled
            label="Amount"
            defaultValue="25"
            leading={<Icon name="payments" data-testid="Amount leading" />}
            prefix="$"
            suffix="USD"
            trailing={<Icon name="cancel" data-testid="Amount trailing" />}
          />
        </Scheme>,
      )
      const [prefix, suffix] = [screen.getByText('$'), screen.getByText('USD')]
      expect(box(leading('Amount'), 'Amount')).toMatchObject({ left: 12, width: 24 })
      expect(box(trailing('Amount'), 'Amount')).toMatchObject({ right: 12, width: 24 })
      // The prefix and suffix start where the text would, after the icon.
      expect(box(prefix, 'Amount').left).toBe(52)
      expect(box(suffix, 'Amount').right).toBe(52)
      expect(getComputedStyle(prefix).paddingLeft).toBe('0px')
      expect(getComputedStyle(suffix).paddingRight).toBe('0px')
      const text = textBox('Amount')
      expect(text.left).toBe(52 + prefix.getBoundingClientRect().width)
      expect(text.right).toBe(52 + suffix.getBoundingClientRect().width)
      expect(box(label('Amount'), 'Amount').left).toBe(52)
    })

    it('gives the text its 16dp back at an end whose icon, prefix or suffix is taken away', async () => {
      const field = (icons: boolean, affixes: boolean) => (
        <Scheme>
          <Labelled
            label="Amount"
            leading={icons && <Icon name="payments" />}
            prefix={affixes && '$'}
            suffix={affixes && 'USD'}
            trailing={icons && <Icon name="cancel" />}
          />
        </Scheme>
      )
      const textEnds = () => [textBox('Amount').left, textBox('Amount').right]
      const { rerender } = render(field(true, false))
      expect(textEnds()).toEqual([52, 52])
      rerender(field(false, true))
      const [prefix, suffix] = [screen.getByText('$'), screen.getByText('USD')]
      expect(box(prefix, 'Amount').left).toBe(16)
      expect(box(suffix, 'Amount').right).toBe(16)
      expect(textEnds()).toEqual([
        16 + prefix.getBoundingClientRect().width,
        16 + suffix.getBoundingClientRect().width,
      ])
      rerender(field(false, false))
      expect(textEnds()).toEqual([16, 16])
      expect(ends('Amount').map((el) => getComputedStyle(el).display)).toEqual([
        'none',
        'none',
        'none',
        'none',
      ])
      await settle()
      expect(box(label('Amount'), 'Amount').left).toBe(16)
    })

    it('lays the text out by what a function returns for the state of the control', async () => {
      render(
        <Scheme>
          <Labelled
            label="Search"
            leading={({ isFocusWithin }) => isFocusWithin && <Icon name="search" />}
          />
        </Scheme>,
      )
      expect(textBox('Search').left).toBe(16)
      expect(getComputedStyle(ends('Search')[0]!).display).toBe('none')
      await userEvent.click(textbox('Search'))
      expect(textBox('Search').left).toBe(52)
      expect(getComputedStyle(ends('Search')[0]!).width).toBe('24px')
      await userEvent.unhover(textbox('Search'))
    })

    it('mirrors in a right-to-left layout', () => {
      render(
        <Scheme>
          <div dir="rtl">
            <Full label="Label" />
          </div>
        </Scheme>,
      )
      expect(box(leading('Label'), 'Label').right).toBe(12)
      expect(box(trailing('Label'), 'Label').left).toBe(12)
      expect(box(label('Label'), 'Label').right).toBe(52)
    })
  })

  describe('lines', () => {
    it('starts a multi-line field as one line and grows it a line at a time', async () => {
      render(
        <Scheme>
          <Labelled label="Notes" lines="multi" />
        </Scheme>,
      )
      expect(container('Notes').getBoundingClientRect().height).toBe(56)
      await userEvent.type(textbox('Notes'), 'One{Enter}Two{Enter}Three')
      expect(container('Notes').getBoundingClientRect().height).toBe(56 + 2 * 24)
      const area = textbox('Notes')
      expect(area.scrollHeight).toBe(area.clientHeight)
      await userEvent.clear(area)
      expect(container('Notes').getBoundingClientRect().height).toBe(56)
    })

    it('starts a multi-line field at the rows it is given and grows it past them', async () => {
      render(
        <Scheme>
          <Labelled label="Notes" lines="multi" rows={3} />
        </Scheme>,
      )
      expect(container('Notes').getBoundingClientRect().height).toBe(56 + 2 * 24)
      await userEvent.type(textbox('Notes'), 'One{Enter}Two{Enter}Three{Enter}Four')
      expect(container('Notes').getBoundingClientRect().height).toBe(56 + 3 * 24)
      await userEvent.clear(textbox('Notes'))
      expect(container('Notes').getBoundingClientRect().height).toBe(56 + 2 * 24)
    })

    it('fits a multi-line field to the text it is given, and to its width', async () => {
      const text = 'This is a long input in a multi-line text field that wraps onto new lines'
      const { rerender } = render(
        <Scheme>
          <Labelled label="Notes" lines="multi" defaultValue={text} />
        </Scheme>,
      )
      const tall = container('Notes').getBoundingClientRect().height
      expect(tall).toBeGreaterThan(56 + 24)
      expect((tall - 56) % 24).toBe(0)
      rerender(
        <Scheme>
          <Labelled label="Notes" lines="multi" className="w-140" defaultValue={text} />
        </Scheme>,
      )
      await expect.poll(() => container('Notes').getBoundingClientRect().height).toBeLessThan(tall)
    })

    it.each(variants)(
      'keeps a text area at its rows, its text scrolling under the label, %s',
      async (variant) => {
        render(
          <Scheme>
            <Labelled label="Message" variant={variant} lines="area" rows={3} />
          </Scheme>,
        )
        // Above and below three 24dp lines: 24 and 8dp filled, 16 and 16dp outlined.
        const [above, below] = variant === 'filled' ? [24, 8] : [16, 16]
        expect(container('Message').getBoundingClientRect().height).toBe(above + 72 + below)
        await userEvent.type(textbox('Message'), 'One{Enter}Two{Enter}Three{Enter}Four{Enter}Five')
        expect(container('Message').getBoundingClientRect().height).toBe(above + 72 + below)
        const area = textbox('Message')
        expect(area.scrollHeight).toBeGreaterThan(area.clientHeight)
        expect(area.scrollTop).toBeGreaterThan(0)
        // The space is around the textarea, not in it, so what scrolls stops short of the label.
        const edges = box(area, 'Message')
        expect([edges.top, edges.bottom]).toEqual([above, below])
        expect(getComputedStyle(area).resize).toBe('none')
      },
    )
  })

  describe('input', () => {
    /** Where the control and its label are, and how its text is drawn. */
    const look = (name: string) => {
      const style = getComputedStyle(textbox(name))
      return {
        control: box(textbox(name), name),
        text: textBox(name),
        label: box(label(name), name),
        font: style.font,
        color: style.color,
        caret: style.caretColor,
      }
    }

    it.each(variants)(
      "draws an input that looks as the field's own does, at rest and populated, %s",
      async (variant) => {
        render(
          <Scheme>
            <Labelled label="Own" variant={variant} />
            <Labelled label="Given" variant={variant} input={(props) => <input {...props} />} />
          </Scheme>,
        )
        expect(look('Given')).toEqual(look('Own'))
        await userEvent.type(textbox('Own'), 'Input')
        await userEvent.type(textbox('Given'), 'Input')
        await settle()
        expect(look('Given')).toEqual(look('Own'))
      },
    )

    it('grows a multi-line field it draws the textarea of', async () => {
      render(
        <Scheme>
          <Labelled label="Notes" lines="multi" input={(props) => <textarea {...props} />} />
        </Scheme>,
      )
      expect(container('Notes').getBoundingClientRect().height).toBe(56)
      await userEvent.type(textbox('Notes'), 'One{Enter}Two{Enter}Three')
      expect(container('Notes').getBoundingClientRect().height).toBe(56 + 2 * 24)
    })
  })

  describe('density', () => {
    it.each([
      ['-1', 52],
      ['-2', 48],
      ['-3', 44],
    ] as const)(
      'is 4dp shorter a step, taken evenly from above and below, %s',
      async (density, height) => {
        render(
          <Scheme density={density}>
            <Labelled label="Filled" defaultValue="Input" />
            <Labelled label="Outlined" variant="outlined" defaultValue="Input" />
          </Scheme>,
        )
        await settle()
        const less = (56 - height) / 2
        for (const name of ['Filled', 'Outlined']) {
          expect(container(name).getBoundingClientRect().height, name).toBe(height)
        }
        expect(box(label('Filled'), 'Filled').top).toBe(8 - less)
        const filled = textBox('Filled')
        expect([filled.top, filled.bottom]).toEqual([24 - less, 8 - less])
        const outlined = textBox('Outlined')
        expect([outlined.top, outlined.bottom]).toEqual([16 - less, 16 - less])
        expect(box(label('Outlined'), 'Outlined').top).toBe(-8)
      },
    )
  })

  describe('states', () => {
    it('colors an enabled filled field as the spec does', () => {
      render(
        <Scheme>
          <Full label="Label" defaultValue="Input" />
        </Scheme>,
      )
      const name = 'Label'
      expectRole(
        getComputedStyle(fill(name)).backgroundColor,
        'surface-container-highest',
        fill(name),
      )
      expect(getComputedStyle(stateLayer(name)).opacity).toBe('0')
      expect(strokeWidth(indicator(name))).toBe('1px')
      expectRole(strokeColor(indicator(name)), 'on-surface-variant', indicator(name))
      expect(box(indicator(name), name)).toMatchObject({ left: 0, right: 0, bottom: 0 })
      expectRole(textColor(label(name)), 'on-surface-variant', label(name))
      expectRole(textColor(textbox(name)), 'on-surface', textbox(name))
      expectRole(getComputedStyle(textbox(name)).caretColor, 'primary', textbox(name))
      expectRole(textColor(leading(name)), 'on-surface-variant', leading(name))
      expectRole(textColor(trailing(name)), 'on-surface-variant', trailing(name))
      expectRole(textColor(screen.getByText('Supporting text')), 'on-surface-variant', label(name))
      expect(getComputedStyle(textbox(name)).fontSize).toBe('16px')
      expect(getComputedStyle(textbox(name)).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })

    it('colors an enabled outlined field as the spec does', () => {
      render(
        <Scheme>
          <Full variant="outlined" label="Label" defaultValue="Input" />
        </Scheme>,
      )
      for (const part of outlineParts('Label')) {
        expect(strokeWidth(part)).toBe('1px')
        expect(getComputedStyle(part).borderBottomStyle).toBe('solid')
        expectRole(strokeColor(part), 'outline', part)
      }
      expectRole(textColor(label('Label')), 'on-surface-variant', label('Label'))
      expect(getComputedStyle(container('Label')).backgroundColor).toBe('rgba(0, 0, 0, 0)')
    })

    it('lays the hover state layer on a filled container and darkens its indicator, not its label', async () => {
      render(
        <Scheme>
          <Full label="Label" />
        </Scheme>,
      )
      await userEvent.hover(leading('Label'))
      await settle()
      expectRole(
        getComputedStyle(stateLayer('Label')).backgroundColor,
        'on-surface',
        label('Label'),
      )
      expect(Number(getComputedStyle(stateLayer('Label')).opacity)).toBeCloseTo(0.08)
      expectRole(strokeColor(indicator('Label')), 'on-surface', label('Label'))
      expect(strokeWidth(indicator('Label'))).toBe('1px')
      expectRole(textColor(label('Label')), 'on-surface-variant', label('Label'))
      await userEvent.unhover(leading('Label'))
      await settle()
      expect(getComputedStyle(stateLayer('Label')).opacity).toBe('0')
    })

    it('darkens the outline and label of a hovered outlined field', async () => {
      render(
        <Scheme>
          <Full variant="outlined" label="Label" />
        </Scheme>,
      )
      await userEvent.hover(trailing('Label'))
      await settle()
      for (const part of outlineParts('Label')) {
        expectRole(strokeColor(part), 'on-surface', part)
        expect(strokeWidth(part)).toBe('1px')
      }
      expectRole(textColor(label('Label')), 'on-surface', label('Label'))
      await userEvent.unhover(trailing('Label'))
    })

    it('draws a focused filled field with a 3dp primary indicator and a primary label, up', async () => {
      render(
        <Scheme>
          <Full label="Label" />
        </Scheme>,
      )
      await userEvent.click(textbox('Label'))
      await settle()
      expect(textbox('Label')).toHaveFocus()
      expect(strokeWidth(indicator('Label'))).toBe('3px')
      expectRole(strokeColor(indicator('Label')), 'primary', label('Label'))
      expectRole(textColor(label('Label')), 'primary', label('Label'))
      expect(box(label('Label'), 'Label')).toMatchObject({ left: 52, top: 8, height: 16 })
      expectRole(textColor(leading('Label')), 'on-surface-variant', label('Label'))
      // No ring of the browser's own, nor of the library's: the indicator is the focus cue.
      expect(getComputedStyle(textbox('Label')).outlineStyle).toBe('none')
    })

    it('draws a focused outlined field with a 3dp primary outline, open for its primary label', async () => {
      render(
        <Scheme>
          <Full variant="outlined" label="Label" />
        </Scheme>,
      )
      await userEvent.tab()
      await settle()
      expect(textbox('Label')).toHaveFocus()
      const [start, gap, end] = outlineParts('Label')
      for (const part of [start!, end!]) {
        expect(getComputedStyle(part).borderTopWidth).toBe('3px')
        expect(strokeWidth(part)).toBe('3px')
        expectRole(strokeColor(part), 'primary', part)
      }
      expect(strokeWidth(gap!)).toBe('3px')
      expect(getComputedStyle(gap!, '::before').width).toBe('0px')
      expectRole(textColor(label('Label')), 'primary', label('Label'))
      expect(box(label('Label'), 'Label')).toMatchObject({ left: 16, top: -8 })
      // The outline thickens inward: the container is the size it was.
      expect(container('Label').getBoundingClientRect().height).toBe(56)
      expect(box(start!, 'Label')).toMatchObject({ left: 0, top: 0, width: 12, height: 56 })
    })

    it('keeps the label up while the field is populated, and rests it when empty and unfocused', async () => {
      render(
        <Scheme>
          <Labelled label="Label" />
          <Labelled label="Other" />
        </Scheme>,
      )
      const top = () => box(label('Label'), 'Label').top
      expect(top()).toBe(16)
      await userEvent.click(textbox('Label'))
      await userEvent.keyboard('Hi')
      await userEvent.click(textbox('Other'))
      await settle()
      expect(top()).toBe(8)
      await userEvent.clear(textbox('Label'))
      await settle()
      expect(top()).toBe(8)
      await userEvent.click(textbox('Other'))
      await settle()
      expect(top()).toBe(16)
    })

    it('shows the placeholder only once the label has left its line, and always without a label', async () => {
      render(
        <Scheme>
          <Labelled label="Email" placeholder="name@example.com" />
          <TextField className="w-70" placeholder="Search" aria-label="Query" />
        </Scheme>,
      )
      const placeholder = (name: string) => getComputedStyle(textbox(name), '::placeholder').color
      expect(placeholder('Email')).toBe('rgba(0, 0, 0, 0)')
      expectRole(placeholder('Query'), 'on-surface-variant', textbox('Query'))
      await userEvent.click(textbox('Email'))
      await settle()
      expectRole(placeholder('Email'), 'on-surface-variant', textbox('Email'))
    })

    it('shows a prefix and suffix once the label has left their line', async () => {
      render(
        <Scheme>
          <Labelled label="Amount" prefix="$" suffix="USD" />
          <Labelled label="Weight" defaultValue="25" suffix="lbs" />
        </Scheme>,
      )
      const [prefix, suffix] = [screen.getByText('$'), screen.getByText('USD')]
      expect(getComputedStyle(prefix).opacity).toBe('0')
      expect(getComputedStyle(suffix).opacity).toBe('0')
      expect(getComputedStyle(screen.getByText('lbs')).opacity).toBe('1')
      await userEvent.click(textbox('Amount'))
      await settle()
      expect(getComputedStyle(prefix).opacity).toBe('1')
      expect(getComputedStyle(suffix).opacity).toBe('1')
      expectRole(textColor(prefix), 'on-surface-variant', prefix)
      // On the text's line, 16dp from the ends, and 2dp from the text between them.
      expect(box(prefix, 'Amount').left + parseFloat(getComputedStyle(prefix).paddingLeft)).toBe(16)
      expect(box(suffix, 'Amount').right + parseFloat(getComputedStyle(suffix).paddingRight)).toBe(
        16,
      )
      expect(getComputedStyle(prefix).paddingRight).toBe('2px')
      expect(getComputedStyle(prefix).paddingTop).toBe(
        getComputedStyle(textbox('Amount')).paddingTop,
      )
      expect(textBox('Amount').left).toBe(
        box(prefix, 'Amount').left + prefix.getBoundingClientRect().width,
      )
    })

    it.each(variants)(
      'colors an error as the spec does, at rest, hovered and focused, %s',
      async (variant) => {
        render(
          <Scheme>
            <Full variant={variant} label="Label" isInvalid defaultValue="Input" />
          </Scheme>,
        )
        const name = 'Label'
        const stroke = () => (variant === 'filled' ? indicator(name) : outlineParts(name)[0]!)
        const parts = (role: string) => {
          expectRole(strokeColor(stroke()), role, label(name))
          expectRole(textColor(label(name)), role, label(name))
          expectRole(textColor(trailing(name)), role, label(name))
        }
        parts('error')
        expectRole(textColor(screen.getByText('Supporting text')), 'error', label(name))
        expectRole(textColor(leading(name)), 'on-surface-variant', label(name))
        expectRole(textColor(textbox(name)), 'on-surface', label(name))
        expectRole(getComputedStyle(textbox(name)).caretColor, 'error', label(name))

        await userEvent.hover(leading(name))
        await settle()
        parts('on-error-container')
        expectRole(textColor(screen.getByText('Supporting text')), 'error', label(name))

        await userEvent.click(textbox(name))
        await settle()
        parts('error')
        expect(strokeWidth(stroke())).toBe('3px')
        await userEvent.unhover(textbox(name))
      },
    )

    it("draws a disabled filled field at the spec's opacities, with no states", async () => {
      render(
        <Scheme>
          <Full label="Label" isDisabled defaultValue="Input" />
        </Scheme>,
      )
      const name = 'Label'
      const check = () => {
        expectRole(getComputedStyle(fill(name)).backgroundColor, 'on-surface', fill(name), 0.04)
        expect(getComputedStyle(stateLayer(name)).opacity).toBe('0')
        expectRole(strokeColor(indicator(name)), 'on-surface', indicator(name), 0.38)
        expect(strokeWidth(indicator(name))).toBe('1px')
        expectRole(textColor(label(name)), 'on-surface', label(name), 0.38)
        expectRole(textColor(textbox(name)), 'on-surface', label(name), 0.38)
        expectRole(textColor(leading(name)), 'on-surface', label(name), 0.38)
        expectRole(textColor(trailing(name)), 'on-surface', label(name), 0.38)
        expectRole(textColor(screen.getByText('Supporting text')), 'on-surface', label(name), 0.38)
      }
      check()
      expect(getComputedStyle(textbox(name)).opacity).toBe('1')
      expect(getComputedStyle(container(name)).cursor).toBe('default')
      expect(getComputedStyle(label(name)).cursor).toBe('default')
      await userEvent.hover(container(name))
      await settle()
      check()
      await userEvent.unhover(container(name))
    })

    it('draws a disabled outlined field with its outline at 12%, hovered or not', async () => {
      render(
        <Scheme>
          <Full variant="outlined" label="Label" isDisabled isInvalid />
        </Scheme>,
      )
      const check = () => {
        for (const part of outlineParts('Label'))
          expectRole(strokeColor(part), 'on-surface', part, 0.12)
        expectRole(textColor(label('Label')), 'on-surface', label('Label'), 0.38)
        expectRole(textColor(trailing('Label')), 'on-surface', label('Label'), 0.38)
      }
      check()
      await userEvent.hover(container('Label'))
      await settle()
      check()
      await userEvent.unhover(container('Label'))
    })

    it('draws every part disabled, the suffix, supporting text and counter too', () => {
      render(
        <Scheme>
          <Labelled
            label="Label"
            description="Supporting text"
            isDisabled
            maxLength={20}
            defaultValue="Input"
            trailing="lbs"
          />
        </Scheme>,
      )
      expect(textbox('Label')).toBeDisabled()
      for (const part of [
        label('Label'),
        textbox('Label'),
        screen.getByText('lbs'),
        screen.getByText('Supporting text'),
        screen.getByText(/5\/20/),
      ]) {
        expectRole(textColor(part), 'on-surface', part, 0.38)
      }
      expectRole(getComputedStyle(fill('Label')).backgroundColor, 'on-surface', fill('Label'), 0.04)
      expect(getComputedStyle(container('Label')).cursor).toBe('default')
      expect(getComputedStyle(label('Label')).cursor).toBe('default')
    })
  })

  describe('pointer', () => {
    it.each(variants)(
      'lets a click on the resting label through to the input, and takes one on the raised label as a label does, %s',
      async (variant) => {
        render(
          <Scheme>
            <Labelled label="Label" variant={variant} />
            <button>Elsewhere</button>
          </Scheme>,
        )
        expect(label('Label')).toHaveAttribute('for', textbox('Label').id)
        expect(getComputedStyle(container('Label')).cursor).toBe('text')
        expect(getComputedStyle(label('Label')).cursor).toBe('text')
        // At rest the label lies on the input's line: a click there lands on the input itself,
        // where the caret goes, and so does one that automation aims at the input.
        const rest = label('Label').getBoundingClientRect()
        const hit = document.elementFromPoint(rest.left + 8, rest.top + rest.height / 2)
        expect(hit).toBe(textbox('Label'))
        await userEvent.click(textbox('Label'))
        await userEvent.keyboard('Input')
        screen.getByRole('button', { name: 'Elsewhere' }).focus()
        await settle()
        // Raised, it is the label the pointer reaches, which focuses the control. An outlined
        // field's straddles the container's top edge: its upper half is outside the container.
        const up = box(label('Label'), 'Label')
        expect(up.top).toBe(variant === 'outlined' ? -8 : 8)
        expect(getComputedStyle(label('Label')).cursor).toBe('text')
        await userEvent.click(label('Label'), { position: { x: 8, y: 2 } })
        expect(textbox('Label')).toHaveFocus()
      },
    )

    it('focuses the input from a click on an icon, and keeps its focus on a second one', async () => {
      render(
        <Scheme>
          <Full label="Label" />
        </Scheme>,
      )
      await userEvent.click(leading('Label'))
      expect(textbox('Label')).toHaveFocus()
      let blurred = false
      textbox('Label').addEventListener('blur', () => (blurred = true))
      await userEvent.click(trailing('Label'))
      expect(textbox('Label')).toHaveFocus()
      expect(blurred).toBe(false)
    })
  })

  describe('contrast', () => {
    it.each(schemes)(
      'holds 3:1 for the strokes and 4.5:1 for the text, %s %s',
      async (theme, contrast) => {
        render(
          <Scheme theme={theme} contrast={contrast}>
            <Full label="Filled" defaultValue="Input" />
            <Full variant="outlined" label="Outlined" defaultValue="Input" />
            <Full variant="outlined" label="Wrong" isInvalid defaultValue="Input" />
          </Scheme>,
        )
        await settle()
        const surface = getComputedStyle(schemeOf(label('Filled'))).backgroundColor
        const filled = getComputedStyle(fill('Filled')).backgroundColor
        const below: string[] = []
        const check = (what: string, a: string, b: string, least: number) => {
          if (contrastRatio(a, b) < least) below.push(`${what} ${contrastRatio(a, b).toFixed(2)}`)
        }
        check('indicator', strokeColor(indicator('Filled')), surface, 3)
        check('filled label', textColor(label('Filled')), filled, 4.5)
        check('filled text', textColor(textbox('Filled')), filled, 4.5)
        check('filled icon', textColor(leading('Filled')), filled, 3)
        check('outline', strokeColor(outlineParts('Outlined')[0]!), surface, 3)
        check('outlined label', textColor(label('Outlined')), surface, 4.5)
        check('outlined text', textColor(textbox('Outlined')), surface, 4.5)
        check(
          'supporting text',
          textColor(screen.getAllByText('Supporting text')[0]!),
          surface,
          4.5,
        )
        check('error outline', strokeColor(outlineParts('Wrong')[0]!), surface, 3)
        check('error label', textColor(label('Wrong')), surface, 4.5)
        expect(below).toEqual([])
      },
    )
  })

  describe('motion', () => {
    it('moves every part over a short-4 on the standard easing, not a spring', () => {
      render(
        <Scheme>
          <Full label="Filled" />
          <Full variant="outlined" label="Outlined" />
        </Scheme>,
      )
      const parts = [
        label('Filled'),
        indicator('Filled'),
        stateLayer('Filled'),
        outline('Outlined'),
        trailing('Outlined'),
      ]
      for (const part of parts) {
        const style = getComputedStyle(part)
        expect(new Set(style.transitionDuration.split(', '))).toEqual(new Set(['0.2s']))
        expect(new Set(style.transitionTimingFunction.split(/, (?=cubic)/))).toEqual(
          new Set(['cubic-bezier(0.2, 0, 0, 1)']),
        )
      }
      const moved = getComputedStyle(label('Filled')).transitionProperty.split(', ')
      expect(moved).toEqual(expect.arrayContaining(['top', 'font-size', 'line-height', 'color']))
      const drawn = getComputedStyle(outline('Outlined')).transitionProperty.split(', ')
      expect(drawn).toEqual(
        expect.arrayContaining(['color', '--text-field-outline-width', '--text-field-notch-edge']),
      )
      // The control itself changes at once.
      expect(getComputedStyle(textbox('Filled')).transitionDuration).toBe('0s')
    })

    it('carries the label, the notch and the outline between their states, frame by frame', async () => {
      render(
        <Scheme>
          <Labelled label="Label" variant="outlined" />
        </Scheme>,
      )
      const half = () => parseFloat(getComputedStyle(notch('Label'), '::before').width)
      const closed = half()
      textbox('Label').focus()
      await expect.poll(() => textbox('Label').hasAttribute('data-focused')).toBe(true)
      // Reading a style starts the transitions of the change just made; each is held midway.
      void getComputedStyle(label('Label')).top
      void getComputedStyle(outline('Label')).color
      const running = container('Label').getAnimations({ subtree: true })
      expect(running.length).toBeGreaterThan(0)
      running.forEach((animation) => {
        animation.pause()
        animation.currentTime = 50
      })
      const top = box(label('Label'), 'Label').top
      expect(top).toBeGreaterThan(-8)
      expect(top).toBeLessThan(16)
      expect(half()).toBeGreaterThan(0)
      expect(half()).toBeLessThan(closed)
      const width = parseFloat(getComputedStyle(outlineParts('Label')[0]!).borderTopWidth)
      expect(width).toBeGreaterThanOrEqual(1)
      expect(width).toBeLessThanOrEqual(3)
      running.forEach((animation) => animation.finish())
      await settle()
      expect(box(label('Label'), 'Label').top).toBe(-8)
      expect(half()).toBe(0)
    })

    describe('reduced', () => {
      useReducedMotion()

      it('moves nothing over time', () => {
        render(
          <Scheme>
            <Full label="Filled" />
            <Full variant="outlined" label="Outlined" />
          </Scheme>,
        )
        for (const part of [label('Filled'), indicator('Filled'), outline('Outlined')]) {
          const durations = getComputedStyle(part).transitionDuration.split(', ')
          expect(durations.every((duration) => parseFloat(duration) < 0.001)).toBe(true)
        }
      })
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the checks below run in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('outlines a filled container, which loses its fill, and keeps both strokes', () => {
      render(
        <Scheme>
          <Full label="Filled" />
          <Full variant="outlined" label="Outlined" />
        </Scheme>,
      )
      const scheme = schemeOf(label('Filled'))
      const canvasText = computedColor('CanvasText', scheme)
      const edge = getComputedStyle(fill('Filled'))
      expect([edge.outlineStyle, edge.outlineWidth, edge.outlineOffset]).toEqual([
        'solid',
        '1px',
        '-1px',
      ])
      expect(edge.outlineColor).toBe(canvasText)
      expect(strokeColor(indicator('Filled'))).toBe(canvasText)
      for (const part of outlineParts('Outlined')) expect(strokeColor(part)).toBe(canvasText)
    })

    it('draws the focused stroke in Highlight, 3dp', async () => {
      render(
        <Scheme>
          <Full label="Filled" />
          <Full variant="outlined" label="Outlined" />
        </Scheme>,
      )
      const highlight = computedColor('Highlight', schemeOf(label('Filled')))
      await userEvent.click(textbox('Filled'))
      await settle()
      expect(strokeColor(indicator('Filled'))).toBe(highlight)
      expect(strokeWidth(indicator('Filled'))).toBe('3px')
      await userEvent.click(textbox('Outlined'))
      await settle()
      for (const part of outlineParts('Outlined')) {
        expect(strokeColor(part)).toBe(highlight)
        expect(strokeWidth(part)).toBe('3px')
      }
    })

    it('greys out a disabled field', () => {
      render(
        <Scheme>
          <Full label="Filled" isDisabled />
          <Full variant="outlined" label="Outlined" isDisabled />
        </Scheme>,
      )
      const grayText = computedColor('GrayText', schemeOf(label('Filled')))
      expect(getComputedStyle(fill('Filled')).outlineColor).toBe(grayText)
      expect(strokeColor(indicator('Filled'))).toBe(grayText)
      for (const part of outlineParts('Outlined')) expect(strokeColor(part)).toBe(grayText)
      for (const text of [
        textbox('Filled'),
        label('Filled'),
        leading('Filled'),
        trailing('Outlined'),
        screen.getAllByText('Supporting text')[0]!,
      ]) {
        expect(textColor(text)).toBe(grayText)
      }
    })
  })
})
