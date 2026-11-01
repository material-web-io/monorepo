import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/dist', '**/.react-router', 'storybook-static', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/*/src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: [
      'packages/*/scripts/**/*.mjs',
      'packages/docs/plugins/**/*.ts',
      '*.config.{js,ts}',
      'packages/*/*.config.{js,ts}',
    ],
    languageOptions: { globals: globals.node },
  },
)
