import {
  ButtonContext,
  composeRenderProps,
  DEFAULT_SLOT,
  Provider,
  SearchField as AriaSearchField,
  ToggleButtonContext,
  type ButtonProps as AriaButtonProps,
  type SearchFieldProps as AriaSearchFieldProps,
  type SearchFieldRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { IconContext } from '../icon'
import { Ripple } from '../ripple'

/* React Aria's SearchField as the M3 search bar: the field's <div> is the 56dp container, which
 * holds its Input and what leads and trails it, in the order written. Its fixed classes are in
 * search.css. */

// What a SearchField passes its className, style and children, given as functions: whether it
// is empty, disabled, invalid, read-only or required, and its state.
export type { SearchFieldRenderProps }

// The props of React Aria's SearchField, with the `ref` of its `<div>`: `value`, `defaultValue`
// and `onChange`, `onSubmit` (Enter) and `onClear` (Escape, or its clear button), and the rest.
export type SearchFieldProps = AriaSearchFieldProps & RefProps<HTMLDivElement>

// What starts a press that is no control's: the field's own input, or a button or link in it.
const interactive = 'input, button, a, [role="button"], [tabindex]'

// Its children are drawn as written, after the ripple: React Aria's `Input`, an `Icon` or button
// in `slot="leading"` or `"trailing"` (another slot throws), and a button with no slot, the clear
// button, shown while there is text. A press on it that is on no control goes to the input.
/**
 * Search lets people enter a keyword or phrase to get relevant information
 *
 * A search bar can include a leading search icon, hinted search text, and optional trailing icons
 *
 * Use search for navigating a product with queries
 *
 * Search bar: Use to search contents in a specific view, like Search your messages
 *
 * Search bar container
 *
 * Leading icon
 *
 * Supporting text
 *
 * Trailing icon and avatar (optional)
 *
 * Input text
 *
 * The leading side of a search bar should include either:
 *
 * - A navigational icon button, such as a menu or arrow
 * - A non-functional search icon
 *
 * A search bar should have one or two trailing icons or icon buttons.
 *
 * Trailing actions can include:
 *
 * - Additional modes of searching like voice search
 * - A separate high-level action such as current location or profile
 * - An overflow menu
 * - A decorative search icon
 *
 * Focused search can show an optional clear icon to remove input text
 *
 * Provide a short description of the information people can search, like Search replies or
 * Search your messages.
 *
 * When a person starts typing, the hinted text is replaced with the input text.
 *
 * Container
 *
 * - Width: Min: 360dp, max: 720dp
 * - Height: 56dp
 * - Label alignment: Start-aligned
 * - Leading icon and label padding (from tap target): 4dp
 * - Label and trailing icon padding (from tap target): 4dp
 *
 * Avatar size: 30dp
 *
 * Search bars use the surface container high color role.
 *
 * Keyboard navigation:
 *
 * - Tab or Shift + Tab: Navigate between interactive elements
 * - Space or Enter: Activate the search text field for input
 *
 * The hinted search text should be used as the accessibility label describing the search bar.
 *
 * Leading and trailing icon buttons should be labeled according to their accessibility guidance.
 *
 * @see https://m3.material.io/components/search/overview
 * @see https://m3.material.io/components/search/specs
 * @see https://m3.material.io/components/search/guidelines
 * @see https://m3.material.io/components/search/accessibility
 */
export function SearchField({ className, onMouseDown, children, ...props }: SearchFieldProps) {
  return (
    <AriaSearchField
      {...props}
      onMouseDown={(event) => {
        onMouseDown?.(event)
        // A press in the container that is not on a control goes to the input, which keeps the
        // focus it has: the default would take it away first. A control is its own, not a Dialog
        // around it; and one in a portal, a trailing menu's, is not in the container.
        const { currentTarget: field, target } = event
        const input = field.querySelector('input')
        if (event.defaultPrevented || !input || event.button !== 0) return
        if (!(target instanceof Element) || !field.contains(target)) return
        const control = target.closest(interactive)
        if (control !== field && field.contains(control)) return
        event.preventDefault()
        input.focus()
      }}
      className={composeTailwindRenderProps(className, 'search-field')}
    >
      {composeRenderProps(children, (children, { isDisabled }) => (
        <>
          <Ripple />
          {/* React Aria gives every button in it the clear button's props; only the one with
              no slot takes them here, and the slotted and selectable ones are disabled with it.
              `isDisabled={false}` on a button wins. */}
          <ButtonContext.Consumer>
            {(clear) => (
              <Provider
                values={[
                  [
                    ButtonContext,
                    {
                      slots: {
                        [DEFAULT_SLOT]: clear as AriaButtonProps,
                        leading: { isDisabled },
                        trailing: { isDisabled },
                      },
                    },
                  ],
                  [
                    ToggleButtonContext,
                    {
                      slots: {
                        [DEFAULT_SLOT]: { isDisabled },
                        leading: { isDisabled },
                        trailing: { isDisabled },
                      },
                    },
                  ],
                  [IconContext, { slots: { [DEFAULT_SLOT]: {}, leading: {}, trailing: {} } }],
                ]}
              >
                {children}
              </Provider>
            )}
          </ButtonContext.Consumer>
        </>
      ))}
    </AriaSearchField>
  )
}
