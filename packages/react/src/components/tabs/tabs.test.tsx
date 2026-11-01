import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import type { Key } from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Except } from '../../lib/aria'
import { Icon } from '../icon'
import { Tab, TabList, TabPanel, Tabs, type TabRenderProps, type TabsProps } from '.'

/* Markup and behavior that jsdom can check without a stylesheet: the roles React Aria
 * renders, selection by press and keyboard and when each selects, a tab's parts, function
 * children and the props passed through. What the states look like: tabs.browser.test.tsx. */

const tab = (name: string) => screen.getByRole('tab', { name })
const tablist = () => screen.getByRole('tablist')
const panel = () => screen.getByRole('tabpanel')

const names = ['Flights', 'Trips', 'Explore'] as const

/** Three tabs with a panel each, named by their ids, the second disabled if asked. */
function Destinations({
  disabled,
  ...props
}: Except<TabsProps, 'children'> & { disabled?: (typeof names)[number] }) {
  return (
    <Tabs {...props}>
      <TabList>
        {names.map((name) => (
          <Tab key={name} id={name} isDisabled={name === disabled}>
            {name}
          </Tab>
        ))}
      </TabList>
      {names.map((name) => (
        <TabPanel key={name} id={name}>
          {name} panel
        </TabPanel>
      ))}
    </Tabs>
  )
}

