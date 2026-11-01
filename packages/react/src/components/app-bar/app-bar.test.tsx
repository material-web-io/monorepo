import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { Button, Heading, Link, Text } from 'react-aria-components'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { AppBar, type AppBarProps } from '.'

/* Markup and behavior that jsdom can check without a stylesheet: what the bar and each part
 * renders as, the slots, roles, names, tab stops and the search bar's clicks and keys.
 * Measurements, colors, motion and scrolling: app-bar.browser.test.tsx. */

const button = (name: string) => screen.getByRole('button', { name })
const bar = () => screen.getByTestId('bar')

const Back = () => (
  <IconButton slot="leading" aria-label="Back">
    <Icon name="arrow_back" />
  </IconButton>
)
const Action = ({ name }: { name: string }) => (
  <IconButton slot="trailing" aria-label={name}>
    <Icon name="star" />
  </IconButton>
)

describe('AppBar', () => {
  it('is a <header> that is no tab stop, with its props, className and ref', () => {
    const ref = createRef<HTMLElement>()
    render(
      <AppBar data-testid="bar" id="top" className="custom" ref={ref} aria-label="Inbox">
        <Heading slot="headline">Inbox</Heading>
      </AppBar>,
    )
    expect(bar().tagName).toBe('HEADER')
    expect(bar()).toHaveAttribute('id', 'top')
    expect(bar()).toHaveAttribute('aria-label', 'Inbox')
    expect(bar()).toHaveClass('custom')
    expect(bar()).not.toHaveAttribute('tabindex')
    expect(ref.current).toBe(bar())
  })

  it('draws its children as written, each with its slot, as its own', () => {
    render(
      <AppBar data-testid="bar">
        <Back />
        <Heading slot="headline">Headline</Heading>
        <Text slot="subtitle">Subtitle</Text>
        <Action name="Search" />
        <Action name="Today" />
      </AppBar>,
    )
    const headline = screen.getByRole('heading', { name: 'Headline' })
    const subtitle = screen.getByText('Subtitle')
    expect([...bar().children]).toEqual([
      button('Back'),
      headline,
      subtitle,
      button('Search'),
      button('Today'),
    ])
    expect(button('Back')).toHaveAttribute('slot', 'leading')
    expect(headline).toHaveAttribute('slot', 'headline')
    expect(subtitle).toHaveAttribute('slot', 'subtitle')
    expect(button('Today')).toHaveAttribute('slot', 'trailing')
  })

  it('draws the headline as an <h1>, unless its Heading says otherwise, and the subtitle as a <span>', () => {
    const { rerender } = render(
      <AppBar>
        <Heading slot="headline">Headline</Heading>
        <Text slot="subtitle">Subtitle</Text>
      </AppBar>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Headline' }).tagName).toBe('H1')
    expect(screen.getByText('Subtitle').tagName).toBe('SPAN')
    rerender(
      <AppBar>
        <Heading slot="headline" level={2}>
          Headline
        </Heading>
      </AppBar>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Headline' }).tagName).toBe('H2')
  })

  it('takes an image for its headline, named by its alt text', () => {
    render(
      <AppBar>
        <Heading slot="headline">
          <img src="logo.svg" alt="The Fortnightly" />
        </Heading>
      </AppBar>,
    )
    expect(screen.getByRole('heading', { name: 'The Fortnightly' })).toContainElement(
      screen.getByRole('img'),
    )
  })

  it('throws React Aria’s error for a Heading, Text, Icon or Button in a slot it has not', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <AppBar>
          <Heading>Headline</Heading>
        </AppBar>,
      ),
    ).toThrow(/A slot prop is required/)
    expect(() =>
      render(
        <AppBar>
          <Text slot="label">Subtitle</Text>
        </AppBar>,
      ),
    ).toThrow(/Invalid slot "label"/)
    expect(() =>
      render(
        <AppBar>
          <Icon slot="headline" name="menu" />
        </AppBar>,
      ),
    ).toThrow(/Invalid slot "headline"/)
    expect(() =>
      render(
        <AppBar>
          <Button slot="close">Close</Button>
        </AppBar>,
      ),
    ).toThrow(/Invalid slot "close"/)
    error.mockRestore()
  })

  it('makes its controls tab stops in the order they are written, the leading button first', async () => {
    render(
      <AppBar>
        <Back />
        <Heading slot="headline">Headline</Heading>
        <Action name="Search" />
        <Action name="Today" />
      </AppBar>,
    )
    await userEvent.tab()
    expect(button('Back')).toHaveFocus()
    await userEvent.tab()
    expect(button('Search')).toHaveFocus()
    await userEvent.tab()
    expect(button('Today')).toHaveFocus()
  })

  it('activates a control in it with Space or Enter', async () => {
    const back = vi.fn()
    render(
      <AppBar>
        <IconButton slot="leading" aria-label="Back" onPress={back}>
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Headline</Heading>
      </AppBar>,
    )
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(back).toHaveBeenCalledTimes(2)
  })

  it('says when it is scrolled, as it is told', () => {
    const { rerender } = render(<AppBar data-testid="bar" />)
    expect(bar()).not.toHaveAttribute('data-scrolled')
    rerender(<AppBar data-testid="bar" isScrolled />)
    expect(bar()).toHaveAttribute('data-scrolled')
    rerender(<AppBar data-testid="bar" scrollBehavior="pinned" isScrolled={false} />)
    expect(bar()).not.toHaveAttribute('data-scrolled')
  })

  it.each(['enter-always', 'exit-until-collapsed'] as const)(
    'draws the text of a flexible bar that collapses twice, and has only its headline read out (%s)',
    (scrollBehavior) => {
      render(
        <AppBar data-testid="bar" variant="large-flexible" scrollBehavior={scrollBehavior}>
          <Back />
          <Heading slot="headline">Headline</Heading>
          <Text slot="subtitle">Subtitle</Text>
        </AppBar>,
      )
      // Both are there, the one as written first: the small title in the row, drawn after it, is
      // hidden from assistive technology until the bar has collapsed.
      const [headline, title] = screen.getAllByText('Headline')
      expect(screen.getAllByText('Subtitle')).toHaveLength(2)
      expect(screen.getByRole('heading', { name: 'Headline' })).toBe(headline)
      expect(headline).toHaveAttribute('slot', 'headline')
      expect(headline).not.toHaveAttribute('aria-hidden')
      expect(title).toHaveAttribute('aria-hidden', 'true')
      expect(title).not.toHaveAttribute('slot')
      expect(title).toHaveClass('app-bar-collapsed-headline')
      expect(title!.tagName).toBe('H1')
      expect(screen.getAllByText('Subtitle')[1]).toHaveClass('app-bar-collapsed-subtitle')
      // Each copy is right after its original, so it is read in its place, before the actions.
      expect(headline!.nextElementSibling).toBe(title)
      expect(screen.getAllByText('Subtitle')[0]!.nextElementSibling).toBe(
        screen.getAllByText('Subtitle')[1],
      )
      expect(bar()).not.toHaveAttribute('data-collapsed')
    },
  )

  it('draws the small title of a bar that collapses as the text is drawn: its level, its element and its content as they change', async () => {
    const warn = vi.spyOn(console, 'warn')
    const { rerender } = render(
      <AppBar variant="medium-flexible" scrollBehavior="exit-until-collapsed">
        <Heading slot="headline" level={2}>
          Headline
        </Heading>
        <Text slot="subtitle" elementType="p">
          Subtitle
        </Text>
      </AppBar>,
    )
    const tags = (text: string) => screen.getAllByText(text).map((element) => element.tagName)
    expect(tags('Headline')).toEqual(['H2', 'H2'])
    expect(tags('Subtitle')).toEqual(['P', 'P'])
    rerender(
      <AppBar variant="medium-flexible" scrollBehavior="exit-until-collapsed">
        <Heading slot="headline" level={2}>
          Archive
        </Heading>
      </AppBar>,
    )
    await waitFor(() => expect(tags('Archive')).toEqual(['H2', 'H2']))
    expect(screen.queryByText('Subtitle')).not.toBeInTheDocument()
    rerender(
      <AppBar variant="medium-flexible" scrollBehavior="exit-until-collapsed">
        <Heading slot="headline" level={3}>
          Archive
        </Heading>
      </AppBar>,
    )
    expect(tags('Archive')).toEqual(['H3', 'H3'])
    // React Aria warns of a `render` that draws an element other than the one it asked for.
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('draws the text once in a flexible bar that is pinned, and in a small bar whatever its behavior', () => {
    const { rerender } = render(
      <AppBar data-testid="bar" variant="large-flexible" scrollBehavior="pinned">
        <Heading slot="headline">Headline</Heading>
      </AppBar>,
    )
    expect(screen.getAllByText('Headline')).toHaveLength(1)
    for (const scrollBehavior of ['pinned', 'enter-always', 'exit-until-collapsed'] as const) {
      rerender(
        <AppBar data-testid="bar" scrollBehavior={scrollBehavior}>
          <Heading slot="headline">Headline</Heading>
        </AppBar>,
      )
      expect(screen.getAllByText('Headline')).toHaveLength(1)
      expect(screen.getByRole('heading', { name: 'Headline' })).toBeInTheDocument()
    }
  })

  it('types its variant, scroll behavior and the header’s own props', () => {
    expectTypeOf<AppBarProps['variant']>().toEqualTypeOf<
      'small' | 'medium-flexible' | 'large-flexible' | undefined
    >()
    expectTypeOf<AppBarProps['scrollBehavior']>().toEqualTypeOf<
      'pinned' | 'enter-always' | 'exit-until-collapsed' | undefined
    >()
    expectTypeOf<AppBarProps>().toHaveProperty('onScroll')
    // @ts-expect-error not a variant: the baseline medium and large bars are not drawn
    void (<AppBar variant="medium" />)
  })
})

describe('the search slot', () => {
  it('holds React Aria’s Button, named by its hinted text, with its ripple drawn first', async () => {
    const open = vi.fn()
    render(
      <AppBar data-testid="bar">
        <Back />
        <Button slot="search" onPress={open}>
          Search product
        </Button>
        <Action name="Account" />
      </AppBar>,
    )
    const search = button('Search product')
    expect(search.tagName).toBe('BUTTON')
    expect(search).toHaveAttribute('type', 'button')
    expect(search).toHaveAttribute('slot', 'search')
    expect(search.firstElementChild).toHaveClass('state-layer')
    expect(bar().children).toHaveLength(3)
    await userEvent.click(search)
    expect(open).toHaveBeenCalledOnce()
  })

  it('is a tab stop between the leading button and what trails, opened by Space or Enter', async () => {
    const open = vi.fn()
    render(
      <AppBar>
        <Back />
        <Button slot="search" onPress={open}>
          Search product
        </Button>
        <Action name="Account" />
      </AppBar>,
    )
    await userEvent.tab()
    await userEvent.tab()
    expect(button('Search product')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(open).toHaveBeenCalledTimes(2)
    await userEvent.tab()
    expect(button('Account')).toHaveFocus()
  })

  it('takes an Icon before or after its text in the `leading` or `trailing` slot, and no other', () => {
    render(
      <AppBar>
        <Button slot="search">
          <Icon slot="leading" name="search" data-testid="before" />
          Search product
          <Icon slot="trailing" name="mic" data-testid="after" />
        </Button>
      </AppBar>,
    )
    const search = button('Search product')
    // After the ripple: what leads, the text, what trails, as written.
    const [before, after] = [...search.children].slice(-2)
    expect(before).toBe(screen.getByTestId('before'))
    expect(after).toBe(screen.getByTestId('after'))
    expect(search).toHaveAccessibleName('Search product')

    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <AppBar>
          <Button slot="search">
            <Icon slot="label" name="search" />
          </Button>
        </AppBar>,
      ),
    ).toThrow(/Invalid slot "label"/)
    error.mockRestore()
  })

  it('holds React Aria’s Link given an href, which Enter opens and Space does not, with its ripple', async () => {
    const open = vi.fn()
    render(
      <AppBar>
        <Link slot="search" href="#search" onPress={open}>
          Search product
        </Link>
      </AppBar>,
    )
    const link = screen.getByRole('link', { name: 'Search product' })
    expect(link).toHaveAttribute('href', '#search')
    expect(link.firstElementChild).toHaveClass('state-layer')
    link.focus()
    await userEvent.keyboard(' ')
    expect(open).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    expect(open).toHaveBeenCalledOnce()
  })

  it('gives children given as a function the state React Aria reports of the button', async () => {
    const children = vi.fn(
      ({ isHovered, isDisabled }: { isHovered: boolean; isDisabled: boolean }) =>
        isDisabled ? 'Search is off' : isHovered ? 'Search product' : 'Search',
    )
    const { rerender } = render(
      <AppBar>
        <Button slot="search">{children}</Button>
      </AppBar>,
    )
    expect(children).toHaveBeenLastCalledWith(
      expect.objectContaining({
        isHovered: false,
        isPressed: false,
        isFocused: false,
        isFocusVisible: false,
        isDisabled: false,
      }),
    )
    await userEvent.hover(button('Search'))
    expect(button('Search product')).toBeInTheDocument()
    rerender(
      <AppBar>
        <Button slot="search" isDisabled>
          {children}
        </Button>
      </AppBar>,
    )
    expect(button('Search is off')).toBeInTheDocument()
  })

  it('passes the button its props, className and ref', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <AppBar>
        <Button
          slot="search"
          ref={ref}
          id="search"
          className={({ isFocused }) => (isFocused ? 'on' : 'off')}
        >
          Search
        </Button>
      </AppBar>,
    )
    expect(ref.current).toBe(button('Search'))
    expect(button('Search')).toHaveAttribute('id', 'search')
    expect(button('Search')).toHaveClass('off')
  })
})
