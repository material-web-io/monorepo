import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react'
import { useLocale } from 'react-aria'
import {
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  GroupContext,
  TimeFieldStateContext,
  useSlottedContext,
  type DateInputProps,
} from 'react-aria-components'
import { tv } from '../../lib/tv'
import { PickerContext } from './context'
import type { TimePickerSelection } from './helpers'

/* The time, React Aria's DateInput: its hour and minute segments in the spec's time selectors over
 * the dial, and in input mode a text input in each, as Compose's TimeInput has text fields; the
 * literal between them the separator, its other parts hidden. Fixed classes: time-picker.css. */

// The box of the hour or the minute: with the keyboard focus ring over the dial, or Compose's text
// field in input mode, outlined while it is the selection; 114dp wide on a 24-hour vertical dial,
// and filled while it is the selection.
const box = tv({
  base: 'time-picker-input-segment',
  variants: {
    mode: { picker: 'time-picker-input-segment-picker', input: 'time-picker-input-segment-input' },
    selected: { true: 'time-picker-input-segment-selected', false: '' },
    wide: { true: 'time-picker-input-segment-wide', false: '' },
  },
  compoundVariants: [
    { mode: 'input', selected: true, class: 'time-picker-input-segment-input-selected' },
  ],
})

// The separator between them, in the digits' size.
const separator = tv({
  base: 'time-picker-input-separator',
  variants: { mode: { picker: '', input: 'time-picker-input-separator-input' } },
})

// The labels under the boxes, shown in input mode and folded away in picker mode.
const labels = tv({
  base: 'time-picker-input-labels',
  variants: { shown: { true: '', false: 'time-picker-input-labels-away' } },
})

export type TimePickerInputProps = {
  // The labels under the hour and the minute in input mode, the caller's text, as Compose's
  // supporting texts: the inputs' labels, where over the dial the segments are named by React
  // Aria in its locale.
  /**
   * A label below the field
   *
   * @see https://m3.material.io/components/time-pickers/guidelines
   */
  hourLabel?: ReactNode
  minuteLabel?: ReactNode
}

/** The Han numerals of `hanidec`, 〇 to 九, which Unicode counts no decimal digits. */
const hanidec = [...'〇一二三四五六七八九']

/** The value of a digit of any script, `٣` as 3, or NaN: Unicode runs each set of digits from zero
 * to nine, and where sets adjoin, as the mathematical digits' styles do, the place in the whole
 * run is taken by tens; a Han numeral's is its place in the table. */
const digit = (char: string) => {
  const han = hanidec.indexOf(char)
  if (han >= 0) return han
  if (!/^\p{Nd}$/u.test(char)) return NaN
  const point = char.codePointAt(0)!
  let start = point
  while (/^\p{Nd}$/u.test(String.fromCodePoint(start - 1))) start--
  return (point - start) % 10
}

/** The characters of a text: a digit beyond the first plane, as Adlam's, is two UTF-16 units. */
const count = (text: string) => [...text].length

/** The number a text of digits writes, or NaN. */
const numberOf = (text: string) =>
  [...text].reduce((sum, char) => sum * 10 + digit(char), text ? 0 : NaN)

type FieldProps = {
  type: TimePickerSelection
  id: string
  /** The segment's number and text, the field's state, which the dial and the period set too. */
  value: number | null
  text: string
  /** The segment's largest number: 59, and 11, 12 or 23 for the hour as the clock has it. */
  max: number
  is24Hour: boolean
  /** The locale's name of the field, for an input the caller gave no label. */
  'aria-label': string | undefined
  disabled: boolean
  readOnly: boolean
  /** The field's required and invalid states, told as React Aria's segments tell them. */
  required: boolean
  invalid: boolean
  /** The field's descriptions, its error among them, as React Aria's segments carry them. */
  'aria-describedby': string | undefined
  /** Sets the time's hour or minute. */
  commit: (value: number) => void
  onSelect: () => void
  /** Moves on to the minute, as the hour fills. */
  onAdvance: () => void
  ref: RefObject<HTMLInputElement | null>
}

/** A segment of the field, as React Aria's DateInput hands them to its children. */
type Part = Parameters<DateInputProps['children']>[0]

