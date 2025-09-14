import { defineConfig, type UserConfig } from 'vite'
import { frontendViteConfig } from '@env-hopper/frontend-build-vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json'

const config = defineConfig(() => {
  const cfg = frontendViteConfig()

  return {
    ...cfg,
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    resolve: {
      conditions: ['my-custom-condition'],
    },

    build: {
      outDir: '../../dist/apps/frontend-example',
      emptyOutDir: true,
      reportCompressedSize: true,
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    plugins: [tailwindcss(), ...cfg.plugins, tsconfigPaths()],
    test: {
      name: packageJson.name,
      dir: './src/__tests__',
      watch: false,
      environment: 'jsdom',
      typecheck: { enabled: true },
    },

    // test: {
    //   globals: true,
    //   environment: 'jsdom',
    //   include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    //   setupFiles: ['src/__tests__/setupTests.tsx'],
    //   // isolate: false, // isolate=false good for debugging https://vitest.dev/guide/improving-performance#test-isolation
    //   reporters: ['default'],
    //   watch: false, //https://github.com/nrwl/nx/issues/26223
    //   testTimeout: process.env['MORE_TIME'] ? 3600_000 : undefined,
    //   hookTimeout: process.env['MORE_TIME'] ? 3600_000 : undefined,

    //   coverage: {
    //     reportsDirectory: '../../coverage/apps/frontend',
    //     provider: 'v8',
    //   },
    // },
  } satisfies UserConfig
})

export default config
