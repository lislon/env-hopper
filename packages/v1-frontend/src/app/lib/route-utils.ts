import { EhEnvAppSubSelectedState } from '../types';
import { ToOptions } from '@tanstack/react-router';

export function escapeAppId(appId: string) {
  return encodeURIComponent(appId.replace(/\/home$/, '').replace('/', '@'));
}

export function escapeSubValue(subValue: string) {
  return encodeURIComponent(subValue);
}

export function escapeEnvId(envId: string) {
  return encodeURIComponent(envId);
}

export function getEhToOptions({
  appId,
  envId,
  subValue,
}: EhEnvAppSubSelectedState): ToOptions {
  if (appId && envId && subValue) {
    return {
      from: '/',
      to: '/env/$envId/app/$appId/sub/$subValue',
      params: {
        appId: escapeAppId(appId),
        envId: escapeEnvId(envId),
        subValue: escapeSubValue(subValue),
      },
    };
  } else if (appId && envId) {
    return {
      from: '/',
      to: '/env/$envId/app/$appId',
      params: {
        appId: escapeAppId(appId),
        envId: escapeEnvId(envId),
      },
    };
  } else if (appId && subValue) {
    return {
      from: '/',
      to: '/app/$appId/sub/$subValue',
      params: {
        appId: escapeAppId(appId),
        subValue: escapeSubValue(subValue),
      },
    };
  } else if (appId) {
    return {
      from: '/',
      to: '/app/$appId',
      params: {
        appId: escapeAppId(appId),
      },
    };
  } else if (envId) {
    return {
      from: '/',
      to: '/env/$envId',
      params: {
        envId: escapeEnvId(envId),
      },
    };
  } else {
    return {
      from: '/',
      to: '/',
    };
  }
}