// The text input of the hour or the minute in input mode, as Compose's TimePickerTextField takes
// typing: digits only, two at most, a digit typed into a full field starting it over, and one that
// takes the number past the clock's refused, the text as it was; each number the text makes sets
// the time at once; the hour hands the focus to the minute once two digits make it, or one from 2
// to 9 on a 12-hour clock; cleared, it is midnight, or noon in the afternoon, and zero minutes.
// The time set by the dial or the period rewrites the text in the locale's digits, the caret before.
function Field({
  type,
  id,
  value,
  text,
  max,
  is24Hour,
  'aria-label': ariaLabel,
  disabled,
  readOnly,
  required,
  invalid,
  'aria-describedby': describedBy,
  commit,
  onSelect,
  onAdvance,
  ref,
}: FieldProps) {
  // What is typed, and the number it was typed against: the text is rewritten as the time is set
  // elsewhere, or held to its value by a controlled owner, or written anew by the locale, not as
  // the typing sets it.
  const [draft, setDraft] = useState({ text, value })
  const [given, setGiven] = useState({ text, value })
  const changed = given.text !== text || given.value !== value
  if (changed) setGiven({ text, value })
  if (draft.value !== value || (changed && given.value === value)) setDraft({ text, value })
  // Where the caret goes after a rewrite of the text, which the browser would put at its end.
  const caret = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (caret.current === null) return
    ref.current?.setSelectionRange(caret.current, caret.current)
    caret.current = null
  })
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    let next = input.value
    // A digit typed into a full field starts it over, as Compose's does: the character before the
    // caret, which follows what was typed, the text around it as it was; a paste, or any edit the
    // event does not name as typing, is taken whole, as is a text of more than one character typed.
    const { nativeEvent } = event
    const typing =
      nativeEvent instanceof InputEvent &&
      (nativeEvent.inputType === 'insertText'
        ? nativeEvent.data == null || count(nativeEvent.data) === 1
        : nativeEvent.inputType === 'insertCompositionText' ||
          nativeEvent.inputType === 'insertFromComposition')
    const end = input.selectionStart ?? next.length
    const char = [...next.slice(0, end)].at(-1) ?? ''
    const restart =
      typing &&
      count(draft.text) === 2 &&
      next.slice(0, end - char.length) + next.slice(end) === draft.text
    if (restart) next = char
    const typed = numberOf(next)
    // Refused, as Compose reverts it: no digit, more than two, or a number past the clock's; the
    // text is put back as it was, the caret where the typing began, or after a selection replaced.
    if (count(next) > 2 || (next !== '' && (Number.isNaN(typed) || typed > max))) {
      const at = Math.max(0, (input.selectionStart ?? 0) - (input.value.length - draft.text.length))
      input.value = draft.text
      input.setSelectionRange(at, at)
      return
    }
    if (restart) caret.current = next.length
    // Cleared, it is midnight, or noon in the afternoon, and zero minutes: 12 on a clock that counts
    // to 12, 24 on one that counts to 24, else 0, which is what 12 is on a 12-hour clock.
    const none = type === 'hour' && (max === 12 || max === 24) ? max : 0
    const committed = next === '' || typed === 0 ? none : typed
    commit(committed)
    setDraft({ text: next, value: committed })
    if (type === 'hour' && next !== '') {
      if (count(next) === 2 || (!is24Hour && typed >= 2 && typed <= 9)) onAdvance()
    }
  }
  // React Aria's DateInput takes a press anywhere on it for its segments, with the browser's own
  // focus prevented; the input keeps its presses, so a click focuses it and places the caret.
  const keep = (event: SyntheticEvent) => event.stopPropagation()
  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      enterKeyHint={type === 'hour' ? 'next' : 'done'}
      className="time-picker-input-field"
      aria-label={ariaLabel}
      value={draft.text}
      disabled={disabled}
      readOnly={readOnly}
      aria-required={required || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={onChange}
      onPointerDown={keep}
      onMouseDown={keep}
      onFocus={onSelect}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        // Enter in the hour moves on to the minute, as its enterKeyHint says, and submits no form.
        if (event.key === 'Enter' && type === 'hour') {
          event.preventDefault()
          onAdvance()
          return
        }
        // The arrow keys move the caret and Enter in the minute is the browser's, as in any input:
        // React Aria's group would move the focus between its segments on the arrows, and takes
        // Enter as a press, which holds it back except on a Mac.
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Enter')
          event.stopPropagation()
      }}
    />
  )
}

// A TimePicker's time: React Aria's DateInput, the hour and the minute each in its box, filled
// while it is the selection, which the focus sets; over the dial each is React Aria's segment,
// in input mode a text input, outlined, with the labels under them as Compose's text fields. The
// separator between. Typing and the arrow keys in the segments are React Aria's; the focus goes
// to the selection's input as the input mode swaps in, as Compose's does once composed.
/**
 * The input selector is a unique kind of text field input. It differs from
 * typical text field inputs in that it has:
 *
 * An added highlight to call attention to the selected field
 *
 * A larger shape, size, and font
 *
 * A label below the field
 *
 * The hour and minute fields have the text input role
 *
 * @see https://m3.material.io/components/time-pickers/guidelines
 * @see https://m3.material.io/components/time-pickers/accessibility
 */
