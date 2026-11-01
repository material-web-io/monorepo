import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import {
  Heading,
  Text,
  type DialogProps,
  type DisclosureProps,
  type SheetProps,
  type SheetRenderProps,
} from 'react-aria-components'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Button } from '../button'
import { BottomSheet, SheetTrigger, type BottomSheetProps, type BottomSheetRenderProps } from '.'

/* Markup and behavior that jsdom can check without a stylesheet: what a sheet renders as, roles,
 * names, what closes it, what its drag handle does, function children. Geometry, motion, the
 * scrolling that moves a sheet and what inert really stops: bottom-sheet.browser.test.tsx. */

const dialog = () => screen.getByRole('dialog')
const handle = () => screen.getByRole('button', { name: 'Drag handle' })
const panel = () => screen.getByTestId('panel')
// A modal sheet's layer, React Aria's SheetOverlay, rendered at the end of the page, which holds
// the scrim first and then the container.
const layer = () => panel().closest('body > *')!
const scrim = () => layer().firstElementChild!
// A standard sheet's layer, which it scrolls in, around it, also at the end of the page.
const standardLayer = () => panel().parentElement!

/**
 * Lets a modal sheet leave. React Aria takes jsdom for desktop Safari, for which it waits for
 * the end of the scroll that took the sheet out of sight before it removes it: ended here.
 */
async function gone() {
  for (const scroller of document.querySelectorAll('[data-sheet-scroll]'))
    scroller.dispatchEvent(new Event('scrollend'))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

// jsdom lays nothing out: a sheet this tall, each of its detents as tall as the peek it is
// given, has two heights or more to rest at, as one taller than its peeks does in a browser.
const peek = [100]
const tall = () =>
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return parseFloat(this.style.getPropertyValue('--bottom-sheet-peek')) || 400
  })

afterEach(() => {
  vi.restoreAllMocks()
})

/** A modal sheet open in front of the page, which only its caller closes. */
function Modal(props: BottomSheetProps) {
  return (
    <BottomSheet
      isModal
      aria-label="Actions"
      isOpen
      onOpenChange={() => {}}
      data-testid="panel"
      {...props}
    >
      <button type="button">Share</button>
    </BottomSheet>
  )
}

function Standard(props: BottomSheetProps) {
  return (
    <BottomSheet aria-label="Player" data-testid="panel" snapPoints={peek} {...props}>
      <button type="button">Pause</button>
    </BottomSheet>
  )
}

/** A standard sheet hidden until a button before it on the page shows it. */
function Shown(props: BottomSheetProps) {
  const [isOpen, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Play
      </button>
      <button type="button">Browse</button>
      <Standard isOpen={isOpen} onOpenChange={setOpen} {...props} />
    </>
  )
}

/** A button that opens a modal sheet, as React Aria's SheetTrigger around them has it. */
function Opener(props: BottomSheetProps) {
  return (
    <SheetTrigger>
      <Button>Open</Button>
      <BottomSheet isModal aria-label="Actions" data-testid="panel" {...props}>
        <button type="button">Share</button>
      </BottomSheet>
    </SheetTrigger>
  )
}

