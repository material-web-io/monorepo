import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Autocomplete, Button, DialogTrigger, Input, Text, useFilter } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../icon'
import { AppBar } from '../app-bar'
import { IconButton } from '../icon-button'
import { List, ListItem } from '../list'
import { SearchField, SearchView, type SearchFieldProps, type SearchViewProps } from '.'

/* Markup and behavior that jsdom can check without a stylesheet: React Aria's roles and names, the
 * clear button and the slots around it, the keys, focused search opening, closing and filtering,
 * and the trigger it is measured from. Looks, places and motion: search.browser.test.tsx. */

const searchbox = () => screen.getByRole('searchbox')
const button = (name: string) => screen.getByRole('button', { name })

function Bar(props: Partial<SearchFieldProps>) {
  return (
    <SearchField aria-label="Search your messages" {...props}>
      <IconButton slot="leading" aria-label="Menu">
        <Icon name="menu" />
      </IconButton>
      <Input placeholder="Search your messages" />
      <IconButton aria-label="Clear search">
        <Icon name="close" />
      </IconButton>
      <IconButton slot="trailing" aria-label="Voice search">
        <Icon name="mic" />
      </IconButton>
    </SearchField>
  )
}

describe('SearchField', () => {
  it('is React Aria’s SearchField: a search box named by its label, with the hinted text', () => {
    render(<Bar />)
    expect(searchbox()).toHaveAccessibleName('Search your messages')
    expect(searchbox()).toHaveAttribute('type', 'search')
    expect(searchbox()).toHaveAttribute('placeholder', 'Search your messages')
    expect(searchbox().parentElement).toHaveClass('search-field')
  })

  it('takes a className as a function of its state, with React Aria’s default class', () => {
    const className = vi.fn(({ defaultClassName, isEmpty }) => `${defaultClassName} ${isEmpty}`)
    render(<Bar className={className} />)
    expect(searchbox().parentElement).toHaveClass('react-aria-SearchField', 'true', 'search-field')
  })

  it('passes its ref and DOM props to its <div>', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Bar ref={ref} data-testid="bar" id="search" />)
    expect(ref.current).toBe(screen.getByTestId('bar'))
    expect(ref.current).toContainElement(searchbox())
  })

  it('makes the button with no slot React Aria’s clear button, out of the tab order', async () => {
    const onClear = vi.fn()
    const onChange = vi.fn()
    render(<Bar defaultValue="Peanut" onClear={onClear} onChange={onChange} />)
    const clear = button('Clear search')
    expect(clear).toHaveAttribute('tabindex', '-1')
    await userEvent.click(clear)
    expect(searchbox()).toHaveValue('')
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(onClear).toHaveBeenCalledOnce()
    // It hands the focus to the input, which keeps it.
    expect(searchbox()).toHaveFocus()
  })

  it('names the clear button as React Aria does when it is given no name', () => {
    render(
      <SearchField aria-label="Search">
        <Input />
        <Button>×</Button>
      </SearchField>,
    )
    expect(screen.getByRole('button')).toHaveAccessibleName('Clear search')
  })

  it('leaves the leading and trailing buttons theirs: tabbable, and clearing nothing', async () => {
    const onPress = vi.fn()
    render(
      <SearchField aria-label="Search" defaultValue="Peanut">
        <IconButton slot="leading" aria-label="Back" onPress={onPress}>
          <Icon name="arrow_back" />
        </IconButton>
        <Input />
        <IconButton slot="trailing" aria-label="Voice search">
          <Icon name="mic" />
        </IconButton>
      </SearchField>,
    )
    await userEvent.tab()
    expect(button('Back')).toHaveFocus()
    await userEvent.tab()
    expect(searchbox()).toHaveFocus()
    await userEvent.tab()
    expect(button('Voice search')).toHaveFocus()
    await userEvent.click(button('Back'))
    await userEvent.click(button('Voice search'))
    expect(onPress).toHaveBeenCalledOnce()
    expect(searchbox()).toHaveValue('Peanut')
  })

  it('throws React Aria’s error for a slot it has not', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <SearchField aria-label="Search">
          <Input />
          <IconButton slot="close" aria-label="Close">
            <Icon name="close" />
          </IconButton>
        </SearchField>,
      ),
    ).toThrow(/Invalid slot "close"/)
    expect(() =>
      render(
        <SearchField aria-label="Search">
          <Icon slot="start" name="search" />
          <Input />
        </SearchField>,
      ),
    ).toThrow(/Invalid slot "start"/)
    vi.mocked(console.error).mockRestore()
  })

  it('clears with Escape and submits with Enter, as React Aria’s does', async () => {
    const onSubmit = vi.fn()
    render(<Bar onSubmit={onSubmit} />)
    await userEvent.type(searchbox(), 'Peanut{Enter}')
    expect(onSubmit).toHaveBeenCalledWith('Peanut')
    await userEvent.keyboard('{Escape}')
    expect(searchbox()).toHaveValue('')
  })

  it('reports whether it is empty, as data-empty', async () => {
    render(<Bar />)
    const field = searchbox().parentElement!
    expect(field).toHaveAttribute('data-empty')
    await userEvent.type(searchbox(), 'P')
    expect(field).not.toHaveAttribute('data-empty')
  })

  it('gives a press on the container that is on no control to the input', async () => {
    const onMouseDown = vi.fn()
    render(
      <SearchField aria-label="Search" onMouseDown={onMouseDown}>
        <Icon slot="leading" name="search" data-testid="icon" />
        <Input />
      </SearchField>,
    )
    await userEvent.click(screen.getByTestId('icon'))
    expect(searchbox()).toHaveFocus()
    expect(onMouseDown).toHaveBeenCalledOnce()
  })

  it('gives such a press to the input inside an ancestor that takes the focus', async () => {
    render(
      <div tabIndex={-1}>
        <SearchField aria-label="Search">
          <Icon slot="leading" name="search" data-testid="icon" />
          <Input />
        </SearchField>
      </div>,
    )
    await userEvent.click(screen.getByTestId('icon'))
    expect(searchbox()).toHaveFocus()
  })

  it('gives such a press to the input where the field itself takes the focus', async () => {
    render(
      <SearchField aria-label="Search" render={(props) => <div {...props} tabIndex={-1} />}>
        <Icon slot="leading" name="search" data-testid="icon" />
        <Input />
      </SearchField>,
    )
    await userEvent.click(screen.getByTestId('icon'))
    expect(searchbox()).toHaveFocus()
  })

  it('leaves a press on one of its buttons to the button', async () => {
    render(<Bar />)
    await userEvent.click(button('Voice search'))
    expect(button('Voice search')).toHaveFocus()
  })

  it('leaves a press in a portal of its own, as a trailing menu’s, where it is', async () => {
    render(
      <SearchField aria-label="Search">
        <Input />
        {createPortal(
          <div data-testid="popover">
            <button>Settings</button>
          </div>,
          document.body,
        )}
      </SearchField>,
    )
    await userEvent.click(button('Settings'))
    expect(button('Settings')).toHaveFocus()
    await userEvent.click(screen.getByTestId('popover'))
    expect(searchbox()).not.toHaveFocus()
  })

  it('disables its leading and trailing buttons with it, unless one says otherwise', () => {
    render(
      <SearchField aria-label="Search" isDisabled defaultValue="Peanut">
        <IconButton slot="leading" aria-label="Menu">
          <Icon name="menu" />
        </IconButton>
        <Input />
        <IconButton aria-label="Clear search">
          <Icon name="close" />
        </IconButton>
        <IconButton slot="trailing" aria-label="Voice search" isDisabled={false}>
          <Icon name="mic" />
        </IconButton>
      </SearchField>,
    )
    expect(searchbox()).toBeDisabled()
    expect(button('Menu')).toBeDisabled()
    expect(button('Clear search')).toBeDisabled()
    expect(button('Voice search')).toBeEnabled()
  })

  it('disables a selectable button with it too, unless it says otherwise', () => {
    render(
      <SearchField aria-label="Search" isDisabled defaultValue="Peanut">
        <IconButton slot="leading" isSelectable aria-label="Filter">
          <Icon name="filter_list" />
        </IconButton>
        <Input />
        <IconButton isSelectable aria-label="Pin">
          <Icon name="keep" />
        </IconButton>
        <IconButton slot="trailing" isSelectable aria-label="Voice search">
          <Icon name="mic" />
        </IconButton>
        <IconButton slot="trailing" isSelectable aria-label="More" isDisabled={false}>
          <Icon name="more_vert" />
        </IconButton>
      </SearchField>,
    )
    expect(button('Filter')).toBeDisabled()
    expect(button('Pin')).toBeDisabled()
    expect(button('Voice search')).toBeDisabled()
    expect(button('More')).toBeEnabled()
  })

  it('leaves a selectable button enabled in a field that is', async () => {
    render(
      <SearchField aria-label="Search">
        <Input />
        <IconButton slot="trailing" isSelectable aria-label="Voice search">
          <Icon name="mic" />
        </IconButton>
      </SearchField>,
    )
    await userEvent.click(button('Voice search'))
    expect(button('Voice search')).toHaveAttribute('aria-pressed', 'true')
  })
})

