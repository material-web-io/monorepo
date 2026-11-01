import { readFile } from 'node:fs/promises'
import type { Plugin } from 'vite'
import { highlight } from './highlight.ts'

const query = '?example'

/**
 * `<file>.tsx?example`: an example as a page shows it, the component the file exports by
 * default, as `Component`, and its source, as `code` and highlighted as `html`, so that the
 * code a page shows is the code it runs.
 */
export function examples(): Plugin {
  return {
    name: 'docs:examples',
    enforce: 'pre',
    load: {
      filter: { id: /\?example$/ },
      async handler(id) {
        const file = id.slice(0, -query.length)
        this.addWatchFile(file)
        const code = (await readFile(file, 'utf8')).trim()
        return `export { default as Component } from ${JSON.stringify(file)}
export const code = ${JSON.stringify(code)}
export const html = ${JSON.stringify(await highlight(code, 'tsx'))}`
      },
    },
  }
}
