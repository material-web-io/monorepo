import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentPropsWithRef } from 'react'
import { Text, type ChildrenOrFunction } from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Icon } from '../icon'
import { Fab, type FabProps, type FabRenderProps } from './fab'

/*
 * Behavior and markup that jsdom can check without a stylesheet: attributes,
 * accessible names, DOM structure and event handling. What a class resolves to
 * visually - colors, corners, size, shadow - needs the real stylesheet, so it
 * is checked in fab.browser.test.tsx instead.
 */

describe('Fab', () => {
  it('renders a button named by its aria-label that does not submit forms by default', () => {
    render(
      <Fab aria-label="Create">
        <Icon name="add" />
      </Fab>,
    )
    const button = screen.getByRole('button', { name: 'Create' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).not.toHaveAttribute('aria-pressed')
  })

  it('can be named by aria-labelledby instead', () => {
    render(
      <>
        <span id="name">Compose</span>
        <Fab aria-labelledby="name">
          <Icon name="edit" />
        </Fab>
      </>,
    )
    expect(screen.getByRole('button')).toHaveAccessibleName('Compose')
  })

  it('lets the type be overridden', () => {
    render(
      <Fab aria-label="Done" type="submit">
        <Icon name="check" />
      </Fab>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('is a standard FAB with any lone element as its icon, and an extended one with a label alone', () => {
    render(
      <>
        <Fab aria-label="Create">
          <svg data-testid="icon" />
        </Fab>
        <Fab>
          <Text slot="label">Compose</Text>
        </Fab>
      </>,
    )
    const standard = screen.getByRole('button', { name: 'Create' })
    expect(standard).toContainElement(screen.getByTestId('icon'))
    // With no label there is no label slot either.
    expect(standard.querySelector('[slot="label"]')).not.toBeInTheDocument()
    const extended = screen.getByRole('button', { name: 'Compose' })
    expect(screen.getByText('Compose')).toHaveAttribute('slot', 'label')
    expect(screen.getByText('Compose')).not.toHaveAttribute('aria-hidden')
    expect(extended).not.toContainElement(screen.getByTestId('icon'))
  })

  it('takes any element as the icon of an extended FAB too', () => {
    render(
      <Fab>
        <svg data-testid="icon" />
        <Text slot="label">Compose</Text>
      </Fab>,
    )
    const button = screen.getByRole('button', { name: 'Compose' })
    expect(button).toContainElement(screen.getByTestId('icon'))
    expect(screen.getByText('Compose')).not.toHaveAttribute('aria-hidden')
  })

  it('types its children as React Aria’s, anything or a function of the state it reports', () => {
    expectTypeOf<FabProps['children']>().toEqualTypeOf<
      ChildrenOrFunction<FabRenderProps> | undefined
    >()
  })

  it('draws its children as written: text outside the label slot is no label', () => {
    render(
      <Fab aria-label="Create">
        <svg data-testid="icon" />
        Compose
      </Fab>,
    )
    const button = screen.getByRole('button', { name: 'Create' })
    expect(button).toHaveTextContent('Compose')
    expect(button.querySelector('[slot="label"]')).not.toBeInTheDocument()
  })

  it('throws React Aria’s error for a Text in a slot it does not have, or in none', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <Fab>
          <Text slot="lable">Compose</Text>
        </Fab>,
      ),
    ).toThrow('Invalid slot "lable".')
    expect(() =>
      render(
        <Fab>
          <Text>Compose</Text>
        </Fab>,
      ),
    ).toThrow('A slot prop is required.')
    error.mockRestore()
  })

  it('takes its icon and label as a function too, whose label `extended` shows and hides', () => {
    const fab = (shown: boolean) => (
      <Fab aria-label="Create" isExtended={shown}>
        {({ isHovered }) => (
          <>
            <Icon name={isHovered ? 'edit' : 'add'} />
            <Text slot="label">Compose</Text>
          </>
        )}
      </Fab>
    )
    const { rerender } = render(fab(false))
    expect(screen.getByText('add')).toBeInTheDocument()
    expect(screen.getByText('Compose')).toHaveAttribute('aria-hidden', 'true')

    rerender(fab(true))
    expect(screen.getByText('add')).toBeInTheDocument()
    expect(screen.getByText('Compose')).not.toHaveAttribute('aria-hidden')
  })

  it('passes a function `isDisabled` as it is given, and no state of its own', () => {
    render(
      <Fab aria-label="Create" isDisabled>
        {(state) => <Icon name={`${state.isDisabled} ${'isExtended' in state}`} />}
      </Fab>,
    )
    expect(screen.getByRole('button', { name: 'Create' })).toHaveTextContent('true false')
  })

  it('passes a function the state React Aria reports of its button too', async () => {
    const user = userEvent.setup()
    render(
      <Fab aria-label="Create">
        {({ isHovered, isFocusVisible, isPressed }) => (
          <Icon
            name={`add${isHovered ? ' hover' : ''}${isFocusVisible ? ' focus' : ''}${isPressed ? ' active' : ''}`}
          />
        )}
      </Fab>,
    )
    const fab = screen.getByRole('button', { name: 'Create' })
    expect(fab).toHaveTextContent('add')
    await user.tab()
    expect(fab).toHaveTextContent('add focus')
    await user.hover(fab)
    expect(fab).toHaveTextContent('add hover focus')
    // A press takes the keyboard's focus ring with it: the pointer is the modality now.
    await user.pointer({ keys: '[MouseLeft>]', target: fab })
    expect(fab).toHaveTextContent('add hover active')
    await user.pointer({ keys: '[/MouseLeft]' })
    expect(fab).toHaveTextContent('add hover')
  })

  it('calls a function with the state as it changes, and draws what it returns for each', async () => {
    const user = userEvent.setup()
    const parts = vi.fn(({ isHovered }: FabRenderProps) => (
      <>
        <Icon name={isHovered ? 'edit' : 'add'} />
        {isHovered && <Text slot="label">Compose</Text>}
      </>
    ))
    render(<Fab aria-label="Create">{parts}</Fab>)
    const fab = screen.getByRole('button')
    expect(parts).toHaveBeenLastCalledWith(expect.objectContaining({ isHovered: false }))
    expect(fab).toHaveTextContent('add')
    expect(fab).toHaveAccessibleName('Create')
    await user.hover(fab)
    expect(parts).toHaveBeenLastCalledWith(expect.objectContaining({ isHovered: true }))
    // The label it returns for that state makes the FAB an extended one, as one given plainly
    // does: shown, and its name but for the aria-label, which names any FAB it is given to.
    expect(fab).toHaveTextContent('editCompose')
    expect(fab).toHaveAccessibleName('Create')
    expect(screen.getByText('Compose')).not.toHaveAttribute('aria-hidden')
  })

  it('types what a function is passed: the state React Aria reports', () => {
    expectTypeOf<keyof FabRenderProps>().toEqualTypeOf<
      'isHovered' | 'isPressed' | 'isFocused' | 'isFocusVisible' | 'isDisabled' | 'isPending'
    >()
    expectTypeOf<FabRenderProps[keyof FabRenderProps]>().toEqualTypeOf<boolean>()
  })

  it('passes the same to a function when it is an <a>, given elementType="a" and an href', () => {
    render(
      <Fab elementType="a" href="#top" aria-label="Top">
        {({ isFocused, isDisabled }) => <Icon name={`${isFocused} ${isDisabled}`} />}
      </Fab>,
    )
    expect(screen.getByRole('button', { name: 'Top' })).toHaveTextContent('false false')
  })

  it('draws the state layer and ripple, and hides the icon from assistive technology', () => {
    render(
      <Fab aria-label="Create">
        <Icon name="add" />
      </Fab>,
    )
    const button = screen.getByRole('button')
    expect(button.querySelector('.state-layer')).toBeInTheDocument()
    expect(screen.getByText('add')).toHaveAttribute('aria-hidden', 'true')
    expect(button).toHaveAccessibleName('Create')
  })

  describe('extended', () => {
    it('shows the label next to the icon, and is named by the label', () => {
      render(
        <Fab>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      const button = screen.getByRole('button', { name: 'Compose' })
      expect(button).toHaveTextContent('Compose')
      expect(button.querySelector('.state-layer')).toBeInTheDocument()
      expect(screen.getByText('edit')).toHaveAttribute('aria-hidden', 'true')
      // The icon ligature is not part of the name.
      expect(button).toHaveAccessibleName('Compose')
    })

    it('needs no aria-label, but accepts one', () => {
      render(
        <>
          <Fab>
            <Icon name="edit" />
            <Text slot="label">Compose</Text>
          </Fab>
          <Fab aria-label="Compose a new message">
            <Icon name="edit" />
            <Text slot="label">Compose</Text>
          </Fab>
        </>,
      )
      expect(screen.getByRole('button', { name: 'Compose a new message' })).toBeInTheDocument()
    })

    it('does not need an icon', () => {
      render(
        <Fab>
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      const button = screen.getByRole('button', { name: 'Compose' })
      expect(button.querySelector('.font-icon')).not.toBeInTheDocument()
    })

    it('draws its label in a slot of its own, after the ripple and the children before it', () => {
      render(
        <Fab>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      const button = screen.getByRole('button')
      const slot = screen.getByText('Compose').parentElement!
      expect(slot.parentElement).toBe(button)
      expect(slot.previousElementSibling).toBe(screen.getByText('edit'))
      expect(button.firstElementChild).toHaveClass('state-layer')
    })

    it('draws no label slot without a label, whatever `extended` is', () => {
      render(
        <Fab aria-label="Create" isExtended>
          <Icon name="edit" />
        </Fab>,
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName('Create')
      expect(button.querySelector('[slot="label"]')).not.toBeInTheDocument()
    })

    it('drops its label with its Text, which is the slot’s own', () => {
      const { rerender } = render(
        <Fab>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      expect(screen.getByRole('button')).toHaveAccessibleName('Compose')

      rerender(
        <Fab aria-label="Create">
          <Icon name="edit" />
        </Fab>,
      )
      expect(screen.getByRole('button')).toHaveAccessibleName('Create')
      expect(screen.queryByText('Compose')).not.toBeInTheDocument()
    })

    it('lets `extended` hide a label that is still in children, keeping it mounted and hidden from assistive technology', () => {
      render(
        <Fab aria-label="Create" isExtended={false}>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName('Create')
      expect(button).toHaveTextContent('Compose')
      expect(screen.getByText('Compose')).toHaveAttribute('aria-hidden', 'true')
    })

    it('toggles the same label in and out with `extended`, without children ever changing', () => {
      const { rerender } = render(
        <Fab aria-label="Create" isExtended={false}>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      expect(screen.getByRole('button')).toHaveAccessibleName('Create')

      rerender(
        <Fab isExtended>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      expect(screen.getByRole('button')).toHaveAccessibleName('Compose')
      expect(screen.getByText('Compose')).not.toHaveAttribute('aria-hidden')

      rerender(
        <Fab aria-label="Create" isExtended={false}>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      expect(screen.getByRole('button')).toHaveAccessibleName('Create')
      expect(screen.getByText('Compose')).toHaveAttribute('aria-hidden', 'true')
    })

    it('hides the label a function returns once it collapses', () => {
      // One function throughout, as one declared outside the component that renders the FAB is.
      const parts = ({ isDisabled }: FabRenderProps) => (
        <>
          <Icon name="send" />
          <Text slot="label">{isDisabled ? 'Sending' : 'Send'}</Text>
        </>
      )
      const { rerender } = render(<Fab>{parts}</Fab>)
      expect(screen.getByRole('button')).toHaveAccessibleName('Send')

      rerender(<Fab isDisabled>{parts}</Fab>)
      expect(screen.getByRole('button')).toHaveAccessibleName('Sending')

      rerender(
        <Fab aria-label="Send" isDisabled isExtended={false}>
          {parts}
        </Fab>,
      )
      expect(screen.getByText('Sending')).toHaveAttribute('aria-hidden', 'true')
    })

    it('calls onPress and shows the label of a disabled one as disabled', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <Fab onPress={onPress}>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      await user.click(screen.getByRole('button', { name: 'Compose' }))
      expect(onPress).toHaveBeenCalledTimes(1)

      rerender(
        <Fab onPress={onPress} isDisabled>
          <Icon name="edit" />
          <Text slot="label">Compose</Text>
        </Fab>,
      )
      await user.click(screen.getByRole('button', { name: 'Compose' }))
      expect(onPress).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('interaction', () => {
    it('calls onPress when clicked, and with Enter and Space', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <Fab aria-label="Create" onPress={onPress}>
          <Icon name="add" />
        </Fab>,
      )

      await user.click(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)

      // Clicking focused it, so the keyboard now acts on it.
      expect(screen.getByRole('button')).toHaveFocus()
      await user.keyboard('{Enter}')
      await user.keyboard(' ')
      expect(onPress).toHaveBeenCalledTimes(3)
    })

    it('does nothing when disabled, and cannot be focused', async () => {
      const onPress = vi.fn()
      const user = userEvent.setup()
      render(
        <Fab aria-label="Create" isDisabled onPress={onPress}>
          <Icon name="add" />
        </Fab>,
      )
      await user.click(screen.getByRole('button'))
      await user.tab()
      expect(onPress).not.toHaveBeenCalled()
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByRole('button')).not.toHaveFocus()
    })
  })

  it('forwards a custom class, other props and the ref', () => {
    let ref: Element | null = null
    render(
      <Fab
        aria-label="Create"
        className="bg-error"
        data-testid="b"
        ref={(node) => {
          ref = node
        }}
      >
        <Icon name="add" />
      </Fab>,
    )
    const button = screen.getByTestId('b')
    expect(ref).toBe(button)
  })

  it('renders its elementType, an <a> in the button role with the props of a link given "a", as React Aria has it, and takes className as a function of its state', () => {
    render(
      <>
        <Fab
          elementType="a"
          href="#top"
          target="_blank"
          rel="noreferrer"
          aria-label="Top"
          className={({ isDisabled }) => (isDisabled ? 'off' : 'on')}
        >
          <Icon name="arrow_upward" />
        </Fab>
        <Fab
          isDisabled
          aria-label="Create"
          className={({ isDisabled }) => (isDisabled ? 'off' : 'on')}
        >
          <Icon name="add" />
        </Fab>
        <Fab elementType="a" href="#top" isDisabled aria-label="Top, disabled">
          <Icon name="arrow_upward" />
        </Fab>
      </>,
    )
    const link = screen.getByRole('button', { name: 'Top' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '#top')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(link).toHaveClass('on')
    expect(screen.getByRole('button', { name: 'Create' })).toHaveClass('off')
    // Disabled, an <a> keeps no href and says so, as React Aria has it.
    const disabled = screen.getByRole('button', { name: 'Top, disabled' })
    expect(disabled).not.toHaveAttribute('href')
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
  })

  it('renders a component given as its elementType, with the props React Aria hands it and the ref', () => {
    let ref: Element | null = null
    const Link = (props: ComponentPropsWithRef<'a'>) => <a {...props} href="/compose" />
    render(
      <Fab
        elementType={Link}
        aria-label="Compose"
        ref={(node) => {
          ref = node
        }}
      >
        <Icon name="edit" />
      </Fab>,
    )
    const button = screen.getByRole('button', { name: 'Compose' })
    expect(button.tagName).toBe('A')
    expect(button).toHaveAttribute('href', '/compose')
    expect(ref).toBe(button)
  })
})
