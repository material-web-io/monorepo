// Publishes the stylesheet for an app's own Tailwind build as one file (dist/tailwind.css)
// by inlining the relative @import statements of src/tailwind.css, and of the files those
// reach: the components' own CSS. Its import of the theme, a package, is left as written.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))

const inline = (file) =>
  readFileSync(file, 'utf8').replace(
    /^@import\s+'(\.{1,2}\/[^']+)';\s*$/gm,
    (_, path) => inline(resolve(dirname(file), path)).trim() + '\n',
  )

mkdirSync(resolve(root, 'dist'), { recursive: true })
writeFileSync(resolve(root, 'dist/tailwind.css'), inline(resolve(root, 'src/tailwind.css')))
console.log('Wrote dist/tailwind.css')
