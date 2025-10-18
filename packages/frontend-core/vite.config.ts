import { defineConfig, mergeConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import { tanstackViteConfig } from '@tanstack/config/vite'
import svgr from 'vite-plugin-svgr'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import packageJson from './package.json'
import type { UserConfig } from 'vite'

const config = defineConfig(({ mode }) => {
  const tsconfigPath = mode === 'lenient' ? './tsconfig-lenient.json' : './tsconfig.json'
  const myConfig: UserConfig = {
    build: {
      copyPublicDir: false
    },
    test: {
      name: packageJson.name,
      dir: './src/__tests__',
      watch: false,
      environment: 'jsdom',
      typecheck: { enabled: true },
    },
    plugins: [
      viteReact(), 
      svgr(),
      // Copy public directory and CSS file to dist during build
      viteStaticCopy({
        targets: [
          {
            src: 'public/[!.]*',
            dest: 'public'
          },
          {
            src: 'src/index.css',
            dest: '.'
          }
        ]
      })
    ],
  }

  return mergeConfig(
    myConfig,
    tanstackViteConfig({
      entry: './src/index.tsx',
      srcDir: './src',
      cjs: false,
      exclude: ['./src/__tests__']
    })
  )
})

export default config
