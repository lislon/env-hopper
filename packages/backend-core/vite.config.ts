import { defineConfig } from 'vitest/config'
import packageJson from './package.json'

const config = defineConfig({
  resolve: {
    conditions: ['my-custom-condition'],
  },
  test: {
    name: packageJson.name,
    dir: './src/__tests__',
    watch: false,
    environment: 'jsdom',
    typecheck: { enabled: true },
    globalSetup: ['./src/testing/globalSetup.ts'],
    fileParallelism: false,
  },
})

export default config
