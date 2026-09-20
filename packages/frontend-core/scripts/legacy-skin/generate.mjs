/*
 * Regenerates src/legacy-skin.css. A maintenance script, not part of build or
 * test — run it by hand only if the vendored skin ever has to change.
 *
 * The previous UI was Tailwind 3.4.17 + daisyUI 4.12.23 with the stock `light`
 * and `dark` themes. Rather than track that look by hand against a newer daisyUI
 * (whose variable names collide with the current stack's), we compile the old
 * toolchain once and vendor its output, scoped to `.eh-legacy`.
 *
 * Why the *generated* output and not daisyui/dist/styled.css: the compiled CSS
 * reads 45 Tailwind-3 runtime variables (--tw-bg-opacity, --tw-shadow,
 * --tw-ring-offset-shadow, ...). Tailwind 3's preflight declares all 179 of them
 * on `*, ::before, ::after`, and only the full compile includes that block — once
 * scoped it becomes `.eh-legacy *, .eh-legacy ::before, .eh-legacy ::after`, so
 * the artifact is self-contained and needs no hand-written shim to rot.
 *
 * The old toolchain is installed into a temp directory so it never becomes a
 * dependency of this repo.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { scope } from './scope.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(here, '../../src/legacy-skin.css')

// Pinned to exactly what the previous UI shipped.
const DEPS = [
  'tailwindcss@3.4.17',
  'daisyui@4.12.23',
  '@tailwindcss/typography@0.5.15',
  'postcss@8.5.3',
  'autoprefixer@10.4.20',
]

const work = mkdtempSync(path.join(tmpdir(), 'legacy-skin-'))
const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: work, stdio: 'inherit', timeout: 10 * 60_000 })

console.log(`installing the previous toolchain in ${work}`)
run('npm', ['init', '-y'])
run('npm', ['install', '--no-audit', '--no-fund', ...DEPS])

/*
 * The previous app's config, minus the parts that must stay utilities in the
 * current build rather than being frozen into the skin: the grid-areas plugin,
 * the custom grid templates and the one custom colour all live in
 * src/legacy-theme.css instead, so variants like `md:` keep working on them.
 *
 * `content` points at daisyUI's own compiled CSS, which mentions every class it
 * ships, so the whole component set is generated once and this never has to run
 * again when the port starts using another component. `prose` is listed because
 * the previous UI used it.
 */
writeFileSync(
  path.join(work, 'tailwind.config.js'),
  `module.exports = {
  content: ['./node_modules/daisyui/dist/styled.css', './classes.txt'],
  darkMode: 'selector',
  daisyui: {
    themes: [
      { light: { ...require('daisyui/src/theming/themes')['light'] } },
      { dark: { ...require('daisyui/src/theming/themes')['dark'] } },
    ],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
}
`,
)
writeFileSync(path.join(work, 'classes.txt'), 'prose\neh-quick-bar\n')
/*
 * The previous app's own stylesheet goes in ahead of the `@tailwind` directives,
 * exactly where its `styles.css` imported it, so its `@apply`s are expanded by
 * the toolchain that understood them and it keeps its place in the cascade.
 */
writeFileSync(
  path.join(work, 'in.css'),
  `${readFileSync(path.join(here, 'eh-quick-bar.css'), 'utf8')}
@tailwind base;
@tailwind components;
@tailwind utilities;
`,
)

run(path.join(work, 'node_modules/.bin/tailwindcss'), [
  '-c',
  path.join(work, 'tailwind.config.js'),
  '-i',
  path.join(work, 'in.css'),
  '-o',
  path.join(work, 'out.css'),
])

const compiled = readFileSync(path.join(work, 'out.css'), 'utf8')
const daisyLicence = readFileSync(
  path.join(work, 'node_modules/daisyui/LICENSE'),
  'utf8',
).trim()

writeFileSync(target, scope(compiled, daisyLicence))
console.log(`wrote ${target} (${readFileSync(target).length} bytes)`)
