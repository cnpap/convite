/// <reference types='vitest' />
// noinspection ES6PreferShortImport

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  confeePlugin,
  type ConfeePluginOptions,
} from '../../libs/convite/src/index';
import * as path from 'path';

const templateDir = path.resolve(__dirname, 'src/app/templates');

const confeePluginOptions_: ConfeePluginOptions = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  computed() {},
  idsResolve: {
    ['@sia-fl/route']: (id) => {
      id = id.replace('@sia-fl/route-', '').replace('-', '/');
      // eslint-disable-next-line no-empty
      if (
        id ===
        ((global as unknown as { __viteCurrentUrl: string }).__viteCurrentUrl ||
          '') +
          '.vue'
      ) {
        return {
          paginationOptionName: '搜索页面',
        };
      }
    },
  },
  templates: [
    {
      paginationOptionName: '搜索页面',
      pathname: path.resolve(templateDir, 'PaginationTableView.vue'),
    },
  ],
  url: 'http://192.168.99.190:4999/confee/admin',
  projectId: 'dfcb21a1-af78-44d8-a064-f9e52cf311aa',
  modSuffix: 'vue',
};

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/demo-vue',

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  plugins: [...confeePlugin(confeePluginOptions_), vue(), nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    outDir: '../../dist/apps/demo-vue',
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },

  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/demo-vue',
      provider: 'v8',
    },
  },
});
