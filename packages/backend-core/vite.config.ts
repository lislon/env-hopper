import { defineConfig } from 'vitest/config'
import packageJson from './package.json'

const config = defineConfig({
  test: {
    name: packageJson.name,
    dir: './src/__tests__',
    watch: false,
    environment: 'jsdom',
    typecheck: { enabled: true },
    globalSetup: ['./src/__tests__/catalog/globalSetup.ts'],
    fileParallelism: false,
  },
})

export default config
