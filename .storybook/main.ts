import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => !prop.parent?.fileName.includes('node_modules'),
    },
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: [
          { find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) },
          {
            find: '@photonic/tiled-client-h5web',
            replacement: fileURLToPath(
              new URL('../tiled-client-h5web/src/index.ts', import.meta.url),
            ),
          },
          { find: /^plotly\.js$/, replacement: 'plotly.js-dist-min' },
          { find: /^buffer\/?$/, replacement: 'buffer/' },
        ],
      },
      optimizeDeps: {
        esbuildOptions: {
          define: { global: 'globalThis' },
        },
      },
    });
  },
};
export default config;
