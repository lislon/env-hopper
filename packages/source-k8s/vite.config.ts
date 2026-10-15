import { defineConfig, mergeConfig } from 'vitest/config'
import { tanstackViteConfig } from '@tanstack/vite-config'
import packageJson from './package.json'

const config = defineConfig({
  test: {
    name: packageJson.name,
    dir: './src',
    watch: false,
    environment: 'node',
    typecheck: { enabled: true },
  },
  // Resolves workspace dependencies using my-custom-condition → src/, not built dist/
  resolve: {
    conditions: ['my-custom-condition', 'default'],
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
