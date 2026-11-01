import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Heading, Text } from 'react-aria-components'
import { twMerge } from '../../lib/tv'
import { AppBar } from '../app-bar'
import { Button } from '../button'
import { Divider } from '../divider'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { Radio, RadioGroup } from '../radio'
import { TextField } from '../text-field'
import { Dialog, DialogTrigger } from '.'

// Every prop of Dialog, its own fullScreen, React Aria's Modal's and its Dialog's aria-label: the
// docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  subcomponents: { DialogTrigger },
  parameters: { layout: 'centered' },
  args: { isFullScreen: false, isDismissable: true, isKeyboardDismissDisabled: false },
  argTypes: {
    // Basic, or full-screen.
    isFullScreen: { control: 'boolean', table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    UNSTABLE_portalContainer: { control: false, table: { category: 'Behavior' } },
    UNSTABLE_deferUntilEntered: { control: false, table: { category: 'Behavior' } },
    UNSTABLE_overrideFocus: { control: false, table: { category: 'Behavior' } },
    // Whether it is open: kept by its DialogTrigger, or controlled by isOpen, or starting from
    // defaultOpen.
    isOpen: { control: 'boolean', table: { category: 'State' } },
    defaultOpen: { control: 'boolean', table: { category: 'State' } },
    // What closes it besides its actions: a click on the scrim, Escape.
    isDismissable: { control: 'boolean', table: { category: 'State' } },
    isKeyboardDismissDisabled: { control: 'boolean', table: { category: 'State' } },
    shouldCloseOnInteractOutside: { control: false, table: { category: 'State' } },
    // React Aria's entry and exit, held.
    isEntering: { control: 'boolean', table: { category: 'State' } },
    isExiting: { control: 'boolean', table: { category: 'State' } },
    // The name of one with no title, on the element in the role.
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    suppressHydrationWarning: { control: false, table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

// What these stories put in a basic dialog, drawn as the spec draws it: the headline 24dp in and
// 16dp above the content, the content scrolling between it and the actions, 24dp above them,
// and the actions a row at the trailing edge, 8dp apart, stacking upward when they don't fit.
const headline = 'm-0 px-space-300 pb-space-200 text-headline-sm text-on-surface'
const content = 'm-0 min-h-0 grow overflow-y-auto overscroll-contain px-space-300 pb-space-100'
const actions = `
  flex shrink-0 flex-wrap-reverse items-center justify-end gap-space-100 px-space-300
  pt-space-200
`

/** Opens the dialog from its trigger, as a click does, for a story that shows it open. */
const open =
  (name: string): Story['play'] =>
  async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name }))
  }

/**
 * The controls set the `Dialog`'s props, and its trigger's: `isOpen` and `defaultOpen` go on the
 * `DialogTrigger`, as React Aria has them when there is one. A basic dialog, or with
 * `fullScreen` a full-screen one, headed by a small app bar with its close button and action.
 */
export const Playground: Story = {
  render: ({ isOpen, defaultOpen, ...args }) => (
    <DialogTrigger key={String(defaultOpen)} isOpen={isOpen} defaultOpen={defaultOpen}>
      <Button variant="tonal">Use location</Button>
      <Dialog {...args}>
        {({ state }) => (
          <>
            {args.isFullScreen ? (
              <AppBar>
                <IconButton slot="leading" aria-label="Close" onPress={() => state.close()}>
                  <Icon name="close" />
                </IconButton>
                <Heading slot="headline">Use location service?</Heading>
                <Button slot="trailing" variant="text" onPress={() => state.close()}>
                  Agree
                </Button>
              </AppBar>
            ) : (
              <Heading slot="title" className={headline}>
                Use location service?
              </Heading>
            )}
            <Text
              slot="description"
              elementType="p"
              className={args.isFullScreen ? 'm-0 px-space-300 pt-space-300' : content}
            >
              Let this service help other apps determine your location. This means sharing anonymous
              location data, even when no apps are running.
            </Text>
            {!args.isFullScreen && (
              <div className={actions}>
                <Button variant="text" slot="close">
                  Disagree
                </Button>
                <Button variant="text" slot="close">
                  Agree
                </Button>
              </div>
            )}
          </>
        )}
      </Dialog>
    </DialogTrigger>
  ),
}

