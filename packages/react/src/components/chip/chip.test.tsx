import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, type ReactElement } from 'react'
import { Button, Text } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Icon } from '../icon'
import { Chip, ChipGroup } from '.'

/*
 * Behavior and markup that jsdom can check without a stylesheet: roles, accessible names, DOM
 * structure, the slots, selection, actions and removal. What a class resolves to visually -
 * colors, sizes, padding, the hit areas - needs the real stylesheet: chip.browser.test.tsx.
 */

/** What a chip draws in its gridcell, the ripple left out: its text, and each part by its slot. */
const content = (cell: HTMLElement) =>
  [...cell.childNodes].flatMap((node) =>
    node instanceof Element
      ? node.hasAttribute('slot')
        ? [`${node.getAttribute('slot')}: ${node.textContent}`]
        : []
      : [`text: ${node.textContent}`],
  )

const remove = (
  <Button slot="remove">
    <Icon name="close" />
  </Button>
)

/** Renders a chip alone in a group, to see whether it throws. */
const rendering = (chip: ReactElement) => () =>
  render(<ChipGroup aria-label="Chips">{chip}</ChipGroup>)

describe('ChipGroup', () => {
  it("is React Aria's TagGroup: a div holding its chips in a grid, named by aria-label", () => {
    render(
      <ChipGroup aria-label="Filters">
        <Chip variant="assist" id="a">
          Alpha
        </Chip>
        <Chip variant="assist" id="b">
          Beta
        </Chip>
      </ChipGroup>,
    )
    const grid = screen.getByRole('grid', { name: 'Filters' })
    expect(grid.parentElement).toHaveClass('react-aria-TagGroup')
    expect(screen.getAllByRole('row').map((row) => row.textContent)).toEqual(['Alpha', 'Beta'])
  })

  it("passes className, style, DOM props and the ref to the TagGroup's div", () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <ChipGroup
        aria-label="Filters"
        ref={ref}
        className="mt-4"
        style={{ width: 200 }}
        data-testid="group"
      >
        <Chip variant="assist" id="a">
          Alpha
        </Chip>
      </ChipGroup>,
    )
    const group = screen.getByTestId('group')
    expect(ref.current).toBe(group)
    expect(group).toHaveClass('mt-4')
    expect(group).toHaveStyle({ width: '200px' })
    expect(group).toContainElement(screen.getByRole('grid'))
  })

  it('draws a chip for each of its items with a function of it', () => {
    const items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]
    render(
      <ChipGroup aria-label="Filters" items={items}>
        {(item) => <Chip variant="assist">{item.name}</Chip>}
      </ChipGroup>,
    )
    expect(screen.getAllByRole('row').map((row) => row.textContent)).toEqual(['Alpha', 'Beta'])
  })

  // React Aria puts an empty TagList in the group role, not the grid one.
  it('shows what renderEmptyState returns when it has no chips', () => {
    render(
      <ChipGroup aria-label="Filters" items={[]} renderEmptyState={() => 'No filters'}>
        {(item: { id: string }) => <Chip variant="assist">{item.id}</Chip>}
      </ChipGroup>,
    )
    expect(screen.getByRole('group', { name: 'Filters' })).toHaveTextContent('No filters')
    expect(screen.queryByRole('row')).not.toBeInTheDocument()
  })
})

