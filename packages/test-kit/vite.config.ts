import path from 'node:path'
import { tanstackViteConfig } from '@tanstack/vite-config'
import viteReact from '@vitejs/plugin-react'
import { quickpickle } from 'quickpickle'
import svgr from 'vite-plugin-svgr'
import { defineConfig, mergeConfig } from 'vitest/config'
import packageJson from './package.json'
import type { PluginOption } from 'vite'

const config = defineConfig({
  // quickpickle pulls its own vite copy, so its Plugin type is structurally
  // identical but nominally foreign — the cast is the whole of that mismatch.
  //
  // svgr is the same plugin the app builds with, so an `~/assets/x.svg?react`
  // import resolves here for free, instead of one `vi.mock` per svg that
  // silently throws inside whichever component imported the next new one.
  plugins: [
    viteReact(),
    svgr(),
    // A `Given` mounts the whole app and waits for its data; quickpickle's
    // 3s-per-step default cuts that off before the first render settles.
    quickpickle({ stepTimeout: 20000 }) as PluginOption,
  ],
  resolve: {
    // Run the app from the cores' sources — nothing needs to be built first.
    conditions: ['my-custom-condition'],
    alias: {
      '~': path.resolve(__dirname, '../frontend-core/src'),
      // quickpickle imports the extensionless 'pngjs/browser' (for screenshot
      // attachments), which node's ESM resolver rejects.
      'pngjs/browser': 'pngjs/browser.js',
    },
  },
  test: {
    name: packageJson.name,
    // The kit ships the harness in `src`; the scenarios driving it live in `tests`.
    dir: './tests',
    // Spelling out `include` replaces vitest's default globs, so the .test.tsx
    // scenarios have to be listed alongside the .feature files.
    include: ['**/*.feature', '**/*.test.ts', '**/*.test.tsx'],
    watch: false,
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    setupFiles: ['./src/setup/testSetup.ts', './src/cucumber/steps.ts'],
    // Process quickpickle through vite so the alias above catches its
    // extensionless `pngjs/browser` import; left external, node's ESM resolver
    // rejects it and the stray rejection fails the whole run.
    server: { deps: { inline: ['quickpickle'] } },
    globals: true,
    testTimeout: 30000,
  },
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: [
      './src/index.ts',
      './src/setup/testSetup.ts',
      './src/cucumber/steps.ts',
    ],
    srcDir: './src',
    cjs: false,
  }),
)
