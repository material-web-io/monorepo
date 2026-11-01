import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { Text, UNSTABLE_ToastQueue as ToastQueue } from 'react-aria-components'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Except } from '../../lib/aria'
import { Button } from '../button'
import { Icon } from '../icon'
import {
  Snackbar,
  SnackbarAction,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
  type SnackbarActionProps,
  type SnackbarCloseButtonProps,
  type SnackbarProps,
  type SnackbarQueueOptions,
  type SnackbarRegionProps,
} from './snackbar'

/* Markup and behavior that jsdom can check without a stylesheet: React Aria's roles and names,
 * the queue that shows one snackbar at a time, timeouts, the focus and the keys, and the props
 * passed through. Looks, placement and the view transition are in snackbar.browser.test.tsx. */

type Message = { text: string; description?: string; action?: string; hasClose?: boolean }

const snackbar = () => screen.queryByRole('alertdialog')
const button = (name: string) => screen.getByRole('button', { name })

/** A queue's region, each snackbar drawn from what it says, with the props given. */
function Snackbars({
  queue,
  region,
  ...props
}: Except<SnackbarProps<Message>, 'toast' | 'children'> & {
  queue: SnackbarQueue<Message>
  region?: Partial<SnackbarRegionProps<Message>>
}) {
  return (
    <SnackbarRegion {...region} queue={queue}>
      {({ toast }) => (
        <Snackbar {...props} toast={toast}>
          <SnackbarContent>
            <Text slot="title">{toast.content.text}</Text>
            {toast.content.description && (
              <Text slot="description">{toast.content.description}</Text>
            )}
          </SnackbarContent>
          {toast.content.action && (
            <SnackbarAction onPress={() => queue.close(toast.key)}>
              {toast.content.action}
            </SnackbarAction>
          )}
          {toast.content.hasClose && (
            <SnackbarCloseButton>
              <Icon name="close" />
            </SnackbarCloseButton>
          )}
        </Snackbar>
      )}
    </SnackbarRegion>
  )
}

/** Shows a snackbar, as an update outside React, and gives its key. */
function show(queue: SnackbarQueue<Message>, message: Message, options?: { timeout?: number }) {
  let key = ''
  act(() => {
    key = queue.add(message, options)
  })
  return key
}

/* The fake clock, on which a test says how long passes. Testing Library waits a turn of the clock
 * after each event, and turns a fake one only when it is Jest's: a `jest` of Vitest's turns it. */
