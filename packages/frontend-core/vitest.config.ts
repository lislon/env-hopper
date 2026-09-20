import path from 'node:path'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    // Resolve the sibling core packages from source: `test:unit` only depends
    // on `compile`, which does not build their `dist/esm` entry points.
    conditions: ['my-custom-condition'],
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/integration/setup/testSetup.ts'],
    include: ['./src/**/__tests__/**/*.test.{ts,tsx}'],
    globals: true,
    testTimeout: 30000, // Increase timeout for integration tests
  },
})
