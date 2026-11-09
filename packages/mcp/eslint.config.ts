// @ts-check

import type { Linter } from 'eslint'
import rootConfig from './root-symlink.eslint.config.js'

export default [...rootConfig] as Linter.Config[]
