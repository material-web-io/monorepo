import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference page for the shape scale: each box is rounded with its own
 * utility (rounded-shape-md, ...) and captioned with the corner size it should
 * resolve to. The bracket in the bottom-right corner traces the curve with
 * the matching rounded-br-shape-* utility, so a radius larger than the bracket
 * shows as a plain quarter arc. The class names are spelled out in full
 * because Tailwind only generates utilities it finds as literal strings.
 */
const corners = [
  {
    label: 'None',
    value: '0dp',
    box: 'rounded-shape-none',
    corner: 'rounded-br-shape-none',
  },
  {
    label: 'Extra-small',
    value: '4dp',
    box: 'rounded-shape-xs',
    corner: 'rounded-br-shape-xs',
  },
  {
    label: 'Small',
    value: '8dp',
    box: 'rounded-shape-sm',
    corner: 'rounded-br-shape-sm',
  },
  {
    label: 'Medium',
    value: '12dp',
    box: 'rounded-shape-md',
    corner: 'rounded-br-shape-md',
  },
  {
    label: 'Large',
    value: '16dp',
    box: 'rounded-shape-lg',
    corner: 'rounded-br-shape-lg',
  },
  {
    label: 'Large-increased',
    value: '20dp',
    box: 'rounded-shape-lg-inc',
    corner: 'rounded-br-shape-lg-inc',
  },
  {
    label: 'Extra-large',
    value: '28dp',
    box: 'rounded-shape-xl',
    corner: 'rounded-br-shape-xl',
  },
  {
    label: 'Extra-large-increased',
    value: '32dp',
    box: 'rounded-shape-xl-inc',
    corner: 'rounded-br-shape-xl-inc',
  },
  {
    label: 'Extra-extra-large',
    value: '48dp',
    box: 'rounded-shape-2xl',
    corner: 'rounded-br-shape-2xl',
  },
  {
    label: 'Full',
    value: '50%',
    box: 'rounded-shape-full',
    corner: 'rounded-br-shape-full',
  },
]

