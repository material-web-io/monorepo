import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import {
  Dialog,
  DialogTrigger,
  Heading,
  Link,
  Text,
  TooltipTrigger as AriaTooltipTrigger,
} from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Button } from '../button'
import { Fab } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  PreviewTrigger,
  Tooltip,
  TooltipPopover,
  TooltipTrigger,
  type TooltipPopoverProps,
  type TooltipProps,
  type TooltipTriggerProps,
} from './tooltip'

/* Markup and behavior that jsdom can check without a stylesheet: React Aria's roles, when a
 * tooltip opens and closes, the keyboard, the triggers our buttons make and the props passed
 * through. Looks, placement and motion are in tooltip.browser.test.tsx. */

const tooltip = () => screen.queryByRole('tooltip')
const button = (name: string) => screen.getByRole('button', { name })

/** Time passing, as React Aria's delays count it. */
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

/* The fake clock, on which a test says how long passes. Testing Library waits a turn of the clock
 * after each event, and turns a fake one only when it is Jest's: a `jest` of Vitest's turns it.
 * React Aria shows tooltips at once while one was open lately, across the page: what is still open
 * closes after each test, by Escape or the pointer gone, and the cooldown that starts runs out. */
function useFakeClock() {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('jest', { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) })
  })
  afterEach(async () => {
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      document.dispatchEvent(new PointerEvent('pointermove', { clientX: 900, clientY: 900 }))
    })
    await wait(5000)
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
}

/** A user that waits on no clock, the fake one's time passing only as a test says. */
const setup = () => userEvent.setup({ delay: null })

/* React Aria treats a hover as the pointer's only once the pointer has moved: the first move onto
 * a trigger, in a page where it never moved before, opens nothing. So each hover starts off it. */
async function hover(user: ReturnType<typeof setup>, el: Element) {
  await user.pointer({ target: document.body })
  await user.hover(el)
}

function Favorite(props: Partial<TooltipTriggerProps> & { tooltip?: Partial<TooltipProps> }) {
  const { tooltip: tooltipProps, ...triggerProps } = props
  return (
    <TooltipTrigger {...triggerProps}>
      <IconButton aria-label="Favorite">
        <Icon name="star" />
      </IconButton>
      <Tooltip {...tooltipProps}>{tooltipProps?.children ?? 'Add to favorites'}</Tooltip>
    </TooltipTrigger>
  )
}

