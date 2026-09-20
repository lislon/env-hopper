import { linkOptions } from '@tanstack/react-router'
import type { EhUrlParams } from '~/types/ehTypes'

export function escapeAppId(appId: string) {
  return encodeURIComponent(appId.replace(/\/home$/, '').replace('/', '@'))
}

/**
 * The app a jump slug belongs to.
 *
 * A jump slug flattens app and page into one segment, as `escapeAppId` above
 * shows: a page named `home` is dropped, any other page becomes an `@<page>`
 * suffix. So a jump slug is NOT interchangeable with an app slug — a single-page
 * app whose one page is not named `home` has a slug carrying the suffix, and
 * looking that up in a collection keyed by app would miss.
 *
 * Cutting at the `@` rather than changing the slug, because the slug is the
 * bookmarkable url and is frozen. Grouped apps are unaffected: a group slug
 * carries no suffix, so this is a no-op for them.
 */
export function appSlugFromJumpSlug(jumpSlug: string): string {
  return jumpSlug.split('@')[0]!
}

export function escapeSubValue(subValue: string) {
  return encodeURIComponent(subValue)
}

export function escapeEnvId(envId: string) {
  return encodeURIComponent(envId)
}

export function getEhToOptions({ appId, envId, subValue }: EhUrlParams) {
  if (appId && envId && subValue !== undefined) {
    return linkOptions({
      from: '/',
      to: '/env/$envSlug/app/$appSlug/sub/$subValue',
      params: {
        appSlug: escapeAppId(appId),
        envSlug: escapeEnvId(envId),
        subValue: escapeSubValue(subValue),
      },
    })
  } else if (appId && envId) {
    return linkOptions({
      from: '/',
      to: '/env/$envSlug/app/$appSlug',
      params: {
        appSlug: escapeAppId(appId),
        envSlug: escapeEnvId(envId),
      },
    })
  } else if (envId) {
    return linkOptions({
      from: '/',
      to: '/env/$envSlug',
      params: {
        envSlug: escapeEnvId(envId),
      },
    })
  } else {
    return linkOptions({
      from: '/',
      to: '/',
    })
  }
}
