import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ReactElement } from 'react'
import { Text, useListData, type Key, type Selection } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from '../checkbox'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { Switch } from '../switch'
import * as exported from '.'
import { List, ListItem, useDragAndDrop, type ListItemRenderProps, type ListProps } from '.'

/*
 * Behavior and markup that jsdom can check without a stylesheet: roles, accessible names, DOM
 * structure, the slots, selection, actions and the keyboard. What a class resolves to visually -
 * colors, sizes, padding, the hit areas - needs the real stylesheet: list.browser.test.tsx.
 */

/** What an item draws in its gridcell, the ripple left out: its text, and each part by its slot. */
const content = (cell: HTMLElement) =>
  [...cell.childNodes].flatMap((node) =>
    node instanceof Element
      ? node.hasAttribute('slot')
        ? [`${node.getAttribute('slot')}: ${node.textContent}`]
        : []
      : [`text: ${node.textContent}`],
  )

const row = (name: string | RegExp) => screen.getByRole('row', { name })
const cellOf = (item: HTMLElement) => within(item).getByRole('gridcell')

/** A list of three contacts; `props` go on the list. */
function Contacts(props: Partial<ListProps>) {
  return (
    <List aria-label="Contacts" {...props}>
      <ListItem id="ali" textValue="Ali Connors">
        <Icon slot="leading" name="person" />
        <Text slot="label">Ali Connors</Text>
        <Text slot="description">Brunch this weekend?</Text>
      </ListItem>
      <ListItem id="jennifer" textValue="Jennifer Lopez">
        <Text slot="label">Jennifer Lopez</Text>
      </ListItem>
      <ListItem id="sandra">Sandra Adams</ListItem>
    </List>
  )
}

/** Renders an item alone in a list, to see whether it throws. */
const rendering = (item: ReactElement) => () => render(<List aria-label="List">{item}</List>)

describe('List', () => {
  it("is React Aria's GridList: a div in the grid role, named by aria-label, holding its items as rows", () => {
    render(<Contacts />)
    const list = screen.getByRole('grid', { name: 'Contacts' })
    expect(list.tagName).toBe('DIV')
    expect(list).toHaveClass('list')
    expect(screen.getAllByRole('row').map((item) => item.textContent)).toEqual([
      'personAli ConnorsBrunch this weekend?',
      'Jennifer Lopez',
      'Sandra Adams',
    ])
  })

  it('takes the segmented style and dividers as classes of its own', () => {
    const { rerender } = render(<Contacts />)
    const list = screen.getByRole('grid')
    expect(list).not.toHaveClass('list-segmented', 'list-divided')
    rerender(<Contacts variant="segmented" hasDivider />)
    expect(list).toHaveClass('list-segmented', 'list-divided')
  })

  it('takes a className, a string or a function of its state, after its own, and a ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Contacts
        ref={ref}
        className={({ isEmpty, defaultClassName }) =>
          `${defaultClassName} ${isEmpty ? 'empty' : 'full'}`
        }
      />,
    )
    expect(ref.current).toBe(screen.getByRole('grid'))
    expect(ref.current).toHaveClass('react-aria-GridList', 'full', 'list')
  })

  it('draws its items from `items`, with a function of each, and its empty state with none', () => {
    const { rerender } = render(
      <List aria-label="Names" items={[{ id: 1, name: 'Ali' }]} renderEmptyState={() => 'Nobody'}>
        {(item) => <ListItem>{item.name}</ListItem>}
      </List>,
    )
    expect(row('Ali')).toBeInTheDocument()
    rerender(
      <List aria-label="Names" items={[]} renderEmptyState={() => 'Nobody'}>
        {(item: { id: number; name: string }) => <ListItem>{item.name}</ListItem>}
      </List>,
    )
    expect(screen.getByRole('grid')).toHaveAttribute('data-empty')
    expect(screen.getByText('Nobody')).toBeInTheDocument()
  })

  it('says which way it runs', () => {
    render(<Contacts orientation="horizontal" />)
    expect(screen.getByRole('grid')).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('exports List, ListItem and useDragAndDrop', () => {
    expect(Object.keys(exported).sort()).toEqual(['List', 'ListItem', 'useDragAndDrop'])
  })
})

