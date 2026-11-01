import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState, type MouseEvent } from 'react'
import { Autocomplete, Button, DialogTrigger, Input, Text, useFilter } from 'react-aria-components'
import { AppBar } from '../app-bar'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { List, ListItem } from '../list'
import { SearchField, SearchView, type SearchViewProps } from '.'

// Every prop of SearchView, its own and the few of React Aria's it takes: the docgen reads none of
// them from the imported types, so each is listed here. Event handlers are left out.
const meta = {
  title: 'Components/Search/SearchView',
  component: SearchView,
  parameters: { layout: 'fullscreen' },
  args: { layout: 'docked', variant: 'contained', 'aria-label': 'Search your messages' },
  argTypes: {
    layout: {
      control: 'inline-radio',
      options: ['docked', 'full-screen'],
      table: { category: 'M3' },
    },
    variant: {
      control: 'inline-radio',
      options: ['contained', 'divided'],
      table: { category: 'M3' },
    },
    triggerRef: { control: false, table: { category: 'M3' } },
    children: { control: false, table: { category: 'Parts' } },
    isOpen: { control: 'boolean', table: { category: 'State' } },
    defaultOpen: { control: 'boolean', table: { category: 'State' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
  },
} satisfies Meta<typeof SearchView>

export default meta
type Story = StoryObj<typeof meta>

const suggestions = [
  ['Peanut butter recipes', 'history'],
  ['Pet adoption', 'history'],
  ['Movie marathon', 'history'],
  ['Museum field trip', 'history'],
  ['Eli', 'person'],
  ['Zita', 'person'],
  ['Odette', 'person'],
  ['Dagmar', 'person'],
  ['Aki Aro', 'person'],
  ['Weekend hike', 'search'],
  ['Book club', 'search'],
  ['Flight tickets', 'search'],
  ['Dinner reservation', 'search'],
  ['Birthday party', 'search'],
] as const

// The bar in the view, and below it the suggestions, filtered as it is typed in: what focused
// search holds, in React Aria's Autocomplete. A suggestion pressed is searched for. The icon that
// leads the page's bar, if it has one, is the bar's first, which the back button fades through.
function Search({
  query,
  onQueryChange,
  close,
  icon,
}: {
  query: string
  onQueryChange: (query: string) => void
  close: () => void
  icon?: string
}) {
  const { contains } = useFilter({ sensitivity: 'base' })
  return (
    <Autocomplete
      inputValue={query}
      onInputChange={onQueryChange}
      filter={contains}
      disableAutoFocusFirst
    >
      <SearchField autoFocus aria-label="Search your messages" onSubmit={close}>
        {icon && <Icon slot="leading" name={icon} />}
        <IconButton slot="leading" aria-label="Back" onPress={close}>
          <Icon name="arrow_back" />
        </IconButton>
        <Input placeholder="Search your messages" />
        <IconButton aria-label="Clear search">
          <Icon name="close" />
        </IconButton>
      </SearchField>
      <List
        aria-label="Suggestions"
        onAction={(key) => {
          onQueryChange(String(key))
          close()
        }}
        renderEmptyState={() => (
          <Text className="block px-space-200 py-space-150 text-body-lg text-on-surface-variant">
            No suggestions
          </Text>
        )}
      >
        {suggestions.map(([label, icon]) => (
          <ListItem key={label} id={label} textValue={label}>
            <Icon slot="leading" name={icon} />
            <Text slot="label">{label}</Text>
          </ListItem>
        ))}
      </List>
    </Autocomplete>
  )
}

// What the page shows below the bar, enough to scroll a tall window.
const Messages = () => (
  <ul className="m-0 flex list-none flex-col gap-space-100 p-space-300 text-body-lg text-on-surface">
    {Array.from({ length: 24 }, (_, index) => (
      <li key={index} className="rounded-shape-md bg-surface-container-low p-space-200">
        Message {index + 1}
      </li>
    ))}
  </ul>
)

/** A search bar in the page, 24dp from its sides: a press on it, typing in it or ↓ opens focused search over it, its own bar drawn where the page's is, and the two share the query. Its bar has the page's search icon first, under the back button, which fades through it as it opens and back as it closes. Back, Escape on an empty bar, a press outside a docked one, or a suggestion pressed closes it; Escape with text clears it first. ↑ and ↓ move through the suggestions while the bar keeps the focus. Switch `layout` and `variant`. */
export const FocusedSearch: Story = {
  render: function FocusedSearch(args: SearchViewProps) {
    const [query, setQuery] = useState('')
    const [isOpen, setOpen] = useState(false)
    const bar = useRef<HTMLDivElement>(null)
    // A press on the bar that is not on one of its buttons.
    const open = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('button')) setOpen(true)
    }
    return (
      <div className="min-h-dvh bg-surface pt-space-100">
        <SearchField
          ref={bar}
          aria-label="Search your messages"
          value={query}
          onChange={(value) => {
            setQuery(value)
            setOpen(true)
          }}
          onClick={open}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') setOpen(true)
            else event.continuePropagation()
          }}
          className="mx-space-300"
        >
          <Icon slot="leading" name="search" />
          <Input placeholder="Search your messages" />
          <IconButton slot="trailing" aria-label="Voice search">
            <Icon name="mic" />
          </IconButton>
        </SearchField>
        <Messages />
        <SearchView {...args} triggerRef={bar} isOpen={isOpen} onOpenChange={setOpen}>
          {({ state }) => (
            <Search query={query} onQueryChange={setQuery} close={state.close} icon="search" />
          )}
        </SearchView>
      </div>
    )
  },
}

/** Focused search full-screen, the default for compact windows, in either style: the bar grows from the page's. */
export const FullScreen: Story = {
  ...FocusedSearch,
  args: { layout: 'full-screen' },
  globals: { viewport: 'nexus6p' },
}

/** Docked in the divided (baseline) style: one container, the bar its header over a divider, and no scrim. */
export const Divided: Story = {
  ...FocusedSearch,
  args: { variant: 'divided' },
}

/** A search app bar's search bar, React Aria's Button in the app bar's `search` slot, alone in a DialogTrigger, which would give its press to any other button in it: it opens focused search, which grows from it, starting in its color, and gets the focus back as it closes. The search icon leads it, as the spec's leading side asks, so that its text is where the view's bar's is, after the back button, which fades through the icon. */
export const FromAnAppBar: Story = {
  args: { layout: 'full-screen' },
  render: function FromAnAppBar(args: SearchViewProps) {
    const [query, setQuery] = useState('')
    return (
      <div className="min-h-dvh bg-surface">
        <AppBar className="text-center">
          <IconButton slot="leading" aria-label="Menu">
            <Icon name="menu" />
          </IconButton>
          <DialogTrigger>
            <Button slot="search">
              <Icon slot="leading" name="search" />
              {query || 'Search your messages'}
            </Button>
            <SearchView {...args}>
              {({ state }) => (
                <Search query={query} onQueryChange={setQuery} close={state.close} icon="search" />
              )}
            </SearchView>
          </DialogTrigger>
        </AppBar>
        <Messages />
      </div>
    )
  },
}