function useFakeClock() {
  vi.useFakeTimers()
  vi.stubGlobal('jest', { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('SnackbarQueue', () => {
  it('is React Aria’s ToastQueue', () => {
    expect(new SnackbarQueue()).toBeInstanceOf(ToastQueue)
  })

  it('shows one snackbar at a time, the newest: the one it took the place of comes back once that one has closed', () => {
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    show(queue, { text: 'Photo archived' })
    const second = show(queue, { text: 'Email archived' })
    expect(screen.getAllByRole('alertdialog')).toHaveLength(1)
    expect(snackbar()).toHaveAccessibleName('Email archived')
    act(() => queue.close(second))
    expect(snackbar()).toHaveAccessibleName('Photo archived')
  })

  it('takes React Aria’s options, such as more snackbars shown at once', () => {
    const queue = new SnackbarQueue<Message>({ maxVisibleToasts: 2 })
    render(<Snackbars queue={queue} />)
    show(queue, { text: 'Photo archived' })
    show(queue, { text: 'Email archived' })
    expect(screen.getAllByRole('alertdialog')).toHaveLength(2)
  })

  it('closes a snackbar after its timeout, and calls its onClose', () => {
    vi.useFakeTimers()
    const queue = new SnackbarQueue<Message>()
    const onClose = vi.fn()
    render(<Snackbars queue={queue} />)
    act(() => void queue.add({ text: 'Photo archived' }, { timeout: 4000, onClose }))
    act(() => vi.advanceTimersByTime(3999))
    expect(snackbar()).not.toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(snackbar()).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps a snackbar with no timeout until it is closed', () => {
    vi.useFakeTimers()
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    const key = show(queue, { text: 'Email archived', action: 'Undo' })
    act(() => vi.advanceTimersByTime(60_000))
    expect(snackbar()).not.toBeNull()
    act(() => queue.close(key))
    expect(snackbar()).toBeNull()
  })

  it('pauses its timer while the pointer is on the snackbar, as React Aria’s does', async () => {
    useFakeClock()
    const user = userEvent.setup({ delay: null })
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    show(queue, { text: 'Photo archived' }, { timeout: 4000 })
    act(() => vi.advanceTimersByTime(1000))
    await user.hover(snackbar()!)
    act(() => vi.advanceTimersByTime(10_000))
    expect(snackbar()).not.toBeNull()
    await user.unhover(snackbar()!)
    act(() => vi.advanceTimersByTime(2999))
    expect(snackbar()).not.toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(snackbar()).toBeNull()
  })
})

describe('SnackbarRegion', () => {
  it('is React Aria’s ToastRegion: a landmark at the end of the page, named by its notifications, there only while one shows', () => {
    const queue = new SnackbarQueue<Message>()
    const { container } = render(<Snackbars queue={queue} />)
    expect(screen.queryByRole('region')).toBeNull()
    const key = show(queue, { text: 'Photo archived' })
    const region = screen.getByRole('region', { name: '1 notification.' })
    expect(region.parentElement).toBe(document.body)
    expect(container).not.toContainElement(region)
    expect(region).toContainElement(snackbar())
    act(() => queue.close(key))
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('takes the focus by F6, from anywhere on the page', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(
      <>
        <Button>Archive</Button>
        <Snackbars queue={queue} />
      </>,
    )
    await user.click(button('Archive'))
    show(queue, { text: 'Photo archived' })
    await user.keyboard('{F6}')
    expect(screen.getByRole('region')).toHaveFocus()
  })

  it('passes React Aria’s className, a function of its state given the default class, its aria-label and ref', () => {
    const queue = new SnackbarQueue<Message>()
    const ref = createRef<HTMLDivElement>()
    const className = vi.fn(
      ({
        defaultClassName,
        visibleToasts,
      }: {
        defaultClassName?: string
        visibleToasts: unknown[]
      }) => `${defaultClassName} shown-${visibleToasts.length}`,
    )
    render(<Snackbars queue={queue} region={{ ref, className, 'aria-label': 'Updates' }} />)
    show(queue, { text: 'Photo archived' })
    const region = screen.getByRole('region', { name: 'Updates' })
    expect(region).toBe(ref.current)
    expect(region).toHaveClass('react-aria-ToastRegion', 'shown-1', 'snackbar-region')
  })
})

describe('Snackbar', () => {
  it('is React Aria’s Toast: an alertdialog named by its title and described by its description, its text an alert', () => {
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    show(queue, { text: 'Photo archived', description: 'Find it in your archive.' })
    expect(snackbar()).toHaveAccessibleName('Photo archived')
    expect(snackbar()).toHaveAccessibleDescription('Find it in your archive.')
    expect(snackbar()).toHaveAttribute('aria-modal', 'false')
    expect(snackbar()).toHaveAttribute('tabindex', '0')
    const content = screen.getByRole('alert')
    expect(content).toHaveAttribute('aria-atomic', 'true')
    expect(content).toHaveTextContent('Photo archived')
  })

  it('appears without moving the focus', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(
      <>
        <Button onPress={() => queue.add({ text: 'Email archived', action: 'Undo' })}>
          Archive
        </Button>
        <Snackbars queue={queue} />
      </>,
    )
    await user.click(button('Archive'))
    expect(snackbar()).not.toBeNull()
    expect(button('Archive')).toHaveFocus()
  })

  it('closes on its SnackbarCloseButton, in the close slot', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    show(queue, { text: 'Connection restored', hasClose: true })
    expect(button('Close')).toHaveAttribute('slot', 'close')
    await user.click(button('Close'))
    expect(snackbar()).toBeNull()
  })

  it('leaves its action to the caller, which closes it here', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    show(queue, { text: 'Email archived', action: 'Undo' })
    await user.click(button('Undo'))
    expect(snackbar()).toBeNull()
  })

  it('takes the focus in the page’s order, through its action to its close button, and lets it go on', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(
      <>
        <Button>Archive</Button>
        <Snackbars queue={queue} />
      </>,
    )
    show(queue, { text: 'Email archived', action: 'Undo', hasClose: true })
    await user.click(button('Archive'))
    await user.tab()
    expect(snackbar()).toHaveFocus()
    await user.tab()
    expect(button('Undo')).toHaveFocus()
    await user.tab()
    expect(button('Close')).toHaveFocus()
    await user.tab()
    expect(snackbar()).not.toContainElement(document.activeElement as HTMLElement)
  })

  it('closes on Escape while it or a button in it has the focus, giving the focus back to where it was', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(
      <>
        <Button>Archive</Button>
        <Snackbars queue={queue} />
      </>,
    )
    show(queue, { text: 'Email archived', action: 'Undo' })
    show(queue, { text: 'Photo archived', action: 'Undo' })
    await user.click(button('Archive'))
    await user.tab()
    await user.keyboard('{Escape}')
    expect(snackbar()).toHaveAccessibleName('Email archived')
    await user.tab()
    expect(button('Undo')).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(snackbar()).toBeNull()
    expect(button('Archive')).toHaveFocus()
  })

  it('stays on Escape elsewhere', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(
      <>
        <Button>Archive</Button>
        <Snackbars queue={queue} />
      </>,
    )
    show(queue, { text: 'Email archived', action: 'Undo' })
    await user.click(button('Archive'))
    await user.keyboard('{Escape}')
    expect(snackbar()).not.toBeNull()
  })

  it('passes React Aria’s className, a function of its state given the default class, its style, aria-label and ref; its title still names it', () => {
    const queue = new SnackbarQueue<Message>()
    const ref = createRef<HTMLDivElement>()
    const className = vi.fn(
      ({ defaultClassName, isFocused }: { defaultClassName?: string; isFocused: boolean }) =>
        `${defaultClassName} ${isFocused ? 'focused' : 'idle'}`,
    )
    render(
      <Snackbars
        queue={queue}
        ref={ref}
        className={className}
        style={{ color: 'red' }}
        aria-label="Archive status"
      />,
    )
    const key = show(queue, { text: 'Photo archived' })
    expect(snackbar()).toBe(ref.current)
    expect(snackbar()).toHaveClass('react-aria-Toast', 'idle', 'snackbar')
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ toast: expect.objectContaining({ key }) }),
    )
    expect(snackbar()).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    // React Aria labels it by its title all the same, which outweighs an aria-label.
    expect(snackbar()).toHaveAttribute('aria-label', 'Archive status')
    expect(snackbar()).toHaveAccessibleName('Photo archived')
  })

  it('types its props as React Aria’s Toast’s, and the queue’s options as its ToastQueue’s', () => {
    expectTypeOf<SnackbarProps<Message>['toast']['content']>().toEqualTypeOf<Message>()
    expectTypeOf<SnackbarProps<Message>>().toHaveProperty('ref')
    expectTypeOf<SnackbarRegionProps<Message>>().toHaveProperty('queue')
    expectTypeOf<SnackbarQueueOptions>().toHaveProperty('maxVisibleToasts')
    expectTypeOf<SnackbarQueueOptions>().toHaveProperty('wrapUpdate')
  })
})

