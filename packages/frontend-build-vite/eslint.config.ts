import type { Linter } from 'eslint'
import rootConfig from './root-symlink.eslint.config'

export default [...rootConfig] as Array<Linter.Config>
