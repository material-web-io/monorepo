import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

/** A heading of a page, by the id `rehype-slug` gives its element. */
export type Heading = { id: string; text: string; depth: number }

/** The second and third level headings of a page's tree, the ones its contents list. */
export function readHeadings(tree: Root): Heading[] {
  const slugger = new GithubSlugger()
  const headings: Heading[] = []
  visit(tree, 'heading', (node) => {
    // Every heading takes its slug in turn, as rehype-slug counts the ones that repeat.
    const text = toString(node)
    const id = slugger.slug(text)
    if (node.depth === 2 || node.depth === 3) headings.push({ id, text, depth: node.depth })
  })
  return headings
}