describe('Tabs', () => {
  describe('markup', () => {
    it('renders a tablist of tabs, each a div in the role, and the panel of the selected tab, named by it', () => {
      render(<Destinations defaultSelectedKey="Flights" />)
      const tabs = within(tablist()).getAllByRole('tab')
      expect(tabs.map((el) => el.textContent)).toEqual([...names])
      for (const el of tabs) {
        expect(el.tagName).toBe('DIV')
        expect(el).not.toHaveAttribute('type')
      }
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'false')
      expect(panel()).toHaveTextContent('Flights panel')
      expect(panel()).toHaveAttribute('aria-labelledby', tab('Flights').id)
      expect(tab('Flights')).toHaveAttribute('aria-controls', panel().id)
      expect(screen.queryByText('Trips panel')).not.toBeInTheDocument()
    })

    it('passes refs, classes and other props through to the elements React Aria renders', () => {
      const group = createRef<HTMLDivElement>()
      const list = createRef<HTMLDivElement>()
      const one = createRef<HTMLDivElement>()
      render(
        <Tabs ref={group} data-testid="group" className="group-class">
          <TabList ref={list} className="list-class" aria-label="Choose a destination">
            <Tab id="flights">Flights</Tab>
          </TabList>
          <TabPanel id="flights" ref={one} className="panel-class" data-testid="panel">
            Flights panel
          </TabPanel>
        </Tabs>,
      )
      expect(group.current).toBe(screen.getByTestId('group'))
      expect(group.current).toHaveClass('group-class')
      expect(list.current).toBe(screen.getByRole('tablist', { name: 'Choose a destination' }))
      expect(list.current).toHaveClass('list-class')
      expect(one.current).toBe(panel())
      expect(panel()).toHaveAttribute('data-testid', 'panel')
      expect(panel()).toHaveClass('panel-class')
    })

    it('calls a className given as a function with the state and the class React Aria gives each', () => {
      render(
        <Tabs
          data-testid="group"
          className={({ orientation, defaultClassName }) => `${defaultClassName} on-${orientation}`}
        >
          <TabList
            className={({ orientation, defaultClassName }) =>
              `${defaultClassName} on-${orientation}`
            }
          >
            <Tab id="flights">Flights</Tab>
          </TabList>
          <TabPanel
            id="flights"
            className={({ isInert, defaultClassName }) => `${defaultClassName} inert-${isInert}`}
          >
            Flights panel
          </TabPanel>
        </Tabs>,
      )
      expect(screen.getByTestId('group')).toHaveClass('react-aria-Tabs', 'on-horizontal')
      expect(tablist()).toHaveClass('react-aria-TabList', 'on-horizontal')
      expect(panel()).toHaveClass('react-aria-TabPanel', 'inert-false')
    })

    it('keeps every panel in the DOM, the unselected ones inert, with shouldForceMount', () => {
      render(
        <Tabs>
          <TabList>
            <Tab id="flights">Flights</Tab>
            <Tab id="trips">Trips</Tab>
          </TabList>
          <TabPanel id="flights" shouldForceMount>
            Flights panel
          </TabPanel>
          <TabPanel id="trips" shouldForceMount>
            Trips panel
          </TabPanel>
        </Tabs>,
      )
      expect(screen.getByText('Trips panel')).toHaveAttribute('inert')
      expect(screen.getByText('Flights panel')).not.toHaveAttribute('inert')
      // Only the selected one is the tabpanel of its tab.
      expect(screen.getAllByRole('tabpanel')).toEqual([screen.getByText('Flights panel')])
    })
  })

  describe('selection', () => {
    it('selects the first tab once mounted when given no key, as React Aria has it, and reports it once', () => {
      const onSelectionChange = vi.fn()
      render(<Destinations onSelectionChange={onSelectionChange} />)
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(panel()).toHaveTextContent('Flights panel')
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('Flights')
    })

    it('starts on defaultSelectedKey, reporting nothing', () => {
      const onSelectionChange = vi.fn()
      render(<Destinations defaultSelectedKey="Explore" onSelectionChange={onSelectionChange} />)
      expect(tab('Explore')).toHaveAttribute('aria-selected', 'true')
      expect(panel()).toHaveTextContent('Explore panel')
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('selects a tab by a click and reports its key', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      render(<Destinations defaultSelectedKey="Flights" onSelectionChange={onSelectionChange} />)
      await user.click(tab('Trips'))
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'false')
      expect(panel()).toHaveTextContent('Trips panel')
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('Trips')
    })

    it('selects a tab as the mouse goes down on it, as React Aria has it', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      render(<Destinations defaultSelectedKey="Flights" onSelectionChange={onSelectionChange} />)
      await user.pointer({ keys: '[MouseLeft>]', target: tab('Trips') })
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
      expect(tab('Trips')).toHaveAttribute('data-pressed')
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('Trips')
      await user.pointer('[/MouseLeft]')
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
      expect(tab('Trips')).not.toHaveAttribute('data-pressed')
      expect(onSelectionChange).toHaveBeenCalledOnce()
    })

    it('follows the href of a link tab as the press lifts and leaves the selection to selectedKey, as React Aria has it', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <Tabs selectedKey="#flights" onSelectionChange={onSelectionChange}>
          <TabList>
            <Tab id="#flights" href="#flights">
              Flights
            </Tab>
            <Tab id="#trips" href="#trips">
              Trips
            </Tab>
          </TabList>
          <TabPanel id="#flights">Flights panel</TabPanel>
          <TabPanel id="#trips">Trips panel</TabPanel>
        </Tabs>,
      )
      await user.pointer({ keys: '[MouseLeft>]', target: tab('Trips') })
      expect(tab('Trips')).toHaveAttribute('data-pressed')
      expect(window.location.hash).toBe('')
      await user.pointer('[/MouseLeft]')
      expect(window.location.hash).toBe('#trips')
      // The selection is set back to what it was, and reported so: the location is the caller's
      // to read and set the key from.
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('#flights')
      rerender(
        <Tabs selectedKey={window.location.hash} onSelectionChange={onSelectionChange}>
          <TabList>
            <Tab id="#flights" href="#flights">
              Flights
            </Tab>
            <Tab id="#trips" href="#trips">
              Trips
            </Tab>
          </TabList>
          <TabPanel id="#flights">Flights panel</TabPanel>
          <TabPanel id="#trips">Trips panel</TabPanel>
        </Tabs>,
      )
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
      expect(panel()).toHaveTextContent('Trips panel')
      window.location.hash = ''
    })

    it('shows what selectedKey says when controlled, and reports a click without changing on its own', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <Destinations selectedKey="Flights" onSelectionChange={onSelectionChange} />,
      )
      await user.click(tab('Explore'))
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('Explore')
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      rerender(<Destinations selectedKey="Explore" onSelectionChange={onSelectionChange} />)
      expect(tab('Explore')).toHaveAttribute('aria-selected', 'true')
      expect(panel()).toHaveTextContent('Explore panel')
    })

    it('selects through its caller when controlled by state', async () => {
      function Controlled() {
        const [key, setKey] = useState<Key>('Trips')
        return <Destinations selectedKey={key} onSelectionChange={setKey} />
      }
      const user = userEvent.setup()
      render(<Controlled />)
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
      await user.click(tab('Flights'))
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(panel()).toHaveTextContent('Flights panel')
    })

    // The arrow keys skipping a disabled tab is checked in the browser, where the focus really moves.
    it('does not select a disabled tab by a click, disabled by its prop or by the disabledKeys', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <Destinations
          defaultSelectedKey="Flights"
          disabled="Trips"
          onSelectionChange={onSelectionChange}
        />,
      )
      expect(tab('Trips')).toHaveAttribute('aria-disabled', 'true')
      expect(tab('Trips')).toHaveAttribute('data-disabled')
      expect(tab('Trips')).not.toHaveAttribute('tabindex')
      await user.click(tab('Trips'))
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).not.toHaveBeenCalled()
      rerender(
        <Destinations
          defaultSelectedKey="Flights"
          disabledKeys={['Explore']}
          onSelectionChange={onSelectionChange}
        />,
      )
      expect(tab('Trips')).not.toHaveAttribute('aria-disabled')
      expect(tab('Explore')).toHaveAttribute('aria-disabled', 'true')
      await user.click(tab('Explore'))
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('disables every tab with isDisabled on the Tabs', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      render(
        <Destinations
          defaultSelectedKey="Flights"
          isDisabled
          onSelectionChange={onSelectionChange}
        />,
      )
      for (const name of names) expect(tab(name)).toHaveAttribute('aria-disabled', 'true')
      await user.click(tab('Trips'))
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).not.toHaveBeenCalled()
    })
  })

  describe('keyboard', () => {
    it('is one tab stop, the selected tab, with the panel the next one', async () => {
      const user = userEvent.setup()
      render(<Destinations defaultSelectedKey="Trips" />)
      await user.tab()
      expect(tab('Trips')).toHaveFocus()
      expect(tab('Flights')).toHaveAttribute('tabindex', '-1')
      await user.tab()
      expect(panel()).toHaveFocus()
    })

    it('moves the focus with the arrow keys, wrapping around, without selecting, and selects with Space or Enter', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      render(<Destinations defaultSelectedKey="Flights" onSelectionChange={onSelectionChange} />)
      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(tab('Trips')).toHaveFocus()
      expect(tab('Flights')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).not.toHaveBeenCalled()
      await user.keyboard('{ArrowRight}{ArrowRight}')
      expect(tab('Flights')).toHaveFocus()
      await user.keyboard('{ArrowLeft}')
      expect(tab('Explore')).toHaveFocus()
      await user.keyboard('{Enter}')
      expect(tab('Explore')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('Explore')
      await user.keyboard('{ArrowLeft}')
      expect(tab('Trips')).toHaveFocus()
      await user.keyboard(' ')
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).toHaveBeenLastCalledWith('Trips')
    })

    it('moves to the first and last tab with Home and End', async () => {
      const user = userEvent.setup()
      render(<Destinations defaultSelectedKey="Trips" />)
      await user.tab()
      await user.keyboard('{Home}')
      expect(tab('Flights')).toHaveFocus()
      await user.keyboard('{End}')
      expect(tab('Explore')).toHaveFocus()
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
    })

    it('selects the tab the arrow keys move to with keyboardActivation automatic', async () => {
      const onSelectionChange = vi.fn()
      const user = userEvent.setup()
      render(
        <Destinations
          defaultSelectedKey="Flights"
          keyboardActivation="automatic"
          onSelectionChange={onSelectionChange}
        />,
      )
      await user.tab()
      await user.keyboard('{ArrowRight}')
      expect(tab('Trips')).toHaveFocus()
      expect(tab('Trips')).toHaveAttribute('aria-selected', 'true')
      expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith('Trips')
    })
  })

  describe('a tab', () => {
    it('draws its children as written in its content, its text as it is among them', () => {
      render(
        <Tabs>
          <TabList>
            <Tab>
              <Icon name="flight" data-testid="icon" />
              Flights
              <span data-testid="badge">3</span>
            </Tab>
          </TabList>
        </Tabs>,
      )
      const icon = screen.getByTestId('icon')
      const badge = screen.getByTestId('badge')
      // The content holds them in the order written, and then its indicator.
      const content = icon.parentElement!
      const text = content.childNodes[1]!
      expect(text.nodeType).toBe(Node.TEXT_NODE)
      expect(text.textContent).toBe('Flights')
      expect([...content.childNodes]).toEqual([icon, text, badge, content.lastElementChild])
      expect(content.lastElementChild).toHaveAttribute('aria-hidden', 'true')
      expect(content.parentElement).toBe(screen.getByRole('tab', { name: /^Flights/ }))
    })

    it('holds an icon alone, named by aria-label', () => {
      render(
        <Tabs>
          <TabList>
            <Tab aria-label="Favorites">
              <Icon name="favorite" data-testid="icon" />
            </Tab>
          </TabList>
        </Tabs>,
      )
      const icon = screen.getByTestId('icon')
      expect(tab('Favorites')).toContainElement(icon)
      // The content holds the icon and the indicator, nothing else.
      expect(icon.parentElement!.children).toHaveLength(2)
      expect(icon.parentElement!.lastElementChild).toHaveAttribute('aria-hidden', 'true')
    })

    it('draws a primary indicator in its content and a secondary one across the tab', () => {
      const { rerender } = render(
        <Tabs>
          <TabList>
            <Tab>Flights</Tab>
          </TabList>
        </Tabs>,
      )
      // Plain text is drawn as it is, in the content: getByText finds the content itself.
      const content = () => screen.getByText('Flights')
      expect(content().lastElementChild).toHaveAttribute('aria-hidden', 'true')
      expect(content().parentElement).toBe(tab('Flights'))
      expect(tab('Flights').lastElementChild).toBe(content())
      rerender(
        <Tabs variant="secondary">
          <TabList>
            <Tab>Flights</Tab>
          </TabList>
        </Tabs>,
      )
      expect(tab('Flights').lastElementChild).not.toBe(content())
      expect(tab('Flights').lastElementChild).toHaveAttribute('aria-hidden', 'true')
      expect(content().children).toHaveLength(0)
    })

    it('calls function children with the state React Aria reports', async () => {
      const seen: TabRenderProps[] = []
      const user = userEvent.setup()
      render(
        <Tabs>
          <TabList>
            <Tab>
              {(state) => {
                seen.push(state)
                return state.isSelected ? 'Flights, selected' : 'Flights'
              }}
            </Tab>
            <Tab>Trips</Tab>
          </TabList>
        </Tabs>,
      )
      expect(tab('Flights, selected')).toBeInTheDocument()
      expect(seen.at(-1)).toMatchObject({
        isSelected: true,
        isDisabled: false,
        isHovered: false,
        isPressed: false,
        isFocused: false,
        isFocusVisible: false,
      })
      await user.hover(tab('Flights, selected'))
      expect(seen.at(-1)).toMatchObject({ isHovered: true })
      await user.click(tab('Trips'))
      expect(tab('Flights')).toBeInTheDocument()
      expect(seen.at(-1)).toMatchObject({ isSelected: false, isDisabled: false })
    })

    it('reports its states as data attributes, for its parts to draw', async () => {
      const user = userEvent.setup()
      render(<Destinations defaultSelectedKey="Flights" />)
      expect(tab('Flights')).toHaveAttribute('data-selected')
      expect(tab('Trips')).not.toHaveAttribute('data-selected')
      await user.hover(tab('Trips'))
      expect(tab('Trips')).toHaveAttribute('data-hovered')
      await user.unhover(tab('Trips'))
      expect(tab('Trips')).not.toHaveAttribute('data-hovered')
      await user.tab()
      expect(tab('Flights')).toHaveAttribute('data-focused')
      expect(tab('Flights')).toHaveAttribute('data-focus-visible')
    })

    it('takes a className as a function of its state, a ref, and is a link given an href', () => {
      const ref = createRef<HTMLDivElement>()
      render(
        <Tabs>
          <TabList>
            <Tab
              className={({ isSelected, defaultClassName }) =>
                `${defaultClassName} ${isSelected ? 'is-selected' : 'is-not'}`
              }
            >
              Flights
            </Tab>
            <Tab href="#trips" ref={ref} className="is-link">
              Trips
            </Tab>
          </TabList>
        </Tabs>,
      )
      expect(tab('Flights')).toHaveClass('react-aria-Tab', 'is-selected')
      expect(tab('Trips').tagName).toBe('A')
      expect(tab('Trips')).toHaveAttribute('href', '#trips')
      expect(tab('Trips')).toHaveClass('is-link')
      expect(ref.current).toBe(tab('Trips'))
    })
  })

  describe('the list and panels', () => {
    it('renders a scrollable list and switches tabs in it', async () => {
      const user = userEvent.setup()
      render(
        <Tabs>
          <TabList isScrollable>
            {names.map((name) => (
              <Tab key={name}>{name}</Tab>
            ))}
          </TabList>
        </Tabs>,
      )
      await user.click(tab('Explore'))
      expect(tab('Explore')).toHaveAttribute('aria-selected', 'true')
      expect(tab('Explore')).toHaveFocus()
      await user.keyboard('{ArrowLeft}')
      expect(tab('Trips')).toHaveFocus()
    })

    it('draws a tab for each of its items with a function of it, typed by the item, keyed by its id', () => {
      const items = [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
      ]
      render(
        <Tabs defaultSelectedKey="b">
          <TabList items={items}>{(item) => <Tab>{item.label}</Tab>}</TabList>
          {items.map((item) => (
            <TabPanel key={item.id} id={item.id}>
              {item.label} panel
            </TabPanel>
          ))}
        </Tabs>,
      )
      const tabs = within(tablist()).getAllByRole('tab')
      expect(tabs.map((el) => el.textContent)).toEqual(['Alpha', 'Beta'])
      expect(tab('Beta')).toHaveAttribute('aria-selected', 'true')
      expect(panel()).toHaveTextContent('Beta panel')
    })

    it('passes the orientation to function children of the group, and the panel its state', () => {
      render(
        <Tabs defaultSelectedKey="trips">
          {({ orientation }) => (
            <>
              <TabList>
                <Tab id="flights">Flights</Tab>
                <Tab id="trips">Trips {orientation}</Tab>
              </TabList>
              <TabPanel id="flights">Flights panel</TabPanel>
              <TabPanel id="trips">
                {({ isFocused, isInert, state }) => (
                  <>
                    Trips panel {String(state.selectedKey)} {String(isInert)} {String(isFocused)}
                  </>
                )}
              </TabPanel>
            </>
          )}
        </Tabs>,
      )
      expect(tab('Trips horizontal')).toBeInTheDocument()
      expect(panel()).toHaveTextContent('Trips panel trips false false')
    })
  })

  it('types a function child by the state it is passed, on a link tab too', () => {
    expectTypeOf<TabRenderProps>().toHaveProperty('isSelected').toEqualTypeOf<boolean>()
    expectTypeOf<TabRenderProps>().toHaveProperty('isHovered').toEqualTypeOf<boolean>()
    const _typed = (
      <Tabs>
        <TabList>
          <Tab href="#flights">
            {({ isSelected }) => (isSelected ? 'Flights, selected' : 'Flights')}
          </Tab>
          {/* @ts-expect-error a function child returns children, not an object */}
          <Tab>{() => ({ not: 'a node' })}</Tab>
          {/* @ts-expect-error it is passed no such state */}
          <Tab>{({ selected }) => String(selected)}</Tab>
        </TabList>
      </Tabs>
    )
    void _typed
  })
})
