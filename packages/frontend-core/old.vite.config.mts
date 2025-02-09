import { defineConfig, loadEnv } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'
//import { removeUseClient } from './src/vite-plugins/remove-use-client';
import * as path from 'node:path'
import * as process from 'node:process'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 4000,
      strictPort: true,
      host: 'localhost',
      proxy: {
        '/trpc': 'http://localhost:3002',
        '/static': 'http://localhost:3002',
      },
    },

    preview: {
      port: 4300,
      host: 'localhost',
    },

    plugins: [
      tailwindcss(),
      //removeUseClient(),
      // nxViteTsPaths(),
      VitePWA({
        registerType:
          env['VITE_AUTO_UPDATE'] === 'true' ? 'autoUpdate' : 'prompt',
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
              sizes: '48x48',
            },
            {
              src: 'env-hopper-square.svg',
              sizes: '150x150',
            },
            {
              src: 'env-hopper-square.svg',
              sizes: '150x150',
              purpose: 'maskable',
            },
            {
              src: 'env-hopper-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
      svgr(),
      TanStackRouterVite(),
      viteReact(),
      process.env['NODE_ENV'] === 'test' && {
        name: 'load-svg',
        enforce: 'pre',
        transform(_, id) {
          if (id.endsWith('.svg?react')) {
            return `export default () => "svg-stub"`
          }
          return undefined
        },
      },
    ],

    build: {
      outDir: '../../dist/apps/frontend',
      emptyOutDir: true,
      reportCompressedSize: true,
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: ['src/__tests__/setupTests.tsx'],
      // isolate: false, // isolate=false good for debugging https://vitest.dev/guide/improving-performance#test-isolation
      reporters: ['default'],
      watch: false, //https://github.com/nrwl/nx/issues/26223
      testTimeout: process.env['MORE_TIME'] ? 3600_000 : undefined,
      hookTimeout: process.env['MORE_TIME'] ? 3600_000 : undefined,

      coverage: {
        reportsDirectory: '../../coverage/apps/frontend',
        provider: 'v8',
      },
    },
  }
})

export default config
