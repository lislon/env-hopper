import { defineConfig } from 'vite'
import { VitePluginNode } from 'vite-plugin-node'
import packageJson from './package.json'

export default defineConfig({
  resolve: {
    conditions: ['my-custom-condition'],
  },
  server: {
    // vite server configs, for details see [vite doc](https://vitejs.dev/config/#server-host)
    port: 3002,
    watch: process.env.OS?.startsWith('Windows')
      ? {
          // Without this settings watch works unreliably when linked package (e.g. backend-core) is changed
          usePolling: true,
          awaitWriteFinish: {
            pollInterval: 200,
            stabilityThreshold: 500,
          },
        }
      : undefined,
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: 'src/index.ts',
      exportName: 'viteNodeApp',
      initAppOnBoot: false,
      tsCompiler: 'esbuild',
    }),
  ],
  test: {
    name: packageJson.name,
    dir: './src/__tests__',
    watch: false,
    environment: 'jsdom',
    typecheck: { enabled: true },
  },
})
