import { frontendViteConfig } from '@env-hopper/frontend-build-vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import packageJson from './package.json'

const config = defineConfig(() => {
  const cfg = frontendViteConfig({
    appRoot: import.meta.dirname,
    pwa: {},
  })

  return {
    ...cfg,
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',

    resolve: {
      conditions: ['my-custom-condition'],
      alias: {
        '~': fileURLToPath(
          new URL('../../packages/frontend-core/src', import.meta.url),
        ),
      },
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
  }
})

export default config
