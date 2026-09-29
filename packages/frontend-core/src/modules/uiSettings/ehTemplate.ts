import { substituteTemplate } from '@env-hopper/shared-core'
import type { EhMetaDictionary } from '@env-hopper/backend-core'

export interface EhTemplateApp {
  slug: string
  displayName: string
  meta?: EhMetaDictionary
}

export interface EhTemplateEnv {
  slug: string
  displayName: string
  templateParams?: Record<string, string>
  meta?: EhMetaDictionary
}

/** What `{{...}}` placeholders resolve against. */
export interface EhTemplateSelection {
  app?: EhTemplateApp
  env?: EhTemplateEnv
}

const UNRESOLVED_RE = /\{\{[^{}]*\}\}/

function addMeta(
  params: Record<string, string>,
  prefix: string,
  meta: EhMetaDictionary | undefined,
) {
  for (const [key, value] of Object.entries(meta ?? {})) {
    if (typeof value === 'string') {
      params[`${prefix}.${key}`] = value
    } else if (value !== null) {
      // A nested dictionary flattens to `prefix.key.subKey`.
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue !== null) {
          params[`${prefix}.${key}.${subKey}`] = subValue
        }
      }
    }
    // null means "no value": left out so `{{key ?? default}}` can kick in.
  }
}

/**
 * The placeholders available to a template. Environment `templateParams` keep
 * their bare names, matching how jump url templates already use them.
 */
export function buildEhTemplateParams({
  app,
  env,
}: EhTemplateSelection): Record<string, string> {
  const params: Record<string, string> = { ...env?.templateParams }
  if (app) {
    params['app.slug'] = app.slug
    params['app.displayName'] = app.displayName
    addMeta(params, 'app.meta', app.meta)
  }
  if (env) {
    params['env.slug'] = env.slug
    params['env.displayName'] = env.displayName
    addMeta(params, 'env.meta', env.meta)
  }
  return params
}

/**
 * Resolve a template against the current selection, or `undefined` when any
 * placeholder is left unresolved — a caller rendering a url must skip it
 * rather than link somewhere broken.
 */
export function resolveEhTemplate(
  template: string,
  selection: EhTemplateSelection,
): string | undefined {
  const result = substituteTemplate(template, buildEhTemplateParams(selection))
  return UNRESOLVED_RE.test(result) ? undefined : result
}
