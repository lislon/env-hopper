import {
  resolveTemplate,
  substituteTemplateWithEnvParams,
} from '@env-hopper/shared-core'
import type {
  EhApp,
  EhAppId,
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

/**
 * Reverses the `/` → `@` rewrite the link builder applies.
 *
 * INTENTIONAL DIFF: the previous version also appended `/home` to any id with
 * no `/` in it, mirroring a page-per-app data model the current backend does not
 * have — its slugs never carry `/home`, so re-adding it would fail every lookup.
 * The `@` half of the quirk is kept, because links in the wild use it.
 */
export function unescapeAppId(appIdFromUrl: string): EhAppId {
  return appIdFromUrl.replace('@', '/')
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
