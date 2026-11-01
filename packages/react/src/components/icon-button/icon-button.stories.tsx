import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, type ComponentProps } from 'react'
import { twMerge } from '../../lib/tv'
import { Icon } from '../icon'
import { IconButton } from './icon-button'

// The stories' args are React Aria's Button's: the toggle stories give their buttons
// isSelectable and a selection of their own.
type Args = Extract<ComponentProps<typeof IconButton>, { isSelectable?: false }>

// Every prop of IconButton, its M3 variants and React Aria's Button's, and its ToggleButton's
// selection: the docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Icon button',
  component: IconButton,
  parameters: { layout: 'centered' },
  args: { children: <Icon name="stars_filled" />, 'aria-label': 'Favorite' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'tonal', 'outlined', 'standard'],
      table: { category: 'M3' },
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 's', 'm', 'l', 'xl'],
      table: { category: 'M3' },
    },
    width: {
      control: 'inline-radio',
      options: ['narrow', 'default', 'wide'],
      table: { category: 'M3' },
    },
    shape: { control: 'inline-radio', options: ['round', 'square'], table: { category: 'M3' } },
    hasShapeMorph: { control: 'boolean', table: { category: 'M3' } },
    // The icon.
    children: { control: false, table: { category: 'Parts' } },
    // isSelectable makes it a toggle, controlled by isSelected or starting from defaultSelected.
    isSelectable: { control: 'boolean', table: { category: 'Selection' } },
    isSelected: { control: 'boolean', table: { category: 'Selection' } },
    defaultSelected: { control: 'boolean', table: { category: 'Selection' } },
    isDisabled: { control: 'boolean', table: { category: 'State' } },
    isPending: { control: 'boolean', table: { category: 'State' } },
    autoFocus: { control: 'boolean', table: { category: 'State' } },
    excludeFromTabOrder: { control: 'boolean', table: { category: 'State' } },
    preventFocusOnPress: { control: 'boolean', table: { category: 'State' } },
    type: {
      control: 'inline-radio',
      options: ['button', 'submit', 'reset'],
      table: { category: 'Form' },
    },
    name: { control: 'text', table: { category: 'Form' } },
    value: { control: 'text', table: { category: 'Form' } },
    form: { control: 'text', table: { category: 'Form' } },
    formAction: { control: 'text', table: { category: 'Form' } },
    formEncType: { control: 'text', table: { category: 'Form' } },
    formMethod: { control: 'text', table: { category: 'Form' } },
    formNoValidate: { control: 'boolean', table: { category: 'Form' } },
    formTarget: { control: 'text', table: { category: 'Form' } },
    href: { control: 'text', table: { category: 'Link' } },
    target: { control: 'text', table: { category: 'Link' } },
    rel: { control: 'text', table: { category: 'Link' } },
    // It has no visible label, so it needs aria-label or aria-labelledby.
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-details': { control: 'text', table: { category: 'Accessibility' } },
    'aria-controls': { control: 'text', table: { category: 'Accessibility' } },
    'aria-expanded': { control: 'boolean', table: { category: 'Accessibility' } },
    'aria-haspopup': {
      control: 'select',
      options: [false, true, 'menu', 'listbox', 'tree', 'grid', 'dialog'],
      table: { category: 'Accessibility' },
    },
    'aria-pressed': {
      control: 'inline-radio',
      options: [false, true, 'mixed'],
      table: { category: 'Accessibility' },
    },
    'aria-current': {
      control: 'select',
      options: [false, true, 'page', 'step', 'location', 'date', 'time'],
      table: { category: 'Accessibility' },
    },
    'aria-disabled': { control: 'boolean', table: { category: 'Accessibility' } },
    // A <button> unless given, an <a> with the link's props given 'a'.
    elementType: { control: 'text', table: { category: 'DOM' } },
    id: { control: 'text', table: { category: 'DOM' } },
    slot: { control: 'text', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<Args>

export default meta
type Story = StoryObj<Meta<Args>>

const label = 'text-label-md text-on-surface-variant'

const variants = ['filled', 'tonal', 'outlined', 'standard'] as const
const sizes = ['xs', 's', 'm', 'l', 'xl'] as const
const widths = ['narrow', 'default', 'wide'] as const

/** A click, Space or Enter presses it (`onPress`); given `isSelectable`, it is a toggle, and toggles. */
export const Playground: Story = {
  render: (args) => <IconButton key={String(args.defaultSelected)} {...args} />,
}

/** The four color styles, by emphasis: filled, tonal, outlined and standard. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-200">
      {variants.map((variant) => (
        <IconButton key={variant} {...args} variant={variant} />
      ))}
    </div>
  ),
}

/** Every color style, enabled and disabled. Hover, focus and press the enabled ones to see their state layer and ripple. */
export const States: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(2,auto)] items-center justify-items-start gap-x-space-300 gap-y-space-200">
      <span />
      {['Enabled', 'Disabled'].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {variants.map((variant) => (
        <Fragment key={variant}>
          <span className={label}>{variant}</span>
          <IconButton {...args} variant={variant} />
          <IconButton {...args} variant={variant} isDisabled />
        </Fragment>
      ))}
    </div>
  ),
}

