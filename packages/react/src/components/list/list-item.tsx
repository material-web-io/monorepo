import { useContext, useMemo, useState, type ReactNode } from 'react'
import { mergeRefs } from 'react-aria'
import {
  ButtonContext,
  CheckboxContext,
  CheckboxFieldContext,
  composeRenderProps,
  DEFAULT_SLOT,
  GridListItem as AriaGridListItem,
  Provider,
  TextContext,
  ToggleButtonContext,
  type ContextValue,
  type GridListItemProps as AriaGridListItemProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { Button } from '../../lib/button'
import { Icon, IconContext } from '../icon'
import { Ripple } from '../ripple'

export type { GridListItemRenderProps as ListItemRenderProps } from 'react-aria-components'

// The props of React Aria's GridListItem, which an item is, rendered as a `<div>` in the `row`
// role, with the `ref` of that element. `textValue` is what typing finds it by, and names the
// row: its children when they are a plain string, else the textValue the types then require, of
// a string alone as the children, or of a textValue with any children.
export type ListItemProps<T = object> = AriaGridListItemProps<T> &
  RefProps<HTMLDivElement> &
  ({ children: string; textValue?: string } | { textValue: string })

// The slots a React Aria context gives where it is, with none given: a context is its slots, a
// value for its one element, or nothing.
function slotsOf<T extends object, E extends Element>(context: ContextValue<T, E>) {
  return context && 'slots' in context ? context.slots : undefined
}

/* React Aria's slots in a row, and ours (list.css): Text takes `label`, `overline` and `trailing`
 * as well as `description`, an Icon `leading`, `trailing` or none, a Button `leading` or `trailing`
 * as well as `drag`, disabled with the row, and a Checkbox `leading` or `trailing` as well as
 * `selection`, each the row's selection checkbox. Any other slot throws, as React Aria's do; an
 * element of yours is placed by its slot alone. */
function ItemSlots({ children }: { children: ReactNode }) {
  const text = slotsOf(useContext(TextContext))
  const button = slotsOf(useContext(ButtonContext)) ?? {}
  const checkbox = slotsOf(useContext(CheckboxContext)) ?? {}
  const checkboxField = slotsOf(useContext(CheckboxFieldContext)) ?? {}
  const action = button[DEFAULT_SLOT] ?? {}
  // A selectable button reads React Aria's ToggleButtonContext, in which a row gives nothing: in
  // the slots here it is disabled with the row, as the other buttons are.
  const toggle = slotsOf(useContext(ToggleButtonContext))
  const disabled = { isDisabled: action.isDisabled }
  const selection = checkbox.selection ?? {}
  const fieldSelection = checkboxField.selection ?? {}
  return (
    <Provider
      values={[
        [
          TextContext,
          { slots: { [DEFAULT_SLOT]: {}, ...text, label: {}, overline: {}, trailing: {} } },
        ],
        [IconContext, { slots: { [DEFAULT_SLOT]: {}, leading: {}, trailing: {} } }],
        [ButtonContext, { slots: { ...button, leading: action, trailing: action } }],
        [
          ToggleButtonContext,
          { slots: { [DEFAULT_SLOT]: {}, ...toggle, leading: disabled, trailing: disabled } },
        ],
        [CheckboxContext, { slots: { ...checkbox, leading: selection, trailing: selection } }],
        [
          CheckboxFieldContext,
          { slots: { ...checkboxField, leading: fieldSelection, trailing: fieldSelection } },
        ],
      ]}
    >
      {children}
    </Provider>
  )
}

/* What the stylesheet cannot tell of a row (list.css): its lines of text, by whether the text, the
 * rows of its grid between the two that pad it, is taller than a one-line item's 36dp of content
 * or a two-line one's 52dp, and whether the row is 88dp tall or more, its padding counted. */
function measure(row: HTMLElement) {
  const dp = parseFloat(getComputedStyle(row.ownerDocument.documentElement).fontSize) / 16
  const rows = (getComputedStyle(row).gridTemplateRows.match(/[\d.]+(?=px)/g) ?? []).map(Number)
  const text = rows.slice(1, -1).reduce((height, track) => height + track, 0)
  const lines: keyof typeof lined = text > 52 * dp ? 3 : text > 36 * dp ? 2 : 1
  return { lines, tall: row.offsetHeight >= 88 * dp }
}

// The layout of an item by its lines of text, once measured: one line's is the item's own.
const lined = { 1: '', 2: 'list-item-two-line', 3: 'list-item-three-line' }

// Its ripple is the row's own first child, before the gridcell React Aria puts the children in,
// so that its layer reads the row's states: in the row's own render, or the caller's, which is
// given the children with it. Then the drag handle of a list that drags its items, React Aria's
// Button in the `drag` slot, and the children as written, each part in its slot.
/**
 * Container and label text are required. All other elements are optional:
 *
 * - Container
 * - Overline
 * - Label text
 * - Trailing text
 * - Supporting text
 * - Trailing icon
 * - Divider
 * - Leading avatar
 * - Leading icon
 * - Leading media - image or video
 *
 * Think of a custom list as a container with three different slots: leading,
 * content, and trailing. Each slot can hold a different element.
 *
 * The leading and trailing slot positions must be a smaller width than the
 * content section.
 *
 * 1. Leading slots can contain:
 *    - Visual elements: Avatar, icon, image, or video thumbnail
 *    - Selection controls: Checkbox, radio button, or switch
 *    - Customizations: Badge or larger image
 * 2. Content slots must be the largest-width slot and can contain:
 *    - Default content: Label text, supporting text
 *    - Optional add-ons: Badge, icon, in-line label, or more text elements
 *    - Avoid long lines of text to preserve readability
 * 3. Trailing slots can contain:
 *    - Action elements or text: Icon, icon button, or trailing text
 *    - Selection controls: Checkbox, radio button, or switch
 *
 * For selection lists, use only one selection interaction per list item.
 *
 * In most cases, elements in a list item are middle-aligned
 *
 * If a list is 88dp or larger, or contains three or more lines of text,
 * elements are top-aligned
 *
 * The accessibility label for a list item is typically the same as the label
 * text and supporting text.
 *
 * @see https://m3.material.io/components/lists/specs
 * @see https://m3.material.io/components/lists/guidelines
 * @see https://m3.material.io/components/lists/accessibility
 */
export function ListItem<T extends object>({
  className,
  children,
  render,
  ref,
  ...props
}: ListItemProps<T>) {
  // Its lines of text and whether it is 88dp tall, measured as the row is drawn and at each change
  // of its size, its padding counted, of a part's or of its text, which the height its lines give
  // it can hide from the row's own size.
  const [lines, setLines] = useState<keyof typeof lined>(1)
  const [tall, setTall] = useState(false)
  const rowRef = useMemo(
    () =>
      mergeRefs((row: HTMLDivElement | null) => {
        const cell = row?.querySelector(':scope > [role="gridcell"]')
        if (!row || !cell || typeof ResizeObserver === 'undefined') return
        const read = () => {
          const measured = measure(row)
          setLines(measured.lines)
          setTall(measured.tall)
        }
        const sizes = new ResizeObserver(read)
        const watch = () => {
          sizes.disconnect()
          sizes.observe(row, { box: 'border-box' })
          for (const part of cell.children) sizes.observe(part)
          read()
        }
        const parts = new MutationObserver(watch)
        parts.observe(cell, { childList: true, characterData: true, subtree: true })
        watch()
        return () => {
          sizes.disconnect()
          parts.disconnect()
        }
      }, ref ?? null),
    [ref],
  )
  // React Aria types to a row by its children when they are text, but it is handed a function:
  // the text is the textValue of a row given none, or one that is undefined.
  return (
    <AriaGridListItem
      {...props}
      ref={rowRef}
      textValue={props.textValue ?? (typeof children === 'string' ? children : undefined)}
      className={composeTailwindRenderProps(
        className,
        `group/md-list-item list-item-container ${lined[lines]} ${tall ? 'list-item-top' : ''}`,
      )}
      render={(rowProps, state) => {
        const withRipple = {
          ...rowProps,
          children: (
            <>
              <Ripple />
              {rowProps.children}
            </>
          ),
        }
        return render ? render(withRipple, state) : <div {...withRipple} />
      }}
    >
      {composeRenderProps(children, (children, { allowsDragging }) => (
        <>
          {allowsDragging && (
            <Button slot="drag" className="list-item-drag-handle">
              <Icon name="drag_handle" />
            </Button>
          )}
          <ItemSlots>{children}</ItemSlots>
        </>
      ))}
    </AriaGridListItem>
  )
}
