import { render, screen, waitFor } from '@testing-library/react'
import { useRef, useState, type ReactNode } from 'react'
import { Autocomplete, Input, Text, useFilter } from 'react-aria-components'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import {
  computedColor,
  computedRadius,
  press,
  pressEscape,
  rgba,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
  useReducedMotion,
} from '../../test-browser'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { List, ListItem } from '../list'
import { SearchField, SearchView, type SearchViewProps } from '.'

/* What needs a real browser and stylesheet: the bar's size, places and colors against the specs
 * page's, its states, each layout and style of focused search at rest, and its motion against
 * Compose's, paused at points along it. Markup and behavior: search.test.tsx. */

beforeEach(() => {
  document.body.style.background = 'var(--md-sys-color-surface)'
})

afterEach(() => {
  document.body.style.background = ''
})

const token = (role: string) => computedColor(`var(--md-sys-color-${role})`, document.body)
const rectOf = (el: Element) => el.getBoundingClientRect()
const button = (name: string) => screen.getByRole('button', { name })
const searchbox = () => screen.getAllByRole('searchbox').at(-1)!
const bar = () => searchbox().parentElement!
const centerX = (el: Element) => rectOf(el).left + rectOf(el).width / 2
const centerY = (el: Element) => rectOf(el).top + rectOf(el).height / 2

