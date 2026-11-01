import { describe, expect, it } from 'vitest'
import { tv, twMerge } from './tv'

const merge = (...classes: string[]) => tv({ base: classes })()

describe('tv (M3-aware tailwind-merge)', () => {
  it('keeps a type-scale utility and a text color together', () => {
    expect(merge('text-label-lg', 'text-primary')).toBe('text-label-lg text-primary')
  })

  it('lets a later type-scale utility override an earlier one', () => {
    expect(merge('text-label-lg', 'text-title-md')).toBe('text-title-md')
  })

  it('keeps an emphasized type-scale utility and a text color together', () => {
    expect(merge('text-display-lg-emphasized', 'text-primary')).toBe(
      'text-display-lg-emphasized text-primary',
    )
    expect(merge('text-primary', 'text-label-sm-emphasized')).toBe(
      'text-primary text-label-sm-emphasized',
    )
  })

  it('lets a later emphasized or baseline type-scale utility override an earlier one', () => {
    expect(merge('text-label-lg', 'text-label-lg-emphasized')).toBe('text-label-lg-emphasized')
    expect(merge('text-title-md-emphasized', 'text-body-md')).toBe('text-body-md')
  })

  it('lets a later color override an earlier one', () => {
    expect(merge('text-primary', 'text-on-surface')).toBe('text-on-surface')
  })

  it('treats tonal palette shades as colors', () => {
    expect(merge('bg-primary-40', 'bg-neutral-variant-90')).toBe('bg-neutral-variant-90')
    expect(merge('text-label-lg', 'text-primary-40')).toBe('text-label-lg text-primary-40')
    expect(merge('bg-primary', 'bg-primary-40')).toBe('bg-primary-40')
  })

  it('overrides font weight tokens without touching font families', () => {
    expect(merge('font-regular', 'font-bold')).toBe('font-bold')
    expect(merge('font-medium', 'font-regular')).toBe('font-regular')
    expect(merge('font-regular', 'font-[500]')).toBe('font-[500]')
    expect(merge('font-icon', 'font-regular')).toBe('font-icon font-regular')
    expect(merge('font-plain', 'font-brand')).toBe('font-brand')
  })

  it('overrides shape, elevation and easing tokens', () => {
    expect(merge('rounded-shape-full', 'rounded-shape-sm')).toBe('rounded-shape-sm')
    expect(merge('shadow-elevation-1', 'shadow-elevation-3')).toBe('shadow-elevation-3')
    expect(merge('ease-standard', 'ease-emphasized')).toBe('ease-emphasized')
  })

  it('lets a later shape of the shape library override an earlier one', () => {
    expect(merge('shape-circle', 'shape-4-sided-cookie')).toBe('shape-4-sided-cookie')
    expect(merge('shape-heart', 'rounded-shape-md')).toBe('shape-heart rounded-shape-md')
  })

  // A shape is a clip-path, and Tailwind's masks, gradients too, apply on top of it in either order.
  it('keeps Tailwind’s mask classes with a shape, before or after it', () => {
    expect(merge('mask-linear-90', 'shape-heart')).toBe('mask-linear-90 shape-heart')
    expect(merge('mask-b-from-50%', 'shape-heart')).toBe('mask-b-from-50% shape-heart')
    expect(merge('mask-radial-at-center mask-circle', 'shape-heart')).toBe(
      'mask-radial-at-center mask-circle shape-heart',
    )
    expect(merge('mask-conic-from-75%', 'shape-heart')).toBe('mask-conic-from-75% shape-heart')
    expect(merge('mask-none', 'shape-heart')).toBe('mask-none shape-heart')
    expect(merge('shape-heart', 'mask-none')).toBe('shape-heart mask-none')
  })

  it('lets shape-none and a shape replace each other, and keeps one per breakpoint', () => {
    expect(merge('shape-heart', 'shape-none')).toBe('shape-none')
    expect(merge('shape-none', 'shape-heart')).toBe('shape-heart')
    expect(merge('shape-heart', 'md:shape-none')).toBe('shape-heart md:shape-none')
    expect(merge('shape-none', 'rounded-shape-none')).toBe('shape-none rounded-shape-none')
  })

  it('takes a shape of your own for a shape, and leaves its turn apart', () => {
    expect(merge('shape-circle', 'shape-blob')).toBe('shape-blob')
    expect(merge('shape-blob', 'shape-rotate-45', '-shape-rotate-90')).toBe(
      'shape-blob -shape-rotate-90',
    )
  })

  it('lets a later turn of a shape override an earlier one, and keeps the shape and its spin', () => {
    expect(merge('shape-rotate-45', '-shape-rotate-90')).toBe('-shape-rotate-90')
    expect(merge('shape-rotate-[30deg]', 'shape-rotate-12')).toBe('shape-rotate-12')
    expect(merge('shape-heart shape-rotate-45', 'animate-shape-spin')).toBe(
      'shape-heart shape-rotate-45 animate-shape-spin',
    )
  })

  // Tailwind's rotate-* comes after both in the stylesheet, and turns the content with the shape:
  // whichever is later is the one kept.
  it('lets a turn of a shape and Tailwind’s rotation replace each other', () => {
    expect(merge('rotate-12', 'shape-rotate-45')).toBe('shape-rotate-45')
    expect(merge('shape-rotate-45', 'rotate-12')).toBe('rotate-12')
    expect(merge('rotate-12', 'animate-shape-spin')).toBe('animate-shape-spin')
    expect(merge('animate-shape-spin', 'rotate-12')).toBe('rotate-12')
  })

  it('takes the spin of a shape for an animation', () => {
    expect(merge('animate-spin', 'animate-shape-spin')).toBe('animate-shape-spin')
    expect(merge('animate-shape-spin', 'animate-none')).toBe('animate-none')
  })

  it('overrides duration tokens, including against numeric durations', () => {
    expect(merge('duration-short-3', 'duration-long-2')).toBe('duration-long-2')
    expect(merge('duration-300', 'duration-extra-long-4')).toBe('duration-extra-long-4')
    expect(merge('duration-medium-1', 'duration-150')).toBe('duration-150')
  })

  it('overrides spring tokens like easings and durations', () => {
    expect(merge('ease-standard', 'ease-spring-fast-spatial')).toBe('ease-spring-fast-spatial')
    expect(merge('ease-spring-slow-effects', 'ease-emphasized')).toBe('ease-emphasized')
    expect(merge('duration-spring-default-spatial', 'duration-spring-fast-effects')).toBe(
      'duration-spring-fast-effects',
    )
    expect(merge('duration-medium-2', 'duration-spring-fast-spatial')).toBe(
      'duration-spring-fast-spatial',
    )
  })

  it('overrides the stacking utilities, including against numeric z-indexes', () => {
    expect(merge('z-dialog', 'z-menu')).toBe('z-menu')
    expect(merge('z-10', 'z-tooltip')).toBe('z-tooltip')
    expect(merge('z-scrim', 'z-50')).toBe('z-50')
    expect(merge('z-raised', 'z-behind')).toBe('z-behind')
    expect(merge('-z-10', 'z-raised')).toBe('z-raised')
    expect(merge('z-focus-ring', 'z-10')).toBe('z-10')
  })

  it('lets the two focus ring placements override each other', () => {
    expect(merge('focus-ring', 'focus-ring-inset')).toBe('focus-ring-inset')
    expect(merge('focus-ring-inset', 'focus-ring')).toBe('focus-ring')
  })

  it('overrides spacing tokens', () => {
    expect(merge('p-space-100', 'p-space-300')).toBe('p-space-300')
    expect(merge('gap-space-100', 'gap-[24px]')).toBe('gap-[24px]')
    expect(merge('px-space-200', 'p-0')).toBe('p-0')
  })

  it('overrides the text field spacing token, which has a name in place of a number', () => {
    expect(merge('start-space-200', 'start-text-field-icon')).toBe('start-text-field-icon')
    expect(merge('ps-text-field-icon', 'ps-0')).toBe('ps-0')
  })

  it('overrides the density spacing, which is spacing as any other, in whatever utility', () => {
    expect(merge('p-space-100-variable', 'p-0')).toBe('p-0')
    expect(merge('py-space-125-variable', 'py-2')).toBe('py-2')
    expect(merge('py-space-125-variable', 'py-space-125')).toBe('py-space-125')
    expect(merge('py-space-125', 'py-space-75-variable')).toBe('py-space-75-variable')
    expect(merge('pt-space-175-variable', 'pb-space-150-variable', 'py-0')).toBe('py-0')
    expect(merge('px-space-200', 'py-space-200-variable')).toBe(
      'px-space-200 py-space-200-variable',
    )
    expect(merge('mt-space-300-variable', 'mt-0')).toBe('mt-0')
    expect(merge('top-space-200-variable', 'top-space-100-variable')).toBe('top-space-100-variable')
  })

  it('overrides the round corner of a density padding as any corner, a side of it too', () => {
    expect(merge('rounded-space-125-variable', 'rounded-shape-md')).toBe('rounded-shape-md')
    expect(merge('rounded-shape-full', 'rounded-space-200-variable')).toBe(
      'rounded-space-200-variable',
    )
    expect(merge('rounded-s-space-75-variable', 'rounded-s-shape-xs')).toBe('rounded-s-shape-xs')
    expect(merge('rounded-space-125-variable', 'rounded-e-shape-sm')).toBe(
      'rounded-space-125-variable rounded-e-shape-sm',
    )
    expect(merge('rounded-e-space-300-variable', 'rounded-e-space-400-variable')).toBe(
      'rounded-e-space-400-variable',
    )
  })

  it('overrides the tabs spacing token, which has a name in place of a number', () => {
    expect(merge('ps-tab-list-offset', 'ps-0')).toBe('ps-0')
    expect(merge('px-space-200', 'ps-tab-list-offset')).toBe('px-space-200 ps-tab-list-offset')
  })

  it('keeps the text field transition as the one preset, and its utilities next to a text color', () => {
    expect(merge('transition-shape-color', 'transition-text-field')).toBe('transition-text-field')
    expect(merge('field-outline-thick', 'field-notch-open', 'text-outline')).toBe(
      'field-outline-thick field-notch-open text-outline',
    )
  })

  it('keeps the navigation bar indicator transition as the one preset', () => {
    expect(merge('transition-navigation-bar-indicator', 'transition-fade')).toBe('transition-fade')
    expect(merge('transition-fade', 'transition-navigation-bar-indicator')).toBe(
      'transition-navigation-bar-indicator',
    )
  })

  it('keeps a navigation rail transition as the one preset', () => {
    expect(merge('transition-navigation-rail-progress', 'transition-fade')).toBe('transition-fade')
    expect(
      merge('transition-navigation-rail-section-in', 'transition-navigation-rail-section-out'),
    ).toBe('transition-navigation-rail-section-out')
    expect(merge('transition-navigation-rail-progress', 'transition-navigation-rail-hidden')).toBe(
      'transition-navigation-rail-hidden',
    )
  })

  it('does not confuse elevation shadows with shadow colors', () => {
    expect(merge('shadow-elevation-2', 'shadow-primary')).toBe('shadow-elevation-2 shadow-primary')
  })

  it('overrides state opacity tokens, including against numeric opacity', () => {
    expect(merge('opacity-state-hover', 'opacity-state-pressed')).toBe('opacity-state-pressed')
    expect(merge('opacity-50', 'opacity-disabled-content')).toBe('opacity-disabled-content')
    expect(merge('opacity-disabled-content', 'opacity-100')).toBe('opacity-100')
  })

  it("overrides an Icon's size, fill and grade, each apart from the others", () => {
    expect(merge('icon-20', 'icon-24')).toBe('icon-24')
    expect(merge('icon-24', 'icon-22.5', 'icon-[1.3rem]')).toBe('icon-[1.3rem]')
    expect(merge('icon-filled', 'icon-outlined')).toBe('icon-outlined')
    expect(merge('icon-grade-200', '-icon-grade-25')).toBe('-icon-grade-25')
    expect(merge('icon-24', 'icon-filled', 'icon-grade-200')).toBe(
      'icon-24 icon-filled icon-grade-200',
    )
    expect(merge('icon-24', 'text-label-lg')).toBe('icon-24 text-label-lg')
  })
})

describe('twMerge', () => {
  it("merges with tv's config: the theme's own utilities, by their groups", () => {
    expect(twMerge('text-label-lg', 'text-primary')).toBe('text-label-lg text-primary')
    expect(twMerge('p-space-100', 'p-0')).toBe('p-0')
    expect(twMerge('rounded-shape-md', 'rounded-inherit')).toBe('rounded-inherit')
  })
})
