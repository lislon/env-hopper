import type { ToOptions } from '@tanstack/react-router'
import type { EhUrlParams } from '~/types/ehTypes'

export function escapeAppId(appId: string) {
  return encodeURIComponent(appId.replace(/\/home$/, '').replace('/', '@'))
}

export function escapeSubValue(subValue: string) {
  return encodeURIComponent(subValue)
}

export function escapeEnvId(envId: string) {
  return encodeURIComponent(envId)
}

export function getEhToOptions({
  appId,
  envId,
  subValue,
}: EhUrlParams): ToOptions {
  if (appId && envId && subValue) {
    return {
      from: '/',
      to: '/env/$envSlug/app/$appSlug/sub/$subValue',
      params: {
        appSlug: escapeAppId(appId),
        envSlug: escapeEnvId(envId),
        subValue: escapeSubValue(subValue),
      },
    }
  } else if (appId && envId) {
    return {
      from: '/',
      to: '/env/$envSlug/app/$appSlug',
      params: {
        appSlug: escapeAppId(appId),
        envSlug: escapeEnvId(envId),
      },
    }
  } else if (appId && subValue) {
    return {
      from: '/',
      to: '/app/$appSlug/sub/$subValue',
      params: {
        appSlug: escapeAppId(appId),
        subValue: escapeSubValue(subValue),
      },
    }
  } else if (appId) {
    return {
      from: '/',
      to: '/app/$appSlug',
      params: {
        appSlug: escapeAppId(appId),
      },
    }
  } else if (envId) {
    return {
      from: '/',
      to: '/env/$envSlug',
      params: {
        envSlug: escapeEnvId(envId),
      },
    }
  } else {
    return {
      from: '/',
      to: '/',
    }
  }
}
