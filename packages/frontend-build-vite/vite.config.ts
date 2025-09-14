import { tanstackViteConfig } from '@tanstack/config/vite'

export default tanstackViteConfig({
  entry: './src/index.ts',
  srcDir: './src',
  cjs: false,
})
