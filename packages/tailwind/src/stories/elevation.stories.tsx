import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference page for the elevation levels 1-5 (level 0 is no shadow). Each
 * square pairs the level's shadow (shadow-elevation-N) with the surface
 * container role M3 assigns to it, and is shown on both themes. The class
 * names are spelled out in full because Tailwind only generates utilities it
 * finds as literal strings.
 */
type Theme = 'light' | 'dark'

const levels = [
  { level: 1, classes: 'bg-surface-container-low shadow-elevation-1' },
  { level: 2, classes: 'bg-surface-container shadow-elevation-2' },
  { level: 3, classes: 'bg-surface-container-high shadow-elevation-3' },
  { level: 4, classes: 'bg-surface-container-high shadow-elevation-4' },
  { level: 5, classes: 'bg-surface-container-highest shadow-elevation-5' },
]

const themes: { theme: Theme; label: string }[] = [
  { theme: 'light', label: 'Light' },
  { theme: 'dark', label: 'Dark' },
]

function Elevation() {
  return (
    // The page itself stays light in both themes, so its labels use a fixed neutral, not a role.
    // Each panel pins its own scheme with data-theme, whatever the toolbar theme says.
    <div className="box-border min-h-screen bg-[#f3f3f3] p-[49px] font-plain text-[#aaa] antialiased">
      {themes.map(({ theme, label }) => (
        <section key={theme} className="mb-space-125">
          <h2 className="m-0 mb-space-125 text-[20px] leading-[30px] font-[400]">{label}</h2>
          <div
            data-theme={theme}
            className="grid grid-cols-5 gap-[39px] rounded-shape-lg bg-surface-container-lowest px-[65px] py-[54px]"
          >
            {levels.map(({ level, classes }) => (
              <div
                key={level}
                role="img"
                aria-label={`Elevation level ${level}`}
                className={twMerge('aspect-square rounded-shape-lg', classes)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const meta = {
  title: 'Styles/Elevation',
  component: Elevation,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Elevation>

export default meta
type Story = StoryObj<typeof meta>

export const Levels: Story = { name: 'Levels 1-5' }