describe('ListItem', () => {
  it("is React Aria's GridListItem: a row with its content in a gridcell, named by its text", () => {
    render(<Contacts />)
    const item = row('Ali Connors Brunch this weekend?')
    expect(item.tagName).toBe('DIV')
    expect(item).toHaveClass('group/md-list-item', 'list-item-container')
    expect(cellOf(item)).toBeInTheDocument()
    expect(cellOf(item).style.display).toBe('contents')
  })

  it('takes plain text as its textValue, which names it', () => {
    render(<Contacts />)
    expect(row('Sandra Adams')).toBeInTheDocument()
    expect(content(cellOf(row('Sandra Adams')))).toEqual(['text: Sandra Adams'])
  })

  it('takes plain text as its textValue when the one given is undefined, and typing finds it', async () => {
    const passedOn: { textValue?: string } = {}
    render(
      <List aria-label="Names">
        <ListItem id="ali">Ali Connors</ListItem>
        <ListItem id="sandra" textValue={passedOn.textValue}>
          Sandra Adams
        </ListItem>
      </List>,
    )
    await userEvent.tab()
    expect(row('Ali Connors')).toHaveFocus()
    await userEvent.keyboard('s')
    expect(row('Sandra Adams')).toHaveFocus()
    expect(row('Sandra Adams')).toHaveAttribute('aria-label', 'Sandra Adams')
  })

  it('draws its parts in their slots, as written: the texts, an icon and an icon button', () => {
    render(
      <List aria-label="Inbox">
        <ListItem id="ali" textValue="Ali Connors">
          <Icon slot="leading" name="person" />
          <Text slot="overline">Overline</Text>
          <Text slot="label">Ali Connors</Text>
          <Text slot="description">Brunch this weekend?</Text>
          <Text slot="trailing">100+</Text>
          <Icon slot="trailing" name="star" />
          <IconButton slot="trailing" aria-label="More options">
            <Icon name="more_vert" />
          </IconButton>
        </ListItem>
      </List>,
    )
    expect(content(cellOf(row(/^Ali Connors/)))).toEqual([
      'leading: person',
      'overline: Overline',
      'label: Ali Connors',
      'description: Brunch this weekend?',
      'trailing: 100+',
      'trailing: star',
      'trailing: more_vert',
    ])
    expect(screen.getByRole('button', { name: 'More options' })).toBeInTheDocument()
  })

  it('disables the buttons in its leading and trailing slots with it, a selectable one too, unless one says otherwise', () => {
    render(
      <List aria-label="Contacts" disabledKeys={['ali']}>
        <ListItem id="ali" textValue="Ali Connors">
          <IconButton slot="leading" aria-label="Pin" isSelectable>
            <Icon name="keep" />
          </IconButton>
          <Text slot="label">Ali Connors</Text>
          <IconButton slot="trailing" aria-label="Favorite" isSelectable>
            <Icon name="star" />
          </IconButton>
          <IconButton slot="trailing" aria-label="Share" isSelectable isDisabled={false}>
            <Icon name="share" />
          </IconButton>
          <IconButton slot="trailing" aria-label="More options">
            <Icon name="more_vert" />
          </IconButton>
        </ListItem>
        <ListItem id="jennifer" textValue="Jennifer Lopez">
          <Text slot="label">Jennifer Lopez</Text>
          <IconButton slot="trailing" aria-label="Favorite Jennifer" isSelectable>
            <Icon name="star" />
          </IconButton>
        </ListItem>
      </List>,
    )
    const button = (name: string) => screen.getByRole('button', { name })
    expect(button('Pin')).toBeDisabled()
    expect(button('Favorite')).toBeDisabled()
    expect(button('Favorite')).toHaveAttribute('aria-pressed', 'false')
    expect(button('More options')).toBeDisabled()
    expect(button('Share')).toBeEnabled()
    expect(button('Favorite Jennifer')).toBeEnabled()
  })

  it('throws React Aria’s error for a Text or an Icon in a slot it does not have', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      rendering(
        <ListItem id="a" textValue="A">
          <Text slot="trailng">A</Text>
        </ListItem>,
      ),
    ).toThrow('Invalid slot "trailng".')
    expect(
      rendering(
        <ListItem id="a" textValue="A">
          <Icon slot="label" name="star" />
        </ListItem>,
      ),
    ).toThrow('Invalid slot "label".')
    vi.restoreAllMocks()
  })

  it('draws an element of yours in any slot, where it is written', () => {
    render(
      <List aria-label="Settings">
        <ListItem id="wifi" textValue="Wi-Fi">
          <span slot="leading">W</span>
          <Text slot="label">Wi-Fi</Text>
          <Switch slot="trailing" aria-label="Wi-Fi" defaultSelected />
        </ListItem>
      </List>,
    )
    expect(content(cellOf(row('Wi-Fi')))).toEqual(['leading: W', 'label: Wi-Fi', 'trailing: '])
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeChecked()
  })

  it('takes its children as a function of its state, as React Aria’s row does', async () => {
    const children = vi.fn(({ isSelected }: ListItemRenderProps) => (
      <Text slot="label">{isSelected ? 'Selected' : 'Not selected'}</Text>
    ))
    render(
      <List aria-label="Options" selectionMode="single">
        <ListItem id="a" textValue="A">
          {children}
        </ListItem>
      </List>,
    )
    expect(screen.getByText('Not selected')).toBeInTheDocument()
    await userEvent.click(row('A'))
    expect(screen.getByText('Selected')).toBeInTheDocument()
    expect(children).toHaveBeenLastCalledWith(
      expect.objectContaining({ isSelected: true, selectionMode: 'single', allowsDragging: false }),
    )
  })

  it('acts on a click or Enter, calling its onAction and the list’s with its id', async () => {
    const onItem = vi.fn()
    const onList = vi.fn()
    render(
      <List aria-label="Contacts" onAction={onList}>
        <ListItem id="ali" textValue="Ali Connors" onAction={onItem}>
          <Text slot="label">Ali Connors</Text>
        </ListItem>
      </List>,
    )
    await userEvent.click(row(/^Ali Connors/))
    expect(onItem).toHaveBeenCalledTimes(1)
    expect(onList).toHaveBeenCalledWith('ali')
    await userEvent.keyboard('{Enter}')
    expect(onItem).toHaveBeenCalledTimes(2)
  })

  it('is a link given an href, which the list follows and does not select', async () => {
    const onSelectionChange = vi.fn()
    render(
      <List aria-label="Links" selectionMode="single" onSelectionChange={onSelectionChange}>
        <ListItem id="inbox" textValue="Inbox" href="#inbox">
          <Text slot="label">Inbox</Text>
        </ListItem>
      </List>,
    )
    const item = row('Inbox')
    expect(item).toHaveAttribute('data-href', '#inbox')
    await userEvent.click(item)
    expect(onSelectionChange).not.toHaveBeenCalled()
  })

  it('selects by its id in a single or multiple selection list, by a click or Space', async () => {
    const onSelectionChange = vi.fn()
    const { rerender } = render(
      <Contacts selectionMode="single" onSelectionChange={onSelectionChange} />,
    )
    await userEvent.click(row(/^Ali Connors/))
    expect(row(/^Ali Connors/)).toHaveAttribute('aria-selected', 'true')
    expect(row(/^Ali Connors/)).toHaveAttribute('data-selected')
    expect([...(onSelectionChange.mock.lastCall![0] as Selection)]).toEqual(['ali'])
    rerender(<Contacts selectionMode="multiple" onSelectionChange={onSelectionChange} />)
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true')
    await userEvent.click(row('Jennifer Lopez'))
    await userEvent.keyboard('{ArrowDown} ')
    expect([...(onSelectionChange.mock.lastCall![0] as Selection)]).toEqual([
      'ali',
      'jennifer',
      'sandra',
    ])
  })

  it('shows and toggles its selection with a Checkbox in the selection, leading or trailing slot', async () => {
    const onSelectionChange = vi.fn()
    render(
      <List aria-label="Contacts" selectionMode="multiple" onSelectionChange={onSelectionChange}>
        <ListItem id="ali" textValue="Ali Connors">
          <Checkbox slot="selection" />
          <Text slot="label">Ali Connors</Text>
        </ListItem>
        <ListItem id="jennifer" textValue="Jennifer Lopez">
          <Checkbox slot="leading" />
          <Text slot="label">Jennifer Lopez</Text>
        </ListItem>
        <ListItem id="sandra" textValue="Sandra Adams">
          <Text slot="label">Sandra Adams</Text>
          <Checkbox slot="trailing" />
        </ListItem>
      </List>,
    )
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
    for (const checkbox of checkboxes) expect(checkbox).not.toBeChecked()
    await userEvent.click(row('Jennifer Lopez'))
    expect(checkboxes[1]).toBeChecked()
    await userEvent.click(checkboxes[2]!)
    expect(row('Sandra Adams')).toHaveAttribute('aria-selected', 'true')
    expect([...(onSelectionChange.mock.lastCall![0] as Selection)]).toEqual(['jennifer', 'sandra'])
  })

  it('is disabled by the list’s disabledKeys or its own isDisabled, its buttons with it', () => {
    render(
      <List aria-label="Contacts" disabledKeys={['ali']}>
        <ListItem id="ali" textValue="Ali Connors">
          <Text slot="label">Ali Connors</Text>
          <IconButton slot="trailing" aria-label="More options">
            <Icon name="more_vert" />
          </IconButton>
        </ListItem>
        <ListItem id="jennifer" textValue="Jennifer Lopez" isDisabled>
          <Text slot="label">Jennifer Lopez</Text>
        </ListItem>
        <ListItem id="sandra" textValue="Sandra Adams">
          <Text slot="label">Sandra Adams</Text>
          <IconButton slot="trailing" aria-label="Share">
            <Icon name="share" />
          </IconButton>
        </ListItem>
      </List>,
    )
    expect(row(/^Ali Connors/)).toHaveAttribute('aria-disabled', 'true')
    expect(row(/^Ali Connors/)).toHaveAttribute('data-disabled')
    expect(row('Jennifer Lopez')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'More options' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Share' })).toBeEnabled()
  })

  it('is one tab stop, moved through with the arrows, its buttons reached sideways', async () => {
    render(
      <>
        <button>Before</button>
        <List aria-label="Contacts">
          <ListItem id="ali" textValue="Ali Connors">
            <Text slot="label">Ali Connors</Text>
            <IconButton slot="trailing" aria-label="More options">
              <Icon name="more_vert" />
            </IconButton>
          </ListItem>
          <ListItem id="jennifer" textValue="Jennifer Lopez">
            <Text slot="label">Jennifer Lopez</Text>
          </ListItem>
        </List>
        <button>After</button>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Before' }))
    await userEvent.tab()
    expect(row(/^Ali Connors/)).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(row('Jennifer Lopez')).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{ArrowRight}')
    expect(screen.getByRole('button', { name: 'More options' })).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(row(/^Ali Connors/)).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  it('draws a drag handle, React Aria’s drag button, in a list that drags its items', () => {
    function Reorderable() {
      const list = useListData({ initialItems: [{ id: 'ali', name: 'Ali Connors' }] })
      const { dragAndDropHooks } = useDragAndDrop({
        getItems: (keys: Set<Key>) => [...keys].map((key) => ({ 'text/plain': String(key) })),
        onReorder: () => {},
      })
      return (
        <List aria-label="Favorites" items={list.items} dragAndDropHooks={dragAndDropHooks}>
          {(item) => (
            <ListItem textValue={item.name}>
              <Text slot="label">{item.name}</Text>
            </ListItem>
          )}
        </List>
      )
    }
    render(<Reorderable />)
    const item = row(/^Ali Connors/)
    expect(item).toHaveAttribute('data-allows-dragging')
    const handle = within(item).getByRole('button', { name: /Ali Connors/ })
    expect(handle).toHaveAttribute('slot', 'drag')
    expect(handle).toHaveClass('list-item-drag-handle')
    expect(handle.textContent).toBe('drag_handle')
    // Before the item's parts, after the ripple's layer and surface.
    expect(cellOf(item).querySelector('button')).toBe(handle)
    expect(handle.compareDocumentPosition(screen.getByText('Ali Connors'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('takes a className, a string or a function of its state, after its own, and a ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <List aria-label="Contacts" selectionMode="single" defaultSelectedKeys={['ali']}>
        <ListItem
          id="ali"
          textValue="Ali Connors"
          ref={ref}
          className={({ isSelected, defaultClassName }) =>
            `${defaultClassName} ${isSelected ? 'on' : 'off'}`
          }
        >
          <Text slot="label">Ali Connors</Text>
        </ListItem>
      </List>,
    )
    expect(ref.current).toBe(row(/^Ali Connors/))
    expect(ref.current).toHaveClass('react-aria-GridListItem', 'on', 'list-item-container')
  })
})
