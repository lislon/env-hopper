import path from 'node:path'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      // Tests run against sibling sources: `test:unit` only depends on
      // `compile`, so the packages' `dist/esm` entry points are not built.
      '@env-hopper/shared-core': path.resolve(
        __dirname,
        '../shared-core/src/index.ts',
      ),
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
