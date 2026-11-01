import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import {
  computedColor,
  computedRadius,
  computedStyleOf,
  contrastRatio,
  expectHitArea,
  press,
  rgba,
  Scheme,
  schemes,
  settle,
  useForcedColors,
} from '../../test-browser'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'
import { Fab } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { Toolbar, type ToolbarProps } from './toolbar'

/* What needs a real browser and stylesheet: each variant's size, fill, shape and elevation, where
 * its elements sit, a group's inset, the colors it gives the toggles in it, contrast, the ring an
 * arrow key brings, forced colors. Markup and keys: toolbar.test.tsx. */

type Color = NonNullable<ToolbarProps['color']>

const toolbar = () => screen.getByRole('toolbar')
const toolbars = () => screen.getAllByRole('toolbar')
const button = (name: string) => screen.getByRole('button', { name })
const radio = (name: string) => screen.getByRole('radio', { name })
const rectOf = (el: Element) => el.getBoundingClientRect()
const centerX = (el: Element) => rectOf(el).left + rectOf(el).width / 2
const centerY = (el: Element) => rectOf(el).top + rectOf(el).height / 2
const token = (role: string, within: Element) =>
  computedColor(`var(--md-sys-color-${role})`, within)
/** A role at a state's opacity, as the browser computes the mix. */
const faded = (role: string, opacity: number, within: Element) =>
  computedColor(`color-mix(in oklab, var(--md-sys-color-${role}) ${opacity}%, transparent)`, within)
/** Whether a box shadow draws anything: Tailwind's none is a stack of zero-size shadows. */
const drawsShadow = (el: Element) => /[1-9]\d*px/.test(getComputedStyle(el).boxShadow)

const names = ['Archive', 'Delete', 'Unread', 'Snooze', 'Star'] as const

/** Standard icon buttons, 40dp each, one per name. */
const actions = (labels: readonly string[] = names, disabled?: string) =>
  labels.map((name) => (
    <IconButton key={name} aria-label={name} isDisabled={name === disabled}>
      <Icon name="star" />
    </IconButton>
  ))

/** Icon toggles, each with an `id` for the ButtonGroup they are in. */
const toggles = (labels: readonly string[]) =>
  labels.map((name) => (
    <IconButton key={name} id={name} aria-label={name} isSelectable>
      <Icon name="star" />
    </IconButton>
  ))

/** Icon toggles of two styles and icon buttons that are no toggles. */
const kinds = (
  <>
    <IconButton aria-label="off" isSelectable isSelected={false}>
      <Icon name="star" />
    </IconButton>
    <IconButton aria-label="on" isSelectable isSelected>
      <Icon name="star" />
    </IconButton>
    <IconButton aria-label="disabled" isSelectable isSelected={false} isDisabled>
      <Icon name="star" />
    </IconButton>
    <IconButton aria-label="on and disabled" isSelectable isSelected isDisabled>
      <Icon name="star" />
    </IconButton>
    <IconButton aria-label="filled off" variant="filled" isSelectable isSelected={false}>
      <Icon name="star" />
    </IconButton>
    <IconButton aria-label="filled on" variant="filled" isSelectable isSelected>
      <Icon name="star" />
    </IconButton>
    <IconButton aria-label="filled" variant="filled">
      <Icon name="star" />
    </IconButton>
    <IconButton aria-label="tonal" variant="tonal">
      <Icon name="star" />
    </IconButton>
  </>
)

/** Toggles with labels of two styles and buttons that are no toggles. */
const labels = (
  <>
    <Button variant="tonal" isSelectable isSelected>
      <Icon name="image" />
      Photos
    </Button>
    <Button variant="tonal" isSelectable isSelected={false}>
      Memories
    </Button>
    <Button variant="tonal" isSelectable isSelected={false} isDisabled>
      Library
    </Button>
    <Button variant="tonal" isSelectable isSelected isDisabled>
      Shared
    </Button>
    <Button variant="outlined" isSelectable isSelected={false}>
      Outlined off
    </Button>
    <Button variant="outlined" isSelectable isSelected>
      Outlined on
    </Button>
    <Button variant="outlined" isSelectable isSelected isDisabled>
      Outlined on and disabled
    </Button>
    <Button variant="tonal">Tonal</Button>
    <Button variant="text">Back</Button>
    <Button>Next</Button>
  </>
)