describe('Chip', () => {
  it('is a row of the grid, its content in a gridcell, named by its label', () => {
    render(
      <ChipGroup aria-label="Actions">
        <Chip variant="assist" id="calendar" textValue="Add to calendar">
          <Icon slot="leading" name="event" />
          Add to calendar
        </Chip>
      </ChipGroup>,
    )
    const row = screen.getByRole('row', { name: 'Add to calendar' })
    expect(row).toContainElement(screen.getByRole('gridcell'))
  })

  describe('slots', () => {
    it('draws its children as given: its text, and what is in its leading and trailing slots', () => {
      render(
        <ChipGroup aria-label="Filters">
          <Chip id="price" variant="filter" textValue="Price">
            <Icon slot="leading" name="check" />
            Price
            <Icon slot="trailing" name="arrow_drop_down" />
          </Chip>
        </ChipGroup>,
      )
      expect(content(screen.getByRole('gridcell'))).toEqual([
        'leading: check',
        'text: Price',
        'trailing: arrow_drop_down',
      ])
    })

    it('takes its label as React Aria’s Text given slot="label", a Text given none as it is', () => {
      render(
        <ChipGroup aria-label="Filters">
          <Chip variant="assist" id="filters" textValue="3 filters">
            <Icon slot="leading" name="tune" />
            <Text slot="label">3 filters</Text>
            <Text>in all</Text>
          </Chip>
        </ChipGroup>,
      )
      expect(content(screen.getByRole('gridcell'))).toEqual(['leading: tune', 'label: 3 filters'])
      expect(screen.getByText('in all')).toBeInTheDocument()
    })

    it('fills its slots from its children given as a function of its state', async () => {
      const user = userEvent.setup()
      render(
        <ChipGroup aria-label="Filters" selectionMode="multiple">
          <Chip id="price" variant="filter" textValue="Price">
            {({ isSelected }) => (
              <>
                {isSelected && <Icon slot="leading" name="check" />}
                Price
              </>
            )}
          </Chip>
        </ChipGroup>,
      )
      expect(content(screen.getByRole('gridcell'))).toEqual(['text: Price'])
      await user.click(screen.getByRole('row'))
      expect(content(screen.getByRole('gridcell'))).toEqual(['leading: check', 'text: Price'])
    })

    it.each([
      ['an Icon', <Icon slot="trailng" name="close" />],
      ['a Text', <Text slot="trailng">Price</Text>],
      [
        'a Button',
        <Button slot="trailng">
          <Icon name="close" />
        </Button>,
      ],
    ])('throws React Aria’s error for %s in a slot it does not have', (_, part) => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(
        rendering(
          <Chip variant="assist" id="price" textValue="Price">
            Price
            {part}
          </Chip>,
        ),
      ).toThrow('Invalid slot "trailng".')
      error.mockRestore()
    })

    it('has the slots of its variant: an input chip leading and remove, the Tag’s remove button’s, a filter chip leading and trailing, an assist or suggestion chip leading alone', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(
        rendering(
          <Chip id="ann" variant="input" textValue="Ann">
            Ann
            <Button slot="trailing">
              <Icon name="close" />
            </Button>
          </Chip>,
        ),
      ).toThrow('Invalid slot "trailing". Valid slot names are "remove".')
      expect(
        rendering(
          <Chip id="ann" variant="input" textValue="Ann">
            Ann
            <Icon slot="trailing" name="close" />
          </Chip>,
        ),
      ).toThrow('Invalid slot "trailing". Valid slot names are "leading".')
      expect(
        rendering(
          <Chip id="price" variant="filter" textValue="Price">
            Price
            <Button slot="remove">
              <Icon name="close" />
            </Button>
          </Chip>,
        ),
      ).toThrow('Invalid slot "remove". Valid slot names are "trailing".')
      expect(
        rendering(
          <Chip id="price" variant="filter" textValue="Price">
            Price
            <Icon slot="remove" name="close" />
          </Chip>,
        ),
      ).toThrow('Invalid slot "remove". Valid slot names are "leading" and "trailing".')
      for (const variant of ['assist', 'suggestion'] as const) {
        expect(
          rendering(
            <Chip id="price" variant={variant} textValue="Price">
              Price
              <Icon slot="trailing" name="close" />
            </Chip>,
          ),
          variant,
        ).toThrow('Invalid slot "trailing". Valid slot names are "leading".')
        // No Button has a slot there, the Tag's remove one included.
        expect(
          rendering(
            <Chip id="price" variant={variant} textValue="Price">
              Price
              <Button slot="trailing">
                <Icon name="close" />
              </Button>
            </Chip>,
          ),
          variant,
        ).toThrow('Invalid slot "trailing".')
        expect(
          rendering(
            <Chip id="price" variant={variant} textValue="Price">
              Price
              <Button slot="remove">
                <Icon name="close" />
              </Button>
            </Chip>,
          ),
          variant,
        ).toThrow('Invalid slot "remove".')
      }
      error.mockRestore()
    })
  })

  it('takes className as a string, or a function of its state given its default class', async () => {
    const user = userEvent.setup()
    render(
      <ChipGroup aria-label="Filters" selectionMode="multiple">
        <Chip variant="assist" id="a" className="ms-4">
          Alpha
        </Chip>
        <Chip
          variant="assist"
          id="b"
          className={({ isSelected, defaultClassName }) =>
            `${defaultClassName} ${isSelected ? 'is-on' : 'is-off'}`
          }
        >
          Beta
        </Chip>
      </ChipGroup>,
    )
    const [alpha, beta] = screen.getAllByRole('row')
    expect(alpha).toHaveClass('chip', 'ms-4')
    expect(beta).toHaveClass('chip', 'react-aria-Tag', 'is-off')
    await user.click(beta!)
    expect(beta).toHaveClass('is-on')
  })

  it('names itself for React Aria by its children when they are a string, else by textValue, which its types then require', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      render(
        <ChipGroup aria-label="Filters">
          <Chip variant="assist" id="text">
            Price
          </Chip>
          <Chip variant="assist" id="parts" textValue="Rating">
            <Icon slot="leading" name="star" />
            Rating
          </Chip>
        </ChipGroup>,
      )
      expect(warn).not.toHaveBeenCalled()
      expect(screen.getAllByRole('row').map((row) => row.getAttribute('aria-label'))).toEqual([
        'Price',
        'Rating',
      ])
      // Without one, React Aria warns, as for its Tag, and the types refuse the chip.
      render(
        <ChipGroup aria-label="More filters">
          {/* @ts-expect-error a chip with parts among its children needs a textValue */}
          <Chip variant="assist" id="unnamed">
            <Icon slot="leading" name="star" />
            Distance
          </Chip>
        </ChipGroup>,
      )
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('`textValue` prop is required'))
    } finally {
      warn.mockRestore()
    }
  })

  it('passes its ref to its row', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <ChipGroup aria-label="Filters">
        <Chip variant="assist" id="price" ref={ref}>
          Price
        </Chip>
      </ChipGroup>,
    )
    expect(ref.current).toBe(screen.getByRole('row'))
  })

  it('draws a ripple, which leaves its name alone', () => {
    render(
      <ChipGroup aria-label="Filters">
        <Chip variant="assist" id="price">
          Price
        </Chip>
      </ChipGroup>,
    )
    expect(screen.getByRole('gridcell').querySelector('.state-layer')).toBeInTheDocument()
    expect(screen.getByRole('row')).toHaveAccessibleName('Price')
  })

  describe('selection', () => {
    it('is selected by its group, by its id: a click, Space or Enter toggles it', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <ChipGroup
          aria-label="Filters"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
        >
          <Chip id="price" variant="filter">
            Price
          </Chip>
          <Chip id="rating" variant="filter">
            Rating
          </Chip>
        </ChipGroup>,
      )
      const [price, rating] = screen.getAllByRole('row')
      await user.click(price!)
      expect(price).toHaveAttribute('aria-selected', 'true')
      expect(price).toHaveAttribute('data-selected', 'true')
      // React Aria's own Set, which tells which key was selected last.
      expect([...onSelectionChange.mock.lastCall![0]]).toEqual(['price'])

      await user.keyboard('{ArrowRight}')
      expect(rating).toHaveFocus()
      await user.keyboard(' ')
      expect([...onSelectionChange.mock.lastCall![0]]).toEqual(['price', 'rating'])
      await user.keyboard('{Enter}')
      expect(rating).toHaveAttribute('aria-selected', 'false')
    })

    it('starts selected from defaultSelectedKeys, or follows selectedKeys', () => {
      const { rerender } = render(
        <ChipGroup aria-label="Filters" selectionMode="single" selectedKeys={['price']}>
          <Chip variant="assist" id="price">
            Price
          </Chip>
          <Chip variant="assist" id="rating">
            Rating
          </Chip>
        </ChipGroup>,
      )
      const [price, rating] = screen.getAllByRole('row')
      expect(price).toHaveAttribute('aria-selected', 'true')
      rerender(
        <ChipGroup aria-label="Filters" selectionMode="single" selectedKeys={['rating']}>
          <Chip variant="assist" id="price">
            Price
          </Chip>
          <Chip variant="assist" id="rating">
            Rating
          </Chip>
        </ChipGroup>,
      )
      expect(price).toHaveAttribute('aria-selected', 'false')
      expect(rating).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('actions', () => {
    it('calls its onAction, and its group onAction with its id, when pressed', async () => {
      const user = userEvent.setup()
      const onAction = vi.fn()
      const onGroupAction = vi.fn()
      render(
        <ChipGroup aria-label="Actions" onAction={onGroupAction}>
          <Chip variant="assist" id="calendar" onAction={onAction}>
            Add to calendar
          </Chip>
        </ChipGroup>,
      )
      await user.click(screen.getByRole('row'))
      expect(onAction).toHaveBeenCalledTimes(1)
      expect(onGroupAction).toHaveBeenCalledWith('calendar')
    })
  })

  describe('removal', () => {
    it("is removed by React Aria's remove Button, named Remove and its label", async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      render(
        <ChipGroup aria-label="Recipients" onRemove={onRemove}>
          <Chip id="ann" variant="input" textValue="Ann">
            Ann
            {remove}
          </Chip>
        </ChipGroup>,
      )
      const button = screen.getByRole('button', { name: 'Remove Ann' })
      expect(screen.getByRole('row')).toHaveAttribute('data-allows-removing', 'true')
      await user.click(button)
      expect(onRemove).toHaveBeenCalledWith(new Set(['ann']))
    })

    it('gives a trailing Button, which a filter chip has in place of remove, only its disabled state: it is yours', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      const onPress = vi.fn()
      render(
        <ChipGroup aria-label="Filters" onRemove={onRemove}>
          <Chip id="price" variant="filter" textValue="Price">
            Price
            <Button slot="trailing" aria-label="Price options" onPress={onPress}>
              <Icon name="arrow_drop_down" />
            </Button>
          </Chip>
          <Chip id="rating" variant="filter" isDisabled textValue="Rating">
            Rating
            <Button slot="trailing" aria-label="Rating options">
              <Icon name="arrow_drop_down" />
            </Button>
          </Chip>
        </ChipGroup>,
      )
      const options = screen.getByRole('button', { name: 'Price options' })
      expect(options).not.toHaveAttribute('aria-labelledby')
      await user.click(options)
      expect(onPress).toHaveBeenCalledOnce()
      expect(onRemove).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Rating options' })).toBeDisabled()
    })

    it('is removed by Backspace or Delete', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      render(
        <ChipGroup aria-label="Recipients" onRemove={onRemove}>
          <Chip id="ann" variant="input">
            Ann
          </Chip>
          <Chip id="bo" variant="input">
            Bo
          </Chip>
        </ChipGroup>,
      )
      await user.tab()
      await user.keyboard('{Backspace}')
      expect(onRemove).toHaveBeenLastCalledWith(new Set(['ann']))
      await user.keyboard('{ArrowRight}{Delete}')
      expect(onRemove).toHaveBeenLastCalledWith(new Set(['bo']))
    })
  })

  describe('disabled', () => {
    it('is disabled by isDisabled or its group disabledKeys, and is neither selected nor removed', async () => {
      const user = userEvent.setup()
      const onSelectionChange = vi.fn()
      render(
        <ChipGroup
          aria-label="Filters"
          selectionMode="multiple"
          disabledKeys={['rating']}
          onSelectionChange={onSelectionChange}
        >
          <Chip variant="assist" id="price" isDisabled>
            Price
          </Chip>
          <Chip variant="assist" id="rating">
            Rating
          </Chip>
        </ChipGroup>,
      )
      for (const row of screen.getAllByRole('row')) {
        expect(row).toHaveAttribute('aria-disabled', 'true')
        expect(row).toHaveAttribute('data-disabled', 'true')
        await user.click(row)
      }
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it('disables its remove button with it', () => {
      render(
        <ChipGroup aria-label="Recipients" onRemove={() => {}}>
          <Chip id="ann" variant="input" isDisabled textValue="Ann">
            Ann
            {remove}
          </Chip>
        </ChipGroup>,
      )
      expect(screen.getByRole('button', { name: 'Remove Ann' })).toBeDisabled()
    })
  })
})
