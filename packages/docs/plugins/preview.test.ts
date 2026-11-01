import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { preview } from './preview.ts'

type Middleware = (request: { url: string }, response: unknown, next: () => void) => void

// A built site of a home page and one page, and the address the preview serves for one asked.
const root = mkdtempSync(join(tmpdir(), 'docs-preview-'))
mkdirSync(join(root, 'out/get-started'), { recursive: true })
writeFileSync(join(root, 'out/index.html'), '')
writeFileSync(join(root, 'out/get-started/index.html'), '')

const served = (url: string, base = '/') => {
  let middleware: Middleware = () => {}
  const configure = preview().configurePreviewServer as (server: unknown) => void
  configure({
    config: { base, root, build: { outDir: 'out' } },
    middlewares: { use: (given: Middleware) => (middleware = given) },
  })
  const request = { url }
  middleware(request, {}, () => {})
  return request.url
}

describe('preview', () => {
  it('serves a page’s folder for its path, with or without the slash at its end', () => {
    expect(served('/get-started')).toBe('/get-started/')
    expect(served('/get-started/')).toBe('/get-started/')
    expect(served('/')).toBe('/')
  })

  it('serves 404.html for a path the build did not render', () => {
    expect(served('/nope')).toBe('/404.html')
    expect(served('/get-started/nope/')).toBe('/404.html')
  })

  it('leaves a file’s address and a query as they are', () => {
    expect(served('/assets/app.js')).toBe('/assets/app.js')
    expect(served('/get-started?x=1')).toBe('/get-started/?x=1')
  })

  it('serves the same under a base path', () => {
    expect(served('/docs/get-started', '/docs/')).toBe('/docs/get-started/')
    expect(served('/docs/', '/docs/')).toBe('/docs/')
    expect(served('/docs/nope', '/docs/')).toBe('/docs/404.html')
  })
})