function CornerRadiusScale() {
  return (
    // data-theme pins the scheme whatever the toolbar theme says. The page itself stays
    // light in both, so its text uses a fixed neutral, not a role.
    <div
      data-theme="light"
      className="box-border min-h-screen bg-[#f4f4f4] px-space-400 py-space-700 font-plain text-[#444] antialiased"
    >
      <div className="grid grid-cols-5 gap-x-[34px] gap-y-[70px]">
        {corners.map(({ label, value, box, corner }) => (
          <div key={label} className="text-center">
            <div className={twMerge('relative h-[103px] bg-primary-container', box)}>
              <div
                className={twMerge(
                  'absolute right-0 bottom-0 size-[49px] border-r-[3px] border-b-[3px] border-primary',
                  corner,
                )}
              />
            </div>
            <div className="mt-space-300 text-title-md">{label}</div>
            <div className="mt-space-50 text-label-md">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * The shape library as Material's shape set lays it out: seven to a row, each shape cut from a
 * square box with its shape-* utility and captioned with the set's name for it.
 */
const shapes = [
  ['Circle', 'shape-circle'],
  ['Square', 'shape-square'],
  ['Slanted', 'shape-slanted'],
  ['Arch', 'shape-arch'],
  ['Fan', 'shape-fan'],
  ['Arrow', 'shape-arrow'],
  ['Semicircle', 'shape-semicircle'],
  ['Oval', 'shape-oval'],
  ['Pill', 'shape-pill'],
  ['Triangle', 'shape-triangle'],
  ['Diamond', 'shape-diamond'],
  ['Clamshell', 'shape-clamshell'],
  ['Pentagon', 'shape-pentagon'],
  ['Gem', 'shape-gem'],
  ['Very sunny', 'shape-very-sunny'],
  ['Sunny', 'shape-sunny'],
  ['4-sided cookie', 'shape-4-sided-cookie'],
  ['6-sided cookie', 'shape-6-sided-cookie'],
  ['7-sided cookie', 'shape-7-sided-cookie'],
  ['9-sided cookie', 'shape-9-sided-cookie'],
  ['12-sided cookie', 'shape-12-sided-cookie'],
  ['Ghost-ish', 'shape-ghost-ish'],
  ['4-leaf clover', 'shape-4-leaf-clover'],
  ['8-leaf clover', 'shape-8-leaf-clover'],
  ['Burst', 'shape-burst'],
  ['Soft burst', 'shape-soft-burst'],
  ['Boom', 'shape-boom'],
  ['Soft boom', 'shape-soft-boom'],
  ['Flower', 'shape-flower'],
  ['Puffy', 'shape-puffy'],
  ['Puffy diamond', 'shape-puffy-diamond'],
  ['Pixel circle', 'shape-pixel-circle'],
  ['Pixel triangle', 'shape-pixel-triangle'],
  ['Bun', 'shape-bun'],
  ['Heart', 'shape-heart'],
] as const

function ShapeLibrary() {
  return (
    <div
      data-theme="light"
      className="box-border min-h-screen bg-[#f4f4f4] px-space-400 py-space-700 font-plain text-[#444] antialiased"
    >
      <div className="grid grid-cols-7 gap-x-[34px] gap-y-space-500">
        {shapes.map(([label, shape]) => (
          <div key={label} className="text-center">
            <div className={twMerge('aspect-square w-full bg-primary', shape)} />
            <div className="mt-space-200 text-label-md">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/*
 * A shape turned and not its content: the picture stays upright while the shape turns by
 * shape-rotate-<n> or spins with animate-shape-spin. The angles are whole class names, since Tailwind
 * only generates the utilities it finds written out.
 */
const turns = {
  0: 'shape-rotate-0',
  15: 'shape-rotate-15',
  30: 'shape-rotate-30',
  45: 'shape-rotate-45',
  90: 'shape-rotate-90',
  135: 'shape-rotate-135',
  180: 'shape-rotate-180',
  270: 'shape-rotate-270',
} as const

const photo = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" fill="#E8DEF8"/><circle cx="112" cy="52" r="22" fill="#FFD8E4"/><path d="M0 118 52 76 92 108 122 88 160 116V160H0Z" fill="#6750A4"/></svg>',
)}`

type ShapeRotationProps = {
  shape: (typeof shapes)[number][1]
  rotate: keyof typeof turns
  isSpinning: boolean
}

function ShapeRotation({ shape, rotate, isSpinning }: ShapeRotationProps) {
  return (
    <div className={twMerge('size-80', shape, turns[rotate], isSpinning && 'animate-shape-spin')}>
      <img src={photo} alt="" className="size-full object-cover" />
    </div>
  )
}

const meta = {
  title: 'Styles/Shape',
  component: CornerRadiusScale,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CornerRadiusScale>

export default meta
type Story = StoryObj<typeof meta>

export const CornerRadius: Story = { name: 'Corner radius scale' }

export const Library: Story = { name: 'Shape library', render: () => <ShapeLibrary /> }

export const Rotation: StoryObj<typeof ShapeRotation> = {
  name: 'Shape rotation',
  parameters: { layout: 'centered' },
  args: { shape: 'shape-9-sided-cookie', rotate: 0, isSpinning: true },
  argTypes: {
    shape: {
      control: {
        type: 'select',
        labels: Object.fromEntries(shapes.map(([label, shape]) => [shape, label])),
      },
      options: shapes.map(([, shape]) => shape),
      table: { category: 'M3' },
    },
    rotate: {
      control: 'select',
      options: Object.keys(turns).map(Number),
      table: { category: 'M3' },
    },
    isSpinning: { control: 'boolean', table: { category: 'M3' } },
  },
  render: (args) => <ShapeRotation {...args} />,
}
