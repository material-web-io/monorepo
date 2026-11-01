import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentType } from 'react'
import { UNSAFE_PortalProvider } from 'react-aria'
import { Text } from 'react-aria-components'
import type { Except } from '../../lib/aria'
import { Button } from '../button'
import { Fab } from '../fab'
import { Icon } from '../icon'
import {
  Snackbar,
  SnackbarAction,
  SnackbarCloseButton,
  SnackbarContent,
  SnackbarQueue,
  SnackbarRegion,
  type SnackbarProps,
  type SnackbarRegionProps,
} from './snackbar'

// What a story's snackbar says: its text, its action's label if any, and whether it has a close
// button.
type Message = { text: string; action?: string; hasClose?: boolean }

// The stories' args are the Snackbar's, React Aria's Toast's, but the toast it draws and its
// children, which each story's region gives it.
type Args = Except<SnackbarProps<Message>, 'toast' | 'children'>

// Every prop of Snackbar, React Aria's Toast's: the docgen reads none of them from the imported
// types, so each is listed here. The toast and children are the region's, so not its args.
const meta = {
  title: 'Components/Snackbar',
  component: Snackbar as ComponentType<Args>,
  parameters: { layout: 'padded' },
  argTypes: {
    // By default, named by its title Text and described by its description Text.
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    render: { control: false, table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Meta<Args>>

/** The region, with the props given it, and its snackbars, drawn from what each one says. */
function Snackbars({
  queue,
  region,
  ...args
}: Args & { queue: SnackbarQueue<Message>; region?: Partial<SnackbarRegionProps<Message>> }) {
  return (
    <SnackbarRegion {...region} queue={queue}>
      {({ toast }) => (
        <Snackbar {...args} toast={toast}>
          <SnackbarContent>
            <Text slot="title">{toast.content.text}</Text>
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

const playground = new SnackbarQueue<Message>()

const examples: [string, Message][] = [
  ['Single line', { text: 'Photo archived' }],
  ['With action', { text: 'Email archived', action: 'Undo' }],
  ['With close', { text: 'Connection restored', hasClose: true }],
  [
    'With action and close',
    { text: 'Photo added to “Natural Light” album', action: 'View', hasClose: true },
  ],
  [
    'Two lines',
    { text: 'The item already has the label “travel.” Add a new label, or choose another one.' },
  ],
  [
    'Longer action',
    {
      text: 'Can’t add photo to your favorites',
      action: 'Learn more about storage',
      hasClose: true,
    },
  ],
]

/** Each button shows a snackbar at the bottom of the window, which stays until its action or close button is pressed, or Escape while it has the focus; F6 moves the focus to it. One added while another shows takes its place, which comes back after. */
export const Playground: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-space-100">
      {examples.map(([label, message]) => (
        <Button key={label} variant="outlined" onPress={() => playground.add(message)}>
          {label}
        </Button>
      ))}
      <Snackbars {...args} queue={playground} />
    </div>
  ),
}

/** The spec's five configurations, 344dp wide, as the kit's examples draw them, without and with a close button: single line, single line with action, two lines, two lines with action, two lines with a longer action, which goes below the text. Shown in place, in regions of their own, each named for its configuration. */
export const Configurations: Story = {
  render: (args) => <Gallery {...args} />,
}

const configurations: Message[] = [
  { text: 'Single-line snackbar' },
  { text: 'Single-line snackbar with action', action: 'Action' },
  { text: 'Two-line snackbar without action, its text past one line' },
  { text: 'Two-line snackbar with action, its text past one line', action: 'Action' },
  {
    text: 'Two-line snackbar with longer action, its text past one line',
    action: 'Longer action, past 128dp',
  },
].flatMap((message) => [message, { ...message, hasClose: true }])

function Gallery(args: Args) {
  // Each in a queue of its own, open from the start, with no transition.
  const [queues] = useState(() =>
    configurations.map((message) => {
      const queue = new SnackbarQueue<Message>({ wrapUpdate: undefined })
      queue.add(message)
      return queue
    }),
  )
  const [container, setContainer] = useState<HTMLElement | null>(null)
  return (
    <div ref={setContainer} className="grid grid-cols-[repeat(2,max-content)] gap-space-400">
      {container && (
        <UNSAFE_PortalProvider getContainer={() => container}>
          {queues.map((queue, index) => (
            <Snackbars
              key={index}
              {...args}
              queue={queue}
              region={{
                className: 'static w-86 max-w-none',
                'aria-label': `Configuration ${Math.floor(index / 2) + 1}${index % 2 ? ', with a close button' : ''}`,
              }}
            />
          ))}
        </UNSAFE_PortalProvider>
      )}
    </div>
  )
}

const consecutive = new SnackbarQueue<Message>()

/** Consecutive snackbars appear one at a time: a press adds one that closes after 4 seconds, the newest shown first, the one it took the place of after it. */
export const Consecutive: Story = {
  render: (args) => <ConsecutiveDemo {...args} />,
}

function ConsecutiveDemo(args: Args) {
  const [count, setCount] = useState(0)
  return (
    <>
      <Button
        variant="outlined"
        onPress={() => {
          setCount(count + 1)
          consecutive.add({ text: `Message ${count + 1}` }, { timeout: 4000 })
        }}
      >
        Add a snackbar
      </Button>
      <Snackbars {...args} queue={consecutive} />
    </>
  )
}

const aboveFab = new SnackbarQueue<Message>()

/** Above a FAB, 16dp from the window's edge: the region nudged up past it with `className`, so the snackbar is not in front of it. */
export const AboveFab: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="h-dvh p-space-200">
      <Button
        variant="outlined"
        onPress={() => aboveFab.add({ text: 'Draft saved', action: 'Undo' })}
      >
        Save draft
      </Button>
      <Fab aria-label="Compose" className="fixed end-space-200 bottom-space-200">
        <Icon name="edit" />
      </Fab>
      <Snackbars {...args} queue={aboveFab} region={{ className: 'bottom-22' }} />
    </div>
  ),
}

const saved = new SnackbarQueue<Message>()

/** On the web a snackbar that closes on its own needs inline feedback too: the button says Saved, and the snackbar closes after 5 seconds, the time React Aria asks for at least. */
export const InlineFeedback: Story = {
  render: (args) => <InlineFeedbackDemo {...args} />,
}

function InlineFeedbackDemo(args: Args) {
  const [isSaved, setSaved] = useState(false)
  return (
    <>
      <Button
        variant="filled"
        onPress={() => {
          setSaved(true)
          saved.add(
            { text: 'All changes saved' },
            { timeout: 5000, onClose: () => setSaved(false) },
          )
        }}
      >
        {isSaved ? 'Saved' : 'Save'}
      </Button>
      <Snackbars {...args} queue={saved} />
    </>
  )
}
