import '@fontsource-variable/material-symbols-outlined/full.css'
import { render, screen } from '@testing-library/react'
import { page } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { computedColor, Scheme } from '../../test-browser'
import { Icon } from './icon'

/*
 * What needs a real browser and the real stylesheet: the real pixel size, inherited or
 * set by a class, the axes the browser sets from the font size and weight (by what the
 * glyph draws), a container's fill, the rtl mirror (a real `dir="rtl"` ancestor), the
 * ligature shaping in an rtl layout, and a custom class actually painting its color.
 */

const sizes = [18, 20, 24, 28, 32, 36, 40, 48] as const
const iconSize = {
  18: 'icon-18',
  20: 'icon-20',
  24: 'icon-24',
  28: 'icon-28',
  32: 'icon-32',
  36: 'icon-36',
  40: 'icon-40',
  48: 'icon-48',
}

/** The icon font, imported above, in before a glyph is measured or drawn. */
async function fontLoaded(el: HTMLElement) {
  const { fontSize, fontFamily } = getComputedStyle(el)
  await document.fonts.load(`${fontSize} ${fontFamily}`)
}

/** What the glyph draws, as a PNG of its box. */
async function drawn(el: HTMLElement) {
  await fontLoaded(el)
  return page.screenshot({ element: el, save: false })
}

