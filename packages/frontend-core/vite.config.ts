import { defineConfig, mergeConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { tanstackViteConfig } from '@tanstack/config/vite'
import svgr from 'vite-plugin-svgr'
import packageJson from './package.json'
import type { UserConfig } from 'vite'

const config = defineConfig(() => {
  const myConfig: UserConfig = {
    build: {},
    test: {
      name: packageJson.name,
      dir: './src/__tests__',
      watch: false,
      environment: 'jsdom',
      typecheck: { enabled: true },
    },
    plugins: [viteReact(), svgr()],
  }

  return mergeConfig(
    myConfig,
    tanstackViteConfig({
      entry: './src/index.tsx',
      srcDir: './src',
      cjs: false,
    }),
  )
})

export default config
