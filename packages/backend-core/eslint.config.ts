import type { Linter } from 'eslint'
import rootConfig from './root-symlink.eslint.config'

export default [
  ...rootConfig,
  {
    ignores: ['src/generated/**'],
  },
] as Linter.Config[]
