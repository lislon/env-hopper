import { Eta } from 'eta'

export interface UrlFormatterContext {
  appMeta?: Record<string, unknown>
  envMeta?: Record<string, unknown>
}

/**
 * Recursively renders template until all `${...}` expressions are resolved or max depth reached.
 */
export function ehFormatUrl(input: string, ctx: UrlFormatterContext): string {
  const MAX_PASSES = 5
  let current = input
  let previous = ''

  // Disable auto-escaping to prevent HTML escaping of template content
  const eta = new Eta({ autoEscape: false })

  const safeCtx = {
    appMeta: ctx.appMeta ?? {},
    envMeta: ctx.envMeta ?? {},
  }

  // Safe wrapper: missing props won't throw
  const safeTemplate = (etaTemplate: string) => {
    try {
      return eta.renderString(etaTemplate, safeCtx)
    } catch (error) {
      return etaTemplate // fallback for missing deep keys or syntax error
    }
  }

  for (let i = 0; i < MAX_PASSES; i++) {
    previous = current
    current = safeTemplate(current)

    // Check if we still have ${...} patterns that need processing
    if (!/<%=/.test(current)) {
      break
    }
    // Also break if no changes were made to prevent infinite loops
    if (current === previous) {
      break
    }
  }

  return current
}
