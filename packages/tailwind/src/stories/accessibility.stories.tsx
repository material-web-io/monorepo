import { Button as AriaButton } from 'react-aria-components'
import type { Meta, StoryObj } from '@storybook/react-vite'

/* Reference page for the accessibility helpers: the focus indicator (focus-ring outside the element,
 * focus-ring-inset inside it) on React Aria buttons, which report the focus it reads, so Tab shows it;
 * and touch-target, which extends a 32dp control's hit area to 48dp (the dashed outline). Class names are spelled out for Tailwind. */
function Accessibility() {
  return (
    <div className="box-border flex min-h-screen flex-col gap-space-500 bg-surface p-space-400 font-plain text-on-surface antialiased">
      <section>
        <h2 className="m-0 mb-space-200 text-title-md">Focus indicator</h2>
        <div className="flex gap-space-300">
          <AriaButton className="focus-ring h-[40px] cursor-pointer rounded-shape-full border-0 bg-primary px-space-300 text-label-lg text-on-primary outline-none">
            focus-ring
          </AriaButton>
          <AriaButton className="focus-ring-inset h-[40px] cursor-pointer rounded-shape-full border-0 bg-primary px-space-300 text-label-lg text-on-primary outline-none">
            focus-ring-inset
          </AriaButton>
        </div>
      </section>

      <section>
        <h2 className="m-0 mb-space-200 text-title-md">Touch target</h2>
        <div className="flex items-center gap-space-500">
          <button
            type="button"
            aria-label="Without touch-target"
            className="size-[32px] cursor-pointer rounded-shape-full border-0 bg-secondary-container"
          />
          <button
            type="button"
            aria-label="With touch-target"
            className="touch-target relative size-[32px] cursor-pointer rounded-shape-full border-0 bg-secondary-container after:outline-1 after:outline-primary after:outline-dashed"
          />
        </div>
        <p className="mt-space-200 mb-0 text-body-md text-on-surface-variant">
          Both are 32dp; the second has a 48dp hit area.
        </p>
      </section>
    </div>
  )
}

const meta = {
  title: 'Styles/Accessibility',
  component: Accessibility,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Accessibility>

export default meta
type Story = StoryObj<typeof meta>

export const Helpers: Story = { name: 'Focus indicator and touch target' }
