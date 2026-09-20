import { linkOptions } from '@tanstack/react-router'
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
