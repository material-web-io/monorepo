import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../button'
import { ButtonGroup } from './button-group'

/*
 * Behavior and markup that jsdom can check without a stylesheet: React Aria's roles, selection
 * and keyboard. What the classes resolve to - gaps, corners, widths - is in the browser tests.
 */

// Our Button is React Aria's ToggleButton only given `isSelectable`; in a group, with an `id`, the
// group's selection is the one it shows.
function Choices(props: Parameters<typeof ButtonGroup>[0]) {
  return (
    <ButtonGroup aria-label="View" {...props}>
      {['Day', 'Week', 'Month'].map((name) => (
        <Button key={name} id={name} isSelectable>
          {name}
        </Button>
      ))}
    </ButtonGroup>
  )
}

describe('ButtonGroup', () => {
  it('is a named radiogroup of radios with single selection, its default', async () => {
    const user = userEvent.setup()
    render(<Choices defaultSelectedKeys={['Week']} />)
    const group = screen.getByRole('radiogroup', { name: 'View' })
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(group).toContainElement(screen.getByRole('radio', { name: 'Week', checked: true }))

    await user.click(screen.getByRole('radio', { name: 'Month' }))
    expect(screen.getByRole('radio', { name: 'Month' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Week' })).not.toBeChecked()
  })

  it('is a toolbar of pressed buttons with multiple selection', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(
      <Choices
        selectionMode="multiple"
        defaultSelectedKeys={['Day']}
        onSelectionChange={onSelectionChange}
      />,
    )
    expect(screen.getByRole('toolbar', { name: 'View' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Month' }))
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true')
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['Day', 'Month']))
  })

  it('follows selectedKeys when controlled', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    render(<Choices selectedKeys={['Day']} onSelectionChange={onSelectionChange} />)
    await user.click(screen.getByRole('radio', { name: 'Week' }))
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['Week']))
    expect(screen.getByRole('radio', { name: 'Day' })).toBeChecked()
  })

  it('moves between the buttons with the arrow keys, and Tab leaves the group', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Choices />
        <button>After</button>
      </>,
    )
    await user.tab()
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  it('disables every button when disabled', () => {
    render(<Choices isDisabled />)
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled()
  })

  it('leaves a pending button unselected when pressed, and the others selectable', async () => {
    const user = userEvent.setup()
    render(
      <ButtonGroup aria-label="View" defaultSelectedKeys={['Day']}>
        <Button id="Day" isSelectable>
          Day
        </Button>
        <Button id="Week" isSelectable isPending>
          Week
        </Button>
        <Button id="Month" isSelectable>
          Month
        </Button>
      </ButtonGroup>,
    )
    const week = screen.getByRole('radio', { name: 'Week' })
    await user.click(week)
    expect(week).not.toBeChecked()
    expect(week).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('radio', { name: 'Day' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'Month' }))
    expect(screen.getByRole('radio', { name: 'Month' })).toBeChecked()
  })

  it('holds plain buttons as they are', async () => {
    const user = userEvent.setup()
    const onPress = vi.fn()
    render(
      <ButtonGroup aria-label="Actions" selectionMode="multiple">
        <Button onPress={onPress}>Save</Button>
      </ButtonGroup>,
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute('aria-pressed')
  })

  it("keeps React Aria's class, merges a custom one and forwards the ref", () => {
    let ref: HTMLDivElement | null = null
    render(
      <>
        <Choices
          data-testid="string"
          className="gap-space-400"
          ref={(node) => {
            ref = node
          }}
        />
        <Choices
          data-testid="function"
          isDisabled
          className={({ defaultClassName, isDisabled }) =>
            `${defaultClassName} ${isDisabled ? 'opacity-50' : ''}`
          }
        />
      </>,
    )
    const group = screen.getByTestId('string')
    expect(ref).toBe(group)
    expect(group).toHaveClass('gap-space-400')
    expect(group).not.toHaveClass('gap-space-150')
    expect(screen.getByTestId('function')).toHaveClass('react-aria-ToggleButtonGroup', 'opacity-50')
  })
})
