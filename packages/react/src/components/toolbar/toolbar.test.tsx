import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'
import { Toolbar, type ToolbarProps } from './toolbar'

/* Markup and behavior that jsdom can check without a stylesheet: React Aria's toolbar role, its
 * orientation and keyboard, a ButtonGroup in it, and the props passed through. Looks, and what the
 * toolbar draws on the toggles in it, are in toolbar.browser.test.tsx. */

const toolbar = () => screen.getByRole('toolbar')
const button = (name: string) => screen.getByRole('button', { name })

const names = ['Archive', 'Delete', 'Snooze'] as const

/** Three actions, one of them disabled if named. */
const actions = (disabled?: string) =>
  names.map((name) => (
    <Button key={name} isDisabled={name === disabled}>
      {name}
    </Button>
  ))

const formats = ['Bold', 'Italic', 'Underline'] as const

// Our Button is React Aria's ToggleButton given `isSelectable`; in a group, with an `id`, the
// group's selection is the one it shows.
function Formats(props: Partial<Parameters<typeof ButtonGroup>[0]>) {
  return (
    <ButtonGroup aria-label="Text style" {...props}>
      {formats.map((name) => (
        <Button key={name} id={name} isSelectable>
          {name}
        </Button>
      ))}
    </ButtonGroup>
  )
}

