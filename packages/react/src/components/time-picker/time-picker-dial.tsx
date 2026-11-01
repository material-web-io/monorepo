import {
  fromDate,
  getLocalTimeZone,
  toCalendarDateTime,
  today,
  toTime,
} from '@internationalized/date'
import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from 'react'
import { mergeProps, useMove, useNumberFormatter, usePress } from 'react-aria'
import {
  ToggleButtonGroup as AriaToggleButtonGroup,
  TimeFieldStateContext,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps,
} from 'react-aria-components'
import { ToggleButton } from '../../lib/button'
import { tv, twMerge } from '../../lib/tv'
import { PickerContext } from './context'
import { angleOf, dial, nearest, turnTo } from './helpers'
import type { TimePickerSelection } from './helpers'

/* Compose's ClockFace: the face, which takes the pointer, a press or a drag, anywhere on it; its
 * two faces of numbers, the hours' and the minutes', each React Aria's ToggleButtonGroup, a radio
 * group for the keyboard, crossfaded; and the hand, turned to the time on the default spatial
 * spring. Fixed classes: time-picker.css. */

// The dial's room in the content: 36dp under the time on a vertical dial, 36dp beside it on a
// horizontal one, folded away in input mode.
const pane = tv({
  base: 'time-picker-dial-pane',
  variants: {
    layout: {
      vertical: 'time-picker-dial-pane-vertical',
      horizontal: 'time-picker-dial-pane-horizontal',
    },
    away: { true: '', false: '' },
  },
  compoundVariants: [
    { layout: 'vertical', away: true, class: 'time-picker-dial-pane-away-vertical' },
    { layout: 'horizontal', away: true, class: 'time-picker-dial-pane-away-horizontal' },
  ],
})

// The face: faded and shrunk as its pane folds away; its hand snapped, under a drag or by the
// keys, or turned on the spring; on the inner ring, for a 24-hour dial's afternoon.
const face = tv({
  base: 'time-picker-dial',
  variants: {
    away: { true: 'time-picker-dial-away', false: '' },
    snap: { true: 'time-picker-dial-snap', false: '' },
    inner: { true: 'time-picker-dial-inner', false: '' },
  },
})

// A face of numbers, the hours' or the minutes': the selection's shown, the other faded away.
const numbers = tv({
  base: 'time-picker-dial-face',
  variants: { away: { true: 'time-picker-dial-face-away', false: '' } },
})

// A number on the outer ring or, for a 24-hour dial's afternoon hours, the inner one.
const number = tv({
  base: 'time-picker-dial-number',
  variants: { inner: { true: 'time-picker-dial-number-inner', false: '' } },
})

// Custom properties, which React's CSSProperties does not list.
const vars = (values: Record<`--${string}`, string | number>) => values as CSSProperties

// The name of the group of numbers, by `aria-label` or `aria-labelledby`, and the `className` and
// `style` of the dial's `<div>`.
export type TimePickerDialProps = Pick<
  AriaToggleButtonGroupProps,
  'aria-label' | 'aria-labelledby'
> &
  Pick<ComponentProps<'div'>, 'className' | 'style'>

/** A number of a face: its value, its place on its ring, of twelve from 12 o'clock, and the ring. */
type Face = { value: number; index: number; inner: boolean }[]

const hours12: Face = Array.from({ length: 12 }, (_, i) => ({
  value: i === 0 ? 12 : i,
  index: i,
  inner: false,
}))
/** The 12-hour face where the locale counts the hours from 0, as Japanese does: 0 at the top. */
const hours11: Face = hours12.map((item) => (item.index === 0 ? { ...item, value: 0 } : item))
const hours24: Face = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  index: i % 12,
  inner: i >= 12,
}))
const minutes: Face = Array.from({ length: 12 }, (_, i) => ({
  value: i * 5,
  index: i,
  inner: false,
}))

// A press and a drag on the face: Android's touch slop, in CSS pixels, within which a move is none.
const slop = 8

