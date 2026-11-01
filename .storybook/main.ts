import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../packages/*/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', 'storybook/viewport'],
  // Ahead of the renderer's own, so its enhancers see each story's argTypes as its file writes them.
  previewAnnotations: (entries = []) => ['./.storybook/arg-types-order.ts', ...entries],
  framework: {
    name: '@storybook/react-vite',
    // packages/react/vite.config.ts is a library build; Storybook gets its own.
    options: { builder: { viteConfigPath: '.storybook/vite.config.ts' } },
  },
}

export default config