/** The five sizes, extra small to extra large; an `Icon` child is sized to match. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-space-200">
      {sizes.map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-space-200">
          <span className={twMerge('w-space-400', label)}>{size}</span>
          {variants.map((variant) => (
            <IconButton key={variant} {...args} variant={variant} size={size} />
          ))}
        </div>
      ))}
    </div>
  ),
}

/** The width changes only how wide the container is; the height comes from the size. */
export const Widths: Story = {
  args: { variant: 'tonal' },
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(3,auto)] items-center justify-items-start gap-x-space-300 gap-y-space-200">
      <span />
      {widths.map((width) => (
        <span key={width} className={label}>
          {width}
        </span>
      ))}
      {sizes.map((size) => (
        <Fragment key={size}>
          <span className={label}>{size}</span>
          {widths.map((width) => (
            <IconButton key={width} {...args} size={size} width={width} />
          ))}
        </Fragment>
      ))}
    </div>
  ),
}

/** Round is the default; square has a smaller corner, which grows with the size. */
export const Shapes: Story = {
  args: { variant: 'filled' },
  render: (args) => (
    <div className="grid grid-cols-[auto_auto_auto] items-center justify-items-start gap-x-space-300 gap-y-space-200">
      {sizes.map((size) => (
        <Fragment key={size}>
          <span className={label}>{size}</span>
          <IconButton {...args} size={size} shape="round" />
          <IconButton {...args} size={size} shape="square" />
        </Fragment>
      ))}
    </div>
  ),
}

type ToggleProps = Pick<
  Args,
  'variant' | 'size' | 'width' | 'shape' | 'hasShapeMorph' | 'isDisabled' | 'aria-label'
>

/** A toggle that keeps its own selection, its icon filled while selected (its children's `isSelected`). */
function Toggle({ 'aria-label': ariaLabel = 'Favorite', ...props }: ToggleProps) {
  return (
    <IconButton {...props} aria-label={ariaLabel} isSelectable>
      {({ isSelected }) => (
        <Icon name="stars_filled" className={isSelected ? 'icon-filled' : undefined} />
      )}
    </IconButton>
  )
}

/**
 * Given `isSelectable`, an icon button is React Aria's ToggleButton, its selection controlled by
 * `isSelected` or starting from `defaultSelected`: selected, it changes its color and swaps its
 * shape between round and square, and its icon is drawn filled. Every color style can be a
 * toggle, the standard one included.
 */
export const Toggle_: Story = {
  name: 'Toggle',
  render: ({ size, width, shape, hasShapeMorph: shapeMorph }) => (
    <div className="flex flex-wrap items-center gap-space-200">
      {variants.map((variant) => (
        <Toggle
          key={variant}
          variant={variant}
          size={size}
          width={width}
          shape={shape}
          hasShapeMorph={shapeMorph}
        />
      ))}
    </div>
  ),
}

