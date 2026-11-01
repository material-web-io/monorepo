import mdx from '@mdx-js/rollup'
import { reactRouter } from '@react-router/dev/vite'
import rehypeShiki from '@shikijs/rehype/core'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { createHighlighter } from 'shiki'
import { defineConfig } from 'vite'
import { api } from './plugins/api.ts'
import { examples } from './plugins/examples.ts'
import { codeTheme, languages } from './plugins/highlight.ts'
import { iconFont } from './plugins/icon-font.ts'
import { preview } from './plugins/preview.ts'
import { remarkHandle } from './plugins/remark-handle.ts'
import { search } from './plugins/search.ts'

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const highlighter = await createHighlighter({ themes: [codeTheme], langs: languages })

export default defineConfig({
  base: process.env.DOCS_BASE ?? '/',
  plugins: [
    tailwindcss(),
    // The icons the site's pages and the components name, out of the whole icon font.
    iconFont({ sources: [source('./src'), source('../react/src')] }),
    examples(),
    api(),
    search(),
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkGfm, remarkHandle],
      rehypePlugins: [rehypeSlug, [rehypeShiki, highlighter, { theme: codeTheme.name }]],
    }),
    reactRouter(),
    preview(),
  ],
  resolve: {
    // The components as they are written, not as they were last built.
    alias: { '@material-web/react': source('../react/src/index.ts') },
  },
})
