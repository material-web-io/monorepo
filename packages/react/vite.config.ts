import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

// Every dependency and peer stays an import of the app's own copy, subpaths too
// (react-stately/useControlledState), so none is bundled into dist/ as a second copy.
const externals = Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })
const isExternal = (id: string) =>
  externals.some((name) => id === name || id.startsWith(`${name}/`))

// Library build: dist/ as src/ is laid out, one ESM file per module, so that an app's
// bundler leaves out the components it does not import. Type declarations are emitted
// by `tsc -p tsconfig.build.json`, and the stylesheet by `scripts/inline-css.mjs`.
export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rolldownOptions: {
      external: isExternal,
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
  },
})
