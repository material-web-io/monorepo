import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, useState } from 'react'
import { Text } from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { Except } from '../../lib/aria'
import { Icon } from '../icon'
import {
  NavigationBar,
  NavigationBarItem,
  type NavigationBarItemRenderProps,
  type NavigationBarProps,
  type NavigationBarRenderProps,
} from '.'

/* Markup and behavior that jsdom can check without a stylesheet: the toolbar and the toggle
 * buttons in it, selection as it is said, the keyboard, an item's parts in each layout, function
 * children and the props passed through. Looks: navigation-bar.browser.test.tsx. */

const bar = () => screen.getByRole('toolbar')
const item = (name: string) => screen.getByRole('button', { name })
/** What the item holds, its one child; the indicator's box, first in it, and the indicator. */
const contentOf = (name: string) => item(name).firstElementChild as HTMLElement
const boxOf = (name: string) => contentOf(name).firstElementChild as HTMLElement
const indicatorOf = (name: string) => boxOf(name).firstElementChild as HTMLElement
/** The label's `Text`. */
const labelOf = (name: string) => within(item(name)).getByText(name)
const glyphOf = (name: string) => item(name).querySelector<HTMLElement>('.font-icon')!

const names = ['Home', 'Browse', 'Radio'] as const
const icons = { Home: 'home', Browse: 'explore', Radio: 'radio' } as const

/** Three destinations that keep which is selected, the first at the start. */
function Destinations({
  onSelect,
  ...props
}: Except<NavigationBarProps, 'children'> & { onSelect?: (name: string) => void }) {
  const [selected, setSelected] = useState<string>('Home')
  return (
    <NavigationBar aria-label="Main" {...props}>
      {names.map((name) => (
        <NavigationBarItem
          key={name}
          isSelected={name === selected}
          onChange={() => {
            setSelected(name)
            onSelect?.(name)
          }}
        >
          <Icon name={icons[name]} />
          <Text slot="label">{name}</Text>
        </NavigationBarItem>
      ))}
    </NavigationBar>
  )
}

