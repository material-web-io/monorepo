import { compile } from '@mdx-js/mdx'
import { describe, expect, it } from 'vitest'
import { remarkHandle } from './remark-handle.ts'

const build = async (source: string) =>
  String(await compile(source, { remarkPlugins: [remarkHandle], jsx: true }))

const page = `import * as basic from './basic.tsx?example'
import * as sizes from './sizes.tsx?example'

<Example {...basic} isFlush />

A button.

## Sizes

<Example {...sizes} />

## Accessibility

### Keyboard

Tab moves the focus.

## Not built

Nothing.

## Props

<PropsTable {...api} />
`

describe('remarkHandle', () => {
  it('leaves the example a page opens with in the page, at the top of its overview', async () => {
    const built = await build(page)
    const overview = built.slice(
      built.indexOf('id="overview"'),
      built.indexOf('id="accessibility"'),
    )
    expect(overview).toContain('<Example {...basic} isFlush')
    expect(overview.indexOf('<Example {...basic}')).toBeLessThan(overview.indexOf('A button.'))
  })

  it('cuts a page with an accessibility or a props section into tabs', async () => {
    const built = await build(page)
    expect(built).toMatch(/tabs:\s*\["overview",\s*"accessibility",\s*"props"\]/)
    expect(built.match(/<PageTab id="(\w+)"/g)).toEqual([
      '<PageTab id="overview"',
      '<PageTab id="accessibility"',
      '<PageTab id="props"',
    ])
    // What is written after a tab's section, under another heading, is the overview's again.
    const overview = built.slice(
      built.indexOf('id="overview"'),
      built.indexOf('id="accessibility"'),
    )
    expect(overview).toContain('Not built')
  })

  it('lists the headings with their tabs, but for the ones a tab is cut at', async () => {
    const built = await build(page)
    const handle = built.slice(
      built.indexOf('export const handle'),
      built.indexOf('function _createMdxContent'),
    )
    expect(handle).toMatch(/"id":\s*"sizes"[^}]*"tab":\s*"overview"/)
    expect(handle).toMatch(/"id":\s*"keyboard"[^}]*"tab":\s*"accessibility"/)
    expect(handle).toMatch(/"id":\s*"not-built"[^}]*"tab":\s*"overview"/)
    expect(handle).not.toMatch(/"id":\s*"(accessibility|props)"/)
  })

  it('gives a heading in a JSX block, and each after it, the tab it is in', async () => {
    const built = await build(`<Setups>

### Vite

Text.

</Setups>

## Accessibility

### Keyboard

Tab moves the focus.

## Props

### Events

Text.
`)
    const handle = built.slice(
      built.indexOf('export const handle'),
      built.indexOf('function _createMdxContent'),
    )
    expect(handle).toMatch(/"id":\s*"vite"[^}]*"tab":\s*"overview"/)
    expect(handle).toMatch(/"id":\s*"keyboard"[^}]*"tab":\s*"accessibility"/)
    expect(handle).toMatch(/"id":\s*"events"[^}]*"tab":\s*"props"/)
  })

  it('leaves a page with neither section whole', async () => {
    const built = await build('Text.\n\n## One\n\nMore.\n')
    expect(built).toMatch(/tabs:\s*\[\]/)
    expect(built).not.toContain('PageTab')
  })
})
