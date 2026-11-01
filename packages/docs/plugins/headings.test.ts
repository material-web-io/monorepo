import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'
import { readHeadings } from './headings.ts'

describe('readHeadings', () => {
  const parse = (markdown: string) => readHeadings(unified().use(remarkParse).parse(markdown))

  it('reads the second and third level headings, with the ids rehype-slug gives them', () => {
    expect(parse('# Title\n\n## Toggle buttons\n\n### `Button`\n\n#### Deeper')).toEqual([
      { id: 'toggle-buttons', text: 'Toggle buttons', depth: 2 },
      { id: 'button', text: 'Button', depth: 3 },
    ])
  })

  it('numbers a heading that repeats, counting the levels it leaves out', () => {
    expect(parse('# Props\n\n## Props\n\n## Props').map((heading) => heading.id)).toEqual([
      'props-1',
      'props-2',
    ])
  })
})
