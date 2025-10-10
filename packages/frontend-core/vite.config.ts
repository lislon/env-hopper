import tanstackRouter from '@tanstack/router-plugin/vite'
import { tanstackViteConfig } from '@tanstack/vite-config'
import viteReact from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import svgr from 'vite-plugin-svgr'
import { defineConfig, mergeConfig } from 'vitest/config'
import fs from 'node:fs'
import path from 'node:path'

import packageJson from './package.json'

import type { ViteUserConfig } from 'vitest/config'

const config = defineConfig(({ mode }) => {
  const tsconfigPath =
    mode === 'lenient' ? './tsconfig-lenient.json' : './tsconfig.json'
  
  // Determine app mode and copy appropriate favicon
  const appMode = process.env.VITE_EH_MODE || 'catalog'
  const faviconSource = appMode === 'hopper' 
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
        output: {
          preserveModulesRoot: 'src',
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
      tanstackRouter({
        autoCodeSplitting: true,
        // Automatically generates routes when files change in dev mode
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