/** Every variant unselected and selected, round and square, enabled and disabled. */
export const ToggleStates: Story = {
  render: ({ size, width, hasShapeMorph: shapeMorph }) => (
    <div className="grid grid-cols-[auto_repeat(6,auto)] items-center justify-items-start gap-x-space-300 gap-y-space-200">
      <span />
      {[
        'Round',
        'Round, selected',
        'Square',
        'Square, selected',
        'Disabled',
        'Disabled, selected',
      ].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {variants.map((variant) => (
        <Fragment key={variant}>
          <span className={label}>{variant}</span>
          {(
            [
              ['round', false, false],
              ['round', true, false],
              ['square', false, false],
              ['square', true, false],
              ['round', false, true],
              ['round', true, true],
            ] as const
          ).map(([shape, isSelected, isDisabled], i) => (
            <IconButton
              key={i}
              aria-label="Favorite"
              variant={variant}
              size={size}
              width={width}
              shape={shape}
              hasShapeMorph={shapeMorph}
              isSelectable
              isSelected={isSelected}
              isDisabled={isDisabled}
            >
              <Icon name="stars_filled" className={isSelected ? 'icon-filled' : undefined} />
            </IconButton>
          ))}
        </Fragment>
      ))}
    </div>
  ),
}

/**
 * Press and hold to see the corners morph; it is off unless `shapeMorph` is set. A toggle
 * morphs to the same pressed corner whether selected or not, and swaps its resting shape.
 */
export const PressedShape: Story = {
  render: (args) => (
    <div className="flex items-center gap-space-200">
      <IconButton {...args} variant="filled" size="l" hasShapeMorph />
      <IconButton {...args} variant="filled" size="l" />
      <Toggle variant="tonal" size="l" shape={args.shape} hasShapeMorph />
    </div>
  ),
}

/**
 * Pending, an icon button shows its loading indicator alone, in its icon's color, and keeps its
 * size and colors; it ignores presses but keeps the focus. A pending toggle keeps its selection,
 * and the colors and shape that show it, and cannot be toggled. Every color style, and every
 * toggle unselected and selected.
 */
export const Pending: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_repeat(4,auto)] items-center justify-items-start gap-x-space-300 gap-y-space-200">
      <span />
      {['Enabled', 'Pending', 'Toggle, pending', 'Selected, pending'].map((column) => (
        <span key={column} className={label}>
          {column}
        </span>
      ))}
      {variants.map((variant) => (
        <Fragment key={variant}>
          <span className={label}>{variant}</span>
          <IconButton {...args} variant={variant} />
          <IconButton {...args} variant={variant} isPending />
          {[false, true].map((isSelected) => (
            <IconButton
              key={String(isSelected)}
              aria-label="Favorite"
              variant={variant}
              size={args.size}
              shape={args.shape}
              isSelectable
              isSelected={isSelected}
              isPending
            >
              <Icon name="stars_filled" className={isSelected ? 'icon-filled' : undefined} />
            </IconButton>
          ))}
        </Fragment>
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: { isDisabled: true },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-200">
      {variants.map((variant) => (
        <IconButton key={variant} {...args} variant={variant} />
      ))}
      <IconButton
        aria-label="Favorite"
        variant="outlined"
        size={args.size}
        shape={args.shape}
        isSelectable
        isSelected
        isDisabled
      >
        <Icon name="stars_filled" className="icon-filled" />
      </IconButton>
    </div>
  ),
}

// Class names are spelled out in full because Tailwind only generates utilities it finds as literal strings.
const densityClass = { '0': '', '-1': 'density-1', '-2': 'density-2', '-3': 'density-3' } as const

/** Extra small and small buttons shrink with the density; the touch target stays 48dp. */
export const Density: Story = {
  args: { variant: 'tonal' },
  render: (args) => (
    <div className="flex flex-col gap-space-200">
      {(['0', '-1', '-2', '-3'] as const).map((density) => (
        <div
          key={density}
          className={twMerge('flex items-center gap-space-200', densityClass[density])}
        >
          <span className={twMerge('w-space-400', label)}>{density}</span>
          <IconButton {...args} size="xs" />
          <IconButton {...args} size="s" />
          <IconButton {...args} size="s" width="wide" />
        </div>
      ))}
    </div>
  ),
}