// What the token sets "Toolbar - Color - Standard" and "- Vibrant" give each scheme: the
// container, an icon on it, and a selected button's container and icon.
const roles: Record<Color, Record<'container' | 'icon' | 'selected' | 'onSelected', string>> = {
  standard: {
    container: 'surface-container',
    icon: 'on-surface-variant',
    selected: 'secondary-container',
    onSelected: 'on-secondary-container',
  },
  vibrant: {
    container: 'primary-container',
    icon: 'on-primary-container',
    selected: 'surface-container',
    onSelected: 'on-surface',
  },
}

const colors = ['standard', 'vibrant'] as const

describe('a docked Toolbar (browser)', () => {
  describe('the container', () => {
    it.each(colors)(
      'is 64dp tall across its parent, square and with no shadow, in the %s fill',
      (color) => {
        render(
          <Scheme>
            <div style={{ width: 412 }}>
              <Toolbar aria-label="Message" color={color}>
                {actions()}
              </Toolbar>
            </div>
          </Scheme>,
        )
        expect(rectOf(toolbar()).width).toBe(412)
        expect(rectOf(toolbar()).height).toBe(64)
        const style = getComputedStyle(toolbar())
        expect(style.backgroundColor).toBe(token(roles[color].container, toolbar()))
        expect(style.color).toBe(token(roles[color].icon, toolbar()))
        expect(drawsShadow(toolbar())).toBe(false)
        expect(style.borderTopLeftRadius).toBe('0px')
      },
    )

    it('grows with what it holds, and is 64dp tall with nothing in it', () => {
      render(
        <Scheme>
          <div style={{ width: 412 }}>
            <Toolbar aria-label="Empty" />
            <Toolbar aria-label="Tall">
              <div style={{ width: 96, height: 96 }} />
            </Toolbar>
          </div>
        </Scheme>,
      )
      const [empty, tall] = toolbars()
      expect(rectOf(empty!).height).toBe(64)
      expect(rectOf(tall!).height).toBe(96)
    })
  })

  describe('its elements', () => {
    it('are evenly spaced, each in a 48dp target, the first and the last 16dp from the ends', () => {
      render(
        <Scheme>
          <div style={{ width: 412 }}>
            <Toolbar aria-label="Message">{actions()}</Toolbar>
          </div>
        </Scheme>,
      )
      const { left, right } = rectOf(toolbar())
      // 412 less the two 16dp ends and five 48dp targets leaves four gaps of 35dp.
      names.forEach((name, index) => {
        expect(rectOf(button(name)).width).toBe(40)
        expect(rectOf(button(name)).height).toBe(40)
        expect(centerX(button(name)) - left).toBeCloseTo(16 + 24 + index * 83, 1)
        expect(centerY(button(name))).toBeCloseTo(centerY(toolbar()), 1)
      })
      expect(right - centerX(button('Star'))).toBeCloseTo(40, 1)
    })

    it('are one at each end when there are two, whatever their widths', () => {
      render(
        <Scheme>
          <div style={{ width: 412 }}>
            <Toolbar aria-label="Steps">
              <Button variant="text">Back</Button>
              <Button>Next</Button>
            </Toolbar>
          </div>
        </Scheme>,
      )
      expect(rectOf(button('Back')).left - rectOf(toolbar()).left).toBeCloseTo(16, 1)
      expect(rectOf(toolbar()).right - rectOf(button('Next')).right).toBeCloseTo(16, 1)
      expect(rectOf(button('Back')).height).toBe(40)
    })

    it('are never less than 4dp apart', () => {
      // Five 48dp targets, four 4dp gaps and the two ends are 288dp: nothing is left over.
      render(
        <Scheme>
          <div style={{ width: 288 }}>
            <Toolbar aria-label="Message">{actions()}</Toolbar>
          </div>
        </Scheme>,
      )
      names.forEach((name, index) => {
        expect(centerX(button(name)) - rectOf(toolbar()).left).toBeCloseTo(40 + index * 52, 1)
      })
      expect(toolbar().scrollWidth).toBe(toolbar().clientWidth)
    })

    it('are spaced as its class says: centered and 32dp apart', () => {
      render(
        <Scheme>
          <div style={{ width: 840 }}>
            <Toolbar aria-label="Message" className="justify-center gap-x-space-400">
              {actions()}
            </Toolbar>
          </div>
        </Scheme>,
      )
      // Five 48dp targets and four 32dp gaps are 368dp, in the middle of 840.
      names.forEach((name, index) => {
        expect(centerX(button(name)) - rectOf(toolbar()).left).toBeCloseTo(
          (840 - 368) / 2 + 24 + index * 80,
          1,
        )
      })
    })

    it('have a hit area of 48dp, which none of them shares', () => {
      render(
        <Scheme>
          <div style={{ width: 288 }}>
            <Toolbar aria-label="Message">{actions()}</Toolbar>
          </div>
        </Scheme>,
      )
      for (const name of names) expectHitArea(button(name))
    })
  })
})