describe('Icon in a browser', () => {
  it('is a square of the font size it inherits, on a line as tall', () => {
    render(
      <div style={{ fontSize: '30px', lineHeight: '50px' }}>
        <Icon name="add" />
      </div>,
    )
    const el = screen.getByText('add')
    const rect = el.getBoundingClientRect()
    expect([rect.width, rect.height]).toEqual([30, 30])
    expect(getComputedStyle(el).fontSize).toBe('30px')
    expect(getComputedStyle(el).lineHeight).toBe('30px')
  })

  it.each(sizes)('is a %ipx square given icon-%i', (px) => {
    render(<Icon name="add" className={iconSize[px]} />)
    const style = getComputedStyle(screen.getByText('add'))
    const rect = screen.getByText('add').getBoundingClientRect()
    expect([rect.width, rect.height]).toEqual([px, px])
    expect(style.fontSize).toBe(`${px}px`)
  })

  // Its line-height of 1 keeps the line box the square box, so the glyph centers.
  it.each(sizes)('keeps line-height at 1 given icon-%i, not the browser default', (px) => {
    render(<Icon name="stars_filled" className={iconSize[px]} />)
    // A unitless line-height computes to its resolved px value (font-size * 1), not the bare number.
    expect(getComputedStyle(screen.getByText('stars_filled')).lineHeight).toBe(`${px}px`)
  })

  it.each(sizes)(
    'is %ipx in what has icon-%i, at any depth, and leaves the font size of its text alone',
    (px) => {
      render(
        <div className={iconSize[px]} style={{ fontSize: '10px', lineHeight: '14px' }}>
          <Icon name="add" />
          <span>
            Text <Icon name="remove" />
          </span>
        </div>,
      )
      for (const name of ['add', 'remove']) {
        const rect = screen.getByText(name).getBoundingClientRect()
        expect([rect.width, rect.height], name).toEqual([px, px])
        expect(getComputedStyle(screen.getByText(name)).lineHeight, name).toBe(`${px}px`)
      }
      expect(getComputedStyle(screen.getByText('Text')).fontSize).toBe('10px')
      expect(getComputedStyle(screen.getByText('Text')).lineHeight).toBe('14px')
    },
  )

  it('takes any size in dp from icon-*, or a length', () => {
    render(
      <>
        <Icon name="add" className="icon-22" />
        <Icon name="remove" className="icon-[30px]" />
      </>,
    )
    expect(screen.getByText('add').getBoundingClientRect().width).toBe(22)
    expect(screen.getByText('remove').getBoundingClientRect().width).toBe(30)
  })

  it('is drawn the same by font-icon on an element of its own', () => {
    render(
      <span className="font-icon icon-24 icon-filled" aria-hidden>
        home
      </span>,
    )
    const el = screen.getByText('home')
    const rect = el.getBoundingClientRect()
    expect([rect.width, rect.height]).toEqual([24, 24])
    expect(getComputedStyle(el).fontVariationSettings).toBe('"FILL" 1, "GRAD" 0')
  })

  it('takes the nearest icon-*, its own first, as a font size inherits', () => {
    render(
      <div className="icon-20">
        <Icon name="add" className="icon-32" />
        <span className="icon-40">
          <Icon name="remove" />
        </span>
        <Icon name="close" />
      </div>,
    )
    expect(screen.getByText('add').getBoundingClientRect().width).toBe(32)
    expect(screen.getByText('remove').getBoundingClientRect().width).toBe(40)
    expect(screen.getByText('close').getBoundingClientRect().width).toBe(20)
  })

  it('sets the optical size axis from its font size', async () => {
    const { rerender } = render(<Icon name="settings" className="icon-48" />)
    const auto = await drawn(screen.getByText('settings'))
    rerender(
      <Icon
        name="settings"
        className="icon-48"
        style={{ fontVariationSettings: "'FILL' 0, 'GRAD' 0, 'opsz' 48" }}
      />,
    )
    expect(await drawn(screen.getByText('settings'))).toBe(auto)
    rerender(
      <Icon
        name="settings"
        className="icon-48"
        style={{ fontVariationSettings: "'FILL' 0, 'GRAD' 0, 'opsz' 20" }}
      />,
    )
    expect(await drawn(screen.getByText('settings'))).not.toBe(auto)
  })

  it('sets the weight axis from its font weight, 400 unless a class sets another', async () => {
    const { rerender } = render(<Icon name="settings" className="icon-48" />)
    const regular = await drawn(screen.getByText('settings'))
    rerender(
      <Icon
        name="settings"
        className="icon-48"
        style={{ fontVariationSettings: "'FILL' 0, 'GRAD' 0, 'wght' 400" }}
      />,
    )
    expect(await drawn(screen.getByText('settings'))).toBe(regular)
    rerender(<Icon name="settings" className="font-bold icon-48" />)
    const bold = await drawn(screen.getByText('settings'))
    expect(bold).not.toBe(regular)
    rerender(
      <Icon
        name="settings"
        className="icon-48"
        style={{ fontVariationSettings: "'FILL' 0, 'GRAD' 0, 'wght' 700" }}
      />,
    )
    expect(await drawn(screen.getByText('settings'))).toBe(bold)
  })

  it('is filled given icon-filled, or in what has it, unless it is icon-outlined', () => {
    render(
      <>
        <Icon name="star" className="icon-filled" />
        <div className="icon-filled">
          <span>
            <Icon name="home" />
          </span>
          <Icon name="label" className="icon-outlined" />
        </div>
        <Icon name="search" />
      </>,
    )
    const axes = (name: string) => getComputedStyle(screen.getByText(name)).fontVariationSettings
    expect(axes('star')).toBe('"FILL" 1, "GRAD" 0')
    expect(axes('home')).toBe('"FILL" 1, "GRAD" 0')
    expect(axes('label')).toBe('"FILL" 0, "GRAD" 0')
    expect(axes('search')).toBe('"FILL" 0, "GRAD" 0')
  })

  it('takes its grade from icon-grade-200 or -icon-grade-25, on it or on what holds it', () => {
    render(
      <>
        <Icon name="star" className="icon-grade-200" />
        <div className="-icon-grade-25">
          <Icon name="home" />
        </div>
      </>,
    )
    const axes = (name: string) => getComputedStyle(screen.getByText(name)).fontVariationSettings
    expect(axes('star')).toBe('"FILL" 0, "GRAD" 200')
    expect(axes('home')).toBe('"FILL" 0, "GRAD" -25')
  })

  it('lets a class of its own override its box and weight', () => {
    render(
      <div style={{ fontSize: '24px' }}>
        <Icon name="add" className="size-8 font-bold" />
      </div>,
    )
    const el = screen.getByText('add')
    expect(el.getBoundingClientRect().width).toBe(32)
    expect(getComputedStyle(el).fontWeight).toBe('700')
  })

  it('mirrors in right-to-left layouts only when asked to', () => {
    render(
      <>
        <Icon name="undo" className="rtl:icon-mirrored" />
        <Icon name="chevron_left" className="icon-mirrored" />
        <div dir="rtl">
          <Icon name="arrow_back" />
          <Icon name="redo" className="rtl:icon-mirrored" />
        </div>
      </>,
    )
    expect(getComputedStyle(screen.getByText('undo')).scale).toBe('none')
    expect(getComputedStyle(screen.getByText('chevron_left')).scale).toBe('-1 1')
    expect(getComputedStyle(screen.getByText('arrow_back')).scale).toBe('none')
    expect(getComputedStyle(screen.getByText('redo')).scale).toBe('-1 1')
  })

  // In a right-to-left run the ligature never shapes, and the box would show
  // the clipped last letter of the name, so the text run stays left-to-right.
  it('still shapes the ligature in a right-to-left layout', async () => {
    render(
      <div dir="rtl">
        <Icon name="stars_filled" />
      </div>,
    )
    const el = screen.getByText('stars_filled')
    await fontLoaded(el)
    expect(getComputedStyle(el).direction).toBe('ltr')
    // The text run starts at the box's left edge, where the glyph is drawn; in
    // an rtl run it would end at the right edge instead, showing the last letter.
    const run = document.createRange()
    run.selectNodeContents(el)
    expect(run.getBoundingClientRect().left).toBe(el.getBoundingClientRect().left)
  })

  it('lets a custom class override the text color', () => {
    render(
      <Scheme>
        <Icon name="home" className="text-primary" />
      </Scheme>,
    )
    const el = screen.getByText('home')
    expect(getComputedStyle(el).color).toBe(computedColor('var(--md-sys-color-primary)', el))
  })
})
