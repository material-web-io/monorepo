/** WOFF2 from and to TrueType, Google's woff2 compiled to WebAssembly (icon-font.ts). */
declare module 'wawoff2' {
  const wawoff2: {
    compress(font: Uint8Array): Promise<Uint8Array>
    decompress(woff2: Uint8Array): Promise<Uint8Array>
  }
  export default wawoff2
}
