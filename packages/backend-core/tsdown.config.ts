import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  external: [
    '@prisma/client',
    '@prisma/client/runtime/library',
  ],
  publint: {
    strict: true,
  },
})
