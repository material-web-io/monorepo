import { render, screen } from '@testing-library/react'
import { Label } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { computedColor, rgba, Scheme, settle } from '../../test-browser'
import { Checkbox } from './checkbox'
import { CheckboxGroup, type CheckboxGroupProps } from './checkbox-group'

/* What needs a real browser and stylesheet: the states a group gives its checkboxes, drawn by
 * each one's box, the native validation of its form, and the keys. Markup and events:
 * checkbox-group.test.tsx; a checkbox's own drawing: checkbox.browser.test.tsx. */

/** The hidden `<input>` in the checkbox role, which has the name, the state and the focus. */
const input = (name: string) => screen.getByRole<HTMLInputElement>('checkbox', { name })
/** The 18dp box, the last child of the host after the hidden input's span. */
const box = (name: string) =>
  input(name).parentElement!.nextElementSibling!.lastElementChild as HTMLElement

const color = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)

/** Pickles selected, Tomato not, in a group with the given props. */
function Extras(props: Omit<CheckboxGroupProps, 'children'>) {
  return (
    <Scheme>
      <CheckboxGroup aria-label="Extras" defaultValue={['pickles']} {...props}>
        <Checkbox value="pickles">Pickles</Checkbox>
        <Checkbox value="tomato">Tomato</Checkbox>
      </CheckboxGroup>
    </Scheme>
  )
}

describe('CheckboxGroup in a browser', () => {
  it('draws each checkbox in the error role while the group is invalid', () => {
    render(<Extras isInvalid />)
    const error = color('error', box('Tomato'))
    expect(getComputedStyle(box('Tomato')).borderTopColor).toBe(error)
    expect(getComputedStyle(box('Pickles')).backgroundColor).toBe(error)
  })

  it('greys out each checkbox to on-surface at 38% while the group is disabled', () => {
    render(<Extras isDisabled />)
    // The same mix Tailwind writes for on-surface/disabled-content, the 38% token.
    const faded = computedColor(
      'color-mix(in oklab, var(--md-sys-color-on-surface) calc(var(--md-sys-state-disabled-content-opacity) * 100%), transparent)',
      box('Tomato'),
    )
    expect(getComputedStyle(box('Tomato')).borderTopColor).toBe(faded)
    expect(rgba(getComputedStyle(box('Tomato')).backgroundColor)[3]).toBe(0)
    expect(getComputedStyle(box('Pickles')).backgroundColor).toBe(faded)
  })

  it('draws the error its form finds when sent with none selected, until one is', async () => {
    render(
      <Scheme>
        <form onSubmit={(event) => event.preventDefault()}>
          <CheckboxGroup isRequired name="extras">
            <Label>Extras</Label>
            <Checkbox value="pickles">Pickles</Checkbox>
            <Checkbox value="tomato">Tomato</Checkbox>
          </CheckboxGroup>
          <button type="submit">Send</button>
        </form>
      </Scheme>,
    )
    const outline = color('on-surface-variant', box('Tomato'))
    expect(getComputedStyle(box('Tomato')).borderTopColor).toBe(outline)
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(screen.getByRole('group')).toHaveAttribute('data-invalid')
    await settle()
    expect(getComputedStyle(box('Tomato')).borderTopColor).toBe(color('error', box('Tomato')))
    await userEvent.click(input('Pickles').closest('label')!)
    expect(screen.getByRole('group')).not.toHaveAttribute('data-invalid')
    await settle()
    expect(getComputedStyle(box('Tomato')).borderTopColor).toBe(outline)
  })

  it('leaves each checkbox a tab stop of its own, toggled by Space', async () => {
    render(<Extras />)
    await userEvent.tab()
    expect(document.activeElement).toBe(input('Pickles'))
    await userEvent.tab()
    expect(document.activeElement).toBe(input('Tomato'))
    await userEvent.keyboard(' ')
    expect(input('Tomato').checked).toBe(true)
    expect(input('Pickles').checked).toBe(true)
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(input('Pickles'))
  })
})
