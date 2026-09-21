// Generic structure for default + overrides with string template support
export interface DefaultWithOverridesAndTemplate {
  // Default value (string template)
  default: string

  // Overrides for specific keys (string templates)
  overrides?: Record<string, string>

  // Template parameters for substitution
  templateParams?: Record<string, Record<string, string>>
}

// Generic resolution function for string templates
export function resolveTemplate(
  key: string,
  data: DefaultWithOverridesAndTemplate,
  params?: Record<string, string>,
): string {
  // Get the base value (override or default)
  let value: string

  if (data.overrides?.[key]) {
    value = data.overrides[key]
  } else {
    value = data.default
  }

  // Apply template substitution if params are provided
  if (params) {
    value = substituteTemplate(value, params)
  }

  return value
}

const PLACEHOLDER_RE = /\{\{([^{}]*)\}\}/g
const DEFAULT_OPERATOR = '??'

/**
 * How deep a substituted value may itself be substituted. The counter counts
 * nesting, not whole-string passes: each value a placeholder resolves to is
 * scanned at depth+1.
 *
 * Two was too few. A real chain runs three deep — a page url names an app-level
 * alias, which names another app-level pattern, which names env-level values
 * (`env.meta.subdomain`). At two the env tokens came out raw, which is why
 * app-level patterns had to be flattened server-side before the client ever saw
 * them.
 *
 * Five leaves room for a longer alias chain without making the bound accidental:
 * whatever the last level substitutes in is inserted verbatim, which is what
 * stops a self-referential key from looping. A chain deeper than this
 * deliberately resolves to a raw `{{...}}` so callers can still detect an
 * unresolvable template — see the test that pins that.
 */
export const MAX_TEMPLATE_PASSES = 5

export interface SubstituteTemplateOptions {
  /**
   * Keys whose values are user input. Their values are inserted verbatim and
   * never scanned, so a typed `{{` cannot turn into a token — without this a
   * parameter value would be a url injection point.
   */
  literalKeys?: ReadonlySet<string>
}

/**
 * Template substitution helper.
 *
 * `{{key}}` is replaced by `params[key]`, or left verbatim when the key is
 * missing — callers rely on that to detect an unresolvable template.
 *
 * `{{a ?? b ?? c}}` tries each segment as a parameter key, left to right, first
 * hit wins. The last segment doubles as a literal default when no segment names
 * a known key, so `{{key ?? fallback}}` still substitutes `fallback` and an
 * empty right side (`{{key ?? }}`) still substitutes ''. Whitespace around the
 * segments and the operator is ignored.
 *
 * A substituted value may itself contain placeholders, and those are resolved
 * too — but only within the text that was just substituted in, never across the
 * rest of the string. That keeps the two bugs a single pass avoided: a value
 * containing `??` is not re-parsed as an expression, and a value containing `$&`
 * or `$1` is not read as a regex replacement pattern.
 */
export function substituteTemplate(
  template: string,
  params: Record<string, string>,
  options: SubstituteTemplateOptions = {},
): string {
  const { literalKeys } = options

  const scan = (text: string, pass: number): string => {
    // Stopping as soon as there is nothing left to substitute is what makes the
    // common single-hop template cost exactly one pass.
    if (pass >= MAX_TEMPLATE_PASSES || !text.includes('{{')) {
      return text
    }
    return text.replace(PLACEHOLDER_RE, (placeholder, expression: string) => {
      const segments = expression.split(DEFAULT_OPERATOR).map((s) => s.trim())
      for (const segment of segments) {
        const value = segment === '' ? undefined : params[segment]
        if (value === undefined) {
          continue
        }
        return literalKeys?.has(segment) ? value : scan(value, pass + 1)
      }
      return segments.length > 1 ? segments[segments.length - 1]! : placeholder
    })
  }

  return scan(template, 0)
}

/**
 * Merges the parameter sources a jump url resolves against, lowest precedence
 * first: app meta, environment params, this jump's params for that environment,
 * then the late-resolvable values the user supplied.
 */
export function substituteTemplateWithEnvParams(
  template: string,
  key: string,
  envParams?: Record<string, string>,
  resourceTemplateParams?: Record<string, Record<string, string>>,
  additionalParams?: Record<string, string>,
  appParams?: Record<string, string>,
): string {
  const mergedParams = {
    ...appParams,
    ...envParams,
    ...resourceTemplateParams?.[key],
    ...additionalParams,
  }
  return substituteTemplate(template, mergedParams, {
    // `additionalParams` is what a user typed, so it must not be re-scanned.
    literalKeys: new Set(Object.keys(additionalParams ?? {})),
  })
}