describe('Toolbar', () => {
  it('is React Aria’s toolbar, a named <div> of what it is given, in the order written', () => {
    render(
      <Toolbar aria-label="Message">
        {actions()}
        <span>3 selected</span>
      </Toolbar>,
    )
    expect(toolbar().tagName).toBe('DIV')
    expect(toolbar()).toHaveAccessibleName('Message')
    expect(within(toolbar()).getAllByRole('button')).toEqual(names.map(button))
    expect(toolbar().lastElementChild).toHaveTextContent('3 selected')
  })

  it('is horizontal unless its orientation says otherwise, and says which it is', () => {
    const { rerender } = render(<Toolbar aria-label="Message">{actions()}</Toolbar>)
    expect(toolbar()).toHaveAttribute('aria-orientation', 'horizontal')
    expect(toolbar()).toHaveAttribute('data-orientation', 'horizontal')
    rerender(
      <Toolbar aria-label="Message" orientation="vertical">
        {actions()}
      </Toolbar>,
    )
    expect(toolbar()).toHaveAttribute('aria-orientation', 'vertical')
    expect(toolbar()).toHaveAttribute('data-orientation', 'vertical')
  })

  it("keeps React Aria's class, merges a custom one, passes data attributes and forwards the ref", () => {
    let ref: HTMLDivElement | null = null
    render(
      <>
        <Toolbar
          aria-label="String"
          data-page="inbox"
          className="justify-center"
          ref={(node) => {
            ref = node
          }}
        >
          {actions()}
        </Toolbar>
        <Toolbar
          aria-label="Function"
          orientation="vertical"
          className={({ defaultClassName, orientation }) => `${defaultClassName} is-${orientation}`}
        >
          {actions()}
        </Toolbar>
      </>,
    )
    const string = screen.getByRole('toolbar', { name: 'String' })
    expect(ref).toBe(string)
    expect(string).toHaveAttribute('data-page', 'inbox')
    expect(string).toHaveClass('justify-center')
    expect(string).not.toHaveClass('justify-between')
    expect(screen.getByRole('toolbar', { name: 'Function' })).toHaveClass(
      'react-aria-Toolbar',
      'is-vertical',
    )
  })

  it('takes a variant and a color scheme, and React Aria’s orientation', () => {
    expectTypeOf<ToolbarProps['variant']>().toEqualTypeOf<'docked' | 'floating' | undefined>()
    expectTypeOf<ToolbarProps['color']>().toEqualTypeOf<'standard' | 'vibrant' | undefined>()
    expectTypeOf<ToolbarProps['orientation']>().toEqualTypeOf<
      'horizontal' | 'vertical' | undefined
    >()
  })

  describe('the keyboard, React Aria’s', () => {
    it('moves the focus between its elements with the right and left arrow keys, no further than the ends', async () => {
      const user = userEvent.setup()
      render(<Toolbar aria-label="Message">{actions()}</Toolbar>)
      button('Archive').focus()
      await user.keyboard('{ArrowRight}')
      expect(button('Delete')).toHaveFocus()
      await user.keyboard('{ArrowRight}{ArrowRight}')
      expect(button('Snooze')).toHaveFocus()
      await user.keyboard('{ArrowLeft}')
      expect(button('Delete')).toHaveFocus()
      await user.keyboard('{ArrowLeft}{ArrowLeft}')
      expect(button('Archive')).toHaveFocus()
    })

    it('turns the two keys around in a locale that runs right to left', async () => {
      const user = userEvent.setup()
      render(
        <I18nProvider locale="ar-EG">
          <Toolbar aria-label="Message">{actions()}</Toolbar>
        </I18nProvider>,
      )
      button('Archive').focus()
      await user.keyboard('{ArrowLeft}')
      expect(button('Delete')).toHaveFocus()
      await user.keyboard('{ArrowRight}')
      expect(button('Archive')).toHaveFocus()
    })

    it('moves the focus with the down and up arrow keys when vertical, and not with right and left', async () => {
      const user = userEvent.setup()
      render(
        <Toolbar aria-label="Message" orientation="vertical">
          {actions()}
        </Toolbar>,
      )
      button('Archive').focus()
      await user.keyboard('{ArrowDown}')
      expect(button('Delete')).toHaveFocus()
      await user.keyboard('{ArrowUp}')
      expect(button('Archive')).toHaveFocus()
      await user.keyboard('{ArrowRight}')
      expect(button('Archive')).toHaveFocus()
    })

    it('passes a disabled element by', async () => {
      const user = userEvent.setup()
      render(<Toolbar aria-label="Message">{actions('Delete')}</Toolbar>)
      button('Archive').focus()
      await user.keyboard('{ArrowRight}')
      expect(button('Snooze')).toHaveFocus()
      await user.keyboard('{ArrowLeft}')
      expect(button('Archive')).toHaveFocus()
    })

    it('leaves the toolbar with Tab, where M3 has Tab move to the next element, and comes back to the one it left', async () => {
      const user = userEvent.setup()
      render(
        <>
          <button type="button">Before</button>
          <Toolbar aria-label="Message">{actions()}</Toolbar>
          <button type="button">After</button>
        </>,
      )
      await user.tab()
      await user.tab()
      expect(button('Archive')).toHaveFocus()
      await user.tab()
      expect(button('After')).toHaveFocus()
      await user.tab({ shift: true })
      expect(button('Archive')).toHaveFocus()
      await user.tab({ shift: true })
      expect(button('Before')).toHaveFocus()
    })

    it('takes the arrow keys from a text field in it as well', async () => {
      const user = userEvent.setup()
      render(
        <Toolbar aria-label="Message">
          <input aria-label="Search" defaultValue="mail" />
          {actions()}
        </Toolbar>,
      )
      screen.getByRole('textbox', { name: 'Search' }).focus()
      await user.keyboard('{ArrowRight}')
      expect(button('Archive')).toHaveFocus()
    })

    it('activates a button with Space or Enter, as the button does on its own', async () => {
      const user = userEvent.setup()
      const onPress = vi.fn()
      render(
        <Toolbar aria-label="Message">
          <Button onPress={onPress}>Archive</Button>
        </Toolbar>,
      )
      button('Archive').focus()
      await user.keyboard('{Enter}')
      await user.keyboard(' ')
      expect(onPress).toHaveBeenCalledTimes(2)
    })
  })

  describe('a ButtonGroup in it', () => {
    it('is a named group of toggles, which say whether they are pressed', async () => {
      const user = userEvent.setup()
      render(
        <Toolbar aria-label="Formatting">
          <Formats selectionMode="multiple" defaultSelectedKeys={['Bold']} />
        </Toolbar>,
      )
      const group = screen.getByRole('group', { name: 'Text style' })
      expect(toolbar()).toContainElement(group)
      expect(button('Bold')).toHaveAttribute('aria-pressed', 'true')
      expect(button('Italic')).toHaveAttribute('aria-pressed', 'false')
      await user.click(button('Italic'))
      expect(button('Italic')).toHaveAttribute('aria-pressed', 'true')
      expect(button('Bold')).toHaveAttribute('aria-pressed', 'true')
    })

    it('is a radiogroup with single selection, its default', async () => {
      const user = userEvent.setup()
      render(
        <Toolbar aria-label="Formatting">
          <Formats defaultSelectedKeys={['Bold']} />
        </Toolbar>,
      )
      expect(screen.getByRole('radiogroup', { name: 'Text style' })).toBeInTheDocument()
      await user.click(screen.getByRole('radio', { name: 'Underline' }))
      expect(screen.getByRole('radio', { name: 'Underline' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Bold' })).not.toBeChecked()
    })

    it('is moved through by the toolbar’s arrow keys, on to the elements after it and back', async () => {
      const user = userEvent.setup()
      render(
        <Toolbar aria-label="Formatting">
          <Formats selectionMode="multiple" />
          <Button>More</Button>
        </Toolbar>,
      )
      button('Bold').focus()
      for (const name of ['Italic', 'Underline', 'More']) {
        await user.keyboard('{ArrowRight}')
        expect(button(name)).toHaveFocus()
      }
      await user.keyboard('{ArrowLeft}')
      expect(button('Underline')).toHaveFocus()
    })
  })
})
