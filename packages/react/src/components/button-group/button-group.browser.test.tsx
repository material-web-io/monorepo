import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  button,
  computedColor,
  computedStyleOf,
  Scheme,
  settle,
  useForcedColors,
} from '../../test-browser'
import { Button } from '../button'
import { Icon } from '../icon'
import { ButtonGroup } from './button-group'

/*
 * What needs a real browser and the real stylesheet: the space between the buttons, the
 * widths, and the corners a connected group gives them at rest, pressed and selected, plus
 * focus and forced colors. React Aria's roles, selection and keys are in button-group.test.tsx.
 */

const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

/** The corner of each size, at rest and pressed, in dp: the connected button group tokens. */
const corner = { xs: 8, s: 8, m: 8, l: 16, xl: 20 } as const
const pressed = { xs: 4, s: 4, m: 4, l: 12, xl: 16 } as const

/** The four corner radii of an element, in px: top-left, top-right, bottom-right, bottom-left. */
function corners(el: Element) {
  const style = getComputedStyle(el)
  return [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ].map(parseFloat)
}

const widthOf = (name: string) => button(name).getBoundingClientRect().width
const radio = (name: string) => screen.getByRole('radio', { name })

/** The space between each pair of neighboring buttons, in px. */
function gaps(names: string[]) {
  const rects = names.map((name) => button(name).getBoundingClientRect())
  return rects.slice(1).map((rect, i) => rect.left - rects[i]!.right)
}