describe('a floating Toolbar (browser)', () => {
  describe('the container', () => {
    it.each(colors)(
      'is a 64dp pill around its elements, on elevation level 2, in the %s fill',
      (color) => {
        render(
          <Scheme>
            <Toolbar variant="floating" aria-label="Message" color={color}>
              {actions(names.slice(0, 4))}
            </Toolbar>
          </Scheme>,
        )
        // Four 48dp targets 4dp apart, 8dp from the edge all around.
        expect(rectOf(toolbar()).width).toBe(8 + 4 * 48 + 3 * 4 + 8)
        expect(rectOf(toolbar()).height).toBe(64)
        const style = getComputedStyle(toolbar())
        expect(style.backgroundColor).toBe(token(roles[color].container, toolbar()))
        expect(style.color).toBe(token(roles[color].icon, toolbar()))
        expect(style.borderRadius).toBe(computedRadius('rounded-shape-full'))
        expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(32)
        expect(style.boxShadow).toBe(
          computedStyleOf('shadow-elevation-2', (probe) => probe.boxShadow),
        )
      },
    )

    it('is as wide as an element wider than its target needs', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Browser" color="vibrant">
            {actions(['Back', 'Forward'])}
            <IconButton aria-label="New tab" variant="filled" width="wide">
              <Icon name="add" />
            </IconButton>
            {actions(['Tabs', 'More'])}
          </Toolbar>
        </Scheme>,
      )
      // The measurement the specs draw: four 48dp targets and a 52dp button, 276dp.
      expect(rectOf(button('New tab')).width).toBe(52)
      expect(rectOf(toolbar()).width).toBe(8 + 4 * 48 + 52 + 4 * 4 + 8)
      expect(rectOf(button('New tab')).left - rectOf(button('Forward')).right).toBe(8)
      expect(rectOf(button('Tabs')).left - rectOf(button('New tab')).right).toBe(8)
    })

    it('has no shadow when its class takes it away', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Message" className="shadow-none">
            {actions()}
          </Toolbar>
        </Scheme>,
      )
      expect(drawsShadow(toolbar())).toBe(false)
    })
  })

  describe('its elements', () => {
    it('are in a row, 8dp from the edge and 4dp apart, each in a 48dp target', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Message">
            {actions()}
          </Toolbar>
        </Scheme>,
      )
      names.forEach((name, index) => {
        expect(rectOf(button(name)).width).toBe(40)
        expect(centerX(button(name)) - rectOf(toolbar()).left).toBe(8 + 24 + index * 52)
        expect(centerY(button(name))).toBe(centerY(toolbar()))
      })
    })

    it('are in a column when it is vertical, 64dp wide', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Message" orientation="vertical">
            {actions()}
          </Toolbar>
        </Scheme>,
      )
      expect(rectOf(toolbar()).width).toBe(64)
      expect(rectOf(toolbar()).height).toBe(8 + 5 * 48 + 4 * 4 + 8)
      names.forEach((name, index) => {
        expect(centerY(button(name)) - rectOf(toolbar()).top).toBe(8 + 24 + index * 52)
        expect(centerX(button(name))).toBe(centerX(toolbar()))
      })
    })

    it('have a hit area of 48dp, which none of them shares', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Message">
            {actions()}
          </Toolbar>
        </Scheme>,
      )
      for (const name of names) expectHitArea(button(name))
    })
  })

  describe('a group in it', () => {
    it('is set 4dp in, so its buttons stand 12dp from the ends and from the next element, as one in a target does', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Formatting">
            <ButtonGroup aria-label="Text style" selectionMode="multiple">
              {toggles(['Bold', 'Italic', 'Underline'])}
            </ButtonGroup>
            {actions(['More'])}
          </Toolbar>
        </Scheme>,
      )
      const pill = rectOf(toolbar())
      const [bold, italic, underline, more] = ['Bold', 'Italic', 'Underline', 'More'].map((name) =>
        rectOf(button(name)),
      )
      // As wide as four buttons in targets: the group's 12dp between them is a target's 52dp pitch.
      expect(pill.width).toBe(8 + 4 * 48 + 3 * 4 + 8)
      expect(bold!.left - pill.left).toBe(12)
      expect(italic!.left - bold!.right).toBe(12)
      expect(underline!.left - italic!.right).toBe(12)
      expect(more!.left - underline!.right).toBe(12)
      expect(pill.right - more!.right).toBe(12)
      for (const name of ['Bold', 'Italic', 'Underline', 'More']) expectHitArea(button(name))
    })

    it('is set 4dp in from the top and the bottom of a vertical toolbar', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Formatting" orientation="vertical">
            <ButtonGroup
              aria-label="Text style"
              selectionMode="multiple"
              orientation="vertical"
              className="flex-col"
            >
              {toggles(['Bold', 'Italic'])}
            </ButtonGroup>
            {actions(['More'])}
          </Toolbar>
        </Scheme>,
      )
      const pill = rectOf(toolbar())
      expect(pill.width).toBe(64)
      expect(rectOf(button('Bold')).top - pill.top).toBe(12)
      expect(rectOf(button('More')).top - rectOf(button('Italic')).bottom).toBe(12)
      expect(pill.bottom - rectOf(button('More')).bottom).toBe(12)
      expect(getComputedStyle(screen.getByRole('group')).marginInlineStart).toBe('0px')
    })

    it('of buttons with labels 4dp apart stands them 12dp from the pill at its ends, as they are from its sides', () => {
      render(
        <Scheme>
          <Toolbar variant="floating" aria-label="Pages">
            <ButtonGroup
              aria-label="Page"
              defaultSelectedKeys={['Photos']}
              className="gap-space-50"
            >
              {['Photos', 'Memories', 'Library'].map((name) => (
                <Button key={name} id={name} variant="tonal" isSelectable>
                  {name}
                </Button>
              ))}
            </ButtonGroup>
          </Toolbar>
        </Scheme>,
      )
      const pill = rectOf(toolbar())
      const [photos, memories, library] = ['Photos', 'Memories', 'Library'].map((name) =>
        rectOf(radio(name)),
      )
      expect(pill.height).toBe(64)
      for (const rect of [photos!, memories!, library!]) {
        expect(rect.height).toBe(40)
        expect(rect.top - pill.top).toBe(12)
      }
      expect(photos!.left - pill.left).toBeCloseTo(12, 1)
      expect(memories!.left - photos!.right).toBeCloseTo(4, 1)
      expect(library!.left - memories!.right).toBeCloseTo(4, 1)
      expect(pill.right - library!.right).toBeCloseTo(12, 1)
    })
  })

  it('has a FAB beside it where the two are put side by side, 8dp apart', () => {
    render(
      <Scheme>
        <div className="flex items-center gap-space-100">
          <Toolbar variant="floating" aria-label="Message">
            {actions(names.slice(0, 4))}
          </Toolbar>
          <Fab aria-label="Compose" color="secondary-container">
            <Icon name="add" />
          </Fab>
        </div>
      </Scheme>,
    )
    const fab = button('Compose')
    expect(rectOf(fab).left - rectOf(toolbar()).right).toBe(8)
    expect(rectOf(fab).width).toBe(56)
    expect(rectOf(fab).height).toBe(56)
    expect(centerY(fab)).toBe(centerY(toolbar()))
    expect(getComputedStyle(fab).backgroundColor).toBe(token('secondary-container', fab))
  })
})

