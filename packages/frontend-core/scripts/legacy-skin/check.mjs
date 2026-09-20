/*
 * Fails if the vendored legacy skin stops being faithful or stops being scoped.
 *
 * Every assertion here exists because something specific can break silently.
 * The theme ones in particular: the first version of scope.mjs stranded the light
 * palette on a `:root` selector that could never match, and nothing complained.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { compile, pkgRoot } from './compile.mjs'

const { css } = compile()
/*
 * A few things have to be true of the vendored file itself, not just of the
 * compiled sheet: ./index.css carries dead remnants of the previous app — its own
 * `@keyframes button-pop`, `--animation-btn` and `--btn-focus-scale` — which would
 * satisfy a whole-sheet assertion even if the skin had lost them entirely.
 */
const skin = readFileSync(path.join(pkgRoot, 'src/legacy-skin.css'), 'utf8')
const count = (re) => (css.match(re) ?? []).length

/** The text inside the `.eh-legacy { ... }` wrapper, brace-matched. */
const scopeBlock = (() => {
  const at = css.indexOf('.eh-legacy {')
  assert.notEqual(
    at,
    -1,
    'the .eh-legacy wrapper is missing entirely — the skin is not scoped at all',
  )
  const open = css.indexOf('{', at)
  let depth = 0
  let i = open
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) break
  }
  return css.slice(open + 1, i)
})()

/* --- the animation daisyUI 5 could not reproduce, which is why this is vendored --- */

assert.ok(
  /@keyframes button-pop\s*\{/.test(skin),
  'the skin no longer carries the button-pop keyframes',
)
assert.ok(
  /@keyframes button-pop\s*\{/.test(css),
  'the button-pop keyframes did not survive compilation',
)
assert.ok(
  /@media \(prefers-reduced-motion: no-preference\) \{[^@]*animation: button-pop var\(--animation-btn/.test(
    css,
  ),
  'button-pop no longer runs on .btn — the reduced-motion driver is missing',
)
assert.ok(
  /\.btn:active:hover[^{]*\{[^}]*animation: button-pop 0s ease-out/.test(css),
  'button-pop no longer retriggers on press — the :active driver is missing',
)

/* --- the four geometry and timing tokens daisyUI 5 dropped --- */

/*
 * Asserted against the scope block, not the whole sheet: ./index.css happens to
 * declare --animation-btn and --btn-focus-scale at :root as leftovers from the
 * previous app, so a whole-sheet check passes even when the skin has lost them.
 */
for (const token of [
  '--animation-btn',
  '--btn-focus-scale',
  '--tab-border',
  '--tab-radius',
]) {
  assert.ok(
    new RegExp(`${token}:`).test(scopeBlock),
    `${token} is not declared inside the scope — the previous UI's feel depends on it`,
  )
}

/* --- both palettes. This is the one that already slipped through once. --- */

assert.ok(
  /--p: 49\.12% 0\.3096 275\.75/.test(css),
  'the light palette is missing or stranded on a selector that cannot match',
)
assert.ok(
  /--p: 65\.69% 0\.196 275\.75/.test(css),
  'the dark palette is missing or stranded on a selector that cannot match',
)
assert.equal(
  (scopeBlock.match(/(^|[,{}\s]):root[,\s{]/g) ?? []).length,
  0,
  'a :root selector survived inside the scope wrapper, where it can never match',
)
assert.ok(
  /--p: 49\.12% 0\.3096 275\.75/.test(scopeBlock),
  'the light palette is outside the scope wrapper, so it will not reach the skin',
)

/* --- scoping, in both directions --- */

for (const name of ['btn', 'menu', 'card', 'alert', 'badge', 'tab', 'toggle']) {
  assert.equal(
    count(new RegExp(`^\\.${name}(?![-\\w])`, 'gm')),
    0,
    `.${name} is emitted outside .eh-legacy — the skin is leaking`,
  )
}
assert.ok(/\.eh-legacy \.btn\b|\.eh-legacy \{/.test(css), 'the skin did not compile at all')
assert.ok(
  /@layer components \{/.test(css),
  'the @layer components wrapper is gone — the skin would silently outrank utilities',
)

/* --- the Tailwind 3 runtime variables the vendored CSS reads, scoped not global --- */

assert.ok(
  /\*, ::before, ::after \{[^}]*--tw-border-spacing-x:/.test(scopeBlock),
  'the Tailwind 3 --tw-* defaults are missing from the scope wrapper; the vendored CSS reads 45 of them',
)
assert.ok(
  /--tw-shadow:/.test(scopeBlock) && /--tw-bg-opacity:/.test(scopeBlock),
  'the Tailwind 3 shadow/opacity runtime variables are missing from the scope wrapper',
)
assert.equal(
  count(/^\s{0,2}\*, ::before, ::after \{/gm),
  0,
  'the Tailwind 3 --tw-* defaults leaked to a global selector',
)

/* --- the grid utilities that replace the Tailwind-3-only plugin --- */

for (const area of [
  'e-input',
  'e-bar',
  'a-input',
  'a-bar',
  'a-widgets',
  's-input',
  'jump',
  'ui-widget',
  'history',
]) {
  assert.ok(
    new RegExp(`\\.grid-in-${area} \\{`).test(css),
    `grid-in-${area} is not emitted`,
  )
}
for (const u of [
  'grid-areas-layout-md',
  'grid-areas-layout-sm',
  'grid-cols-layout-2xl',
  'grid-cols-layout-md',
  'grid-cols-layout-sm',
]) {
  assert.ok(new RegExp(`\\.${u} \\{`).test(css), `${u} is not emitted`)
}

/* --- no token clash with the current stack: this is why daisyUI 4 was chosen --- */

assert.equal(
  count(/^\s*--border: (?!oklch|hsl|#|var)/gm),
  0,
  '--border is being set to something other than a colour; the skin is clashing with the current tokens',
)

console.log('legacy skin check: ok')
