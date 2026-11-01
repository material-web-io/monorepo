import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fragment, useState, type ComponentProps } from 'react'
import { twMerge } from '../../lib/tv'
import { Icon } from '../icon'
import { Button } from './button'

// The stories' args are React Aria's Button's: a text button cannot be a toggle, so the toggle
// stories give their buttons a variant, isSelectable and a selection of their own.
type Args = Extract<ComponentProps<typeof Button>, { isSelectable?: false }>

// Every prop of Button, its M3 variants and React Aria's Button's, and its ToggleButton's
// selection: the docgen reads none of them from the imported types, so each is listed here.
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: {
    children: 'Label',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'filled', 'tonal', 'outlined', 'text'],
      table: { category: 'M3' },
    },
    size: {
      control: 'inline-radio',
      options: ['xs', 's', 'm', 'l', 'xl'],
      table: { category: 'M3' },
    },
    shape: { control: 'inline-radio', options: ['round', 'square'], table: { category: 'M3' } },
    hasShapeMorph: { control: 'boolean', table: { category: 'M3' } },
    // The label text, and an icon before it.
    children: { control: 'text', table: { category: 'Parts' } },
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

const variants = ['elevated', 'filled', 'tonal', 'outlined', 'text'] as const
const toggleVariants = ['elevated', 'filled', 'tonal', 'outlined'] as const
const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

/** A click, Space or Enter presses it (`onPress`); given `isSelectable`, it is a toggle, and toggles. */
export const Playground: Story = {
  render: (args) => <Button key={String(args.defaultSelected)} {...args} />,
}

/** The five color styles, by emphasis: elevated, filled, tonal, outlined and text. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-200">
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
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
          <Button {...args} variant={variant} />
          <Button {...args} variant={variant} isDisabled />
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
            <Button key={variant} {...args} variant={variant} size={size}>
              <Icon name="stars_filled" />
              {variant}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
}

/** Round is the default; square has a smaller corner, which grows with the size. */
export const Shapes: Story = {
  render: (args) => (
    <div className="grid grid-cols-[auto_auto_auto] items-center justify-items-start gap-x-space-300 gap-y-space-200">
      {sizes.map((size) => (
        <Fragment key={size}>
          <span className={label}>{size}</span>
          <Button {...args} size={size} shape="round">
            Round
          </Button>
          <Button {...args} size={size} shape="square">
            Square
          </Button>
        </Fragment>
      ))}
    </div>
  ),
}

/** The icon is decorative: the button is still named by its label. */
export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-space-200">
      {variants.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          <Icon name="stars_filled" />
          {variant}
        </Button>
      ))}
    </div>
  ),
}

type ToggleProps = Pick<Args, 'size' | 'shape' | 'hasShapeMorph' | 'isDisabled'> & {
  variant: (typeof toggleVariants)[number]
}

function Toggle({ variant, ...props }: ToggleProps) {
  const [isSelected, setSelected] = useState(false)
  return (
    <Button
      {...props}
      variant={variant}
      isSelectable
      isSelected={isSelected}
      onChange={setSelected}
    >
      {variant}
    </Button>
  )
}

/**
 * Given `isSelectable`, a button is React Aria's ToggleButton, its selection controlled by
 * `isSelected` or starting from `defaultSelected`: selected, it changes its color and swaps its
 * shape between round and square. There is no text toggle, so `isSelectable` is a type error on a
 * text button.
 */
export const Toggle_: Story = {
  name: 'Toggle',
  render: ({ size, shape, hasShapeMorph: shapeMorph }) => (
    <div className="flex flex-wrap items-center gap-space-200">
      {toggleVariants.map((variant) => (
        <Toggle
          key={variant}
          variant={variant}
          size={size}
          shape={shape}
          hasShapeMorph={shapeMorph}
        />
      ))}
    </div>
  ),
}

/** Every toggle variant unselected and selected, round and square, enabled and disabled. */
export const ToggleStates: Story = {
  render: ({ size, hasShapeMorph: shapeMorph }) => (
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
      {toggleVariants.map((variant) => (
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
            <Button
              key={i}
              variant={variant}
              size={size}
              shape={shape}
              hasShapeMorph={shapeMorph}
              isSelectable
              isSelected={isSelected}
              isDisabled={isDisabled}
            >
              {variant}
            </Button>
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
      <Button {...args} size="l" hasShapeMorph>
        Morphs
      </Button>
      <Button {...args} size="l">
        Stays
      </Button>
      <Toggle variant="tonal" size="l" shape={args.shape} hasShapeMorph />
    </div>
  ),
}

/**
 * Pending, a button shows its loading indicator alone, in its label's color, and keeps its size
 * and colors; it ignores presses but keeps the focus. A pending toggle keeps its selection, and
 * the colors and shape that show it, and cannot be toggled. Every color style, and every toggle
 * unselected and selected.
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
          <Button {...args} variant={variant} />
          <Button {...args} variant={variant} isPending />
          {[false, true].map((isSelected) =>
            variant === 'text' ? (
              <span key={String(isSelected)} />
            ) : (
              <Button
                key={String(isSelected)}
                variant={variant}
                size={args.size}
                shape={args.shape}
                isSelectable
                isSelected={isSelected}
                isPending
              >
                {args.children}
              </Button>
            ),
          )}
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
        <Button key={variant} {...args} variant={variant}>
          <Icon name="stars_filled" />
          {variant}
        </Button>
      ))}
      <Button
        variant="outlined"
        size={args.size}
        shape={args.shape}
        isSelectable
        isSelected
        isDisabled
      >
        <Icon name="stars_filled" />
        selected
      </Button>
    </div>
  ),
}

// Class names are spelled out in full because Tailwind only generates utilities it finds as literal strings.
const densityClass = { '0': '', '-1': 'density-1', '-2': 'density-2', '-3': 'density-3' } as const

/** Extra small and small buttons shrink with the density; the touch target stays 48dp. */
export const Density: Story = {
  render: (args) => (
    <div className="flex flex-col gap-space-200">
      {(['0', '-1', '-2', '-3'] as const).map((density) => (
        <div
          key={density}
          className={twMerge('flex items-center gap-space-200', densityClass[density])}
        >
          <span className={twMerge('w-space-400', label)}>{density}</span>
          <Button {...args} size="xs" variant="tonal">
            Extra small
          </Button>
          <Button {...args} size="s">
            Small
          </Button>
        </div>
      ))}
    </div>
  ),
}
