// Finishes `react-router build`: makes dist/client the folder a static host serves.
//
// The page React Router writes for a path it has not rendered is also the host's 404.html.
// Under a base path (DOCS_BASE), that page is the folder's index.html, and the pages are
// inside a folder named after the path, beside the assets, which Vite writes at the top: the
// pages are moved up next to them, so that the folder as a whole is what the host serves at
// that path.
import { copyFileSync, cpSync, rmSync } from 'node:fs'

const client = new URL('../dist/client/', import.meta.url)
const base = (process.env.DOCS_BASE ?? '/').replace(/^\/+|\/+$/g, '')

copyFileSync(
  new URL(base ? 'index.html' : '__spa-fallback.html', client),
  new URL('404.html', client),
)
if (base) {
  cpSync(new URL(`${base}/`, client), client, { recursive: true })
  rmSync(new URL(`${base.split('/')[0]}/`, client), { recursive: true })
}
