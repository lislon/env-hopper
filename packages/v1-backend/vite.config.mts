import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  plugins: [nxViteTsPaths()],
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/v1-backend',
  build: {
    sourcemap: true,
  },

  test: {
    globals: true,
    watch: false,
    passWithNoTests: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/v1-backend',
      provider: 'v8',
    },
  },
});
