import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { Heading, Text } from 'react-aria-components'
import { twMerge } from '../../lib/tv'
import { Button } from '../button'
import { Checkbox } from '../checkbox'
import { Divider } from '../divider'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { List, ListItem } from '../list'
import { Radio, RadioGroup } from '../radio'
import { SheetTrigger, SideSheet, SideSheetHeader, type SideSheetProps } from '.'

const meta = {
  title: 'Components/Side sheet',
  component: SideSheet,
  parameters: { layout: 'centered' },
  args: { isDetached: false },
  // The docgen reads none of these from the imported types: ours, then React Aria's.
  argTypes: {
    isModal: { control: false, table: { category: 'M3' } },
    isDetached: { control: 'boolean', table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    // React Aria's sheet's, a modal sheet's: kept by its SheetTrigger in these stories.
    isOpen: { control: false, table: { category: 'State' } },
    defaultOpen: { control: false, table: { category: 'State' } },
    preventDismissal: { control: 'boolean', table: { category: 'State' } },
    shouldCloseOnInteractOutside: { control: false, table: { category: 'State' } },
    className: { control: 'text', table: { category: 'Styling' } },
    ref: { table: { category: 'Styling' } },
  },
} satisfies Meta<typeof SideSheet>

export default meta
type Story = StoryObj<typeof meta>

const labels = ['Events', 'Personal', 'Projects', 'Reminders', 'Family', 'Travel', 'Work']

// What follows a sheet's header, drawn as given: the content, which scrolls on its own, 24dp in
// from the sides and 24dp above the bottom when it ends the sheet, and the actions, a row at the
// bottom under a divider, its buttons at the start 8dp apart, as the spec measures them.
const content =
  'min-h-0 grow overflow-x-clip overflow-y-auto overscroll-contain px-space-300 py-space-200 last:pb-space-300'
const actions = 'flex shrink-0 items-center gap-space-100 px-space-300 pt-space-200 pb-space-300'

/** The close icon button a side sheet always has, last in its header: in the close slot, it closes the sheet. */
const Close = () => (
  <IconButton aria-label="Close" slot="close">
    <Icon name="close" />
  </IconButton>
)

/** What to filter by under its `legend`, one checkbox each, the `checked` ones checked. */
function Choices({
  legend,
  choices,
  checked = [],
}: {
  legend: string
  choices: readonly string[]
  checked?: readonly string[]
}) {
  return (
    <fieldset className="m-0 flex flex-col items-start border-0 p-0 text-body-lg text-on-surface">
      <legend className="pb-space-100 text-title-sm text-on-surface-variant">{legend}</legend>
      {choices.map((choice) => (
        <Checkbox key={choice} className="h-14" defaultSelected={checked.includes(choice)}>
          {choice}
        </Checkbox>
      ))}
    </fieldset>
  )
}

/** Labels to filter by, one checkbox each. */
const Labels = () => (
  <Choices legend="Labels" choices={labels} checked={['Projects', 'Reminders']} />
)

/**
 * The filters a modal sheet holds: its header, the labels, and Save and Cancel under a divider,
 * each in the close slot, so that they close the sheet as the close icon button does.
 */
const Filters = () => (
  <>
    <SideSheetHeader>
      <Heading slot="title">Filters</Heading>
      <Close />
    </SideSheetHeader>
    <div className={content}>
      <Labels />
    </div>
    <Divider />
    <div className={actions}>
      <Button variant="filled" slot="close">
        Save
      </Button>
      <Button variant="outlined" slot="close">
        Cancel
      </Button>
    </div>
  </>
)

/**
 * A button and the modal sheet it opens, in React Aria's `SheetTrigger`, which keeps whether it
 * is open: the scrim, Escape, a swipe toward the window's end and the buttons in the sheet's
 * close slot close it.
 */
function Example({
  opener,
  children,
  ...props
}: Omit<SideSheetProps, 'modal' | 'children'> & {
  opener: string
  children: ReactNode
}) {
  return (
    <SheetTrigger>
      <Button variant="tonal">{opener}</Button>
      <SideSheet {...props} isModal>
        {children}
      </SideSheet>
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
 * the page over a scrim, which it makes inert, keeping the focus, as a dialog, at the window's
 * end. Its header names it and holds its close button; its content scrolls between that and the
 * actions under the divider. The scrim, Escape, a swipe toward the window's end, the close button
 * and each action close it.
 */
export const Modal: Story = {
  render: (args) => (
    <Example {...args} opener="Show filters">
      <Filters />
    </Example>
  ),
}

/**
 * The sheet slides in from the window's end as React Aria scrolls it, the scrim fading in with
 * it, and takes the focus: Tab lands on the close button first, and stays within the sheet.
 */
export const ModalOpen: Story = {
  ...Modal,
  play: open('Show filters'),
}

/** `detached` sets the sheet 16dp in from the window's edges, round at every corner. */
export const Detached: Story = {
  ...Modal,
  args: { isDetached: true },
  play: open('Show filters'),
}

/**
 * With `preventDismissal` neither a swipe nor the scrim nor Escape closes the sheet: what is in
 * it does, here the buttons in React Aria's close slot.
 */
export const PreventDismissal: Story = {
  ...Modal,
  args: { preventDismissal: true },
  play: open('Show filters'),
}

// The sections WithBackButton lists: each its name, its icon and what it filters by.
const sections = [
  ['Labels', 'label', labels],
  ['Format', 'description', ['Documents', 'Spreadsheets', 'Presentations', 'PDFs', 'Images']],
  ['Last modified', 'schedule', ['Today', 'Earlier this week', 'Earlier this year', 'Older']],
] as const

// Focuses an element as it is drawn: what replaces the button that had the focus.
const focus = (element: HTMLElement | null) => element?.focus()

/**
 * The list of sections and the one open, in the sheet, so each time it opens it starts at the
 * list. The focus goes to the back button as a section opens, and back to its row from it.
 */
function Sections() {
  const [section, setSection] = useState<string | null>(null)
  const [left, setLeft] = useState<string | null>(null)
  const open = sections.find(([name]) => name === section)
  if (!open)
    return (
      <>
        <SideSheetHeader>
          <Heading slot="title">Filters</Heading>
          <Close />
        </SideSheetHeader>
        <List aria-label="Filters" className="grow overflow-y-auto">
          {sections.map(([name, icon]) => (
            <ListItem
              key={name}
              id={name}
              textValue={name}
              ref={name === left ? focus : undefined}
              className="bg-transparent"
              onAction={() => setSection(name)}
            >
              <Icon slot="leading" name={icon} />
              <Text slot="label">{name}</Text>
            </ListItem>
          ))}
        </List>
      </>
    )
  const [name, , choices] = open
  return (
    <>
      <SideSheetHeader>
        <IconButton
          ref={focus}
          aria-label="Back"
          onPress={() => {
            setLeft(name)
            setSection(null)
          }}
        >
          <Icon name="arrow_back" className="rtl:icon-mirrored" />
        </IconButton>
        <Heading slot="title">{name}</Heading>
        <Close />
      </SideSheetHeader>
      <div className={content}>
        <Choices legend={name} choices={choices} />
      </div>
    </>
  )
}

/**
 * A sheet can hold more than one region: here a section opened from its list shows a back icon
 * button before its headline, which returns to the list.
 */
export const WithBackButton: Story = {
  render: (args) => (
    <Example {...args} opener="Filter files">
      <Sections />
    </Example>
  ),
  play: open('Filter files'),
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

/**
 * The page a standard sheet is on: a row as tall as the window, the body first, which scrolls
 * its albums and has the button that shows the sheet, and the sheet at its end.
 */
function Page({ sheet, onInfo }: { sheet: ReactNode; onInfo: () => void }) {
  return (
    <div className="flex h-dvh bg-surface">
      <div className="box-border min-w-0 grow overflow-y-auto p-space-300">
        <div className="flex items-center justify-between pb-space-200">
          <h1 className="m-0 text-title-lg font-regular text-on-surface">Albums</h1>
          <IconButton aria-label="Info" onPress={onInfo}>
            <Icon name="info" />
          </IconButton>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-space-200">
          {albums.map(([name, fill]) => (
            <div key={name} className="flex flex-col gap-space-100">
              <div className={twMerge('aspect-square rounded-shape-md', fill)} />
              <span className="text-body-md text-on-surface">{name}</span>
            </div>
          ))}
        </div>
      </div>
      {sheet}
    </div>
  )
}

/** What a standard sheet shows of the album selected: its details. */
const Info = () => (
  <>
    <SideSheetHeader>
      <Heading slot="title">Info</Heading>
      <Close />
    </SideSheetHeader>
    <div className={twMerge(content, 'flex flex-col gap-space-200')}>
      <div className="aspect-square rounded-shape-md bg-tertiary-container" />
      <div className="flex flex-col">
        <span className="text-title-md text-on-surface">Cassette Futurism</span>
        <span className="text-body-md text-on-surface-variant">Various artists · 2026</span>
      </div>
      <Divider />
      <dl className="m-0 grid grid-cols-2 gap-space-100 text-body-md">
        <dt className="text-on-surface-variant">Tracks</dt>
        <dd className="m-0 text-on-surface">12</dd>
        <dt className="text-on-surface-variant">Length</dt>
        <dd className="m-0 text-on-surface">48 min</dd>
        <dt className="text-on-surface-variant">Added</dt>
        <dd className="m-0 text-on-surface">October 5</dd>
      </dl>
    </div>
  </>
)

/**
 * A standard sheet, not `modal`, is a dialog that leaves the page in use, beside its body:
 * written after the body in a row, it takes its width from the row as it is shown and gives it
 * back as it is hidden, the body shrinking and growing in step, and what it holds fades in once
 * there is room. Shown, it moves the focus to its close button, which Tab then leaves. The info
 * button shows and hides it; with an `onOpenChange`, the close button and Escape hide it too.
 */
export const Standard: Story = {
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [isOpen, setOpen] = useState(true)
    return (
      <Page
        onInfo={() => setOpen(!isOpen)}
        sheet={
          <SideSheet {...args} isOpen={isOpen} onOpenChange={setOpen}>
            <Info />
          </SideSheet>
        }
      />
    )
  },
}

/**
 * Detached, a standard sheet is 16dp in from the row's edges, round at every corner, which
 * keeps a margin at the body's end; here surface-container, set off from the body's surface.
 */
export const StandardDetached: Story = {
  ...Standard,
  args: { isDetached: true, className: 'bg-surface-container' },
}

/**
 * A docked standard sheet can draw the divider at its start, the outline-variant line of the
 * spec's anatomy, with a border of your own: `border-s border-outline-variant`, and
 * `border-0 border-solid` too without Tailwind's preflight, as here.
 */
export const StandardDivider: Story = {
  ...Standard,
  args: { className: 'border-0 border-s border-solid border-outline-variant' },
}

/**
 * The sheet is 256dp wide unless `side-sheet-width-*` sets another width, up to 400dp: here
 * `side-sheet-width-90`, 360dp.
 */
export const Width: Story = {
  argTypes: { className: { control: false } },
  render: (args) => (
    <Example {...args} opener="Open settings" className="side-sheet-width-90">
      <SideSheetHeader>
        <Heading slot="title">Settings</Heading>
        <Close />
      </SideSheetHeader>
      <div className={content}>
        <RadioGroup
          aria-label="Density"
          defaultValue="default"
          className="flex flex-col items-start text-body-lg text-on-surface"
        >
          {['Default', 'Comfortable', 'Compact'].map((name) => (
            <Radio key={name} className="h-14" value={name.toLowerCase()}>
              {name}
            </Radio>
          ))}
        </RadioGroup>
      </div>
    </Example>
  ),
  play: open('Open settings'),
}

/**
 * In a right-to-left page a standard sheet is at the window's left edge, its elements reversed:
 * the close button at the left of its header, its corners and its motion mirrored. A modal
 * sheet goes by React Aria's locale, an `I18nProvider`'s, not the page's `dir`.
 */
export const RightToLeft: Story = {
  parameters: { layout: 'fullscreen' },
  render: function Render(args) {
    const [isOpen, setOpen] = useState(true)
    return (
      <div dir="rtl">
        <Page
          onInfo={() => setOpen(!isOpen)}
          sheet={
            <SideSheet {...args} isOpen={isOpen} onOpenChange={setOpen}>
              <Info />
            </SideSheet>
          }
        />
      </div>
    )
  },
}
