import path from 'node:path'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    // No setupFiles: the jsdom/msw/IndexedDB setup moved to @env-hopper/test-kit
    // along with the integration scenarios that needed it. What is left here is
    // pure-logic unit tests, which need none of it — pointing this back at a
    // shared setup file would make this package depend on its own test kit.
    include: ['./src/__tests__/**/*.test.{ts,tsx}'],
    globals: true,
    testTimeout: 30000, // Increase timeout for integration tests
  },
})
