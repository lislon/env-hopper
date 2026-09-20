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
 * Template substitution helper.
 *
 * `{{key}}` is replaced by `params[key]`, or left verbatim when the key is
 * missing — callers rely on that to detect an unresolvable template.
 * `{{key ?? fallback}}` substitutes `fallback` instead when the key is missing;
 * an empty right side (`{{key ?? }}`) means "drop it", i.e. substitute ''.
 * Whitespace around the key and the operator is ignored.
 */
export function substituteTemplate(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(PLACEHOLDER_RE, (placeholder, expression: string) => {
    const operatorAt = expression.indexOf(DEFAULT_OPERATOR)
    const key = (
      operatorAt === -1 ? expression : expression.slice(0, operatorAt)
    ).trim()

    const value = params[key]
    if (value !== undefined) {
      return value
    }
    return operatorAt === -1
      ? placeholder
      : expression.slice(operatorAt + DEFAULT_OPERATOR.length).trim()
  })
}

// Wrapper function that merges env params with resource params
export function substituteTemplateWithEnvParams(
  template: string,
  key: string,
  envParams?: Record<string, string>,
  resourceTemplateParams?: Record<string, Record<string, string>>,
  additionalParams?: Record<string, string>,
): string {
  const mergedParams = {
    ...envParams,
    ...resourceTemplateParams?.[key],
    ...additionalParams,
  }
  return substituteTemplate(template, mergedParams)
}
