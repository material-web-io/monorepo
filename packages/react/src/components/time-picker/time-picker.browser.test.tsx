import { Time } from '@internationalized/date'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import { useState, type ReactElement } from 'react'
import { DialogTrigger, Heading, I18nProvider, type TimeValue } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import {
  catchTransitions,
  computedColor,
  computedRadius,
  expectHitArea,
  rgba,
  settle,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
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

/* Everything that needs a real browser and the real stylesheet: the picker's measurements in its
 * dialog, to Compose's as the user's recording of it shows them, its colors, hit areas, the dial's
 * pointer and its motion, the swap of the modes, reduced motion, forced colors and a right-to-left
 * locale. Markup, naming and behavior: time-picker.test.tsx. */

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

beforeEach(() => {
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(async () => {
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

type HeldProps = Partial<TimePickerProps<TimeValue>> & { initial?: TimeValue | null }

/** The picker in its dialog, as the stories piece them, opened by a button: the display mode the
 * caller's, swapped by the toggle in the actions, and the time picked held until OK. */
function Picker({ initial = seven, displayMode: initialMode = 'picker', ...props }: HeldProps) {
  const [value, setValue] = useState<TimeValue | null>(initial)
  const [mode, setMode] = useState(initialMode)
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
          <Button variant="text" slot="close">
            OK
          </Button>
        }
      >
        <TimePicker
          aria-label="Time"
          value={value}
          onChange={setValue}
          displayMode={mode}
          {...props}
        >
          {props.children ?? parts}
        </TimePicker>
      </TimePickerDialog>
    </DialogTrigger>
  )
}

const dialog = () => screen.getByRole('dialog')
const container = () => dialog().parentElement!
const button = (name: string) => within(dialog()).getByRole('button', { name })
/** The hour or the minute itself: React Aria's segment over the dial, the text input in input mode. */
const field = (type: 'hour' | 'minute') =>
  dialog().querySelector<HTMLElement>(`[data-type="${type}"]`) ??
  within(dialog()).getByRole('textbox', { name: type === 'hour' ? 'Hour' : 'Minute' })
/** The box of the hour or the minute. */
const segment = (type: 'hour' | 'minute') => field(type).parentElement!
const separator = () => dialog().querySelector<HTMLElement>('.time-picker-input-separator')!
const period = () => within(dialog()).queryByRole('radiogroup', { name: 'Select AM or PM' })
/** An option of the period selector: React Aria's RadioButton, the label around the hidden input. */
const option = (name: string) => within(period()!).getByRole('radio', { name }).closest('label')!
/** The option's half of the box, React Aria's RadioField, which draws the line between the two. */
const optionBox = (name: string) => option(name).parentElement!
const pane = () => dialog().querySelector<HTMLElement>('.time-picker-dial-pane')!
const dial = () => dialog().querySelector<HTMLElement>('.time-picker-dial')!
const hand = () => dialog().querySelector<HTMLElement>('.time-picker-dial-hand')!
/** The handle's cut of the numbers on the face shown; both faces stay mounted, the other inert. */
const knockout = () =>
  dialog().querySelector<HTMLElement>(
    '.time-picker-dial-face:not([inert]) .time-picker-dial-selected',
  )!
/** The copy of a number in the handle's cut, by its text. */
const cut = (text: string) =>
  [...knockout().children].find((el) => el.textContent === text) as HTMLElement
const number = (name: string) =>
  dialog().querySelector<HTMLElement>(`.time-picker-dial-numbers [aria-label="${name}"]`)!
const shown = () => `${field('hour').textContent}:${field('minute').textContent}`
/** The hand's angle, within a turn: it keeps the turns it has made, to turn the short way. */
const angle = () => ((parseFloat(style(hand()).rotate) % 360) + 360) % 360
/** The transition of the hand's angle that is running, if one is. */
const turning = () =>
  document
    .getAnimations()
    .find((it) => (it as CSSTransition).transitionProperty === '--time-picker-dial-angle')
/** The delay and the duration of the transition of a property running on an element. */
const timing = (target: Element, property: string) => {
  const it = document
    .getAnimations()
    .find(
      (it) =>
        (it.effect as KeyframeEffect).target === target &&
        (it as CSSTransition).transitionProperty === property,
    )
  const computed = it?.effect?.getComputedTiming()
  return computed ? [computed.delay, computed.duration] : undefined
}
/** The faces of numbers: the hours' of a 12-hour clock and of a 24-hour one, and the minutes'. */
const faces = () => [...dialog().querySelectorAll<HTMLElement>('.time-picker-dial-face')]
/** Pauses every transition running, and returns what seeks them all to a time, in milliseconds,
 * and what lets them run on: the swap read at a time of its own, not of the clock's. */
const hold = () => {
  const all = document.getAnimations().filter((it) => it instanceof CSSTransition)
  all.forEach((it) => it.pause())
  return {
    at: (time: number) => all.forEach((it) => (it.currentTime = time)),
    release: () => all.forEach((it) => it.play()),
  }
}
/** The transition of the dial pane's height or width that is running, the swap's. */
const folding = () =>
  document
    .getAnimations()
    .find(
      (it) =>
        (it.effect as KeyframeEffect).target === pane() &&
        ['height', 'width'].includes((it as CSSTransition).transitionProperty),
    )

/** The pixels of an element's box as drawn, in device pixels. */
async function pixels(el: HTMLElement) {
  const image = new Image()
  image.src = `data:image/png;base64,${await page.screenshot({ element: el, save: false })}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0)
  return context.getImageData(0, 0, image.width, image.height)
}
/** How many pixels differ between two shots of a box `size` CSS px square, within `radius` of its center. */
const differing = (a: ImageData, b: ImageData, size: number, radius: number) => {
  const scale = a.width / size
  let count = 0
  for (let i = 0; i < a.data.length; i += 4) {
    const x = ((i / 4) % a.width) + 0.5 - a.width / 2
    const y = Math.floor(i / 4 / a.width) + 0.5 - a.height / 2
    if (Math.hypot(x, y) > radius * scale) continue
    if (
      a.data[i] !== b.data[i] ||
      a.data[i + 1] !== b.data[i + 1] ||
      a.data[i + 2] !== b.data[i + 2]
    )
      count++
  }
  return count
}

async function open(element: ReactElement) {
  render(element)
  await userEvent.click(screen.getByRole('button', { name: 'Open' }))
  await settle()
}

/** A press of the pointer at `x`, `y` on the dial, from its top left corner. */
async function pressDial(x: number, y: number) {
  await commands.pointer('.time-picker-dial', x, y, 'down')
  await commands.pointer('.time-picker-dial', x, y, 'up')
}

/** A pointer event on the face from inside the page, at a point of it. */
const pointerOnDial = (type: string, [x, y]: [number, number], init: PointerEventInit = {}) => {
  const face = rect(dial())
  dial().dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      buttons: 1,
      clientX: face.left + x,
      clientY: face.top + y,
      ...init,
    }),
  )
}

/** The click a browser sends after the pointer lifts, which ends the press for React Aria. */
const clickOnDial = ([x, y]: [number, number]) => {
  const face = rect(dial())
  dial().dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: 1,
      clientX: face.left + x,
      clientY: face.top + y,
    }),
  )
}

/**
 * A press on the face from inside the page, for a test that reads the hour it picks before the
 * 100ms to the minutes: a real pointer's answer can come later than that on a busy machine.
 */
const pressDialInPage = (point: [number, number]) =>
  act(() => {
    pointerOnDial('pointerdown', point)
    pointerOnDial('pointerup', point, { buttons: 0 })
    clickOnDial(point)
  })

/** The point at an angle from 12 o'clock, clockwise, and a distance from the dial's center. */
const at = (angle: number, distance: number): [number, number] => [
  128 + Math.sin((angle * Math.PI) / 180) * distance,
  128 - Math.cos((angle * Math.PI) / 180) * distance,
]

describe('TimePicker in a browser', () => {
  it('hides the dial and its face shown with an ancestor hidden', async () => {
    render(
      <div data-testid="ancestor">
        <TimePicker aria-label="Time" defaultValue={seven}>
          {parts}
        </TimePicker>
      </div>,
    )
    await settle()
    const ancestor = screen.getByTestId('ancestor')
    const dial = ancestor.querySelector<HTMLElement>('.time-picker-dial')!
    const hours = ancestor.querySelector<HTMLElement>('.time-picker-dial-face')!
    expect([style(dial).visibility, style(hours).visibility]).toEqual(['visible', 'visible'])
    ancestor.style.visibility = 'hidden'
    expect([style(dial).visibility, style(hours).visibility]).toEqual(['hidden', 'hidden'])
  })

  describe('in its dialog', () => {
    it('is a 328dp dialog laid out as Compose’s vertical dial, 528dp tall', async () => {
      await open(<Picker />)
      const panel = rect(container())
      expect([panel.width, panel.height]).toEqual([
        328,
        24 + 16 + 20 + 80 + 36 + 256 + 24 + 48 + 24,
      ])
      expect(style(container()).borderRadius).toBe(computedRadius('rounded-shape-xl'))
      // The title label-medium on-surface-variant, 24dp from the top and the start, 20dp over the time.
      const title = within(dialog()).getByText('Select time')
      expect([rect(title).top - panel.top, rect(title).left - panel.left]).toEqual([24, 24])
      expect([style(title).fontSize, style(title).lineHeight, style(title).fontWeight]).toEqual([
        '12px',
        '16px',
        '500',
      ])
      expectRole(style(title).color, 'on-surface-variant')
      // The hour and the minute 96dp by 80dp with 8dp corners, the separator 24dp between them,
      // lifted 4dp.
      const hour = rect(segment('hour'))
      expect([hour.left - panel.left, hour.top - panel.top, hour.width, hour.height]).toEqual([
        24, 60, 96, 80,
      ])
      expect(style(segment('hour')).borderRadius).toBe(computedRadius('rounded-shape-sm'))
      const colon = rect(separator())
      expect([colon.left - hour.right, colon.width, colon.height]).toEqual([0, 24, 80])
      expect(colon.top - hour.top).toBe(-4)
      const minute = rect(segment('minute'))
      expect([minute.left - colon.right, minute.width, minute.height]).toEqual([0, 96, 80])
      // The period selector 52dp by 80dp, 12dp after the minute, outlined 1dp with 8dp corners.
      const am = rect(period()!)
      expect([am.left - minute.right, am.top - panel.top, am.width, am.height]).toEqual([
        12, 60, 52, 80,
      ])
      expect(style(period()!).borderTopWidth).toBe('1px')
      expect(style(period()!).borderRadius).toBe(computedRadius('rounded-shape-sm'))
      // The dial 256dp, 36dp under the time, centered under the row.
      const face = rect(dial())
      expect([face.top - hour.bottom, face.width, face.height]).toEqual([36, 256, 256])
      expect(face.left - panel.left).toBe(24 + (280 - 256) / 2)
      // The actions 24dp under the dial, 48dp tall and 24dp over the bottom: the toggle centered in
      // a 48dp slot 24dp in, the buttons 24dp from the end, 8dp apart.
      const toggle = rect(button('Switch to text input mode'))
      expect([toggle.top - face.bottom, toggle.left - panel.left, toggle.width]).toEqual([
        24 + 4,
        24 + 4,
        40,
      ])
      expect(panel.bottom - toggle.bottom).toBe(24 + 4)
      const ok = rect(button('OK'))
      expect([panel.right - ok.right, ok.top]).toEqual([24, toggle.top])
      expect(ok.left - rect(button('Cancel')).right).toBe(8)
    })

    it('passes the layer’s padding on a phone: 328dp wide, 16dp from a 360dp window’s edges, the period selector whole', async () => {
      await page.viewport(360, 800)
      await open(<Picker />)
      const panel = rect(container())
      expect([panel.width, panel.left, 360 - panel.right]).toEqual([328, 16, 16])
      expect(rect(period()!).right).toBe(panel.right - 24)
      const pm = rect(option('PM'))
      expect(document.elementFromPoint(pm.left + pm.width / 2, pm.top + pm.height / 2)).toBe(
        option('PM'),
      )
    })

    it('scrolls the picker in a short landscape window, 732dp by 412dp, the actions staying under it', async () => {
      await page.viewport(732, 412)
      await open(<Picker layout="horizontal" />)
      const panel = rect(container())
      expect([panel.top, 412 - panel.bottom]).toEqual([56, 56])
      const picker = dialog().querySelector<HTMLElement>('.time-picker')!
      expect(picker.scrollHeight).toBeGreaterThan(picker.clientHeight)
      expect(picker.scrollWidth).toBe(picker.clientWidth)
      const ok = rect(button('OK'))
      expect(ok.bottom).toBeLessThanOrEqual(panel.bottom)
      const hit = document.elementFromPoint(ok.left + ok.width / 2, ok.top + ok.height / 2)
      expect(button('OK').contains(hit)).toBe(true)
      picker.scrollTop = picker.scrollHeight
      expect(rect(dial()).bottom).toBeLessThanOrEqual(rect(picker).bottom)
    })

    it('gives a word the locale writes between the hour and the minute its room, as Canadian French’s h, where a colon has 24dp', async () => {
      await open(
        <I18nProvider locale="fr-CA">
          <Picker displayMode="input" />
        </I18nProvider>,
      )
      expect(separator().textContent).toBe(' h ')
      const word = rect(separator())
      expect(word.width).toBeGreaterThan(24)
      expect(separator().scrollWidth).toBeLessThanOrEqual(separator().clientWidth)
      expect([word.left, word.right]).toEqual([
        rect(segment('hour')).right,
        rect(segment('minute')).left,
      ])
    })

    it('puts the buttons at the end without a mode toggle', async () => {
      await open(
        <DialogTrigger>
          <Button>Open</Button>
          <TimePickerDialog
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
            <TimePicker aria-label="Time" defaultValue={seven}>
              {parts}
            </TimePicker>
          </TimePickerDialog>
        </DialogTrigger>,
      )
      const panel = rect(container())
      expect(panel.right - rect(button('OK')).right).toBe(24)
      expect(rect(button('OK')).left - rect(button('Cancel')).right).toBe(8)
    })

    it('draws the picker on no background of its own, in the spec’s colors', async () => {
      await open(<Picker />)
      expect(rgba(style(dialog().querySelector('.time-picker')!).backgroundColor)[3]).toBe(0)
      expectRole(style(container(), '::before').backgroundColor, 'surface-container-high')
      // The hour, the selection, primary-container and on-primary-container in display-large; the
      // minute surface-container-highest and on-surface; the separator on-surface.
      const hour = style(segment('hour'))
      expectRole(hour.backgroundColor, 'primary-container')
      expectRole(hour.color, 'on-primary-container')
      expect([hour.fontSize, hour.lineHeight]).toEqual(['57px', '64px'])
      expectRole(style(segment('minute')).backgroundColor, 'surface-container-highest')
      expectRole(style(segment('minute')).color, 'on-surface')
      expectRole(style(separator()).color, 'on-surface')
      expect(style(separator()).fontSize).toBe('57px')
      // AM, selected, tertiary-container and on-tertiary-container in title-medium; PM
      // on-surface-variant; the outline and the line between them outline.
      expectRole(style(option('AM')).backgroundColor, 'tertiary-container')
      expectRole(style(option('AM')).color, 'on-tertiary-container')
      expect(style(option('AM')).fontSize).toBe('16px')
      expect(rgba(style(option('PM')).backgroundColor)[3]).toBe(0)
      expectRole(style(option('PM')).color, 'on-surface-variant')
      expectRole(style(period()!).borderTopColor, 'outline')
      expect(style(optionBox('PM')).borderTopWidth).toBe('1px')
      expectRole(style(optionBox('PM')).borderTopColor, 'outline')
      // The dial surface-container-highest; its numbers body-large on-surface; the hand, its
      // handle and the center dot primary, and the number under the handle on-primary.
      expectRole(style(dial()).backgroundColor, 'surface-container-highest')
      expectRole(style(number('7 hours')).color, 'on-surface')
      expect(style(number('7 hours')).fontSize).toBe('16px')
      expectRole(style(hand(), '::before').backgroundColor, 'primary')
      expectRole(style(hand(), '::after').backgroundColor, 'primary')
      expectRole(style(cut('7')).color, 'on-primary')
    })

    it('colors a placeholder on-surface-variant, and on-primary-container in the selection', async () => {
      await open(<Picker initial={null} />)
      expect(field('hour')).toHaveAttribute('data-placeholder')
      expectRole(style(segment('hour')).color, 'on-primary-container')
      expectRole(style(segment('minute')).color, 'on-surface-variant')
    })

    it('fades the separator, the box’s outline and the line between the options when disabled', async () => {
      await open(<Picker isDisabled />)
      expectRole(style(segment('minute')).color, 'on-surface', 0.38)
      expectRole(style(separator()).color, 'on-surface', 0.38)
      expectRole(style(period()!).borderTopColor, 'on-surface', 0.12)
      expectRole(style(optionBox('PM')).borderTopColor, 'on-surface', 0.12)
      expectRole(style(option('PM')).color, 'on-surface', 0.38)
    })

    it('turns the hand to the time: 210deg at 7, its 48dp handle on the ring 101dp out, the track 2dp from the 8dp center', async () => {
      await open(<Picker />)
      expect(style(hand()).rotate).toBe('210deg')
      expect([
        style(hand(), '::after').width,
        style(hand(), '::after').left,
        style(hand(), '::after').top,
      ]).toEqual(['48px', '104px', '3px'])
      expect([style(hand(), '::before').width, style(hand(), '::before').height]).toEqual([
        '2px',
        '77px',
      ])
      expect(style(dialog().querySelector('.time-picker-dial-center')!).width).toBe('8px')
      // The number 7's 48dp target centered on the ring at 210deg, the knockout cut to the
      // handle there.
      const face = rect(dial())
      const [x, y] = at(210, 101)
      const seven = rect(number('7 hours'))
      expect(seven.left - face.left).toBeCloseTo(x - 24, 0)
      expect(seven.top - face.top).toBeCloseTo(y - 24, 0)
      expect([seven.width, seven.height]).toEqual([48, 48])
      expect(style(knockout()).clipPath).toMatch(/^circle\(24px at /)
    })

    it('rings the period option the keyboard focuses 3dp secondary 2dp outside it, past the box’s outline, round at its corners and square at the line between the two', async () => {
      await open(<Picker />)
      await userEvent.click(segment('minute'))
      await userEvent.keyboard('{Tab}')
      await settle()
      expect(option('AM').contains(document.activeElement)).toBe(true)
      const ring = style(option('AM'))
      expect([ring.outlineStyle, ring.outlineWidth, ring.outlineOffset]).toEqual([
        'solid',
        '3px',
        '2px',
      ])
      expectRole(ring.outlineColor, 'secondary')
      expect([ring.borderTopLeftRadius, ring.borderBottomLeftRadius]).toEqual([
        computedRadius('rounded-shape-sm'),
        '0px',
      ])
      expect([
        style(option('PM')).borderTopLeftRadius,
        style(option('PM')).borderBottomLeftRadius,
      ]).toEqual(['0px', computedRadius('rounded-shape-sm')])
      // Drawn, not cut by the box: the ring's band, 2dp to 5dp over the option, is secondary.
      const panel = rect(container())
      const am = rect(option('AM'))
      const shot = await pixels(container())
      const scale = shot.width / panel.width
      const at = (x: number, y: number) => {
        const i = (Math.round(y * scale) * shot.width + Math.round(x * scale)) * 4
        return `rgb(${shot.data[i]}, ${shot.data[i + 1]}, ${shot.data[i + 2]})`
      }
      expect(at(am.left + am.width / 2 - panel.left, am.top - 3.5 - panel.top)).toBe(
        color('secondary'),
      )
      expect(at(am.left - 3.5 - panel.left, am.top + am.height / 2 - panel.top)).toBe(
        color('secondary'),
      )
    })

    it('gives the toggle a 48dp target, and the period options half their 80dp box, as Compose does', async () => {
      await open(<Picker />)
      expectHitArea(button('Switch to text input mode'))
      expect(style(dial()).cursor).toBe('pointer')
      const am = rect(option('AM'))
      expect(document.elementFromPoint(am.left + 2, am.top + 2)).toBe(option('AM'))
      expect(document.elementFromPoint(am.left + 2, am.bottom + 2)).toBe(option('PM'))
    })

    it('shows the input 243dp tall, as Compose lays it out: the title 24dp from the top, the boxes 72dp in display-medium with the labels 7dp under them in two lines’ room, the dial folded away', async () => {
      await open(<Picker displayMode="input" />)
      const panel = rect(container())
      expect([panel.width, panel.height]).toEqual([328, 24 + 16 + 20 + 72 + 7 + 32 + 48 + 24])
      expect(rect(within(dialog()).getByText('Enter time')).top - panel.top).toBe(24)
      const hour = rect(segment('hour'))
      expect([hour.top - panel.top, hour.width, hour.height]).toEqual([60, 96, 72])
      expect(style(segment('hour')).fontSize).toBe('45px')
      expect([rect(separator()).top - hour.top, rect(separator()).height]).toEqual([-4, 72])
      expect(style(separator()).fontSize).toBe('45px')
      const label = rect(within(dialog()).getByText('Hour'))
      expect([
        label.top - hour.bottom,
        label.left - hour.left,
        style(within(dialog()).getByText('Hour')).lineHeight,
      ]).toEqual([7, 0, '16px'])
      expect(rect(within(dialog()).getByText('Minute')).left).toBe(rect(segment('minute')).left)
      expectRole(style(within(dialog()).getByText('Hour')).color, 'on-surface-variant')
      expect(style(within(dialog()).getByText('Hour')).fontSize).toBe('12px')
      expect(rect(dialog().querySelector('.time-picker-input-labels')!).height).toBe(7 + 32)
      expect([rect(period()!).height, rect(pane()).height]).toEqual([72, 0])
      expect(style(dial()).visibility).toBe('hidden')
      expect(pane()).toHaveAttribute('inert')
    })

    it('is a text input in input mode, as Compose’s text field: the selection outlined 1dp inside its edge in outline, 2dp while focused, with the native caret in primary and its text selectable; over the dial, a clicked segment has no focus ring, the keyboard’s does, and a press on the face takes the focus off a segment', async () => {
      await open(<Picker displayMode="input" />)
      const hour = field('hour') as HTMLInputElement
      expect([hour.tagName, hour.value]).toEqual(['INPUT', '07'])
      // The hour, the selection, is outlined 1dp as the input opens, with the focus on the dialog.
      expect(style(segment('hour')).boxShadow).toContain(
        `${color('outline')} 0px 0px 0px 1px inset`,
      )
      await userEvent.click(segment('hour'))
      await settle()
      expect(document.activeElement).toBe(hour)
      expect(style(segment('hour')).boxShadow).toContain(
        `${color('outline')} 0px 0px 0px 2px inset`,
      )
      expect(style(segment('minute')).boxShadow).toBe('none')
      expectRole(style(hour).caretColor, 'primary')
      expect([style(hour).fontSize, style(hour).textAlign, style(hour).userSelect]).toEqual([
        '45px',
        'center',
        'text',
      ])
      expect([rect(hour).width, rect(hour).height]).toEqual([96, 72])
      // Its text is selected and typed over as in any input; the hour then hands on to the minute.
      hour.setSelectionRange(0, 2)
      expect([hour.selectionStart, hour.selectionEnd]).toEqual([0, 2])
      await userEvent.keyboard('9')
      expect(hour.value).toBe('9')
      expect(document.activeElement).toBe(field('minute'))
      await settle()
      expect(style(segment('hour')).boxShadow).toBe('none')
      expect(style(segment('minute')).boxShadow).toContain(
        `${color('outline')} 0px 0px 0px 2px inset`,
      )
      // Unfocused, the selection keeps a 1dp outline.
      button('OK').focus()
      await settle()
      expect(style(segment('minute')).boxShadow).toContain(
        `${color('outline')} 0px 0px 0px 1px inset`,
      )
      // Over the dial, a segment clicked is only the selection, as Compose's selector: no outline, and
      // no focus ring, which the browser would draw on the contenteditable segment; the keyboard's
      // focus draws it. A press on the dial takes the focus, as Compose clears it.
      await userEvent.click(button('Switch to touch input mode'))
      await settle()
      await userEvent.click(segment('hour'))
      await settle()
      expect(document.activeElement).toBe(field('hour'))
      expect(field('hour')).toHaveAttribute('role', 'spinbutton')
      expect([style(segment('hour')).boxShadow, style(segment('hour')).outlineStyle]).toEqual([
        'none',
        'none',
      ])
      await userEvent.keyboard('{Tab}')
      expect(document.activeElement).toBe(field('minute'))
      expect(style(segment('minute')).outlineStyle).toBe('solid')
      expectRole(style(segment('minute')).outlineColor, 'secondary')
      await userEvent.click(segment('hour'))
      await settle()
      expect(style(segment('hour')).outlineStyle).toBe('none')
      await pressDial(...at(80, 60))
      expect(document.activeElement).toBe(dial())
    })

    it('keeps the number under the handle on-primary while the keyboard focus rings it: the ring raises a number over its neighbors, not over the handle’s cut', async () => {
      await open(<Picker defaultSelection="minute" />)
      const box = number('0 minutes')
      const plain = await pixels(box)
      // The shots see the number: with the handle's cut hidden, the on-surface number shows through.
      knockout().style.visibility = 'hidden'
      expect(differing(await pixels(box), plain, 48, 22)).toBeGreaterThan(0)
      knockout().style.visibility = ''
      await userEvent.click(segment('minute'))
      for (let i = 0; i < 20 && document.activeElement !== box; i++) await userEvent.tab()
      expect(document.activeElement).toBe(box)
      expect(style(box).outlineStyle).toBe('solid')
      expectRole(style(cut('00')).color, 'on-primary')
      await settle()
      expect(differing(await pixels(box), plain, 48, 22)).toBe(0)
    })

    it('lays the horizontal dial out as Compose does: the selector 216dp by 38dp 16dp under the time, the two centered beside the dial, 36dp before it, 556dp wide; and the input swapped in is the vertical one', async () => {
      await open(<Picker layout="horizontal" />)
      const panel = rect(container())
      expect([panel.width, panel.height]).toEqual([556, 24 + 16 + 20 + 256 + 24 + 48 + 24])
      const hour = rect(segment('hour'))
      const am = rect(period()!)
      expect([am.left - hour.left, am.top - hour.bottom, am.width, am.height]).toEqual([
        0, 16, 216, 38,
      ])
      const face = rect(dial())
      expect(face.left - rect(segment('minute')).right).toBe(36)
      // The time and the selector, 134dp together, centered on the dial's 256dp, as Compose's row.
      expect([hour.top - face.top, face.bottom - am.bottom]).toEqual([61, 61])
      await userEvent.click(button('Switch to text input mode'))
      await settle()
      expect([rect(container()).width, rect(container()).height]).toEqual([
        328,
        24 + 16 + 20 + 72 + 7 + 32 + 48 + 24,
      ])
    })

    it('keeps no room for a period selector left out: the time centered beside the dial, and nothing after the minute in input mode', async () => {
      await open(
        <Picker layout="horizontal">
          {({ displayMode, selection }: TimePickerRenderProps) => (
            <>
              <TimePickerHeader>
                <Heading slot="title">
                  {displayMode === 'picker' ? 'Select time' : 'Enter time'}
                </Heading>
              </TimePickerHeader>
              <TimePickerContent>
                <TimePickerInput hourLabel="Hour" minuteLabel="Minute" />
                <TimePickerDial
                  aria-label={selection === 'hour' ? 'Select hour' : 'Select minute'}
                />
              </TimePickerContent>
            </>
          )}
        </Picker>,
      )
      expect(period()).toBeNull()
      const face = rect(dial())
      const hour = rect(segment('hour'))
      expect([hour.top - face.top, face.bottom - hour.bottom]).toEqual([88, 88])
      await userEvent.click(button('Switch to text input mode'))
      await settle()
      // Nothing after the minute: the content ends with it, and the dialog, as wide as its actions,
      // is narrower than with a selector.
      const content = rect(dialog().querySelector('.time-picker-content')!)
      expect([content.width, content.right - rect(segment('minute')).right]).toEqual([216, 0])
      const actions = dialog().querySelector('.time-picker-actions')!
      expect(rect(container()).width).toBe(rect(actions).width)
      expect(rect(container()).width).toBeLessThan(328)
    })

    it('draws a 24-hour clock with 114dp boxes and no selector, as wide as the dial, the afternoon on the inner ring 69dp out', async () => {
      await open(<Picker hourCycle={24} initial={new Time(20, 0)} />)
      expect(rect(container()).width).toBe(24 + 256 + 24)
      expect(rect(segment('minute')).right - rect(segment('hour')).left).toBe(114 + 24 + 114)
      expect(rect(segment('hour')).width).toBe(114)
      expect(period()).toBeNull()
      const face = rect(dial())
      const [x, y] = at(240, 69)
      const twenty = rect(number('20 hours'))
      expect(twenty.left - face.left).toBeCloseTo(x - 24, 0)
      expect(twenty.top - face.top).toBeCloseTo(y - 24, 0)
      expect(style(hand()).rotate).toBe('240deg')
      expect(style(hand(), '::after').top).toBe('35px')
      const [ox, oy] = at(240, 101)
      expect(rect(number('8 hours')).left - face.left).toBeCloseTo(ox - 24, 0)
      expect(rect(number('8 hours')).top - face.top).toBeCloseTo(oy - 24, 0)
    })

    it('folds the dial’s width away in input mode on a 24-hour clock, so that the content ends with the minute, as a horizontal one’s does', async () => {
      await open(<Picker hourCycle={24} />)
      await userEvent.click(button('Switch to text input mode'))
      await settle()
      const content = rect(dialog().querySelector('.time-picker-content')!)
      expect([content.width, content.right - rect(segment('minute')).right]).toEqual([216, 0])
      expect(rect(container()).width).toBe(
        rect(dialog().querySelector('.time-picker-actions')!).width,
      )
    })
  })

  describe('pointer', () => {
    it('turns the hand to a number pressed on the default spatial spring, as Compose does, and passes the dial to the minutes 100ms later, the faces crossfading on the effects spring', async () => {
      await open(<Picker />)
      const [x, y] = at(270, 101)
      // The hand's turn, and the faces' crossfade 100ms after it, caught as they start, in the
      // page: the press's answer can come after either is over.
      const held = catchTransitions(dial(), () => true)
      await pressDial(x, y)
      expect(shown()).toBe('09:00')
      const turn = turning()!
      expect(turn).toBeDefined()
      expect(turn.effect!.getComputedTiming().duration).toBe(440)
      // The spring's easing, as the browser writes it back: its stops with their positions.
      const stops = (easing: string) =>
        easing.match(/[\d.]+(?=,|\)| \d)/g)!.map((stop) => parseFloat(stop))
      expect(stops(turn.effect!.getTiming().easing!)).toEqual(
        stops(
          style(document.documentElement).getPropertyValue(
            '--md-sys-motion-spring-default-spatial-easing',
          ),
        ),
      )
      expect(turning()).toBeDefined()
      await waitFor(() =>
        expect(
          within(dialog()).getByRole('radiogroup', { name: 'Select minute' }),
        ).toBeInTheDocument(),
      )
      const [hours, , minutes] = faces()
      expect(timing(hours!, 'opacity')).toEqual([0, 240])
      expect(timing(minutes!, 'opacity')).toEqual([0, 240])
      expect(hours).toHaveAttribute('inert')
      held.release()
      await settle()
      expect(angle()).toBe(0)
      expect([style(hours!).visibility, style(minutes!).visibility]).toEqual(['hidden', 'visible'])
    })

    it('snaps the hand to a number picked by the keys, and stays on the hours', async () => {
      await open(<Picker />)
      number('9 hours').focus()
      await userEvent.keyboard('{Enter}')
      expect(shown()).toBe('09:00')
      expect(style(hand()).rotate).toBe('270deg')
      expect(turning()).toBeUndefined()
      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(within(dialog()).getByRole('radiogroup', { name: 'Select hour' })).toBeInTheDocument()
    })

    it('turns the hand to the nearest hour pressed on the face, off the numbers, on the spring', async () => {
      await open(<Picker />)
      const [x, y] = at(80, 60)
      const held = catchTransitions(dial())
      await pressDial(x, y)
      expect(shown()).toBe('03:00')
      expect(turning()?.effect?.getComputedTiming().duration).toBe(440)
      held.release()
      // Then on to the minutes, 100ms later, as after a number.
      await settle()
      expect(
        within(dialog()).getByRole('radiogroup', { name: 'Select minute' }),
      ).toBeInTheDocument()
      expect(angle()).toBe(0)
    })

    it('rounds a press on the face to five minutes, and a number on the minutes to the minute', async () => {
      await open(<Picker defaultSelection="minute" />)
      await pressDial(...at(128, 60))
      expect(shown()).toBe('07:20')
      await settle()
      await pressDial(...at(90, 101))
      expect(shown()).toBe('07:15')
    })

    it('follows a drag with the hand, the hour at the nearest, and turns to it as the pointer lets go, passing to the minutes', async () => {
      await open(<Picker />)
      const [x0, y0] = at(210, 101)
      await commands.pointer('.time-picker-dial', x0, y0, 'down')
      const [x1, y1] = at(230, 101)
      await commands.pointer('.time-picker-dial', x1, y1)
      const [x2, y2] = at(250, 90)
      await commands.pointer('.time-picker-dial', x2, y2)
      expect(shown()).toBe('08:00')
      expect(angle()).toBeCloseTo(250, 0)
      expect(turning()).toBeUndefined()
      const held = catchTransitions(dial())
      await commands.pointer('.time-picker-dial', x2, y2, 'up')
      expect(
        within(dialog()).getByRole('radiogroup', { name: 'Select minute' }),
      ).toBeInTheDocument()
      expect(turning()).toBeDefined()
      held.release()
      await settle()
      expect(angle()).toBe(0)
      expect(shown()).toBe('08:00')
    })

    it('drops the move to the minutes an hour tapped has pending as a new drag starts within the 100ms, which stays on the hours', async () => {
      await open(<Picker />)
      // In the page, so that the tap and the drag come closer together than the 100ms, whatever
      // the load.
      act(() => {
        pointerOnDial('pointerdown', at(270, 101))
        pointerOnDial('pointerup', at(270, 101), { buttons: 0 })
        clickOnDial(at(270, 101))
        pointerOnDial('pointerdown', at(210, 101))
        pointerOnDial('pointermove', at(230, 101))
      })
      expect(shown()).toBe('08:00')
      // Past the 100ms, with what React has queued flushed, the dial is still on the hours.
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 150)))
      expect(within(dialog()).getByRole('radiogroup', { name: 'Select hour' })).toBeInTheDocument()
      act(() => pointerOnDial('pointermove', at(300, 101)))
      expect(shown()).toBe('10:00')
      act(() => {
        pointerOnDial('pointerup', at(300, 101), { buttons: 0 })
        clickOnDial(at(300, 101))
      })
      // Let go, the dial passes to the minutes at once, on a timer of its own.
      await waitFor(() =>
        expect(
          within(dialog()).getByRole('radiogroup', { name: 'Select minute' }),
        ).toBeInTheDocument(),
      )
      await settle()
    })

    it('keeps a drag that leaves the face and comes back, and lets the hand go as it ends', async () => {
      await open(<Picker />)
      await commands.pointer('.time-picker-dial', ...at(210, 101), 'down')
      await commands.pointer('.time-picker-dial', ...at(240, 101))
      expect(shown()).toBe('08:00')
      // Out over the header, back onto the face, and let go within the slop of the way back: the
      // drag goes on, so the hand is not left pinned where the pointer was.
      await commands.pointer('.time-picker-header', 10, 10)
      const [x, y] = at(270, 101)
      await commands.pointer('.time-picker-dial', x, y)
      await commands.pointer('.time-picker-dial', x + 2, y, 'up')
      expect(shown()).toBe('09:00')
      await waitFor(() =>
        expect(
          within(dialog()).getByRole('radiogroup', { name: 'Select minute' }),
        ).toBeInTheDocument(),
      )
      await settle()
      expect(angle()).toBe(0)
    })

    it('picks the ring of a 24-hour dial by how far from the center the pointer is', async () => {
      await open(<Picker hourCycle={24} initial={new Time(8, 0)} />)
      pressDialInPage(at(90, 60))
      expect(shown()).toBe('15:00')
      expect(style(hand(), '::after').top).toBe('35px')
      // Once the dial has passed to the minutes, back on the hours from the segment: a press on the
      // outer ring is the morning.
      await new Promise((resolve) => setTimeout(resolve, 150))
      await settle()
      await userEvent.click(segment('hour'))
      await pressDial(...at(90, 101))
      expect(shown()).toBe('03:00')
      expect(style(hand(), '::after').top).toBe('3px')
    })

    it('fills a segment cleared back as a press on the face picks its minute again', async () => {
      await open(<Picker defaultSelection="minute" />)
      field('minute').focus()
      await userEvent.keyboard('{Backspace}')
      expect(field('minute')).toHaveAttribute('data-placeholder')
      await pressDial(...at(0, 101))
      expect(field('minute')).not.toHaveAttribute('data-placeholder')
      expect(shown()).toBe('07:00')
    })

    it('turns the hand to a time typed, on the spring', async () => {
      await open(<Picker />)
      field('minute').focus()
      // Caught as it starts, in the page: the typing's answer can come after the turn is over. The
      // second digit turns it again, from where the first's turn is held.
      const held = catchTransitions(dial())
      await userEvent.keyboard('45')
      expect(shown()).toBe('07:45')
      expect(turning()?.effect?.getComputedTiming().duration).toBe(440)
      held.release()
      await settle()
      expect(angle()).toBe(270)
    })
  })

  describe('motion', () => {
    it('folds a horizontal picker in place: the dialog narrowing and shortening on one curve, and the period selector moving from under the time to after the minute, under the time as it passes', async () => {
      await open(<Picker layout="horizontal" />)
      // Swapped in the page, React flushed, so that what follows reads the swap as it starts,
      // whatever the load.
      act(() => button('Switch to text input mode').click())
      const swap = hold()
      // The dialog's height closes on the swap's curve as its width does, from 556dp by 412dp to
      // 328dp by 243dp, not ahead of it once the dial's pane is shorter than the time.
      for (const time of [50, 100, 150, 300]) {
        swap.at(time)
        const { width, height } = rect(container())
        expect((556 - width) / (556 - 328)).toBeCloseTo((412 - height) / (412 - 243), 2)
      }
      // The selector moves all the way, in sight: side by side under the time at first, over and
      // under past halfway, and under the minute's box where the two cross.
      swap.at(50)
      expect(rect(optionBox('PM')).top).toBe(rect(optionBox('AM')).top)
      expect(rect(period()!).top).toBeGreaterThan(rect(segment('hour')).bottom)
      swap.at(150)
      const minute = rect(segment('minute'))
      const selector = rect(period()!)
      expect(style(period()!).opacity).toBe('1')
      expect(selector.left).toBeGreaterThan(rect(segment('hour')).left)
      expect(selector.right).toBeGreaterThan(minute.right)
      const x = (Math.max(selector.left, minute.left) + Math.min(selector.right, minute.right)) / 2
      const y = (Math.max(selector.top, minute.top) + Math.min(selector.bottom, minute.bottom)) / 2
      expect(y).toBeLessThan(minute.bottom)
      expect(segment('minute').contains(document.elementFromPoint(x, y))).toBe(true)
      swap.at(300)
      expect(rect(optionBox('PM')).top).toBeGreaterThan(rect(optionBox('AM')).top)
      swap.release()
      await settle()
      expect([rect(container()).width, rect(container()).height]).toEqual([328, 243])
      expect(rect(period()!).left - rect(segment('minute')).right).toBe(12)
      expect(rect(period()!).top).toBe(rect(segment('hour')).top)
    })

    it('unfolds a horizontal picker with the period selector moving back under the time, which scrolls nothing: no scrollbar flashes', async () => {
      await open(<Picker layout="horizontal" displayMode="input" />)
      act(() => button('Switch to touch input mode').click())
      const picker = dialog().querySelector<HTMLElement>('.time-picker')!
      const swap = hold()
      for (let time = 0; time <= 700; time += 25) {
        swap.at(time)
        expect(picker.scrollHeight).toBe(picker.clientHeight)
        expect(picker.scrollWidth).toBe(picker.clientWidth)
      }
      swap.release()
      await settle()
      expect(rect(container()).width).toBe(556)
      expect(rect(period()!).left).toBe(rect(segment('hour')).left)
      expect(rect(period()!).top - rect(segment('hour')).bottom).toBe(16)
    })

    it('takes a new layout at once, as Compose does, and swaps the modes over time after it', async () => {
      const { rerender } = render(<Picker />)
      await userEvent.click(screen.getByRole('button', { name: 'Open' }))
      await settle()
      rerender(<Picker layout="horizontal" />)
      expect(document.getAnimations()).toEqual([])
      expect(rect(container()).width).toBe(556)
      expect(rect(period()!).top - rect(segment('hour')).bottom).toBe(16)
      rerender(<Picker />)
      expect(document.getAnimations()).toEqual([])
      expect(rect(container()).width).toBe(328)
      act(() => button('Switch to text input mode').click())
      expect(folding()?.effect?.getComputedTiming().duration).toBe(700)
    })

    it('takes a new clock at once, as Compose does, the dial’s numbers crossfading on the effects spring', async () => {
      const { rerender } = render(<Picker />)
      await userEvent.click(screen.getByRole('button', { name: 'Open' }))
      await settle()
      rerender(<Picker hourCycle={24} />)
      const [twelve, twentyFour] = faces()
      const running = document.getAnimations().map((it) => (it as CSSTransition).transitionProperty)
      expect(new Set(running)).toEqual(new Set(['opacity', 'visibility']))
      expect(timing(twelve!, 'opacity')).toEqual([0, 240])
      expect(timing(twentyFour!, 'opacity')).toEqual([0, 240])
      expect(twelve).toHaveAttribute('inert')
      expect(period()).toBeNull()
      expect(rect(container()).width).toBe(304)
      expect(rect(segment('hour')).width).toBe(114)
      await settle()
      expect([style(twelve!).visibility, style(twentyFour!).visibility]).toEqual([
        'hidden',
        'visible',
      ])
    })

    it('folds the dial away as the input swaps in, over 700ms on the emphasized path, as the toggle video does: the dial fading in 100ms where it stands, the digits and the labels’ room resizing with the dialog, and the title, the labels and the toggle’s icon fading through', async () => {
      await open(<Picker />)
      const tall = rect(container()).height
      const heading = () => within(dialog()).getByRole('heading')
      const labels = () => dialog().querySelector('.time-picker-input-labels')!
      // Swapped in the page, React flushed, so that what follows reads the swap as it starts,
      // whatever the load.
      act(() => button('Switch to text input mode').click())
      const fold = folding()!
      expect(fold).toBeDefined()
      expect(fold.effect!.getComputedTiming().duration).toBe(700)
      // The dial fades in 100ms at its size, lifting 12dp, shrinking only once it has gone.
      expect(timing(dial(), 'opacity')).toEqual([0, 100])
      expect(timing(dial(), 'translate')).toEqual([0, 100])
      expect(timing(dial(), 'scale')).toEqual([100, 700])
      // The digits' size and box, the separator's size and the labels' room follow the dialog.
      expect(timing(segment('hour'), 'font-size')).toEqual([0, 700])
      expect(timing(segment('hour'), 'height')).toEqual([0, 700])
      expect(timing(separator(), 'font-size')).toEqual([0, 700])
      expect(timing(labels(), 'height')).toEqual([0, 700])
      expect(timing(period()!, 'height')).toEqual([0, 700])
      // The title leaving fades out over 100ms; the labels and the toggle's clock fade in over the
      // 150ms after, as the keyboard fades out; then the next title fades in the same way.
      expect(heading()).toHaveTextContent('Select time')
      expect(timing(heading().parentElement!, 'opacity')).toEqual([0, 100])
      expect(timing(labels(), 'opacity')).toEqual([100, 150])
      const [keyboard, clock] = button('Switch to touch input mode').querySelectorAll(
        '.time-picker-mode-toggle-icons > *',
      )
      expect(timing(keyboard!, 'opacity')).toEqual([0, 100])
      expect(timing(clock!, 'opacity')).toEqual([100, 150])
      await waitFor(() => expect(heading()).toHaveTextContent('Enter time'))
      expect(timing(heading().parentElement!, 'opacity')).toEqual([0, 150])
      // Halfway through, the dialog is past three quarters of the way, as the video's curve goes.
      fold.pause()
      fold.currentTime = 350
      const short = rect(container()).height
      expect((tall - short) / (tall - 243)).toBeGreaterThan(0.75)
      fold.play()
      await settle()
      expect(rect(container()).height).toBe(243)
      expect([style(dial()).scale, style(dial()).translate]).toEqual(['0', '0px -12px'])
      expect(style(heading().parentElement!).opacity).toBe('1')
    })

    describe('with reduced motion', () => {
      useReducedMotion()

      it('swaps and turns at once', async () => {
        await open(<Picker />)
        for (const el of [dial(), pane(), segment('hour'), knockout()])
          for (const time of style(el).transitionDuration.split(', '))
            expect(parseFloat(time)).toBeLessThan(0.001)
        pressDialInPage(at(80, 60))
        expect(turning()?.effect?.getComputedTiming().duration ?? 0).toBeLessThan(1)
        await settle()
        expect(angle()).toBe(90)
        await new Promise((resolve) => setTimeout(resolve, 150))
        await settle()
        expect(angle()).toBe(0)
      })
    })
  })

  describe('in a right-to-left locale', () => {
    it('lays the dialog out right to left, the selector first, but the hour before the minute', async () => {
      await open(
        <I18nProvider locale="he-IL">
          <Picker hourCycle={12} />
        </I18nProvider>,
      )
      expect(container()).toHaveAttribute('dir', 'rtl')
      expect(rect(period()!).left).toBeLessThan(rect(segment('hour')).left)
      expect(rect(segment('hour')).left).toBeLessThan(rect(segment('minute')).left)
      expect(rect(button('Switch to text input mode')).left).toBeGreaterThan(
        rect(button('OK')).left,
      )
    })
  })

  describe('in forced colors', () => {
    useForcedColors()

    it('draws the hand in the highlight, the number under it in its text, the selection filled with it, and borders the dial', async () => {
      await open(<Picker />)
      expect(style(hand(), '::after').backgroundColor).toBe(
        computedColor('Highlight', document.body),
      )
      expect(style(cut('7')).color).toBe(computedColor('HighlightText', document.body))
      expect(style(segment('hour')).backgroundColor).toBe(computedColor('Highlight', document.body))
      expect(style(dial()).borderTopWidth).toBe('1px')
      expect(style(option('AM')).backgroundColor).toBe(computedColor('Highlight', document.body))
    })

    it('rings the selection in input mode in the highlight’s text, on its highlight fill', async () => {
      await open(<Picker displayMode="input" />)
      expect(style(segment('hour')).boxShadow).toContain(
        `${computedColor('HighlightText', document.body)} 0px 0px 0px 1px inset`,
      )
    })
  })
})
