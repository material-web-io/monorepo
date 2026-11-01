import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState, type ReactNode } from 'react'
import { Text } from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Except } from '../../lib/aria'
import { Fab } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import {
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
  NavigationRailSection,
  type NavigationRailItemRenderProps,
  type NavigationRailProps,
} from '.'

/* Markup and behavior that jsdom can check without a stylesheet: React Aria's toolbar and what
 * it holds, selection as it is said, an item's parts collapsed and expanded, the header,
 * sections, the keyboard. Looks and motion: navigation-rail.browser.test.tsx. */

const rail = () => screen.getByRole('toolbar')
const item = (name: string) => screen.getByRole('button', { name })
/** What the rail holds: its header, its items and its sections. */
const contentOf = (el: HTMLElement) => el.firstElementChild as HTMLElement
/** The icon and the label beside it, the item's first child; the indicator's box in it. */
const hugOf = (name: string) => item(name).firstElementChild as HTMLElement
/** The two spans drawn around an item's text: beside its icon, and under it. */
const labelsOf = (name: string) => within(item(name)).getAllByText(name, { ignore: false })
const glyphOf = (name: string) => item(name).querySelector<HTMLElement>('.font-icon')!

const names = ['Home', 'Browse', 'Radio'] as const
const icons = { Home: 'home', Browse: 'explore', Radio: 'radio' } as const

/** Three destinations that keep which is selected, the first at the start, after `header` and before the children. */
function Destinations({
  disabled,
  header,
  children,
  ...props
}: Except<NavigationRailProps, 'children'> & {
  disabled?: string
  header?: ReactNode
  children?: ReactNode
}) {
  const [selected, setSelected] = useState<string>('Home')
  return (
    <NavigationRail aria-label="Main" {...props}>
      {header}
      {names.map((name) => (
        <NavigationRailItem
          key={name}
          isSelected={name === selected}
          isDisabled={name === disabled}
          onChange={() => setSelected(name)}
        >
          <Icon name={icons[name]} />
          <Text slot="label">{name}</Text>
        </NavigationRailItem>
      ))}
      {children}
    </NavigationRail>
  )
}

const Menu = () => (
  <IconButton aria-label="Menu">
    <Icon name="menu" />
  </IconButton>
)

