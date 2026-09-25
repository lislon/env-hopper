/*
 * Compiles ./entry.css the way a consumer of this package does, and returns both
 * the CSS and where it was written.
 *
 * This package's dist/index.css is only a *copy* of src/index.css — vite copies
 * it, the consumer's Tailwind compiles it — so grepping dist would prove only
 * that the text shipped. Compiling is the only way to see what the browser gets.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const here = path.dirname(fileURLToPath(import.meta.url))
export const pkgRoot = path.resolve(here, '../..')

export const compile = (outDir = mkdtempSync(path.join(tmpdir(), 'legacy-skin-'))) => {
  const out = path.join(outDir, 'out.css')
  execFileSync(
    path.join(pkgRoot, 'node_modules/.bin/tailwindcss'),
    ['-i', path.join(here, 'entry.css'), '-o', out],
    { cwd: pkgRoot, stdio: 'pipe' },
  )
  return { out, outDir, css: readFileSync(out, 'utf8') }
}
