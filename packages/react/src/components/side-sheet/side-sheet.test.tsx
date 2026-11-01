import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import {
  Heading,
  Text,
  type DialogProps,
  type SheetProps,
  type SheetRenderProps,
} from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Button } from '../button'
import {
  SheetTrigger,
  SideSheet,
  SideSheetHeader,
  type SideSheetProps,
  type SideSheetRenderProps,
} from '.'

/* Markup and behavior that jsdom can check without a stylesheet: what a sheet renders as, roles,
 * names, what closes it, where the focus goes, its parts, function children. Geometry, motion,
 * the scrolling that moves a modal sheet and what inert really stops: side-sheet.browser.test.tsx. */

const dialog = () => screen.getByRole('dialog')
const panel = () => screen.getByTestId('panel')
// A modal sheet's layer, React Aria's SheetOverlay, rendered at the end of the page, which holds
// the scrim first and then React Aria's scroller, with the container in it.
const layer = () => panel().closest('body > *')!
const scrim = () => layer().firstElementChild!
const close = () => screen.getByRole('button', { name: 'Close' })
const events = () => screen.getByRole('button', { name: 'Events' })

/**
 * Lets a modal sheet leave. React Aria takes jsdom for desktop Safari, for which it waits for
 * the end of the scroll that took the sheet out of sight before it removes it: ended here.
 */