describe.each(['docked', 'floating'] as const)('a toggle in a %s Toolbar (browser)', (variant) => {
  describe.each(colors)('%s', (color) => {
    const role = roles[color]

    /** The toolbar of the variant and the color, holding what it is given. */
    const draw = (children: ReactNode, theme?: 'light' | 'dark', contrast?: string) =>
      render(
        <Scheme theme={theme} contrast={contrast as 'standard' | 'medium' | 'high' | undefined}>
          <Toolbar variant={variant} color={color} aria-label="Kinds">
            {children}
          </Toolbar>
        </Scheme>,
      )

    it('is flat in the toolbar’s icon color when not selected, whatever its style', () => {
      draw(
        <>
          {kinds}
          {labels}
        </>,
      )
      for (const name of ['off', 'filled off', 'Memories', 'Outlined off']) {
        const style = getComputedStyle(button(name))
        expect(style.color, name).toBe(token(role.icon, toolbar()))
        expect(rgba(style.backgroundColor)[3], name).toBe(0)
        expect(drawsShadow(button(name)), name).toBe(false)
      }
    })

    it('has a container of the toolbar’s own and the content that goes on it when selected', () => {
      draw(
        <>
          {kinds}
          {labels}
        </>,
      )
      for (const name of ['on', 'filled on', 'Photos', 'Outlined on']) {
        const style = getComputedStyle(button(name))
        expect(style.backgroundColor, name).toBe(token(role.selected, toolbar()))
        expect(style.color, name).toBe(token(role.onSelected, toolbar()))
      }
    })

    it('keeps its round shape when selected', () => {
      draw(
        <>
          {kinds}
          {labels}
        </>,
      )
      // 40dp tall: round is a corner of 20dp or more, which the browser draws as 20.
      for (const name of ['on', 'filled on', 'Photos', 'Outlined on'])
        expect(
          parseFloat(getComputedStyle(button(name)).borderTopLeftRadius),
          name,
        ).toBeGreaterThanOrEqual(20)
    })

    it('stays round every frame of the way back when unselected', async () => {
      draw(
        <>
          <IconButton aria-label="Star" isSelectable defaultSelected>
            <Icon name="star" />
          </IconButton>
          <Button variant="tonal" isSelectable defaultSelected>
            Photos
          </Button>
        </>,
      )
      for (const name of ['Star', 'Photos']) {
        const el = button(name)
        // Pressed in the page: the runner's answer can come after the corner's spring is over.
        press(el)
        expect(el).not.toHaveAttribute('data-selected')
        // The corner's transition, paused and stepped through: its spring overshoots on the way back.
        const corner = el
          .getAnimations()
          .find((each) => (each as CSSTransition).transitionProperty === 'border-top-left-radius')
        expect(corner, name).toBeDefined()
        corner!.pause()
        const duration = Number(corner!.effect!.getTiming().duration)
        const radii = Array.from({ length: 51 }, (_, step) => {
          corner!.currentTime = (duration * step) / 50
          return parseFloat(getComputedStyle(el).borderTopLeftRadius)
        })
        expect(Math.min(...radii), name).toBeGreaterThan(rectOf(el).height / 2 - 1)
      }
    })

    it('is the toolbar’s icon color at 38% with no container when disabled, selected or not', () => {
      draw(
        <>
          {kinds}
          {labels}
        </>,
      )
      for (const name of [
        'disabled',
        'on and disabled',
        'Library',
        'Shared',
        'Outlined on and disabled',
      ]) {
        const style = getComputedStyle(button(name))
        expect(style.color, name).toBe(faded(role.icon, 38, toolbar()))
        expect(rgba(style.backgroundColor)[3], name).toBe(0)
      }
    })

    it('has no shadow, hovered or not', async () => {
      draw(labels)
      for (const name of ['Memories', 'Photos']) {
        await userEvent.hover(button(name))
        await settle()
        expect(drawsShadow(button(name)), name).toBe(false)
      }
      await userEvent.unhover(button('Photos'))
    })

    it('shows its state layer in its content color when hovered', async () => {
      draw(kinds)
      for (const [name, content] of [
        ['off', role.icon],
        ['on', role.onSelected],
      ] as const) {
        await userEvent.hover(button(name))
        await settle()
        const layer = button(name).querySelector<HTMLElement>('.state-layer')!
        expect(getComputedStyle(layer).backgroundColor).toBe(token(content, toolbar()))
        expect(Number(getComputedStyle(layer).opacity)).toBeCloseTo(0.08, 5)
      }
      await userEvent.unhover(button('on'))
    })

    it('is drawn in a group in the toolbar too, a radio of a single-select one', () => {
      draw(
        <ButtonGroup aria-label="Page" defaultSelectedKeys={['Photos']}>
          <Button id="Photos" variant="tonal" isSelectable>
            Photos
          </Button>
          <Button id="Memories" variant="tonal" isSelectable>
            Memories
          </Button>
        </ButtonGroup>,
      )
      const on = getComputedStyle(radio('Photos'))
      expect(on.backgroundColor).toBe(token(role.selected, toolbar()))
      expect(on.color).toBe(token(role.onSelected, toolbar()))
      const off = getComputedStyle(radio('Memories'))
      expect(off.color).toBe(token(role.icon, toolbar()))
      expect(rgba(off.backgroundColor)[3]).toBe(0)
    })

    it('leaves a button that is no toggle the colors of its own style', () => {
      draw(
        <>
          {kinds}
          {labels}
        </>,
      )
      for (const [name, container, content] of [
        ['filled', 'primary', 'on-primary'],
        ['tonal', 'secondary-container', 'on-secondary-container'],
        ['Tonal', 'secondary-container', 'on-secondary-container'],
        ['Next', 'primary', 'on-primary'],
      ] as const) {
        const style = getComputedStyle(button(name))
        expect(style.backgroundColor, name).toBe(token(container, toolbar()))
        expect(style.color, name).toBe(token(content, toolbar()))
      }
      const text = getComputedStyle(button('Back'))
      expect(text.color).toBe(token('primary', toolbar()))
      expect(rgba(text.backgroundColor)[3]).toBe(0)
    })

    it.each(schemes)(
      'keeps its content at 3:1 or more against what it is on, its label at 4.5:1, %s scheme, %s contrast',
      (theme, contrast) => {
        draw(
          <>
            {kinds}
            {labels}
          </>,
          theme,
          contrast,
        )
        const container = getComputedStyle(toolbar()).backgroundColor
        const off = contrastRatio(getComputedStyle(button('off')).color, container)
        expect(off, 'off').toBeGreaterThanOrEqual(3)
        const on = getComputedStyle(button('on'))
        expect(contrastRatio(on.color, on.backgroundColor), 'on').toBeGreaterThanOrEqual(3)
        const memories = contrastRatio(getComputedStyle(button('Memories')).color, container)
        expect(memories, 'Memories').toBeGreaterThanOrEqual(4.5)
        const photos = getComputedStyle(button('Photos'))
        expect(
          contrastRatio(photos.color, photos.backgroundColor),
          'Photos',
        ).toBeGreaterThanOrEqual(4.5)
      },
    )
  })
})