describe('ButtonGroup in a browser', () => {
  describe('standard spacing', () => {
    it.each([
      ['xs', 18],
      ['s', 12],
      ['m', 8],
      ['l', 8],
      ['xl', 8],
    ] as const)('spaces the buttons of a %s group %idp apart', (size, gap) => {
      render(
        <Scheme>
          <ButtonGroup size={size}>
            <Button size={size}>One</Button>
            <Button size={size}>Two</Button>
            <Button size={size}>Three</Button>
          </ButtonGroup>
        </Scheme>,
      )
      expect(gaps(['One', 'Two', 'Three'])).toEqual([gap, gap])
    })

    it('is small, so 12dp, without a size', () => {
      render(
        <Scheme>
          <ButtonGroup>
            <Button>One</Button>
            <Button>Two</Button>
          </ButtonGroup>
        </Scheme>,
      )
      expect(gaps(['One', 'Two'])).toEqual([12])
    })

    it('lets a custom class override the default gap', () => {
      render(
        <Scheme>
          <ButtonGroup className="gap-space-400">
            <Button>One</Button>
            <Button>Two</Button>
          </ButtonGroup>
        </Scheme>,
      )
      expect(gaps(['One', 'Two'])[0]).toBeCloseTo(
        parseFloat(computedStyleOf('gap-space-400', (s) => s.columnGap)),
        1,
      )
    })
  })

  describe('connected spacing', () => {
    it.each(sizes)('spaces the buttons of a %s group 2dp apart', (size) => {
      render(
        <Scheme>
          <ButtonGroup variant="connected" size={size}>
            <Button size={size}>One</Button>
            <Button size={size}>Two</Button>
            <Button size={size}>Three</Button>
          </ButtonGroup>
        </Scheme>,
      )
      expect(gaps(['One', 'Two', 'Three'])).toEqual([2, 2])
    })
  })

  it('centers buttons of different heights on the same middle', () => {
    render(
      <Scheme>
        <ButtonGroup size="m">
          <Button size="s">Small</Button>
          <Button size="m">Medium</Button>
        </ButtonGroup>
      </Scheme>,
    )
    const middle = (name: string) => {
      const rect = button(name).getBoundingClientRect()
      return rect.top + rect.height / 2
    }
    expect(middle('Small')).toBe(middle('Medium'))
  })

  describe('width', () => {
    const groupWidth = () =>
      document.querySelector<HTMLElement>('[data-testid=g]')!.getBoundingClientRect().width

    it('makes a standard group as wide as its buttons and the space between them', () => {
      render(
        <Scheme>
          <ButtonGroup data-testid="g">
            <Button>One</Button>
            <Button>Two</Button>
            <Button>Three</Button>
          </ButtonGroup>
        </Scheme>,
      )
      const buttons = ['One', 'Two', 'Three'].map(widthOf)
      expect(groupWidth()).toBeCloseTo(buttons.reduce((a, b) => a + b) + 2 * 12, 1)
    })

    it('makes a connected group span its container, with its buttons filling it', () => {
      render(
        <div style={{ width: 640 }}>
          <Scheme>
            <ButtonGroup variant="connected" data-testid="g">
              <Button>One</Button>
              <Button>Two</Button>
              <Button>Three</Button>
            </ButtonGroup>
          </Scheme>
        </div>,
      )
      // Scheme pads its content by 64px on each side.
      expect(groupWidth()).toBe(640 - 128)
      const buttons = ['One', 'Two', 'Three'].map(widthOf)
      expect(buttons.reduce((a, b) => a + b) + 2 * 2).toBeCloseTo(groupWidth(), 1)
      // Every button grew by the same amount from its own width, so the longer label stays longer.
      expect(buttons[2]).toBeGreaterThan(buttons[0]!)
    })

    it('stays on one line when there is not room for all of it', () => {
      render(
        <div style={{ width: 200 }}>
          <Scheme>
            <ButtonGroup variant="connected" className="w-auto">
              <Button>First option</Button>
              <Button>Second option</Button>
              <Button>Third option</Button>
            </ButtonGroup>
          </Scheme>
        </div>,
      )
      const tops = ['First option', 'Second option', 'Third option'].map(
        (name) => button(name).getBoundingClientRect().top,
      )
      expect(new Set(tops).size).toBe(1)
    })

    it('can be given a maximum width', () => {
      render(
        <div style={{ width: 640 }}>
          <Scheme>
            <ButtonGroup variant="connected" data-testid="g" className="max-w-75">
              <Button>One</Button>
              <Button>Two</Button>
            </ButtonGroup>
          </Scheme>
        </div>,
      )
      expect(groupWidth()).toBe(300)
    })

    it('hugs its buttons instead of filling the container, when given w-auto', () => {
      render(
        <div style={{ width: 640 }}>
          <Scheme>
            <ButtonGroup variant="connected" data-testid="g" className="w-auto">
              <Button>One</Button>
              <Button>Two</Button>
            </ButtonGroup>
          </Scheme>
        </div>,
      )
      expect(groupWidth()).toBeCloseTo(widthOf('One') + widthOf('Two') + 2, 1)
    })

    it.each(['xs', 's'] as const)(
      'makes a button of a connected %s group at least 48dp wide, so the targets do not overlap',
      (size) => {
        render(
          <Scheme>
            <ButtonGroup variant="connected" size={size} className="w-auto">
              <Button size={size} aria-label="One" className="px-space-50">
                <Icon name="add" />
              </Button>
              <Button size={size} aria-label="Two" className="px-space-50">
                <Icon name="add" />
              </Button>
            </ButtonGroup>
            <ButtonGroup variant="connected" size="m" className="w-auto">
              <Button size="m" aria-label="Medium" className="px-space-50">
                <Icon name="add" />
              </Button>
            </ButtonGroup>
          </Scheme>,
        )
        expect(widthOf('One')).toBe(48)
        expect(widthOf('Two')).toBe(48)
        expect(gaps(['One', 'Two'])).toEqual([2])
        // 4dp each side of a 24dp icon.
        expect(widthOf('Medium')).toBe(32)
      },
    )
  })

  describe('connected corners', () => {
    it.each(sizes)(
      'rounds the outer ends of a %s round group fully and gives the inner ones their corner',
      (size) => {
        render(
          <Scheme>
            <ButtonGroup variant="connected" size={size}>
              <Button size={size}>One</Button>
              <Button size={size}>Two</Button>
              <Button size={size}>Three</Button>
            </ButtonGroup>
          </Scheme>,
        )
        const half = button('One').getBoundingClientRect().height / 2
        const c = corner[size]
        expect(corners(button('One'))).toEqual([half, c, c, half])
        expect(corners(button('Two'))).toEqual([c, c, c, c])
        expect(corners(button('Three'))).toEqual([c, half, half, c])
      },
    )

    it.each(sizes)('gives every corner of a %s square group the same corner', (size) => {
      render(
        <Scheme>
          <ButtonGroup variant="connected" shape="square" size={size}>
            <Button size={size}>One</Button>
            <Button size={size}>Two</Button>
            <Button size={size}>Three</Button>
          </ButtonGroup>
        </Scheme>,
      )
      const c = corner[size]
      for (const name of ['One', 'Two', 'Three']) {
        expect(corners(button(name)), name).toEqual([c, c, c, c])
      }
    })

    it('mirrors in a right-to-left layout', () => {
      render(
        <Scheme>
          <div dir="rtl">
            <ButtonGroup variant="connected">
              <Button>One</Button>
              <Button>Two</Button>
            </ButtonGroup>
          </div>
        </Scheme>,
      )
      const half = button('One').getBoundingClientRect().height / 2
      // The first button is now the rightmost one, and its outer end is on the right.
      expect(button('One').getBoundingClientRect().left).toBeGreaterThan(
        button('Two').getBoundingClientRect().left,
      )
      expect(corners(button('One'))).toEqual([8, half, half, 8])
      expect(corners(button('Two'))).toEqual([half, 8, 8, half])
    })

    it('leaves a lone button fully round, or square in a square group', () => {
      render(
        <Scheme>
          <ButtonGroup variant="connected">
            <Button>Round</Button>
          </ButtonGroup>
          <ButtonGroup variant="connected" shape="square">
            <Button>Square</Button>
          </ButtonGroup>
        </Scheme>,
      )
      const half = button('Round').getBoundingClientRect().height / 2
      expect(corners(button('Round'))).toEqual([half, half, half, half])
      expect(corners(button('Square'))).toEqual([8, 8, 8, 8])
    })

    it.each(sizes)(
      'squares only the inner corners of a %s group to their pressed corner while held',
      async (size) => {
        render(
          <Scheme>
            <ButtonGroup variant="connected" size={size}>
              <Button size={size}>One</Button>
              <Button size={size}>Two</Button>
              <Button size={size}>Three</Button>
            </ButtonGroup>
          </Scheme>,
        )
        const half = button('One').getBoundingClientRect().height / 2
        const p = pressed[size]

        for (const [name, expected] of [
          ['One', [half, p, p, half]],
          ['Two', [p, p, p, p]],
          ['Three', [p, half, half, p]],
        ] as const) {
          await commands.holdPress(name)
          await settle()
          expect(corners(button(name)), name).toEqual(expected)
          await commands.releasePress()
          await settle()
          expect(corners(button(name)), `${name} after release`).not.toEqual(expected)
        }
      },
    )

    it.each(['round', 'square'] as const)(
      'makes the selected button of a %s group fully round, and squares it again once another is',
      async (shape) => {
        render(
          <Scheme>
            <ButtonGroup variant="connected" shape={shape} defaultSelectedKeys={['Two']}>
              {['One', 'Two', 'Three'].map((name) => (
                <Button key={name} id={name} variant="tonal" isSelectable>
                  {name}
                </Button>
              ))}
            </ButtonGroup>
          </Scheme>,
        )
        await settle()
        const half = radio('Two').getBoundingClientRect().height / 2
        expect(corners(radio('Two'))).toEqual([half, half, half, half])
        expect(corners(radio('One'))).toEqual(shape === 'round' ? [half, 8, 8, half] : [8, 8, 8, 8])

        await userEvent.click(radio('One'))
        await settle()
        expect(corners(radio('Two'))).toEqual([8, 8, 8, 8])
        expect(corners(radio('One'))).toEqual([half, half, half, half])
      },
    )

    it('still squares the inner corners of a selected button while it is pressed', async () => {
      render(
        <Scheme>
          <ButtonGroup variant="connected" defaultSelectedKeys={['Two']}>
            {['One', 'Two', 'Three'].map((name) => (
              <Button key={name} id={name} variant="tonal" isSelectable>
                {name}
              </Button>
            ))}
          </ButtonGroup>
        </Scheme>,
      )
      await commands.holdPress('Two', 'radio')
      await settle()
      expect(corners(radio('Two'))).toEqual([4, 4, 4, 4])
      await commands.releasePress()
    })

    it('does not touch the corners of a standard group', () => {
      render(
        <Scheme>
          <ButtonGroup>
            <Button>One</Button>
            <Button shape="square">Two</Button>
          </ButtonGroup>
        </Scheme>,
      )
      const half = button('One').getBoundingClientRect().height / 2
      expect(corners(button('One'))).toEqual([half, half, half, half])
      expect(corners(button('Two'))).toEqual([12, 12, 12, 12])
    })
  })

  it('shows the focus ring on a button in the group', async () => {
    render(
      <Scheme>
        <ButtonGroup variant="connected" selectionMode="multiple">
          <Button>One</Button>
          <Button>Two</Button>
        </ButtonGroup>
      </Scheme>,
    )
    await userEvent.tab()
    const ring = getComputedStyle(button('One'))
    expect(ring.outlineStyle).toBe('solid')
    expect(ring.outlineWidth).toBe('3px')
    expect(ring.outlineColor).toBe(computedColor('var(--md-sys-color-secondary)', button('One')))
  })

  describe('forced colors', () => {
    useForcedColors()

    it('keeps the border of every button in a group, since the fill is dropped', () => {
      render(
        <Scheme>
          <ButtonGroup variant="connected" selectionMode="multiple" defaultSelectedKeys={['Two']}>
            <Button id="One" variant="tonal" isSelectable>
              One
            </Button>
            <Button id="Two" variant="tonal" isSelectable>
              Two
            </Button>
          </ButtonGroup>
        </Scheme>,
      )
      for (const name of ['One', 'Two']) {
        const style = getComputedStyle(button(name))
        expect(style.borderTopWidth, name).toBe('1px')
        expect(style.borderTopStyle, name).toBe('solid')
      }
    })
  })
})
