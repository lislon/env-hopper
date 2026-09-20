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
 * How many times a template is scanned for `{{...}}`. Two covers the chain we
 * have — the template names an app-level pattern, which names env-level values.
 * Whatever the last pass substitutes in is inserted verbatim, which is also
 * what stops a self-referential key from looping.
 */
export const MAX_TEMPLATE_PASSES = 2

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
