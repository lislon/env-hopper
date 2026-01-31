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

const config = defineConfig(({ mode }) => {
  const tsconfigPath =
    mode === 'lenient' ? './tsconfig-lenient.json' : './tsconfig.json'

  // Determine app mode and copy appropriate favicon
  const appMode = process.env.VITE_EH_MODE || 'catalog'
  const faviconSource =
    appMode === 'hopper'
      ? 'public/favicon-env-hopper.ico'
      : 'public/favicon-app-catalog.ico'

  // Copy favicon during config to ensure it's available for the build
  const favIconPath = path.resolve(__dirname, faviconSource)
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
      setupFiles: ['./src/__tests__/integration/setup/testSetup.ts'],
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
      // Copy public directory and CSS file to dist during build
      viteStaticCopy({
        targets: [
          {
            src: 'public/[!.]*',
            dest: 'public',
          },
          {
            src: 'src/index.css',
            dest: '.',
          },
        ],
      }),
      faviconPlugin,
    ],
  }

  // Only merge tanstack config for non-test modes
  if (process.env.NODE_ENV !== 'test') {
    return mergeConfig(
      tanstackViteConfig({
        tsconfigPath,
        entry: './src/index.tsx',
        srcDir: './src',
        cjs: false,
      }),
      myConfig,
    )
  }

  return myConfig
})

export default config
