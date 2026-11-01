import { render, screen, within } from '@testing-library/react'
import { Text } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import {
  computedColor,
  contrastRatio,
  expectHitArea,
  rgba,
  Scheme,
  schemeOf,
  schemes,
  settle,
  springDuration,
  springEasing,
  useForcedColors,
} from '../../test-browser'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { Chip, ChipGroup } from '.'

/*
 * Everything that needs a real browser and the real stylesheet: sizes and padding against the
 * specs' measurements, colors in every scheme, the states, the 48dp targets, forced colors and
 * motion. Behavior jsdom can check - roles, names, selection, removal - is in chip.test.tsx.
 */

const variants = ['assist', 'filter', 'input', 'suggestion'] as const

// An avatar image, drawn 24dp whatever its own size.
const avatar = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="teal"/></svg>',
)}`

const remove = (
  <IconButton slot="remove" aria-label="Remove">
    <Icon name="close" />
  </IconButton>
)

/** What ends a chip of a variant: an input chip its remove button, a filter chip a close icon. */
const close = (variant: (typeof variants)[number]) =>
  variant === 'input' ? remove : variant === 'filter' ? <Icon slot="trailing" name="close" /> : null

/** A color role, as the browser computes it where `el` is. */
const role = (name: string, el: Element) => computedColor(`var(--md-sys-color-${name})`, el)

/** A color role at an opacity, mixed as Tailwind's opacity modifier mixes it. */
const roleAt = (name: string, percent: number, el: Element) =>
  computedColor(`color-mix(in oklab, var(--md-sys-color-${name}) ${percent}%, transparent)`, el)

/** The shadow of an elevation level, as the browser computes it where `el` is. */
function elevation(level: number, el: Element) {
  const probe = document.createElement('div')
  probe.style.boxShadow = `var(--md-sys-elevation-level${level})`
  schemeOf(el).append(probe)
  const shadow = getComputedStyle(probe).boxShadow
  probe.remove()
  return shadow
}

/** An element's box-shadow, apart: the inset ring (Tailwind's inset-ring) and the visible shadows. */
function shadowOf(el: Element) {
  const layers = getComputedStyle(el)
    .boxShadow.split(/,(?![^(]*\))/)
    .map((layer) => layer.trim())
  const colorOf = (layer: string) => /^(.*?) -?\d+(?:\.\d+)?px/.exec(layer)?.[1] ?? 'transparent'
  const ring = layers.find((layer) => layer.endsWith('inset'))
  return {
    ringWidth: Number(/(\d+(?:\.\d+)?)px inset$/.exec(ring ?? '')?.[1] ?? 0),
    ringColor: ring ? colorOf(ring) : undefined,
    shadow: layers
      .filter((layer) => !layer.endsWith('inset') && rgba(colorOf(layer))[3] > 0)
      .join(', '),
  }
}

/** The box of an element's own text, where a label is drawn: a Text label's, or a gridcell's. */
function textBox(el: Element) {
  const texts = [...el.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)
  const range = document.createRange()
  range.setStartBefore(texts[0]!)
  range.setEndAfter(texts.at(-1)!)
  return range.getBoundingClientRect()
}

/** The chip with this label, its icon or image with this text or role, and their boxes. */
const chip = (label: string) => screen.getByRole('row', { name: label })
const rect = (el: Element) => el.getBoundingClientRect()

describe('Chip', () => {
  describe('size', () => {
    it('is 32dp tall, with 8dp corners, its label in the label large type', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips">
            {variants.map((variant) => (
              <Chip key={variant} id={variant} variant={variant}>
                {variant}
              </Chip>
            ))}
          </ChipGroup>
        </Scheme>,
      )
      for (const variant of variants) {
        const style = getComputedStyle(chip(variant))
        expect(rect(chip(variant)).height, variant).toBe(32)
        expect(style.borderRadius, variant).toBe('8px')
        expect(style.fontSize, variant).toBe('14px')
        expect(style.lineHeight, variant).toBe('20px')
        expect(style.fontWeight, variant).toBe('500')
        expect(style.letterSpacing, variant).toBe('0.1px')
      }
    })

    it.each(['assist', 'filter', 'suggestion'] as const)(
      'pads a %s chip 16dp beside its label, and 8dp beside an icon, 8dp from the label',
      (variant) => {
        render(
          <Scheme>
            <ChipGroup aria-label="Chips">
              <Chip id="plain" variant={variant}>
                Plain label
              </Chip>
              <Chip id="leading" variant={variant} textValue="Leading icon">
                <Icon slot="leading" name="event" />
                Leading icon
              </Chip>
            </ChipGroup>
          </Scheme>,
        )
        const plain = rect(chip('Plain label'))
        const plainText = textBox(screen.getByText('Plain label'))
        expect(plainText.left - plain.left).toBeCloseTo(16, 1)
        expect(plain.right - plainText.right).toBeCloseTo(16, 1)

        const leading = rect(chip('Leading icon'))
        const leadingIcon = rect(screen.getByText('event'))
        const leadingText = textBox(screen.getByText('Leading icon'))
        expect(leadingIcon.left - leading.left).toBeCloseTo(8, 1)
        expect(leadingText.left - leadingIcon.right).toBeCloseTo(8, 1)
        expect(leading.right - leadingText.right).toBeCloseTo(16, 1)
      },
    )

    it('pads a filter chip 8dp beside its trailing icon, 8dp from the label', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips">
            <Chip id="trailing" variant="filter" textValue="Trailing icon">
              Trailing icon
              <Icon slot="trailing" name="arrow_drop_down" />
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const trailing = rect(chip('Trailing icon'))
      const trailingIcon = rect(screen.getByText('arrow_drop_down'))
      const trailingText = textBox(screen.getByText('Trailing icon'))
      expect(trailingText.left - trailing.left).toBeCloseTo(16, 1)
      expect(trailingIcon.left - trailingText.right).toBeCloseTo(8, 1)
      expect(trailing.right - trailingIcon.right).toBeCloseTo(8, 1)
    })

    it('pads an input chip 12dp beside its label, 8dp beside an icon and 4dp beside an avatar', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" onRemove={() => {}}>
            <Chip id="plain" variant="input" textValue="Plain label">
              Plain label
              {remove}
            </Chip>
            <Chip id="icon" variant="input" textValue="Leading icon">
              <Icon slot="leading" name="person" />
              Leading icon
              {remove}
            </Chip>
            <Chip id="avatar" variant="input" textValue="Leading avatar">
              <img slot="leading" alt="" src={avatar} />
              Leading avatar
              {remove}
            </Chip>
            <Chip id="bare" variant="input">
              No trailing icon
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const plain = rect(chip('Plain label'))
      const plainText = textBox(screen.getByText('Plain label'))
      const close = rect(within(chip('Plain label')).getByText('close'))
      expect(plainText.left - plain.left).toBeCloseTo(12, 1)
      expect(close.left - plainText.right).toBeCloseTo(8, 1)
      expect(plain.right - close.right).toBeCloseTo(8, 1)

      const icon = rect(screen.getByText('person'))
      expect(icon.left - rect(chip('Leading icon')).left).toBeCloseTo(8, 1)
      expect(textBox(screen.getByText('Leading icon')).left - icon.right).toBeCloseTo(8, 1)

      const withAvatar = rect(chip('Leading avatar'))
      const image = within(chip('Leading avatar')).getByRole('presentation')
      expect(rect(image).width).toBe(24)
      expect(rect(image).height).toBe(24)
      expect(Number.parseFloat(getComputedStyle(image).borderRadius)).toBeGreaterThanOrEqual(12)
      expect(rect(image).left - withAvatar.left).toBeCloseTo(4, 1)
      expect(rect(image).top - withAvatar.top).toBeCloseTo(4, 1)
      expect(textBox(screen.getByText('Leading avatar')).left - rect(image).right).toBeCloseTo(8, 1)
      // The avatar overhangs the label's line, and the chip stays 32dp.
      expect(withAvatar.height).toBe(32)

      const bare = rect(chip('No trailing icon'))
      expect(bare.right - textBox(screen.getByText('No trailing icon')).right).toBeCloseTo(12, 1)
    })

    it('draws an image as the avatar, in the leading slot or none', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" onRemove={() => {}}>
            <Chip id="slotted" variant="input" textValue="Slotted">
              <img slot="leading" alt="" src={avatar} />
              Slotted
              {remove}
            </Chip>
            <Chip id="unslotted" variant="input" textValue="Unslotted">
              <img alt="" src={avatar} />
              Unslotted
              {remove}
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      for (const label of ['Slotted', 'Unslotted']) {
        const row = rect(chip(label))
        const image = rect(within(chip(label)).getByRole('presentation'))
        expect([image.width, image.height], label).toEqual([24, 24])
        expect(image.left - row.left, label).toBeCloseTo(4, 1)
        expect(row.height, label).toBe(32)
      }
    })

    it('draws an Icon before or after its label 18dp, centered on the chip', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips">
            <Chip id="price" variant="filter" textValue="Price">
              <Icon slot="leading" name="sell" />
              Price
              <Icon slot="trailing" name="arrow_drop_down" />
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const row = rect(chip('Price'))
      for (const name of ['sell', 'arrow_drop_down']) {
        const icon = rect(screen.getByText(name))
        expect(icon.width, name).toBe(18)
        expect(icon.height, name).toBe(18)
        expect(icon.top + icon.height / 2, name).toBeCloseTo(row.top + row.height / 2, 1)
      }
    })

    it("keeps an icon's own size and color classes over its slot's", () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips">
            <Chip id="price" variant="filter" textValue="Price">
              <Icon slot="leading" name="sell" className="text-error icon-20" />
              Price
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const icon = screen.getByText('sell')
      expect(rect(icon).width).toBe(20)
      expect(getComputedStyle(icon).color).toBe(computedColor('var(--md-sys-color-error)', icon))
    })

    it('draws its slots in place whatever order they are given in, holding an element of any kind', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips">
            <Chip id="shuffled" variant="filter" textValue="Shuffled">
              <Icon slot="trailing" name="arrow_drop_down" />
              Shuffled
              <span slot="leading" style={{ display: 'block', width: 18, height: 18 }} />
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const row = rect(chip('Shuffled'))
      const leading = rect(chip('Shuffled').querySelector('span[slot="leading"]')!)
      const text = textBox(screen.getByText('Shuffled'))
      const trailing = rect(screen.getByText('arrow_drop_down'))
      expect(leading.left - row.left).toBeCloseTo(8, 1)
      expect(text.left - leading.right).toBeCloseTo(8, 1)
      expect(trailing.left - text.right).toBeCloseTo(8, 1)
      expect(row.right - trailing.right).toBeCloseTo(8, 1)
    })

    it('is 4dp shorter for each step of density', () => {
      render(
        <Scheme density="-1">
          <ChipGroup aria-label="Chips">
            <Chip variant="assist" id="dense">
              Dense
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      expect(rect(chip('Dense')).height).toBe(28)
    })

    it('is 88dp wide at least with a button in it, a second action, a short Text label centered in it', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" onRemove={() => {}}>
            <Chip id="ann" variant="input" textValue="Al">
              <Text slot="label">Al</Text>
              {remove}
            </Chip>
            <Chip id="cy" variant="input" textValue="Cy">
              Cy
              {remove}
            </Chip>
            <Chip id="menu" variant="filter" textValue="Bo">
              Bo
              <Icon slot="trailing" name="arrow_drop_down" />
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const row = rect(chip('Al'))
      const close = rect(within(chip('Al')).getByText('close'))
      const text = textBox(screen.getByText('Al'))
      expect(row.width).toBe(88)
      expect(row.right - close.right).toBeCloseTo(8, 1)
      // The room past the 12dp padding and the 8dp before the X is split evenly around the label.
      expect(text.left - row.left).toBeGreaterThan(12)
      expect(text.left - row.left - 12).toBeCloseTo(close.left - 8 - text.right, 1)
      // Plain text stays at the start, and the button at the end.
      const bare = rect(chip('Cy'))
      const bareClose = rect(within(chip('Cy')).getByText('close'))
      expect(bare.width).toBe(88)
      expect(textBox(screen.getByText('Cy')).left - bare.left).toBeCloseTo(12, 1)
      expect(bare.right - bareClose.right).toBeCloseTo(8, 1)
      // A trailing icon alone is no second action.
      expect(rect(chip('Bo')).width).toBeLessThan(88)
    })

    it('draws its remove button 24dp and round, centered on its icon', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" onRemove={() => {}}>
            <Chip id="ann" variant="input" textValue="Ann">
              Ann
              {remove}
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const button = screen.getByRole('button', { name: 'Remove Ann' })
      const icon = rect(within(button).getByText('close'))
      expect([icon.width, icon.height]).toEqual([18, 18])
      expect(rect(button).width).toBe(24)
      expect(rect(button).height).toBe(24)
      expect(getComputedStyle(button).borderRadius).not.toBe('0px')
      expect(rect(button).left + 12).toBeCloseTo(icon.left + 9, 1)
      expect(rect(button).top + 12).toBeCloseTo(icon.top + 9, 1)
    })

    it('cuts a Text label short with an ellipsis in a group too narrow for it', () => {
      const long = 'A label much too long for its chip'
      render(
        <Scheme>
          <div style={{ width: 120 }}>
            <ChipGroup aria-label="Chips">
              <Chip variant="assist" id="long" textValue={long}>
                <Text slot="label">{long}</Text>
              </Chip>
            </ChipGroup>
          </div>
        </Scheme>,
      )
      const label = screen.getByText(long)
      expect(rect(chip(long)).width).toBe(120)
      expect(getComputedStyle(label).textOverflow).toBe('ellipsis')
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth)
    })
  })

  describe.each(schemes)('colors, %s theme at %s contrast', (theme, contrast) => {
    it('draws each variant in its roles at rest, flat, with a 1dp outline variant outline', () => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <ChipGroup aria-label="Chips">
            {variants.map((variant) => (
              <Chip key={variant} id={variant} variant={variant} textValue={variant}>
                <Icon slot="leading" name="star" />
                {variant}
                {close(variant)}
              </Chip>
            ))}
          </ChipGroup>
        </Scheme>,
      )
      // The label, the leading icon, and what ends the chip where its variant has a slot for one.
      const roles = {
        assist: ['on-surface', 'primary'],
        filter: ['on-surface-variant', 'primary', 'on-surface-variant'],
        input: ['on-surface-variant', 'on-surface-variant', 'on-surface-variant'],
        suggestion: ['on-surface-variant', 'primary'],
      } as const
      for (const variant of variants) {
        const row = chip(variant)
        const [label, leading, trailing] = roles[variant]
        expect(getComputedStyle(screen.getByText(variant)).color, `${variant} label`).toBe(
          role(label, row),
        )
        expect(getComputedStyle(within(row).getByText('star')).color, `${variant} leading`).toBe(
          role(leading, row),
        )
        if (trailing) {
          expect(
            getComputedStyle(within(row).getByText('close')).color,
            `${variant} trailing`,
          ).toBe(role(trailing, row))
        }
        expect(getComputedStyle(row).backgroundColor, `${variant} container`).toBe(
          'rgba(0, 0, 0, 0)',
        )
        expect(shadowOf(row), `${variant} outline`).toEqual({
          ringWidth: 1,
          ringColor: role('outline-variant', row),
          shadow: '',
        })
      }
    })

    it('fills a selected filter or input chip in secondary container, with no outline', () => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <ChipGroup
            aria-label="Chips"
            selectionMode="multiple"
            defaultSelectedKeys={['filter', 'input']}
          >
            {(['filter', 'input'] as const).map((variant) => (
              <Chip key={variant} id={variant} variant={variant} textValue={variant}>
                <Icon slot="leading" name="star" />
                {variant}
                {close(variant)}
              </Chip>
            ))}
          </ChipGroup>
        </Scheme>,
      )
      for (const variant of ['filter', 'input'] as const) {
        const row = chip(variant)
        const container = role('secondary-container', row)
        expect(getComputedStyle(row).backgroundColor, `${variant} container`).toBe(container)
        expect(shadowOf(row).ringWidth, `${variant} outline`).toBe(0)
        expect(getComputedStyle(screen.getByText(variant)).color, `${variant} label`).toBe(
          role('on-secondary-container', row),
        )
        expect(getComputedStyle(within(row).getByText('close')).color, `${variant} trailing`).toBe(
          role('on-secondary-container', row),
        )
        // The label holds 3:1 on its container, as the spec asks.
        expect(
          contrastRatio(getComputedStyle(screen.getByText(variant)).color, container),
        ).toBeGreaterThanOrEqual(3)
      }
      expect(getComputedStyle(within(chip('filter')).getByText('star')).color).toBe(
        role('on-secondary-container', chip('filter')),
      )
      // A selected input chip's leading icon is primary, which holds 3:1 on the container at
      // standard contrast only: at medium and high it is the label's color.
      const inputLeading = getComputedStyle(within(chip('input')).getByText('star')).color
      expect(inputLeading).toBe(
        role(contrast === 'standard' ? 'primary' : 'on-secondary-container', chip('input')),
      )
      expect(
        contrastRatio(inputLeading, role('secondary-container', chip('input'))),
      ).toBeGreaterThanOrEqual(3)
    })

    it('draws an elevated chip on surface container low at level 1, with no outline', () => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <ChipGroup aria-label="Chips">
            {(['assist', 'filter', 'suggestion'] as const).map((variant) => (
              <Chip key={variant} id={variant} variant={variant} isElevated>
                {variant}
              </Chip>
            ))}
          </ChipGroup>
        </Scheme>,
      )
      for (const variant of ['assist', 'filter', 'suggestion'] as const) {
        const row = chip(variant)
        expect(getComputedStyle(row).backgroundColor, variant).toBe(
          role('surface-container-low', row),
        )
        expect(shadowOf(row), variant).toEqual({
          ringWidth: 0,
          ringColor: undefined,
          shadow: elevation(1, row),
        })
      }
    })

    it('draws a disabled chip in on surface: its content at 38%, its outline or container at 12%', () => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <ChipGroup
            aria-label="Chips"
            selectionMode="multiple"
            defaultSelectedKeys={['selected filter', 'selected input']}
            disabledKeys={['flat', 'elevated', 'selected filter', 'selected input']}
          >
            <Chip id="flat" variant="filter" textValue="flat">
              <Icon slot="leading" name="star" />
              flat
              <Icon slot="trailing" name="close" />
            </Chip>
            <Chip variant="assist" id="elevated" isElevated textValue="elevated">
              <img slot="leading" alt="" src={avatar} />
              elevated
            </Chip>
            <Chip id="selected filter" variant="filter" textValue="selected filter">
              <Icon slot="leading" name="star" />
              selected filter
            </Chip>
            <Chip id="selected input" variant="input" textValue="selected input">
              <Icon slot="leading" name="star" />
              selected input
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      for (const label of ['flat', 'elevated', 'selected filter', 'selected input']) {
        const row = chip(label)
        const content = roleAt('on-surface', 38, row)
        expect(getComputedStyle(screen.getByText(label)).color, `${label} label`).toBe(content)
        for (const icon of within(row).queryAllByText(/^(star|close)$/)) {
          expect(getComputedStyle(icon).color, `${label} ${icon.textContent}`).toBe(content)
        }
      }
      expect(shadowOf(chip('flat'))).toEqual({
        ringWidth: 1,
        ringColor: roleAt('on-surface', 12, chip('flat')),
        shadow: '',
      })
      for (const label of ['elevated', 'selected filter', 'selected input']) {
        const row = chip(label)
        expect(getComputedStyle(row).backgroundColor, label).toBe(roleAt('on-surface', 12, row))
        expect(shadowOf(row).ringWidth, label).toBe(0)
        expect(shadowOf(row).shadow, label).toBe('')
      }
      const image = within(chip('elevated')).getByRole('presentation')
      expect(getComputedStyle(image).opacity).toBe('0.38')
    })
  })

  describe('states', () => {
    it('shows the hover layer and the pointer over a chip that selects or acts, not over one that does neither', async () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Selects" selectionMode="multiple">
            <Chip variant="assist" id="selects">
              Selects
            </Chip>
          </ChipGroup>
          <ChipGroup aria-label="Acts" onAction={() => {}}>
            <Chip variant="assist" id="acts">
              Acts
            </Chip>
          </ChipGroup>
          <ChipGroup aria-label="Neither">
            <Chip variant="assist" id="neither">
              Neither
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      for (const [label, opacity, cursor] of [
        ['Selects', '0.08', 'pointer'],
        ['Acts', '0.08', 'pointer'],
        ['Neither', '0', 'auto'],
      ] as const) {
        await userEvent.hover(chip(label))
        await settle()
        expect(getComputedStyle(chip(label).querySelector('.state-layer')!).opacity, label).toBe(
          opacity,
        )
        expect(getComputedStyle(chip(label)).cursor, label).toBe(cursor)
      }
    })

    it('raises an elevated chip to level 2 on hover, and back to level 1 while pressed', async () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" onAction={() => {}}>
            <Chip variant="assist" id="elevated" isElevated data-testid="elevated">
              Elevated
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const row = chip('Elevated')
      await userEvent.hover(row)
      await settle()
      expect(shadowOf(row).shadow).toBe(elevation(2, row))
      await commands.pointer('[data-testid="elevated"]', 20, 16, 'down')
      try {
        await settle()
        expect(row).toHaveAttribute('data-pressed', 'true')
        expect(shadowOf(row).shadow).toBe(elevation(1, row))
      } finally {
        await commands.pointer('[data-testid="elevated"]', 20, 16, 'up')
      }
    })

    it('raises a flat filter chip, selected, to level 1 on hover', async () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" selectionMode="multiple" defaultSelectedKeys={['on']}>
            <Chip id="on" variant="filter">
              On
            </Chip>
            <Chip id="off" variant="filter">
              Off
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      await userEvent.hover(chip('On'))
      await settle()
      expect(shadowOf(chip('On')).shadow).toBe(elevation(1, chip('On')))
      await userEvent.hover(chip('Off'))
      await settle()
      expect(shadowOf(chip('Off')).shadow).toBe('')
    })

    it('draws the focus ring and focus layer on keyboard focus, and darkens a flat outline', async () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" selectionMode="multiple">
            <Chip variant="assist" id="assist">
              Assist
            </Chip>
            <Chip id="filter" variant="filter">
              Filter
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      await userEvent.tab()
      for (const [label, outline] of [
        ['Assist', 'on-surface'],
        ['Filter', 'on-surface-variant'],
      ] as const) {
        const row = chip(label)
        expect(row, label).toHaveFocus()
        await settle()
        const style = getComputedStyle(row)
        expect(style.outlineStyle, label).toBe('solid')
        expect(style.outlineWidth, label).toBe('3px')
        expect(style.outlineOffset, label).toBe('2px')
        expect(style.outlineColor, label).toBe(role('secondary', row))
        expect(shadowOf(row).ringColor, label).toBe(role(outline, row))
        expect(getComputedStyle(row.querySelector('.state-layer')!).opacity, label).toBe('0.1')
        await userEvent.keyboard('{ArrowRight}')
      }
    })

    it('draws no focus ring for a pointer press', async () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" selectionMode="multiple">
            <Chip id="filter" variant="filter">
              Filter
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      await userEvent.click(chip('Filter'))
      expect(chip('Filter')).toHaveFocus()
      expect(getComputedStyle(chip('Filter')).outlineStyle).toBe('none')
    })
  })

  describe('targets', () => {
    it('has a 48dp target', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" selectionMode="multiple">
            <Chip variant="assist" id="a">
              A
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      expectHitArea(chip('A'))
    })

    it("gives its remove button a 48dp target, above the chip's own", () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" selectionMode="multiple" onRemove={() => {}}>
            <Chip id="ann" variant="input" textValue="Ann">
              Ann
              {remove}
            </Chip>
            <Chip id="bo" variant="input" textValue="Bo">
              Bo
              {remove}
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      expectHitArea(screen.getByRole('button', { name: 'Remove Ann' }))
    })

    it('removes a chip pressed on its remove button, past its own edge, and does not select it', async () => {
      const onRemove = vi.fn()
      const onSelectionChange = vi.fn()
      render(
        <Scheme>
          <ChipGroup
            aria-label="Chips"
            selectionMode="multiple"
            onRemove={onRemove}
            onSelectionChange={onSelectionChange}
          >
            <Chip id="ann" variant="input" textValue="Ann">
              Ann
              {remove}
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const button = screen.getByRole('button', { name: 'Remove Ann' })
      // 9px past the button's end: 4px past the chip's, inside the button's 48dp target.
      const x = rect(button).width + 9
      expect(rect(button).left + x).toBeGreaterThan(rect(chip('Ann')).right)
      await commands.pointer('[slot="remove"]', x, 12, 'down')
      await commands.pointer('[slot="remove"]', x, 12, 'up')
      expect(onRemove).toHaveBeenCalledWith(new Set(['ann']))
      expect(onSelectionChange).not.toHaveBeenCalled()
    })

    it("draws its remove button's own focus ring, straddling its edge", async () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" onRemove={() => {}}>
            <Chip id="ann" variant="input" textValue="Ann">
              Ann
              {remove}
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const button = screen.getByRole('button', { name: 'Remove Ann' })
      await userEvent.tab()
      await userEvent.tab()
      expect(button).toHaveFocus()
      const style = getComputedStyle(button)
      expect(style.outlineStyle).toBe('solid')
      expect(style.outlineWidth).toBe('3px')
      expect(style.outlineOffset).toBe('-2px')
      expect(style.outlineColor).toBe(role('secondary', button))
    })

    // The spec's input chip states diagram, its remove icon's row: hovered or pressed, a 24dp
    // layer and ripple of its own and none on the chip; focused, its ring over the chip's layer.
    it('draws its remove button’s states as the spec does, apart from the chip’s', async () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips" onRemove={() => {}}>
            <Chip id="ann" variant="input" textValue="Ann">
              Ann
              {remove}
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const row = chip('Ann')
      const button = screen.getByRole('button', { name: 'Remove Ann' })
      const layers = () =>
        [
          row.querySelector(':scope > * > .state-layer')!,
          button.querySelector('.state-layer')!,
        ].map((layer) => getComputedStyle(layer).opacity)
      const circles = () =>
        [row.querySelector(':scope > * > .state-layer + span')!, button].map(
          (surface) => surface.querySelectorAll('.rounded-full.bg-current').length,
        )

      await userEvent.hover(button)
      await settle()
      expect(layers()).toEqual(['0', '0.08'])
      expect(rect(button).width).toBe(24)

      const { x, y, width, height } = rect(button)
      const at = { clientX: x + width / 2, clientY: y + height / 2, pointerId: 1, bubbles: true }
      button.dispatchEvent(new PointerEvent('pointerdown', { ...at, button: 0 }))
      expect(circles()).toEqual([0, 1])
      document.dispatchEvent(new PointerEvent('pointerup', at))
      await userEvent.unhover(button)

      await userEvent.tab()
      await userEvent.tab()
      expect(button).toHaveFocus()
      await settle()
      expect(layers()).toEqual(['0.1', '0'])
      expect(getComputedStyle(row).outlineStyle).toBe('none')
      expect(getComputedStyle(button).outlineStyle).toBe('solid')
    })
  })

  describe('ChipGroup', () => {
    it('lays its chips out in rows, 8dp apart, with 16dp between the rows', () => {
      render(
        <Scheme>
          <div style={{ width: 200 }}>
            <ChipGroup aria-label="Chips">
              {['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map((label) => (
                <Chip variant="assist" key={label} id={label}>
                  {label}
                </Chip>
              ))}
            </ChipGroup>
          </div>
        </Scheme>,
      )
      const rows = screen.getAllByRole('row').map(rect)
      const next = rows.findIndex((row) => row.top > rows[0]!.top)
      expect(next).toBeGreaterThan(1)
      expect(rows[1]!.left - rows[0]!.right).toBeCloseTo(8, 1)
      expect(rows[next]!.top - rows[0]!.bottom).toBeCloseTo(16, 1)
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('gives a chip a border, and a selected filter or input chip the highlight fill', () => {
      render(
        <Scheme>
          <ChipGroup
            aria-label="Chips"
            selectionMode="multiple"
            defaultSelectedKeys={['filter', 'input']}
            disabledKeys={['disabled']}
          >
            <Chip variant="assist" id="assist">
              assist
            </Chip>
            <Chip id="filter" variant="filter" textValue="filter">
              <Icon slot="leading" name="check" />
              filter
            </Chip>
            <Chip id="input" variant="input" textValue="input">
              <Icon slot="leading" name="star" />
              input
            </Chip>
            <Chip variant="assist" id="disabled">
              disabled
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const assist = getComputedStyle(chip('assist'))
      expect(assist.borderStyle).toBe('solid')
      expect(assist.borderWidth).toBe('1px')
      expect(assist.borderColor).toBe(computedColor('ButtonText', chip('assist')))
      expect(getComputedStyle(chip('disabled')).borderColor).toBe(
        computedColor('GrayText', chip('disabled')),
      )
      for (const [label, icon] of [
        ['filter', 'check'],
        ['input', 'star'],
      ] as const) {
        const row = chip(label)
        const text = computedColor('HighlightText', row)
        expect(getComputedStyle(row).backgroundColor, label).toBe(computedColor('Highlight', row))
        expect(getComputedStyle(screen.getByText(label)).color, label).toBe(text)
        expect(getComputedStyle(within(row).getByText(icon)).color, `${label} icon`).toBe(text)
      }
    })
  })

  describe('motion', () => {
    it('changes its colors and shadow on the fast effects spring', () => {
      render(
        <Scheme>
          <ChipGroup aria-label="Chips">
            <Chip variant="assist" id="a">
              A
            </Chip>
          </ChipGroup>
        </Scheme>,
      )
      const style = getComputedStyle(chip('A'))
      expect(style.transitionProperty).toBe('background-color, color, box-shadow')
      const duration = springDuration('fast-effects')
      const easing = springEasing('fast-effects')
      expect(style.transitionDuration).toBe([duration, duration, duration].join(', '))
      expect(style.transitionTimingFunction).toBe([easing, easing, easing].join(', '))
    })
  })
})
