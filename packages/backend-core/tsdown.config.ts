import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'testing/index': 'src/testing/index.ts',
    'testing/globalSetup': 'src/testing/globalSetup.ts',
  },
  format: ['esm'],
  platform: 'node',
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  external: [
    '@prisma/client',
    '@prisma/client/runtime/client',
    '@prisma/adapter-pg',
  ],
  publint: {
    strict: true,
  },
})