const suggestions = ['Peanut butter', 'Pet adoption', 'Movie marathon']

// Focused search as the story writes it: the page's bar opens it on a press, typing or ↓, and the
// two bars share the query.
function FocusedSearch(props: Partial<SearchViewProps>) {
  const [query, setQuery] = useState('')
  const [isOpen, setOpen] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })
  return (
    <>
      <SearchField
        ref={bar}
        aria-label="Search your messages"
        value={query}
        onChange={(value) => {
          setQuery(value)
          setOpen(true)
        }}
        onClick={() => setOpen(true)}
        data-testid="page-bar"
      >
        <Input placeholder="Search your messages" />
      </SearchField>
      <SearchView
        aria-label="Search your messages"
        triggerRef={bar}
        isOpen={isOpen}
        onOpenChange={setOpen}
        {...props}
      >
        {({ state }) => (
          <Autocomplete
            inputValue={query}
            onInputChange={setQuery}
            filter={contains}
            disableAutoFocusFirst
          >
            <SearchField autoFocus aria-label="Search your messages">
              <IconButton slot="leading" aria-label="Back" onPress={state.close}>
                <Icon name="arrow_back" />
              </IconButton>
              <Input placeholder="Search your messages" />
            </SearchField>
            <List aria-label="Suggestions" renderEmptyState={() => <Text>No suggestions</Text>}>
              {suggestions.map((label) => (
                <ListItem key={label} id={label} textValue={label}>
                  <Text slot="label">{label}</Text>
                </ListItem>
              ))}
            </List>
          </Autocomplete>
        )}
      </SearchView>
    </>
  )
}

