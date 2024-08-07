import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',

  server: {
    port: 4000,
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
    react(),
    nxViteTsPaths(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}',
          '/api/config'
        ],
        sourcemap: true
      },
      includeAssets: ['favicon.ico', 'env-hopper-square.svg'],
      manifest: {
        name: 'Env hopper',
        short_name: 'EH',
        description: 'Jump between environments',
        theme_color: '#1f2937',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '16x16 32x32 48x48'
          },
          {
            src: 'env-hopper-square.svg',
            sizes: '72x72 96x96 192x192 256x256'
          },
          {
            src: 'env-hopper-square.svg',
            sizes: '72x72 96x96 192x192 256x256',
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
    svgr()
    // svgr({ include: '**/*.svg' })
  ],
  define: {
    APP_VERSION: JSON.stringify(process.env['APP_VERSION'] || 'local')
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    outDir: '../../dist/apps/frontend',
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
    coverage: {
      reportsDirectory: '../../coverage/apps/frontend',
      provider: 'v8'
    }
  }
});
