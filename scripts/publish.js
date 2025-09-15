// @ts-check

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publish } from '@tanstack/config/publish'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

await publish({
  packages: [
    {
      name: '@env-hopper/shared-core',
      packageDir: 'packages/shared-core',
    },
    {
      name: '@env-hopper/backend-core',
      packageDir: 'packages/backend-core',
    },
    {
      name: '@env-hopper/frontend-core',
      packageDir: 'packages/frontend-core',
    },
    {
      name: '@env-hopper/frontend-build-vite',
      packageDir: 'packages/frontend-build-vite',
    },
  ],
  branchConfigs: {
    main: {
      prerelease: false,
    },
    alpha: {
      prerelease: true,
    },
    beta: {
      prerelease: true,
    },
  },
  rootDir: resolve(__dirname, '..'),
  branch: process.env.BRANCH,
  tag: process.env.TAG,
  ghToken: process.env.GH_TOKEN,
})

process.exit(0)
