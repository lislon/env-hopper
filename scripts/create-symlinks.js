// scripts/create-symlinks.js
// This script creates symlinks for eslint.config.js in each package, supporting both Windows and Linux.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

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

function createSymlink(src, dest) {
  // Remove existing file/symlink if present
  if (fs.existsSync(dest)) {
    fs.unlinkSync(dest)
  }
  // On Windows, use 'junction' for directories, 'file' for files
  const type = process.platform === 'win32' ? 'file' : null
  fs.symlinkSync(src, dest, type)
  console.log(`Symlink created: ${dest} -> ${src}`)
}

for (const { src, dest } of targets) {
  try {
    createSymlink(src, dest)
  } catch (err) {
    console.error(`Failed to create symlink for ${dest}:`, err)
  }
}