const dialog = () => screen.queryByRole('dialog')
const viewBar = () => screen.getAllByRole('searchbox').at(-1)!

describe('SearchView', () => {
  it('is React Aria’s Modal around its Dialog, named by its label, holding what it is given', async () => {
    render(<FocusedSearch />)
    expect(dialog()).not.toBeInTheDocument()
    await userEvent.click(searchbox())
    expect(dialog()).toHaveAccessibleName('Search your messages')
    expect(dialog()).toHaveClass('search-view-dialog')
    expect(dialog()!.parentElement).toHaveClass(
      'search-view',
      'search-view-docked',
      'search-view-contained',
    )
    expect(dialog()!.parentElement!.parentElement).toHaveClass(
      'search-view-overlay',
      'search-view-overlay-docked',
    )
    expect(screen.getByRole('grid', { name: 'Suggestions' })).toBeInTheDocument()
  })

  it('picks the layout’s and the style’s classes', async () => {
    render(<FocusedSearch layout="full-screen" variant="divided" />)
    await userEvent.click(searchbox())
    const modal = dialog()!.parentElement!
    expect(modal).toHaveClass('search-view-full-screen', 'search-view-divided')
    expect(modal.parentElement).not.toHaveClass('search-view-overlay-docked')
  })

  it('takes the focus to its own bar, with the query typed in the page’s', async () => {
    render(<FocusedSearch />)
    await userEvent.type(searchbox(), 'P')
    expect(dialog()).toBeInTheDocument()
    expect(viewBar()).toHaveFocus()
    expect(viewBar()).toHaveValue('P')
    await userEvent.keyboard('et')
    expect(screen.getByTestId('page-bar').querySelector('input')).toHaveValue('Pet')
  })

  it('filters the list as its bar is typed in, and moves through it from Tab with the arrows', async () => {
    render(<FocusedSearch />)
    await userEvent.click(searchbox())
    expect(screen.getAllByRole('row')).toHaveLength(3)
    await userEvent.keyboard('pe')
    expect(screen.getAllByRole('row').map((row) => row.textContent)).toEqual([
      'Peanut butter',
      'Pet adoption',
    ])
    // Typing marks none, so that Enter searches for what is typed. The list is a grid, which
    // React Aria's Autocomplete gives no virtual focus: Tab takes the focus into it, the arrows
    // move it through the rows, and Shift+Tab brings it back to the bar.
    expect(viewBar()).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('row', { name: 'Peanut butter' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('row', { name: 'Pet adoption' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(viewBar()).toHaveFocus()
    await userEvent.keyboard('zzz')
    expect(screen.getByText('No suggestions')).toBeInTheDocument()
  })

  it('acts on the item Tab and the arrows are on with Enter', async () => {
    const onAction = vi.fn()
    function Acting() {
      return (
        <SearchView aria-label="Search" isOpen>
          <Autocomplete>
            <SearchField autoFocus aria-label="Search">
              <Input />
            </SearchField>
            <List aria-label="Suggestions" onAction={onAction}>
              {suggestions.map((label) => (
                <ListItem key={label} id={label} textValue={label}>
                  <Text slot="label">{label}</Text>
                </ListItem>
              ))}
            </List>
          </Autocomplete>
        </SearchView>
      )
    }
    render(<Acting />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onAction).toHaveBeenCalledWith('Pet adoption')
  })

  it('closes from its back button, and gives the focus back to the page’s bar', async () => {
    render(<FocusedSearch />)
    await userEvent.click(searchbox())
    await userEvent.click(button('Back'))
    expect(dialog()).not.toBeInTheDocument()
    await waitFor(() => expect(searchbox()).toHaveFocus())
  })

  it('clears its bar with Escape first, and closes with it once the bar is empty', async () => {
    render(<FocusedSearch />)
    await userEvent.type(searchbox(), 'Pe')
    await userEvent.keyboard('{Escape}')
    expect(dialog()).toBeInTheDocument()
    expect(viewBar()).toHaveValue('')
    await userEvent.keyboard('{Escape}')
    expect(dialog()).not.toBeInTheDocument()
  })

  it('closes on a press outside it', async () => {
    render(<FocusedSearch />)
    await userEvent.click(searchbox())
    await userEvent.click(dialog()!.parentElement!.parentElement!)
    expect(dialog()).not.toBeInTheDocument()
  })

  it('opens from a DialogTrigger’s button, named by it, and is placed and colored by it', async () => {
    const box = { top: 4, left: 16, width: 380, height: 56 }
    render(
      <DialogTrigger>
        <Button style={{ backgroundColor: 'rgb(1, 2, 3)' }}>Search news</Button>
        <SearchView>
          <SearchField autoFocus aria-label="Search news">
            <Input />
          </SearchField>
        </SearchView>
      </DialogTrigger>,
    )
    vi.spyOn(button('Search news'), 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: box.left, y: box.top, width: box.width, height: box.height }),
    )
    await userEvent.click(button('Search news'))
    expect(dialog()).toHaveAccessibleName('Search news')
    expect(searchbox()).toHaveFocus()
    const layer = dialog()!.parentElement!.parentElement!
    expect(layer.style.getPropertyValue('--search-view-trigger-top')).toBe('4px')
    expect(layer.style.getPropertyValue('--search-view-trigger-left')).toBe('16px')
    expect(layer.style.getPropertyValue('--search-view-trigger-width')).toBe('380px')
    expect(layer.style.getPropertyValue('--search-view-trigger-height')).toBe('56px')
    expect(layer.style.getPropertyValue('--search-view-trigger-color')).toBe('rgb(1, 2, 3)')
  })

  it('measures its triggerRef over a DialogTrigger’s, and again as the window resizes', async () => {
    function Measured() {
      const bar = useRef<HTMLDivElement>(null)
      return (
        <DialogTrigger>
          <Button>Search news</Button>
          <div ref={bar} data-testid="bar" />
          <SearchView aria-label="Search news" triggerRef={bar}>
            <SearchField aria-label="Search news">
              <Input />
            </SearchField>
          </SearchView>
        </DialogTrigger>
      )
    }
    render(<Measured />)
    const rect = vi
      .spyOn(screen.getByTestId('bar'), 'getBoundingClientRect')
      .mockReturnValue(DOMRect.fromRect({ x: 24, y: 8, width: 360, height: 56 }))
    await userEvent.click(button('Search news'))
    const layer = dialog()!.parentElement!.parentElement!
    expect(layer.style.getPropertyValue('--search-view-trigger-left')).toBe('24px')
    rect.mockReturnValue(DOMRect.fromRect({ x: 12, y: 8, width: 480, height: 56 }))
    window.dispatchEvent(new Event('resize'))
    expect(layer.style.getPropertyValue('--search-view-trigger-left')).toBe('12px')
    expect(layer.style.getPropertyValue('--search-view-trigger-width')).toBe('480px')
  })

  it('opens only from the button in its DialogTrigger, around an app bar’s search button', async () => {
    render(
      <AppBar>
        <IconButton slot="leading" aria-label="Menu">
          <Icon name="menu" />
        </IconButton>
        <DialogTrigger>
          <Button slot="search">Search news</Button>
          <SearchView aria-label="Search news">
            <SearchField autoFocus aria-label="Search news">
              <Input />
            </SearchField>
          </SearchView>
        </DialogTrigger>
      </AppBar>,
    )
    await userEvent.click(button('Menu'))
    expect(dialog()).toBeNull()
    await userEvent.click(button('Search news'))
    expect(dialog()).toBeInTheDocument()
  })

  it('measures the element its triggerRef holds as the window resizes, not the one it first did', () => {
    function Measured({ id }: { id: string }) {
      const bar = useRef<HTMLDivElement>(null)
      return (
        <>
          <div key={id} ref={bar} data-testid={id} />
          <SearchView aria-label="Search" isOpen triggerRef={bar}>
            <SearchField aria-label="Search">
              <Input />
            </SearchField>
          </SearchView>
        </>
      )
    }
    const { rerender } = render(<Measured id="wide" />)
    rerender(<Measured id="narrow" />)
    vi.spyOn(screen.getByTestId('narrow'), 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 12, y: 8, width: 120, height: 56 }),
    )
    window.dispatchEvent(new Event('resize'))
    const layer = dialog()!.parentElement!.parentElement!
    expect(layer.style.getPropertyValue('--search-view-trigger-left')).toBe('12px')
    expect(layer.style.getPropertyValue('--search-view-trigger-width')).toBe('120px')
  })

  it('clears all it read of its trigger once it has none, open', () => {
    function Measured({ hasTrigger }: { hasTrigger: boolean }) {
      const bar = useRef<HTMLDivElement>(null)
      return (
        <>
          <div ref={bar} />
          <SearchView aria-label="Search" isOpen triggerRef={hasTrigger ? bar : undefined}>
            <SearchField aria-label="Search">
              <Input />
            </SearchField>
          </SearchView>
        </>
      )
    }
    const { rerender } = render(<Measured hasTrigger />)
    const layer = dialog()!.parentElement!.parentElement!
    const names = ['top', 'left', 'width', 'height', 'color', 'opacity'].map(
      (name) => `--search-view-trigger-${name}`,
    )
    for (const name of names) expect(layer.style.getPropertyValue(name)).not.toBe('')
    rerender(<Measured hasTrigger={false} />)
    expect(dialog()!.parentElement!.parentElement).toBe(layer)
    window.dispatchEvent(new Event('resize'))
    for (const name of names) expect(layer.style.getPropertyValue(name)).toBe('')
  })

  it('sets no trigger’s box when nothing opened it', () => {
    render(
      <SearchView aria-label="Search" isOpen>
        <SearchField aria-label="Search">
          <Input />
        </SearchField>
      </SearchView>,
    )
    const layer = dialog()!.parentElement!.parentElement!
    expect(layer.style.getPropertyValue('--search-view-trigger-top')).toBe('')
  })
})