async function gone() {
  for (const scroller of document.querySelectorAll('[data-sheet-scroll]'))
    scroller.dispatchEvent(new Event('scrollend'))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

/** A sheet with a header that names it and closes it, and a button in its content. */
function Sheet(props: SideSheetProps) {
  return (
    <SideSheet data-testid="panel" {...props}>
      <SideSheetHeader>
        <Heading slot="title">Filters</Heading>
        <Button slot="close">Close</Button>
      </SideSheetHeader>
      <button type="button">Events</button>
    </SideSheet>
  )
}

/** A modal sheet open in front of the page, which only its caller closes. */
const Modal = (props: SideSheetProps) => <Sheet isModal isOpen onOpenChange={() => {}} {...props} />

/** A button that opens a modal sheet, as React Aria's SheetTrigger around them has it. */
function Opener(props: SideSheetProps) {
  return (
    <SheetTrigger>
      <Button>Open</Button>
      <Sheet isModal {...props} />
    </SheetTrigger>
  )
}

/** A standard sheet at the end of a row, after the body, hidden until a button there shows it. */
function Shown(props: SideSheetProps) {
  const [isOpen, setOpen] = useState(false)
  return (
    <div data-testid="row">
      <main>
        <button type="button" onClick={() => setOpen(true)}>
          Info
        </button>
        <button type="button">Browse</button>
      </main>
      <Sheet isOpen={isOpen} onOpenChange={setOpen} {...props} />
    </div>
  )
}

describe('a modal sheet', () => {
  it('renders nothing while closed', () => {
    render(<Sheet isModal isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()
  })

  it('is opened by the SheetTrigger it is in, which says so, and closed by Escape', async () => {
    render(<Opener />)
    const opener = screen.getByRole('button', { name: 'Open' })
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(opener)
    expect(dialog()).toHaveAccessibleName('Filters')
    expect(opener).toHaveAttribute('aria-expanded', 'true')
    expect(opener).toHaveAttribute('aria-controls', dialog().id)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await gone()
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(opener).toHaveFocus())
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
    render(<Sheet isModal defaultOpen />)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await gone()
  })

  it('is React Aria’s sheet at the window’s end: the container over the scrim, holding the dialog, the column', () => {
    render(<Modal />)
    expect(layer()).toHaveClass('z-dialog')
    expect(layer()).toHaveAttribute('data-position', 'right')
    expect(scrim()).toHaveClass('bg-scrim/32')
    expect(layer()).toContainElement(panel())
    expect(panel()).not.toHaveAttribute('role')
    expect(panel()).toHaveClass('side-sheet', 'side-sheet-modal')
    expect(panel()).toContainElement(dialog())
    expect(dialog().tagName).toBe('SECTION')
    expect(dialog()).toHaveClass('side-sheet-column')
    expect(dialog()).toContainElement(events())
  })

  it('is named by its headline, React Aria’s Heading in the title slot, an h2', () => {
    render(<Modal />)
    const heading = screen.getByRole('heading', { name: 'Filters', level: 2 })
    expect(dialog()).toHaveAttribute('aria-labelledby', heading.id)
    expect(dialog()).toHaveAccessibleName('Filters')
  })

  it('takes a name of its own over its headline, which then takes no id', () => {
    render(<Modal aria-label="Labels" />)
    expect(dialog()).toHaveAccessibleName('Labels')
    expect(dialog()).not.toHaveAttribute('aria-labelledby')
    expect(screen.getByRole('heading', { name: 'Filters' })).not.toHaveAttribute('id')
  })

  it('takes another role it is given, and the names and description it is given, on the dialog', () => {
    render(
      <>
        <span id="title">Albums</span>
        <span id="about">The ones kept.</span>
        <Modal role="alertdialog" aria-labelledby="title" aria-describedby="about" />
      </>,
    )
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Albums')
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription('The ones kept.')
    expect(panel()).not.toHaveAttribute('aria-labelledby')
  })

  it('is described, as an alertdialog, by React Aria’s Text in the description slot', () => {
    render(
      <SideSheet isModal isOpen role="alertdialog">
        <Heading slot="title">Delete the collection?</Heading>
        <Text slot="description">Its files stay where they are.</Text>
      </SideSheet>,
    )
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Delete the collection?')
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription(
      'Its files stay where they are.',
    )
  })

  it('is closed by a Button in its close slot', async () => {
    const onOpenChange = vi.fn()
    render(<Modal onOpenChange={onOpenChange} />)
    await userEvent.click(close())
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

  it('takes the focus, and Tab lands on its close button first and stays in the sheet', async () => {
    render(<Modal />)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.tab()
    expect(close()).toHaveFocus()
    await userEvent.tab()
    expect(events()).toHaveFocus()
    await userEvent.tab()
    expect(close()).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(events()).toHaveFocus()
  })

  it('focuses what has autoFocus in it instead', async () => {
    render(
      <SideSheet isModal aria-label="Filters" isOpen>
        <button type="button">First</button>
        <button type="button" autoFocus>
          Second
        </button>
      </SideSheet>,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus())
  })

  it('is closed by a click on the scrim, and not by one in the sheet', async () => {
    const onOpenChange = vi.fn()
    render(<Modal onOpenChange={onOpenChange} />)
    await userEvent.click(events())
    await userEvent.click(panel())
    expect(onOpenChange).not.toHaveBeenCalled()
    await userEvent.click(scrim())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('is not closed by Escape or its scrim with preventDismissal, and still by its close button', async () => {
    const onOpenChange = vi.fn()
    render(<Modal preventDismissal onOpenChange={onOpenChange} />)
    await waitFor(() => expect(dialog()).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await userEvent.click(scrim())
    expect(onOpenChange).not.toHaveBeenCalled()
    await userEvent.click(close())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('is the only one closed by Escape when another is opened in front of it', async () => {
    const [outer, inner] = [vi.fn(), vi.fn()]
    render(
      <SheetTrigger onOpenChange={outer} defaultOpen>
        <Button>Files</Button>
        <SideSheet isModal aria-label="Outer">
          <SheetTrigger onOpenChange={inner}>
            <Button>More</Button>
            <SideSheet isModal aria-label="Inner" />
          </SheetTrigger>
        </SideSheet>
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
})

describe('the scrim', () => {
  it('comes with a modal sheet, before the container', () => {
    render(<Modal />)
    expect(scrim()).toHaveClass('bg-scrim/32')
    expect(scrim()).not.toContainElement(panel())
    expect(scrim().compareDocumentPosition(panel()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('is no part of a standard sheet', () => {
    render(<Sheet />)
    expect(document.querySelector('.bg-scrim\\/32')).toBeNull()
    expect(dialog()).toBe(panel())
  })
})

describe('a standard sheet', () => {
  it('is a dialog that is not modal, in place at the end of its row, beside a page that stays in use', () => {
    const { container } = render(
      <div data-testid="row">
        <main>
          <button type="button">Browse</button>
        </main>
        <Sheet />
      </div>,
    )
    expect(dialog()).toBe(panel())
    expect(panel().tagName).toBe('DIV')
    expect(dialog()).not.toHaveAttribute('aria-modal')
    expect(dialog()).toHaveAccessibleName('Filters')
    // Last in the row, between the hidden markers of React Aria's focus scope.
    const row = [...screen.getByTestId('row').children] as HTMLElement[]
    expect(row.filter((child) => !child.hidden).at(-1)).toBe(panel())
    expect(row.at(-1)).toHaveAttribute('data-focus-scope-end')
    expect(container).not.toHaveAttribute('aria-hidden')
    expect(container).not.toHaveAttribute('inert')
    expect(document.documentElement.style.overflow).toBe('')
    expect(screen.getByRole('button', { name: 'Browse' })).toBeInTheDocument()
  })

  it('is the container, which holds the column and takes the focus itself when nothing in it does', () => {
    render(<SideSheet aria-label="Info" data-testid="panel" />)
    expect(panel()).toHaveClass('side-sheet', 'side-sheet-standard')
    expect(panel()).not.toHaveClass('side-sheet-modal')
    expect(panel().children).toHaveLength(1)
    expect(panel().firstElementChild).toHaveClass('side-sheet-column')
    expect(panel()).toHaveAttribute('tabindex', '-1')
    expect(panel()).toHaveFocus()
  })

  it('is named by its headline, React Aria’s Heading in the title slot, an h2, each time it is shown', () => {
    const { rerender } = render(<Sheet isOpen={false} />)
    rerender(<Sheet />)
    const heading = screen.getByRole('heading', { name: 'Filters', level: 2 })
    expect(dialog()).toHaveAttribute('aria-labelledby', heading.id)
    expect(dialog()).toHaveAccessibleName('Filters')
  })

  it('takes a name of its own over its headline', () => {
    const { unmount } = render(<Sheet aria-label="Labels" />)
    expect(dialog()).toHaveAccessibleName('Labels')
    expect(dialog()).not.toHaveAttribute('aria-labelledby')
    unmount()
    render(
      <>
        <span id="title">Albums</span>
        <Sheet aria-labelledby="title" />
      </>,
    )
    expect(dialog()).toHaveAccessibleName('Albums')
  })

  it('takes the focus to its close button as it is shown, and gives it back once it is gone', async () => {
    render(<Shown />)
    await userEvent.click(screen.getByRole('button', { name: 'Info' }))
    expect(close()).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByRole('button', { name: 'Info' })).toHaveFocus())
  })

  it('does not keep the focus: Tab leaves it for what follows what showed it', async () => {
    render(<Shown />)
    await userEvent.click(screen.getByRole('button', { name: 'Info' }))
    await userEvent.tab()
    expect(events()).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Browse' })).toHaveFocus()
    expect(panel()).toBeInTheDocument()
  })

  it('is hidden by Escape in it, and not by a click outside it', async () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <button type="button">Browse</button>
        <Sheet onOpenChange={onOpenChange} />
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Browse' }))
    expect(screen.getByRole('button', { name: 'Browse' })).toHaveFocus()
    expect(onOpenChange).not.toHaveBeenCalled()
    await userEvent.click(events())
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('leaves Escape to the page when it cannot be hidden', async () => {
    const onKeyDown = vi.fn((event: KeyboardEvent) => event.defaultPrevented)
    document.addEventListener('keydown', onKeyDown)
    const { unmount } = render(<Sheet />)
    await userEvent.keyboard('{Escape}')
    expect(onKeyDown).toHaveLastReturnedWith(false)
    unmount()
    // One that can be is hidden by it, which goes no further.
    onKeyDown.mockClear()
    render(<Sheet onOpenChange={() => {}} />)
    await userEvent.keyboard('{Escape}')
    expect(onKeyDown).not.toHaveBeenCalled()
    document.removeEventListener('keydown', onKeyDown)
  })

  it('is hidden by a Button in its close slot, through its caller', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<Sheet onOpenChange={onOpenChange} />)
    await userEvent.click(close())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(panel()).toBeInTheDocument()
    // Without one, the button closes nothing.
    rerender(<Sheet />)
    await userEvent.click(close())
    expect(panel()).toBeInTheDocument()
  })

  it('is shown unless isOpen is false, when it is not rendered, and shown again', async () => {
    const { rerender } = render(<Sheet />)
    expect(panel()).toBeInTheDocument()
    rerender(<Sheet isOpen={false} />)
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
    rerender(<Sheet isOpen />)
    expect(panel()).toBeInTheDocument()
  })

  it('says it is entering as it comes in, and exiting as it leaves', async () => {
    // Entering as it mounts, which its ref sees, and open before the paint.
    const entering: boolean[] = []
    const { rerender } = render(
      <Sheet
        ref={(el) => {
          if (el) entering.push(el.hasAttribute('data-entering'))
        }}
      />,
    )
    expect(entering).toEqual([true])
    expect(panel()).not.toHaveAttribute('data-entering')
    rerender(<Sheet isOpen={false} />)
    expect(panel()).toHaveAttribute('data-exiting')
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
  })

  it('is inert as it leaves, and while shown only when it is told', async () => {
    const { rerender } = render(<Sheet inert />)
    expect(panel()).toHaveAttribute('inert')
    rerender(<Sheet />)
    expect(panel()).not.toHaveAttribute('inert')
    rerender(<Sheet isOpen={false} />)
    expect(panel()).toHaveAttribute('inert')
    await waitFor(() => expect(screen.queryByTestId('panel')).not.toBeInTheDocument())
  })

  it('takes another role it is given, as an alertdialog', () => {
    render(<Sheet role="alertdialog" />)
    expect(screen.getByRole('alertdialog')).toBe(panel())
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Filters')
  })

  it('becomes a modal one in front of the page with `modal`, and goes back', async () => {
    const { container, rerender } = render(<Sheet />)
    expect(dialog()).toBe(panel())
    rerender(<Sheet isModal isOpen />)
    expect(dialog()).toHaveAccessibleName('Filters')
    expect(panel()).not.toBe(dialog())
    expect(panel()).toContainElement(dialog())
    rerender(<Sheet />)
    expect(dialog()).toBe(panel())
    expect(container).not.toHaveAttribute('aria-hidden')
  })
})

describe('either sheet', () => {
  it('passes its children, given as a function, React Aria’s sheet’s state', async () => {
    const children = vi.fn(({ isExpanded }: SideSheetRenderProps) => (
      <p>{isExpanded ? 'Shown' : 'On its way'}</p>
    ))
    // Whether it is open, as React Aria's state of an overlay says, and all of it showing.
    const at = (isOpen: boolean, isExpanded: boolean) =>
      expect.objectContaining({ isExpanded, state: expect.objectContaining({ isOpen }) })
    const { rerender, unmount } = render(<SideSheet aria-label="Info">{children}</SideSheet>)
    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({ isEntering: true, position: 'right', swipeDirection: 'right' }),
    )
    await waitFor(() => expect(screen.getByText('Shown')).toBeInTheDocument())
    expect(children).toHaveBeenLastCalledWith(at(true, true))
    // Drawn as it leaves, not open.
    rerender(
      <SideSheet aria-label="Info" isOpen={false}>
        {children}
      </SideSheet>,
    )
    expect(children).toHaveBeenLastCalledWith(at(false, false))
    expect(children).toHaveBeenLastCalledWith(expect.objectContaining({ isExiting: true }))
    unmount()
    // React Aria says a modal one is expanded once all of it shows, which nothing does here.
    render(
      <SideSheet isModal isOpen>
        {children}
      </SideSheet>,
    )
    expect(children).toHaveBeenLastCalledWith(at(true, false))
    expectTypeOf<SideSheetRenderProps>().toEqualTypeOf<SheetRenderProps>()
  })

  it('closes from its children, given as a function, through its caller', async () => {
    const onOpenChange = vi.fn()
    render(
      <SideSheet aria-label="Info" onOpenChange={onOpenChange}>
        {({ state }) => (
          <button type="button" onClick={state.close}>
            Close
          </button>
        )}
      </SideSheet>,
    )
    await userEvent.click(close())
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  })

  it('takes className and style as functions of the same state, given React Aria’s default class too', () => {
    const own = (isOpen: boolean) => (
      <Sheet
        isOpen={isOpen}
        className={({ defaultClassName, isExpanded }) =>
          `${defaultClassName ?? 'none'} ${isExpanded ? 'is-shown' : 'is-moving'}`
        }
        style={({ defaultStyle, isExpanded }) => ({
          ...defaultStyle,
          opacity: isExpanded ? 1 : 0.5,
        })}
      />
    )
    const { rerender, unmount } = render(own(true))
    // A standard one is no React Aria component's, with no default class of its own: open before
    // the paint, all of it shows; as it leaves, not all of it does.
    expect(panel()).toHaveClass('none', 'is-shown', 'side-sheet')
    expect(getComputedStyle(panel()).opacity).toBe('1')
    rerender(own(false))
    expect(panel()).toHaveClass('none', 'is-moving', 'side-sheet')
    expect(getComputedStyle(panel()).opacity).toBe('0.5')
    unmount()
    render(
      <Modal
        className={({ defaultClassName, isExpanded }) =>
          `${defaultClassName} ${isExpanded ? 'is-shown' : 'is-moving'}`
        }
        style={({ defaultStyle, isExpanded }) => ({
          ...defaultStyle,
          opacity: isExpanded ? 1 : 0.5,
        })}
      />,
    )
    // React Aria's Sheet gives a function its Modal's, where its docs say react-aria-Sheet.
    expect(panel()).toHaveClass('react-aria-Modal', 'is-moving', 'side-sheet-modal')
    expect(getComputedStyle(panel()).opacity).toBe('0.5')
  })

  it('passes its props and ref to the container, a <div>, with a width of its own', () => {
    const ref = createRef<HTMLDivElement>()
    const onClick = vi.fn()
    const { unmount } = render(
      <Sheet ref={ref} id="info" className="side-sheet-width-90" onClick={onClick} />,
    )
    expect(ref.current).toBe(panel())
    expect(panel()).toHaveAttribute('id', 'info')
    expect(panel()).toHaveClass('side-sheet-width-90')
    panel().click()
    expect(onClick).toHaveBeenCalledOnce()
    unmount()
    render(<Modal ref={ref} id="filters" className="side-sheet-width-90" />)
    expect(ref.current).toBe(panel())
    expect(panel().tagName).toBe('DIV')
    expect(panel()).toHaveAttribute('id', 'filters')
    expect(panel()).toHaveClass('side-sheet-width-90')
  })

  it('takes React Aria’s props and its own, and no others', () => {
    // A modal sheet needs no onOpenChange: one without is closed only by its caller.
    void (<SideSheet isModal isOpen />)
    // React Aria's dialog's, as React Aria has them.
    expectTypeOf<SideSheetProps['role']>().toEqualTypeOf<DialogProps['role']>()
    // React Aria's sheet's, the container.
    expectTypeOf<SideSheetProps['className']>().toEqualTypeOf<SheetProps['className']>()
    expectTypeOf<SideSheetProps['style']>().toEqualTypeOf<SheetProps['style']>()
    expectTypeOf<SideSheetProps['children']>().toEqualTypeOf<SheetProps['children']>()
    // @ts-expect-error a sheet is a <div>, rendered as nothing else
    void (<SideSheet as="section" />)
    // @ts-expect-error nor does it take a <div>'s props that React Aria's dialog does not
    void (<SideSheet onKeyDown={() => {}} />)
    // @ts-expect-error nor the props it took before React Aria's: open and onClose
    void (<SideSheet open onClose={() => {}} />)
    // @ts-expect-error a side sheet has no snap points
    void (<SideSheet isModal snapPoints={[100]} />)
  })
})

describe('the header', () => {
  it('draws what it is given as written, the heading naming the sheet', () => {
    render(
      <SideSheet data-testid="panel">
        <SideSheetHeader data-testid="header" className="extra">
          <button type="button">Back</button>
          <Heading slot="title">Labels</Heading>
          <button type="button">Close</button>
        </SideSheetHeader>
      </SideSheet>,
    )
    const heading = screen.getByRole('heading', { name: 'Labels', level: 2 })
    expect(dialog()).toHaveAccessibleName('Labels')
    expect(dialog()).toHaveAttribute('aria-labelledby', heading.id)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('extra')
    expect(header.textContent).toBe('BackLabelsClose')
  })

  it('draws no heading of its own', () => {
    render(
      <SideSheet aria-label="Labels">
        <SideSheetHeader>
          <button type="button">Close</button>
        </SideSheetHeader>
      </SideSheet>,
    )
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(dialog()).not.toHaveAttribute('aria-labelledby')
  })

  // React Aria looks for the title once, as the sheet mounts.
  it('names the sheet by a heading drawn as the sheet is shown, not by one drawn later', async () => {
    function Later() {
      const [shown, setShown] = useState(false)
      return (
        <SideSheet aria-labelledby="none">
          {shown && (
            <SideSheetHeader>
              <Heading slot="title">Labels</Heading>
            </SideSheetHeader>
          )}
          <button type="button" onClick={() => setShown(true)}>
            Show
          </button>
        </SideSheet>
      )
    }
    render(<Later />)
    await userEvent.click(screen.getByRole('button', { name: 'Show' }))
    expect(screen.getByRole('heading', { name: 'Labels' })).not.toHaveAttribute('id')
    expect(dialog()).toHaveAttribute('aria-labelledby', 'none')
  })

  it('stands alone outside a sheet', () => {
    render(
      <SideSheetHeader>
        <Heading slot="title">Labels</Heading>
      </SideSheetHeader>,
    )
    expect(screen.getByRole('heading', { name: 'Labels' })).not.toHaveAttribute('id')
  })
})