describe('NavigationBar', () => {
  it('renders a horizontal toolbar of toggle buttons, one per destination, named by their labels', () => {
    render(<Destinations />)
    expect(bar().tagName).toBe('DIV')
    expect(bar()).toHaveAttribute('aria-orientation', 'horizontal')
    expect(bar()).toHaveAttribute('data-orientation', 'horizontal')
    expect(bar()).toHaveAccessibleName('Main')
    // A toolbar is no landmark: the page puts it in a <nav>.
    expect(screen.queryByRole('navigation')).toBeNull()
    const items = within(bar()).getAllByRole('button')
    expect(items.map((el) => el.textContent)).toEqual(['homeHome', 'exploreBrowse', 'radioRadio'])
    for (const el of items) {
      expect(el.tagName).toBe('BUTTON')
      expect(el).toHaveAttribute('type', 'button')
      expect(el).toHaveAttribute('aria-pressed')
      expect(el.parentElement).toBe(bar())
    }
    expect(item('Home')).toHaveAccessibleName('Home')
  })

  it('says the selected destination with aria-pressed, and only that one', () => {
    render(<Destinations />)
    expect(item('Home')).toHaveAttribute('aria-pressed', 'true')
    expect(item('Home')).toHaveAttribute('data-selected')
    for (const name of ['Browse', 'Radio']) {
      expect(item(name)).toHaveAttribute('aria-pressed', 'false')
      expect(item(name)).not.toHaveAttribute('data-selected')
    }
    expect(item('Home')).not.toHaveAttribute('aria-current')
  })

  it('selects a destination by click', async () => {
    const onSelect = vi.fn()
    render(<Destinations onSelect={onSelect} />)
    await userEvent.click(item('Radio'))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('Radio')
    expect(item('Radio')).toHaveAttribute('aria-pressed', 'true')
    expect(item('Home')).toHaveAttribute('aria-pressed', 'false')
  })

  it('is one tab stop, moves between its items by the arrow keys and selects with Space or Enter', async () => {
    const onSelect = vi.fn()
    render(
      <>
        <button type="button">Before</button>
        <Destinations onSelect={onSelect} />
        <button type="button">After</button>
      </>,
    )
    await userEvent.tab()
    await userEvent.tab()
    expect(item('Home')).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(item('Browse')).toHaveFocus()
    expect(item('Home')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard(' ')
    expect(item('Browse')).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(item('Radio')).toHaveAttribute('aria-pressed', 'true')
    expect(onSelect.mock.calls).toEqual([['Browse'], ['Radio']])
    // The arrow keys stop at the ends.
    await userEvent.keyboard('{ArrowRight}')
    expect(item('Radio')).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(item('Browse')).toHaveFocus()
    // Tab leaves the bar, and Shift+Tab comes back to the item focused last.
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(item('Browse')).toHaveFocus()
  })

  it('holds its items as the toolbar’s own children, those of a component in between as well', () => {
    const Pair = () => (
      <>
        <NavigationBarItem>Two</NavigationBarItem>
        <NavigationBarItem>Three</NavigationBarItem>
      </>
    )
    render(
      <NavigationBar arrangement="centered" style={{ color: 'red' }}>
        <NavigationBarItem>One</NavigationBarItem>
        <Pair />
        {false}
        {null}
        <NavigationBarItem>Four</NavigationBarItem>
      </NavigationBar>,
    )
    // What a centered bar counts, in its stylesheet: navigation-bar.browser.test.tsx.
    expect([...bar().children]).toEqual(['One', 'Two', 'Three', 'Four'].map(item))
    expect(bar()).toHaveClass('navigation-bar-centered')
    expect(item('Three')).toHaveClass('navigation-bar-item-centered')
    expect(bar().style.color).toBe('red')
  })

  it('gives its items equal weight in either layout, unless told to center them', () => {
    const { rerender } = render(<Destinations />)
    expect(bar()).not.toHaveClass('navigation-bar-centered')
    expect(item('Home')).toHaveClass('flex-1', 'basis-0')
    rerender(<Destinations layout="horizontal" />)
    expect(bar()).not.toHaveClass('navigation-bar-centered')
    expect(item('Home')).toHaveClass('flex-1', 'basis-0')
    for (const layout of ['vertical', 'horizontal'] as const) {
      rerender(<Destinations layout={layout} arrangement="centered" />)
      expect(bar()).toHaveClass('navigation-bar-centered')
      expect(item('Home')).toHaveClass('navigation-bar-item-centered')
      expect(item('Home')).not.toHaveClass('flex-1')
    }
  })

  it('passes its props, class and ref on to the toolbar', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <NavigationBar ref={ref} data-testid="bar" className="sticky bottom-0">
        <NavigationBarItem>Home</NavigationBarItem>
      </NavigationBar>,
    )
    expect(ref.current).toBe(bar())
    expect(bar()).toHaveAttribute('data-testid', 'bar')
    expect(bar()).toHaveClass('sticky', 'bottom-0', 'navigation-bar')
  })

  it('takes a class and children as functions of the state React Aria’s toolbar reports', () => {
    const seen: NavigationBarRenderProps[] = []
    render(
      <NavigationBar
        className={({ orientation, defaultClassName }) => `${orientation} ${defaultClassName}`}
      >
        {(state) => {
          seen.push(state)
          return <NavigationBarItem>Home</NavigationBarItem>
        }}
      </NavigationBar>,
    )
    expect(bar()).toHaveClass('horizontal', 'react-aria-Toolbar', 'navigation-bar')
    expect(seen.at(-1)).toMatchObject({ orientation: 'horizontal' })
    expect(item('Home').parentElement).toBe(bar())
  })
})

