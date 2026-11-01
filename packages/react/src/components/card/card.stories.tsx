import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from '../button'
import { Card } from './card'

const meta = {
  title: 'Components/Card',
  component: Card,
  args: { variant: 'elevated' },
  // Every prop, the docgen reads none of them from the imported types; event handlers left out.
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['elevated', 'filled', 'outlined'],
      table: { category: 'M3' },
    },
    children: { control: false, table: { category: 'Parts' } },
    role: { control: 'text', table: { category: 'Accessibility' } },
    'aria-label': { control: 'text', table: { category: 'Accessibility' } },
    'aria-labelledby': { control: 'text', table: { category: 'Accessibility' } },
    'aria-describedby': { control: 'text', table: { category: 'Accessibility' } },
    id: { control: 'text', table: { category: 'DOM' } },
    dir: { control: 'inline-radio', options: ['ltr', 'rtl', 'auto'], table: { category: 'DOM' } },
    lang: { control: 'text', table: { category: 'DOM' } },
    hidden: { control: 'boolean', table: { category: 'DOM' } },
    inert: { control: 'boolean', table: { category: 'DOM' } },
    translate: { control: 'inline-radio', options: ['yes', 'no'], table: { category: 'DOM' } },
    suppressHydrationWarning: { control: 'boolean', table: { category: 'DOM' } },
    className: { control: 'text', table: { category: 'Styling' } },
    style: { control: 'object', table: { category: 'Styling' } },
    ref: { control: false, table: { category: 'Styling' } },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

/** A picture for the stories, drawn here so they load nothing: a block of color with a landscape in it. */
const picture = (fill: string, stroke: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="${fill}"/><path d="M0 150 L90 80 L150 130 L200 100 L320 160 L320 180 L0 180 Z" fill="${stroke}" opacity=".6"/><circle cx="250" cy="50" r="22" fill="${stroke}" opacity=".8"/></svg>`,
  )}`

const dusk = picture('#E8DEF8', '#6750A4')
const dawn = picture('#FFD8E4', '#7D5260')

const summary =
  'A behind-the-scenes look at the band’s third studio album, recorded over one winter in a converted lighthouse.'

/** A card holds what is written in it, each thing drawn where it is written: an image that bleeds to the card's edges and is clipped at its corners, text 16dp in from them, and a row of buttons, each a tab stop of its own. */
export const Playground: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <img src={dusk} alt="" className="h-35 w-full object-cover" />
      <div className="flex flex-col gap-space-200 p-space-200">
        <div>
          <div className="text-title-md">Glass & Grace</div>
          <div className="text-body-md text-on-surface-variant">From your recent favorites</div>
        </div>
        <p className="m-0 text-body-md text-on-surface-variant">{summary}</p>
      </div>
      <div className="flex justify-end gap-space-100 p-space-200 pt-0">
        <Button variant="outlined">Share</Button>
        <Button>Play</Button>
      </div>
    </Card>
  ),
}

/** The three variants side by side. Each provides the same legibility and functionality, so the variant you use depends on style alone. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex gap-space-300">
      {(['elevated', 'filled', 'outlined'] as const).map((variant) => (
        <Card key={variant} {...args} variant={variant} className="w-60">
          <div className="flex flex-col gap-space-200 p-space-200">
            <div>
              <div className="text-title-md">{variant[0]!.toUpperCase() + variant.slice(1)}</div>
              <div className="text-body-md text-on-surface-variant">Card</div>
            </div>
            <p className="m-0 text-body-md text-on-surface-variant">
              {variant === 'elevated' &&
                'Elevated cards have a drop shadow, providing more separation from the background than filled cards, but less than outlined cards.'}
              {variant === 'filled' &&
                'Filled cards provide subtle separation from the background. This has less emphasis than elevated or outlined cards.'}
              {variant === 'outlined' &&
                'Outlined cards have a visual boundary around the container. This can provide greater emphasis than the other variants.'}
            </p>
          </div>
        </Card>
      ))}
    </div>
  ),
}

const albums = [
  ['Eye Rhymes', 'Glass & Grace'],
  ['Warped Speed', 'Trapezoid'],
  ['Personal Voice', 'Decorations'],
  ['NBR', '21st Century Strangers'],
] as const

/** Cards can be displayed together in a grid, vertical list, or carousel, 8dp apart at most. */
export const Collection: Story = {
  render: (args) => (
    <div className="grid w-120 grid-cols-2 gap-space-100">
      {albums.map(([title, artist], i) => (
        <Card key={title} {...args}>
          <img src={i % 2 ? dawn : dusk} alt="" className="h-30 w-full object-cover" />
          <div className="p-space-200">
            <div className="text-title-md">{title}</div>
            <div className="text-body-md text-on-surface-variant">{artist}</div>
          </div>
        </Card>
      ))}
    </div>
  ),
}
