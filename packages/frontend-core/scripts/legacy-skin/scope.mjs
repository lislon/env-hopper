/*
 * Scopes a compiled Tailwind-3 + daisyUI-4 stylesheet under `.eh-legacy`.
 * Used by generate.mjs; exported separately so the transform can be read and
 * reviewed on its own, because it is the part that can go subtly wrong.
 */

/* At-rules that may not legally sit inside a style rule, so they are lifted out
 * of the wrapper and emitted at the top level. */
const HOIST = ['keyframes', 'font-face', 'property', 'charset', 'import']

/** Splits off the top-level at-rules listed in HOIST. */
const hoistAtRules = (css) => {
  const hoisted = []
  let body = ''
  let i = 0
  while (i < css.length) {
    if (css[i] === '@') {
      const name = /^@([a-z-]+)/i.exec(css.slice(i, i + 20))?.[1] ?? ''
      if (HOIST.includes(name)) {
        const open = css.indexOf('{', i)
        if (open === -1) {
          const end = css.indexOf(';', i) + 1
          hoisted.push(css.slice(i, end))
          i = end
          continue
        }
        let depth = 0
        let j = open
        for (; j < css.length; j++) {
          if (css[j] === '{') depth++
          else if (css[j] === '}' && --depth === 0) break
        }
        hoisted.push(css.slice(i, j + 1))
        i = j + 1
        continue
      }
    }
    body += css[i++]
  }
  return { hoisted, body }
}

export const scope = (compiled, daisyLicence) => {
  const { hoisted, body: raw } = hoistAtRules(compiled)
  let body = raw

  /*
   * daisyUI declares its theme variables on `:root` / `[data-theme]`. Nesting
   * those under `.eh-legacy` would produce `.eh-legacy :root`, which matches
   * nothing — the palette would silently vanish. They have to land on the scope
   * element itself, which is what `&` does here. This is the step that broke the
   * first time it was written, hence the assertions in check.mjs.
   */
  body = body.replace(
    /@media \(prefers-color-scheme: dark\) \{\s*:root \{([^}]*)\}\s*\}/g,
    (_m, decls) => `:where(.dark) & {${decls}}`,
  )
  // The current app toggles themes with a `.dark` ancestor class, not data-theme.
  body = body.replace(/\[data-theme=dark\]/g, ':where(.dark) &')
  body = body.replace(/(^|[,{}\s])(:root|\[data-theme(=light)?\])(?=[,\s:{])/g, '$1&')
  // Page-level preflight cannot apply to a subtree; the host app owns html/body.
  body = body.replace(/(^|\n)(html|body)(,\s*:host)? \{[^}]*\}/g, '$1')

  /*
   * `@layer components` is load-bearing: unlayered, `.eh-legacy .btn` would beat
   * the current build's utilities, so a `p-8` next to a `btn` would be dropped
   * without a word. Inside the layer, the declared order `theme, base,
   * components, utilities` puts utilities on top again.
   */
  return `/*
 * GENERATED FILE — do not edit by hand.
 * Run scripts/legacy-skin/generate.mjs instead.
 *
 * The previous UI's appearance, compiled from Tailwind 3.4.17 + daisyUI 4.12.23
 * and scoped to \`.eh-legacy\` so it cannot touch the rest of the app. See
 * generate.mjs for why this is vendored rather than tracked against a current
 * daisyUI, and scope.mjs for the selector rewriting applied below.
 *
 * Contains daisyUI, redistributed under the MIT licence:
 *
${daisyLicence
  .split('\n')
  .map((l) => ` * ${l}`.trimEnd())
  .join('\n')}
 */
${hoisted.join('\n')}
@layer components {
  .eh-legacy {
${body}
  }
}
`
}
