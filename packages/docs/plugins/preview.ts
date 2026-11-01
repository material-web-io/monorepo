import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Has `vite preview` serve the built site the way a static host does: a page's folder for its
 * path, with or without the slash at its end, and `404.html`, the page for a path the build
 * did not render, for any other. Left to itself the preview answers both with the home page,
 * which the site then draws the page asked for into.
 */
export function preview(): Plugin {
  return {
    name: 'docs:preview',
    configurePreviewServer(server) {
      const { base, root, build } = server.config
      const out = resolve(root, build.outDir)
      server.middlewares.use((request, _response, next) => {
        const [path = '', query] = (request.url ?? '').split('?')
        // A file is asked for by its name, which Vite serves as it is.
        if (path.startsWith(base) && !extname(path)) {
          const page = path.slice(base.length).replace(/\/$/, '')
          const address = existsSync(join(out, page, 'index.html'))
            ? `${base}${page && `${page}/`}`
            : `${base}404.html`
          request.url = query ? `${address}?${query}` : address
        }
        next()
      })
    },
  }
}