// A TimePicker's dial, as Compose draws it: the hours, or the minutes once an hour is picked, on
// the face, each on its ring, 0 to 11 outside and 12 to 23 inside on a 24-hour clock; the hand
// on the time. A press anywhere on the face, on a number or off it, turns the hand to the nearest
// hour or five minutes on the spring, and a drag turns it to the minute, picking the ring by how
// far from the center it is; the keys move along the numbers and Enter or Space snaps to one. An
// hour picked by the pointer passes the dial to the minutes, as Compose does, the faces
// crossfading. A press on the face takes the focus, as Compose clears it from the time's fields.
// Drawn in picker mode; folded away in input mode.
/**
 * Dial selectors always mimic a round watch face. Hours and minutes can be
 * selected by tapping a number or dragging the dial selector track.
 *
 * When representing a 12-hour dial, all numbers appear in the outer ring.
 *
 * Targets for dial selectors should be 48x48dp.
 *
 * The dial selector will read a selection of total hours, such as Hour 7 of 12.
 *
 * @see https://m3.material.io/components/time-pickers/guidelines
 * @see https://m3.material.io/components/time-pickers/accessibility
 */
export function TimePickerDial({ className, style, ...labels }: TimePickerDialProps) {
  const state = useContext(TimeFieldStateContext)!
  const { displayMode, layout, selection, setSelection, placeholderValue } =
    useContext(PickerContext)!
  const segment = (type: 'hour' | 'minute' | 'dayPeriod') =>
    state.segments.find((part) => part.type === type)
  const period = segment('dayPeriod')
  const is24Hour = !period
  // The top number of a 12-hour face: 12, or 0 where the locale counts the hours from 0, as
  // Japanese does, which the field's hour segment has as its least.
  const top = segment('hour')?.minValue === 0 ? 0 : 12
  const disabled = state.isDisabled || state.isReadOnly
  const away = displayMode === 'input'
  // The time the dial shows, whole, as Compose's state always holds one: the field's segments as
  // React Aria displays them, its date value, a Date in the zone its formatter resolves, with the
  // minute unset the time's, or the placeholder's with no time; but with the hour unset it holds
  // 0 or 12, so that one is the time held, or the placeholder's, in the period shown.
  const shown = toTime(fromDate(state.dateValue, state.dateFormatter.resolvedOptions().timeZone))
  const held = state.timeValue ?? placeholderValue
  const pm = period ? (period.value ?? (held.hour >= 12 ? 1 : 0)) === 1 : held.hour >= 12
  const time = segment('hour')?.isPlaceholder
    ? shown.set({ hour: (held.hour % 12) + (pm ? 12 : 0) })
    : shown
  const { hour, minute } = time
  const inner = is24Hour && selection === 'hour' && hour >= 12
  const target = selection === 'hour' ? (hour % 12) * 30 : minute * 6

  // The hand's angle, past the turns it has made, so that a change turns it the short way round;
  // on the time, unless a drag holds it on the pointer. Snapped there, or turned on the spring.
  const [angle, setAngle] = useState(target)
  const [dragging, setDragging] = useState(false)
  const [snap, setSnap] = useState(false)
  const turned = dragging ? angle : turnTo(angle, target)
  if (turned !== angle) {
    setAngle(turned)
    if (snap) setSnap(false)
  }

  // The move to the minutes an hour picked by the pointer makes, 100ms after a press, at once after
  // a drag; dropped if the selection is set meanwhile.
  const later = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(later.current), [])
  useEffect(() => clearTimeout(later.current), [selection])
  const toMinutes = (delay: number) => {
    if (selection !== 'hour') return
    clearTimeout(later.current)
    later.current = setTimeout(() => setSelection('minute'), delay)
  }

  const face$ = useRef<HTMLDivElement>(null)
  /** Sets the time's hour or minute through the field, the rest as shown: a segment typed while
   * another is cleared, which React Aria holds over the time until the whole is set, is kept. */
  const commit = (fields: { hour?: number; minute?: number }) => {
    const next = time.set(fields)
    // Nothing to set, unless a segment cleared is to be filled back.
    const cleared = segment('hour')?.isPlaceholder || segment('minute')?.isPlaceholder
    if (next.compare(time) === 0 && state.timeValue && !cleared) return
    const dateTime = state.value && 'hour' in state.value ? state.value : null
    state.setValue(
      dateTime
        ? dateTime.set({ hour: next.hour, minute: next.minute })
        : 'day' in placeholderValue
          ? placeholderValue.set({ hour: next.hour, minute: next.minute })
          : toCalendarDateTime(today(getLocalTimeZone()), next),
    )
  }
  /** The hour an angle and a distance from the center pick: on a 24-hour clock, the inner ring's
   * past 11; on a 12-hour one, in the period the time is in. */
  const hourAt = (angle: number, distance: number) => {
    const n = nearest(angle)
    if (is24Hour) return distance < dial.boundary * scale() ? n + 12 : n
    return n + (hour >= 12 ? 12 : 0)
  }
  /** How large the face is drawn against the 256dp it is laid out at. */
  const scale = () => (face$.current?.getBoundingClientRect().width ?? dial.size) / dial.size

  // The pointer's place on the face as it came down, kept up through a drag, and whether it has
  // dragged, past the slop: a press that has is no press.
  const down = useRef({ x: 0, y: 0 })
  const at = useRef({ x: 0, y: 0 })
  const dragged = useRef(false)
  /** A press on the face: the hand turns to the nearest hour, or five minutes, on the spring. */
  const press = (x: number, y: number) => {
    const s = scale()
    const dx = x - (dial.size / 2) * s
    const dy = y - (dial.size / 2) * s
    const angle = angleOf(dx, dy)
    setSnap(false)
    if (selection === 'hour') {
      commit({ hour: hourAt(angle, Math.hypot(dx, dy)) })
      toMinutes(100)
    } else {
      commit({ minute: (nearest(angle) * 5) % 60 })
    }
  }
  /** A drag on the face: the hand on the pointer, the time at the nearest hour or minute. */
  const drag = (x: number, y: number) => {
    const s = scale()
    const dx = x - (dial.size / 2) * s
    const dy = y - (dial.size / 2) * s
    const angle = angleOf(dx, dy)
    setAngle(angle)
    if (selection === 'hour') commit({ hour: hourAt(angle, Math.hypot(dx, dy)) })
    else commit({ minute: Math.round(angle / 6) % 60 })
  }
  // Whether the pointer has moved since it came down: a held pointer that leaves the face and comes
  // back starts a press again, which must not start the gesture over mid-drag.
  const moving = useRef(false)
  const { pressProps } = usePress({
    isDisabled: disabled,
    onPressStart: (event) => {
      if (!moving.current) {
        dragged.current = false
        down.current = { x: event.x, y: event.y }
        at.current = down.current
        // A tap just before may still have its move to the minutes pending: a new gesture drops it.
        clearTimeout(later.current)
      }
      // The pointer's press takes the focus from a segment, as Compose clears it on the dial.
      if (event.pointerType !== 'keyboard' && event.pointerType !== 'virtual') {
        face$.current?.focus({ preventScroll: true })
      }
    },
    onPress: (event) => {
      if (dragged.current || event.pointerType === 'keyboard' || event.pointerType === 'virtual') {
        return
      }
      // Where the pointer came down, or last was: the click a long press ends in, which React
      // Aria raises itself where the browser raises none, reports no place.
      press(at.current.x, at.current.y)
    },
  })
  // The arrow keys are the numbers' alone: useMove would take them as moves of the face.
  const { moveProps } = useMove({
    onMoveStart: () => {
      moving.current = true
      // A drag starting while React Aria still waits for the last tap's click, as a second finger
      // may, has no press start of its own: it drops the pending move here.
      clearTimeout(later.current)
    },
    onMove: (event) => {
      if (disabled || event.pointerType === 'keyboard') return
      at.current = { x: at.current.x + event.deltaX, y: at.current.y + event.deltaY }
      if (!dragged.current) {
        if (Math.hypot(at.current.x - down.current.x, at.current.y - down.current.y) < slop) return
        dragged.current = true
        setDragging(true)
        setSnap(true)
      }
      drag(at.current.x, at.current.y)
    },
    onMoveEnd: (event) => {
      moving.current = false
      if (!dragged.current || event.pointerType === 'keyboard') return
      setDragging(false)
      setSnap(false)
      toMinutes(0)
    },
  })

  /** A number picked by the keys, the selected one too, from the press itself rather than the
   * selection, which it may leave as it is: the hand snaps to it, and the dial stays on the hours. */
  const pick = (of: TimePickerSelection, key: number) => {
    setSnap(true)
    setAngle(turnTo(angle, of === 'hour' ? (key % 12) * 30 : key * 6))
    if (of === 'hour') commit({ hour: is24Hour ? key : (key % 12) + (hour >= 12 ? 12 : 0) })
    else commit({ minute: key })
  }
  // The numbers as the locale writes them, zero as 00, and as it names them, `7 hours`.
  const digits = useNumberFormatter()
  const twoDigits = useNumberFormatter({ minimumIntegerDigits: 2 })
  const hourNames = useNumberFormatter({ style: 'unit', unit: 'hour', unitDisplay: 'long' })
  const minuteNames = useNumberFormatter({ style: 'unit', unit: 'minute', unitDisplay: 'long' })
  const text = (value: number) => (value === 0 ? twoDigits.format(0) : digits.format(value))

  // The faces, the hours' of a 12-hour clock and of a 24-hour one and the minutes', the one on the
  // time selected on each; the selection's on the clock shown, the others faded away and out of
  // reach, so that a change of either crossfades them, as Compose's ClockFace does.
  const faces = [
    {
      key: 'hours12',
      of: 'hour' as const,
      clock: !is24Hour,
      items: top === 0 ? hours11 : hours12,
      selected: hour % 12 || top,
      name: hourNames,
    },
    {
      key: 'hours24',
      of: 'hour' as const,
      clock: is24Hour,
      items: hours24,
      selected: hour,
      name: hourNames,
    },
    {
      key: 'minutes',
      of: 'minute' as const,
      clock: true,
      items: minutes,
      selected: minute,
      name: minuteNames,
    },
  ]

  return (
    <div inert={away} className={twMerge(pane({ layout, away }), className)} style={style}>
      <div
        ref={face$}
        {...mergeProps(pressProps, moveProps)}
        tabIndex={-1}
        className={face({ away, snap, inner })}
        style={vars({ '--time-picker-dial-angle': `${angle}deg` })}
      >
        <span className="time-picker-dial-hand" />
        <span className="time-picker-dial-center" />
        {faces.map(({ key, of, clock, items, selected, name }) => {
          const hidden = of !== selection || !clock
          return (
            <div
              key={key}
              inert={hidden}
              aria-hidden={hidden || undefined}
              className={numbers({ away: hidden })}
            >
              <AriaToggleButtonGroup
                {...labels}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={[selected]}
                isDisabled={disabled}
                className="time-picker-dial-numbers"
              >
                {items.map((item) => (
                  <ToggleButton
                    key={item.value}
                    id={item.value}
                    onPress={() => pick(of, item.value)}
                    aria-label={name.format(item.value)}
                    className={number({ inner: item.inner })}
                    style={vars({ '--time-picker-dial-index': item.index })}
                  >
                    {text(item.value)}
                  </ToggleButton>
                ))}
              </AriaToggleButtonGroup>
              {/* The number under the handle, on-primary: a copy of the numbers cut to the handle. */}
              <span aria-hidden className="time-picker-dial-selected">
                {items.map((item) => (
                  <span
                    key={item.value}
                    className={number({ inner: item.inner })}
                    style={vars({ '--time-picker-dial-index': item.index })}
                  >
                    {text(item.value)}
                  </span>
                ))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
