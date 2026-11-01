import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Heading, MenuTrigger, Text } from 'react-aria-components'
import { twMerge } from '../../lib/tv'
import { Button } from '../button'
import { Divider } from '../divider'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { List, ListItem } from '../list'
import { Menu, MenuItem, MenuPopover } from '../menu'
import { BottomSheet, SheetTrigger, type BottomSheetProps } from '.'

const meta = {
  title: 'Components/Bottom sheet',
  component: BottomSheet,
  parameters: { layout: 'centered' },
  // The docgen reads none of these from the imported types: ours, then React Aria's.
  argTypes: {
    isModal: { control: false, table: { category: 'M3' } },
    isFullScreen: { control: false, table: { category: 'M3' } },
    hasDragHandle: { control: 'boolean', table: { category: 'M3' } },
    dragHandleLabel: { control: 'text', table: { category: 'M3' } },
    // React Aria's sheet's, either sheet's.
    snapPoints: { control: 'object', table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    // React Aria's sheet's, a modal sheet's: kept by its SheetTrigger in these stories.
    isOpen: { control: false, table: { category: 'State' } },
    defaultOpen: { control: false, table: { category: 'State' } },
    preventDismissal: { control: 'boolean', table: { category: 'State' } },
    shouldCloseOnInteractOutside: { control: false, table: { category: 'State' } },
    // React Aria's disclosure's, a standard sheet's.
    isExpanded: { control: false, table: { category: 'State' } },
    defaultExpanded: { control: 'boolean', table: { category: 'State' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof BottomSheet>

export default meta
type Story = StoryObj<typeof meta>

type Row = readonly [label: string, icon: string]

const actions: readonly Row[] = [
  ['Share', 'share'],
  ['Get link', 'link'],
  ['Edit name', 'edit'],
  ['Delete collection', 'delete'],
]

const files: readonly Row[] = [
  ['Budget 2026', 'table_chart'],
  ['Cover letter', 'description'],
  ['Design review', 'slideshow'],
  ['Expenses', 'receipt_long'],
  ['Floor plan', 'image'],
  ['Flight tickets', 'flight'],
  ['Holiday photos', 'photo_library'],
  ['Invoice 0043', 'receipt_long'],
  ['Meeting notes', 'description'],
  ['Moodboard', 'image'],
  ['Onboarding', 'slideshow'],
  ['Packing list', 'checklist'],
  ['Quarterly report', 'table_chart'],
  ['Recipes', 'restaurant'],
  ['Roadmap', 'timeline'],
  ['Site survey', 'map'],
  ['Team offsite', 'groups'],
  ['Travel budget', 'table_chart'],
  ['Wedding playlist', 'queue_music'],
  ['Year in review', 'slideshow'],
]

/**
 * A list of rows drawn on the sheet's own color, each an action that closes it, which the sheet
 * scrolls at its full height, unless it scrolls itself (`className`).
 */
function Rows({
  label,
  rows,
  onSelect,
  className = '',
}: {
  label: string
  rows: readonly Row[]
  onSelect: () => void
  className?: string
}) {
  return (
    <List aria-label={label} className={twMerge('pb-space-200', className)}>
      {rows.map(([name, icon]) => (
        <ListItem
          key={name}
          id={name}
          textValue={name}
          className="bg-transparent"
          onAction={onSelect}
        >
          <Icon slot="leading" name={icon} />
          <Text slot="label">{name}</Text>
        </ListItem>
      ))}
    </List>
  )
}

/**
 * A button and the modal sheet it opens, in React Aria's `SheetTrigger`, which keeps whether it
 * is open here, for what is in the sheet to close it: so do its scrim, Escape, a swipe down and
 * its drag handle.
 */
function Example({
  opener,
  children,
  ...props
}: Omit<BottomSheetProps, 'modal' | 'isOpen' | 'onOpenChange' | 'children'> & {
  opener: string
  children: (close: () => void) => BottomSheetProps['children']
}) {
  const [isOpen, setOpen] = useState(false)
  return (
    <SheetTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button variant="tonal">{opener}</Button>
      <BottomSheet {...props} isModal>
        {children(() => setOpen(false))}
      </BottomSheet>
    </SheetTrigger>
  )
}

/** Opens the sheet from its button, as a click does, for a story that shows it open. */
const open =
  (name: string): Story['play'] =>
  async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name }))
  }

/**
 * A `modal` sheet is React Aria's sheet, opened by the button in its `SheetTrigger`: in front of
 * the page over a scrim, which it makes inert, keeping the focus, as a dialog. It draws the drag
 * handle and holds whatever it shows under it, here a list of actions. The scrim, Escape, a
 * swipe down, the drag handle and each action close it.
 */
export const Modal: Story = {
  render: (args) => (
    <Example {...args} opener="Show actions" aria-label="Collection actions">
      {(close) => <Rows label="Collection actions" rows={actions} onSelect={close} />}
    </Example>
  ),
}

/**
 * The sheet slides up from the bottom of the window as React Aria scrolls it in, the scrim
 * fading in with it, and takes the focus: Tab lands on the drag handle first, and stays within
 * the sheet.
 */
export const ModalOpen: Story = {
  ...Modal,
  play: open('Show actions'),
}

/**
 * A modal sheet taller than half the window opens with half the window's height showing.
 * Swiping it up, scrolling down over it, or moving the focus to a row below the fold raises it
 * to its full height, 72dp short of the window's top (56dp in one wider than 640dp), where what
 * is in it scrolls. Selected, the drag handle closes it.
 */
export const PartiallyExpanded: Story = {
  render: (args) => (
    <Example {...args} opener="Choose a file" aria-label="Files">
      {(close) => <Rows label="Files" rows={files} onSelect={close} />}
    </Example>
  ),
  play: open('Choose a file'),
}

/**
 * Where the sheet opens are its `snapPoints`, how much of it shows, half the window unless set:
 * with none it opens at its full height. Its children, given as a function, are passed whether
 * it `isExpanded`, all of it showing: here a close button shows only then, above the files,
 * which scroll on their own under it.
 */
export const Expanded: Story = {
  args: { snapPoints: [] },
  render: (args) => (
    <Example {...args} opener="Browse files" aria-label="Files">
      {(close) =>
        ({ isExpanded }) => (
          <>
            <div className="flex h-12 items-center gap-space-100 ps-space-200 pe-space-100">
              <h2 className="m-0 grow text-title-lg font-regular">Files</h2>
              {isExpanded && (
                <IconButton aria-label="Close" onPress={close}>
                  <Icon name="close" />
                </IconButton>
              )}
            </div>
            <Rows label="Files" rows={files} onSelect={close} className="overflow-y-auto" />
          </>
        )}
    </Example>
  ),
  play: open('Browse files'),
}

/**
 * The drag handle is optional: `dragHandle={false}` leaves it out. Without one a sheet is still
 * swiped down, and closed by its scrim and Escape: give it an action that closes it, as here.
 */
export const WithoutDragHandle: Story = {
  args: { hasDragHandle: false },
  render: (args) => (
    <Example {...args} opener="Sort files" aria-label="Sort by" className="pt-space-300">
      {(close) => (
        <>
          <h2 className="m-0 px-space-200 pb-space-100 text-title-lg font-regular">Sort by</h2>
          <Rows
            label="Sort by"
            rows={[
              ['Name', 'sort_by_alpha'],
              ['Last modified', 'schedule'],
              ['Size', 'straighten'],
            ]}
            onSelect={close}
          />
          <Divider />
          <div className="flex justify-end p-space-200">
            <Button variant="text" onPress={close}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </Example>
  ),
  play: open('Sort files'),
}

/**
 * With `preventDismissal` neither a swipe nor the scrim nor Escape closes the sheet, and its
 * drag handle is only drawn: what is in it does, here React Aria's close slot on a button.
 */
export const PreventDismissal: Story = {
  args: { preventDismissal: true },
  render: (args) => (
    <Example {...args} opener="Discard draft" aria-label="Discard draft">
      {() => (
        <div className="flex flex-col gap-space-200 px-space-300 pb-space-300">
          <h2 className="m-0 text-title-lg font-regular">Discard this draft?</h2>
          <p className="m-0 text-body-md text-on-surface-variant">
            What you have written so far is lost.
          </p>
          <div className="flex justify-end gap-space-100">
            <Button variant="text" slot="close">
              Keep editing
            </Button>
            <Button variant="filled" slot="close">
              Discard
            </Button>
          </div>
        </div>
      )}
    </Example>
  ),
  play: open('Discard draft'),
}

/**
 * A menu in a modal sheet opens in front of it and is used as it is anywhere else: the page
 * is inert behind the sheet, and the menu, which opens after the sheet's layer, is not.
 */
export const WithMenu: Story = {
  render: (args) => (
    <Example {...args} opener="Edit collection" aria-label="Edit collection">
      {(close) => (
        <div className="flex items-center gap-space-100 ps-space-200 pe-space-100 pb-space-200">
          <h2 className="m-0 grow text-title-lg font-regular">Holiday photos</h2>
          <MenuTrigger>
            <IconButton aria-label="More options">
              <Icon name="more_vert" />
            </IconButton>
            <MenuPopover>
              <Menu>
                {actions.map(([name, icon]) => (
                  <MenuItem key={name} textValue={name} onAction={close}>
                    <Icon slot="leading" name={icon} />
                    {name}
                  </MenuItem>
                ))}
              </Menu>
            </MenuPopover>
          </MenuTrigger>
        </div>
      )}
    </Example>
  ),
  play: open('Edit collection'),
}

const albums = [
  ['Cassette Futurism', 'bg-tertiary-container'],
  ['Glass & Grace', 'bg-secondary-container'],
  ['Night Owls', 'bg-primary-container'],
  ['Warped Speed', 'bg-surface-container-highest'],
  ['Personal Voice', 'bg-tertiary-container'],
  ['For Now', 'bg-secondary-container'],
  ['Trapezoid', 'bg-primary-container'],
  ['Decorations', 'bg-surface-container-highest'],
] as const

const queue = [
  ['Strangers', 'Trapezoid'],
  ['21st Century Strangers', 'For Now'],
  ['Decorations', 'Personal Voice'],
  ['Slow Mornings', 'Glass & Grace'],
  ['Tape Hiss', 'Cassette Futurism'],
  ['Last Train Home', 'Night Owls'],
  ['Blue Hour', 'Glass & Grace'],
  ['Open Window', 'Warped Speed'],
  ['Paper Boats', 'For Now'],
  ['Afterglow', 'Night Owls'],
] as const

/**
 * The page a standard sheet is over: the sheet is rendered at the end of the page, fixed to the
 * window, and the page scrolls in the window under it, with room at its end for the peek.
 */
function Albums() {
  return (
    <div className="p-space-200 pb-36">
      <h1 className="m-0 pb-space-200 text-title-lg font-regular text-on-surface">Albums</h1>
      <div className="grid grid-cols-2 gap-space-200 sm:grid-cols-4">
        {albums.map(([name, fill]) => (
          <div key={name} className="flex flex-col gap-space-100">
            <div className={twMerge('aspect-square rounded-shape-md', fill)} />
            <span className="text-body-md text-on-surface">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** What is playing: the row that shows in the sheet's peek, under its drag handle. */
function Player() {
  const [playing, setPlaying] = useState(true)
  return (
    <div className="flex h-16 shrink-0 items-center gap-space-200 ps-space-200 pe-space-100">
      <span aria-hidden className="size-12 shrink-0 rounded-shape-sm bg-tertiary-container" />
      <div className="flex min-w-0 grow flex-col">
        <span className="truncate text-body-lg text-on-surface">Cassette Futurism</span>
        <span className="truncate text-body-md text-on-surface-variant">Various artists</span>
      </div>
      <IconButton aria-label={playing ? 'Pause' : 'Play'} onPress={() => setPlaying(!playing)}>
        <Icon name={playing ? 'pause' : 'play_arrow'} />
      </IconButton>
      <IconButton aria-label="Next">
        <Icon name="skip_next" />
      </IconButton>
    </div>
  )
}

/** The songs up next, drawn on the sheet's own color: what a raised sheet shows. */
function Queue() {
  return (
    <List aria-label="Up next" className="overflow-y-auto pb-space-200">
      {queue.map(([title, album]) => (
        <ListItem key={title} id={title} textValue={title} className="bg-transparent">
          <Icon slot="leading" name="music_note" />
          <Text slot="label">{title}</Text>
          <Text slot="description">{album}</Text>
        </ListItem>
      ))}
    </List>
  )
}

/**
 * A standard sheet, not `modal`, is a dialog that leaves the page in use: the albums behind it
 * scroll and take clicks, and the focus, which it moves to its drag handle as it is shown,
 * leaves it with Tab. It draws the drag handle first, and then whatever it shows, here a player
 * and the queue, which scrolls under them. Its peek is set to the drag handle and the player
 * (`snapPoints`, 112dp); swipe it up, scroll down over it, or select the drag handle to raise
 * it, which moves it as React Aria moves a modal sheet.
 */
export const Standard: Story = {
  args: { snapPoints: [112] },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <Albums />
      <BottomSheet {...args} aria-label="Now playing">
        <Player />
        <Queue />
      </BottomSheet>
    </>
  ),
}

/**
 * Unless its `snapPoints` are set, 56dp of a standard sheet shows while it is partially
 * expanded: the drag handle and the top of what follows it.
 */
export const StandardPeek: Story = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <Albums />
      <BottomSheet {...args} aria-label="Up next">
        <Queue />
      </BottomSheet>
    </>
  ),
}

/**
 * A standard sheet rests partially expanded at each of its `snapPoints`, opening at the first:
 * here the player, and half of the sheet. Selected, the drag handle raises it to the next one
 * up, and from its full height lowers it to the lowest.
 */
export const StandardSnapPoints: Story = {
  args: { snapPoints: [112, '50%'] },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <Albums />
      <BottomSheet {...args} aria-label="Now playing">
        <Player />
        <Queue />
      </BottomSheet>
    </>
  ),
}

/**
 * `isExpanded` and `onExpandedChange` hold a standard sheet's height in its caller, for
 * something of its own to change it: at its full height this sheet shows a collapse button above
 * the player, which returns it to its peek and the focus to its drag handle. The sheet's
 * children, given as a function, are passed whether it `isExpanded` too.
 */
export const Controlled: Story = {
  args: { snapPoints: [112] },
  argTypes: { defaultExpanded: { control: false } },
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [isExpanded, setExpanded] = useState(false)
    const sheet = useRef<HTMLDivElement>(null)
    return (
      <>
        <Albums />
        <BottomSheet
          {...args}
          ref={sheet}
          aria-label="Now playing"
          isExpanded={isExpanded}
          onExpandedChange={setExpanded}
        >
          {isExpanded && (
            <div className="flex h-16 items-center gap-space-100 ps-space-100 pe-space-200">
              <IconButton
                aria-label="Collapse"
                onPress={() => {
                  setExpanded(false)
                  // Gone with the full height, it leaves the focus to what raises the sheet.
                  sheet.current?.querySelector<HTMLElement>('[aria-label="Drag handle"]')?.focus()
                }}
              >
                <Icon name="keyboard_arrow_down" />
              </IconButton>
              <h2 className="m-0 text-title-lg font-regular">Up next</h2>
            </div>
          )}
          <Player />
          <Queue />
        </BottomSheet>
      </>
    )
  },
}

/**
 * With an `onOpenChange` a standard sheet can be dismissed: a swipe down, or a scroll up, that
 * takes it out of sight calls it with `false`, and so do Escape in it and the drag handle
 * selected at the sheet's full height. `isOpen` shows it again, sliding in.
 */
export const Dismissible: Story = {
  args: { snapPoints: [112] },
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [isOpen, setOpen] = useState(true)
    return (
      <>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-space-200">
          <span className="text-body-lg text-on-surface">
            {isOpen ? 'Swipe the player down to dismiss it' : 'Nothing is playing'}
          </span>
          <Button variant="tonal" isDisabled={isOpen} onPress={() => setOpen(true)}>
            Play something
          </Button>
        </div>
        <BottomSheet {...args} aria-label="Now playing" isOpen={isOpen} onOpenChange={setOpen}>
          <Player />
          <Queue />
        </BottomSheet>
      </>
    )
  },
}

const posts = [
  [
    'Selen Zeynep',
    'Local Guide · 14 reviews',
    '2 days ago',
    'Mud Island Amphitheater',
    'Outdoor seasonal theater · 0.6 mi',
    'bg-tertiary-container',
  ],
  [
    'Ravi Patel',
    'Local Guide · 52 reviews',
    '4 days ago',
    'Overton Park Shell',
    'Amphitheater · 1.2 mi',
    'bg-secondary-container',
  ],
  [
    'Mina Okafor',
    '9 reviews',
    'Last week',
    'Crosstown Concourse',
    'Shopping center · 2.1 mi',
    'bg-primary-container',
  ],
] as const

/** A post in the sheet: who wrote it, its photo, and the place it is about. */
function Post({ post: [name, about, when, place, kind, fill] }: { post: (typeof posts)[number] }) {
  return (
    <article className="flex flex-col gap-space-150 px-space-200 pb-space-300">
      <div className="flex items-center gap-space-150">
        <span aria-hidden className="size-10 shrink-0 rounded-shape-full bg-secondary-container" />
        <div className="flex min-w-0 grow flex-col">
          <span className="truncate text-title-sm text-on-surface">{name}</span>
          <span className="truncate text-body-sm text-on-surface-variant">{about}</span>
        </div>
        <Button variant="tonal" size="xs">
          Follow
        </Button>
      </div>
      <div aria-hidden className={twMerge('aspect-4/3 rounded-shape-lg', fill)} />
      <div className="flex items-center">
        <span className="grow text-body-sm text-on-surface-variant">{when}</span>
        <IconButton aria-label="Like">
          <Icon name="thumb_up" />
        </IconButton>
        <IconButton aria-label="More">
          <Icon name="more_horiz" />
        </IconButton>
      </div>
      <div className="flex flex-col rounded-shape-md bg-surface-container-high p-space-200">
        <span className="text-title-sm text-on-surface">{place}</span>
        <span className="text-body-sm text-on-surface-variant">{kind}</span>
      </div>
    </article>
  )
}

/** The map the sheet is over: streets on a light ground, and a park. */
function Map() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 bg-surface-container-lowest bg-[linear-gradient(90deg,var(--md-sys-color-surface-container-high)_4px,transparent_4px),linear-gradient(var(--md-sys-color-surface-container-high)_4px,transparent_4px)] bg-size-[88px_104px]"
    >
      <div className="absolute top-36 right-0 h-52 w-24 rounded-s-shape-md bg-tertiary-container" />
    </div>
  )
}

