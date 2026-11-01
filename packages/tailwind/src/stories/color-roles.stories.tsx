import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference pages for the color roles, grouped like the M3 color scheme
 * diagram: each box is a role painted with its own utility (bg-primary) and
 * captioned with the tonal palette tone it points at (P-40 in light, P-80 in
 * dark). The class names are spelled out in full because Tailwind only
 * generates utilities it finds as literal strings.
 *
 * Both pages share one layout. Box positions are measured from the reference
 * screenshots (CSS px, relative to the first box).
 */
type Theme = 'light' | 'dark'

const roles: {
  label: string
  /** Tone codes: [light, dark]. */
  codes: [string, string]
  classes: string
  /** Sets the code on the label's line instead of at the bottom edge. */
  inline?: boolean
  left: number
  top: number
  width: number
  height: number
}[] = [
  {
    label: 'Primary',
    codes: ['P-40', 'P-80'],
    classes: 'bg-primary text-on-primary',
    left: 0,
    top: 0,
    width: 220.19,
    height: 57.25,
  },
  {
    label: 'On Primary',
    codes: ['P-100', 'P-20'],
    classes: 'bg-on-primary text-primary',
    left: 0,
    top: 57.25,
    width: 220.19,
    height: 44.93,
  },
  {
    label: 'Primary Container',
    codes: ['P-90', 'P-30'],
    classes: 'bg-primary-container text-on-primary-container',
    left: 0,
    top: 106.69,
    width: 220.19,
    height: 57.31,
  },
  {
    label: 'On Primary Container',
    codes: ['P-30', 'P-90'],
    classes: 'bg-on-primary-container text-primary-container',
    left: 0,
    top: 164,
    width: 220.19,
    height: 44.94,
  },
  {
    label: 'Primary Fixed',
    codes: ['P-90', 'P-90'],
    classes: 'bg-primary-fixed text-on-primary-fixed',
    left: 0,
    top: 226.94,
    width: 110.09,
    height: 62.88,
  },
  {
    label: 'Primary Fixed Dim',
    codes: ['P-80', 'P-80'],
    classes: 'bg-primary-fixed-dim text-on-primary-fixed-variant',
    left: 110.09,
    top: 226.94,
    width: 110.09,
    height: 62.88,
  },
  {
    label: 'On Primary Fixed',
    codes: ['P-10', 'P-10'],
    classes: 'bg-on-primary-fixed text-primary-fixed',
    inline: true,
    left: 0,
    top: 289.81,
    width: 220.19,
    height: 40.44,
  },
  {
    label: 'On Primary Fixed Variant',
    codes: ['P-30', 'P-30'],
    classes: 'bg-on-primary-fixed-variant text-primary-fixed-dim',
    inline: true,
    left: 0,
    top: 330.25,
    width: 220.19,
    height: 40.44,
  },
  {
    label: 'Secondary',
    codes: ['S-40', 'S-80'],
    classes: 'bg-secondary text-on-secondary',
    left: 224.69,
    top: 0,
    width: 220.19,
    height: 57.25,
  },
  {
    label: 'On Secondary',
    codes: ['S-100', 'S-20'],
    classes: 'bg-on-secondary text-secondary',
    left: 224.69,
    top: 57.25,
    width: 220.19,
    height: 44.93,
  },
  {
    label: 'Secondary Container',
    codes: ['S-90', 'S-30'],
    classes: 'bg-secondary-container text-on-secondary-container',
    left: 224.69,
    top: 106.69,
    width: 220.19,
    height: 57.31,
  },
  {
    label: 'On Secondary Container',
    codes: ['S-30', 'S-90'],
    classes: 'bg-on-secondary-container text-secondary-container',
    left: 224.69,
    top: 164,
    width: 220.19,
    height: 44.94,
  },
  {
    label: 'Secondary Fixed',
    codes: ['S-90', 'S-90'],
    classes: 'bg-secondary-fixed text-on-secondary-fixed',
    left: 224.69,
    top: 226.94,
    width: 110.09,
    height: 62.88,
  },
  {
    label: 'Secondary Fixed Dim',
    codes: ['S-80', 'S-80'],
    classes: 'bg-secondary-fixed-dim text-on-secondary-fixed-variant',
    left: 334.78,
    top: 226.94,
    width: 110.09,
    height: 62.88,
  },
  {
    label: 'On Secondary Fixed',
    codes: ['S-10', 'S-10'],
    classes: 'bg-on-secondary-fixed text-secondary-fixed',
    inline: true,
    left: 224.69,
    top: 289.81,
    width: 220.19,
    height: 40.44,
  },
  {
    label: 'On Secondary Fixed Variant',
    codes: ['S-30', 'S-30'],
    classes: 'bg-on-secondary-fixed-variant text-secondary-fixed-dim',
    inline: true,
    left: 224.69,
    top: 330.25,
    width: 220.19,
    height: 40.44,
  },
  {
    label: 'Tertiary',
    codes: ['T-40', 'T-80'],
    classes: 'bg-tertiary text-on-tertiary',
    left: 449.38,
    top: 0,
    width: 220.18,
    height: 57.25,
  },
  {
    label: 'On Tertiary',
    codes: ['T-100', 'T-20'],
    classes: 'bg-on-tertiary text-tertiary',
    left: 449.38,
    top: 57.25,
    width: 220.18,
    height: 44.93,
  },
  {
    label: 'Tertiary Container',
    codes: ['T-90', 'T-30'],
    classes: 'bg-tertiary-container text-on-tertiary-container',
    left: 449.38,
    top: 106.69,
    width: 220.18,
    height: 57.31,
  },
  {
    label: 'On Tertiary Container',
    codes: ['T-30', 'T-90'],
    classes: 'bg-on-tertiary-container text-tertiary-container',
    left: 449.38,
    top: 164,
    width: 220.18,
    height: 44.94,
  },
  {
    label: 'Tertiary Fixed',
    codes: ['T-90', 'T-90'],
    classes: 'bg-tertiary-fixed text-on-tertiary-fixed',
    left: 449.38,
    top: 226.94,
    width: 110.09,
    height: 62.88,
  },
  {
    label: 'Tertiary Fixed Dim',
    codes: ['T-80', 'T-80'],
    classes: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
    left: 559.47,
    top: 226.94,
    width: 110.09,
    height: 62.88,
  },
  {
    label: 'On Tertiary Fixed',
    codes: ['T-10', 'T-10'],
    classes: 'bg-on-tertiary-fixed text-tertiary-fixed',
    inline: true,
    left: 449.38,
    top: 289.81,
    width: 220.18,
    height: 40.44,
  },
  {
    label: 'On Tertiary Fixed Variant',
    codes: ['T-30', 'T-30'],
    classes: 'bg-on-tertiary-fixed-variant text-tertiary-fixed-dim',
    inline: true,
    left: 449.38,
    top: 330.25,
    width: 220.18,
    height: 40.44,
  },
  {
    label: 'Error',
    codes: ['E-40', 'E-80'],
    classes: 'bg-error text-on-error',
    left: 687.57,
    top: 0,
    width: 220.18,
    height: 57.25,
  },
  {
    label: 'On Error',
    codes: ['E-100', 'E-20'],
    classes: 'bg-on-error text-error',
    left: 687.57,
    top: 57.25,
    width: 220.18,
    height: 44.93,
  },
  {
    label: 'Error Container',
    codes: ['E-90', 'E-30'],
    classes: 'bg-error-container text-on-error-container',
    left: 687.57,
    top: 106.69,
    width: 220.18,
    height: 57.31,
  },
  {
    label: 'On Error Container',
    codes: ['E-30', 'E-90'],
    classes: 'bg-on-error-container text-error-container',
    left: 687.57,
    top: 164,
    width: 220.18,
    height: 44.94,
  },
  {
    label: 'Surface Dim',
    codes: ['N-87', 'N-6'],
    classes: 'bg-surface-dim text-on-surface',
    left: 0,
    top: 388.69,
    width: 223.19,
    height: 77.5,
  },
  {
    label: 'Surface',
    codes: ['N-98', 'N-6'],
    classes: 'bg-surface text-on-surface',
    left: 223.19,
    top: 388.69,
    width: 223.19,
    height: 77.5,
  },
  {
    label: 'Surface Bright',
    codes: ['N-98', 'N-24'],
    classes: 'bg-surface-bright text-on-surface',
    left: 446.39,
    top: 388.69,
    width: 223.17,
    height: 77.5,
  },
  {
    label: 'Surf. Container Lowest',
    codes: ['N-100', 'N-4'],
    classes: 'bg-surface-container-lowest text-on-surface',
    left: 0,
    top: 470.67,
    width: 133.91,
    height: 77.5,
  },
  {
    label: 'Surf. Container Low',
    codes: ['N-96', 'N-10'],
    classes: 'bg-surface-container-low text-on-surface',
    left: 133.91,
    top: 470.67,
    width: 133.91,
    height: 77.5,
  },
  {
    label: 'Surf. Container',
    codes: ['N-94', 'N-12'],
    classes: 'bg-surface-container text-on-surface',
    left: 267.83,
    top: 470.67,
    width: 133.91,
    height: 77.5,
  },
  {
    label: 'Surf. Container High',
    codes: ['N-92', 'N-17'],
    classes: 'bg-surface-container-high text-on-surface',
    left: 401.74,
    top: 470.67,
    width: 133.91,
    height: 77.5,
  },
  {
    label: 'Surf. Container Highest',
    codes: ['N-90', 'N-22'],
    classes: 'bg-surface-container-highest text-on-surface',
    left: 535.66,
    top: 470.67,
    width: 133.91,
    height: 77.5,
  },
  {
    label: 'On Surface',
    codes: ['N-10', 'N-90'],
    classes: 'bg-on-surface text-surface',
    left: 0,
    top: 552.68,
    width: 167.39,
    height: 44.94,
  },
  {
    label: 'On Surface Var.',
    codes: ['NV-30', 'NV-80'],
    classes: 'bg-on-surface-variant text-surface',
    left: 167.39,
    top: 552.68,
    width: 167.39,
    height: 44.94,
  },
  {
    label: 'Outline',
    codes: ['NV-50', 'NV-60'],
    classes: 'bg-outline text-surface',
    left: 334.78,
    top: 552.68,
    width: 167.39,
    height: 44.94,
  },
  {
    label: 'Outline Variant',
    codes: ['NV-80', 'NV-30'],
    classes: 'bg-outline-variant text-inverse-surface',
    left: 502.17,
    top: 552.68,
    width: 167.39,
    height: 44.94,
  },
  {
    label: 'Inverse Surface',
    codes: ['N-20', 'N-90'],
    classes: 'bg-inverse-surface text-inverse-on-surface',
    left: 687.57,
    top: 388.69,
    width: 220.18,
    height: 53.94,
  },
  {
    label: 'Inverse On Surface',
    codes: ['N-95', 'N-20'],
    classes: 'bg-inverse-on-surface text-inverse-surface',
    inline: true,
    left: 687.57,
    top: 442.62,
    width: 220.18,
    height: 42.66,
  },
  {
    label: 'Inverse Primary',
    codes: ['P-80', 'P-40'],
    classes: 'bg-inverse-primary text-on-primary-container',
    left: 687.57,
    top: 489.81,
    width: 220.18,
    height: 44.94,
  },
  {
    label: 'Scrim',
    codes: ['N-0', 'N-0'],
    classes: 'bg-scrim text-neutral-100',
    left: 687.57,
    top: 552.69,
    width: 101.06,
    height: 44.93,
  },
  {
    label: 'Shadow',
    codes: ['N-0', 'N-0'],
    classes: 'bg-shadow text-neutral-100',
    left: 806.62,
    top: 552.69,
    width: 101.12,
    height: 44.93,
  },
]

