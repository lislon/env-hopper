import { tanstackViteConfig } from '@tanstack/vite-config'
import { defineConfig, mergeConfig } from 'vite'

export default mergeConfig(
  tanstackViteConfig({
    entry: './src/index.ts',
    srcDir: './src',
    cjs: false,
  }),
  defineConfig({
    build: {
      rollupOptions: {
        output: {
          preserveModulesRoot: 'src',
        },
      },
    },
  }),
)
