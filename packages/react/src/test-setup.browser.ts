import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'
import { commands } from 'vitest/browser'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './test-setup.browser.css'

// How long `waitFor` and `findBy*` wait for what is sure to come, which they stop waiting for
// as soon as it does: what takes a moment alone can take seconds on a busy machine.
configure({ asyncUtilTimeout: 5000 })

// The components' text is Roboto, as in Storybook: the faces above are loaded before a test
// renders, so the sizes a test reads are Roboto's everywhere, not the fallback font's of the OS
// running it. Material Symbols is the icon test's own.
await Promise.all([400, 500, 700].map((weight) => document.fonts.load(`${weight} 16px Roboto`)))

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateForcedColors: (forcedColors: 'active' | 'none') => Promise<void>
    emulateReducedMotion: (reducedMotion: 'reduce' | 'no-preference') => Promise<void>
    /**
     * Moves the pointer onto the button (or checkbox, radio, switch, option, link, menu item, tab) with this
     * accessible name and holds it down. The name may be a part of the whole unless `exact`.
     */
    holdPress: (
      name: string,
      role?: 'button' | 'checkbox' | 'radio' | 'switch' | 'option' | 'link' | 'menuitem' | 'tab',
      exact?: boolean,
    ) => Promise<void>
    releasePress: () => Promise<void>
    /**
     * Moves the pointer to `x`, `y` CSS pixels from the top left corner of the first element the
     * selector finds, and presses it or lets it go there if asked.
     */
    pointer: (selector: string, x: number, y: number, button?: 'down' | 'up') => Promise<void>
    /**
     * Drags the button with this accessible name with a real pointer: down by `dy` pixels (up,
     * if negative) in `steps` moves, held still there for `rest` milliseconds, then let go.
     */
    drag: (name: string, dy: number, steps?: number, rest?: number) => Promise<void>
    /** Moves the pointer to a point of the slider that holds the named input, as fractions of its box, and holds it down there if asked. */
    pointAtSlider: (name: string, x: number, y: number, press?: boolean) => Promise<void>
  }
}

// A test that fails, or ends, while it holds a press would leave the pointer down
// for the next one, whose own press then does not count as one.
afterEach(async () => {
  await commands.releasePress()
  cleanup()
})