// Where the first box sits on the page (CSS px).
const origin = { x: 27, y: 118.375 }

function ColorRoles({ theme }: { theme: Theme }) {
  return (
    // data-theme pins the scheme whatever the toolbar theme says. The page itself stays
    // light in both, so its title uses a fixed neutral, not a role.
    <div
      data-theme={theme}
      className="relative mx-auto h-[790px] w-[989px] bg-[#f5f5f5] font-plain text-neutral-10 antialiased"
    >
      <h2 className="absolute top-[32.15px] left-[26.2px] m-0 text-[18px] leading-none font-[500] tracking-[0.17px]">
        {theme === 'light' ? 'Light Theme' : 'Dark Theme'}
      </h2>
      {roles.map(({ label, codes, classes, inline, left, top, width, height }) => (
        <div
          key={label}
          className={twMerge(
            'absolute box-border pt-[11.75px] pr-[6.75px] pl-[13.5px] text-[12.375px] leading-[18px] font-[500] tracking-[0.5625px]',
            classes,
          )}
          style={{ left: origin.x + left, top: origin.y + top, width, height }}
        >
          {label}
          <span
            className={twMerge(
              'absolute right-[13px]',
              inline ? 'top-[11.75px]' : 'bottom-[12.75px]',
            )}
          >
            {codes[theme === 'light' ? 0 : 1]}
          </span>
        </div>
      ))}
    </div>
  )
}

const meta = {
  title: 'Styles/Color Guidance/Color Roles',
  component: ColorRoles,
  parameters: { layout: 'fullscreen' },
  argTypes: { theme: { table: { category: 'M3' } } },
} satisfies Meta<typeof ColorRoles>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = { name: 'Light Theme', args: { theme: 'light' } }
export const Dark: Story = { name: 'Dark Theme', args: { theme: 'dark' } }
