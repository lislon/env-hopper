// @ts-check

// @ts-ignore Needed due to moduleResolution Node vs Bundler
import pluginCspell from '@cspell/eslint-plugin'
import { tanstackConfig } from '@tanstack/eslint-config'
import vitest from '@vitest/eslint-plugin'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    name: 'env-hopper/ignores',
    ignores: ['**/dist-ts/**', '**/src/generated/**'],
  },
  ...tanstackConfig,
  {
    name: 'disable-because-i-cant-fix-vscode',
    rules: {
      'import/order': 'off',
    },
  },
  {
    name: 'tanstack/temp',
    plugins: {
      cspell: pluginCspell,
    },
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'no-case-declarations': 'off',
    },
  },
  {
    files: ['**/*.spec.ts*', '**/*.test.ts*', '**/*.test-d.ts*'],
    plugins: { vitest },
    rules: vitest.configs.recommended.rules,
    settings: { vitest: { typecheck: true } },
  },
]
