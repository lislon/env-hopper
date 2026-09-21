import tailwindcss from '@tailwindcss/vite'
import tanstackRouter from '@tanstack/router-plugin/vite'
import { tanstackViteConfig } from '@tanstack/vite-config'
import viteReact from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import svgr from 'vite-plugin-svgr'
import { defineConfig, mergeConfig } from 'vitest/config'

import packageJson from './package.json'

import type { ViteUserConfig } from 'vitest/config'

const config = defineConfig(({ command, mode }) => {
  const tsconfigPath =
    mode === 'lenient' ? './tsconfig-lenient.json' : './tsconfig.json'

  // Copy env-hopper favicon during build
  const favIconPath = path.resolve(__dirname, 'public/favicon-env-hopper.ico')
  const faviconDestPath = path.resolve(__dirname, 'public/favicon.ico')

  // Hook to handle favicon copy during build
  const faviconPlugin = {
    name: 'copy-favicon',
    apply: 'build' as const,
    resolveId: (id: string) => {
      if (id === 'virtual-favicon') return id
      return null
    },
    load: (id: string) => {
      if (id === 'virtual-favicon') {
        if (fs.existsSync(favIconPath)) {
          const data = fs.readFileSync(favIconPath)
          fs.writeFileSync(faviconDestPath, data)
        }
        return ''
      }
      return null
    },
  }

  const myConfig: ViteUserConfig = {
    server: {
      port: 3999,
      strictPort: true,
      // Same-origin `/api/*` (the session probe) would otherwise fall through
      // to the SPA and answer html where the client expects json.
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.EH_API_PORT ?? 4000}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      copyPublicDir: false,
      rollupOptions: {
        onLog(level, log, handler) {
          // Log all chunk-related messages
          if (
            log.message.includes('chunk') ||
            log.message.includes('Chunk') ||
            log.code === 'CHUNK_NAMING_CONFLICT' ||
            log.code === 'PLUGIN_WARNING' ||
            log.code === 'PLUGIN_ERROR'
          ) {
            console.log(`[FRONTEND-CORE ROLLUP ${level}]`, log)
          }
          // Also log module resolution for admin routes
          if (log.message.includes('admin') || log.id?.includes('admin')) {
            console.log(`[FRONTEND-CORE ROLLUP ${level}]`, log)
          }
          handler(level, log)
        },
        output: {
          preserveModulesRoot: 'src',
          // Log chunk file names as they're generated
          chunkFileNames(chunkInfo) {
            const name = chunkInfo.name || 'unknown'
            const fileName = chunkInfo.isEntry
              ? 'index-[hash].js'
              : `${name}-[hash].js`
            console.log(
              `[FRONTEND-CORE CHUNK NAME] ${name} -> ${fileName}`,
              JSON.stringify(
                {
                  isEntry: chunkInfo.isEntry,
                  isDynamicEntry: chunkInfo.isDynamicEntry,
                  facadeModuleId: chunkInfo.facadeModuleId,
                  moduleIds: chunkInfo.moduleIds.slice(0, 3),
                },
                null,
                2,
              ),
            )
            return fileName
          },
        },
      },
    },
    test: {
      name: packageJson.name,
      dir: './src/__tests__',
      watch: false,
      environment: 'jsdom',
      typecheck: { enabled: true },
      // The jsdom/msw setup moved to @env-hopper/test-kit along with the
      // integration scenarios; what is left here is pure-logic unit tests.
      include: ['./src/__tests__/**/*.test.{ts,tsx}'],
    },
    plugins: [
      // Debug plugin to log virtual file creation
      {
        name: 'debug-virtual-files',
        resolveId(id) {
          if (id.includes('?tsr-split=')) {
            console.log(`[VIRTUAL FILE] Resolving: ${id}`)
          }
          return null
        },
        load(id) {
          if (id.includes('?tsr-split=')) {
            console.log(`[VIRTUAL FILE] Loading: ${id}`)
          }
          return null
        },
      },
      tanstackRouter({
        autoCodeSplitting: true,
        codeSplittingOptions: {
          // Only split admin routes - everything else stays in main bundle
          splitBehavior: ({ routeId }) => {
            if (routeId.startsWith('/admin')) {
              // Admin routes: split component into separate chunk
              const result: Array<
                Array<
                  | 'component'
                  | 'loader'
                  | 'errorComponent'
                  | 'notFoundComponent'
                  | 'pendingComponent'
                >
              > = [['component'], ['pendingComponent', 'errorComponent']]
              console.log(
                `[TANSTACK SPLIT] Route ${routeId} -> split groups:`,
                JSON.stringify(result, null, 2),
              )
              return result
            }
            // Non-admin routes: don't split, keep in main bundle
            return []
          },
        },
      }),
      viteReact(),
      svgr(),
      // Dev only: `index.css` is the dev entry's sheet and needs `@import
      // 'tailwindcss'` resolved, but the library build ships `src/*.css`
      // uncompiled for consumers to compile themselves — see viteStaticCopy
      // below. Compiling it here would change what `dist` contains.
      ...tailwindcss().map((plugin) => ({
        ...plugin,
        apply: 'serve' as const,
      })),
      // Copy public directory and CSS file to dist during build
      viteStaticCopy({
        targets: [
          {
            src: 'public/[!.]*',
            dest: 'public',
          },
          {
            // index.css `@import`s its siblings, so they all have to land in
            // dist next to it — consumers compile dist/index.css themselves.
            src: 'src/*.css',
            dest: '.',
          },
        ],
      }),
      faviconPlugin,
    ],
  }

  // Only merge tanstack config for non-test modes
  if (process.env.NODE_ENV !== 'test') {
    const merged = mergeConfig(
      tanstackViteConfig({
        tsconfigPath,
        entry: ['./src/index.tsx', './src/internal.ts'],
        srcDir: './src',
        cjs: false,
      }),
      myConfig,
    )
    if (command === 'serve') {
      // The library build's `preserve-directives` parses every module as
      // javascript and so rejects Tailwind's compiled stylesheet. It exists to
      // keep `'use client'` banners in `dist`, which the dev server has no
      // stake in.
      const plugins = merged.plugins as Array<{ name?: string } | undefined>
      merged.plugins = plugins.filter((p) => p?.name !== 'preserve-directives')
    }
    return merged
  }

  return myConfig
})

export default config
