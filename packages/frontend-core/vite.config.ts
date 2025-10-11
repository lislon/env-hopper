import { defineConfig, mergeConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import { tanstackViteConfig } from '@tanstack/config/vite'
import svgr from 'vite-plugin-svgr'
import packageJson from './package.json'
import type { UserConfig } from 'vite'

const config = defineConfig(({ mode }) => {
  const tsconfigPath = mode === 'lenient' ? './tsconfig-lenient.json' : './tsconfig.json'
  const myConfig: UserConfig = {
    test: {
      name: packageJson.name,
      dir: './src/__tests__',
      watch: false,
      environment: 'jsdom',
      typecheck: { enabled: true },
    },
    plugins: [viteReact(), svgr()],
  }

  return mergeConfig(
    myConfig,
    tanstackViteConfig({
      entry: './src/index.tsx',
      srcDir: './src',
      cjs: false,
      tsconfigPath,
    }),
  )
})

export default config
