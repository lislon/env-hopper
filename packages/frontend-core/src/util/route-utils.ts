import { linkOptions } from '@tanstack/react-router'
import type { EhUrlParams } from '~/types/ehTypes'

/**
 * The url spelling of an app id: a trailing `/home` page is dropped, and any
 * other `/` becomes `@`.
 *
 * Deliberately does NOT percent-encode. Every caller hands the result to the
 * router as a path param, and the router encodes path params itself — with `@`
 * on its allow-list (`pathParamsAllowedCharacters`), because `@` is part of the
 * frozen url vocabulary. Encoding here as well turns an app id's `@` into `%40`
 * and then the router's own pass turns the `%` into `%25`, so a link to
 * `orders@shipments` navigated to `orders%2540shipments` and resolved nothing.
 */
export function escapeAppId(appId: string) {
  return appId.replace(/\/home$/, '').replace('/', '@')
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
  } else if (appId && subValue !== undefined) {
    return linkOptions({
      from: '/',
      to: '/app/$appSlug/sub/$subValue',
      params: {
        appSlug: escapeAppId(appId),
        subValue: escapeSubValue(subValue),
      },
    })
  } else if (appId) {
    // An app chosen before an environment keeps its own url. Without these two
    // branches the selection falls through to `/` and is silently dropped, and
    // the link the share button offers loses the app.
    return linkOptions({
      from: '/',
      to: '/app/$appSlug',
      params: {
        appSlug: escapeAppId(appId),
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
