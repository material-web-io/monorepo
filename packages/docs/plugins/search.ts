import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { Plugin } from 'vite'
import { readHeadings, type Heading } from './headings.ts'

const content = fileURLToPath(new URL('../src/content/', import.meta.url))
const id = 'virtual:search'

/**
 * `virtual:search`: the headings of every page, by the page's path, for the search to list
 * next to the pages themselves.
 */
export function search(): Plugin {
  return {
    name: 'docs:search',
    resolveId(source) {
      if (source === id) return `\0${id}`
    },
    async load(resolved) {
      if (resolved !== `\0${id}`) return
      const parser = unified().use(remarkParse).use(remarkMdx)
      const headings: Record<string, Heading[]> = {}
      const files = await readdir(content, { recursive: true })
      for (const file of files.filter((name) => name.endsWith('.mdx')).sort()) {
        const path = join(content, file)
        this.addWatchFile(path)
        // content/components/button.mdx is the page /components/button.
        const route = `/${relative(content, path).replace(/(^|\/)index\.mdx$|\.mdx$/, '')}`
        // A page that does not parse is one its own route reports: the others are still listed.
        try {
          headings[route] = readHeadings(parser.parse(await readFile(path, 'utf8')))
        } catch (error) {
          this.warn(`${file} is left out of the search: ${String(error)}`)
        }
      }
      return `export default ${JSON.stringify(headings)}`
    },
  }
}