/**
 * A basic dialog, composed as React Aria composes one: the `DialogTrigger` around the button
 * that opens it and the `Dialog`, the scrim and the container. In it, React Aria's `Heading` in
 * the `title` slot names it, its `Text` in the `description` slot describes it, and two actions
 * at its trailing edge, the confirming one last, each close it (`slot="close"`): drawn by this
 * story's classes. It comes in as the guidelines' video draws it: down from above as its
 * container grows, what it holds fading in after. Escape and a click on the scrim close it too.
 */
export const Basic: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="tonal">Use location</Button>
      <Dialog {...args}>
        <Heading slot="title" className={headline}>
          Use location service?
        </Heading>
        <Text slot="description" elementType="p" className={content}>
          Let this service help other apps determine your location. This means sharing anonymous
          location data, even when no apps are running.
        </Text>
        <div className={actions}>
          <Button variant="text" slot="close">
            Disagree
          </Button>
          <Button variant="text" slot="close">
            Agree
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  ),
}

/** The basic dialog open. */
export const BasicOpen: Story = { ...Basic, play: open('Use location') }

const ringtones = ['None', 'Callisto', 'Ganymede', 'Luna', 'Europa', 'Titan', 'Io', 'Oberon']

/**
 * A list of choices longer than the window holds: the headline and the actions stay put and the
 * list scrolls between two dividers, which span the container. OK is disabled until a choice is
 * made; Cancel never is.
 */
export const ScrollingList: Story = {
  render: function Render(args) {
    const [ringtone, setRingtone] = useState<string | null>(null)
    return (
      <DialogTrigger>
        <Button variant="tonal">Phone ringtone</Button>
        <Dialog {...args} className="max-h-100">
          <Heading slot="title" className={headline}>
            Phone ringtone
          </Heading>
          <Divider />
          <RadioGroup
            aria-label="Phone ringtone"
            value={ringtone}
            onChange={setRingtone}
            className="flex min-h-0 grow flex-col overflow-y-auto overscroll-contain px-space-300"
          >
            {ringtones.map((name) => (
              <Radio
                key={name}
                value={name}
                className="flex h-12 items-center text-body-lg text-on-surface"
              >
                {name}
              </Radio>
            ))}
          </RadioGroup>
          <Divider />
          <div className={actions}>
            <Button variant="text" slot="close">
              Cancel
            </Button>
            <Button variant="text" slot="close" isDisabled={ringtone === null}>
              OK
            </Button>
          </div>
        </Dialog>
      </DialogTrigger>
    )
  },
  play: open('Phone ringtone'),
}

/**
 * Buttons too long to sit side by side stack, each at the trailing edge, the confirming one on
 * top.
 */
export const StackedActions: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="tonal">Speed boost</Button>
      <Dialog {...args} className="max-w-70">
        <Heading slot="title" className={headline}>
          Turn on speed boost?
        </Heading>
        <Text slot="description" elementType="p" className={content}>
          Speed boost compresses data sent to and from your phone to load maps and directions
          faster. Map details may appear lower resolution when you use speed boost.
        </Text>
        <div className={actions}>
          <Button variant="text" slot="close">
            No thanks
          </Button>
          <Button variant="text" slot="close">
            Turn on speed boost
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  ),
  play: open('Speed boost'),
}

/**
 * The headline is optional: a short question can be the supporting text alone. With no headline
 * to name it, the dialog is named by its trigger, as React Aria names one, unless it is given an
 * `aria-label`.
 */
