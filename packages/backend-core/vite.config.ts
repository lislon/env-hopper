import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/config/vite'
import packageJson from './package.json'

const config = defineConfig({
  test: {
    name: packageJson.name,
    dir: './src/__tests__',
    watch: false,
    environment: 'jsdom',
    typecheck: { enabled: true },
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: './src/index.ts',
    srcDir: './src',
    cjs: false,
  }),
)
