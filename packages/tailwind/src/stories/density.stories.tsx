import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference page for density: the same 40dp container at each density step.
 * density-1 | density-2 | density-3 on a wrapper sets --density, and the container
 * loses it from py-space-125-variable, the padding above and below its 20dp line of text.
 */
const densities = [
  { density: '0', class: '', value: '0dp', height: '40dp' },
  { density: '-1', class: 'density-1', value: '-4dp', height: '36dp' },
  { density: '-2', class: 'density-2', value: '-8dp', height: '32dp' },
  { density: '-3', class: 'density-3', value: '-12dp', height: '28dp' },
]

function Density() {
  return (
    <div className="box-border flex min-h-screen flex-col gap-space-300 bg-surface p-space-400 font-plain text-on-surface antialiased">
      {densities.map(({ density, class: densityClass, value, height }) => (
        <div key={density} className={twMerge('flex items-center gap-space-300', densityClass)}>
          <div className="w-[120px]">
            <div className="text-title-sm">Density {density}</div>
            <div className="text-body-sm text-on-surface-variant">
              {value} · {height}
            </div>
          </div>
          <div className="grid w-[200px] place-items-center rounded-shape-full bg-secondary-container py-space-125-variable text-label-lg text-on-secondary-container">
            Container
          </div>
        </div>
      ))}
    </div>
  )
}

const meta = {
  title: 'Styles/Density',
  component: Density,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Density>

export default meta
type Story = StoryObj<typeof meta>

export const Steps: Story = { name: 'Density steps' }