describe('a toggle out of a Toolbar (browser)', () => {
  it('is the toggle it is anywhere when a portal takes it out of the toolbar it is written in', () => {
    // A menu's panel is such a portal: a surface of its own.
    function Portaled() {
      return createPortal(
        <Button variant="tonal" isSelectable isSelected>
          Starred
        </Button>,
        document.body,
      )
    }
    render(
      <Scheme>
        <Toolbar color="vibrant" aria-label="Message">
          <Portaled />
        </Toolbar>
      </Scheme>,
    )
    const starred = button('Starred')
    expect(toolbar().contains(starred)).toBe(false)
    const style = getComputedStyle(starred)
    expect(style.backgroundColor).toBe(token('secondary', starred))
    expect(style.color).toBe(token('on-secondary', starred))
    // Square, as a round toggle is when selected.
    expect(parseFloat(style.borderTopLeftRadius)).toBe(12)
  })
})

it('gives the focus ring to the element an arrow key moves the focus to', async () => {
  render(
    <Scheme>
      <Toolbar aria-label="Message">{actions()}</Toolbar>
    </Scheme>,
  )
  await userEvent.tab()
  expect(document.activeElement).toBe(button('Archive'))
  await userEvent.keyboard('{ArrowRight}')
  expect(document.activeElement).toBe(button('Delete'))
  await settle()
  const style = getComputedStyle(button('Delete'))
  expect(style.outlineStyle).toBe('solid')
  expect(style.outlineWidth).toBe('3px')
  expect(style.outlineColor).toBe(token('secondary', toolbar()))
  expect(getComputedStyle(button('Archive')).outlineStyle).toBe('none')
})

describe('forced colors', () => {
  useForcedColors()

  it('outlines a floating toolbar, which has lost its fill and its shadow', () => {
    render(
      <Scheme>
        <Toolbar variant="floating" aria-label="Message">
          {actions()}
        </Toolbar>
      </Scheme>,
    )
    const style = getComputedStyle(toolbar())
    expect(style.borderTopStyle).toBe('solid')
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopColor).toBe(computedColor('ButtonText', toolbar()))
  })

  it('fills a selected toggle in it with the highlight, as it is anywhere', () => {
    render(
      <Scheme>
        <Toolbar variant="floating" aria-label="Kinds">
          {kinds}
          {labels}
        </Toolbar>
      </Scheme>,
    )
    for (const name of ['on', 'Photos']) {
      const style = getComputedStyle(button(name))
      expect(style.backgroundColor, name).toBe(computedColor('Highlight', toolbar()))
      expect(style.color, name).toBe(computedColor('HighlightText', toolbar()))
    }
  })
})