describe('NavigationRail', () => {
  it('is React Aria’s vertical toolbar of toggle buttons, one per destination, named by their labels', () => {
    render(<Destinations />)
    expect(rail().tagName).toBe('DIV')
    expect(rail()).toHaveAttribute('aria-orientation', 'vertical')
    expect(rail()).toHaveAttribute('data-orientation', 'vertical')
    expect(rail()).toHaveAccessibleName('Main')
    const items = within(rail()).getAllByRole('button')
    expect(items.map((el) => el.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON'])
    for (const name of names) {
      expect(item(name)).toHaveAccessibleName(name)
      expect(item(name)).toHaveAttribute('aria-pressed')
    }
  })

  it('takes React Aria’s Toolbar props, a className of its state and its ref', () => {
    const ref = createRef<HTMLDivElement>()
    const className = vi.fn(() => 'custom')
    render(<Destinations className={className} ref={ref} data-testid="x" />)
    expect(rail()).toHaveClass('custom')
    expect(rail()).toHaveAttribute('data-testid', 'x')
    expect(ref.current).toBe(rail())
    expect(className).toHaveBeenCalledWith(
      expect.objectContaining({ orientation: 'vertical', defaultClassName: 'react-aria-Toolbar' }),
    )
  })

  it('is collapsed unless told, and says when it is expanded', () => {
    const { rerender } = render(<Destinations />)
    expect(rail()).not.toHaveAttribute('data-expanded')
    rerender(<Destinations isExpanded />)
    expect(rail()).toHaveAttribute('data-expanded')
  })

  describe('selection', () => {
    it('says the selected item is pressed, and no other', () => {
      render(<Destinations />)
      expect(item('Home')).toHaveAttribute('aria-pressed', 'true')
      expect(item('Home')).toHaveAttribute('data-selected')
      expect(item('Browse')).toHaveAttribute('aria-pressed', 'false')
      expect(item('Browse')).not.toHaveAttribute('data-selected')
    })

    it('is the caller’s to change: a press calls onChange, and the item shows what it is given', async () => {
      const user = userEvent.setup()
      render(<Destinations />)
      await user.click(item('Radio'))
      expect(item('Radio')).toHaveAttribute('aria-pressed', 'true')
      expect(item('Home')).toHaveAttribute('aria-pressed', 'false')
    })

    it('calls onChange with false for a press on the selected item, which stays as it is given', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <NavigationRail aria-label="Main">
          <NavigationRailItem isSelected onChange={onChange}>
            <Icon name="home" />
            <Text slot="label">Home</Text>
          </NavigationRailItem>
        </NavigationRail>,
      )
      await user.click(item('Home'))
      expect(onChange).toHaveBeenCalledWith(false)
      expect(item('Home')).toHaveAttribute('aria-pressed', 'true')
    })

    it('keeps its own selection given defaultSelected, as React Aria’s ToggleButton does', async () => {
      const user = userEvent.setup()
      render(
        <NavigationRail aria-label="Main">
          <NavigationRailItem defaultSelected>
            <Icon name="home" />
            <Text slot="label">Home</Text>
          </NavigationRailItem>
        </NavigationRail>,
      )
      expect(item('Home')).toHaveAttribute('aria-pressed', 'true')
      await user.click(item('Home'))
      expect(item('Home')).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('an item', () => {
    it('draws its label twice, under the icon and beside it, and hides the one its rail does not show', () => {
      const { rerender } = render(<Destinations />)
      let [beside, below] = labelsOf('Home')
      expect(hugOf('Home').children[2]).toBe(beside)
      expect(hugOf('Home').children[3]).toBe(below)
      expect(beside).toHaveAttribute('aria-hidden', 'true')
      expect(below).not.toHaveAttribute('aria-hidden')

      rerender(<Destinations isExpanded />)
      ;[beside, below] = labelsOf('Home')
      expect(beside).not.toHaveAttribute('aria-hidden')
      expect(below).toHaveAttribute('aria-hidden', 'true')
      expect(item('Home')).toHaveAccessibleName('Home')
    })

    it('draws its children as they are given, after the indicator’s box, its label React Aria’s Text in the label slot', () => {
      render(
        <NavigationRail aria-label="Main">
          <NavigationRailItem>
            <Icon name="mail" />
            <Text slot="label">
              Inbox <b>3</b>
            </Text>
          </NavigationRailItem>
        </NavigationRail>,
      )
      const el = screen.getByRole('button')
      expect(el).toHaveAccessibleName('Inbox 3')
      expect(el.children).toHaveLength(1)
      const hug = el.firstElementChild!
      expect(hug.children[1]).toBe(el.querySelector('.font-icon'))
      expect(hug.children[2]).toHaveTextContent('Inbox 3')
      expect(hug.children[3]).toHaveTextContent('Inbox 3')
    })

    it('has no label without a Text in the label slot, and is named by its aria-label', () => {
      render(
        <NavigationRail aria-label="Main">
          <NavigationRailItem aria-label="Home">
            <Icon name="home" />
          </NavigationRailItem>
        </NavigationRail>,
      )
      expect(hugOf('Home').children).toHaveLength(2)
    })

    it('is laid out collapsed outside a rail', () => {
      render(
        <NavigationRailItem>
          <Icon name="home" />
          <Text slot="label">Home</Text>
        </NavigationRailItem>,
      )
      expect(labelsOf('Home')[0]).toHaveAttribute('aria-hidden', 'true')
    })

    it('is React Aria’s ToggleButton: a className of its state, its props and its ref', () => {
      const ref = createRef<HTMLButtonElement>()
      const className = vi.fn(() => 'custom')
      render(
        <NavigationRail aria-label="Main">
          <NavigationRailItem ref={ref} className={className} data-testid="x">
            <Icon name="home" />
            <Text slot="label">Home</Text>
          </NavigationRailItem>
        </NavigationRail>,
      )
      expect(item('Home')).toHaveClass('custom')
      expect(item('Home')).toHaveAttribute('data-testid', 'x')
      expect(item('Home')).toHaveAttribute('type', 'button')
      expect(ref.current).toBe(item('Home'))
      expect(className).toHaveBeenCalledWith(
        expect.objectContaining({
          isSelected: false,
          isHovered: false,
          defaultClassName: 'react-aria-ToggleButton',
        }),
      )
    })

    it('passes its children, given as a function, the state React Aria reports, isSelected included', () => {
      const children = vi.fn((props: NavigationRailItemRenderProps) => (
        <>
          <Icon name={props.isSelected ? 'check' : 'home'} />
          <Text slot="label">Home</Text>
        </>
      ))
      render(
        <NavigationRail aria-label="Main">
          <NavigationRailItem isSelected>{children}</NavigationRailItem>
        </NavigationRail>,
      )
      expect(children).toHaveBeenCalledWith(
        expect.objectContaining({
          isSelected: true,
          isHovered: false,
          isFocusVisible: false,
          isDisabled: false,
        }),
      )
      expect(glyphOf('Home')).toHaveTextContent('check')
      expectTypeOf<NavigationRailItemRenderProps['isSelected']>().toEqualTypeOf<boolean>()
    })
  })

  describe('the header', () => {
    it('is drawn where it is written, first, its children as written', () => {
      render(
        <Destinations
          header={
            <NavigationRailHeader data-testid="header" className="custom">
              <Menu />
              <Fab aria-label="Compose">
                <Icon name="edit" />
              </Fab>
            </NavigationRailHeader>
          }
        />,
      )
      const header = screen.getByTestId('header')
      expect(contentOf(rail()).firstElementChild).toBe(header)
      expect(header).toHaveClass('custom')
      expect(header.children).toHaveLength(2)
      expect(header.children[0]).toBe(item('Menu'))
      expect(header.children[1]).toBe(item('Compose'))
      // The buttons come before the items in the order of the page, and so of the keys.
      const all = within(rail()).getAllByRole('button')
      expect(all.map((el) => el.getAttribute('aria-label') ?? el.textContent)).toEqual([
        'Menu',
        'Compose',
        'homeHomeHome',
        'exploreBrowseBrowse',
        'radioRadioRadio',
      ])
    })
  })

  describe('a section', () => {
    const Sections = (props: NavigationRailProps) => (
      <Destinations {...props}>
        <NavigationRailSection aria-labelledby="library" data-testid="section">
          <Text slot="header" id="library">
            Library
          </Text>
          <NavigationRailItem>
            <Icon name="album" />
            <Text slot="label">Albums</Text>
          </NavigationRailItem>
        </NavigationRailSection>
      </Destinations>
    )

    it('is React Aria’s Group, named by its header, drawn under the items', () => {
      render(<Sections isExpanded />)
      const section = screen.getByRole('group', { name: 'Library' })
      expect(section).toBe(screen.getByTestId('section'))
      expect(section).toContainElement(item('Albums'))
      expect(section.firstElementChild).toHaveTextContent('Library')
      expect([...contentOf(rail()).children]).toEqual([
        item('Home'),
        item('Browse'),
        item('Radio'),
        section,
      ])
    })

    it('takes React Aria’s Group props, a className of its state and its ref', () => {
      const ref = createRef<HTMLDivElement>()
      const className = vi.fn(() => 'custom')
      render(
        <NavigationRailSection aria-label="More" className={className} ref={ref}>
          <NavigationRailItem>
            <Text slot="label">Albums</Text>
          </NavigationRailItem>
        </NavigationRailSection>,
      )
      const section = screen.getByRole('group', { name: 'More' })
      expect(section).toHaveClass('custom')
      expect(ref.current).toBe(section)
      expect(className).toHaveBeenCalledWith(
        expect.objectContaining({ isHovered: false, defaultClassName: 'react-aria-Group' }),
      )
    })

    it('shows in an expanded rail only', () => {
      const { rerender } = render(<Sections />)
      expect(screen.getByTestId('section')).toHaveClass('invisible', 'opacity-0')
      rerender(<Sections isExpanded />)
      expect(screen.getByTestId('section')).not.toHaveClass('invisible')
      expect(screen.getByTestId('section')).not.toHaveClass('opacity-0')
    })

    it('gives its items no label under their icons, which only a collapsed rail shows', () => {
      render(<Sections isExpanded />)
      expect(labelsOf('Albums')).toHaveLength(1)
      expect(labelsOf('Albums')[0]).not.toHaveAttribute('aria-hidden')
    })

    it('needs no header, and always shows outside a rail', () => {
      render(
        <NavigationRailSection aria-label="More" data-testid="section">
          <NavigationRailItem>
            <Icon name="album" />
            <Text slot="label">Albums</Text>
          </NavigationRailItem>
        </NavigationRailSection>,
      )
      expect(screen.getByRole('group', { name: 'More' }).children).toHaveLength(1)
      expect(screen.getByTestId('section')).not.toHaveClass('invisible')
    })
  })

  describe('the keyboard, React Aria’s toolbar’s', () => {
    const Page = (props: { disabled?: string }) => (
      <>
        <Destinations
          {...props}
          header={
            <NavigationRailHeader>
              <Menu />
            </NavigationRailHeader>
          }
        />
        <button type="button">After</button>
      </>
    )

    it('takes the focus first on the first control in the rail, the header’s', async () => {
      const user = userEvent.setup()
      render(<Page />)
      await user.tab()
      expect(item('Menu')).toHaveFocus()
    })

    it('moves between every control with the up and down arrow keys, and stops at the ends', async () => {
      const user = userEvent.setup()
      render(<Page />)
      item('Menu').focus()
      await user.keyboard('{ArrowUp}')
      expect(item('Menu')).toHaveFocus()
      await user.keyboard('{ArrowDown}')
      expect(item('Home')).toHaveFocus()
      await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
      expect(item('Radio')).toHaveFocus()
      await user.keyboard('{ArrowUp}')
      expect(item('Browse')).toHaveFocus()
      // The keys across the rail are left to the page.
      await user.keyboard('{ArrowRight}')
      expect(item('Browse')).toHaveFocus()
    })

    it('takes the arrow keys before an item’s onKeyDown hears them, held with a modifier too', async () => {
      const user = userEvent.setup()
      const onKeyDown = vi.fn()
      render(
        <NavigationRail aria-label="Main">
          <NavigationRailItem onKeyDown={onKeyDown}>
            <Text slot="label">Home</Text>
          </NavigationRailItem>
          <NavigationRailItem>
            <Text slot="label">Browse</Text>
          </NavigationRailItem>
        </NavigationRail>,
      )
      item('Home').focus()
      await user.keyboard('{Alt>}{ArrowDown}{/Alt}')
      expect(item('Browse')).toHaveFocus()
      item('Home').focus()
      await user.keyboard('x')
      expect(onKeyDown.mock.calls.map(([event]) => event.key)).toEqual(['Alt', 'x'])
    })

    it('passes a disabled item by', async () => {
      const user = userEvent.setup()
      render(<Page disabled="Browse" />)
      item('Home').focus()
      await user.keyboard('{ArrowDown}')
      expect(item('Radio')).toHaveFocus()
    })

    it('leaves the rail on Tab, and comes back to the control focused last', async () => {
      const user = userEvent.setup()
      render(<Page />)
      item('Browse').focus()
      await user.tab()
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
      await user.tab({ shift: true })
      expect(item('Browse')).toHaveFocus()
    })

    it('selects the focused item with Space or Enter', async () => {
      const user = userEvent.setup()
      render(<Page />)
      item('Browse').focus()
      await user.keyboard('{Enter}')
      expect(item('Browse')).toHaveAttribute('aria-pressed', 'true')
      item('Radio').focus()
      await user.keyboard(' ')
      expect(item('Radio')).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('a rail that hides when collapsed', () => {
    it('lays its items out as an expanded rail’s, whether it is expanded or not', () => {
      const { rerender } = render(<Destinations isHiddenOnCollapse />)
      expect(rail()).not.toHaveAttribute('data-expanded')
      expect(labelsOf('Home')[0]).not.toHaveAttribute('aria-hidden')
      // The rail itself is hidden, not only what it holds (the browser tests see it gone).
      expect(rail()).toHaveClass('invisible')
      expect(contentOf(rail())).not.toHaveClass('invisible')
      rerender(<Destinations isHiddenOnCollapse isExpanded />)
      expect(rail()).toHaveAttribute('data-expanded')
      expect(labelsOf('Home')[0]).not.toHaveAttribute('aria-hidden')
      expect(rail()).not.toHaveClass('invisible')
    })
  })
})
