import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { art } from './art'
import { entriesOf, pages, sections, site } from './nav'

const here = dirname(fileURLToPath(import.meta.url))
const content = join(here, 'content')
const examples = join(here, 'examples')
const thumbnails = join(here, 'thumbnails')
const scenes = join(here, 'scenes')
const components = resolve(here, '../../react/src/components')

const filesUnder = (folder: string, extension: string) =>
  readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith(extension))
    .map((file) => join(folder, file))

const written = sections.flatMap((section) => section.pages)
const fileOf = (path: string) => join(content, `${path}.mdx`)

describe('the site map', () => {
  it('has a file for every page', () => {
    expect(written.filter((page) => !existsSync(fileOf(page.path)))).toEqual([])
  })

  it('lists every file of the content', () => {
    const listed = new Set(written.map((page) => fileOf(page.path)))
    expect(filesUnder(content, '.mdx').filter((file) => !listed.has(file))).toEqual([])
  })

  it('gives each page a path of its own', () => {
    const paths = pages.map((page) => page.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('gives each page a title of its own', () => {
    const titles = pages.map((page) => page.title)
    expect(titles.filter((title, index) => titles.indexOf(title) !== index)).toEqual([])
  })

  it('lists each page of a section in one of its parts', () => {
    for (const { groups = [], pages: own } of sections) {
      const named = groups.flatMap((group) => group.paths ?? [])
      const paths = own.map((page) => page.path)
      // A part names pages of its section, and no two name the same one.
      expect(named.filter((path) => !paths.includes(path))).toEqual([])
      expect(named.filter((path, index) => named.indexOf(path) !== index)).toEqual([])
      // One part at most has the pages left, and the last one, as the page reads.
      expect(groups.findIndex((group) => !group.paths)).toBe(groups.length - 1)
    }
  })

  it('lists each page of a section once in the navigation, alone or in a group', () => {
    for (const section of sections) {
      const listed = entriesOf(section).flatMap((entry) => ('pages' in entry ? entry.pages : entry))
      expect(listed.map((page) => page.path).sort()).toEqual(
        section.pages.map((page) => page.path).sort(),
      )
    }
  })

  it('lists a group among the pages of the navigation by its title', () => {
    const components = sections.find((section) => section.path === '/components')!
    const titles = entriesOf(components).map((entry) => entry.title)
    expect(titles.slice(0, 4)).toEqual(['App bar', 'Buttons', 'Card', 'Checkbox'])
    expect(titles.slice(titles.indexOf('Search'), titles.indexOf('Search') + 3)).toEqual([
      'Search',
      'Sheets',
      'Slider',
    ])
    // A section with no group lists its pages as they are written.
    const theme = sections.find((section) => section.path === '/theme')!
    expect(entriesOf(theme)).toEqual(theme.pages)
  })

  it("links a theme page's header to each library its text mentions, and to no other", () => {
    const theme = sections.find((section) => section.path === '/theme')!
    for (const { path, spec, tailwind, reactAria } of theme.pages) {
      const text = readFileSync(fileOf(path), 'utf8')
      expect({
        path,
        spec: Boolean(spec),
        tailwind: Boolean(tailwind),
        reactAria: Boolean(reactAria),
      }).toEqual({
        path,
        spec: text.includes('Material'),
        tailwind: text.includes('Tailwind'),
        reactAria: text.includes('React Aria'),
      })
    }
  })

  it("links a component page's header to each library its text mentions", () => {
    const components = sections.find((section) => section.path === '/components')!
    for (const { path, spec, tailwind, reactAria } of components.pages) {
      const text = readFileSync(fileOf(path), 'utf8')
      // Tailwind only where the text names it. React Aria also where the component is built
      // on one of its components, which the text may not say.
      expect({ path, spec: Boolean(spec), tailwind: Boolean(tailwind) }).toEqual({
        path,
        spec: true,
        tailwind: text.includes('Tailwind'),
      })
      if (/React Aria|react-aria\.adobe\.com/.test(text))
        expect([path, reactAria]).not.toContain(undefined)
    }
  })

  it('gives each page a picture for its header and its card', () => {
    // The Get started section's own page draws its header's pictures itself; its picture is
    // the home page card's.
    expect(pages.filter((page) => !art[page.path]).map((page) => page.path)).toEqual([])
  })

  it('has no picture for a page it lacks', () => {
    const paths = new Set(pages.map((page) => page.path))
    expect(Object.keys(art).filter((path) => !paths.has(path))).toEqual([])
  })

  it('gives each component a picture for its card, and has none for a page it lacks', () => {
    const drawn = filesUnder(thumbnails, '.tsx').map(
      (file) => `/components/${basename(file, '.tsx')}`,
    )
    const listed = written
      .map((page) => page.path)
      .filter((path) => path.startsWith('/components/'))
    expect(listed.filter((path) => !drawn.includes(path))).toEqual([])
    expect(drawn.filter((path) => !listed.includes(path))).toEqual([])
  })

  it('gives each component a scene for its header, and has none for a page it lacks', () => {
    const drawn = filesUnder(scenes, '.tsx').map((file) => `/components/${basename(file, '.tsx')}`)
    const listed = written
      .map((page) => page.path)
      .filter((path) => path.startsWith('/components/'))
    expect(listed.filter((path) => !drawn.includes(path))).toEqual([])
    expect(drawn.filter((path) => !listed.includes(path))).toEqual([])
  })

  it('has a page for every component of the React package', () => {
    const folders = readdirSync(components, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/components/${entry.name}`)
    const listed = new Set(written.map((page) => page.path))
    expect(folders.filter((path) => !listed.has(path))).toEqual([])
  })
})

describe('the pages', () => {
  const sources = filesUnder(content, '.mdx').map((file) => ({
    file,
    text: readFileSync(file, 'utf8'),
  }))
  const imported = sources.flatMap(({ file, text }) =>
    [...text.matchAll(/from '([^']+)\?example'/g)].map((match) =>
      resolve(dirname(file), match[1]!),
    ),
  )

  it('import examples that exist', () => {
    expect(imported.filter((file) => !existsSync(file))).toEqual([])
  })

  it('show every example there is', () => {
    const shown = new Set(imported)
    const orphans = filesUnder(examples, '.tsx').filter((file) => !shown.has(file))
    expect(orphans.map((file) => relative(examples, file))).toEqual([])
  })

  it('link only to pages of the site', () => {
    const paths = new Set(pages.map((page) => page.path))
    const broken = sources.flatMap(({ file, text }) =>
      [...text.matchAll(/\]\((\/[^)#\s]*)(?:#[^)\s]*)?\)/g)]
        .filter((match) => !paths.has(match[1]!))
        .map((match) => `${relative(content, file)}: ${match[1]}`),
    )
    expect(broken).toEqual([])
  })
})

describe('the version', () => {
  // The site reads it from the components' package.json (nav.ts).
  it('is the theme’s too, as the two libraries are released together', () => {
    const tailwind = JSON.parse(
      readFileSync(resolve(here, '../../tailwind/package.json'), 'utf8'),
    ) as { version: string }
    expect(tailwind.version).toBe(site.version)
  })
})
