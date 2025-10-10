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

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Template substitution helper
export function substituteTemplate(
  template: string,
  params: Record<string, string>,
): string {
  let result = template
  Object.entries(params).forEach(([key, value]) => {
    // Use global regex to replace all occurrences of {{key}} pattern
    const regex = new RegExp(`\\{\\{${escapeRegex(key)}\\}\\}`, 'g')
    result = result.replace(regex, value)
  })
  return result
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