describe('a modal sheet', () => {
  it('renders nothing while closed', () => {
    render(<Modal isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()
  })

  it('is opened by the SheetTrigger it is in, which says so, and closed by Escape', async () => {
    render(<Opener />)
    const opener = screen.getByRole('button', { name: 'Open' })
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(opener)
    expect(dialog()).toHaveAccessibleName('Actions')
    expect(opener).toHaveAttribute('aria-expanded', 'true')
    expect(opener).toHaveAttribute('aria-controls', dialog().id)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await gone()
    expect(opener).toHaveAttribute('aria-expanded', 'false')
  })

  it('is shown while isOpen, and asks onOpenChange to close, staying until it is told', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Modal onOpenChange={onOpenChange} />)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(dialog()).toBeInTheDocument()
    rerender(<Modal isOpen={false} onOpenChange={onOpenChange} />)
    await gone()
  })

  it('opens itself with defaultOpen, and closes itself', async () => {
    render(
      <BottomSheet isModal aria-label="Actions" defaultOpen>
        <button type="button">Share</button>
      </BottomSheet>,
    )
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await gone()
  })

  it('is React Aria’s sheet: the container over the scrim, holding the dialog, with its name', () => {
    render(<Modal />)
    expect(layer()).toHaveClass('z-dialog')
    expect(layer()).toHaveAttribute('data-position', 'bottom')
    expect(scrim()).toHaveClass('bg-scrim/32')
    expect(layer()).toContainElement(panel())
    expect(panel()).not.toHaveAttribute('role')
    expect(panel()).not.toHaveAttribute('aria-label')
    expect(panel()).toContainElement(dialog())
    expect(dialog().tagName).toBe('SECTION')
    expect(dialog()).toHaveAccessibleName('Actions')
    expect(dialog()).toContainElement(screen.getByRole('button', { name: 'Share' }))
  })

  it('takes another role it is given, as an alertdialog', () => {
    render(<Modal role="alertdialog" />)
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Actions')
  })

  it('is named by React Aria’s Heading in it, and as an alertdialog described by its Text', () => {
    const { unmount } = render(
      <BottomSheet isModal isOpen>
        <Heading slot="title">Share to</Heading>
        <Text slot="description">Pick an app.</Text>
      </BottomSheet>,
    )
    expect(dialog()).toHaveAccessibleName('Share to')
    expect(dialog()).not.toHaveAttribute('aria-describedby')
    unmount()
    render(
      <BottomSheet isModal isOpen role="alertdialog">
        <Heading slot="title">Delete the collection?</Heading>
        <Text slot="description">Its files stay where they are.</Text>
      </BottomSheet>,
    )
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Delete the collection?')
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      'Its files stay where they are.',
    )
  })

  it('is closed by a Button in its close slot', async () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet isModal aria-label="Actions" isOpen onOpenChange={onOpenChange}>
        <Button slot="close">Done</Button>
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('is rendered at the end of the page, outside what it is written in, in front of it', () => {
    render(
      <main data-testid="page">
        <Modal />
      </main>,
    )
    expect(screen.getByTestId('page')).not.toContainElement(panel())
    expect(layer().parentElement).toBe(document.body)
    const page = screen.getByTestId('page').parentElement!
    expect(page.compareDocumentPosition(layer()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  // Once it has come in: React Aria waits for that, so that it is not cut short on iOS.
  it('hides the page while it is open, and gives it back as it closes', async () => {
    const { container, rerender } = render(<Modal />)
    await waitFor(() => expect(container).toHaveAttribute('aria-hidden', 'true'))
    expect(layer().closest('[aria-hidden]')).toBeNull()
    rerender(<Modal isOpen={false} />)
    await gone()
    expect(container).not.toHaveAttribute('aria-hidden')
  })

  it('is inert as it leaves, and the container while shown only when it is told', async () => {
    const { rerender } = render(<Modal inert />)
    expect(panel()).toHaveAttribute('inert')
    rerender(<Modal />)
    expect(panel()).not.toHaveAttribute('inert')
    expect(dialog()).not.toHaveAttribute('inert')
    rerender(<Modal isOpen={false} />)
    expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('inert')
    await gone()
  })

  it('locks the page’s scrolling while it is open', async () => {
    const { rerender } = render(<Modal />)
    expect(document.documentElement.style.overflow).toBe('hidden')
    rerender(<Modal isOpen={false} />)
    await gone()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('takes the focus, and Tab lands on the drag handle first and stays in the sheet', async () => {
    render(<Modal />)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.tab()
    expect(handle()).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Share' })).toHaveFocus()
    await userEvent.tab()
    expect(handle()).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Share' })).toHaveFocus()
  })

  it('gives the focus back to its trigger once it is gone', async () => {
    render(<Opener />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await gone()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus())
  })

  it('focuses what has autoFocus in it instead', async () => {
    render(
      <BottomSheet isModal aria-label="Actions" isOpen>
        <button type="button">First</button>
        <button type="button" autoFocus>
          Second
        </button>
      </BottomSheet>,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus())
  })

  it('is closed by a click on the scrim, and not by one in the sheet', async () => {
    const onOpenChange = vi.fn()
    render(<Modal onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Share' }))
    await userEvent.click(panel())
    expect(onOpenChange).not.toHaveBeenCalled()
    await userEvent.click(scrim())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('is not closed by Escape, its scrim or its drag handle with preventDismissal', async () => {
    const onOpenChange = vi.fn()
    render(<Modal preventDismissal onOpenChange={onOpenChange} />)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await userEvent.click(scrim())
    expect(screen.queryByRole('button', { name: 'Drag handle' })).not.toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('is the only one closed by Escape when another is opened in front of it', async () => {
    const [outer, inner] = [vi.fn(), vi.fn()]
    render(
      <SheetTrigger onOpenChange={outer} defaultOpen>
        <Button>Files</Button>
        <BottomSheet isModal aria-label="Outer">
          <SheetTrigger onOpenChange={inner}>
            <Button>More</Button>
            <BottomSheet isModal aria-label="Inner" />
          </SheetTrigger>
        </BottomSheet>
      </SheetTrigger>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    expect(inner).toHaveBeenCalledExactlyOnceWith(true)
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Inner' })).toHaveFocus())
    // The outer sheet is behind the inner one, hidden with the rest of what is next to it.
    expect(screen.queryByRole('dialog', { name: 'Outer' })).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(inner).toHaveBeenLastCalledWith(false)
    expect(outer).not.toHaveBeenCalled()
  })

  it('is never full-screen, nor at a height its caller holds', () => {
    render(<Modal isFullScreen isExpanded defaultExpanded />)
    expect(panel()).not.toHaveAttribute('data-full-screen')
    expect(panel()).not.toHaveAttribute('data-expanded')
    expect(panel()).not.toHaveClass('bottom-sheet', 'bottom-sheet-full-screen')
    expect(panel()).toHaveClass('bottom-sheet-modal')
  })

  it('takes a width of its own in place of the sheet’s', () => {
    render(<Modal className="max-w-none" />)
    expect(panel()).toHaveClass('max-w-none', 'bottom-sheet-modal')
    expect(panel()).not.toHaveClass('max-w-160')
  })
})

describe('the scrim', () => {
  it('comes with a modal sheet, before the container', () => {
    render(<Modal />)
    expect(scrim()).toHaveClass('bg-scrim/32')
    expect(scrim()).not.toContainElement(panel())
    expect(scrim().compareDocumentPosition(panel()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is no part of a standard sheet', () => {
    render(<Standard />)
    expect(document.querySelector('.bg-scrim\\/32')).toBeNull()
    expect(dialog()).toBe(panel())
  })
})

describe('the drag handle', () => {
  it('is a button named Drag handle, a tab stop, that draws its own bar', () => {
    render(<Modal />)
    expect(handle().tagName).toBe('BUTTON')
    expect(handle()).toHaveAttribute('type', 'button')
    expect(handle()).not.toHaveAttribute('tabindex', '-1')
    expect(handle().querySelectorAll('span')).toHaveLength(2)
    expect(handle()).toHaveTextContent('')
  })

  it('takes a name in another language from dragHandleLabel', () => {
    render(<Standard dragHandleLabel="Poignée de déplacement" />)
    expect(screen.getByRole('button', { name: 'Poignée de déplacement' })).toBe(
      panel().querySelector('.bottom-sheet-content')!.firstElementChild,
    )
    expect(screen.queryByRole('button', { name: 'Drag handle' })).toBeNull()
  })

  it('comes first in a sheet of either kind, before what it holds, unless dragHandle is false', () => {
    const { rerender } = render(<Modal />)
    expect(dialog().firstElementChild).toBe(handle())
    rerender(<Modal hasDragHandle={false} />)
    expect(screen.queryByRole('button', { name: 'Drag handle' })).not.toBeInTheDocument()
    expect(dialog().firstElementChild).toHaveTextContent('Share')
    // A standard one holds them in an element of its own, as a modal one's dialog does.
    rerender(<Standard />)
    const content = panel().firstElementChild!
    expect(content).toHaveClass('bottom-sheet-content')
    expect(content.firstElementChild).toBe(handle())
    rerender(<Standard hasDragHandle={false} />)
    expect(screen.queryByRole('button', { name: 'Drag handle' })).not.toBeInTheDocument()
    expect(content.firstElementChild).toHaveTextContent('Pause')
  })

  it('closes a modal sheet, as its scrim does, for a click, Enter and Space', async () => {
    const onOpenChange = vi.fn()
    render(<Modal onOpenChange={onOpenChange} />)
    await userEvent.click(handle())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onOpenChange.mock.calls).toEqual([[false], [false], [false]])
  })

  it('is only drawn, with no name, on a modal sheet that cannot be dismissed', () => {
    render(<Modal preventDismissal />)
    const drawn = dialog().firstElementChild!
    expect(drawn.tagName).toBe('DIV')
    expect(drawn).toHaveAttribute('aria-hidden', 'true')
    expect(drawn.querySelectorAll('span')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Drag handle' })).not.toBeInTheDocument()
  })

  it('raises and lowers a standard sheet in turn', async () => {
    tall()
    const onExpandedChange = vi.fn()
    render(<Standard onExpandedChange={onExpandedChange} />)
    await userEvent.click(handle())
    expect(onExpandedChange).toHaveBeenLastCalledWith(true)
    expect(panel()).toHaveAttribute('data-expanded')
    await userEvent.click(handle())
    expect(onExpandedChange).toHaveBeenLastCalledWith(false)
    expect(panel()).not.toHaveAttribute('data-expanded')
    expect(onExpandedChange).toHaveBeenCalledTimes(2)
  })

  it('is selected with Space and Enter on a standard sheet', async () => {
    tall()
    const onExpandedChange = vi.fn()
    render(<Standard onExpandedChange={onExpandedChange} />)
    expect(handle()).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onExpandedChange).toHaveBeenLastCalledWith(true)
    await userEvent.keyboard(' ')
    expect(onExpandedChange).toHaveBeenLastCalledWith(false)
  })

  it('asks a standard sheet whose height its caller holds, which stays as it is until told', async () => {
    tall()
    const onExpandedChange = vi.fn()
    const { rerender } = render(<Standard isExpanded={false} onExpandedChange={onExpandedChange} />)
    await userEvent.click(handle())
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(panel()).not.toHaveAttribute('data-expanded')
    rerender(<Standard isExpanded onExpandedChange={onExpandedChange} />)
    expect(panel()).toHaveAttribute('data-expanded')
  })

  it('closes a standard sheet at its full height that can be closed, instead of lowering it', async () => {
    tall()
    const [onOpenChange, onExpandedChange] = [vi.fn(), vi.fn()]
    render(<Standard onOpenChange={onOpenChange} onExpandedChange={onExpandedChange} />)
    await userEvent.click(handle())
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true)
    await userEvent.click(handle())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(onExpandedChange).toHaveBeenCalledOnce()
  })

  it('closes a standard sheet that has one height to rest at and can be closed', async () => {
    const [onOpenChange, onExpandedChange] = [vi.fn(), vi.fn()]
    render(<Standard onOpenChange={onOpenChange} onExpandedChange={onExpandedChange} />)
    await userEvent.click(handle())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(onExpandedChange).not.toHaveBeenCalled()
  })

  it('does nothing to a standard sheet with one height to rest at and no way to close', async () => {
    const onExpandedChange = vi.fn()
    render(<Standard onExpandedChange={onExpandedChange} />)
    await userEvent.click(handle())
    expect(onExpandedChange).not.toHaveBeenCalled()
    expect(panel()).not.toHaveAttribute('data-expanded')
  })

  it('raises a standard sheet through its peeks, the next one up each time, and then lowers it', async () => {
    tall()
    const onExpandedChange = vi.fn()
    render(<Standard snapPoints={[100, 200]} onExpandedChange={onExpandedChange} />)
    await userEvent.click(handle())
    expect(onExpandedChange).not.toHaveBeenCalled()
    expect(panel()).not.toHaveAttribute('data-expanded')
    await userEvent.click(handle())
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(panel()).toHaveAttribute('data-expanded')
    await userEvent.click(handle())
    expect(onExpandedChange).toHaveBeenLastCalledWith(false)
    expect(panel()).not.toHaveAttribute('data-expanded')
    await userEvent.click(handle())
    expect(onExpandedChange).toHaveBeenCalledTimes(2)
  })

  it('closes a standard sheet with several peeks only at its full height', async () => {
    tall()
    const onOpenChange = vi.fn()
    render(<Standard snapPoints={[100, 200]} onOpenChange={onOpenChange} />)
    await userEvent.click(handle())
    await userEvent.click(handle())
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(panel()).toHaveAttribute('data-expanded')
    await userEvent.click(handle())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })
})

describe('a standard sheet', () => {
  it('is a dialog that is not modal, at the end of the page, which stays in use', () => {
    const { container } = render(
      <main data-testid="page">
        <button type="button">Browse</button>
        <Standard />
      </main>,
    )
    expect(dialog()).toBe(panel())
    expect(panel().tagName).toBe('DIV')
    expect(dialog()).toHaveAccessibleName('Player')
    expect(panel()).not.toHaveAttribute('aria-modal')
    expect(screen.getByTestId('page')).not.toContainElement(panel())
    expect(standardLayer().parentElement).toBe(document.body)
    expect(container).not.toHaveAttribute('aria-hidden')
    expect(container).not.toHaveAttribute('inert')
    expect(document.documentElement.style.overflow).toBe('')
    expect(screen.getByRole('button', { name: 'Browse' })).toBeInTheDocument()
  })

  it('is named by React Aria’s Heading in it in the title slot, each time it is shown', () => {
    const sheet = (isOpen: boolean) => (
      <BottomSheet isOpen={isOpen}>
        <Heading slot="title">Now playing</Heading>
      </BottomSheet>
    )
    const { rerender } = render(sheet(false))
    rerender(sheet(true))
    expect(dialog()).toHaveAccessibleName('Now playing')
    expect(screen.getByRole('heading', { name: 'Now playing' }).tagName).toBe('H2')
  })

  it('is the container, with one detent, 56dp for its peek', () => {
    render(<BottomSheet aria-label="Player" data-testid="panel" />)
    expect(panel()).toHaveClass(
      'bottom-sheet',
      'rounded-t-shape-xl',
      'bg-surface-container-low',
      'shadow-elevation-1',
    )
    expect(panel()).not.toHaveClass('bottom-sheet-modal')
    const detents = panel().lastElementChild!.children
    expect(detents).toHaveLength(1)
    expect((detents[0] as HTMLElement).style.getPropertyValue('--bottom-sheet-peek')).toBe(
      'var(--spacing-space-700)',
    )
  })

  it('is in a layer of its own, after what is above it there, marking where it rests', () => {
    render(<Standard />)
    expect(standardLayer()).toHaveClass('bottom-sheet-layer')
    expect(standardLayer().children).toHaveLength(2)
    const above = standardLayer().firstElementChild!
    expect(above).toHaveClass('bottom-sheet-above')
    expect(above).toHaveAttribute('aria-hidden', 'true')
    expect(above).toBeEmptyDOMElement()
    expect(standardLayer().lastElementChild).toBe(panel())
    // Where it rests partially expanded, last in it, after what it holds: a detent for each peek.
    const detents = panel().lastElementChild!
    expect(detents).toHaveClass('bottom-sheet-detents')
    expect(detents).toHaveAttribute('aria-hidden', 'true')
    expect(detents.children).toHaveLength(1)
    expect(detents.firstElementChild).toHaveClass('bottom-sheet-detent')
    expect(detents.firstElementChild).toBeEmptyDOMElement()
  })

  it('takes snapPoints of its own, a detent for each, numbers in pixels and lengths as they are', () => {
    render(<Standard snapPoints={[112, '50%', 'var(--spacing-space-900)']} />)
    const detents = [...panel().lastElementChild!.children] as HTMLElement[]
    expect(detents.map((detent) => detent.style.getPropertyValue('--bottom-sheet-peek'))).toEqual([
      '112px',
      '50%',
      'var(--spacing-space-900)',
    ])
  })

  it('is always at its full height with no snapPoints, which its drag handle cannot change', async () => {
    tall()
    const onExpandedChange = vi.fn()
    render(<Standard snapPoints={[]} isExpanded={false} onExpandedChange={onExpandedChange} />)
    expect(panel().lastElementChild!.children).toHaveLength(0)
    expect(panel()).toHaveAttribute('data-expanded')
    await userEvent.click(handle())
    expect(panel()).toHaveAttribute('data-expanded')
    expect(onExpandedChange).not.toHaveBeenCalled()
  })

  it('says it is entering as it comes in, and exiting as it leaves, its layer too', async () => {
    const { rerender } = render(<Standard />)
    for (const el of [panel(), standardLayer()]) expect(el).toHaveAttribute('data-entering')
    await waitFor(() => expect(panel()).not.toHaveAttribute('data-entering'))
    expect(standardLayer()).not.toHaveAttribute('data-entering')
    rerender(<Standard isOpen={false} />)
    for (const el of [panel(), standardLayer()]) expect(el).toHaveAttribute('data-exiting')
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
  })

  it('is shown unless `isOpen` is false, when it is not rendered', async () => {
    const { rerender } = render(<Standard />)
    expect(panel()).toBeInTheDocument()
    rerender(<Standard isOpen={false} />)
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
    rerender(<Standard isOpen />)
    expect(panel()).toBeInTheDocument()
  })

  it('is inert as it leaves, and while shown only when it is told', async () => {
    const { rerender } = render(<Standard inert />)
    expect(panel()).toHaveAttribute('inert')
    rerender(<Standard />)
    expect(panel()).not.toHaveAttribute('inert')
    rerender(<Standard isOpen={false} />)
    expect(panel()).toHaveAttribute('inert')
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
  })

  it('takes the focus to its drag handle as it is shown, and gives it back once it is gone', async () => {
    render(<Shown />)
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(handle()).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus())
  })

  it('takes the focus to what is first in it without a drag handle, or else to itself', () => {
    const { unmount } = render(<Standard hasDragHandle={false} />)
    expect(screen.getByRole('button', { name: 'Pause' })).toHaveFocus()
    unmount()
    render(<BottomSheet aria-label="Player" data-testid="panel" hasDragHandle={false} />)
    expect(panel()).toHaveFocus()
    expect(panel()).toHaveAttribute('tabindex', '-1')
  })

  it('does not keep the focus: Tab leaves it for what follows what showed it', async () => {
    render(<Shown />)
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Pause' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Browse' })).toHaveFocus()
    expect(panel()).toBeInTheDocument()
  })

  it('is hidden by Escape in it, and not by a click outside it', async () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <button type="button">Browse</button>
        <Standard onOpenChange={onOpenChange} />
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Browse' }))
    expect(screen.getByRole('button', { name: 'Browse' })).toHaveFocus()
    expect(onOpenChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('is hidden by a Button in its close slot, which does nothing when it cannot be', async () => {
    const onOpenChange = vi.fn()
    const { unmount } = render(
      <BottomSheet aria-label="Player" onOpenChange={onOpenChange}>
        <Button slot="close">Done</Button>
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    unmount()
    render(
      <BottomSheet aria-label="Player">
        <Button slot="close">Done</Button>
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(dialog()).toBeInTheDocument()
  })

  it('leaves Escape to the page when it cannot be hidden', async () => {
    const onKeyDown = vi.fn((event: KeyboardEvent) => event.defaultPrevented)
    document.addEventListener('keydown', onKeyDown)
    const { unmount } = render(<Standard />)
    await userEvent.keyboard('{Escape}')
    expect(onKeyDown).toHaveLastReturnedWith(false)
    unmount()
    // One that can be is hidden by it, which goes no further.
    onKeyDown.mockClear()
    render(<Standard onOpenChange={() => {}} />)
    await userEvent.keyboard('{Escape}')
    expect(onKeyDown).not.toHaveBeenCalled()
    document.removeEventListener('keydown', onKeyDown)
  })

  it('says whether it is expanded, as it is told or as it starts', () => {
    const { rerender } = render(<Standard />)
    expect(panel()).not.toHaveAttribute('data-expanded')
    rerender(<Standard isExpanded />)
    expect(panel()).toHaveAttribute('data-expanded')
    render(<Standard data-testid="other" defaultExpanded />)
    expect(screen.getByTestId('other')).toHaveAttribute('data-expanded')
  })

  it('takes a full height of its own, one at a time', () => {
    render(<Standard className="bottom-sheet-top-19 bottom-sheet-top-29" />)
    expect(panel()).toHaveClass('bottom-sheet-top-29')
    expect(panel()).not.toHaveClass('bottom-sheet-top-19')
  })

  it('says it is full-screen at its full height with `fullScreen`, and only then', () => {
    const { rerender } = render(<Standard isFullScreen isExpanded={false} />)
    expect(panel()).toHaveClass('bottom-sheet-full-screen')
    expect(panel()).not.toHaveAttribute('data-full-screen')
    rerender(<Standard isFullScreen isExpanded />)
    expect(panel()).toHaveAttribute('data-full-screen')
    rerender(<Standard isExpanded />)
    expect(panel()).not.toHaveAttribute('data-full-screen')
    expect(panel()).not.toHaveClass('bottom-sheet-full-screen')
  })

  it('is lowered from full-screen by its drag handle, and no longer full-screen', async () => {
    tall()
    render(<Standard isFullScreen defaultExpanded />)
    expect(panel()).toHaveAttribute('data-full-screen')
    await userEvent.click(handle())
    expect(panel()).not.toHaveAttribute('data-expanded')
    expect(panel()).not.toHaveAttribute('data-full-screen')
  })

  it('becomes a modal one in front of the page with `modal`, and goes back', async () => {
    const { container, rerender } = render(<Standard />)
    expect(dialog()).toBe(panel())
    rerender(<Standard isModal isOpen />)
    expect(dialog()).toHaveAccessibleName('Player')
    expect(panel()).not.toBe(dialog())
    expect(panel()).toContainElement(dialog())
    rerender(<Standard />)
    expect(dialog()).toBe(panel())
    expect(container).not.toHaveAttribute('aria-hidden')
  })
})

describe('either sheet', () => {
  it('passes its children, given as a function, React Aria’s sheet’s state', async () => {
    tall()
    const children = vi.fn(({ isExpanded }: BottomSheetRenderProps) => (
      <p>{isExpanded ? 'Up next' : 'Now playing'}</p>
    ))
    // Whether it is open, as React Aria's state of an overlay says, and expanded.
    const at = (isOpen: boolean, isExpanded: boolean) =>
      expect.objectContaining({ isExpanded, state: expect.objectContaining({ isOpen }) })
    const { rerender, unmount } = render(
      <BottomSheet aria-label="Player" snapPoints={peek}>
        {children}
      </BottomSheet>,
    )
    expect(screen.getByText('Now playing')).toBeInTheDocument()
    await userEvent.click(handle())
    expect(screen.getByText('Up next')).toBeInTheDocument()
    expect(children).toHaveBeenLastCalledWith(at(true, true))
    // Drawn as it leaves, not open.
    rerender(
      <BottomSheet aria-label="Player" snapPoints={peek} isOpen={false}>
        {children}
      </BottomSheet>,
    )
    expect(children).toHaveBeenLastCalledWith(at(false, true))
    expect(children).toHaveBeenLastCalledWith(expect.objectContaining({ isExiting: true }))
    unmount()
    // React Aria says a modal one is expanded once all of it shows, which nothing does here.
    render(
      <BottomSheet isModal isOpen>
        {children}
      </BottomSheet>,
    )
    expect(children).toHaveBeenLastCalledWith(at(true, false))
    expectTypeOf<BottomSheetRenderProps>().toEqualTypeOf<SheetRenderProps>()
  })

  it('closes from its children, given as a function, through its caller', async () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet aria-label="Player" onOpenChange={onOpenChange}>
        {({ state }) => (
          <button type="button" onClick={state.close}>
            Close
          </button>
        )}
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('takes className and style as functions of the same state, given React Aria’s default class too', () => {
    const own = (
      <Standard
        isExpanded
        className={({ defaultClassName, isExpanded }) =>
          `${defaultClassName ?? 'none'} ${isExpanded ? 'is-expanded' : 'is-partial'}`
        }
        style={({ defaultStyle, isExpanded }) => ({
          ...defaultStyle,
          opacity: isExpanded ? 1 : 0.5,
        })}
      />
    )
    const { unmount } = render(own)
    // A standard one is no React Aria component's, with no default class of its own.
    expect(panel()).toHaveClass('none', 'is-expanded', 'bottom-sheet')
    expect(getComputedStyle(panel()).opacity).toBe('1')
    unmount()
    render(
      <Modal
        className={({ defaultClassName, isExpanded }) =>
          `${defaultClassName} ${isExpanded ? 'is-expanded' : 'is-partial'}`
        }
        style={({ defaultStyle, isExpanded }) => ({
          ...defaultStyle,
          opacity: isExpanded ? 1 : 0.5,
        })}
      />,
    )
    // React Aria's Sheet gives a function its Modal's, where its docs say react-aria-Sheet.
    expect(panel()).toHaveClass('react-aria-Modal', 'is-partial', 'bottom-sheet-modal')
    expect(getComputedStyle(panel()).opacity).toBe('0.5')
  })

  it('passes its props and ref to the container, a <div>', () => {
    const ref = createRef<HTMLDivElement>()
    const onClick = vi.fn()
    const { unmount } = render(<Standard ref={ref} id="player" onClick={onClick} />)
    expect(ref.current).toBe(panel())
    expect(panel()).toHaveAttribute('id', 'player')
    panel().click()
    expect(onClick).toHaveBeenCalledOnce()
    unmount()
    render(<Modal ref={ref} id="actions" />)
    expect(ref.current).toBe(panel())
    expect(panel().tagName).toBe('DIV')
    expect(panel()).toHaveAttribute('id', 'actions')
  })

  it('takes React Aria’s props and its own, and no others', () => {
    // A modal sheet needs no onOpenChange: one without is closed only by its caller.
    void (<BottomSheet isModal isOpen />)
    // React Aria's dialog's and disclosure's, as React Aria has them.
    expectTypeOf<BottomSheetProps['role']>().toEqualTypeOf<DialogProps['role']>()
    expectTypeOf<BottomSheetProps['isExpanded']>().toEqualTypeOf<DisclosureProps['isExpanded']>()
    expectTypeOf<BottomSheetProps['onExpandedChange']>().toEqualTypeOf<
      DisclosureProps['onExpandedChange']
    >()
    // React Aria's sheet's, the container.
    expectTypeOf<BottomSheetProps['className']>().toEqualTypeOf<SheetProps['className']>()
    expectTypeOf<BottomSheetProps['style']>().toEqualTypeOf<SheetProps['style']>()
    expectTypeOf<BottomSheetProps['children']>().toEqualTypeOf<SheetProps['children']>()
    // @ts-expect-error a sheet is a <div>, rendered as nothing else
    void (<BottomSheet as="section" />)
    // @ts-expect-error nor does it take a <div>'s props that React Aria's dialog does not
    void (<BottomSheet onKeyDown={() => {}} />)
  })
})
