import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { decompress, fullFont, iconsIn, subset } from './icon-font.ts'

const font = await decompress(readFileSync(fullFont))

// How many glyphs a word is drawn in: one where the font has the icon it names.
async function glyphsOf(woff2: Uint8Array, word: string) {
  const hb = await import('harfbuzzjs')
  const shaper = new hb.Font(new hb.Face(new hb.Blob(await decompress(woff2))))
  const buffer = new hb.Buffer()
  buffer.addText(word)
  buffer.guessSegmentProperties()
  hb.shape(shaper, buffer)
  return buffer.getGlyphInfos().length
}

describe('the icon font', () => {
  it('finds the icons a text names, and no other word', async () => {
    const icons = await iconsIn(font, '<Icon name="arrow_back" /> search, then the word Home')
    expect([...icons.keys()].sort()).toEqual(['arrow_back', 'search'])
  })

  it('keeps those icons and their axes, and leaves the others out', async () => {
    const icons = await iconsIn(font, 'home search')
    const woff2 = await subset(font, icons.values())
    expect(woff2.byteLength).toBeLessThan(20_000)
    expect(await glyphsOf(woff2, 'home')).toBe(1)
    expect(await glyphsOf(woff2, 'search')).toBe(1)
    expect(await glyphsOf(woff2, 'settings')).toBe('settings'.length)
    const hb = await import('harfbuzzjs')
    const axes = new hb.Face(new hb.Blob(await decompress(woff2))).getAxisInfos()
    expect(Object.keys(axes).sort()).toEqual(['FILL', 'GRAD', 'opsz', 'wght'])
  })
})
