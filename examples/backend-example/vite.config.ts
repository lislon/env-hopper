import { quickpickle } from 'quickpickle'
import { defineConfig } from 'vitest/config'
import type { PluginOption } from 'vite'

export default defineConfig({
  resolve: {
    conditions: ['my-custom-condition'],
  },
  plugins: [quickpickle({ stepTimeout: 20000 }) as PluginOption],
  test: {
    // @vitest-environment node
    environment: 'node',
    include: ['tests/**/*.feature', 'src/**/*.test.ts'],
    setupFiles: ['tests/steps/catalog.steps.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    watch: false,
    testTimeout: 30000,
  },
})