export function TimePickerInput({ hourLabel, minuteLabel }: TimePickerInputProps) {
  const { displayMode, layout, selection, setSelection } = useContext(PickerContext)!
  const state = useContext(TimeFieldStateContext)!
  const { locale } = useLocale()
  // An input given no label is named as the locale calls the field, `hour` or `minute`, as React
  // Aria names its segments.
  const fieldNames = new Intl.DisplayNames(locale, { type: 'dateTimeField' })
  const nameOf = (type: TimePickerSelection, label: ReactNode) =>
    label == null ? fieldNames.of(type) : undefined
  const period = state.segments.find((part) => part.type === 'dayPeriod')
  const is24Hour = !period
  const hourAt = state.segments.findIndex((part) => part.type === 'hour')
  const minuteAt = state.segments.findIndex((part) => part.type === 'minute')
  // Described as the field is, its description and its error, on the hour, and on the minute too
  // while the field is invalid, as React Aria describes its segments: VoiceOver on iOS announces
  // no group. The field's props are React Aria's TimeField's, in its Group's context.
  const describedBy = useSlottedContext(GroupContext)?.['aria-describedby']
  const wide = is24Hour && displayMode === 'picker' && layout === 'vertical'
  const hourId = useId()
  const minuteId = useId()
  const hourInput = useRef<HTMLInputElement>(null)
  const minuteInput = useRef<HTMLInputElement>(null)
  // Swapped to the time input, the focus goes to the selection's input: not as the picker first
  // draws, nor as the dial swaps in.
  const drawn = useRef(displayMode)
  useEffect(() => {
    if (drawn.current === displayMode) return
    drawn.current = displayMode
    if (displayMode === 'input') (selection === 'hour' ? hourInput : minuteInput).current?.focus()
  }, [displayMode, selection])
  // A segment focused is the selection, by React Aria's `data-type` on it.
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const type = event.target.dataset.type
    if (type === 'hour' || type === 'minute') setSelection(type)
  }
  const render = (part: Part) => {
    if (part.type === 'hour' || part.type === 'minute') {
      const type = part.type
      return (
        <div className={box({ mode: displayMode, selected: selection === type, wide })}>
          {displayMode === 'input' ? (
            <Field
              ref={type === 'hour' ? hourInput : minuteInput}
              type={type}
              id={type === 'hour' ? hourId : minuteId}
              value={part.isPlaceholder ? null : (part.value ?? null)}
              text={part.isPlaceholder ? '' : part.text}
              max={part.maxValue ?? (type === 'minute' ? 59 : 23)}
              is24Hour={is24Hour}
              aria-label={nameOf(type, type === 'hour' ? hourLabel : minuteLabel)}
              disabled={state.isDisabled}
              readOnly={state.isReadOnly}
              required={state.isRequired}
              invalid={state.isInvalid}
              aria-describedby={type === 'hour' || state.isInvalid ? describedBy : undefined}
              commit={(value) => state.setSegment(type, value)}
              onSelect={() => setSelection(type)}
              onAdvance={() => minuteInput.current?.focus()}
            />
          ) : (
            <AriaDateSegment segment={part} className="time-picker-input-segment-text" />
          )}
        </div>
      )
    }
    // The literal between the hour and the minute, which every locale writes in that order, is the
    // separator; the direction marks around them, the day period with its space, and any other
    // words of the locale's pattern, as Dzongkha's, are hidden.
    const at = state.segments.indexOf(part)
    if (part.type === 'literal' && at > hourAt && at < minuteAt && /[^\p{Cf}\s]/u.test(part.text))
      return <AriaDateSegment segment={part} className={separator({ mode: displayMode })} />
    return <AriaDateSegment segment={part} className="time-picker-input-hidden" />
  }
  const input = displayMode === 'input'
  return (
    <div className="time-picker-input" onFocus={onFocus}>
      <AriaDateInput className="time-picker-input-time">{render}</AriaDateInput>
      <div aria-hidden={!input || undefined} className={labels({ shown: input })}>
        <label htmlFor={hourId}>{hourLabel}</label>
        <span />
        <label htmlFor={minuteId}>{minuteLabel}</label>
      </div>
    </div>
  )
}
