import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { mergeRefs, type AriaTextFieldOptions } from 'react-aria'
import {
  ButtonContext,
  FieldError as AriaFieldError,
  Group as AriaGroup,
  Input as AriaInput,
  Label as AriaLabel,
  Text as AriaText,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  composeRenderProps,
  type GroupProps as AriaGroupProps,
  type GroupRenderProps,
  type InputProps as AriaInputProps,
  type TextAreaProps as AriaTextAreaProps,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components'
import type { Except, RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'

/* The text field, React Aria's TextField: a column of the container and, below it, the
 * supporting text and counter. Top-aligned, so that the line it is on is no taller than it is. */
const root = tv({ base: 'inline-flex min-w-0 flex-col text-start align-top font-plain' })

/* The container, React Aria's Group, 56dp of the control's line and the space around it, 16dp
 * in from its ends: the named group whose hover is the field's, which reports it and the focus
 * in it. Its fill and state layer are behind its content (isolate, z-behind). */
const container = tv({
  base: 'group/md-text-field relative isolate flex min-w-0 cursor-text px-space-200 in-disabled:cursor-default',
  variants: { variant: { filled: 'rounded-t-shape-xs', outlined: 'rounded-shape-xs' } },
})

/* What the parts share: the error color, with the hover and focus the spec gives it, the color
 * of a disabled part's text, and the space above and below the input's line, under a filled
 * field's label or in the container's middle. */
const errorText =
  'text-error group-hover/md-text-field:text-on-error-container peer-focus/md-text-field:text-error'

const disabledText =
  'peer-disabled/md-text-field:text-on-surface/disabled-content peer-disabled/md-text-field:forced-colors:text-gray-text'

const lineSpace = {
  label: 'pt-space-300-variable pb-space-100-variable',
  middle: 'py-space-200-variable',
}

/* The control, React Aria's Input or TextArea, or what `input` draws: the peer every other part
 * of the container comes after and reads the focus, text and disabled state of. An input's space
 * is its own padding, so a click in it lands on it; a textarea's is a margin its text scrolls in. */
const control = tv({
  base: [
    'peer/md-text-field order-3 m-0 block min-w-0 flex-1 appearance-none search-decoration-none rounded-none border-0 bg-transparent p-0 font-plain text-body-lg text-on-surface outline-none',
    'placeholder:text-on-surface-variant placeholder:transition-text-field',
    'disabled:cursor-default disabled:text-on-surface/disabled-content disabled:opacity-100 disabled:forced-colors:text-gray-text',
  ],
  variants: {
    lines: {
      single: 'box-content h-6',
      multi: 'resize-none overflow-hidden',
      area: 'resize-none',
    },
    space: { label: '', middle: '' },
    // A resting label is in the placeholder's place, so that shows once the label has left.
    labelled: {
      true: 'placeholder:text-transparent focus:placeholder:text-on-surface-variant',
      false: 'disabled:placeholder:text-on-surface/disabled-content',
    },
    invalid: { true: 'caret-error', false: 'caret-primary' },
  },
  compoundVariants: [
    { lines: 'single', space: 'label', class: lineSpace.label },
    { lines: 'single', space: 'middle', class: lineSpace.middle },
    {
      lines: ['multi', 'area'],
      space: 'label',
      class: 'mt-space-300-variable mb-space-100-variable',
    },
    { lines: ['multi', 'area'], space: 'middle', class: 'my-space-200-variable' },
  ],
})

/* The label, React Aria's Label: it rests on the input's line in its type style, 16dp from the
 * container's ends, or past the icon box at an end that holds an icon, which it comes after and
 * reads as a peer. Once the control is focused or populated it sits small at the top of a
 * filled container or on an outlined one's outline, 16dp from its start whatever leads the
 * input, as the measurements draw it. At rest, over the input's line, it lets the pointer through
 * to the input, where a click belongs; raised, it takes a click as any label does, focusing the
 * control, which reaches the half of an outlined field's raised label above the container. */
const floatingLabel = tv({
  base: [
    'pointer-events-none absolute start-space-200 end-space-200 top-space-200-variable truncate text-body-lg transition-text-field select-none',
    'peer-focus/md-text-field:pointer-events-auto peer-populated/md-text-field:pointer-events-auto',
    'cursor-text in-disabled:cursor-default',
    'peer-not-empty/md-text-field-leading:start-text-field-icon peer-not-empty/md-text-field-trailing:end-text-field-icon',
    'peer-focus/md-text-field:text-body-sm peer-populated/md-text-field:text-body-sm',
    disabledText,
  ],
  variants: {
    variant: {
      filled:
        'peer-focus/md-text-field:top-space-100-variable peer-populated/md-text-field:top-space-100-variable',
      outlined: [
        'peer-focus/md-text-field:-top-2 peer-populated/md-text-field:-top-2',
        'peer-focus/md-text-field:start-space-200 peer-populated/md-text-field:start-space-200',
      ],
    },
    invalid: {
      false: 'text-on-surface-variant peer-focus/md-text-field:text-primary',
      true: errorText,
    },
  },
  compoundVariants: [
    // Only an outlined field's label darkens with its outline on hover.
    { variant: 'outlined', invalid: false, class: 'group-hover/md-text-field:text-on-surface' },
  ],
})

/* A filled field's container color, on-surface at 4% when disabled, and over it the hover
 * state layer; forced colors, which drop both, outline the container instead. */
const fill = [
  'pointer-events-none absolute inset-0 z-behind rounded-inherit bg-surface-container-highest',
  'peer-disabled/md-text-field:bg-on-surface/4',
  'forced-colors:outline forced-colors:-outline-offset-1 forced-colors:outline-canvas-text',
  'peer-disabled/md-text-field:forced-colors:outline-gray-text',
].join(' ')

const stateLayer = [
  'pointer-events-none absolute inset-0 z-behind rounded-inherit bg-on-surface opacity-0 transition-text-field',
  'group-hover/md-text-field:opacity-state-hover peer-disabled/md-text-field:opacity-0',
].join(' ')

/* A filled field's active indicator, drawn in its text color like the outline: 1dp, and 3dp
 * while focused, which the spec's diagrams and its thickness token have where its height
 * token says 2dp. */
const indicator = tv({
  base: [
    'pointer-events-none absolute inset-x-0 bottom-0 border-b border-current transition-text-field',
    'peer-focus/md-text-field:border-b-3',
    'peer-disabled/md-text-field:text-on-surface/disabled-content',
    'peer-focus/md-text-field:forced-colors:text-highlight peer-disabled/md-text-field:forced-colors:text-gray-text',
  ],
  variants: {
    invalid: {
      false:
        'text-on-surface-variant group-hover/md-text-field:text-on-surface peer-focus/md-text-field:text-primary',
      true: errorText,
    },
  },
})

/* An outlined field's outline. Its text color is its parts' border color, and it tells them,
 * its children, what only a sibling of the control can read (text-field.css): to be 3dp
 * while focused, and to open the notch while the label is on the outline. */
const outline = tv({
  base: [
    'pointer-events-none absolute inset-0 flex transition-text-field',
    'peer-focus/md-text-field:field-outline-thick',
    'peer-focus/md-text-field:field-notch-open peer-populated/md-text-field:field-notch-open',
    'peer-disabled/md-text-field:text-on-surface/disabled-container',
    'peer-focus/md-text-field:forced-colors:text-highlight peer-disabled/md-text-field:forced-colors:text-gray-text',
  ],
  variants: {
    invalid: {
      false:
        'text-outline group-hover/md-text-field:text-on-surface peer-focus/md-text-field:text-primary',
      true: errorText,
    },
  },
})

/* What holds an icon: a 24dp box, the Icon in it 24dp too, 12dp from the container's edge, 4dp
 * into its padding, and 16dp from the text, that an icon button is centered on and reaches out
 * of. Shown while it holds something, and a peer the label reads. A trailing icon takes the
 * error color. */
const icon = tv({
  base: [
    'hidden size-6 shrink-0 items-center justify-center self-center transition-text-field icon-24 not-empty:flex',
    disabledText,
  ],
  variants: {
    side: {
      leading: 'peer/md-text-field-leading order-1 -ms-space-50 me-space-200',
      trailing: 'peer/md-text-field-trailing order-5 ms-space-200 -me-space-50',
    },
    invalid: { false: 'text-on-surface-variant', true: errorText },
  },
})

/* A prefix or suffix, on the input's line and in its type style, 2dp from its text as in
 * Material Web, shown while it holds something. With a label, it shows once the label has left
 * that line: with the control focused or populated. */
const affix = tv({
  base: [
    'hidden shrink-0 text-body-lg whitespace-nowrap text-on-surface-variant transition-text-field select-none not-empty:block',
    disabledText,
  ],
  variants: {
    side: { prefix: 'order-2 pe-space-25', suffix: 'order-4 ps-space-25' },
    space: lineSpace,
    labelled: {
      true: 'opacity-0 peer-focus/md-text-field:opacity-100 peer-populated/md-text-field:opacity-100',
      false: '',
    },
  },
})

/* Below the container, 4dp from it and 16dp in from its ends, while it holds something: the
 * supporting text, React Aria's Text in its `description` slot, or in its place the error text,
 * React Aria's FieldError, and 16dp after it the character counter, which describes the control
 * by an id of its own, so that it stays out of the alert the error text is. */
const supportingRow = 'hidden gap-space-200 px-space-200 pt-space-50 not-empty:flex'

const supportingText = tv({
  base: 'm-0 text-body-sm in-disabled:text-on-surface/disabled-content in-disabled:forced-colors:text-gray-text',
  variants: {
    part: { text: 'min-w-0 flex-1', counter: 'ms-auto shrink-0 whitespace-nowrap' },
    invalid: { true: 'text-error', false: 'text-on-surface-variant' },
  },
})

// The input types that show a placeholder. The others (date, time, ...) show a format of
// their own while empty, so their label never rests on the input's line.
const hinted = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number'])

// What a click in the container must not be taken from: a control of its own, such as a
// trailing icon button.
const interactive = 'a[href], button, input, textarea, select, [tabindex]'

type Control = HTMLInputElement | HTMLTextAreaElement

// Fits a multi-line field's textarea to its text.
function fit(el: Control) {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// What a text field passes its `leading` and `trailing`, given as a function: the state
// React Aria reports of its Group, the container: `isHovered`, `isFocusWithin`, which is the
// control's focus, `isFocusVisible`, `isDisabled` and `isInvalid`.
export type TextFieldRenderProps = GroupRenderProps

// The props `TextField` adds to those of React Aria's TextField. The comments on them quote
// the M3 text field pages, which each comment lists under @see; they add no wording of our own.
type TextFieldBaseProps = {
  /**
   * There are two variants of text fields:
   *
   * - Filled text fields
   * - Outlined text fields
   *
   * Both variants of text fields use a container to provide a visual cue for
   * interaction and provide the same functionality.
   *
   * Outlined text fields have less visual emphasis than filled text fields.
   * When they appear in places like forms (where many text fields are placed
   * together), their reduced emphasis helps simplify the layout.
   *
   * If both variants of text field are used in a UI, they should be used
   * consistently within different sections, and not intermixed within the same
   * region.
   *
   * @default 'filled'
   * @see https://m3.material.io/components/text-fields/guidelines
   */
  variant?: 'filled' | 'outlined'

  // The label text, drawn in the container by React Aria's Label, which names the control: on
  // the input's line until the control is focused or holds text. `isRequired` ends it with an
  // asterisk. With none, name the control with `aria-label`.
  /**
   * Label text tells people what information is requested. Every text field
   * should have a label.
   *
   * Label text should be aligned with the input text, and always visible. It
   * can be placed in the middle of a text field, or rest near the top of the
   * container.
   *
   * Label text shouldn't be truncated or take up multiple lines. Keep it short,
   * clear, and fully visible.
   *
   * A text field doesn't require a label if the field's purpose is indicated by
   * a separate, adjacent label.
   *
   * If a text field requires input, indicate so with an asterisk at the end of
   * the text field label. The accessibility label must include the asterisk.
   *
   * @see https://m3.material.io/components/text-fields/guidelines
   */
  label?: ReactNode

  // The supporting text, under the container, React Aria's Text in the `description` slot, by
  // which the control is described. While the field is invalid, React Aria's validation messages
  // take its place as the error text, an alert; with none, it is the error text itself.
  /**
   * Supporting text conveys additional information about the input field, such
   * as how it will be used. It should ideally be one line, though may wrap to
   * multiple lines if required. It can be either persistently visible or visible
   * only on focus.
   *
   * For text fields that validate their content such as passwords, replace
   * supporting text with error text. Swapping supporting text with error text
   * prevents new lines of text from bumping content and changing the layout.
   *
   * When there is an error, "alert" is applied to the role and the error message
   * to the text label.
   *
   * @see https://m3.material.io/components/text-fields/guidelines
   */
  description?: ReactNode

  // Said before the counter's numbers by a screen reader. The counter is drawn when the
  // control has a `maxLength`.
  /**
   * The accessibility label for the character counter clarifies the number of
   * characters that can be entered into the text field.
   *
   * The remaining character counter should be called “character count” within
   * the label
   *
   * @default 'Character count'
   * @see https://m3.material.io/components/text-fields/accessibility
   */
  counterLabel?: string

  // The leading icon: an icon, icon button or 24dp image, in a 24dp box at the field's start;
  // or a function of the state (`TextFieldRenderProps`) that returns it.
  /**
   * Leading icon (optional)
   *
   * Icons in text fields are optional. Text field icons can:
   *
   * - Describe valid input methods such as a microphone icon
   * - Provide affordances to access additional functionality such as clearing
   *   the content of a field
   * - Express an error
   *
   * Leading and trailing icons change their position based on LTR or RTL
   * contexts.
   *
   * Icon signifiers can describe the type of input a text field requires, and
   * be touch targets for nested components. For example, a calendar icon may be
   * tapped to reveal a date picker.
   *
   * @see https://m3.material.io/components/text-fields/specs
   * @see https://m3.material.io/components/text-fields/guidelines
   */
  leading?: AriaGroupProps['children']

  // The trailing icon, at the field's end, in the error color while the field is `invalid`; one
  // that is not a button takes an `aria-label`, such as `Error`. Or a function of the state too.
  /**
   * Trailing icon (optional)
   *
   * It’s strongly recommended to show an error icon when the text field is in
   * the error state.
   *
   * This highlights the error for people with visual impairments, and provides
   * an additional sensory indicator.
   *
   * Clear icons let a person clear an entire input field. They appear only when
   * input text is present.
   *
   * A dropdown arrow indicates that a text field has a nested selection
   * component.
   *
   * Images that are 24dp in height can be placed inside of text fields. This
   * image height allows for optimal top and bottom padding within the field and
   * is consistent with icon size recommendations.
   *
   * For text fields with interactive trailing icons, the accessibility label
   * clarifies its function.
   *
   * When an icon has no actionable role, like an error icon, the label is
   * "Error."
   *
   * @see https://m3.material.io/components/text-fields/specs
   * @see https://m3.material.io/components/text-fields/guidelines
   * @see https://m3.material.io/components/text-fields/accessibility
   */
  trailing?: AriaGroupProps['children']

  // The prefix: text before the input text, on its line and in its type style, shown once the
  // label has left the line; or a function of the state that returns it.
  /**
   * Text fields can contain prefix text such as currency symbol.
   *
   * The prefix and suffix of a text field provides symbols and abbreviations to
   * help users enter the correct values.
   *
   * @see https://m3.material.io/components/text-fields/specs
   * @see https://m3.material.io/components/text-fields/guidelines
   */
  prefix?: AriaGroupProps['children']

  // The suffix: text after the input text, at the end of its line, shown as the prefix is; or
  // a function of the state that returns it.
  /**
   * Text fields can contain suffix text such as unit of measurement or email
   * domain.
   *
   * The prefix and suffix of a text field provides symbols and abbreviations to
   * help users enter the correct values.
   *
   * @see https://m3.material.io/components/text-fields/specs
   * @see https://m3.material.io/components/text-fields/guidelines
   */
  suffix?: AriaGroupProps['children']

  // The control's placeholder, React Aria's Input's: shown while the control is empty, once a
  // label has left its line.
  placeholder?: string
}

// `'single'` is an `<input>`; the other two are a `<textarea>`: `'multi'` starts at its `rows`,
// one unless given, and grows with its text, `'area'` keeps its `rows` and scrolls.
type Lines =
  | {
      /**
       * Text fields can display input text in the following ways:
       *
       * - Single line text fields display only one line of text
       * - Multi-line text fields grow to accommodate multiple lines of text
       * - Text areas are fixed-height fields
       *
       * In multi-line fields, overflow text causes the text field to expand,
       * shifting screen elements downward and text wraps onto a new line. These
       * fields initially appear as single-line fields, which is useful for compact
       * layouts that need to accommodate large amounts of text.
       *
       * Text areas are taller than text fields and wrap overflow text onto a new
       * line. They are a fixed height and scroll vertically when the cursor reaches
       * the bottom of the field. The large initial size indicates that longer
       * responses are possible and encouraged. These should be used instead of
       * multi-line fields on the web.
       *
       * @default 'single'
       * @see https://m3.material.io/components/text-fields/guidelines
       */
      lines?: 'single'
      rows?: undefined
      // The `<input>`'s own ref; `ref` is the outermost element's.
      inputRef?: Ref<HTMLInputElement>
      // Draws the `<input>` in React Aria's Input's place, as its `render` does: called with the
      // props to spread on it, the ref among them, and the Input's render props.
      input?: AriaInputProps['render']
    }
  | {
      lines: 'multi' | 'area'
      // The `<textarea>`'s rows: where a multi-line field starts, and a text area's height.
      rows?: number
      // The `<textarea>`'s own ref.
      inputRef?: Ref<HTMLTextAreaElement>
      // Draws the `<textarea>` in React Aria's TextArea's place, as `input` draws an `<input>`.
      input?: AriaTextAreaProps['render']
    }

// The props of React Aria's TextField, which `TextField` is built on, with the `ref` of the
// `<div>` it renders and `inputRef`, the control's own, and the M3 props. Named by its `label`
// or `aria-label`, and described by its `description` and counter.
export type TextFieldProps = Except<AriaTextFieldProps, 'children'> &
  // React Aria's TextField passes this on to useTextField, but leaves it out of its type.
  Pick<AriaTextFieldOptions<'input'>, 'autoCapitalize'> &
  RefProps<HTMLDivElement> &
  TextFieldBaseProps &
  Lines

// The control in the container the spec draws around one, with its label text and supporting
// text, which it draws itself. `className`, `style` and the ref go on the outermost element.
/**
 * Text fields let users enter text into a UI
 *
 * Make sure text fields look interactive
 *
 * Two variants: filled and outlined
 *
 * The text field’s state (blank, with input, error, etc) should be visible at
 * a glance
 *
 * Keep labels and error messages brief and easy to act on
 *
 * Text fields commonly appear in forms and dialogs
 *
 * Use a text field when someone needs to enter text into a UI, such as filling
 * in contact or payment information.
 *
 * Label text tells people what information is requested. Every text field
 * should have a label.
 *
 * Label text should be aligned with the input text, and always visible. It
 * can be placed in the middle of a text field, or rest near the top of the
 * container.
 *
 * Label text shouldn't be truncated or take up multiple lines. Keep it short,
 * clear, and fully visible.
 *
 * A text field doesn't require a label if the field's purpose is indicated by
 * a separate, adjacent label.
 *
 * If a text field requires input, indicate so with an asterisk at the end of
 * the text field label. The accessibility label must include the asterisk.
 *
 * Supporting text conveys additional information about the input field, such
 * as how it will be used. It should ideally be one line, though may wrap to
 * multiple lines if required. It can be either persistently visible or visible
 * only on focus.
 *
 * For text fields that validate their content such as passwords, replace
 * supporting text with error text. Swapping supporting text with error text
 * prevents new lines of text from bumping content and changing the layout.
 *
 * When there is an error, "alert" is applied to the role and the error message
 * to the text label.
 *
 * If there is a character or word limit, include a character or word counter.
 * They display the ratio of characters used and the total character limit.
 *
 * Read-only text fields display pre-filled text that people cannot edit.
 *
 * A read-only text field is styled the same as a regular text field and is
 * clearly labeled as read-only.
 *
 * Tab: Focus lands on (non-disabled) text field
 *
 * If the UI text is correctly linked, assistive tech (such as a screenreader)
 * will read the UI text followed by the component’s role.
 *
 * The accessibility label for a text field is the same as the text field
 * label.
 *
 * Don't apply density to text fields by default. This lowers their targets
 * below the recommended 48x48 CSS pixels. Instead, give people a way to choose
 * a higher density, like selecting a denser layout or changing the theme.
 *
 * @see https://m3.material.io/components/text-fields/overview
 * @see https://m3.material.io/components/text-fields/guidelines
 * @see https://m3.material.io/components/text-fields/accessibility
 */
export function TextField({
  variant = 'filled',
  lines = 'single',
  rows,
  inputRef,
  input,
  label,
  description,
  counterLabel = 'Character count',
  leading,
  trailing,
  prefix,
  suffix,
  className,
  placeholder,
  onChange,
  ...props
}: TextFieldProps) {
  const { isRequired, maxLength, value, defaultValue, type } = props

  const labelled = !!label
  // `isRequired` ends the label with an asterisk, which is then part of the control's name.
  const text = labelled && (
    <>
      {label}
      {isRequired && '*'}
    </>
  )

  // The control, read here and given out as `inputRef`.
  const controlRef = useRef<Control>(null)
  const controlRefs = useMemo(
    () => mergeRefs(controlRef, inputRef as Ref<Control> | undefined),
    [inputRef],
  )

  // The text: the value given, or what an uncontrolled control holds, which React Aria keeps
  // and reports as it is typed and as the form resets.
  const [typed, setTyped] = useState(defaultValue ?? '')
  const current = value ?? typed

  // A multi-line field is as tall as its text: fitted to it as it changes, and as its width,
  // and with that its wrapping, does, a frame later, so that a resize is not answered with one.
  useLayoutEffect(() => {
    const el = controlRef.current
    if (!el || lines !== 'multi') return
    fit(el)
    return () => {
      el.style.height = ''
    }
  }, [lines, current])
  useEffect(() => {
    const el = controlRef.current
    if (!el || lines !== 'multi' || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => requestAnimationFrame(() => fit(el)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [lines])

  const space = variant === 'filled' && labelled ? 'label' : 'middle'
  // A space, so the control can tell empty from populated by its placeholder alone.
  const hint =
    lines !== 'single' || hinted.has(type ?? 'text')
      ? (placeholder ?? (labelled ? ' ' : undefined))
      : undefined

  // The container and everything in it, for the state React Aria reports of the Group: the
  // control, its layers, its ends, drawn as given, one given as a function called with the state
  // as React Aria calls its own, and the label, after the icons it reads. The error state is the
  // one React Aria reports, and a button given as an icon is disabled with the field through
  // its context.
  const parts = (state: TextFieldRenderProps & { defaultChildren: ReactNode | undefined }) => {
    const { isInvalid: invalid, isDisabled: disabled } = state
    const controlClass = control({ lines, space, labelled, invalid })
    return (
      <ButtonContext.Provider value={{ isDisabled: disabled }}>
        {lines === 'single' ? (
          <AriaInput
            ref={controlRefs as Ref<HTMLInputElement>}
            placeholder={hint}
            className={controlClass}
            render={input as AriaInputProps['render']}
          />
        ) : (
          <AriaTextArea
            ref={controlRefs as Ref<HTMLTextAreaElement>}
            rows={lines === 'multi' ? (rows ?? 1) : rows}
            placeholder={hint}
            className={controlClass}
            render={input as AriaTextAreaProps['render']}
          />
        )}
        {variant === 'filled' ? (
          <>
            <span aria-hidden className={fill} />
            <span aria-hidden className={stateLayer} />
            <span aria-hidden className={indicator({ invalid })} />
          </>
        ) : (
          <span aria-hidden className={outline({ invalid })}>
            <span className="field-outline-start" />
            {labelled && (
              <span className="field-outline-notch">
                <span className="field-outline-label">{text}</span>
              </span>
            )}
            <span className="field-outline-end" />
          </span>
        )}
        <span className={icon({ side: 'leading', invalid: false })}>
          {composeRenderProps(leading, (node) => node)(state)}
        </span>
        <span className={affix({ side: 'prefix', space, labelled })}>
          {composeRenderProps(prefix, (node) => node)(state)}
        </span>
        <span className={affix({ side: 'suffix', space, labelled })}>
          {composeRenderProps(suffix, (node) => node)(state)}
        </span>
        <span className={icon({ side: 'trailing', invalid })}>
          {composeRenderProps(trailing, (node) => node)(state)}
        </span>
        {labelled && <AriaLabel className={floatingLabel({ variant, invalid })}>{text}</AriaLabel>}
      </ButtonContext.Provider>
    )
  }

  const described = !!description
  const counted = maxLength !== undefined
  // The counter describes the control too, by its id, after what React Aria links itself.
  const counterId = useId()
  const describedBy = counted
    ? [counterId, props['aria-describedby']].filter(Boolean).join(' ')
    : props['aria-describedby']
  return (
    <AriaTextField
      {...props}
      aria-describedby={describedBy}
      onChange={(text) => {
        setTyped(text)
        onChange?.(text)
      }}
      className={composeRenderProps(className, (className) => root({ className }))}
    >
      {({ isInvalid }) => (
        <>
          <AriaGroup
            className={container({ variant })}
            onMouseDown={(event) => {
              // A click in the container that is not on a control goes to the input, which
              // keeps the focus it has: the default would take it away first.
              const el = controlRef.current
              if (!el || event.button !== 0 || !(event.target instanceof Element)) return
              if (event.target.closest(interactive)) return
              event.preventDefault()
              el.focus()
            }}
          >
            {parts}
          </AriaGroup>
          {(described || counted || isInvalid) && (
            <span className={supportingRow}>
              {described && !isInvalid && (
                <AriaText
                  slot="description"
                  elementType="span"
                  className={supportingText({ part: 'text', invalid: false })}
                >
                  {description}
                </AriaText>
              )}
              <AriaFieldError
                // An element of its own, an alert, so that it is announced as it is drawn.
                render={(props) => <span {...props} role="alert" />}
                className={supportingText({ part: 'text', invalid: true })}
              >
                {({ validationErrors }) => validationErrors.join(' ') || description || null}
              </AriaFieldError>
              {counted && (
                <span
                  id={counterId}
                  className={supportingText({ part: 'counter', invalid: isInvalid })}
                >
                  <span className="sr-only">{counterLabel},</span> {current.length}/{maxLength}
                </span>
              )}
            </span>
          )}
        </>
      )}
    </AriaTextField>
  )
}
