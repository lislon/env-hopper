import * as process from 'node:process'
import * as path from 'node:path'
import * as fs from 'node:fs'
import viteReact from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import type { UserConfig } from 'vite'
import type { ManifestOptions } from 'vite-plugin-pwa'

export function frontendViteConfig(options?: {
  appRoot?: string
  pwa?: {
    manifest?: Partial<ManifestOptions>
    registerType?: 'autoUpdate' | 'prompt'
    selfDestroying?: boolean
  }
}) {
  const plugins: UserConfig['plugins'] = []
  
  // Set up static copy for public assets if appRoot is provided
  if (options?.appRoot) {
    const appPublicDir = path.join(options.appRoot, 'public')
    
    // Copy core public assets first, then local public assets (local takes precedence)
    plugins.push(viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@env-hopper/frontend-core/public/[!.]*',
          dest: '.'
        },
        ...(fs.existsSync(appPublicDir) ? [{
          src: 'public/[!.]*',
          dest: '.'
        }] : [])
      ]
    }))
  }
  
  // Configure VitePWA
  const registerType = options?.pwa?.registerType || 
    (process.env['VITE_AUTO_UPDATE'] === 'true' ? 'autoUpdate' : 'prompt')
  
  const selfDestroying = options?.pwa?.selfDestroying !== undefined 
    ? options.pwa.selfDestroying 
    : (process.env['VITE_SELF_DESTROYING'] === 'true' ? true : undefined)
  

  
  plugins.push(VitePWA({
    registerType,
    selfDestroying,
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    },
    includeAssets: ['favicon.ico', 'apple-touch-180x180.png', 'env-hopper-*.png', 'env-hopper-square.svg'],
    manifest: {
        name: 'Env Hopper',
        short_name: 'EH',
        description: 'Jump between environments',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '48x48',
            type: 'image/x-icon'
          },
          {
            src: 'env-hopper-16x16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: 'env-hopper-32x32.png',
            sizes: '32x32',
            type: 'image/png'
          },
          {
            src: 'env-hopper-48x48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: 'env-hopper-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'env-hopper-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'env-hopper-square.svg',
            sizes: '150x150',
            type: 'image/svg+xml'
          },
          {
            src: 'env-hopper-square.svg',
            sizes: '150x150',
            purpose: 'maskable',
            type: 'image/svg+xml'
          }
        ], ...options?.pwa?.manifest },
    devOptions: {
      enabled: true
    }
  }))
  
  plugins.push(svgr())
  plugins.push(viteReact())
  
  if (process.env['NODE_ENV'] === 'test') {
    plugins.push({
      name: 'load-svg',
      enforce: 'pre',
      transform(_: string, id: string) {
        if (id.endsWith('.svg?react')) {
          return `export default () => "svg-stub"`
        }
        return undefined
      },
    })
  }

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
    plugins,
  } satisfies UserConfig
}