describe('Tooltip', () => {
  useFakeClock()

  it('is React Aria’s tooltip, a <div> in the tooltip role holding its text, opened 0.5s into a hover, where React Aria’s own trigger opens 1.5s in', async () => {
    const user = setup()
    render(<Favorite />)
    await hover(user, button('Favorite'))
    await wait(499)
    expect(tooltip()).toBeNull()
    await wait(1)
    expect(tooltip()!.tagName).toBe('DIV')
    expect(tooltip()).toHaveTextContent('Add to favorites')
    await user.unhover(button('Favorite'))

    const { unmount } = render(
      <AriaTooltipTrigger>
        <IconButton aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <Tooltip>Share</Tooltip>
      </AriaTooltipTrigger>,
    )
    await wait(5000)
    await hover(user, button('Share'))
    await wait(1499)
    expect(tooltip()).toBeNull()
    await wait(1)
    expect(tooltip()).toHaveTextContent('Share')
    unmount()
  })

  it('describes its trigger while it is open', async () => {
    const user = setup()
    render(<Favorite />)
    expect(button('Favorite')).not.toHaveAttribute('aria-describedby')
    await hover(user, button('Favorite'))
    await wait(500)
    expect(button('Favorite')).toHaveAttribute('aria-describedby', tooltip()!.id)
    expect(button('Favorite')).toHaveAccessibleDescription('Add to favorites')
  })

  it('closes 1.5s after the pointer leaves, where React Aria’s own trigger closes after 0.5s', async () => {
    const user = setup()
    render(<Favorite />)
    await hover(user, button('Favorite'))
    await wait(500)
    await user.unhover(button('Favorite'))
    await wait(1499)
    expect(tooltip()).not.toBeNull()
    await wait(1)
    expect(tooltip()).toBeNull()

    const { unmount } = render(
      <AriaTooltipTrigger>
        <IconButton aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <Tooltip>Share</Tooltip>
      </AriaTooltipTrigger>,
    )
    await wait(5000)
    await hover(user, button('Share'))
    await wait(1500)
    await user.unhover(button('Share'))
    await wait(500)
    expect(tooltip()).toBeNull()
    unmount()
  })

  it('stays open while the pointer is over it', async () => {
    const user = setup()
    render(<Favorite />)
    await hover(user, button('Favorite'))
    await wait(500)
    await user.hover(tooltip()!)
    await wait(5000)
    expect(tooltip()).not.toBeNull()
  })

  it('opens at once on keyboard focus, and closes at once as the focus leaves', async () => {
    const user = setup()
    render(
      <>
        <Favorite />
        <Button>Next</Button>
      </>,
    )
    await user.tab()
    expect(button('Favorite')).toHaveFocus()
    expect(tooltip()).toHaveTextContent('Add to favorites')
    await user.tab()
    expect(tooltip()).toBeNull()
  })

  it('closes on Escape, and on a press of its trigger', async () => {
    const user = setup()
    render(<Favorite />)
    await user.tab()
    await user.keyboard('{Escape}')
    expect(tooltip()).toBeNull()

    await hover(user, button('Favorite'))
    await wait(500)
    expect(tooltip()).not.toBeNull()
    await user.click(button('Favorite'))
    expect(tooltip()).toBeNull()
  })

  it('shows one at a time: the next trigger hovered while one is open swaps them at once', async () => {
    const user = setup()
    render(
      <>
        <Favorite />
        <TooltipTrigger>
          <IconButton aria-label="Share">
            <Icon name="share" />
          </IconButton>
          <Tooltip>Share</Tooltip>
        </TooltipTrigger>
      </>,
    )
    await hover(user, button('Favorite'))
    await wait(500)
    await user.hover(button('Share'))
    expect(screen.getAllByRole('tooltip')).toHaveLength(1)
    expect(tooltip()).toHaveTextContent('Share')
  })

  it('opens on any of our buttons, a Button, an IconButton or a Fab, which React Aria’s trigger finds by its focus', async () => {
    const user = setup()
    render(
      <>
        <TooltipTrigger>
          <Button variant="text">Edit</Button>
          <Tooltip>Edit the photo</Tooltip>
        </TooltipTrigger>
        <Favorite />
        <TooltipTrigger>
          <Fab aria-label="Compose">
            <Icon name="edit" />
          </Fab>
          <Tooltip>New message</Tooltip>
        </TooltipTrigger>
      </>,
    )
    for (const [name, description] of [
      ['Edit', 'Edit the photo'],
      ['Favorite', 'Add to favorites'],
      ['Compose', 'New message'],
    ]) {
      await user.tab()
      expect(button(name!)).toHaveAccessibleDescription(description!)
    }
  })

  it('shows none for a disabled TooltipTrigger, nor for a disabled button', async () => {
    const user = setup()
    render(
      <>
        <Favorite isDisabled />
        <TooltipTrigger>
          <IconButton aria-label="Delete" isDisabled>
            <Icon name="delete" />
          </IconButton>
          <Tooltip>Delete</Tooltip>
        </TooltipTrigger>
      </>,
    )
    await user.tab()
    expect(button('Favorite')).toHaveFocus()
    await hover(user, button('Favorite'))
    await hover(user, button('Delete'))
    await wait(500)
    expect(tooltip()).toBeNull()
  })

  it('opens and closes as its trigger is told, with isOpen and onOpenChange', async () => {
    const user = setup()
    const onOpenChange = vi.fn()
    const { rerender } = render(<Favorite isOpen={false} onOpenChange={onOpenChange} />)
    await hover(user, button('Favorite'))
    await wait(500)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(tooltip()).toBeNull()
    rerender(<Favorite isOpen onOpenChange={onOpenChange} />)
    expect(tooltip()).not.toBeNull()
  })

  it('holds a rich tooltip’s subhead and supporting text as written', () => {
    render(
      <Favorite
        defaultOpen
        tooltip={{
          variant: 'rich',
          children: (
            <>
              <Heading>Favorite</Heading>
              Find this later in your favorites.
            </>
          ),
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Favorite' })).toBeInTheDocument()
    expect(tooltip()).toHaveTextContent('FavoriteFind this later in your favorites.')
    expect(button('Favorite')).toHaveAccessibleDescription(
      'Favorite Find this later in your favorites.',
    )
  })

  it('passes React Aria’s className, a function of its state given the default class, its style, id and ref', () => {
    const ref = createRef<HTMLDivElement>()
    const className = vi.fn(
      ({ defaultClassName, placement }: { defaultClassName?: string; placement: unknown }) =>
        `${defaultClassName} mine-${placement === null ? 'none' : 'placed'}`,
    )
    render(
      <Favorite
        defaultOpen
        tooltip={{ ref, className, style: { color: 'red' }, 'aria-label': 'Hint' }}
      />,
    )
    expect(ref.current).toBe(tooltip())
    expect(tooltip()).toHaveClass('react-aria-Tooltip', 'mine-placed')
    expect(tooltip()).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    expect(tooltip()).toHaveAttribute('aria-label', 'Hint')
  })

  it('types its props as React Aria’s Tooltip’s with the M3 variant', () => {
    expectTypeOf<TooltipProps['variant']>().toEqualTypeOf<'plain' | 'rich' | undefined>()
    expectTypeOf<TooltipProps>().toHaveProperty('placement')
    expectTypeOf<TooltipProps>().toHaveProperty('ref')
    expectTypeOf<TooltipTriggerProps>().toHaveProperty('closeDelay')
    expectTypeOf<TooltipPopoverProps>().toHaveProperty('isNonModal')
  })
})

/** A rich tooltip with a link and a button, in a PreviewTrigger, the next button after it. */
function Permissions() {
  return (
    <>
      <PreviewTrigger>
        <IconButton aria-label="Permissions">
          <Icon name="lock" />
        </IconButton>
        <TooltipPopover>
          <Heading>Permissions</Heading>
          <Text>
            Visit <Link href="#settings">permission settings</Link> for details.
          </Text>
          <Button variant="text">Request access</Button>
        </TooltipPopover>
      </PreviewTrigger>
      <Button>Next</Button>
    </>
  )
}

const dialog = () => screen.queryByRole('dialog')

describe('TooltipPopover in a PreviewTrigger', () => {
  useFakeClock()

  it('opens 0.6s into a hover, a dialog the trigger says it opens and is described by', async () => {
    const user = setup()
    render(<Permissions />)
    expect(button('Permissions')).toHaveAttribute('aria-haspopup', 'dialog')
    expect(button('Permissions')).toHaveAttribute('aria-expanded', 'false')
    await hover(user, button('Permissions'))
    await wait(599)
    expect(dialog()).toBeNull()
    await wait(1)
    expect(dialog()).toHaveTextContent('Permissions')
    expect(button('Permissions')).toHaveAttribute('aria-expanded', 'true')
    // Among React Aria's own description of the long press that opens it on a touch screen.
    expect(button('Permissions').getAttribute('aria-describedby')!.split(' ')).toContain(
      dialog()!.id,
    )
  })

  it('closes 1.5s after the pointer leaves it and its trigger', async () => {
    const user = setup()
    render(<Permissions />)
    await hover(user, button('Permissions'))
    await wait(600)
    await user.pointer({ target: document.body, coords: { x: 900, y: 900 } })
    await wait(1499)
    expect(dialog()).not.toBeNull()
    await wait(1)
    expect(dialog()).toBeNull()
  })

  it('takes the focus by Tab from its trigger, through its link to its button, then on past the trigger', async () => {
    const user = setup()
    render(<Permissions />)
    await user.tab()
    expect(button('Permissions')).toHaveFocus()
    await wait(600)
    expect(dialog()).not.toBeNull()
    await user.tab()
    expect(screen.getByRole('link', { name: 'permission settings' })).toHaveFocus()
    await user.tab()
    expect(button('Request access')).toHaveFocus()
    await user.tab()
    expect(button('Next')).toHaveFocus()
  })
})

/** A persistent rich tooltip: pressed open, non-modal, its Dialog taking the focus. */
function Persistent({ onPress }: { onPress?: () => void }) {
  return (
    <>
      <DialogTrigger>
        <Button>Image quality</Button>
        <TooltipPopover isNonModal>
          <Dialog>
            <Heading slot="title">New settings available</Heading>
            <Text>Now you can adjust the uploaded image quality.</Text>
            <Button variant="text">Learn more</Button>
          </Dialog>
        </TooltipPopover>
      </DialogTrigger>
      <Button onPress={onPress}>Storage</Button>
    </>
  )
}

describe('TooltipPopover in a DialogTrigger', () => {
  it('opens on a press, not on a hover, and its Dialog, named by its subhead, takes the focus', async () => {
    const user = userEvent.setup()
    render(<Persistent />)
    await hover(user, button('Image quality'))
    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(dialog()).toBeNull()
    await user.click(button('Image quality'))
    expect(dialog()).toHaveAccessibleName('New settings available')
    expect(dialog()).toHaveFocus()
  })

  it('stays open as the pointer leaves, and closes on Escape, giving the focus back', async () => {
    const user = userEvent.setup()
    render(<Persistent />)
    await user.click(button('Image quality'))
    await user.unhover(button('Image quality'))
    await user.pointer({ target: document.body })
    expect(dialog()).not.toBeNull()
    await user.keyboard('{Escape}')
    expect(dialog()).toBeNull()
    await waitFor(() => expect(button('Image quality')).toHaveFocus())
  })

  it('closes as another element is pressed, which takes the press', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()
    render(<Persistent onPress={onPress} />)
    await user.click(button('Image quality'))
    await user.click(button('Storage'))
    expect(dialog()).toBeNull()
    expect(onPress).toHaveBeenCalledOnce()
  })
})
