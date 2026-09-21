import {
  resolveTemplate,
  substituteTemplateWithEnvParams,
} from '@env-hopper/shared-core'
import type {
  EhApp,
  EhEnv,
  EhSubstitutionId,
  EhSubstitutionValue,
} from '../types'

/**
 * Which placeholder the jump url still needs a value for.
 *
 * Unchanged in spirit: resolve everything the environment can supply, then look
 * at what is left over. The previous UI resolved with its own interpolator; this
 * one hands the work to the current template resolver, which leaves an unknown
 * `{{name}}` in place — so the same regex finds the same answer.
 */
export function findSubstitutionIdByUrl({
  app,
  env,
}: {
  app: EhApp | undefined
  env: EhEnv | undefined
}): EhSubstitutionId | undefined {
  if (app === undefined) {
    return undefined
  }
  const urlPattern = getJumpUrlEvenNotComplete({ app, env })
  const match = urlPattern.match(/{{(.+?)}}/)
  return match ? match[1] : undefined
}

export interface JumpDataParams {
  env?: EhEnv
  app?: EhApp
  substitution?: EhSubstitutionValue
}

export interface JumpDataParamsForce extends JumpDataParams {
  app: EhApp
}

export function hasUnresolvedSubstitution(str: string) {
  return str.includes('{{')
}

export type EhAppForInterpolate = Pick<EhApp, 'meta'>

/**
 * Where a single `{{...}}` placeholder gets its value.
 *
 * INTENTIONAL DIFF: the previous UI only ever looked in `env.meta[key]` and
 * `app.meta[key]`, because its payload keyed environment parameters by the bare
 * key (`k8sCtx`). The current payload keys them by the WHOLE placeholder name
 * (`env.meta.k8sCtx`) in `templateParams`, which is also what the current url
 * resolver reads. Both shapes are accepted so the widgets resolve against
 * whichever a deployment serves, and no widget has to know which.
 */
function resolveWidgetPlaceholder(
  placeholder: string,
  env: EhEnv | undefined,
  app: EhAppForInterpolate | undefined,
): string | undefined {
  if (placeholder === 'env.id') {
    return env?.id
  }
  const qualified =
    env?.templateParams?.[placeholder] ?? env?.meta?.[placeholder]
  if (qualified !== undefined) {
    return qualified
  }
  if (placeholder.startsWith('env.meta.')) {
    return env?.meta?.[placeholder.slice('env.meta.'.length)]
  }
  if (placeholder.startsWith('app.meta.')) {
    return app?.meta?.[placeholder.slice('app.meta.'.length)]
  }
  return undefined
}

/**
 * Resolve the `{{...}}` placeholders a widget value carries, leaving anything
 * unknown in place so the user can see what is missing.
 *
 * `{{a ?? fallback}}` supplies a default. Nested placeholders are handled by
 * looping until nothing changes, capped like the original at ten passes.
 */
export function interpolateWidgetStr(
  str: string,
  env: EhEnv | undefined,
  app: EhAppForInterpolate | undefined,
) {
  let result = str
  let hasChanges = true

  for (let pass = 0; hasChanges && pass < 10; pass++) {
    hasChanges = false
    let start = result.indexOf('{{')

    for (let iteration = 0; start !== -1 && iteration < 10; iteration++) {
      const end = result.indexOf('}}', start + 2)
      if (end === -1) break

      const betweenBraces = result.slice(start + 2, end)
      const [placeholder, placeholderDefault] =
        betweenBraces.indexOf('??') >= 0
          ? betweenBraces.split(/\s*[?][?]\s*/)
          : [betweenBraces, undefined]

      const replacement =
        resolveWidgetPlaceholder(placeholder, env, app) ?? placeholderDefault

      if (replacement !== undefined) {
        result = result.slice(0, start) + replacement + result.slice(end + 2)
        hasChanges = true
      } else {
        // Leave the unresolved placeholder as it stands and look past it.
        start = end + 2
      }

      start = result.indexOf('{{', start)
    }
  }

  return result
}

/**
 * INTENTIONAL DIFF — the one place the previous url mechanics are replaced.
 *
 * The previous UI kept a single `app.url` string and interpolated `{{env.id}}`
 * and `{{env.meta.*}}` itself, ten passes deep. The current backend ships a
 * template object per app with per-environment overrides and named parameters,
 * and a resolver for it already exists and is already tested. Calling that
 * resolver here keeps the substitution mechanics in ONE place for both skins:
 * everything a component sees is still "a url string, possibly with a hole in
 * it", so no caller changed.
 */
export function getJumpUrlEvenNotComplete({
  app,
  env,
  substitution,
}: JumpDataParamsForce) {
  const envId = env?.id ?? ''
  const template = resolveTemplate(envId, app.urlTemplate)
  return substituteTemplateWithEnvParams(
    template,
    envId,
    env?.templateParams,
    app.urlTemplate.templateParams,
    substitution !== undefined && substitution.name.trim() !== ''
      ? { [substitution.name]: substitution.value }
      : undefined,
  )
}

function isSubstitutionNotProvided(
  substitution: EhSubstitutionValue | undefined,
) {
  return substitution === undefined || substitution.name.trim() === ''
}

export function getJumpUrl({ app, env, substitution }: JumpDataParams) {
  if (app === undefined) {
    return undefined
  }
  if (env === undefined) {
    return undefined
  }
  if (
    isSubstitutionNotProvided(substitution) &&
    hasUnresolvedSubstitution(getJumpUrlEvenNotComplete({ app, env }))
  ) {
    return undefined
  }
  return getJumpUrlEvenNotComplete({ app, env, substitution })
}

export function cutDomain(fullUrl: string) {
  return fullUrl.split('/')[2] ?? ''
}

export function cutApp(fullUrl: string) {
  return fullUrl.split('/').slice(3).join('/')
}

export function formatAppTitle(app: EhApp | undefined) {
  if (app === undefined) {
    return ''
  }
  return [app.abbr, app.appTitle, app.pageTitle].filter(Boolean).join(' :: ')
}

export interface SensitiveDataCtx {
  env: EhEnv | undefined
}

export function isNeedMaskSensitiveData({ env }: SensitiveDataCtx) {
  return env?.envType === 'prod'
}

export function maskSensitiveDataIfNeeded<T extends string | undefined>(
  value: T,
  ctx: SensitiveDataCtx,
): T {
  if (isNeedMaskSensitiveData(ctx) && value !== undefined) {
    return '*masked*' as T
  }
  return value
}
