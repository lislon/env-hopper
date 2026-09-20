/*
 * Fails if the legacy layer stops being scoped.
 *
 * jsdom runs with CSS off, so no unit test can see any of this; and this
 * package's dist/index.css is only a *copy* of src/index.css (vite copies it,
 * the consumer compiles it), so grepping dist proves only that the text
 * shipped. This therefore compiles the real stylesheet the way a consumer does
 * — Tailwind over ./entry.css, which imports ../../src/index.css — and asserts
 * on the compiled output.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot = path.resolve(here, '../..')
const out = path.join(mkdtempSync(path.join(tmpdir(), 'eh-legacy-scope-')), 'out.css')

execFileSync(
  path.join(pkgRoot, 'node_modules/.bin/tailwindcss'),
  ['-i', path.join(here, 'entry.css'), '-o', out],
  { cwd: pkgRoot, stdio: 'pipe' },
)
const css = readFileSync(out, 'utf8')

const count = (re) => (css.match(re) ?? []).length

// The prefix holds: daisyUI's component classes exist only as `d-*`. `fixture.html`
// deliberately uses the unprefixed names too, so a hit here means a real leak.
for (const name of ['btn', 'menu', 'card', 'alert', 'badge', 'modal', 'tab']) {
  assert.equal(
    count(new RegExp(`(^|[^-\\w.])\\.${name}(?![-\\w])`, 'g')),
    0,
    `unprefixed daisyUI class .${name} was emitted — the prefix option is not applying`,
  )
}
assert.ok(count(/\.d-btn\b/g) > 0, 'no .d-btn rules — daisyUI did not compile at all')

// The root option holds: daisyUI's palette is declared for `.eh-legacy` only.
assert.ok(
  /:where\(\.eh-legacy\)[^{]*\{[^}]*--color-primary:/.test(css),
  'daisyUI theme block is not scoped to .eh-legacy',
)
assert.ok(
  /^\.eh-legacy \{[^}]*--color-base-100:/m.test(css),
  'the legacy (daisyUI 4) palette override for .eh-legacy is missing',
)
assert.ok(
  /^\.dark \.eh-legacy[^{]*\{[^}]*--color-base-100:/m.test(css),
  'the legacy dark palette is missing',
)

// No daisyUI declaration may reach an un-scoped subtree. These two `base` items
// do, so they are excluded; see the note in src/legacy-theme.css.
assert.equal(count(/scrollbar-color/g), 0, 'daisyUI restyled the page scrollbar globally')
assert.equal(
  count(/^\s*:root, \[data-theme\] \{/gm),
  0,
  'daisyUI is painting :root / any [data-theme] element',
)

// The colliding theme colour names resolve to shadcn's tokens, which the
// .eh-legacy block re-points — so `bg-primary` is legacy inside, shadcn outside.
assert.ok(
  /\.bg-primary \{\s*background-color: var\(--primary\)/.test(css),
  'bg-primary no longer resolves to shadcn --primary; the legacy/shadcn palette split is broken',
)
assert.ok(
  /^\.eh-legacy \{[^}]*--primary: var\(--color-primary\)/m.test(css),
  '.eh-legacy does not re-point shadcn --primary at the legacy palette',
)

// daisyUI's `--border` is a width, shadcn's is a colour, so `* { border-color:
// var(--border) }` is invalid inside the subtree and needs its own default.
assert.ok(
  /\.eh-legacy \*[^{]*\{\s*border-color: #e5e7eb/.test(css),
  'the legacy subtree lost its default border colour; borders there fall back to currentColor',
)

console.log('legacy scope check: ok')