export const TextOnly: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="tonal">Discard draft</Button>
      <Dialog {...args}>
        <Text slot="description" elementType="p" className={content}>
          Discard draft?
        </Text>
        <div className={actions}>
          <Button variant="text" slot="close">
            Cancel
          </Button>
          <Button variant="text" slot="close">
            Discard
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  ),
  play: open('Discard draft'),
}

/**
 * A `<form>` in the `Dialog`, around what it holds, as React Aria writes one: its confirming
 * action submits it, and Enter in its field does too, each closing the dialog by `state.close()`,
 * the state React Aria's Modal passes its children. The content starts 8dp lower, so the outlined
 * field's label, drawn over the field's top, is not cut off where the content scrolls.
 */
export const Form: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="tonal">Rename</Button>
      <Dialog {...args}>
        {({ state }) => (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              state.close()
            }}
          >
            <Heading slot="title" className={headline}>
              Rename file
            </Heading>
            <div className={twMerge(content, 'pt-space-100')}>
              <TextField
                label="File name"
                name="name"
                variant="outlined"
                defaultValue="Budget 2026"
                className="w-full"
              />
            </div>
            <div className={actions}>
              <Button variant="text" slot="close">
                Cancel
              </Button>
              <Button variant="text" type="submit">
                Rename
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </DialogTrigger>
  ),
  play: open('Rename'),
}

/**
 * The layer is a flex box across the window, and the container one of its items: its own
 * classes, the `Dialog`'s `className`, move a basic dialog's container out of the middle, here
 * to the bottom end, within the same margins.
 */
export const CustomPosition: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button variant="tonal">Delete photos</Button>
      <Dialog {...args} className="ms-auto self-end">
        <Heading slot="title" className={headline}>
          Permanently delete?
        </Heading>
        <Text slot="description" elementType="p" className={content}>
          Deleting the selected photos will also remove them from all synced devices.
        </Text>
        <div className={actions}>
          <Button variant="text" slot="close">
            Cancel
          </Button>
          <Button variant="text" slot="close">
            Delete
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  ),
  play: open('Delete photos'),
}

/**
 * A full-screen dialog fills the window, up to 560dp wide, and slides up into it. Its header is
 * a small app bar: the close button, the headline and Save. With no title, its trigger names it.
 * Whether it is open is kept here, in the `DialogTrigger`'s `isOpen`: closed with changes made,
 * by its close button, Escape or the scrim, a basic dialog in front of it asks whether to
 * discard them. That one is written beside the `DialogTrigger`, not in it, since a `Dialog` in a
 * `DialogTrigger` takes that trigger's.
 */
export const FullScreen: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    const [changed, setChanged] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const close = () => {
      setOpen(false)
      setConfirming(false)
      setChanged(false)
    }
    const leave = () => (changed ? setConfirming(true) : close())
    return (
      <>
        <DialogTrigger isOpen={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : leave())}>
          <Button variant="tonal">New event</Button>
          <Dialog {...args} isFullScreen>
            <AppBar>
              <IconButton slot="leading" aria-label="Close" onPress={leave}>
                <Icon name="close" />
              </IconButton>
              <Heading slot="headline">New event</Heading>
              <Button slot="trailing" variant="text" onPress={close}>
                Save
              </Button>
            </AppBar>
            <div className="flex flex-col gap-space-200 px-space-300 pt-space-300">
              {['Event name', 'Location', 'Guests', 'Description'].map((label) => (
                <TextField
                  key={label}
                  label={label}
                  variant="outlined"
                  className="w-full"
                  onChange={() => setChanged(true)}
                />
              ))}
            </div>
          </Dialog>
        </DialogTrigger>
        <Dialog isOpen={confirming} onOpenChange={setConfirming} aria-label="Discard draft">
          <Text slot="description" elementType="p" className={content}>
            Discard draft?
          </Text>
          <div className={actions}>
            <Button variant="text" slot="close">
              Cancel
            </Button>
            <Button variant="text" onPress={close}>
              Discard
            </Button>
          </div>
        </Dialog>
      </>
    )
  },
  play: open('New event'),
}
