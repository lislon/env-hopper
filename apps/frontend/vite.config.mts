import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';
import { removeUseClient } from './src/vite-plugins/remove-use-client';
import * as process from 'node:process';
import { minutes } from './src/app/lib/utils';


export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    server: {
      port: 4000,
      strictPort: true,
      host: 'localhost',
      proxy: {
        '/api': 'http://localhost:4001'
      }
    },

    preview: {
      port: 4300,
      host: 'localhost'
    },

    plugins: [
      removeUseClient(),
      react(),
      nxViteTsPaths(),
      VitePWA({
        registerType: env['VITE_AUTO_UPDATE'] === 'true' ? 'autoUpdate' : 'prompt',
        selfDestroying: env['SELF_DESTROYING'] === 'true' ? true : undefined,
        includeAssets: ['favicon.ico', '*.svg'],
        manifest: {
          name: 'Env hopper',
          short_name: 'EH',
          description: 'Jump between environments',
          theme_color: '#1f2937',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '48x48'
            },
            {
              src: 'env-hopper-square.svg',
              sizes: '150x150'
              // sizes: '72x72 96x96 192x192 256x256',
            },
            {
              src: 'env-hopper-square.svg',
              sizes: '150x150',
              // sizes: '72x72 96x96 192x192 256x256',
              purpose: 'maskable'
            },
            {
              src: 'env-hopper-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      svgr(),
      process.env['NODE_ENV'] === 'test' && {
        name: 'load-svg',
        enforce: 'pre',
        transform(_, id) {
          if (id.endsWith('.svg?react')) {
            return `export default () => "svg-stub"`;
          }
          return undefined;
        }
      }
    ],

    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },

    build: {
      outDir: '../../dist/apps/frontend',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },

    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      testTimeout: minutes(10),

      coverage: {
        reportsDirectory: '../../coverage/apps/frontend',
        provider: 'v8'
      }
    }
  };
})
