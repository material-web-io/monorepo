import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'

const require = createRequire(import.meta.url)
const id = 'virtual:icon-font?url'

/** Material Symbols with every icon and all four axes: FILL, GRAD, opsz and wght. */
export const fullFont =
  require.resolve('@fontsource-variable/material-symbols-outlined/files/material-symbols-outlined-latin-full-normal.woff2')

// The characters an icon's name is spelled in, which the font turns into the icon (a ligature).
const nameCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789_'

// HarfBuzz's flag for a subset that keeps only the glyphs it is given (hb-subset.h).
const noLayoutClosure = 0x200

/** The font as TrueType, which HarfBuzz reads, from WOFF2. */
export async function decompress(woff2: Uint8Array) {
  const { default: wawoff2 } = await import('wawoff2')
  return wawoff2.decompress(woff2)
}

/**
 * The icons a text names: each word of it the font turns into one glyph of its own, by name.
 * A word of prose that is also an icon's name counts too, which costs a few icons more.
 */
export async function iconsIn(font: Uint8Array, text: string) {
  const hb = await import('harfbuzzjs')
  const shaper = new hb.Font(new hb.Face(new hb.Blob(font)))
  const glyphOf = (word: string) => {
    const buffer = new hb.Buffer()
    buffer.addText(word)
    buffer.guessSegmentProperties()
    hb.shape(shaper, buffer)
    const glyphs = buffer.getGlyphInfos()
    return glyphs.length === 1 ? glyphs[0]!.codepoint : undefined
  }
  const letters = new Set([...nameCharacters].map(glyphOf))
  const icons = new Map<string, number>()
  for (const word of new Set(text.match(/[a-z0-9_]{2,}/g))) {
    const glyph = glyphOf(word)
    if (glyph !== undefined && !letters.has(glyph)) icons.set(word, glyph)
  }
  return icons
}

// The functions of HarfBuzz's subsetter (harfbuzz-subset.wasm) that `subset` calls, and its memory.
type Subsetter = { memory: WebAssembly.Memory } & Record<
  | 'malloc'
  | 'hb_blob_create'
  | 'hb_blob_destroy'
  | 'hb_blob_get_data'
  | 'hb_blob_get_length'
  | 'hb_face_create'
  | 'hb_face_destroy'
  | 'hb_face_reference_blob'
  | 'hb_set_add'
  | 'hb_subset_input_create_or_fail'
  | 'hb_subset_input_destroy'
  | 'hb_subset_input_get_flags'
  | 'hb_subset_input_glyph_set'
  | 'hb_subset_input_set_flags'
  | 'hb_subset_input_unicode_set'
  | 'hb_subset_or_fail',
  (...args: number[]) => number
>

/**
 * The font with only the given icons, as WOFF2: their glyphs, the characters their names are
 * spelled in, and the ligatures from one to the other. Its axes are all kept.
 */
export async function subset(font: Uint8Array, glyphs: Iterable<number>) {
  const wasm = await readFile(join(dirname(require.resolve('harfbuzzjs')), 'harfbuzz-subset.wasm'))
  const { instance } = await WebAssembly.instantiate(wasm)
  const hb = instance.exports as Subsetter
  const at = hb.malloc(font.byteLength)
  new Uint8Array(hb.memory.buffer).set(font, at)
  const blob = hb.hb_blob_create(at, font.byteLength, 2, 0, 0)
  const face = hb.hb_face_create(blob, 0)
  hb.hb_blob_destroy(blob)
  const input = hb.hb_subset_input_create_or_fail()
  const unicodes = hb.hb_subset_input_unicode_set(input)
  for (const character of nameCharacters) hb.hb_set_add(unicodes, character.codePointAt(0)!)
  const kept = hb.hb_subset_input_glyph_set(input)
  for (const glyph of glyphs) hb.hb_set_add(kept, glyph)
  hb.hb_subset_input_set_flags(input, hb.hb_subset_input_get_flags(input) | noLayoutClosure)
  const result = hb.hb_subset_or_fail(face, input)
  hb.hb_subset_input_destroy(input)
  hb.hb_face_destroy(face)
  if (!result) throw new Error('The icon font could not be subset.')
  const out = hb.hb_face_reference_blob(result)
  const start = hb.hb_blob_get_data(out, 0)
  const ttf = new Uint8Array(hb.memory.buffer).slice(start, start + hb.hb_blob_get_length(out))
  const { default: wawoff2 } = await import('wawoff2')
  return wawoff2.compress(ttf)
}

// Every word that could name an icon in the source files under `folders`, tests and stories
// left out, once each and in order: a change to the source that adds no word changes nothing.
async function sourceWords(folders: string[]) {
  const words = new Set<string>()
  for (const folder of folders) {
    const files = await readdir(folder, { recursive: true })
    for (const file of files.filter((name) => /\.(tsx?|mdx|css)$/.test(name))) {
      if (/\.(test|stories)\./.test(file)) continue
      const text = await readFile(join(folder, file), 'utf8')
      for (const word of text.match(/[a-z0-9_]{2,}/g) ?? []) words.add(word)
    }
  }
  return [...words].sort().join(' ')
}

/**
 * `virtual:icon-font?url`: the address of the icon font. The dev server serves the whole font;
 * the build serves only the icons the site and the components name in their source, which
 * is about a twentieth of it. The subset is kept in node_modules/.cache, by what it was made of.
 */
export function iconFont({ sources }: { sources: string[] }): Plugin {
  let isBuild = false
  let cache = ''
  return {
    name: 'docs:icon-font',
    enforce: 'pre',
    configResolved(config) {
      isBuild = config.command === 'build'
      cache = join(config.root, 'node_modules/.cache/icon-font')
    },
    async resolveId(source) {
      if (source !== id) return
      if (!isBuild) return `${fullFont}?url`
      const [woff2, words] = await Promise.all([readFile(fullFont), sourceWords(sources)])
      const key = createHash('sha256').update(woff2).update(words).digest('hex').slice(0, 16)
      const file = join(cache, key, 'material-symbols-outlined.woff2')
      if (!existsSync(file)) {
        const font = await decompress(woff2)
        const icons = await iconsIn(font, words)
        await rm(cache, { recursive: true, force: true })
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, await subset(font, icons.values()))
      }
      return `${file}?url`
    },
  }
}
