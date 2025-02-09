import pluginReact from '@eslint-react/eslint-plugin'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import rootConfig from './root-symlink.eslint.config'

export default [
  ...rootConfig,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    ...pluginReact.configs.recommended,
  },
  {
    plugins: {
      'react-hooks': pluginReactHooks,
      // '@eslint-react': pluginReact,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // '@eslint-react/no-unstable-context-value': 'off',
      // '@eslint-react/no-unstable-default-props': 'off',
      // '@eslint-react/dom/no-missing-button-type': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
]
