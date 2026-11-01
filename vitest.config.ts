import tailwindcss from '@tailwindcss/vite'
import { defineBrowserCommand, playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'

// How long a test may run before it counts as hung, not how fast it should be: a test that takes
// a second alone can take ten in a full run on a busy machine.
const testTimeout = 30_000

// Three projects. `unit` runs in jsdom and checks markup and behavior. `browser`
// runs *.browser.test.tsx files in real Chromium with the real stylesheet, for
// what jsdom cannot compute: contrast, focus outlines, hit areas and forced
// colors. It needs the browser once: `npx playwright install chromium`. `docs`
// runs the tests of the docs site's site map and build plugins, in Node.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          testTimeout,
          environment: 'jsdom',
          setupFiles: ['./packages/react/src/test-setup.ts'],
          include: ['packages/*/src/**/*.test.{ts,tsx}'],
          exclude: [
            ...configDefaults.exclude,
            'packages/*/src/**/*.browser.test.{ts,tsx}',
            'packages/docs/**',
          ],
        },
      },
      {
        test: {
          name: 'docs',
          testTimeout,
          environment: 'node',
          include: ['packages/docs/{src,plugins}/**/*.test.ts'],
        },
      },
      {
        plugins: [tailwindcss()],
        // Bundled up front: found only when a test imports it, it would reload the run midway.
        // The shape library's test builds its utilities with it.
        optimizeDeps: { include: ['tailwindcss'] },
        test: {
          name: 'browser',
          testTimeout,
          setupFiles: ['./packages/react/src/test-setup.browser.ts'],
          include: ['packages/*/src/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            headless: true,
            // Wide enough that the widest component (an xl split button) stays on
            // screen, where hit-testing can reach it. The height is left at the
            // Vitest default.
            viewport: { width: 1280, height: 896 },
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            commands: {
              // Forced colors is a page-level media feature, so the test cannot set it itself.
              emulateForcedColors: defineBrowserCommand<['active' | 'none']>(
                async ({ page }, forcedColors) => {
                  await page.emulateMedia({ forcedColors })
                },
              ),
              emulateReducedMotion: defineBrowserCommand<['reduce' | 'no-preference']>(
                async ({ page }, reducedMotion) => {
                  await page.emulateMedia({ reducedMotion })
                },
              ),
              // The pointer moved to x, y CSS pixels from the top left corner of the first element the
              // selector finds, and pressed or let go there if asked: a press, or a drag in steps.
              pointer: defineBrowserCommand<[string, number, number, ('down' | 'up')?]>(
                async ({ page, iframe }, selector, x, y, button) => {
                  await iframe.locator(selector).first().hover({ position: { x, y }, force: true })
                  if (button === 'down') await page.mouse.down()
                  if (button === 'up') await page.mouse.up()
                },
              ),
              // The pressed state only lasts while the pointer is down, so a test has to hold it.
              // The test runs in an iframe, so let the locator work out where the button is.
              // `exact` is for a name that is part of another's, as a chip's is of its remove button's.
              holdPress: defineBrowserCommand<
                [
                  string,
                  (
                    | 'button'
                    | 'checkbox'
                    | 'radio'
                    | 'switch'
                    | 'option'
                    | 'link'
                    | 'menuitem'
                    | 'tab'
                  )?,
                  boolean?,
                ]
              >(async ({ page, iframe }, name, role = 'button', exact = false) => {
                const control = iframe.getByRole(role, { name, exact })
                // A checkbox, radio or switch is a hidden input in a label, which takes the pointer.
                const label = control.locator('xpath=ancestor::label[1]')
                await ((await label.count()) > 0 ? label : control).hover()
                await page.mouse.down()
              }),
              releasePress: defineBrowserCommand(async ({ page }) => {
                await page.mouse.up()
              }),
              // A drag is a pointer held down and moved, which only a real one is followed through:
              // the named button's, down by `dy` in `steps` moves, held still for `rest` ms, let go.
              drag: defineBrowserCommand<[string, number, number?, number?]>(
                async ({ page, iframe }, name, dy, steps = 6, rest = 0) => {
                  const box = (await iframe.getByRole('button', { name }).boundingBox())!
                  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2]
                  await page.mouse.move(x, y)
                  await page.mouse.down()
                  await page.mouse.move(x, y + dy, { steps })
                  if (rest > 0) await page.waitForTimeout(rest)
                  await page.mouse.up()
                },
              ),
              // A slider takes the pointer on its host, anywhere along it, and not on its input:
              // x and y are fractions of the box of the slider that holds the named input.
              pointAtSlider: defineBrowserCommand<[string, number, number, boolean?]>(
                async ({ page, iframe }, name, x, y, press = false) => {
                  const slider = iframe.locator('[class*="group/md-slider "]', {
                    has: iframe.getByRole('slider', { name, exact: true }),
                  })
                  const box = (await slider.boundingBox())!
                  await page.mouse.move(box.x + x * box.width, box.y + y * box.height, { steps: 4 })
                  if (press) await page.mouse.down()
                },
              ),
            },
          },
        },
      },
    ],
  },
})
