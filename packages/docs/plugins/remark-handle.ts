import type { Expression, Property } from 'estree'
import { valueToEstree } from 'estree-util-value-to-estree'
import type { Root, RootContent } from 'mdast'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import { readHeadings, type Heading } from './headings.ts'

/** A tab of a page: the part of it under a heading the site draws apart. */
export type PageTab = 'overview' | 'accessibility' | 'props'

/** What a page's route hands the site's shell: React Router's `handle`. */
export type PageHandle = {
  /** The page's headings, each with the tab it is in. */
  headings: (Heading & { tab: PageTab })[]
  /** The tabs the page is drawn in, in order: none for a page written as one. */
  tabs: PageTab[]
}

// The second level headings that open a tab of their own; anything else is the overview's.
const tabOf = (node: RootContent): PageTab | undefined => {
  if (node.type !== 'heading' || node.depth !== 2) return
  const title = toString(node).toLowerCase()
  return title === 'accessibility' || title === 'props' ? title : 'overview'
}

const property = (name: string, value: Expression): Property => ({
  type: 'Property',
  kind: 'init',
  key: { type: 'Identifier', name },
  value,
  method: false,
  shorthand: false,
  computed: false,
})

/**
 * Gives a page a route `handle`, React Router's export for what a layout reads of the route it
 * draws, and lays the page out for the site's shell:
 *
 * - a page with a `## Accessibility` or a `## Props` section is cut into tabs, each a
 *   `<PageTab id>` the shell shows one of, the rest of the page being the overview;
 * - its headings are listed with the tab each is in, for the contents list and the search.
 */
export function remarkHandle() {
  return (tree: Root) => {
    // The slugs, in the page's order, before the page is cut: a tab keeps its headings' ids.
    const headings = readHeadings(tree)
    const imports = tree.children.filter((node) => node.type === 'mdxjsEsm')
    const content = tree.children.filter((node) => node.type !== 'mdxjsEsm')
    const parts: Record<PageTab, RootContent[]> = { overview: [], accessibility: [], props: [] }
    const tabOfHeading: PageTab[] = []
    let current: PageTab = 'overview'
    for (const node of content) {
      current = tabOf(node) ?? current
      const tab = current
      parts[tab].push(node)
      // Each heading in it, a JSX block's too, in the order readHeadings lists them.
      visit(node, 'heading', (heading) => {
        if (heading.depth === 2 || heading.depth === 3) tabOfHeading.push(tab)
      })
    }
    const tabs = (['overview', 'accessibility', 'props'] as const).filter(
      (tab) => parts[tab].length > 0,
    )
    const isTabbed = tabs.length > 1
    if (isTabbed) {
      tree.children = [
        ...imports,
        ...tabs.map((tab): RootContent => ({
          type: 'mdxJsxFlowElement',
          name: 'PageTab',
          attributes: [{ type: 'mdxJsxAttribute', name: 'id', value: tab }],
          // A tab's own heading is the tab: the section starts under it.
          children: parts[tab].filter((node) => tab === 'overview' || tabOf(node) !== tab) as never,
        })),
      ]
    }

    const listed = headings
      .map((heading, index) => ({ ...heading, tab: tabOfHeading[index] ?? 'overview' }))
      // The heading a tab is cut at is not drawn, so the contents do not list it.
      .filter((heading) => !isTabbed || heading.tab === 'overview' || heading.depth === 3)
    const properties = [
      property('headings', valueToEstree(listed)),
      property('tabs', valueToEstree(isTabbed ? tabs : [])),
    ]

    tree.children.unshift({
      type: 'mdxjsEsm',
      value: '',
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExportNamedDeclaration',
              specifiers: [],
              attributes: [],
              source: null,
              declaration: {
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [
                  {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: 'handle' },
                    init: { type: 'ObjectExpression', properties },
                  },
                ],
              },
            },
          ],
        },
      },
    })
  }
}