describe('NavigationBarItem', () => {
  describe('parts', () => {
    it('draws its children as written in what it holds, after the indicator’s box', () => {
      render(<Destinations />)
      expect(item('Home').children).toHaveLength(1)
      const [box, glyph, label] = [...contentOf('Home').children]
      expect(contentOf('Home').children).toHaveLength(3)
      expect(box).toBe(boxOf('Home'))
      expect(glyph).toBe(glyphOf('Home'))
      expect(label).toBe(labelOf('Home'))
      expect(label).toHaveAttribute('slot', 'label')
      expect(label).toHaveClass('navigation-bar-label-vertical')
    })

    it('draws a horizontal item’s parts the same way, its label on one line', () => {
      render(<Destinations layout="horizontal" />)
      expect([...contentOf('Home').children]).toEqual([
        boxOf('Home'),
        glyphOf('Home'),
        labelOf('Home'),
      ])
      expect(labelOf('Home')).toHaveClass('truncate')
      expect(labelOf('Home')).not.toHaveClass('navigation-bar-label-vertical')
    })

    it('puts the indicator, hidden from assistive technology, first in its box', () => {
      render(<Destinations />)
      for (const name of names) {
        expect(indicatorOf(name)).toHaveAttribute('aria-hidden', 'true')
        expect(indicatorOf(name).tagName).toBe('SPAN')
        expect(indicatorOf(name)).toHaveClass('navigation-bar-active-indicator')
      }
      // The indicator and the two parts of the ripple, and nothing else.
      expect(boxOf('Home').children).toHaveLength(3)
    })

    it('draws an item with no label, or with only one, as it is written', () => {
      render(
        <NavigationBar>
          <NavigationBarItem aria-label="Home">
            <Icon name="home" />
          </NavigationBarItem>
          <NavigationBarItem>
            <Text slot="label">Browse</Text>
          </NavigationBarItem>
        </NavigationBar>,
      )
      expect([...contentOf('Home').children]).toEqual([boxOf('Home'), glyphOf('Home')])
      expect([...contentOf('Browse').children]).toEqual([boxOf('Browse'), labelOf('Browse')])
    })

    it('throws React Aria’s error for a Text in another slot, or in none', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() =>
        render(
          <NavigationBarItem>
            <Text>Home</Text>
          </NavigationBarItem>,
        ),
      ).toThrow('A slot prop is required. Valid slot names are "label".')
      expect(() =>
        render(
          <NavigationBarItem>
            <Text slot="badge">3</Text>
          </NavigationBarItem>,
        ),
      ).toThrow('Invalid slot "badge".')
      vi.restoreAllMocks()
    })

    it('lays out as a vertical item outside a navigation bar', () => {
      render(
        <NavigationBarItem>
          <Icon name="home" />
          <Text slot="label">Home</Text>
        </NavigationBarItem>,
      )
      expect(item('Home')).toHaveClass('flex-col', 'flex-1')
      expect(contentOf('Home')).toHaveClass('navigation-bar-item-content-vertical')
      expect(labelOf('Home')).toHaveClass('navigation-bar-label-vertical')
    })

    it.each(['vertical', 'horizontal'] as const)('takes the layout of a %s bar', (layout) => {
      render(
        <NavigationBar layout={layout}>
          <NavigationBarItem>
            <Icon name="home" />
            <Text slot="label">Home</Text>
          </NavigationBarItem>
        </NavigationBar>,
      )
      const vertical = contentOf('Home').classList.contains('navigation-bar-item-content-vertical')
      expect(vertical).toBe(layout === 'vertical')
      expect(labelOf('Home').classList.contains('truncate')).toBe(layout === 'horizontal')
    })
  })

  describe('function children', () => {
    it('calls them with the state React Aria’s ToggleButton reports', async () => {
      const seen: NavigationBarItemRenderProps[] = []
      render(
        <NavigationBar>
          <NavigationBarItem isSelected>
            {(state) => {
              seen.push(state)
              return (
                <>
                  <Icon name={state.isSelected ? 'check_circle' : 'circle'} />
                  <Text slot="label">{state.isFocusVisible ? 'Focused' : 'Home'}</Text>
                </>
              )
            }}
          </NavigationBarItem>
        </NavigationBar>,
      )
      expect(seen.at(-1)).toMatchObject({
        isSelected: true,
        isHovered: false,
        isPressed: false,
        isFocused: false,
        isFocusVisible: false,
        isDisabled: false,
      })
      expect(glyphOf('Home').textContent).toBe('check_circle')
      await userEvent.tab()
      expect(seen.at(-1)).toMatchObject({ isFocusVisible: true, isSelected: true })
      expect(item('Focused')).toHaveFocus()
      // What they return is drawn the same way, in what the item holds.
      expect([...contentOf('Focused').children]).toEqual([
        boxOf('Focused'),
        glyphOf('Focused'),
        labelOf('Focused'),
      ])
    })

    it('types them by what they are given', () => {
      expectTypeOf<keyof NavigationBarItemRenderProps>().toEqualTypeOf<
        | 'isHovered'
        | 'isPressed'
        | 'isFocused'
        | 'isFocusVisible'
        | 'isDisabled'
        | 'isSelected'
        | 'state'
      >()
      render(
        <NavigationBar>
          <NavigationBarItem>
            {({ isSelected, isHovered }) => (isSelected || isHovered ? 'On' : 'Off')}
          </NavigationBarItem>
        </NavigationBar>,
      )
      expect(item('Off')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('keeps a selection of its own given defaultSelected, and calls onChange(false) when pressed again', async () => {
      const onChange = vi.fn()
      render(
        <NavigationBar>
          <NavigationBarItem defaultSelected onChange={onChange}>
            Home
          </NavigationBarItem>
        </NavigationBar>,
      )
      expect(item('Home')).toHaveAttribute('aria-pressed', 'true')
      await userEvent.click(item('Home'))
      expect(onChange).toHaveBeenCalledExactlyOnceWith(false)
      expect(item('Home')).toHaveAttribute('aria-pressed', 'false')
    })

    it('calls onPress as well as onChange', async () => {
      const onPress = vi.fn()
      render(
        <NavigationBar>
          <NavigationBarItem onPress={onPress}>Home</NavigationBarItem>
        </NavigationBar>,
      )
      await userEvent.click(item('Home'))
      expect(onPress).toHaveBeenCalledOnce()
    })
  })

  describe('disabled', () => {
    it('is a disabled button, which takes no press and which the arrow keys pass by', async () => {
      const onChange = vi.fn()
      render(
        <NavigationBar>
          <NavigationBarItem>Home</NavigationBarItem>
          <NavigationBarItem isDisabled onChange={onChange}>
            Browse
          </NavigationBarItem>
          <NavigationBarItem>Radio</NavigationBarItem>
        </NavigationBar>,
      )
      expect(item('Browse')).toBeDisabled()
      expect(item('Browse')).toHaveAttribute('data-disabled')
      await userEvent.click(item('Browse'))
      expect(onChange).not.toHaveBeenCalled()
      await userEvent.tab()
      await userEvent.keyboard('{ArrowRight}')
      expect(item('Radio')).toHaveFocus()
    })
  })

  describe('props', () => {
    it('passes its props, class and ref on to the button', () => {
      const ref = createRef<HTMLButtonElement>()
      render(
        <NavigationBar>
          <NavigationBarItem ref={ref} id="home" data-testid="home" className="max-w-40">
            Home
          </NavigationBarItem>
        </NavigationBar>,
      )
      expect(ref.current).toBe(item('Home'))
      expect(item('Home')).toHaveAttribute('id', 'home')
      expect(item('Home')).toHaveAttribute('data-testid', 'home')
      expect(item('Home')).toHaveClass('max-w-40', 'group/md-navigation-bar-item')
    })

    it('takes a class as a function of the state React Aria reports', async () => {
      render(
        <NavigationBar>
          <NavigationBarItem
            className={({ isFocusVisible, defaultClassName }) =>
              `${isFocusVisible ? 'is-focused' : 'is-blurred'} ${defaultClassName}`
            }
          >
            Home
          </NavigationBarItem>
        </NavigationBar>,
      )
      expect(item('Home')).toHaveClass('is-blurred', 'react-aria-ToggleButton')
      await userEvent.tab()
      expect(item('Home')).toHaveClass('is-focused', 'navigation-bar-item')
    })

    it('lets the caller’s class win over one of the same utility', () => {
      render(
        <NavigationBar>
          <NavigationBarItem className="py-space-100">Home</NavigationBarItem>
        </NavigationBar>,
      )
      expect(item('Home')).toHaveClass('py-space-100')
      expect(item('Home')).not.toHaveClass('py-space-75')
    })
  })
})
