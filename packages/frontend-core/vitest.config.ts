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
      // Sibling cores from source. The workspace links them by the
      // `my-custom-condition` export, which vite's own resolver does not apply, so
      // without this a test that imports one fails with "Failed to resolve entry"
      // unless that package happens to have been built first. Tests should not
      // depend on build order.
      '@env-hopper/shared-core': path.resolve(
        __dirname,
        '../shared-core/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    // Only jest-dom's matchers. The jsdom/msw/IndexedDB setup moved to
    // @env-hopper/test-kit along with the integration scenarios that needed it;
    // what is left here is unit tests, which need none of it.
    setupFiles: ['./src/__tests__/setupTests.tsx'],
    // Tests live both in the top-level `__tests__` tree and next to the module
    // they cover, so the glob has to reach both.
    include: ['./src/**/__tests__/**/*.test.{ts,tsx}'],
    globals: true,
    testTimeout: 30000, // Increase timeout for integration tests
  },
})
