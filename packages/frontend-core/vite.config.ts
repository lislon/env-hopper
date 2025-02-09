import { defineConfig, mergeConfig, type UserConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import { tanstackViteConfig } from '@tanstack/config/vite'
import packageJson from './package.json'
import svgr from 'vite-plugin-svgr'

const config = defineConfig(() => {
  const myConfig: UserConfig = {
    build: {},
    test: {
      name: packageJson.name,
      dir: './tests',
      watch: false,
      environment: 'jsdom',
      typecheck: { enabled: true },
    },
    plugins: [
      viteReact(),
       svgr(),
    ]
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
