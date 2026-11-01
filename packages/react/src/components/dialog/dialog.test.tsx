import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { Heading, Text } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { AppBar } from '../app-bar'
import { Button } from '../button'
import { Dialog, DialogTrigger, type DialogProps, type DialogTriggerProps } from '.'

/* Markup and behavior that jsdom can check without a stylesheet: what a dialog renders as, its
 * role, name and description, where the focus goes and what closes it. Geometry and motion:
 * dialog.browser.test.tsx. */

const dialog = () => screen.getByRole('alertdialog')
// The container, React Aria's Modal, which the Dialog's props and ref go on but the Dialog's own.
const container = () => screen.getByTestId('panel')
// The layer, React Aria's ModalOverlay, around the container.
const layer = () => container().parentElement!
// React Aria removes a closed dialog once its transitions end, at once here.
const gone = () => waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())

type BasicProps = { triggerProps?: Partial<DialogTriggerProps> } & DialogProps

/** A basic dialog with a headline, text and actions, opened by its trigger, Open, its actions closing it. */
function Basic({ triggerProps, ...props }: BasicProps) {
  return (
    <DialogTrigger {...triggerProps}>
      <Button>Open</Button>
      <Dialog data-testid="panel" {...props}>
        <Heading slot="title">Use location service?</Heading>
        <Text slot="description">Let this service help other apps.</Text>
        <div>
          <Button variant="text" slot="close">
            Disagree
          </Button>
          <Button variant="text" slot="close">
            Agree
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}

/** Renders a basic dialog and opens it from its trigger, as a click does. */
async function opened(props: BasicProps = {}) {
  const user = userEvent.setup()
  const result = render(<Basic {...props} />)
  await user.click(screen.getByRole('button', { name: 'Open' }))
  return { user, ...result }
}

describe('Dialog', () => {
  it('is an alert dialog, a section, named by a Heading in its title slot and described by a Text in its description slot', async () => {
    await opened()
    expect(dialog().tagName).toBe('SECTION')
    expect(dialog()).toHaveAccessibleName('Use location service?')
    expect(dialog()).toHaveAccessibleDescription('Let this service help other apps.')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Use location service?')
  })

  it('is opened by its trigger, which says so', async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', dialog().id)
  })

  it('leaves nothing where it is written, closed or open', async () => {
    const user = userEvent.setup()
    const { container: page } = render(<Basic />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    expect([...page.children]).toEqual([trigger])
    await user.click(trigger)
    expect([...page.children]).toEqual([trigger])
    expect(page.contains(dialog())).toBe(false)
  })

  it('gives its aria-label to the element in the role, which it names', async () => {
    await opened({ 'aria-label': 'Location' })
    expect(dialog()).toHaveAttribute('aria-label', 'Location')
    expect(dialog()).toHaveAccessibleName('Location')
    expect(container()).not.toHaveAttribute('aria-label')
  })

  it('is named by its trigger without a title, unless it has an aria-label', async () => {
    const user = userEvent.setup()
    const at = (label?: string) => (
      <DialogTrigger>
        <Button>Discard draft</Button>
        <Dialog aria-label={label}>
          <Text slot="description">Discard draft?</Text>
        </Dialog>
      </DialogTrigger>
    )
    const { unmount } = render(at())
    await user.click(screen.getByRole('button', { name: 'Discard draft' }))
    expect(dialog()).toHaveAccessibleName('Discard draft')
    unmount()
    render(at('Discard'))
    await user.click(screen.getByRole('button', { name: 'Discard draft' }))
    expect(dialog()).toHaveAccessibleName('Discard')
  })

  it('focuses itself as it opens, or what has autoFocus, and gives the focus back as it closes', async () => {
    const { user, unmount } = await opened()
    await waitFor(() => expect(dialog()).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Agree' }))
    await gone()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus())
    unmount()
    render(
      <Dialog isOpen aria-label="Rename">
        <button type="button">Cancel</button>
        <button type="button" autoFocus>
          Rename
        </button>
      </Dialog>,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Rename' })).toHaveFocus())
  })

  it('keeps the focus in it: Tab goes round its elements', async () => {
    const { user } = await opened()
    const [disagree, agree] = ['Disagree', 'Agree'].map((name) =>
      screen.getByRole('button', { name }),
    )
    await waitFor(() => expect(dialog()).toHaveFocus())
    await user.tab()
    expect(disagree).toHaveFocus()
    await user.tab()
    expect(agree).toHaveFocus()
    await user.tab()
    expect(disagree).toHaveFocus()
    await user.tab({ shift: true })
    expect(agree).toHaveFocus()
  })

  it('is closed by a button with slot="close", and by the state it passes its children', async () => {
    const { user } = await opened()
    await user.click(screen.getByRole('button', { name: 'Disagree' }))
    await gone()
    const onOpenChange = vi.fn()
    render(
      <Dialog isOpen onOpenChange={onOpenChange} aria-label="Rename">
        {({ state }) => (
          <button type="button" onClick={() => state.close()}>
            Done
          </button>
        )}
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('is closed by Escape and by a click on the scrim, not by one in its container', async () => {
    const onOpenChange = vi.fn()
    const { user } = await opened({ triggerProps: { onOpenChange } })
    onOpenChange.mockClear()
    await user.click(container())
    expect(onOpenChange).not.toHaveBeenCalled()
    // The scrim is the layer around the container.
    await user.click(layer())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await gone()
    await user.click(screen.getByRole('button', { name: 'Open' }))
    onOpenChange.mockClear()
    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    await gone()
  })

  it('is kept open by its scrim with isDismissable false, and by Escape with isKeyboardDismissDisabled', async () => {
    const { user } = await opened({ isDismissable: false, isKeyboardDismissDisabled: true })
    await user.click(layer())
    await user.keyboard('{Escape}')
    expect(dialog()).toBeInTheDocument()
  })

  it('stays open, whatever closes it, while its DialogTrigger is told it is', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<Basic triggerProps={{ isOpen: true, onOpenChange }} />)
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Agree' }))
    expect(onOpenChange.mock.calls).toEqual([[false], [false]])
    expect(dialog()).toBeInTheDocument()
    rerender(<Basic triggerProps={{ isOpen: false, onOpenChange }} />)
    await gone()
  })

  it('is open as it is told, without a trigger', async () => {
    const at = (isOpen: boolean) => (
      <Dialog isOpen={isOpen} onOpenChange={() => {}} aria-label="Discard">
        <button type="button">OK</button>
      </Dialog>
    )
    const { rerender } = render(at(false))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    rerender(at(true))
    expect(dialog()).toHaveAccessibleName('Discard')
    rerender(at(false))
    await gone()
  })

  it('hides the page around it from assistive technology', async () => {
    const user = userEvent.setup()
    render(
      <>
        <main data-testid="page">Map</main>
        <Basic />
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByTestId('page').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(dialog().closest('[aria-hidden="true"]')).toBeNull()
  })

  // React Aria's DialogTrigger gives the id it makes to any Dialog written in it, as the README says.
  it('takes the id of the DialogTrigger it is written in, another dialog’s too', async () => {
    const user = userEvent.setup()
    render(
      <DialogTrigger>
        <Button>New event</Button>
        <Dialog isFullScreen>
          <Dialog isOpen aria-label="Discard" />
        </Dialog>
      </DialogTrigger>,
    )
    await user.click(screen.getByRole('button', { name: 'New event' }))
    const outer = screen.getByRole('dialog', { hidden: true })
    const inner = screen.getByRole('alertdialog', { name: 'Discard', hidden: true })
    expect(inner).toHaveAttribute('id', outer.id)
  })

  it('holds a form of yours, which a submit button submits', async () => {
    const onSubmit = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
    const user = userEvent.setup()
    render(
      <Dialog isOpen aria-label="Rename">
        <form onSubmit={onSubmit}>
          <input name="name" aria-label="File name" defaultValue="Budget" />
          <Button variant="text" type="submit">
            Rename
          </Button>
        </form>
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Rename' }))
    expect(onSubmit).toHaveBeenCalledOnce()
    await user.type(screen.getByRole('textbox', { name: 'File name' }), '{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })
})

describe('the container', () => {
  it('is a div in a layer of its own that takes the other React Aria props and the ref', async () => {
    const ref = createRef<HTMLDivElement>()
    await opened({ 'data-x': 'y', ref } as BasicProps)
    expect(container().tagName).toBe('DIV')
    expect(container()).toHaveAttribute('data-x', 'y')
    expect(ref.current).toBe(container())
    expect(container()).toContainElement(dialog())
    expect(dialog()).not.toHaveAttribute('data-x')
    expect(layer().parentElement).toBe(document.body)
  })

  it('gives isEntering and isExiting to its layer, as React Aria’s Modal does, and isExiting to itself', () => {
    const at = (state: { isEntering?: boolean; isExiting?: boolean }) => (
      <Dialog isOpen data-testid="panel" aria-label="Discard" {...state} />
    )
    const { rerender } = render(at({ isEntering: true }))
    expect(layer()).toHaveAttribute('data-entering')
    rerender(at({ isExiting: true }))
    expect(layer()).toHaveAttribute('data-exiting')
    expect(container()).toHaveAttribute('data-exiting')
  })

  it('takes className as a function of its state, given React Aria’s default class too', async () => {
    await opened({
      className: ({ state, defaultClassName }) =>
        `${defaultClassName} m-space-100 ${state.isOpen ? 'is-open' : 'is-closed'}`,
    })
    expect(container()).toHaveClass('react-aria-Modal', 'm-space-100', 'is-open')
  })

  it('is inert as the dialog leaves, and while it is open only when it is told', async () => {
    // Its exit never ends, as a transition it waits for would: caught as it leaves.
    const at = (isOpen: boolean, inert?: boolean) => (
      <Dialog
        isOpen={isOpen}
        data-testid="panel"
        inert={inert}
        onExit={() => new Promise<void>(() => {})}
        aria-label="Discard"
      >
        <button type="button">OK</button>
      </Dialog>
    )
    const { rerender } = render(at(true, true))
    expect(container()).toHaveAttribute('inert')
    rerender(at(true))
    expect(container()).not.toHaveAttribute('inert')
    rerender(at(false))
    expect(container()).toHaveAttribute('data-exiting')
    expect(container()).toHaveAttribute('inert')
  })
})

describe('a full-screen dialog', () => {
  /** A full-screen dialog opened by New event, with an app bar: a close button, the headline and Save. */
  function FullScreen(props: DialogProps) {
    return (
      <DialogTrigger>
        <Button>New event</Button>
        <Dialog {...props} isFullScreen>
          {({ state }) => (
            <>
              <AppBar>
                <Button slot="leading" aria-label="Close" onPress={() => state.close()}>
                  x
                </Button>
                <Heading slot="headline">New event</Heading>
                <Button slot="trailing" variant="text">
                  Save
                </Button>
              </AppBar>
              <input aria-label="Event name" />
            </>
          )}
        </Dialog>
      </DialogTrigger>
    )
  }

  it('is a dialog, not an alert dialog, named by its trigger or its aria-label', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<FullScreen />)
    await user.click(screen.getByRole('button', { name: 'New event' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAccessibleName('New event')
    unmount()
    render(<FullScreen aria-label="Event" />)
    await user.click(screen.getByRole('button', { name: 'New event' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Event')
  })

  it('is named by a long headline in its content area, a Heading in its title slot', () => {
    render(
      <Dialog isFullScreen isOpen>
        <AppBar>
          <button type="button" slot="leading" aria-label="Close">
            x
          </button>
        </AppBar>
        <div>
          <Heading slot="title">Car insurance for adults over 25 years</Heading>
        </div>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toHaveAccessibleName(
      'Car insurance for adults over 25 years',
    )
  })

  it('has its header first, an app bar, its close button first in it, which closes it', async () => {
    const user = userEvent.setup()
    render(<FullScreen />)
    await user.click(screen.getByRole('button', { name: 'New event' }))
    const header = screen.getByRole('banner')
    expect(header.parentElement!.firstElementChild).toBe(header)
    expect([...header.querySelectorAll('button')].map((it) => it.textContent)).toEqual([
      'x',
      'Save',
    ])
    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