describe('SnackbarContent', () => {
  it('is React Aria’s ToastContent, with its className and ref', () => {
    const queue = new SnackbarQueue<Message>()
    const ref = createRef<HTMLDivElement>()
    render(
      <SnackbarRegion queue={queue}>
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent ref={ref} className="grow-0">
              <Text slot="title">{toast.content.text}</Text>
            </SnackbarContent>
          </Snackbar>
        )}
      </SnackbarRegion>,
    )
    show(queue, { text: 'Photo archived' })
    expect(screen.getByRole('alert')).toBe(ref.current)
    expect(ref.current).toHaveClass('snackbar-content', 'grow-0')
  })
})

describe('SnackbarAction', () => {
  it('is React Aria’s Button, a <button type="button"> named by its label, its onPress yours', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()
    render(<SnackbarAction onPress={onPress}>Undo</SnackbarAction>)
    expect(button('Undo').tagName).toBe('BUTTON')
    expect(button('Undo')).toHaveAttribute('type', 'button')
    await user.click(button('Undo'))
    expect(onPress).toHaveBeenCalledOnce()
  })

  it('passes React Aria’s className, a function of its state given the default class, and ref', async () => {
    const user = userEvent.setup()
    const ref = createRef<HTMLButtonElement>()
    render(
      <SnackbarAction
        ref={ref}
        className={({ defaultClassName, isFocusVisible }) =>
          `${defaultClassName} ${isFocusVisible ? 'keyboard' : 'idle'}`
        }
      >
        Undo
      </SnackbarAction>,
    )
    expect(button('Undo')).toBe(ref.current)
    expect(button('Undo')).toHaveClass('react-aria-Button', 'idle', 'snackbar-action')
    await user.tab()
    expect(button('Undo')).toHaveClass('keyboard')
  })
})

describe('SnackbarCloseButton', () => {
  it('is React Aria’s Button in the close slot, which names it Close and closes the snackbar', async () => {
    const user = userEvent.setup()
    const queue = new SnackbarQueue<Message>()
    render(<Snackbars queue={queue} />)
    show(queue, { text: 'Connection restored', hasClose: true })
    expect(button('Close')).toHaveAttribute('slot', 'close')
    expect(button('Close')).toHaveAttribute('aria-label', 'Close')
    await user.click(button('Close'))
    expect(snackbar()).toBeNull()
  })

  it('takes a name of its own, and a ref', () => {
    const queue = new SnackbarQueue<Message>()
    const ref = createRef<HTMLButtonElement>()
    render(
      <SnackbarRegion queue={queue}>
        {({ toast }) => (
          <Snackbar toast={toast}>
            <SnackbarContent>
              <Text slot="title">{toast.content.text}</Text>
            </SnackbarContent>
            <SnackbarCloseButton ref={ref} aria-label="Dismiss">
              <Icon name="close" />
            </SnackbarCloseButton>
          </Snackbar>
        )}
      </SnackbarRegion>,
    )
    show(queue, { text: 'Connection restored' })
    expect(button('Dismiss')).toBe(ref.current)
    expect(button('Dismiss')).toHaveClass('snackbar-close-button')
  })

  it('types both buttons’ props as React Aria’s Button’s, from its hooks', () => {
    expectTypeOf<SnackbarActionProps>().toHaveProperty('onPress')
    expectTypeOf<SnackbarActionProps>().toHaveProperty('elementType')
    expectTypeOf<SnackbarCloseButtonProps>().toHaveProperty('slot')
  })
})
