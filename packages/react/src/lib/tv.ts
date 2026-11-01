import { extendTailwindMerge, validators } from 'tailwind-merge'
import { createTV } from 'tailwind-variants'

/**
 * `tv` preconfigured for this design system.
 *
 * tailwind-merge only knows Tailwind's built-in scales, so without this it
 * would treat `text-label-lg` (a font size) as a text *color* and drop it when
 * merged with `text-primary`. Keep these lists in sync with the theme's CSS
 * (packages/tailwind/src) and with the components' own.
 */
const typeScale = ['display', 'headline', 'title', 'body', 'label'].flatMap((role) =>
  ['lg', 'md', 'sm'].flatMap((size) => [`${role}-${size}`, `${role}-${size}-emphasized`]),
)

const iconSizes = ['18', '20', '24', '28', '32', '36', '40', '48']
const iconScale = iconSizes.map((size) => `icon-${size}`)

const opacityScale = [
  'state-hover',
  'state-focus',
  'state-pressed',
  'state-dragged',
  'disabled-content',
  'disabled-container',
]

const springs = ['fast', 'default', 'slow'].flatMap((speed) =>
  ['spatial', 'effects'].map((type) => `spring-${speed}-${type}`),
)

const durationScale = [
  ...['short', 'medium', 'long', 'extra-long'].flatMap((group) =>
    [1, 2, 3, 4].map((step) => `${group}-${step}`),
  ),
  ...springs,
]

const stackingOrder = [
  'behind',
  'raised',
  'focus-ring',
  'fab',
  'app-bar',
  'navigation',
  'scrim',
  'sheet',
  'dialog',
  'menu',
  'snackbar',
  'tooltip',
]

// The transition presets (transitions.css, and those of a chip, text field, app bar, navigation bar
// and rail), one per component surface and never two at once: a component that wraps another and
// swaps its preset via `className` (FabMenuItem over Button) needs twMerge to know they conflict.
const transitionPresets = [
  'transition-shape-color-shadow',
  'transition-shape-color',
  'transition-space-color-shadow',
  'transition-reveal',
  'transition-fade',
  'transition-fade-visibility',
  'transition-color-shadow',
  'transition-width-fade-color-shadow',
  'transition-fab-menu-button',
  'transition-list-item',
  'transition-chip',
  'transition-chip-selected',
  'transition-text-field',
  'transition-app-bar',
  'transition-navigation-bar-indicator',
  'transition-navigation-rail-progress',
  'transition-navigation-rail-width',
  'transition-navigation-rail-indicator',
  'transition-navigation-rail-label',
  'transition-navigation-rail-section-in',
  'transition-navigation-rail-section-out',
  'transition-navigation-rail-hidden',
]

// The theme's spacing tokens (spacing.css), space-0 ... space-900: named, not numbered, so
// unknown to tailwind-merge, and a padding of one would not give way to a later p-0.
const spacingScale = [
  0, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 450, 500, 600, 700, 800, 900,
].map((step) => `space-${step}`)

// The text field's spacing token (text-field.css), named as well.
const textFieldSpacing = ['text-field-icon']

// The tabs' spacing token (tabs.css), a scrollable list's offset from its ends, the same.
const tabsSpacing = ['tab-list-offset']

// The density spacing (spacing.css), space-<n>-variable, and under the same names the round corner
// of a box padded with it (shape.css): py-space-200-variable, rounded-space-200-variable.
const densityScale = spacingScale.map((step) => `${step}-variable`)

const twMergeConfig = {
  extend: {
    classGroups: {
      opacity: [{ opacity: opacityScale }],
      duration: [{ duration: durationScale }],
      z: [{ z: stackingOrder }],
      'focus-ring': ['focus-ring', 'focus-ring-inset', 'focus-ring-icon'],
      'border-w': ['container-border'],
      rounded: ['rounded-inherit'],
      'rounded-t': ['rounded-t-inherit'],
      'rounded-b': ['rounded-b-inherit'],
      // A shape (shape-library.css), the library's, one of a --shape-<name> of your own or
      // shape-none: a clip-path, one at a time. shape-rotate-<n> is taken by its own group first.
      shape: [{ shape: [() => true] }],
      // How far a shape is turned (shape-library.css): one angle at a time, its spin aside.
      'shape-rotate': [{ 'shape-rotate': [validators.isInteger, validators.isArbitraryValue] }],
      // A shape's spin (shape-library.css): an animation, and a turn as well (conflicts below).
      'shape-spin': ['animate-shape-spin'],
      tracking: ['tracking-0'],
      'transition-preset': transitionPresets,
      // How much of a bottom sheet shows partially expanded (bottom-sheet.css): one height at a time.
      'bottom-sheet-peek': [{ 'bottom-sheet-peek': [() => true] }],
      // And how far short of the top it is at its full height.
      'bottom-sheet-top': [{ 'bottom-sheet-top': [() => true] }],
      // How wide a side sheet is (side-sheet.css): one width at a time.
      'side-sheet-width': [{ 'side-sheet-width': [() => true] }],
      // An Icon's size, fill and grade (icon.css): one of each at a time.
      'icon-size': [{ icon: [validators.isNumber, validators.isArbitraryLength] }],
      'icon-fill': ['icon-filled', 'icon-outlined'],
      'icon-grade': [{ 'icon-grade': [() => true] }],
    },
    theme: {
      spacing: [...spacingScale, ...densityScale, ...textFieldSpacing, ...tabsSpacing],
      text: [...typeScale, ...iconScale, 'slider-value'],
      'font-weight': ['regular'],
      radius: [
        'shape-none',
        'shape-xs',
        'shape-sm',
        'shape-md',
        'shape-lg',
        'shape-lg-inc',
        'shape-xl',
        'shape-xl-inc',
        'shape-2xl',
        'shape-full',
        'checkbox-container',
        ...densityScale,
      ],
      shadow: [0, 1, 2, 3, 4, 5].map((level) => `elevation-${level}`),
      ease: [
        'linear',
        'standard',
        'standard-accelerate',
        'standard-decelerate',
        'emphasized',
        'emphasized-accelerate',
        'emphasized-decelerate',
        ...springs,
      ],
    },
    // Tailwind's rotate-* comes after a shape's turn and spin in the stylesheet: they drop each
    // other, the later kept. The spin is an animation too, one at a time with Tailwind's.
    conflictingClassGroups: {
      'shape-rotate': ['rotate'],
      'shape-spin': ['animate', 'rotate'],
      rotate: ['shape-rotate', 'shape-spin'],
      animate: ['shape-spin'],
    },
  },
}

export const tv = createTV({ twMergeConfig })

/** tailwind-merge with the same config, for classes merged without a `tv()`. */
export const twMerge = extendTailwindMerge<string, string>(twMergeConfig)

export type { VariantProps } from 'tailwind-variants'
