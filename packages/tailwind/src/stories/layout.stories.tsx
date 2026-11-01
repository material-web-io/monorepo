import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference page for the window size classes. Each chip lights up while the
 * viewport is in its class, using the breakpoint variants (medium-screen:, max-medium-screen:,
 * ...), so resize the preview to watch it change. The class names are spelled
 * out in full because Tailwind only generates utilities it finds as literal
 * strings.
 */
const classes = [
  {
    label: 'Compact',
    range: '< 600dp',
    active: 'max-medium-screen:bg-primary max-medium-screen:text-on-primary',
  },
  {
    label: 'Medium',
    range: '600 - 839dp',
    active:
      'medium-screen:max-expanded-screen:bg-primary medium-screen:max-expanded-screen:text-on-primary',
  },
  {
    label: 'Expanded',
    range: '840 - 1199dp',
    active:
      'expanded-screen:max-large-screen:bg-primary expanded-screen:max-large-screen:text-on-primary',
  },
  {
    label: 'Large',
    range: '1200 - 1599dp',
    active:
      'large-screen:max-extra-large-screen:bg-primary large-screen:max-extra-large-screen:text-on-primary',
  },
  {
    label: 'Extra-large',
    range: '≥ 1600dp',
    active: 'extra-large-screen:bg-primary extra-large-screen:text-on-primary',
  },
]

function WindowSizeClasses() {
  return (
    <div className="box-border min-h-screen bg-surface p-space-400 font-plain text-on-surface antialiased">
      <div className="flex flex-wrap gap-space-200">
        {classes.map(({ label, range, active }) => (
          <div
            key={label}
            className={twMerge(
              'w-[160px] rounded-shape-md bg-surface-container-highest p-space-200 text-on-surface',
              active,
            )}
          >
            <div className="text-title-md">{label}</div>
            <div className="text-body-md">{range}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const meta = {
  title: 'Styles/Layout',
  component: WindowSizeClasses,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WindowSizeClasses>

export default meta
type Story = StoryObj<typeof meta>

export const WindowSizeClassesStory: Story = { name: 'Window size classes' }