/**
 * The app's search bar, in front of the sheet: at the end of the page after the sheet, as it is
 * rendered there too. Raised over the map, and filled on the sheet while that is full-screen,
 * which it reads from the sheet's `data-full-screen` in the page.
 */
function SearchBar() {
  return createPortal(
    <div className="fixed inset-x-space-200 top-space-200 z-sheet flex h-14 items-center gap-space-200 rounded-shape-full bg-surface-container-lowest ps-space-200 pe-space-150 shadow-elevation-2 transition-[background-color,box-shadow] duration-spring-default-effects ease-spring-default-effects in-has-data-full-screen:bg-surface-container-high in-has-data-full-screen:shadow-elevation-0">
      <Icon name="location_on" className="text-primary icon-24" />
      <span className="grow text-body-lg text-on-surface-variant">Search here</span>
      <span aria-hidden className="size-8 shrink-0 rounded-shape-full bg-secondary-container" />
    </div>,
    document.body,
  )
}

/**
 * With `fullScreen` a standard sheet is full-screen at its full height: it turns surface, its
 * fill runs over what is above it up to the window's top, and its drag handle is not drawn.
 * Swiped down, it gives them back. As in the guidelines' video of a sheet over a map, its full
 * height is under the app's search bar (`bottom-sheet-top-19`), and 200dp of it shows partially
 * expanded (`snapPoints`). React Aria's `Heading` in the `title` slot names it.
 */
export const FullScreen: Story = {
  args: { defaultExpanded: true, snapPoints: [200] },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <Map />
      <BottomSheet {...args} isFullScreen className="bottom-sheet-top-19">
        <Heading
          slot="title"
          className="m-0 px-space-200 pb-space-200 text-title-lg font-regular text-on-surface"
        >
          Latest in the area
        </Heading>
        {posts.map((post) => (
          <Post key={post[0]} post={post} />
        ))}
      </BottomSheet>
      <SearchBar />
    </>
  ),
}
