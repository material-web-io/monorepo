import { type ReactNode } from 'react'
import { useLocale } from 'react-aria'
import {
  ButtonContext,
  DateField as AriaDateField,
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  FieldError as AriaFieldError,
  Label as AriaLabel,
  Text as AriaText,
  type DateFieldProps as AriaDateFieldProps,
  type DateFieldRenderProps,
  type DateInputProps as AriaDateInputProps,
  type DateValue,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'

/* React Aria's DateField, drawn as the outlined text field the M3 date pickers type a date in:
 * the date in segments, the label on the outline, and the supporting and error texts under it.
 * Its fixed classes are in date-field.css, its outline's parts TextField's (text-field.css). */

/* The container, an outlined text field's: a plain box around React Aria's DateInput, whose
 * hover and focus its parts read. The named group its parts read; the error and disabled colors,
 * and the label resting while no part of the date is typed, as classes of its own. */
const container = tv({
  base: 'group/md-date-field date-field-container',
  variants: {
    invalid: { true: 'date-field-container-invalid', false: '' },
    disabled: { true: 'date-field-container-disabled', false: '' },
    empty: { true: 'date-field-container-empty', false: '' },
  },
})

type DateFieldBaseProps = {
  // The label text, React Aria's Label, which names the field: on the date's line while the field
  // is empty and without the focus, and on the outline, over the segments' format, once it has
  // either. `isRequired` ends it with an asterisk. With none, name the field with `aria-label`.
  /**
   * The text field's accessibility label should clearly state the purpose of
   * the input (for example, event date or reservation date) and should match
   * the placeholder text when the field is empty.
   *
   * @see https://m3.material.io/components/date-pickers/accessibility
   */
  label?: ReactNode

  // The supporting text under the container, React Aria's Text in the `description` slot: the
  // date's format in the locale unless given, and none given `null`. React Aria's error text
  // follows it while the field is invalid.
  /**
   * The helper text (below the text field) should specify the date format
   * (for example, MM/DD/YYYY or YYYY/MM/DD) and act as a description for the
   * text field. The default helper text is "MM/DD/YYYY," but this can be
   * customized.
   *
   * @see https://m3.material.io/components/date-pickers/accessibility
   */
  description?: ReactNode | null

  // The trailing icon, at the container's end in a 24dp box 12dp in: an icon, or an icon button,
  // disabled with the field, such as the calendar button that opens a DatePickerDialog; or a
  // function of the state.
  /**
   * The calendar icon is the exclusive entry point for the date picker.
   *
   * @see https://m3.material.io/components/date-pickers/accessibility
   */
  trailing?: ReactNode | ((values: DateFieldRenderProps) => ReactNode)

  // Draws the date's `<div>` in React Aria's DateInput's place, as its `render` does: called with
  // the props to spread on it, the segments and the ref among them, and DateInput's render props.
  input?: AriaDateInputProps['render']
}

// The props of React Aria's DateField, with the `ref` of the `<div>` it renders, and the M3 props.
// It draws its parts itself, so takes no children; `shouldForceLeadingZeros` is on unless set.
export type DateFieldProps<T extends DateValue> = Except<AriaDateFieldProps<T>, 'children'> &
  RefProps<HTMLDivElement> &
  DateFieldBaseProps

// React Aria's DateField, an outlined text field of the date in segments, each a spinbutton that
// shows its placeholder until typed, with its label on the outline and its format under it.
// `className`, `style` and the ref go on the outermost element; the rest are React Aria's.
/**
 * Each input is a separate tab stop, which improves discoverability of the
 * control.
 *
 * @see https://m3.material.io/components/date-pickers/accessibility
 */
export function DateField<T extends DateValue>({
  label,
  description,
  trailing,
  input,
  shouldForceLeadingZeros = true,
  className,
  ...props
}: DateFieldProps<T>) {
  const { locale } = useLocale()
  return (
    <AriaDateField
      {...props}
      shouldForceLeadingZeros={shouldForceLeadingZeros}
      className={composeTailwindRenderProps(className, 'date-field')}
    >
      {(values) => {
        const labelled = label !== undefined
        const text = labelled && (
          <>
            {label}
            {values.isRequired && '*'}
          </>
        )
        // No part of the date typed or given: the label rests on its line, the segments unseen.
        const empty =
          labelled &&
          values.state.segments.every((part) => part.type === 'literal' || part.isPlaceholder)
        // The date's format in the locale, React Aria's placeholders of its parts in capitals,
        // e.g. `MM/DD/YYYY`.
        const pattern = values.state.segments
          .map((part) => (part.type === 'literal' ? part.text : part.placeholder))
          .join('')
          .toLocaleUpperCase(locale)
        const supporting = description === undefined ? pattern : description
        return (
          <>
            <div
              role="presentation"
              className={container({
                invalid: values.isInvalid,
                disabled: values.isDisabled,
                empty,
              })}
            >
              <AriaDateInput className="date-field-input" render={input}>
                {(segment) => <AriaDateSegment segment={segment} className="date-field-segment" />}
              </AriaDateInput>
              {trailing !== undefined && (
                <span className="date-field-trailing">
                  {/* A button given is disabled with the field, as TextField's. */}
                  <ButtonContext.Provider value={{ isDisabled: values.isDisabled }}>
                    {typeof trailing === 'function' ? trailing(values) : trailing}
                  </ButtonContext.Provider>
                </span>
              )}
              <span aria-hidden className="date-field-outline">
                <span className="field-outline-start" />
                {labelled && (
                  <span className="field-outline-notch">
                    <span className="field-outline-label">{text}</span>
                  </span>
                )}
                <span className="field-outline-end" />
              </span>
              {labelled && <AriaLabel className="date-field-label">{text}</AriaLabel>}
            </div>
            <span className="date-field-supporting">
              {supporting !== null && (
                <AriaText
                  slot="description"
                  elementType="span"
                  className="date-field-supporting-text"
                >
                  {supporting}
                </AriaText>
              )}
              <AriaFieldError className="date-field-supporting-text date-field-error" />
            </span>
          </>
        )
      }}
    </AriaDateField>
  )
}
