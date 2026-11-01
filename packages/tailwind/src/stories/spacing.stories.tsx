import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference page for the spacing scale: each bar is sized with its own utility
 * (size-space-100, ...) and captioned with the token and the size it should resolve
 * to. The class names are spelled out in full because Tailwind only generates
 * utilities it finds as literal strings.
 */
const steps = [
  { token: 'Space 0', value: '0dp', bar: 'size-space-0' },
  { token: 'Space 25', value: '2dp', bar: 'size-space-25' },
  { token: 'Space 50', value: '4dp', bar: 'size-space-50' },
  { token: 'Space 75', value: '6dp', bar: 'size-space-75' },
  { token: 'Space 100', value: '8dp', bar: 'size-space-100' },
  { token: 'Space 125', value: '10dp', bar: 'size-space-125' },
  { token: 'Space 150', value: '12dp', bar: 'size-space-150' },
  { token: 'Space 175', value: '14dp', bar: 'size-space-175' },
  { token: 'Space 200', value: '16dp', bar: 'size-space-200' },
  { token: 'Space 250', value: '20dp', bar: 'size-space-250' },
  { token: 'Space 300', value: '24dp', bar: 'size-space-300' },
  { token: 'Space 400', value: '32dp', bar: 'size-space-400' },
  { token: 'Space 450', value: '36dp', bar: 'size-space-450' },
  { token: 'Space 500', value: '40dp', bar: 'size-space-500' },
  { token: 'Space 600', value: '48dp', bar: 'size-space-600' },
  { token: 'Space 700', value: '56dp', bar: 'size-space-700' },
  { token: 'Space 800', value: '64dp', bar: 'size-space-800' },
  { token: 'Space 900', value: '72dp', bar: 'size-space-900' },
]

function Spacing() {
  return (
    <div className="box-border min-h-screen bg-surface p-space-400 font-plain text-on-surface antialiased">
      <table className="border-separate border-spacing-y-space-100 text-left">
        <thead className="text-label-md text-on-surface-variant">
          <tr>
            <th className="pe-space-400 font-medium">Token</th>
            <th className="pe-space-400 font-medium">Size</th>
            <th className="font-medium">Utility</th>
          </tr>
        </thead>
        <tbody>
          {steps.map(({ token, value, bar }) => (
            <tr key={token}>
              <td className="pe-space-400 text-title-sm">{token}</td>
              <td className="pe-space-400 text-body-md text-on-surface-variant">{value}</td>
              <td>
                <div className={twMerge(bar, 'bg-primary-container outline outline-primary')} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const meta = {
  title: 'Styles/Spacing',
  component: Spacing,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Spacing>

export default meta
type Story = StoryObj<typeof meta>

export const Scale: Story = { name: 'Spacing scale' }