const avatar = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><rect width="30" height="30" fill="#6750a4"/></svg>',
)}`

function Page({ children }: { children: ReactNode }) {
  return <div style={{ width: 480, padding: 24 }}>{children}</div>
}

describe('search bar', () => {
  it('is 56dp tall and round, surface-container-high, and fills its room up to 720dp', () => {
    render(
      <div style={{ width: 900 }}>
        <SearchField aria-label="Search">
          <Input placeholder="Search" />
        </SearchField>
      </div>,
    )
    const style = getComputedStyle(bar())
    expect(rectOf(bar()).height).toBe(56)
    expect(rectOf(bar()).width).toBe(720)
    expect(style.borderRadius).toBe(computedRadius('rounded-full'))
    expect(style.backgroundColor).toBe(token('surface-container-high'))
    expect(style.boxShadow).toBe('none')
  })

  it('is 360dp wide at least, and no wider than the room it is in', () => {
    render(
      <>
        <div style={{ width: 200 }} data-testid="narrow">
          <SearchField aria-label="Narrow">
            <Input />
          </SearchField>
        </div>
        <div style={{ display: 'flex' }}>
          <SearchField aria-label="Shrunk">
            <Input />
          </SearchField>
        </div>
      </>,
    )
    const [narrow, shrunk] = screen.getAllByRole('searchbox').map((input) => input.parentElement!)
    expect(rectOf(narrow!).width).toBe(200)
    expect(rectOf(shrunk!).width).toBe(360)
  })

  it('puts a leading icon button’s and two trailing ones’ 48dp targets 4dp from its ends, the text 4dp from them', () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <IconButton slot="leading" aria-label="Menu">
            <Icon name="menu" />
          </IconButton>
          <Input placeholder="Hinted search text" />
          <IconButton slot="trailing" aria-label="Voice search">
            <Icon name="mic" />
          </IconButton>
          <IconButton slot="trailing" aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
        </SearchField>
      </Page>,
    )
    const box = rectOf(bar())
    expect(centerX(button('Menu')) - box.left).toBe(4 + 24)
    expect(rectOf(searchbox()).left - box.left).toBe(4 + 48 + 4)
    expect(box.right - centerX(button('More'))).toBe(4 + 24)
    expect(box.right - centerX(button('Voice search'))).toBe(4 + 48 + 24)
    expect(rectOf(button('Voice search')).left - rectOf(searchbox()).right).toBe(4 + 4)
    for (const name of ['Menu', 'Voice search', 'More'])
      expect(centerY(button(name))).toBe(centerY(bar()))
  })

  it('draws a non-functional icon at 24dp in the middle of its target, the text after it', () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <Icon slot="leading" name="search" data-testid="icon" />
          <Input placeholder="Search" />
        </SearchField>
      </Page>,
    )
    const icon = screen.getByTestId('icon')
    expect(rectOf(icon).width).toBe(24)
    expect(rectOf(icon).left - rectOf(bar()).left).toBe(16)
    expect(centerY(icon)).toBe(centerY(bar()))
    expect(rectOf(searchbox()).left - rectOf(bar()).left).toBe(56)
  })

  it('starts and ends the text 16dp in where nothing leads or trails it', () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <Input placeholder="Search" />
          <IconButton aria-label="Clear search">
            <Icon name="close" />
          </IconButton>
        </SearchField>
      </Page>,
    )
    expect(rectOf(searchbox()).left - rectOf(bar()).left).toBe(16)
    // The clear button is there only with text.
    expect(bar().querySelector('button')).not.toBeVisible()
    expect(rectOf(bar()).right - rectOf(searchbox()).right).toBe(16)
  })

  it('shows the clear button once there is text, 4dp from the end', async () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <Input placeholder="Search" />
          <IconButton aria-label="Clear search">
            <Icon name="close" />
          </IconButton>
        </SearchField>
      </Page>,
    )
    await userEvent.type(searchbox(), 'Peanut')
    expect(button('Clear search')).toBeVisible()
    expect(rectOf(bar()).right - centerX(button('Clear search'))).toBe(4 + 24)
    expect(rectOf(button('Clear search')).left - rectOf(searchbox()).right).toBe(8)
  })

  it('draws an avatar 30dp and round in the middle of a 48dp target', () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <Input placeholder="Search" />
          <IconButton slot="trailing" aria-label="Account">
            <img src={avatar} alt="" />
          </IconButton>
        </SearchField>
      </Page>,
    )
    const image = button('Account').querySelector('img')!
    expect(rectOf(image).width).toBe(30)
    expect(rectOf(image).height).toBe(30)
    expect(getComputedStyle(image).borderRadius).toBe(computedRadius('rounded-full'))
    expect(rectOf(bar()).right - centerX(image)).toBe(28)
    expect(centerY(image)).toBe(centerY(bar()))
    expect(rectOf(button('Account')).height).toBe(40)
  })

  it('has the hinted text and the trailing icons on-surface-variant, the query and what leads on-surface, in body large', async () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <IconButton slot="leading" aria-label="Menu">
            <Icon name="menu" />
          </IconButton>
          <Input placeholder="Search" />
          <Icon slot="trailing" name="search" data-testid="trailing" />
          <IconButton slot="trailing" aria-label="Voice search">
            <Icon name="mic" />
          </IconButton>
        </SearchField>
      </Page>,
    )
    expect(getComputedStyle(searchbox(), '::placeholder').color).toBe(token('on-surface-variant'))
    expect(getComputedStyle(searchbox()).color).toBe(token('on-surface'))
    expect(getComputedStyle(searchbox()).caretColor).toBe(token('primary'))
    expect(getComputedStyle(button('Menu')).color).toBe(token('on-surface'))
    expect(getComputedStyle(button('Voice search')).color).toBe(token('on-surface-variant'))
    expect(getComputedStyle(screen.getByTestId('trailing')).color).toBe(token('on-surface-variant'))
    const type = getComputedStyle(searchbox())
    expect(type.fontSize).toBe('16px')
    expect(type.lineHeight).toBe('24px')
    expect(type.letterSpacing).toBe('0.5px')
    expect(type.fontWeight).toBe('400')
  })

  it('shows its on-surface state layer at 8% on hover, but not over a button of its own', async () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <Input placeholder="Search" />
          <IconButton slot="trailing" aria-label="Voice search">
            <Icon name="mic" />
          </IconButton>
        </SearchField>
      </Page>,
    )
    const layer = bar().querySelector(':scope > .state-layer')!
    expect(getComputedStyle(layer).backgroundColor).toBe(token('on-surface'))
    await userEvent.hover(searchbox())
    await settle()
    expect(getComputedStyle(layer).opacity).toBe('0.08')
    await userEvent.hover(button('Voice search'))
    await settle()
    expect(getComputedStyle(layer).opacity).toBe('0')
  })

  it('draws its focus ring around it while the keyboard has its input focused, not a pointer', async () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <Input placeholder="Search" />
        </SearchField>
      </Page>,
    )
    await userEvent.tab()
    expect(searchbox()).toHaveFocus()
    const style = getComputedStyle(bar())
    expect(style.outlineStyle).toBe('solid')
    expect(style.outlineWidth).toBe('3px')
    expect(style.outlineOffset).toBe('2px')
    expect(style.outlineColor).toBe(token('secondary'))
    expect(getComputedStyle(searchbox()).outlineStyle).toBe('none')
    await userEvent.click(searchbox())
    expect(getComputedStyle(bar()).outlineStyle).toBe('none')
  })

  it('draws the press ripple in on-surface', async () => {
    render(
      <Page>
        <SearchField aria-label="Search">
          <Input placeholder="Search" />
        </SearchField>
      </Page>,
    )
    await userEvent.click(searchbox())
    const surface = bar().querySelector(':scope > .state-layer + *')!
    expect(getComputedStyle(surface).color).toBe(token('on-surface'))
  })

  it('has its text and icons at 38% disabled', () => {
    render(
      <Page>
        <SearchField aria-label="Search" isDisabled defaultValue="Peanut">
          <Icon slot="leading" name="search" data-testid="icon" />
          <Input placeholder="Search" />
          <Icon slot="trailing" name="mic" data-testid="trailing" />
          <IconButton slot="trailing" aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
          <IconButton slot="trailing" aria-label="Voice search" isDisabled={false}>
            <Icon name="mic" />
          </IconButton>
        </SearchField>
      </Page>,
    )
    const disabled = computedColor(
      'color-mix(in oklab, var(--md-sys-color-on-surface) 38%, transparent)',
      document.body,
    )
    expect(getComputedStyle(searchbox()).color).toBe(disabled)
    expect(getComputedStyle(screen.getByTestId('icon')).color).toBe(disabled)
    expect(getComputedStyle(screen.getByTestId('trailing')).color).toBe(disabled)
    expect(getComputedStyle(button('More')).color).toBe(disabled)
    // A button that says it is enabled keeps its own color.
    expect(getComputedStyle(button('Voice search')).color).toBe(token('on-surface-variant'))
  })

  describe('in forced colors', () => {
    useForcedColors()

    it('is edged, since its fill is dropped', () => {
      render(
        <Page>
          <SearchField aria-label="Search">
            <Input placeholder="Search" />
          </SearchField>
        </Page>,
      )
      expect(getComputedStyle(bar()).borderTopStyle).toBe('solid')
      expect(getComputedStyle(bar()).borderTopWidth).toBe('1px')
    })
  })
})

const suggestions = ['Peanut butter', 'Pet adoption', 'Movie marathon', 'Museum field trip']

// Focused search as the story writes it, its page's bar at the given place, the bar's icon first
// in the view's unless it has none.
function FocusedSearch({
  barStyle = { margin: '8px 24px' },
  items = suggestions,
  hasPageIcon = true,
  ...props
}: Partial<SearchViewProps> & {
  barStyle?: React.CSSProperties
  items?: string[]
  hasPageIcon?: boolean
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setOpen] = useState(false)
  const trigger = useRef<HTMLDivElement>(null)
  const { contains } = useFilter({ sensitivity: 'base' })
  return (
    <>
      <SearchField
        ref={trigger}
        aria-label="Search"
        value={query}
        onChange={setQuery}
        onClick={() => setOpen(true)}
        style={barStyle}
        data-testid="page-bar"
      >
        <Icon slot="leading" name="search" />
        <Input placeholder="Search" />
      </SearchField>
      <SearchView
        aria-label="Search"
        triggerRef={trigger}
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
            <SearchField autoFocus aria-label="Search">
              {hasPageIcon && <Icon slot="leading" name="search" />}
              <IconButton slot="leading" aria-label="Back" onPress={state.close}>
                <Icon name="arrow_back" />
              </IconButton>
              <Input placeholder="Search" />
            </SearchField>
            <List aria-label="Suggestions">
              {items.map((label) => (
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

const pageBar = () => screen.getByTestId('page-bar')
const modal = () => screen.getByRole('dialog').parentElement!
const list = () => screen.getByRole('grid')

async function open(props: Partial<Parameters<typeof FocusedSearch>[0]> = {}) {
  render(<FocusedSearch {...props} />)
  await userEvent.click(pageBar().querySelector('input')!)
  await settle()
}

// The container's transition of how far it is open, opening or closing, paused at a point of its
// own timing.
function pausedAt(progress: number) {
  const transition = modal()
    .getAnimations()
    .find(
      (animation) =>
        animation instanceof CSSTransition && animation.transitionProperty === '--search-view-open',
    )!
  transition.pause()
  transition.currentTime = Number(transition.effect!.getComputedTiming().duration) * progress
  return transition
}

// How far the container is open, and the first point of its transition's timing where it is as
// far as that, to within 2%.
const howOpen = () => parseFloat(getComputedStyle(modal()).getPropertyValue('--search-view-open'))
function timeAt(open: number) {
  for (let progress = 0; progress <= 1; progress += 0.001) {
    pausedAt(progress)
    if (Math.abs(howOpen() - open) < 0.02) return progress
  }
  throw new Error(`never ${open} open`)
}

describe('docked', () => {
  it('draws its bar where the page’s is, as wide, the list 2dp below on surface-container-high with 12dp corners', async () => {
    await open()
    expect(rectOf(bar()).toJSON()).toEqual(rectOf(pageBar()).toJSON())
    expect(searchbox()).toHaveFocus()
    expect(rectOf(list()).top - rectOf(bar()).bottom).toBe(2)
    expect(rectOf(list()).width).toBe(rectOf(bar()).width)
    const style = getComputedStyle(list())
    expect(style.backgroundColor).toBe(token('surface-container-high'))
    expect(style.borderTopLeftRadius).toBe(computedRadius('rounded-shape-md').split(' ')[0])
    expect(style.borderBottomRightRadius).toBe(computedRadius('rounded-shape-md').split(' ')[0])
  })

  it('keeps the window’s 12dp from a trigger too narrow for it near its right edge', async () => {
    await open({ barStyle: { position: 'fixed', top: 8, right: 20, width: 80, minWidth: 0 } })
    expect(rectOf(modal()).width).toBe(360)
    expect(rectOf(modal()).right).toBe(innerWidth - 12)
    expect(rectOf(modal()).top).toBe(8)
  })

  it('stays over a trigger as wide as it, at the window’s edge', async () => {
    await open({ barStyle: { position: 'fixed', top: 8, right: 0, width: 400 } })
    expect(rectOf(bar()).toJSON()).toEqual(rectOf(pageBar()).toJSON())
  })

  it('stays over a trigger as wide as a narrow window', async () => {
    await page.viewport(375, 800)
    try {
      await open({ barStyle: { margin: 0 } })
      expect(rectOf(bar()).width).toBe(375)
      expect(rectOf(bar()).toJSON()).toEqual(rectOf(pageBar()).toJSON())
    } finally {
      await page.viewport(1280, 896)
    }
  })

  describe('in forced colors', () => {
    useForcedColors()

    it.each([
      ['contained', list],
      ['divided', () => screen.getByRole('dialog')],
    ] as const)(
      'is edged, %s, where its fill is dropped, and only there',
      async (variant, edged) => {
        await open({ variant })
        const style = getComputedStyle(edged())
        for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
          expect(style[`border${side}Style`]).toBe('solid')
          expect(style[`border${side}Width`]).toBe('1px')
        }
        expect(style.borderTopLeftRadius).toBe(computedRadius('rounded-shape-md').split(' ')[0])
        expect(style.borderBottomRightRadius).toBe(computedRadius('rounded-shape-md').split(' ')[0])
        if (variant === 'contained')
          expect(getComputedStyle(screen.getByRole('dialog')).borderTopStyle).toBe('none')
      },
    )
  })

  it('shows no state of its bar’s own', async () => {
    await open()
    await userEvent.hover(searchbox())
    const layer = bar().querySelector(':scope > .state-layer')!
    expect(getComputedStyle(layer).display).toBe('none')
  })

  it('puts a list’s items on the container’s color', async () => {
    await open()
    const item = screen.getAllByRole('row')[0]!
    expect(getComputedStyle(item).backgroundColor).toBe('rgba(0, 0, 0, 0)')
  })

  it('scrims the page at 32%', async () => {
    await open()
    const scrim = getComputedStyle(modal(), '::before')
    expect(scrim.position).toBe('fixed')
    expect(scrim.backgroundColor).toBe(
      computedColor(
        'color-mix(in oklab, var(--md-sys-color-scrim) 32%, transparent)',
        document.body,
      ),
    )
    expect(scrim.opacity).toBe('1')
    expect(rectOf(modal()).width).toBe(rectOf(pageBar()).width)
  })

  it('closes on a press on the scrim, or divided, on the page beside it', async () => {
    for (const variant of ['contained', 'divided'] as const) {
      await open({ variant })
      await userEvent.click(document.body, { position: { x: 4, y: innerHeight - 4 }, force: true })
      await settle()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      document.body.replaceChildren()
    }
  })

  it('fades the page’s bar’s icon, where it is, through the back button as it opens, and back as it closes', async () => {
    await open()
    const [icon, back] = bar().querySelectorAll('[slot="leading"]')
    const pageIcon = pageBar().querySelector('[slot="leading"]')!
    expect(rectOf(icon!).toJSON()).toEqual(rectOf(pageIcon).toJSON())
    expect(centerX(back!)).toBe(centerX(icon!))
    expect(getComputedStyle(icon!).opacity).toBe('0')
    expect(getComputedStyle(back!).opacity).toBe('1')
    pressEscape()
    pausedAt(timeAt(0.75))
    expect(getComputedStyle(icon!).opacity).toBe('0')
    expect(parseFloat(getComputedStyle(back!).opacity)).toBeCloseTo(0.5, 1)
    pausedAt(timeAt(0.25))
    expect(parseFloat(getComputedStyle(icon!).opacity)).toBeCloseTo(0.5, 1)
    expect(getComputedStyle(back!).opacity).toBe('0')
  })

  it('fades a back button alone out as it closes', async () => {
    await open({ hasPageIcon: false })
    pressEscape()
    pausedAt(timeAt(0.75))
    expect(parseFloat(getComputedStyle(button('Back')).opacity)).toBeCloseTo(0.75, 1)
    pausedAt(timeAt(0.25))
    expect(parseFloat(getComputedStyle(button('Back')).opacity)).toBeCloseTo(0.25, 1)
  })

  it('is 240dp tall at least, filled to its end, and two thirds of the window at most, its list scrolling', async () => {
    await open({ items: ['Peanut butter'] })
    expect(rectOf(modal()).height).toBe(240)
    expect(rectOf(list()).bottom).toBe(rectOf(modal()).bottom)
    await userEvent.click(button('Back'))
    await settle()
    document.body.replaceChildren()
    await open({ items: Array.from({ length: 30 }, (_, index) => `Suggestion ${index}`) })
    expect(rectOf(modal()).height).toBeCloseTo((innerHeight * 2) / 3, 0)
    expect(getComputedStyle(list()).overflowY).toBe('auto')
    expect(list().scrollHeight).toBeGreaterThan(list().clientHeight)
  })

  it('divided: one surface-container-high container with 12dp corners, the bar its header over an outline divider, and no scrim', async () => {
    await open({ variant: 'divided' })
    const dialog = screen.getByRole('dialog')
    expect(rgba(getComputedStyle(dialog).backgroundColor)).toEqual(
      rgba(token('surface-container-high')),
    )
    expect(getComputedStyle(dialog).borderRadius).toBe(computedRadius('rounded-shape-md'))
    const header = getComputedStyle(bar())
    expect(header.backgroundColor).toBe('rgba(0, 0, 0, 0)')
    expect(header.borderBottomWidth).toBe('1px')
    expect(header.borderBottomColor).toBe(token('outline'))
    expect(rectOf(bar()).height).toBe(57)
    expect(rectOf(list()).top).toBe(rectOf(bar()).bottom)
    expect(getComputedStyle(modal(), '::before').content).toBe('none')
  })

  it('divided: grows out of the page’s bar, its corners the bar’s round going to 12dp as it opens, and back as it closes', async () => {
    render(<FocusedSearch variant="divided" />)
    press(pageBar().querySelector('input')!)
    const dialog = screen.getByRole('dialog')
    pausedAt(0)
    expect(getComputedStyle(dialog).clipPath).toBe('inset(0px 0px calc(100% - 56px) round 28px)')
    pausedAt(timeAt(0.5))
    const corner = parseFloat(getComputedStyle(dialog).clipPath.split('round ')[1]!)
    expect(corner).toBeCloseTo(12 + 16 * (1 - howOpen()), 1)
    pausedAt(1)
    expect(getComputedStyle(dialog).clipPath).toBe('inset(0px 0px 0% round 12px)')
    await settle()
    pressEscape()
    pausedAt(1)
    expect(getComputedStyle(dialog).clipPath).toBe('inset(0px 0px calc(100% - 56px) round 28px)')
  })

  it('starts its bar, or divided its container, in the color of the page’s bar it is drawn over', async () => {
    for (const [variant, surface] of [
      ['contained', () => bar()],
      ['divided', () => screen.getByRole('dialog')],
    ] as const) {
      const { unmount } = render(
        <FocusedSearch
          variant={variant}
          barStyle={{ margin: '8px 24px', background: 'rgb(200, 100, 50)' }}
        />,
      )
      press(pageBar().querySelector('input')!)
      pausedAt(0)
      expect(rgba(getComputedStyle(surface()).backgroundColor)).toEqual([200, 100, 50, 255])
      pausedAt(1)
      expect(rgba(getComputedStyle(surface()).backgroundColor)).toEqual(
        rgba(token('surface-container-high')),
      )
      unmount()
    }
  })

  it('opens from the bar down on the fast spatial spring, what is below it fading in 50ms on over 100ms', async () => {
    render(<FocusedSearch />)
    press(pageBar().querySelector('input')!)
    const style = getComputedStyle(modal())
    expect(style.transitionProperty).toBe('--search-view-open, --search-view-content')
    expect(style.transitionDuration).toBe(`${springDuration('fast-spatial')}, 0.1s`)
    expect(style.transitionDelay).toBe('0s, 0.05s')
    expect(style.transitionTimingFunction).toContain(springEasing('fast-spatial'))
    expect(style.transitionTimingFunction).toContain('cubic-bezier(0.3, 0, 1, 1)')
    pausedAt(0)
    // Only the bar shows, the scrim not yet on.
    const dialog = screen.getByRole('dialog')
    expect(getComputedStyle(dialog).clipPath).toBe('inset(0px 0px calc(100% - 56px) round 12px)')
    expect(getComputedStyle(modal(), '::before').opacity).toBe('0')
    pausedAt(1)
    expect(getComputedStyle(dialog).clipPath).toBe('inset(0px 0px 0% round 12px)')
  })

  it('closes up to its bar, not into it where the spring goes past closed', async () => {
    await open()
    pressEscape()
    let furthest = { progress: 0, howOpen: Infinity }
    for (let progress = 0; progress <= 1; progress += 0.01) {
      pausedAt(progress)
      if (howOpen() < furthest.howOpen) furthest = { progress, howOpen: howOpen() }
    }
    pausedAt(furthest.progress)
    expect(howOpen()).toBeLessThan(0)
    expect(getComputedStyle(screen.getByRole('dialog')).clipPath).toBe(
      'inset(0px 0px calc(100% - 56px) round 12px)',
    )
  })
})

it.each(['docked', 'full-screen'] as const)(
  'divided, %s: never comes back open as it closes',
  async (layout) => {
    await open({ layout, variant: 'divided' })
    press(button('Back'))
    const closing = pausedAt(0)
    const duration = Number(closing.effect!.getComputedTiming().duration)
    let least = Infinity
    for (let time = 0; time <= duration; time += 1000 / 60) {
      closing.currentTime = time
      expect(howOpen()).toBeLessThanOrEqual(least)
      least = howOpen()
    }
  },
)

describe('full-screen', () => {
  it('contained: the window surface-container-low, the bar 12dp from its sides and 4dp from its top, the list 8dp below it', async () => {
    await open({ layout: 'full-screen' })
    expect(rectOf(modal()).toJSON()).toMatchObject({
      top: 0,
      left: 0,
      width: innerWidth,
      height: innerHeight,
    })
    const fill = getComputedStyle(modal(), '::before')
    expect(fill.backgroundColor).toBe(token('surface-container-low'))
    expect(fill.opacity).toBe('1')
    expect(rectOf(bar()).left).toBe(12)
    expect(innerWidth - rectOf(bar()).right).toBeCloseTo(12, 0)
    expect(rectOf(bar()).top).toBe(4)
    expect(rectOf(bar()).height).toBe(56)
    expect(rgba(getComputedStyle(bar()).backgroundColor)).toEqual(
      rgba(token('surface-container-high')),
    )
    expect(rectOf(list()).top - rectOf(bar()).bottom).toBe(8)
    expect(rectOf(list()).bottom).toBe(rectOf(modal()).bottom)
  })

  it('contained: grows its bar out of the page’s, 24dp from the window’s sides, to 12dp, as it comes up', async () => {
    render(<FocusedSearch layout="full-screen" barStyle={{ margin: '40px 24px 0' }} />)
    press(pageBar().querySelector('input')!)
    pausedAt(0)
    expect(rectOf(bar()).toJSON()).toEqual(rectOf(pageBar()).toJSON())
    expect(getComputedStyle(modal(), '::before').opacity).toBe('0')
    expect(getComputedStyle(list()).opacity).toBe('0')
    pausedAt(1)
    expect(rectOf(bar()).left).toBe(12)
    expect(rectOf(bar()).top).toBe(4)
  })

  it('contained: overshoots in width on the spring, never in place', async () => {
    render(<FocusedSearch layout="full-screen" barStyle={{ margin: '40px 24px 0' }} />)
    press(pageBar().querySelector('input')!)
    const from = rectOf(pageBar()).top
    const opening = pausedAt(0)
    const duration = Number(opening.effect!.getComputedTiming().duration)
    let narrowest = Infinity
    const tops: number[] = []
    for (let time = 0; time < duration; time += 1000 / 60) {
      opening.currentTime = time
      narrowest = Math.min(narrowest, rectOf(bar()).left)
      tops.push(rectOf(bar()).top)
    }
    // 12dp from the side at rest, nearer to it past that on the way.
    expect(narrowest).toBeLessThan(11.5)
    // Between the page's bar and where it rests, never past either.
    for (const top of tops) {
      expect(top).toBeGreaterThanOrEqual(Math.min(from, 4) - 0.01)
      expect(top).toBeLessThanOrEqual(Math.max(from, 4) + 0.01)
    }
  })

  it('contained: closes into the page’s bar, never inside it where the spring goes past closed', async () => {
    render(<FocusedSearch layout="full-screen" barStyle={{ margin: '40px 240px 0' }} />)
    await userEvent.click(pageBar().querySelector('input')!)
    await settle()
    press(button('Back'))
    const from = rectOf(pageBar())
    const closing = pausedAt(0)
    const duration = Number(closing.effect!.getComputedTiming().duration)
    let furthest = Infinity
    for (let time = 0; time <= duration; time += 1000 / 60) {
      closing.currentTime = time
      furthest = Math.min(furthest, howOpen())
      const box = rectOf(bar())
      expect(box.left).toBeLessThanOrEqual(from.left + 0.01)
      expect(box.right).toBeGreaterThanOrEqual(from.right - 0.01)
      expect(box.top).toBeLessThanOrEqual(from.top + 0.01)
    }
    expect(furthest).toBeLessThan(0)
  })

  it('divided: the window surface-container-high, the bar a 72dp header over an outline divider', async () => {
    await open({ layout: 'full-screen', variant: 'divided' })
    expect(rgba(getComputedStyle(modal(), '::before').backgroundColor)).toEqual(
      rgba(token('surface-container-high')),
    )
    expect(getComputedStyle(modal()).clipPath).toBe('inset(0px 0% 0% 0px)')
    expect(rectOf(bar()).toJSON()).toMatchObject({ top: 0, left: 0, height: 73 })
    expect(rectOf(bar()).width).toBe(innerWidth)
    expect(rgba(getComputedStyle(bar()).borderBottomColor)).toEqual(rgba(token('outline')))
    expect(centerY(button('Back'))).toBe(36)
    expect(centerX(button('Back'))).toBe(28)
  })

  it('divided: grows its fill from the page’s bar to the window on the default spatial spring, and closes on the fast effects one', async () => {
    render(<FocusedSearch layout="full-screen" variant="divided" />)
    press(pageBar().querySelector('input')!)
    expect(getComputedStyle(modal()).transitionDuration).toContain(
      springDuration('default-spatial'),
    )
    pausedAt(0)
    const from = rectOf(pageBar())
    expect(getComputedStyle(modal()).opacity).toBe('1')
    expect(getComputedStyle(modal()).clipPath).toBe(
      `inset(${from.top}px calc(100% - ${from.right}px) calc(100% - ${from.bottom}px) ${from.left}px round 28px)`,
    )
    // The bar's row is where the page's is, its divider and the list not yet shown.
    expect(centerY(button('Back'))).toBe(centerY(pageBar()))
    expect(rectOf(bar()).left).toBe(from.left)
    expect(getComputedStyle(list()).opacity).toBe('0')
    pausedAt(1)
    await settle()
    press(button('Back'))
    expect(getComputedStyle(modal()).transitionDuration).toContain(springDuration('fast-effects'))
  })

  it('divided: shows what is in it only within its fill as it grows', async () => {
    render(<FocusedSearch layout="full-screen" variant="divided" />)
    press(pageBar().querySelector('input')!)
    pausedAt(timeAt(0.5))
    const from = rectOf(pageBar())
    const fillBottom = from.bottom + (innerHeight - from.bottom) * howOpen()
    expect(rectOf(list()).top).toBeLessThan(fillBottom - 10)
    expect(rectOf(list()).bottom).toBeGreaterThan(fillBottom + 10)
    expect(list().contains(document.elementFromPoint(innerWidth / 2, fillBottom - 10))).toBe(true)
    expect(modal().contains(document.elementFromPoint(innerWidth / 2, fillBottom + 10))).toBe(false)
  })

  it('starts its bar, or divided its fill, in the color of the page’s bar it grows out of', async () => {
    for (const [variant, surface] of [
      ['contained', () => getComputedStyle(bar())],
      ['divided', () => getComputedStyle(modal(), '::before')],
    ] as const) {
      const { unmount } = render(
        <FocusedSearch
          layout="full-screen"
          variant={variant}
          barStyle={{ margin: '40px 24px 0', background: 'rgb(200, 100, 50)' }}
        />,
      )
      press(pageBar().querySelector('input')!)
      pausedAt(0)
      expect(rgba(surface().backgroundColor)).toEqual([200, 100, 50, 255])
      pausedAt(1)
      expect(rgba(surface().backgroundColor)).toEqual(rgba(token('surface-container-high')))
      unmount()
    }
  })

  it('closes back into the page’s bar, which gets the focus back', async () => {
    await open({ layout: 'full-screen' })
    press(button('Back'))
    expect(modal()).toHaveAttribute('data-exiting')
    await settle()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(pageBar().querySelector('input')).toHaveFocus()
  })
})

describe('with no trigger', () => {
  it.each([
    ['docked', 'contained'],
    ['docked', 'divided'],
    ['full-screen', 'contained'],
    ['full-screen', 'divided'],
  ] as const)('fades in and out, %s and %s', async (layout, variant) => {
    render(<FocusedSearch layout={layout} variant={variant} triggerRef={undefined} />)
    press(pageBar().querySelector('input')!)
    pausedAt(0)
    expect(getComputedStyle(modal()).opacity).toBe('0')
    pausedAt(1)
    await settle()
    expect(getComputedStyle(modal()).opacity).toBe('1')
    press(button('Back'))
    pausedAt(0.999)
    expect(howOpen()).toBeLessThan(0.05)
    expect(parseFloat(getComputedStyle(modal()).opacity)).toBeLessThan(0.05)
  })

  it('divided, full-screen: keeps to the window’s square and the bar to its place', async () => {
    render(<FocusedSearch layout="full-screen" variant="divided" triggerRef={undefined} />)
    press(pageBar().querySelector('input')!)
    pausedAt(0)
    expect(getComputedStyle(modal()).clipPath).toBe('inset(0px 0% 0% 0px)')
    const from = rectOf(bar()).toJSON()
    pausedAt(1)
    await settle()
    expect(rectOf(bar()).toJSON()).toEqual(from)
  })
})

// Focused search with no Autocomplete: the bar's input is a plain one, and the focus itself moves
// into the list.
function PlainFocusedSearch({ children }: { children?: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const trigger = useRef<HTMLDivElement>(null)
  return (
    <>
      <SearchField
        ref={trigger}
        aria-label="Search"
        onClick={() => setOpen(true)}
        data-testid="page-bar"
      >
        <Input />
      </SearchField>
      <SearchView aria-label="Search" triggerRef={trigger} isOpen={isOpen} onOpenChange={setOpen}>
        <SearchField autoFocus aria-label="Search">
          <Input />
        </SearchField>
        {children ?? (
          <List aria-label="Suggestions">
            {suggestions.map((label) => (
              <ListItem key={label} id={label} textValue={label}>
                <Text slot="label">{label}</Text>
              </ListItem>
            ))}
          </List>
        )}
      </SearchView>
    </>
  )
}

const option = (name: string) => screen.getByRole('row', { name })

describe('focus ring in focused search', () => {
  it('draws its bar’s inside its edge, which the container is drawn to, in each layout and style', async () => {
    for (const layout of ['docked', 'full-screen'] as const)
      for (const variant of ['contained', 'divided'] as const) {
        const { unmount } = render(<FocusedSearch layout={layout} variant={variant} />)
        await userEvent.click(pageBar().querySelector('input')!)
        await settle()
        expect(getComputedStyle(bar()).outlineStyle).toBe('none')
        // Back to it by the keyboard: React Aria takes no other key in a text input for one.
        await userEvent.tab({ shift: true })
        await userEvent.tab()
        expect(searchbox()).toHaveFocus()
        const style = getComputedStyle(bar())
        expect(style.outlineStyle).toBe('solid')
        expect(style.outlineWidth).toBe('3px')
        expect(style.outlineOffset).toBe('-3px')
        expect(style.outlineColor).toBe(token('secondary'))
        // Docked and divided, it follows the container's top corners.
        if (layout === 'docked' && variant === 'divided')
          expect(style.borderTopLeftRadius).toBe(computedRadius('rounded-shape-md').split(' ')[0])
        unmount()
      }
  })

  it('rings no focus for a key that types or closes, on its bar, the list or the page’s bar', async () => {
    await open()
    await userEvent.keyboard('pe')
    expect(searchbox()).not.toHaveAttribute('data-focus-visible')
    expect(getComputedStyle(bar()).outlineStyle).toBe('none')
    // Escape empties it, then closes it.
    await userEvent.keyboard('{Escape}')
    expect(searchbox()).toHaveValue('')
    expect(searchbox()).not.toHaveAttribute('data-focus-visible')
    await userEvent.keyboard('{Escape}')
    await settle()
    const input = pageBar().querySelector('input')!
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).not.toHaveAttribute('data-focus-visible')
    expect(getComputedStyle(pageBar()).outlineStyle).toBe('none')
  })

  it('rings the item Tab moves to and the arrows move through, and the focus Tab takes, and gives it back ringed', async () => {
    await open()
    await userEvent.tab()
    await waitFor(() => expect(screen.getAllByRole('row')[0]).toHaveAttribute('data-focus-visible'))
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-focus-visible'))
    await userEvent.tab({ shift: true })
    expect(searchbox()).toHaveAttribute('data-focus-visible')
    await userEvent.tab({ shift: true })
    expect(button('Back')).toHaveAttribute('data-focus-visible')
    await userEvent.keyboard('{Escape}')
    await settle()
    const input = pageBar().querySelector('input')!
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveAttribute('data-focus-visible')
  })

  it.each([
    ['End', 'Museum field trip'],
    ['PageDown', 'Museum field trip'],
  ])(
    'rings the item %s moves to from the first, which Tab reaches, in an Autocomplete',
    async (key, name) => {
      await open()
      await userEvent.tab()
      await waitFor(() => expect(option('Peanut butter')).toHaveAttribute('data-focus-visible'))
      await userEvent.keyboard(`{${key}}`)
      await waitFor(() => expect(option(name)).toHaveAttribute('data-focus-visible'))
      expect(option(name)).toHaveFocus()
    },
  )

  it('rings nothing for the arrows, Home and the like in an Autocomplete’s bar, which its grid takes none of', async () => {
    await open()
    await userEvent.keyboard('pe{ArrowDown}{ArrowUp}{Home}{End}{PageUp}{PageDown}')
    expect(searchbox()).toHaveFocus()
    expect(searchbox()).not.toHaveAttribute('data-focus-visible')
    expect(getComputedStyle(bar()).outlineStyle).toBe('none')
    for (const row of screen.getAllByRole('row'))
      expect(row).not.toHaveAttribute('data-focus-visible')
  })

  it.each([
    ['Home', 'Peanut butter'],
    ['End', 'Museum field trip'],
    ['PageUp', 'Peanut butter'],
    ['PageDown', 'Museum field trip'],
    ['m', 'Movie marathon'],
  ])('rings the option %s moves to in a list a press has the focus in', async (key, name) => {
    render(<PlainFocusedSearch />)
    await userEvent.click(pageBar().querySelector('input')!)
    await settle()
    await userEvent.click(option('Pet adoption'))
    expect(option('Pet adoption')).toHaveFocus()
    expect(option('Pet adoption')).not.toHaveAttribute('data-focus-visible')
    await userEvent.keyboard(key.length > 1 ? `{${key}}` : key)
    await waitFor(() => expect(option(name)).toHaveFocus())
    expect(option(name)).toHaveAttribute('data-focus-visible')
  })

  it('rings nothing for the arrows, Home and the like in a text input of its own, whose caret they move', async () => {
    render(<PlainFocusedSearch />)
    await userEvent.click(pageBar().querySelector('input')!)
    await settle()
    await userEvent.keyboard('pe{Home}')
    expect((searchbox() as HTMLInputElement).selectionStart).toBe(0)
    await userEvent.keyboard(
      '{ArrowUp}{ArrowDown}{ArrowLeft}{ArrowRight}{End}{PageUp}{PageDown}{Escape}{Escape}',
    )
    await settle()
    const input = pageBar().querySelector('input')!
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).not.toHaveAttribute('data-focus-visible')
  })

  it('rings nothing for the left and right arrows of an Autocomplete’s bar with no option on, which move its caret', async () => {
    await open()
    await userEvent.keyboard('pe{ArrowLeft}{ArrowRight}{Escape}{Escape}')
    await settle()
    const input = pageBar().querySelector('input')!
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).not.toHaveAttribute('data-focus-visible')
  })

  it('takes the arrows on an input that is no text input for the keyboard’s, a radio’s', async () => {
    render(
      <PlainFocusedSearch>
        <div>
          <input type="radio" name="scope" aria-label="All" />
          <input type="radio" name="scope" aria-label="Mail" />
        </div>
      </PlainFocusedSearch>,
    )
    await userEvent.click(pageBar().querySelector('input')!)
    await settle()
    await userEvent.click(screen.getByLabelText('All'))
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByLabelText('Mail')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await settle()
    const input = pageBar().querySelector('input')!
    await waitFor(() => expect(input).toHaveFocus())
    expect(input).toHaveAttribute('data-focus-visible')
  })

  it('rings nothing for Shift and Home, which select the text of an Autocomplete’s bar', async () => {
    await open()
    await userEvent.keyboard('pe{Shift>}{Home}{/Shift}')
    const input = searchbox() as HTMLInputElement
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 2])
    await userEvent.keyboard('{Escape}{Escape}')
    await settle()
    const pageInput = pageBar().querySelector('input')!
    await waitFor(() => expect(pageInput).toHaveFocus())
    expect(pageInput).not.toHaveAttribute('data-focus-visible')
  })

  it('draws none on its bar as it closes, though the keyboard has its focus', async () => {
    await open()
    await userEvent.tab({ shift: true })
    await userEvent.tab()
    const input = searchbox()
    const frames: { isFocusVisible: boolean; outline: string }[] = []
    const sample = () => {
      frames.push({
        isFocusVisible: input.hasAttribute('data-focus-visible'),
        outline: getComputedStyle(input.parentElement!).outlineStyle,
      })
      if (frames.length < 10) requestAnimationFrame(sample)
    }
    input.addEventListener('keydown', () => requestAnimationFrame(sample), { once: true })
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => frames.length).toBe(10)
    expect(frames.some((frame) => frame.isFocusVisible)).toBe(true)
    expect(frames.map((frame) => frame.outline)).not.toContain('solid')
  })
})

it('keeps the focus on its bar for a press on the bar that is on no control', async () => {
  await open()
  const { width } = rectOf(bar())
  await userEvent.click(bar(), { position: { x: width - 6, y: 28 } })
  expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)
  expect(searchbox()).toHaveFocus()
})

describe('with reduced motion', () => {
  useReducedMotion()

  it('opens and closes at once', async () => {
    render(<FocusedSearch layout="full-screen" />)
    press(pageBar().querySelector('input')!)
    const durations = getComputedStyle(modal()).transitionDuration.split(', ').map(parseFloat)
    for (const duration of durations) expect(duration).toBeLessThan(0.001)
  })
})
