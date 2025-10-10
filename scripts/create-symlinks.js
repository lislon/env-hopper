// scripts/create-symlinks.js
// This script creates symlinks for eslint.config.js in each package, supporting both Windows and Linux.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '..')
const src = path.join(repoRoot, 'eslint.config.js')
const targets = [
  {
    src,
    dest: path.resolve(
      repoRoot,
      'examples/backend-example/root-symlink.eslint.config.js',
    ),
  },
  {
    src,
    dest: path.resolve(
      repoRoot,
      'packages/backend-core/root-symlink.eslint.config.js',
    ),
  },
  {
    src,
    dest: path.resolve(
      repoRoot,
      'packages/shared-core/root-symlink.eslint.config.js',
    ),
  },
  {
    src,
    dest: path.resolve(
      repoRoot,
      'packages/frontend/root-symlink.eslint.config.js',
    ),
  },
]

function createSymlink(srcPath, destPath) {
  // Remove existing file/symlink if present
  if (fs.existsSync(destPath)) {
    fs.unlinkSync(destPath)
  }
  // On Windows, use 'junction' for directories, 'file' for files
  const type = process.platform === 'win32' ? 'file' : null
  fs.symlinkSync(srcPath, destPath, type)
  console.log(`Symlink created: ${destPath} -> ${srcPath}`)
}

for (const { src: sourcePath, dest: destPath } of targets) {
  try {
    createSymlink(sourcePath, destPath)
  } catch (err) {
    console.error(`Failed to create symlink for ${destPath}:`, err)
  }
}
