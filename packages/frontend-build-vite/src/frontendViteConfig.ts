import * as process from 'node:process'
import viteReact from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'
import type { UserConfig } from 'vite'

export function frontendViteConfig() {
  return {
    server: {
      port: 4000,
      strictPort: true,
      host: 'localhost',
      proxy: {
        '/trpc': 'http://localhost:3002',
        '/static': 'http://localhost:3002',
      },
    },

    plugins: [
      // tailwindcss(),
      // removeUseClient(),
      // nxViteTsPaths(),
      VitePWA({
        // registerType:
        //   env['VITE_AUTO_UPDATE'] === 'true' ? 'autoUpdate' : 'prompt',
        // selfDestroying: env['SELF_DESTROYING'] === 'true' ? true : undefined,
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
      // TanStackRouterVite(),
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

    // build: {
    //   outDir: '../../dist/apps/frontend',
    //   emptyOutDir: true,
    //   reportCompressedSize: true,
    //   sourcemap: true,
    //   commonjsOptions: {
    //     transformMixedEsModules: true,
    //   },
    // },
  } satisfies UserConfig
}
